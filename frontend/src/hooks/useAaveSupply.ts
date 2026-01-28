/**
 * useAaveSupply Hook
 * Real integration for Aave supply through BankAdapter
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS, SUPPORTED_CHAINS } from '@/config/contracts'
import { AaveAsset } from '@/types/aave'

// Asset addresses mapping
const ASSET_ADDRESSES: Record<AaveAsset, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.WETH,
  WBTC: CONTRACTS.baseSepolia.WBTC,
}

// Asset decimals mapping
const ASSET_DECIMALS: Record<AaveAsset, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
}

export function useAaveSupply() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Helper to find an empty position by checking contract
  const findEmptyPosition = useCallback(async (userAddress: string, core: any): Promise<[number, number]> => {
    const occupied = new Set<string>()
    
    try {
      // Get user buildings from contract
      const buildings = await core.getUserBuildings(userAddress)
      
      // Mark occupied positions
      if (buildings && buildings.length > 0) {
        for (const building of buildings) {
          if (building.active) {
            const x = Number(building.coordinateX)
            const y = Number(building.coordinateY)
            occupied.add(`${x},${y}`)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching buildings for position check:', error)
    }
    
    // Find first empty position (try common positions)
    const maxAttempts = 100
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Try positions in a grid pattern
      const x = Math.floor(attempt / 10) + 1
      const y = (attempt % 10) + 1
      const key = `${x},${y}`
      
      if (!occupied.has(key)) {
        // Double check with contract
        try {
          const buildingId = await core.userGridBuildings(userAddress, x, y)
          if (buildingId.toString() === '0') {
            return [x, y]
          }
        } catch (error) {
          // If check fails, use the position anyway
          return [x, y]
        }
      }
    }
    
    // Fallback: return a high position
    return [10, 10]
  }, [])

  const getContracts = async (expectedUserAddress?: string) => {
    if (!wallets || wallets.length === 0) {
      throw new Error('Wallet not connected')
    }

    // Log all available wallets for debugging
    console.log('🔍 Available wallets:', wallets.map(w => ({
      address: w.address,
      type: w.walletClientType,
      matches: expectedUserAddress ? w.address.toLowerCase() === expectedUserAddress.toLowerCase() : false
    })))
    console.log('🔍 Expected user address:', expectedUserAddress)

    // Must use the wallet that OWNS the Smart Wallet we're calling (onlyEntryPointOrOwner).
    // Do NOT fallback to another wallet — that causes OnlyEntryPointOrOwner revert.
    let wallet = expectedUserAddress
      ? wallets.find((w) => w.address.toLowerCase() === expectedUserAddress.toLowerCase())
      : null

    if (expectedUserAddress && !wallet) {
      const short = `${expectedUserAddress.slice(0, 6)}...${expectedUserAddress.slice(-4)}`
      throw new Error(
        `The wallet that owns your Smart Wallet (${short}) is not connected. ` +
        `Please connect that wallet to sign Supply transactions. ` +
        `Currently connected: ${wallets.map((w) => w.address).join(', ')}`
      )
    }

    if (!wallet) {
      wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      console.log('📌 Using wallet (no userAddress):', wallet?.address, wallet?.walletClientType)
    } else {
      console.log('✅ Using wallet matching userAddress:', wallet.address, wallet.walletClientType)
    }

    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()
    
    const signerAddress = await signer.getAddress()
    console.log('📝 Signer address:', signerAddress)

    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]

    const bankAdapter = new ethers.Contract(
      addresses.BANK_ADAPTER,
      ABIS.BANK_ADAPTER,
      signer
    )

    const buildingRegistry = new ethers.Contract(
      addresses.BUILDING_REGISTRY,
      ABIS.BUILDING_REGISTRY,
      signer
    )

    const core = new ethers.Contract(
      addresses.DEFICITY_CORE,
      ABIS.DEFICITY_CORE,
      signer
    )

    const smartWalletAbi = ABIS.SMART_WALLET
    const erc20Abi = ABIS.ERC20

    return {
      bankAdapter,
      buildingRegistry,
      core,
      signer,
      provider,
      smartWalletAbi,
      erc20Abi,
      addresses,
    }
  }

  const supply = useCallback(
    async (
      userAddress: string,
      smartWalletAddress: string,
      asset: AaveAsset,
      amount: number,
      x?: number,
      y?: number
    ) => {
        const {
          bankAdapter,
          core,
          signer,
          smartWalletAbi,
          erc20Abi,
          addresses,
        } = await getContracts()

        // Auto-find empty position if not provided
        if (x === undefined || y === undefined) {
          const [foundX, foundY] = await findEmptyPosition(userAddress, core)
          x = foundX
          y = foundY
          console.log(`Using auto-found position: (${x}, ${y})`)
        }
      setLoading(true)
      setError(null)

      try {
        const {
          bankAdapter,
          core,
          signer,
          smartWalletAbi,
          erc20Abi,
          addresses,
          provider,
        } = await getContracts(userAddress) // Pass userAddress to find matching wallet

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        const amountWei = ethers.parseUnits(amount.toString(), decimals)

        // 1. Get token contract (using provider for read-only calls)
        const token = new ethers.Contract(assetAddress, erc20Abi, provider)

        // 2. Get signer address (EOA - for signing transactions)
        const signerAddress = await signer.getAddress()
        console.log(`Signer address (EOA): ${signerAddress}`)
        console.log(`User address (EOA): ${userAddress}`)
        console.log(`Smart Wallet address: ${smartWalletAddress}`)

        // 3. Check balance at Smart Wallet (tokens should be in Smart Wallet, not EOA)
        let smartWalletBalance
        if (asset === 'ETH') {
          // For ETH, check WETH balance at Smart Wallet
          try {
            smartWalletBalance = await token.balanceOf(smartWalletAddress)
          } catch (balanceError: any) {
            console.error('Error calling balanceOf for WETH:', balanceError)
            throw new Error(
              `Failed to check WETH balance at Smart Wallet. ` +
              `Contract: ${assetAddress}. ` +
              `Smart Wallet: ${smartWalletAddress}. ` +
              `Error: ${balanceError.message || 'Unknown error'}`
            )
          }
          
          const wethBalanceFormatted = ethers.formatUnits(smartWalletBalance, decimals)
          const requiredFormatted = ethers.formatUnits(amountWei, decimals)
          
          console.log(`Smart Wallet WETH balance: ${wethBalanceFormatted} WETH`)
          console.log(`Required: ${requiredFormatted} WETH`)
          
          if (smartWalletBalance < amountWei) {
            throw new Error(
              `Insufficient WETH balance in Smart Wallet. ` +
              `Required: ${requiredFormatted} WETH, ` +
              `Available: ${wethBalanceFormatted} WETH. ` +
              `Please transfer WETH to your Smart Wallet (${smartWalletAddress}) first.`
            )
          }
          
          console.log(`✅ Smart Wallet has sufficient WETH balance: ${wethBalanceFormatted} WETH`)
        } else {
          // For other assets (USDC, USDT, etc.), check token balance at Smart Wallet
          try {
            smartWalletBalance = await token.balanceOf(smartWalletAddress)
          } catch (balanceError: any) {
            console.error('Error calling balanceOf:', balanceError)
            throw new Error(
              `Failed to check ${asset} balance at Smart Wallet. ` +
              `Contract: ${assetAddress}. ` +
              `Smart Wallet: ${smartWalletAddress}. ` +
              `Error: ${balanceError.message || 'Unknown error'}`
            )
          }
          
          const balanceFormatted = ethers.formatUnits(smartWalletBalance, decimals)
          const amountFormatted = amount.toString()
          
          console.log(`Balance check at Smart Wallet:`)
          console.log(`  Required: ${amountFormatted} ${asset} (${amountWei.toString()} wei)`)
          console.log(`  Smart Wallet has: ${balanceFormatted} ${asset} (${smartWalletBalance.toString()} wei)`)
          
          if (smartWalletBalance < amountWei) {
            const errorMsg = `Insufficient ${asset} balance in Smart Wallet. ` +
              `Required: ${amountFormatted} ${asset}, ` +
              `Available: ${balanceFormatted} ${asset}. ` +
              `Please transfer ${asset} to your Smart Wallet (${smartWalletAddress}) first.`
            throw new Error(errorMsg)
          }
          
          console.log(`✅ Smart Wallet has sufficient balance: ${balanceFormatted} ${asset}`)
        }

        // Note: No need to check/approve from EOA → Smart Wallet
        // Smart Wallet will approve Aave Pool directly in the batch transaction

        // 4. Prepare PlaceParams
        const placeParams = {
          asset: assetAddress,
          amount: amountWei,
          x: x,
          y: y,
          isBorrowMode: false,
          borrowAsset: ethers.ZeroAddress,
          borrowAmount: 0n,
        }

        // 5. Encode params
        const paramsEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
          [
            'tuple(address asset, uint256 amount, uint256 x, uint256 y, bool isBorrowMode, address borrowAsset, uint256 borrowAmount)',
          ],
          [
            [
              placeParams.asset,
              placeParams.amount,
              placeParams.x,
              placeParams.y,
              placeParams.isBorrowMode,
              placeParams.borrowAsset,
              placeParams.borrowAmount,
            ],
          ]
        )

        // 4. Get calldata from BankAdapter
        // Note: Tokens are already in Smart Wallet, no transfer needed
        // Smart Wallet will approve Aave Pool and supply in the batch transaction
        console.log('Calling BankAdapter.preparePlace...')
        const [targets, values, datas] = await bankAdapter.preparePlace(
          userAddress,
          smartWalletAddress,
          paramsEncoded
        )

        // Convert read-only arrays to regular arrays to avoid "read-only property" error
        const targetsArray = Array.from(targets) as string[]
        const valuesArray = Array.from(values) as bigint[]
        const datasArray = Array.from(datas) as string[]

        console.log('preparePlace returned:', {
          targets: targetsArray.map((t: string) => t),
          values: valuesArray.map((v: bigint) => v.toString()),
          datasCount: datasArray.length,
        })

        // 7. Execute via SmartWallet
        const smartWallet = new ethers.Contract(
          smartWalletAddress,
          smartWalletAbi,
          signer
        )

        console.log('Executing batch transaction via SmartWallet...')
        console.log('Targets:', targetsArray)
        console.log('Values:', valuesArray.map((v: bigint) => v.toString()))
        console.log('Data lengths:', datasArray.map((d: string) => d.length))
        
        // Verify Smart Wallet still has balance before executing batch (double-check)
        const finalBalance = await token.balanceOf(smartWalletAddress)
        console.log('Final Smart Wallet balance check:', ethers.formatUnits(finalBalance, decimals), asset)
        
        if (finalBalance < amountWei) {
          throw new Error(
            `Smart Wallet balance insufficient: ${ethers.formatUnits(finalBalance, decimals)} ${asset} < ${amount.toString()} ${asset}. ` +
            `Please ensure tokens are in Smart Wallet (${smartWalletAddress}) before executing.`
          )
        }
        
        // Decode calls for debugging
        console.log('Decoding batch calls for debugging...')
        try {
          const approveIface = new ethers.Interface(['function approve(address,uint256)'])
          const approveParams = approveIface.decodeFunctionData('approve', datasArray[0])
          console.log('Call 1 - Approve:', {
            token: targetsArray[0],
            spender: approveParams[0],
            amount: approveParams[1].toString(),
            amountFormatted: ethers.formatUnits(approveParams[1], decimals),
          })
        } catch (err: any) {
          console.error('Error decoding approve:', err)
        }
        
        try {
          const supplyIface = new ethers.Interface(['function supply(address,uint256,address,uint16)'])
          const supplyParams = supplyIface.decodeFunctionData('supply', datasArray[1])
          console.log('Call 2 - Supply:', {
            asset: supplyParams[0],
            amount: supplyParams[1].toString(),
            amountFormatted: ethers.formatUnits(supplyParams[1], decimals),
            onBehalfOf: supplyParams[2],
            referralCode: supplyParams[3],
          })
        } catch (err: any) {
          console.error('Error decoding supply:', err)
        }
        
        console.log('Call 3 - RecordBuildingPlacement (DefiCityCore)')
        
        // Estimate gas first
        try {
          const gasEstimate = await smartWallet.executeBatch.estimateGas(
            targetsArray,
            valuesArray,
            datasArray
          )
          console.log('Gas estimate:', gasEstimate.toString())
        } catch (estimateError: any) {
          console.error('Gas estimation failed:', estimateError)
          const data = estimateError?.data ?? estimateError?.info?.error?.data
          if (data) console.error('Error data:', data)
          const msg = estimateError?.reason ?? estimateError?.message ?? ''
          if (typeof data === 'string' && data.toLowerCase().startsWith('0x1753fe1a')) {
            throw new Error(
              'The connected wallet is not the owner of this Smart Wallet. ' +
              'Please connect the wallet that owns your Smart Wallet (the one you used to create your Town Hall) to sign Supply transactions.'
            )
          }
          throw new Error(`Transaction will fail: ${msg}`)
        }

        const executeTx = await smartWallet.executeBatch(
          targetsArray,
          valuesArray,
          datasArray,
          {
            gasLimit: 5000000, // Set higher gas limit for batch transactions
          }
        )
        console.log('Transaction sent:', executeTx.hash)

        const receipt = await executeTx.wait()
        console.log('Transaction confirmed:', receipt.hash)
        
        // Parse events to get buildingId and other details
        let buildingId: number | undefined
        let parsedAssetAddress: string | undefined
        let parsedAmount: bigint | undefined
        let parsedX: number | undefined
        let parsedY: number | undefined
        
        // Look for BuildingPlaced event in logs
        if (receipt.logs) {
          console.log('Transaction logs:', receipt.logs.length)
          
          for (const log of receipt.logs) {
            try {
              // Try to parse as DefiCityCore BuildingPlaced event
              const coreInterface = core.interface
              const parsed = coreInterface.parseLog(log)
              
              if (parsed?.name === 'BuildingPlaced') {
                buildingId = Number(parsed.args.buildingId)
                parsedAssetAddress = parsed.args.asset
                parsedAmount = parsed.args.amount
                parsedX = Number(parsed.args.x)
                parsedY = Number(parsed.args.y)
                console.log('BuildingPlaced event found:', {
                  buildingId,
                  asset: parsedAssetAddress,
                  amount: parsed.args.amount.toString(),
                  position: { x: parsedX, y: parsedY }
                })
                break
              }
            } catch (e) {
              // Not our event, skip
            }
          }
        }

        setLoading(false)
        return {
          success: true,
          txHash: receipt.hash,
          buildingId,
          asset: parsedAssetAddress,
          amount: parsedAmount ? parsedAmount.toString() : undefined,
          position: parsedX !== undefined && parsedY !== undefined ? { x: parsedX, y: parsedY } : undefined,
        }
      } catch (err: any) {
        console.error('Error in supply:', err)
        let errorMessage = err.reason || err.message || 'Failed to supply to Aave'
        const data = err?.data ?? err?.info?.error?.data

        if (typeof data === 'string' && data.toLowerCase().startsWith('0x1753fe1a')) {
          errorMessage =
            'The connected wallet is not the owner of this Smart Wallet. ' +
            'Please connect the wallet that owns your Smart Wallet (the one you used to create your Town Hall) to sign Supply transactions.'
        } else if (errorMessage.includes('user rejected')) {
          errorMessage = 'Transaction was rejected. Please try again.'
        } else if (errorMessage.includes('insufficient funds')) {
          errorMessage = 'Insufficient ETH for gas fees. Please add ETH to your wallet.'
        } else if (errorMessage.includes('Transaction will fail')) {
          errorMessage = errorMessage.replace('Transaction will fail: ', '')
        }

        setError(errorMessage)
        setLoading(false)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [wallets]
  )

  return {
    supply,
    loading,
    error,
  }
}
