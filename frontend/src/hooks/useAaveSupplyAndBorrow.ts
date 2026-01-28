/**
 * useAaveSupplyAndBorrow Hook
 * Real integration for Aave supply + borrow through BankAdapter
 * Supply collateral + borrow in a single batch transaction
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { AaveAsset } from '@/types/aave'

const ASSET_ADDRESSES: Record<AaveAsset, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.WETH,
  WBTC: CONTRACTS.baseSepolia.WBTC,
}

const ASSET_DECIMALS: Record<AaveAsset, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
}

const INTEREST_RATE_MODE_VARIABLE = 2

function roundToDecimals(value: number, decimals: number): string {
  const factor = Math.pow(10, decimals)
  const rounded = Math.floor(value * factor) / factor
  return rounded.toFixed(decimals)
}

export function useAaveSupplyAndBorrow() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const findEmptyPosition = useCallback(async (userAddress: string, core: any): Promise<[number, number]> => {
    const occupied = new Set<string>()
    try {
      const buildings = await core.getUserBuildings(userAddress)
      if (buildings?.length) {
        for (const b of buildings) {
          if (b.active) occupied.add(`${Number(b.coordinateX)},${Number(b.coordinateY)}`)
        }
      }
    } catch (e) {
      console.error('Error fetching buildings for position check:', e)
    }
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = Math.floor(attempt / 10) + 1
      const y = (attempt % 10) + 1
      if (occupied.has(`${x},${y}`)) continue
      try {
        const id = await core.userGridBuildings(userAddress, x, y)
        if (id.toString() === '0') return [x, y]
      } catch {
        return [x, y]
      }
    }
    return [10, 10]
  }, [])

  const getContracts = async (expectedUserAddress?: string) => {
    if (!wallets?.length) throw new Error('Wallet not connected')
    let wallet = expectedUserAddress
      ? wallets.find((w) => w.address.toLowerCase() === expectedUserAddress.toLowerCase())
      : null
    if (expectedUserAddress && !wallet) {
      const short = `${expectedUserAddress.slice(0, 6)}...${expectedUserAddress.slice(-4)}`
      throw new Error(
        `The wallet that owns your Smart Wallet (${short}) is not connected. ` +
        `Please connect that wallet to sign Supply + Borrow transactions.`
      )
    }
    if (!wallet) wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const provider = new ethers.BrowserProvider(await wallet.getEthereumProvider())
    const signer = await provider.getSigner()
    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]
    const bankAdapter = new ethers.Contract(addresses.BANK_ADAPTER, ABIS.BANK_ADAPTER, signer)
    const core = new ethers.Contract(addresses.DEFICITY_CORE, ABIS.DEFICITY_CORE, signer)
    const smartWalletAbi = ABIS.SMART_WALLET
    const erc20Abi = ABIS.ERC20
    return { bankAdapter, core, signer, provider, smartWalletAbi, erc20Abi, addresses }
  }

  const supplyAndBorrow = useCallback(
    async (
      userAddress: string,
      smartWalletAddress: string,
      collateralAsset: AaveAsset,
      collateralAmount: number,
      borrowAsset: AaveAsset,
      borrowAmount: number,
      x?: number,
      y?: number
    ) => {
      setLoading(true)
      setError(null)
      try {
        const { bankAdapter, core, signer, provider, smartWalletAbi, erc20Abi } = await getContracts(userAddress)
        if (x === undefined || y === undefined) {
          const [fx, fy] = await findEmptyPosition(userAddress, core)
          x = fx
          y = fy
          console.log(`Using auto-found position: (${x}, ${y})`)
        }

        const collateralAddr = ASSET_ADDRESSES[collateralAsset]
        const borrowAddr = ASSET_ADDRESSES[borrowAsset]
        const collDec = ASSET_DECIMALS[collateralAsset]
        const borrowDec = ASSET_DECIMALS[borrowAsset]

        const collRounded = roundToDecimals(collateralAmount, collDec)
        const borrowRounded = roundToDecimals(borrowAmount, borrowDec)
        const collateralWei = ethers.parseUnits(collRounded, collDec)
        const borrowWei = ethers.parseUnits(borrowRounded, borrowDec)

        const token = new ethers.Contract(collateralAddr, erc20Abi, provider)
        let balance
        if (collateralAsset === 'ETH') {
          balance = await token.balanceOf(smartWalletAddress)
          const need = ethers.formatUnits(collateralWei, collDec)
          const have = ethers.formatUnits(balance, collDec)
          if (balance < collateralWei) {
            throw new Error(
              `Insufficient WETH in Smart Wallet. Required: ${need} WETH, Available: ${have} WETH. ` +
                `Transfer WETH to Smart Wallet (${smartWalletAddress}) first.`
            )
          }
        } else {
          balance = await token.balanceOf(smartWalletAddress)
          const need = ethers.formatUnits(collateralWei, collDec)
          const have = ethers.formatUnits(balance, collDec)
          if (balance < collateralWei) {
            throw new Error(
              `Insufficient ${collateralAsset} in Smart Wallet. Required: ${need}, Available: ${have}. ` +
                `Transfer to Smart Wallet (${smartWalletAddress}) first.`
            )
          }
        }

        const paramsEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
          ['tuple(address,uint256,uint256,uint256,bool,address,uint256)'],
          [[collateralAddr, collateralWei, x, y, true, borrowAddr, borrowWei]]
        )

        const [targets, values, datas] = await bankAdapter.preparePlace(userAddress, smartWalletAddress, paramsEncoded)
        const targetsArray = Array.from(targets) as string[]
        const valuesArray = Array.from(values) as bigint[]
        const datasArray = Array.from(datas) as string[]

        const sw = new ethers.Contract(smartWalletAddress, smartWalletAbi, signer)
        try {
          const gasEst = await sw.executeBatch.estimateGas(targetsArray, valuesArray, datasArray)
          console.log('Gas estimate:', gasEst.toString())
        } catch (estErr: any) {
          const d = estErr?.data ?? estErr?.info?.error?.data
          if (typeof d === 'string' && d.toLowerCase().startsWith('0x1753fe1a')) {
            throw new Error(
              'The connected wallet is not the owner of this Smart Wallet. ' +
              'Please connect the wallet that owns your Smart Wallet (the one you used to create your Town Hall) to sign Supply + Borrow transactions.'
            )
          }
          throw estErr
        }

        const tx = await sw.executeBatch(targetsArray, valuesArray, datasArray, { gasLimit: 5000000 })
        console.log('Transaction sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('Transaction confirmed:', receipt.hash)

        setLoading(false)
        return { success: true, txHash: receipt.hash }
      } catch (err: any) {
        console.error('Error in supplyAndBorrow:', err)
        let msg = err.reason || err.message || 'Supply + Borrow failed'
        const d = err?.data ?? err?.info?.error?.data
        if (typeof d === 'string' && d.toLowerCase().startsWith('0x1753fe1a')) {
          msg =
            'The connected wallet is not the owner of this Smart Wallet. ' +
            'Please connect the wallet that owns your Smart Wallet (the one you used to create your Town Hall) to sign Supply + Borrow transactions.'
        }
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [wallets, findEmptyPosition]
  )

  return { supplyAndBorrow, loading, error }
}
