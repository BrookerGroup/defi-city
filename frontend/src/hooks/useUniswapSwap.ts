/**
 * useUniswapSwap - Token swap via Uniswap V3 SwapRouter02
 * Executes from Smart Wallet (vault tokens)
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

const SLIPPAGE_BPS = 1000 // 10% - Base Sepolia pool can be thin; reduces "Too little received"
const DEADLINE_SEC = 300
const DEFAULT_FEE = 3000
const FEE_TIERS = [500, 3000, 10000] as const // 0.05%, 0.3%, 1% - try in order

export type SwapToken = 'USDC' | 'USDT' | 'ETH' | 'WBTC' | 'LINK'

const TOKEN_ADDRESSES: Record<SwapToken, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.ETH,
  WBTC: CONTRACTS.baseSepolia.WBTC,
  LINK: CONTRACTS.baseSepolia.LINK,
}

export interface SwapQuote {
  amountOut: bigint
  amountOutMin: bigint
  success: boolean
  fee?: number
}

/** Extract a readable revert message from ethers/contract error */
function extractRevertMessage(err: unknown): string {
  if (err == null) return 'Swap failed'
  const e = err as { reason?: string; shortMessage?: string; message?: string; data?: string; info?: { error?: { data?: string } } }
  const reason = e.reason ?? e.shortMessage ?? e.message
  if (reason && typeof reason === 'string') {
    if (reason.includes('Too little received')) return 'Slippage: price moved. Try 10% slippage or smaller amount.'
    if (reason.includes('execution reverted')) return reason
    if (reason.includes('revert')) return reason
  }
  const data = e.data ?? e.info?.error?.data
  if (data && typeof data === 'string') {
    const hex = data.startsWith('0x') ? data : '0x' + data
    const sig = hex.slice(0, 10)
    // ExecutionFailed(string) from SmartWallet - inner call reverted with no reason
    if (sig === '0xf00364b1') {
      try {
        const payload = hex.slice(10)
        if (payload.length >= 64) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + payload)
          if (decoded[0] === 'Call failed without reason') {
            return 'Swap failed (inner call reverted). Try smaller amount, 10% slippage, or check vault balance.'
          }
          if (decoded[0]) return decoded[0] as string
        }
      } catch {
        // ignore
      }
    }
    if (sig === '0x08c379a0') {
      try {
        const payload = hex.slice(10)
        if (payload.length >= 64) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + payload)
          if (decoded[0]) return decoded[0] as string
        }
      } catch {
        // ignore decode error
      }
    }
    if (sig === '0x4e487b71') {
      try {
        const payload = hex.slice(10)
        if (payload.length >= 64) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], '0x' + payload)
          const code = Number(decoded[0])
          if (code === 1) return 'Assertion failed'
          if (code === 17) return 'Overflow'
          if (code === 18) return 'Division by zero'
        }
      } catch {
        // ignore
      }
    }
  }
  return typeof reason === 'string' ? reason : 'Swap failed'
}

