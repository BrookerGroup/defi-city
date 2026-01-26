/**
 * useAaveSupply Hook
 * Real integration for Aave supply through BankAdapter
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS, SUPPORTED_CHAINS } from '@/config/contracts'
// import { AaveAsset } from '@/types/aave'

// Asset addresses mapping
const ASSET_ADDRESSES: Record<string, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.WETH,
  WBTC: '0x0000000000000000000000000000000000000000', // Add when available
}

// Asset decimals mapping
const ASSET_DECIMALS: Record<string, number> = {
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

  const getContracts = async () => {
    if (!wallets || wallets.length === 0) {
      throw new Error('Wallet not connected')
    }

    const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()

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
      asset: any,
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
        } = await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        const amountWei = ethers.parseUnits(amount.toString(), decimals)

        // All supplies use Smart Wallet balance (user deposits to Smart Wallet first, then supplies to Aave)
        let smartWalletBalance: bigint
        let balanceFormatted: string
        const amountFormatted = amount.toString()

        const { provider } = await getContracts()

        if (asset === 'ETH') {
          // Check Smart Wallet native ETH balance
          smartWalletBalance = await provider.getBalance(smartWalletAddress)
          balanceFormatted = ethers.formatEther(smartWalletBalance)
        } else {
          // For ERC20 tokens, check Smart Wallet balance
          const tokenContract = new ethers.Contract(assetAddress, erc20Abi, signer)
          smartWalletBalance = await tokenContract.balanceOf(smartWalletAddress)
          balanceFormatted = ethers.formatUnits(smartWalletBalance, decimals)
        }

        if (smartWalletBalance < amountWei) {
          const errorMsg = `Insufficient ${asset} in Smart Vault. You have ${balanceFormatted} ${asset}, but need ${amountFormatted} ${asset}.\n\n` +
            `Please deposit more ${asset} to your Smart Vault first using the "DEPOSIT TO VAULT" section above.`
          throw new Error(errorMsg)
        }

        console.log(`Smart Wallet ${asset} balance: ${balanceFormatted}`)
        console.log(`Amount to supply: ${amountFormatted} ${asset}`)

        // Get token contract (for WETH for ETH operations, or the actual token)
        const token = new ethers.Contract(assetAddress, erc20Abi, signer)

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

        // 7. Get calldata from BankAdapter
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
        
        // Verify Smart Wallet has balance before executing batch
        const finalBalance = await token.balanceOf(smartWalletAddress)
        console.log('Final Smart Wallet balance:', ethers.formatUnits(finalBalance, decimals), asset)
        
        if (finalBalance < amountWei) {
          throw new Error(`Smart Wallet balance insufficient: ${ethers.formatUnits(finalBalance, decimals)} ${asset} < ${amount.toString()} ${asset}`)
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
          
          // Try to get more details about which call failed
          if (estimateError.data) {
            console.error('Error data:', estimateError.data)
          }
          
          throw new Error(`Transaction will fail: ${estimateError.reason || estimateError.message}`)
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
        
        // Log events
        if (receipt.logs) {
          console.log('Transaction logs:', receipt.logs.length)
        }

        setLoading(false)
        return {
          success: true,
          txHash: receipt.hash,
        }
      } catch (err: any) {
        console.error('Error in supply:', err)
        let errorMessage = err.reason || err.message || 'Failed to supply to Aave'
        
        // Format error message better
        if (errorMessage.includes('Insufficient')) {
          // Error already has helpful message
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
