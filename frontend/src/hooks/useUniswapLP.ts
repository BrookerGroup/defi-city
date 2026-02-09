/**
 * useUniswapLP - Uniswap V3 LP operations (Provide LP, Collect Fees)
 * Uses NonfungiblePositionManager via Smart Wallet
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { ADDRESSES, ABIS } from '@/config/contracts'

const FEE_TIERS = [500, 3000, 10000] as const // 0.05%, 0.3%, 1%
export const MIN_TICK = -887272
export const MAX_TICK = 887272

export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]
}

/** Encode sqrtPriceX96 from token amounts (amount1 per amount0) */
function encodeSqrtRatioX96(amount1: bigint, amount0: bigint): bigint {
  const numerator = amount1 << 192n
  const ratioX192 = numerator / amount0
  return sqrtBigInt(ratioX192)
}

function sqrtBigInt(n: bigint): bigint {
  if (n < 0n) throw new Error('sqrt of negative')
  if (n < 2n) return n
  let x = n
  let y = (x + 1n) / 2n
  while (y < x) {
    x = y
    y = (n / x + x) / 2n
  }
  return x
}

export function nearestUsableTick(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing
  if (rounded < MIN_TICK) return MIN_TICK + tickSpacing
  if (rounded > MAX_TICK) return MAX_TICK - tickSpacing
  return rounded
}

/** Snap tick down to valid multiple (for tickLower) */
export function floorTick(tick: number, tickSpacing: number): number {
  const snapped = Math.floor(tick / tickSpacing) * tickSpacing
  if (snapped < MIN_TICK) return MIN_TICK + tickSpacing
  return snapped
}

/** Snap tick up to valid multiple (for tickUpper) */
export function ceilTick(tick: number, tickSpacing: number): number {
  const snapped = Math.ceil(tick / tickSpacing) * tickSpacing
  if (snapped > MAX_TICK) return MAX_TICK - tickSpacing
  return snapped
}

export const TICK_SPACING: Record<number, number> = {
  500: 10,
  3000: 60,
  10000: 200,
}

/** Convert tick to price ratio (token1/token0 in raw units). Price = 1.0001^tick */
export function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick)
}

/**
 * Get displayed price: "1 token1 = X token0" as number
 */
export function tickToPriceToken1PerToken0(tick: number, dec0: number, dec1: number): number {
  const price = tickToPrice(tick)
  return Math.pow(10, dec1 - dec0) / price
}

/**
 * Get displayed price: "1 token0 = X token1" (inverse)
 */
export function tickToPriceToken0PerToken1(tick: number, dec0: number, dec1: number): number {
  const price = tickToPrice(tick)
  return price * Math.pow(10, dec1 - dec0)
}

/**
 * Get the best display price: returns value in [0.01, 1e9] and which direction.
 * For Min/Max inputs - use the readable format.
 */
export function tickToDisplayPrice(tick: number, dec0: number, dec1: number): { value: number; token1PerToken0: boolean } {
  const token1PerToken0 = tickToPriceToken1PerToken0(tick, dec0, dec1)
  const token0PerToken1 = tickToPriceToken0PerToken1(tick, dec0, dec1)
  if (token1PerToken0 >= 0.01 && token1PerToken0 < 1e9) {
    return { value: token1PerToken0, token1PerToken0: true }
  }
  return { value: token0PerToken1, token1PerToken0: false }
}

/** Format price for input display - use enough decimals for small numbers */
export function formatPriceForInput(value: number): string {
  if (value <= 0 || !Number.isFinite(value)) return '0'
  if (value >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 0 })
  if (value >= 0.0001) return value.toFixed(4)
  if (value >= 0.000001) return value.toFixed(6)
  return value.toExponential(4)
}

/**
 * Convert displayed price (1 token1 = X token0) to tick
 */
export function priceToTick(priceToken1PerToken0: number, dec0: number, dec1: number): number {
  if (priceToken1PerToken0 <= 0) return MIN_TICK
  const rawPrice = Math.pow(10, dec1 - dec0) / priceToken1PerToken0
  return Math.floor(Math.log(rawPrice) / Math.log(1.0001))
}

/**
 * Format price for display: "1 tokenB = X tokenA"
 */
export function formatTickAsPrice(
  tick: number,
  token0: string,
  token1: string,
  dec0: number,
  dec1: number,
  symbol0: string,
  symbol1: string
): string {
  const price = tickToPrice(tick)
  const oneToken1InToken0 = Math.pow(10, dec1 - dec0) / price
  const oneToken0InToken1 = price * Math.pow(10, dec1 - dec0)
  if (oneToken1InToken0 >= 0.001 && oneToken1InToken0 < 1e9) {
    return `1 ${symbol1} = ${oneToken1InToken0.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} ${symbol0}`
  }
  if (oneToken0InToken1 >= 0.001 && oneToken0InToken1 < 1e9) {
    return `1 ${symbol0} = ${oneToken0InToken1.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} ${symbol1}`
  }
  return `Tick ${tick}`
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
  amount0?: bigint
  amount1?: bigint
  currentTick?: number
}

const Q96 = 2n ** 96n
const Q32 = 2n ** 32n
const MAX_UINT256 = 2n ** 256n - 1n

/** mulShift from Uniswap TickMath: (val * mulBy) >> 128 */
function mulShift(val: bigint, mulBy: string): bigint {
  return (val * BigInt(mulBy)) >> 128n
}

/**
 * Get sqrt(1.0001^tick) * 2^96 - ported from Uniswap v3-sdk TickMath for precision
 */
