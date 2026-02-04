/**
 * useUniswapLP - Uniswap V3 LP operations (Provide LP, Collect Fees)
 * Uses NonfungiblePositionManager via Smart Wallet
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

const FEE_TIERS = [500, 3000, 10000] as const // 0.05%, 0.3%, 1%
const MIN_TICK = -887272
const MAX_TICK = 887272

export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]
}

export function nearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing
  if (rounded < MIN_TICK) return MIN_TICK + tickSpacing
  if (rounded > MAX_TICK) return MAX_TICK - tickSpacing
  return rounded
}

export const TICK_SPACING: Record<number, number> = {
  500: 10,
  3000: 60,
  10000: 200,
}

export interface PoolInfo {
  poolAddress: string
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  currentTick: number
  liquidity: bigint
  exists: boolean
}

export interface PositionInfo {
  tokenId: bigint
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: bigint
  tokensOwed0: bigint
  tokensOwed1: bigint
}

export function useUniswapLP(smartWallet: string | null) {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = useCallback(async () => {
    if (!wallets?.length || !smartWallet) throw new Error('Wallet not connected')
    const w = wallets.find((x) => x.walletClientType === 'privy') || wallets[0]
    const provider = new ethers.BrowserProvider(await w.getEthereumProvider())
    const signer = await provider.getSigner()
    const addrs = CONTRACTS.baseSepolia
    return { signer, addrs, provider }
  }, [wallets, smartWallet])

  const getPoolAddress = useCallback(
    async (tokenA: string, tokenB: string, fee: number): Promise<string> => {
      const { provider, addrs } = await getContracts()
      const factory = new ethers.Contract(
        addrs.UNISWAP_V3_FACTORY,
        ABIS.UNISWAP_V3_FACTORY,
        provider
      )
      const pool = await factory.getPool(tokenA, tokenB, fee)
      return pool
    },
    [getContracts]
  )

  const getPoolInfo = useCallback(
    async (tokenA: string, tokenB: string, fee: number): Promise<PoolInfo> => {
      const { provider, addrs } = await getContracts()
      const poolAddr = await getPoolAddress(tokenA, tokenB, fee)
      if (poolAddr === ethers.ZeroAddress) {
        return {
          poolAddress: poolAddr,
          token0: tokenA,
          token1: tokenB,
          fee,
          tickSpacing: TICK_SPACING[fee] ?? 60,
          currentTick: 0,
          liquidity: 0n,
          exists: false,
        }
      }
      const pool = new ethers.Contract(poolAddr, ABIS.UNISWAP_V3_POOL, provider)
      const [token0, token1, feeVal, tickSpacing, slot0, liquidity] = await Promise.all([
        pool.token0(),
        pool.token1(),
        pool.fee(),
        pool.tickSpacing(),
        pool.slot0(),
        pool.liquidity(),
      ])
      return {
        poolAddress: poolAddr,
        token0,
        token1,
        fee: Number(feeVal),
        tickSpacing: Number(tickSpacing),
        currentTick: Number(slot0.tick),
        liquidity,
        exists: true,
      }
    },
    [getContracts, getPoolAddress]
  )

  const mint = useCallback(
    async (
      token0: string,
      token1: string,
      fee: number,
      tickLower: number,
      tickUpper: number,
      amount0Desired: bigint,
      amount1Desired: bigint,
      amount0Min: bigint,
      amount1Min: bigint
    ): Promise<{ success: boolean; txHash?: string; tokenId?: bigint; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { signer, addrs } = await getContracts()
        const posManager = addrs.NONFUNGIBLE_POSITION_MANAGER
        const deadline = Math.floor(Date.now() / 1000) + 600

        const erc20 = new ethers.Interface(['function approve(address,uint256) returns (bool)'])
        const nftIface = new ethers.Interface(ABIS.NONFUNGIBLE_POSITION_MANAGER as string[])

        const approve0 = erc20.encodeFunctionData('approve', [posManager, amount0Desired])
        const approve1 = erc20.encodeFunctionData('approve', [posManager, amount1Desired])

        const mintParams = {
          token0,
          token1,
          fee,
          tickLower,
          tickUpper,
          amount0Desired,
          amount1Desired,
          amount0Min,
          amount1Min,
          recipient: smartWallet!,
          deadline,
        }
        const mintData = nftIface.encodeFunctionData('mint', [mintParams])

        const targets = [token0, token1, posManager]
        const values = [0n, 0n, 0n]
        const datas = [approve0, approve1, mintData]

        const sw = new ethers.Contract(smartWallet!, ABIS.SMART_WALLET, signer)
        const tx = await sw.executeBatch(targets, values, datas, { gasLimit: 800000 })
        const receipt = await tx.wait()

        // Parse Mint event for tokenId
        const mintTopic = ethers.id('Mint(address,address,address,int24,int24,uint256,uint256,uint256,uint256)')
        let tokenId: bigint | undefined
        for (const log of receipt.logs) {
          if (log.topics[0] === mintTopic) {
            tokenId = BigInt(log.topics[1])
            break
          }
        }

        setLoading(false)
        return { success: true, txHash: tx.hash, tokenId }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Mint failed'
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts, smartWallet]
  )

  const getPositions = useCallback(async (): Promise<PositionInfo[]> => {
    if (!smartWallet) return []
    try {
      const { provider, addrs } = await getContracts()
      const nft = new ethers.Contract(
        addrs.NONFUNGIBLE_POSITION_MANAGER,
        ABIS.NONFUNGIBLE_POSITION_MANAGER,
        provider
      )
      const balance = await nft.balanceOf(smartWallet)
      if (balance === 0n) return []

      const positions: PositionInfo[] = []
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await nft.tokenOfOwnerByIndex(smartWallet, i)
        const pos = await nft.positions(tokenId)
        positions.push({
          tokenId,
          token0: pos.token0,
          token1: pos.token1,
          fee: Number(pos.fee),
          tickLower: Number(pos.tickLower),
          tickUpper: Number(pos.tickUpper),
          liquidity: pos.liquidity,
          tokensOwed0: pos.tokensOwed0,
          tokensOwed1: pos.tokensOwed1,
        })
      }
      return positions
    } catch {
      return []
    }
  }, [getContracts, smartWallet])

  return {
    getPoolAddress,
    getPoolInfo,
    mint,
    getPositions,
    loading,
    error,
    setError,
    FEE_TIERS,
    TICK_SPACING,
  }
}
