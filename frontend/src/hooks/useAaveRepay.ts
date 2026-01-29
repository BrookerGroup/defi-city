/**
 * useAaveRepay Hook
 * Repay Aave borrow via Smart Wallet (approve + Pool.repay)
 * Tokens must be in Smart Wallet.
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

const INTEREST_RATE_MODE_VARIABLE = 2

const ASSET_ADDRESSES: Record<string, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.ETH,
  WBTC: CONTRACTS.baseSepolia.WBTC,
  LINK: CONTRACTS.baseSepolia.LINK,
}

const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
  LINK: 18,
}

export function useAaveRepay() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = async () => {
    if (!wallets || wallets.length === 0) throw new Error('Wallet not connected')

    const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()

    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]

    return {
      signer,
      provider,
      addresses,
      smartWalletAbi: ABIS.SMART_WALLET,
      aavePoolAbi: ABIS.AAVE_POOL,
      erc20Abi: ABIS.ERC20,
    }
  }

  const repay = useCallback(
    async (
      smartWalletAddress: string,
      asset: string,
      amount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        const {
          signer,
          provider,
          addresses,
          smartWalletAbi,
          aavePoolAbi,
          erc20Abi,
        } = await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        if (!assetAddress || decimals == null) {
          setLoading(false)
          return { success: false, error: `Unsupported asset: ${asset}` }
        }

        const amountWei = ethers.parseUnits(amount.toString(), decimals)

        // Check Smart Wallet balance
        let balanceWei: bigint
        if (asset === 'ETH') {
          balanceWei = await provider.getBalance(smartWalletAddress)
        } else {
          const token = new ethers.Contract(assetAddress, erc20Abi, provider)
          balanceWei = await token.balanceOf(smartWalletAddress)
        }
        if (balanceWei < amountWei) {
          const fmt = asset === 'ETH'
            ? ethers.formatEther(balanceWei)
            : ethers.formatUnits(balanceWei, decimals)
          setLoading(false)
          return {
            success: false,
            error: `Insufficient ${asset} in Smart Wallet. You have ${fmt} ${asset}. Deposit to Smart Wallet first.`,
          }
        }

        const poolInterface = new ethers.Interface(aavePoolAbi)
        const repayData = poolInterface.encodeFunctionData('repay', [
          assetAddress,
          amountWei,
          INTEREST_RATE_MODE_VARIABLE,
          smartWalletAddress,
        ])

        const erc20Interface = new ethers.Interface(erc20Abi)
        const approveData = erc20Interface.encodeFunctionData('approve', [
          addresses.AAVE_POOL,
          amountWei,
        ])

        const targets: string[] = []
        const values: bigint[] = []
        const datas: string[] = []

        if (asset === 'ETH') {
          const wethInterface = new ethers.Interface(['function deposit()'])
          targets.push(assetAddress)
          values.push(amountWei)
          datas.push(wethInterface.encodeFunctionData('deposit'))
        }

        targets.push(assetAddress, addresses.AAVE_POOL)
        values.push(0n, 0n)
        datas.push(approveData, repayData)

        const smartWallet = new ethers.Contract(
          smartWalletAddress,
          smartWalletAbi,
          signer
        )

        const gasEstimate = await smartWallet.executeBatch.estimateGas(
          targets,
          values,
          datas
        )
        console.log('[Repay] Gas estimate:', gasEstimate.toString())

        const tx = await smartWallet.executeBatch(targets, values, datas, {
          gasLimit: gasEstimate + 50_000n,
        })

        console.log('[Repay] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Repay] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error in repay:', err)
        const errorMessage = err.reason || err.message || 'Repay failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets]
  )

  /** Repay full debt for asset (fetches current debt from Aave). */
  const repayMax = useCallback(
    async (
      smartWalletAddress: string,
      asset: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        const { provider, addresses } = await getContracts()
        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        if (!assetAddress || decimals == null) {
          setLoading(false)
          return { success: false, error: `Unsupported asset: ${asset}` }
        }

        const dataProvider = new ethers.Contract(
          addresses.AAVE_DATA_PROVIDER,
          ABIS.AAVE_DATA_PROVIDER,
          provider
        )
        const userData = await dataProvider.getUserReserveData(
          assetAddress,
          smartWalletAddress
        )
        const debtWei = (userData.currentStableDebt as bigint) + (userData.currentVariableDebt as bigint)
        if (debtWei === 0n) {
          setLoading(false)
          return { success: false, error: `No ${asset} debt to repay` }
        }

        const amount = Number(
          asset === 'ETH'
            ? ethers.formatEther(debtWei)
            : ethers.formatUnits(debtWei, decimals)
        )
        return repay(smartWalletAddress, asset, amount)
      } catch (err: any) {
        console.error('Error in repayMax:', err)
        const errorMessage = err.reason || err.message || 'Repay failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets, repay]
  )

  return {
    repay,
    repayMax,
    loading,
    error,
  }
}
