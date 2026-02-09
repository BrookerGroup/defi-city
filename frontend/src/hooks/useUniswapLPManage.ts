/**
 * useUniswapLPManage - Harvest, Demolish, Increase/Decrease Liquidity for LP buildings
 * Uses BuildingRegistry for harvest/demolish; calls LP adapter directly for increase/decrease
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { ADDRESSES, ABIS } from '@/config/contracts'
import type { PositionInfo } from '@/hooks/useUniswapLP'
import { getSqrtRatioAtTick, getAmountsForLiquidity } from '@/hooks/useUniswapLP'

const MAX_U128 = 2n ** 128n - 1n

function normalizeError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (raw.includes('unknown function') || raw.includes('no matching fragment')) {
    return 'Contract not upgraded. Deploy updated LP adapter & DefiCityCore.'
  }
  return raw || fallback
}

const HARVEST_PARAMS_ABI = ['tuple(uint128 amount0Max, uint128 amount1Max)']
const DEMOLISH_PARAMS_ABI = ['tuple(uint128 liquidity, uint256 amount0Min, uint256 amount1Min)']
const INCREASE_PARAMS_ABI = [
  'tuple(uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min)',
]
const DECREASE_PARAMS_ABI = ['tuple(uint128 liquidity, uint256 amount0Min, uint256 amount1Min)']

export function useUniswapLPManage() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = useCallback(async () => {
    if (!wallets?.length) throw new Error('Wallet not connected')
    const w = wallets.find((x) => x.walletClientType === 'privy') || wallets[0]
    const provider = new ethers.BrowserProvider(await w.getEthereumProvider())
    const signer = await provider.getSigner()
    const addrs = ADDRESSES
    const registry = new ethers.Contract(
      addrs.BUILDING_REGISTRY,
      ABIS.BUILDING_REGISTRY,
      signer
    )
    const lpAdapterAddress = await registry.adapters('lp')
    const lpAdapter = new ethers.Contract(
      lpAdapterAddress,
      ABIS.LP_BUILDING_ADAPTER,
      signer
    )
    const core = new ethers.Contract(
      addrs.DEFICITY_CORE,
      ['function lpTokenIdByBuilding(uint256 buildingId) view returns (uint256)'],
      provider
    )
    const npm = new ethers.Contract(
      addrs.NONFUNGIBLE_POSITION_MANAGER,
      ABIS.NONFUNGIBLE_POSITION_MANAGER,
      provider
    )
    return { signer, provider, addrs, registry, lpAdapter, core, npm }
  }, [wallets])

  const getLPTokenId = useCallback(
    async (buildingId: number): Promise<bigint> => {
      const { core } = await getContracts()
      const tokenId = await core.lpTokenIdByBuilding(buildingId)
      return tokenId
    },
    [getContracts]
  )

  const getPositionByBuildingId = useCallback(
    async (buildingId: number): Promise<PositionInfo | null> => {
      try {
        const { core, npm, addrs, provider } = await getContracts()
        const tokenId = await core.lpTokenIdByBuilding(buildingId)
        if (tokenId === 0n) return null
        const pos = await npm.positions(tokenId)
        const base: PositionInfo = {
          tokenId,
          token0: pos.token0,
          token1: pos.token1,
          fee: Number(pos.fee),
          tickLower: Number(pos.tickLower),
          tickUpper: Number(pos.tickUpper),
          liquidity: pos.liquidity,
          tokensOwed0: pos.tokensOwed0,
          tokensOwed1: pos.tokensOwed1,
        }
        try {
          const factory = new ethers.Contract(addrs.UNISWAP_V3_FACTORY, ABIS.UNISWAP_V3_FACTORY, provider)
          const poolAddr = await factory.getPool(pos.token0, pos.token1, pos.fee)
          if (!poolAddr || poolAddr === ethers.ZeroAddress) return base
          const pool = new ethers.Contract(poolAddr, ABIS.UNISWAP_V3_POOL, provider)
          const slot0 = await pool.slot0()
          const sqrtPriceX96 = slot0.sqrtPriceX96
          const sqrtRatioAX96 = getSqrtRatioAtTick(Number(pos.tickLower))
          const sqrtRatioBX96 = getSqrtRatioAtTick(Number(pos.tickUpper))
          const { amount0, amount1 } = getAmountsForLiquidity(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            pos.liquidity
          )
          const currentTick = Number(slot0.tick)
          return { ...base, amount0, amount1, currentTick }
        } catch {
          return base
        }
      } catch {
        return null
      }
    },
    [getContracts]
  )

  const executeBatch = useCallback(
    async (
      userAddress: string,
      smartWallet: string,
      targets: string[],
      values: bigint[],
      datas: string[]
    ) => {
      const { signer } = await getContracts()
      const sw = new ethers.Contract(smartWallet, ABIS.SMART_WALLET, signer)
      const targetsArr = Array.from(targets) as string[]
      const valuesArr = Array.from(values) as bigint[]
      const datasArr = Array.from(datas) as string[]
      await sw.executeBatch.staticCall(targetsArr, valuesArr, datasArr, { gasLimit: 900000 })
      const tx = await sw.executeBatch(targetsArr, valuesArr, datasArr, { gasLimit: 900000 })
      await tx.wait()
      return tx
    },
    [getContracts]
  )

  const harvest = useCallback(
    async (
      userAddress: string,
      smartWallet: string,
      buildingId: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { registry } = await getContracts()
        const params = { amount0Max: MAX_U128, amount1Max: MAX_U128 }
        const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
          HARVEST_PARAMS_ABI,
          [params]
        )
        const [targets, values, datas] = await registry.prepareHarvest(
          'lp',
          userAddress,
          smartWallet,
          buildingId,
          encodedParams
        )
        const tx = await executeBatch(userAddress, smartWallet, targets, values, datas)
        setLoading(false)
        return { success: true, txHash: tx.hash }
      } catch (err: unknown) {
        const msg = normalizeError(err, 'Harvest failed')
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts, executeBatch]
  )

  const demolish = useCallback(
    async (
      userAddress: string,
      smartWallet: string,
      buildingId: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { registry, core, npm } = await getContracts()
        const tokenId = await core.lpTokenIdByBuilding(buildingId)
        if (tokenId === 0n) {
          setError('LP tokenId not set. Place LP first and wait for confirmation.')
          setLoading(false)
          return { success: false, error: 'LP tokenId not set' }
        }
        const position = await npm.positions(tokenId)
        const liquidity = position.liquidity
        const params = { liquidity, amount0Min: 0n, amount1Min: 0n }
        const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
          DEMOLISH_PARAMS_ABI,
          [params]
        )
        const [targets, values, datas] = await registry.prepareDemolish(
          'lp',
          userAddress,
          smartWallet,
          buildingId,
          encodedParams
        )
        const tx = await executeBatch(userAddress, smartWallet, targets, values, datas)
        setLoading(false)
        return { success: true, txHash: tx.hash }
      } catch (err: unknown) {
        const msg = normalizeError(err, 'Demolish failed')
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts, executeBatch]
  )

  const increaseLiquidity = useCallback(
    async (
      userAddress: string,
      smartWallet: string,
      buildingId: number,
      params: {
        amount0Desired: bigint
        amount1Desired: bigint
        amount0Min?: bigint
        amount1Min?: bigint
      }
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { lpAdapter } = await getContracts()
        const amount0Min = params.amount0Min ?? 0n
        const amount1Min = params.amount1Min ?? 0n
        const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(INCREASE_PARAMS_ABI, [
          {
            amount0Desired: params.amount0Desired,
            amount1Desired: params.amount1Desired,
            amount0Min,
            amount1Min,
          },
        ])
        const [targets, values, datas] = await lpAdapter.prepareIncreaseLiquidity(
          userAddress,
          smartWallet,
          buildingId,
          encodedParams
        )
        const tx = await executeBatch(userAddress, smartWallet, targets, values, datas)
        setLoading(false)
        return { success: true, txHash: tx.hash }
      } catch (err: unknown) {
        const msg = normalizeError(err, 'Increase liquidity failed')
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts, executeBatch]
  )

  const decreaseLiquidity = useCallback(
    async (
      userAddress: string,
      smartWallet: string,
      buildingId: number,
      params: { liquidity: bigint; amount0Min?: bigint; amount1Min?: bigint }
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { lpAdapter } = await getContracts()
        const amount0Min = params.amount0Min ?? 0n
        const amount1Min = params.amount1Min ?? 0n
        const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(DECREASE_PARAMS_ABI, [
          { liquidity: params.liquidity, amount0Min, amount1Min },
        ])
        const [targets, values, datas] = await lpAdapter.prepareDecreaseLiquidity(
          userAddress,
          smartWallet,
          buildingId,
          encodedParams
        )
        const tx = await executeBatch(userAddress, smartWallet, targets, values, datas)
        setLoading(false)
        return { success: true, txHash: tx.hash }
      } catch (err: unknown) {
        const msg = normalizeError(err, 'Decrease liquidity failed')
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts, executeBatch]
  )

  const linkPosition = useCallback(
    async (
      userAddress: string,
      smartWallet: string,
      buildingId: number,
      tokenId: bigint
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)
      try {
        const { signer, addrs } = await getContracts()
        const core = new ethers.Contract(addrs.DEFICITY_CORE, ABIS.DEFICITY_CORE, signer)
        const data = core.interface.encodeFunctionData('setLPTokenId', [
          userAddress,
          buildingId,
          tokenId,
        ])
        const sw = new ethers.Contract(smartWallet, ABIS.SMART_WALLET, signer)
        const tx = await sw.execute(addrs.DEFICITY_CORE, 0n, data)
        await tx.wait()
        setLoading(false)
        return { success: true, txHash: tx.hash }
      } catch (err: unknown) {
        const msg = normalizeError(err, 'Link failed. Deploy DefiCityCore with setLPTokenId.')
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts]
  )

  return {
    getLPTokenId,
    getPositionByBuildingId,
    harvest,
    demolish,
    linkPosition,
    increaseLiquidity,
    decreaseLiquidity,
    loading,
    error,
    setError,
  }
}