export function getSqrtRatioAtTick(tick: number): bigint {
  const absTick = tick < 0 ? -tick : tick
  let ratio =
    (absTick & 0x1) !== 0
      ? 0xfffcb933bd6fad37aa2d162d1a594001n
      : 0x100000000000000000000000000000000n
  if ((absTick & 0x2) !== 0) ratio = mulShift(ratio, '0xfff97272373d413259a46990580e213a')
  if ((absTick & 0x4) !== 0) ratio = mulShift(ratio, '0xfff2e50f5f656932ef12357cf3c7fdcc')
  if ((absTick & 0x8) !== 0) ratio = mulShift(ratio, '0xffe5caca7e10e4e61c3624eaa0941cd0')
  if ((absTick & 0x10) !== 0) ratio = mulShift(ratio, '0xffcb9843d60f6159c9db58835c926644')
  if ((absTick & 0x20) !== 0) ratio = mulShift(ratio, '0xff973b41fa98c081472e6896dfb254c0')
  if ((absTick & 0x40) !== 0) ratio = mulShift(ratio, '0xff2ea16466c96a3843ec78b326b52861')
  if ((absTick & 0x80) !== 0) ratio = mulShift(ratio, '0xfe5dee046a99a2a811c461f1969c3053')
  if ((absTick & 0x100) !== 0) ratio = mulShift(ratio, '0xfcbe86c7900a88aedcffc83b479aa3a4')
  if ((absTick & 0x200) !== 0) ratio = mulShift(ratio, '0xf987a7253ac413176f2b074cf7815e54')
  if ((absTick & 0x400) !== 0) ratio = mulShift(ratio, '0xf3392b0822b70005940c7a398e4b70f3')
  if ((absTick & 0x800) !== 0) ratio = mulShift(ratio, '0xe7159475a2c29b7443b29c7fa6e889d9')
  if ((absTick & 0x1000) !== 0) ratio = mulShift(ratio, '0xd097f3bdfd2022b8845ad8f792aa5825')
  if ((absTick & 0x2000) !== 0) ratio = mulShift(ratio, '0xa9f746462d870fdf8a65dc1f90e061e5')
  if ((absTick & 0x4000) !== 0) ratio = mulShift(ratio, '0x70d869a156d2a1b890bb3df62baf32f7')
  if ((absTick & 0x8000) !== 0) ratio = mulShift(ratio, '0x31be135f97d08fd981231505542fcfa6')
  if ((absTick & 0x10000) !== 0) ratio = mulShift(ratio, '0x9aa508b5b7a84e1c677de54f3e99bc9')
  if ((absTick & 0x20000) !== 0) ratio = mulShift(ratio, '0x5d6af8dedb81196699c329225ee604')
  if ((absTick & 0x40000) !== 0) ratio = mulShift(ratio, '0x2216e584f5fa1ea926041bedfe98')
  if ((absTick & 0x80000) !== 0) ratio = mulShift(ratio, '0x48a170391f7dc42444e8fa2')
  if (tick > 0) ratio = MAX_UINT256 / ratio
  const remainder = ratio % Q32
  return remainder > 0n ? ratio / Q32 + 1n : ratio / Q32
}

/** Uniswap V3: get amount0 and amount1 for liquidity at current price */
export function getAmountsForLiquidity(
  sqrtRatioX96: bigint,
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint
): { amount0: bigint; amount1: bigint } {
  const sa = sqrtRatioAX96 < sqrtRatioBX96 ? sqrtRatioAX96 : sqrtRatioBX96
  const sb = sqrtRatioAX96 < sqrtRatioBX96 ? sqrtRatioBX96 : sqrtRatioAX96
  if (sqrtRatioX96 <= sa) {
    return {
      amount0: getAmount0ForLiquidity(sa, sb, liquidity),
      amount1: 0n,
    }
  }
  if (sqrtRatioX96 < sb) {
    return {
      amount0: getAmount0ForLiquidity(sqrtRatioX96, sb, liquidity),
      amount1: getAmount1ForLiquidity(sa, sqrtRatioX96, liquidity),
    }
  }
  return {
    amount0: 0n,
    amount1: getAmount1ForLiquidity(sa, sb, liquidity),
  }
}

function getAmount0ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
  const num = (liquidity << 96n) * (sqrtRatioBX96 - sqrtRatioAX96)
  const denom = sqrtRatioBX96 * sqrtRatioAX96
  return num / denom
}

function getAmount1ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
  return (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / Q96
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
    const addrs = ADDRESSES
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

  const createPoolAndInitialize = useCallback(
    async (tokenA: string, tokenB: string, fee: number): Promise<{ success: boolean; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { signer, addrs } = await getContracts()
        const [t0, t1] = sortTokens(tokenA, tokenB)
        const factory = new ethers.Contract(addrs.UNISWAP_V3_FACTORY, ABIS.UNISWAP_V3_FACTORY, signer)
        await (await factory.createPool(t0, t1, fee)).wait()
        const poolAddr = await factory.getPool(t0, t1, fee)
        if (!poolAddr || poolAddr === ethers.ZeroAddress) {
          setLoading(false)
          return { success: false, error: 'Failed to get pool address' }
        }
        const pool = new ethers.Contract(poolAddr, ABIS.UNISWAP_V3_POOL, signer)
        // Initial price: ~3000 USDC per 1 WETH (token0=WETH, token1=USDC)
        const amount0 = 10n ** 18n
        const amount1 = 3000n * 10n ** 6n
        const sqrtPriceX96 = encodeSqrtRatioX96(amount1, amount0)
        const initTx = await pool.initialize(sqrtPriceX96)
        await initTx.wait()
        setLoading(false)
        return { success: true }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
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
        const nftIface = new ethers.Interface(ABIS.NONFUNGIBLE_POSITION_MANAGER as unknown as string[])

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
    createPoolAndInitialize,
    mint,
    getPositions,
    loading,
    error,
    setError,
    FEE_TIERS,
    TICK_SPACING,
  }
}
