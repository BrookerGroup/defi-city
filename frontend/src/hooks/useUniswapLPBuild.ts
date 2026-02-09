import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { ADDRESSES, ABIS } from '@/config/contracts'
import { GRID_SIZE } from '@/lib/constants'

function extractRevertMessage(err: unknown): string {
  if (err == null) return 'LP placement failed'
  const e = err as {
    reason?: string
    shortMessage?: string
    message?: string
    data?: string
    info?: { error?: { data?: string } }
    error?: { data?: string }
  }
  const reason = e.reason ?? e.shortMessage ?? e.message ?? ''
  if (reason && typeof reason === 'string') {
    if (reason.includes('unknown function') || reason.includes('no matching fragment')) return 'Contract missing function. Upgrade DefiCityCore & LP adapter.'
    if (reason.includes('insufficient') || reason.includes('balance')) return 'Insufficient vault balance. Deposit tokens first.'
    if (reason.includes('Price slippage check') || reason.includes('slippage')) return 'Slippage: pool price moved. Try smaller amount.'
    if (reason.includes('unknown custom error')) {
      // Try to decode from data before falling back
      const data = e.data ?? e.info?.error?.data ?? e.error?.data
      if (data && typeof data === 'string') {
        const decoded = tryDecodeRevertData(data)
        if (decoded) return decoded
      }
      return 'LP failed. Try: 1) REFRESH BALANCES 2) 0.3% fee tier 3) smaller amounts (10 USDC, 0.001 WETH) 4) wider range (±10%)'
    }
    if (reason.includes('execution reverted')) return reason
  }
  const data =
    e.data ??
    e.info?.error?.data ??
    e.error?.data ??
    (err as { cause?: { data?: string } }).cause?.data
  if (data && typeof data === 'string') {
    const decoded = tryDecodeRevertData(data)
    if (decoded) return decoded
  }
  // Parse hex from message e.g. "unknown custom error (0x...)"
  const msg = typeof reason === 'string' ? reason : ''
  const hexMatch = msg.match(/0x[a-fA-F0-9]{8,}/)
  if (hexMatch) {
    const decoded = tryDecodeRevertData(hexMatch[0])
    if (decoded) return decoded
  }
  return typeof reason === 'string' ? reason : 'LP placement failed'
}

function tryDecodeRevertData(data: string): string | null {
  try {
    const hex = data.startsWith('0x') ? data : '0x' + data
    if (hex.length < 10) return null
    const sig = hex.slice(0, 10)
    const payload = '0x' + hex.slice(10)
    if (sig === '0xf00364b1') {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], payload)
      if (decoded[0] === 'Call failed without reason') return 'LP failed. Try: 1) REFRESH BALANCES 2) smaller amounts (e.g. 10 USDC + 0.001 WETH) 3) 0.3% fee tier 4) different tile.'
      if (decoded[0]) return decoded[0] as string
    }
    if (sig === '0x08c379a0') {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], payload)
      if (decoded[0]) return decoded[0] as string
    }
    if (sig === '0x4e487b71') {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], payload)
      const code = Number(decoded[0])
      if (code === 1) return 'Assertion failed'
      if (code === 17) return 'Overflow'
      if (code === 18) return 'Division by zero'
    }
    if (sig === '0x324b3e7f') {
      return 'Invalid tick range: tickLower/tickUpper must be multiples of tickSpacing (0.3%=60, 1%=200). Try different range % or refresh pool.'
    }
  } catch { /* ignore */ }
  return null
}

const PARAMS_ABI = [
  'tuple(address tokenA,address tokenB,uint24 fee,int24 tickLower,int24 tickUpper,uint256 amountA,uint256 amountB,uint256 amount0Min,uint256 amount1Min,uint256 x,uint256 y)',
]