export function useUniswapSwap(smartWallet: string | null) {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = useCallback(async () => {
    if (!wallets?.length || !smartWallet) {
      throw new Error('Wallet not connected')
    }
    const w = wallets.find((x) => x.walletClientType === 'privy') || wallets[0]
    const provider = new ethers.BrowserProvider(await w.getEthereumProvider())
    const signer = await provider.getSigner()
    const network = 'baseSepolia' as const
    const addrs = CONTRACTS[network]
    return { signer, addrs, provider }
  }, [wallets, smartWallet])

  const getQuote = useCallback(
    async (
      tokenIn: SwapToken,
      tokenOut: SwapToken,
      amountInRaw: bigint
    ): Promise<SwapQuote> => {
      if (amountInRaw === 0n) {
        return { amountOut: 0n, amountOutMin: 0n, success: false }
      }
      try {
        const { provider, addrs } = await getContracts()
        const quoter = new ethers.Contract(
          addrs.QUOTER_V2,
          ABIS.QUOTER_V2,
          provider
        )
        const tokenInAddr = TOKEN_ADDRESSES[tokenIn]
        const tokenOutAddr = TOKEN_ADDRESSES[tokenOut]
        let amountOut = 0n
        let usedFee = DEFAULT_FEE
        for (const fee of FEE_TIERS) {
          try {
            const params = {
              tokenIn: tokenInAddr,
              tokenOut: tokenOutAddr,
              amountIn: amountInRaw,
              fee,
              sqrtPriceLimitX96: 0,
            }
            ;[amountOut] = await quoter.quoteExactInputSingle.staticCall(params)
            usedFee = fee
            break
          } catch {
            continue
          }
        }
        if (amountOut === 0n) {
          return { amountOut: 0n, amountOutMin: 0n, success: false }
        }
        const amountOutMin =
          (amountOut * BigInt(10000 - SLIPPAGE_BPS)) / 10000n
        return { amountOut, amountOutMin, success: true, fee: usedFee }
      } catch (e) {
        console.warn('[useUniswapSwap] Quote failed:', e)
        return { amountOut: 0n, amountOutMin: 0n, success: false }
      }
    },
    [getContracts]
  )

  const swap = useCallback(
    async (
      tokenIn: SwapToken,
      tokenOut: SwapToken,
      amountInRaw: bigint,
      amountOutMin: bigint,
      fee = DEFAULT_FEE
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { signer, addrs } = await getContracts()
        const signerAddr = (await signer.getAddress()).toLowerCase()
        const swAddr = smartWallet!.toLowerCase()
        if (swAddr === signerAddr) {
          setLoading(false)
          setError(
            'Smart Wallet address is same as EOA. Swap must run from Smart Wallet. Please refresh and ensure Town Hall is created.'
          )
          return { success: false, error: 'Invalid Smart Wallet' }
        }
        const tokenInAddr = TOKEN_ADDRESSES[tokenIn]
        const tokenOutAddr = TOKEN_ADDRESSES[tokenOut]

        let targets: string[]
        let values: bigint[]
        let datas: string[]

        // Use direct encoding (no SwapAdapter) - avoids adapter encoding issues with Base Sepolia router
        {
          const router = addrs.SWAP_ROUTER_02
          const erc20 = new ethers.Interface([
            'function approve(address,uint256) returns (bool)',
          ])
          const routerIface = new ethers.Interface([...ABIS.SWAP_ROUTER_02])
          const approveData = erc20.encodeFunctionData('approve', [
            router,
            amountInRaw,
          ])
          const swapParams = {
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            fee,
            recipient: smartWallet!,
            amountIn: amountInRaw,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0,
          }
          const swapData = routerIface.encodeFunctionData('exactInputSingle', [
            swapParams,
          ])
          targets = [tokenInAddr, router]
          values = [0n, 0n]
          datas = [approveData, swapData]
        }

        const smartWalletContract = new ethers.Contract(
          smartWallet!,
          ABIS.SMART_WALLET,
          signer
        )
        // Simulate first to get revert reason if it fails
        try {
          await smartWalletContract.executeBatch.staticCall(
            targets,
            values,
            datas,
            { gasLimit: 500000 }
          )
        } catch (simErr: unknown) {
          const simMsg = extractRevertMessage(simErr)
          console.warn('[useUniswapSwap] Simulate failed:', simMsg, simErr)
          setLoading(false)
          setError(simMsg)
          return { success: false, error: simMsg }
        }
        const tx = await smartWalletContract.executeBatch(
          targets,
          values,
          datas,
          { gasLimit: 500000 }
        )
        await tx.wait()
        setLoading(false)
        return { success: true, txHash: tx.hash }
      } catch (err: unknown) {
        const msg = extractRevertMessage(err)
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts, smartWallet]
  )

  return {
    getQuote,
    swap,
    loading,
    error,
    setError,
    TOKEN_ADDRESSES,
    SLIPPAGE_BPS,
    FEE_TIERS,
    DEFAULT_FEE,
    FEE_TIER: DEFAULT_FEE, // alias for compatibility
  }
}