export function useUniswapLPBuild() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = useCallback(async () => {
    if (!wallets?.length) throw new Error('Wallet not connected')
    const w = wallets.find((x) => x.walletClientType === 'privy') || wallets[0]
    const provider = new ethers.BrowserProvider(await w.getEthereumProvider())
    const signer = await provider.getSigner()
    const addrs = ADDRESSES
    const buildingRegistry = new ethers.Contract(
      addrs.BUILDING_REGISTRY,
      ABIS.BUILDING_REGISTRY,
      signer
    )
    return { signer, buildingRegistry }
  }, [wallets])

  const placeLPBuilding = useCallback(
    async (
      userAddress: string,
      smartWallet: string,
      params: {
        tokenA: string
        tokenB: string
        fee: number
        tickLower: number
        tickUpper: number
        amountA: bigint
        amountB: bigint
        amount0Min: bigint
        amount1Min: bigint
        x: number
        y: number
      }
    ) => {
      setLoading(true)
      setError(null)
      try {
        const { signer, buildingRegistry } = await getContracts()
        const provider = signer.provider
        if (provider) {
          const erc20Abi = ['function balanceOf(address) view returns (uint256)']
          const [balA, balB] = await Promise.all([
            new ethers.Contract(params.tokenA, erc20Abi, provider).balanceOf(smartWallet),
            new ethers.Contract(params.tokenB, erc20Abi, provider).balanceOf(smartWallet),
          ])
          if (params.amountA > balA || params.amountB > balB) {
            setError('Insufficient vault balance. Refresh balances or reduce amount.')
            setLoading(false)
            return { success: false, error: 'Insufficient vault balance' }
          }

          const core = new ethers.Contract(
            ADDRESSES.DEFICITY_CORE,
            ['function userGridBuildings(address,uint256,uint256) view returns (uint256)'],
            provider
          )
          let px = params.x
          let py = params.y
          const initialOccupied = await core.userGridBuildings(userAddress, px, py)
          if (initialOccupied !== 0n) {
            let found = false
            const maxCoord = GRID_SIZE || 13
            // Search high coords first (edges) - less likely occupied than center
            outer: for (let a = maxCoord; a >= 1; a--) {
              for (let b = maxCoord; b >= 1; b--) {
                const occ = await core.userGridBuildings(userAddress, a, b)
                if (occ === 0n) {
                  px = a
                  py = b
                  found = true
                  break outer
                }
              }
            }
            if (!found) {
              setError('No empty tile found. Try demolishing a building first.')
              setLoading(false)
              return { success: false, error: 'No empty tile' }
            }
          }
          params = { ...params, x: px, y: py }
        }

        // Snap ticks to valid multiples of tickSpacing (avoids 0x324b3e7f)
        // Use canonical Uniswap V3 mapping: 500->10, 3000->60, 10000->200
        const TICK_SPACING: Record<number, number> = { 500: 10, 3000: 60, 10000: 200 }
        const tickSpacing = TICK_SPACING[params.fee] ?? 60
        const snapFloor = (t: number) => {
          const s = Math.floor(t / tickSpacing) * tickSpacing
          return s < -887272 ? -887272 + tickSpacing : s
        }
        const snapCeil = (t: number) => {
          const s = Math.ceil(t / tickSpacing) * tickSpacing
          return s > 887272 ? 887272 - tickSpacing : s
        }
        let tl = snapFloor(params.tickLower)
        let tu = snapCeil(params.tickUpper)
        if (tu <= tl) tu = tl + tickSpacing
        params = { ...params, tickLower: tl, tickUpper: tu }

        // amount0Min/amount1Min: 0 = accept any (thin pools may use partial amounts)
        const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(PARAMS_ABI, [params])

        const [targets, values, datas] = await buildingRegistry.preparePlace(
          'lp',
          userAddress,
          smartWallet,
          encodedParams
        )

        // ethers returns frozen arrays; copy to avoid "Cannot assign to read only property"
        const targetsArr = Array.from(targets)
        const valuesArr = Array.from(values)
        const datasArr = Array.from(datas)

        const sw = new ethers.Contract(smartWallet, ABIS.SMART_WALLET, signer)
        const gasLimit = 1_500_000
        try {
          await sw.executeBatch.staticCall(targetsArr, valuesArr, datasArr, { gasLimit })
        } catch ( simErr: unknown ) {
          console.error('[LP Build] Simulation failed:', simErr)
          const simMsg = extractRevertMessage(simErr)
          setError(simMsg)
          setLoading(false)
          return { success: false, error: simMsg }
        }
        const tx = await sw.executeBatch(targetsArr, valuesArr, datasArr, { gasLimit })
        const receipt = await tx.wait()
        if (receipt?.logs) {
          const addrs = ADDRESSES
          const coreIface = new ethers.Interface([
            'event BuildingPlaced(uint256 indexed buildingId, address indexed user, address indexed smartWallet, string buildingType, address asset, uint256 amount, uint256 x, uint256 y)',
          ])
          const transferSig = ethers.id('Transfer(address,address,uint256)')
          let buildingId: bigint | null = null
          let tokenId: bigint | null = null
          for (const log of receipt.logs) {
            if (log.address.toLowerCase() === addrs.DEFICITY_CORE.toLowerCase() && log.topics[0] === coreIface.getEvent('BuildingPlaced')?.topicHash) {
              buildingId = BigInt(log.topics[1])
            }
            if (log.address.toLowerCase() === addrs.NONFUNGIBLE_POSITION_MANAGER.toLowerCase() && log.topics[0] === transferSig && log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000') {
              tokenId = BigInt(log.topics[3])
            }
          }
          if (buildingId != null && tokenId != null) {
            const core = new ethers.Contract(addrs.DEFICITY_CORE, ABIS.DEFICITY_CORE, signer)
            const data = core.interface.encodeFunctionData('setLPTokenId', [userAddress, buildingId, tokenId])
            try {
              const setTx = await sw.execute(addrs.DEFICITY_CORE, 0n, data)
              await setTx.wait()
            } catch (e) {
              console.warn('setLPTokenId failed (building may still work):', e)
            }
          }
        }
        setLoading(false)
        return { success: true, txHash: tx.hash }
      } catch (err: unknown) {
        console.error('[LP Build] Error:', err)
        const msg = extractRevertMessage(err)
        setError(msg)
        setLoading(false)
        return { success: false, error: msg }
      }
    },
    [getContracts]
  )

  return { placeLPBuilding, loading, error, setError }
}
