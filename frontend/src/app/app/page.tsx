'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useMemo, useState, useEffect } from 'react'
import { useSmartWallet, useCreateSmartAccount, useVaultDeposit, useVaultWithdraw, useCityBuildings, TokenType } from '@/hooks'
import { AavePanel } from '@/components/aave'
import { CityGrid } from '@/components/game/CityGrid'

export default function AppPage() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  // Get external wallet address
  const wallet = useMemo(() => {
    return wallets.find(w => w.walletClientType !== 'privy')
  }, [wallets])

  const address = wallet?.address as `0x${string}` | undefined

  // Track if waiting too long for wallet
  const [waitingTooLong, setWaitingTooLong] = useState(false)

  // Auto-trigger wallet connection when authenticated but no address
  useEffect(() => {
    if (authenticated && !address) {
      const triggerWallet = async () => {
        try {
          const ethereum = (window as any).ethereum
          if (ethereum) {
            await ethereum.request({ method: 'eth_requestAccounts' })
          }
        } catch (err) {
          setWaitingTooLong(true)
        }
      }
      triggerWallet()
    } else {
      setWaitingTooLong(false)
    }
  }, [authenticated, address])

  // Smart Account
  const { smartWallet, loading: smartWalletLoading, hasSmartWallet, isError, error, refetch } = useSmartWallet(address)
  const { createSmartAccount, isPending: isCreating } = useCreateSmartAccount()

  // Vault Actions
  const {
    deposit: vaultDeposit,
    isDepositing,
    isConfirming: isConfirmingDeposit,
    ethBalance,
    usdcBalance,
    smartWalletEthBalance,
    smartWalletUsdcBalance,
    refetchBalances,
  } = useVaultDeposit(address, smartWallet)

  const {
    withdraw: vaultWithdraw,
    isWithdrawing: isWithdrawingFromVault,
    isConfirming: isConfirmingWithdraw,
  } = useVaultWithdraw(address, smartWallet, refetchBalances)

  // City Map & Buildings
  const { buildings, loading: buildingsLoading, refresh: refreshBuildings } = useCityBuildings(address, smartWallet)
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number } | null>(null)

  // UI State
  const [activeTab, setActiveTab] = useState<'world' | 'vault'>('world')
  const [activeVaultTab, setActiveVaultTab] = useState<'deposit' | 'withdraw'>('deposit')
  
  // Deposit form state
  const [selectedToken, setSelectedToken] = useState<TokenType>('ETH')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositError, setDepositError] = useState<string | null>(null)
  const [depositSuccess, setDepositSuccess] = useState(false)

  // Withdraw form state
  const [withdrawToken, setWithdrawToken] = useState<TokenType>('ETH')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)

  const handleCreateTownHall = async () => {
    if (!address) return
    const result = await createSmartAccount()
    if (result.success) {
      setTimeout(() => refetch(), 3000)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter a valid amount')
      return
    }
    setDepositError(null)
    setDepositSuccess(false)
    const result = await vaultDeposit(selectedToken, depositAmount)
    if (result.success) {
      setDepositSuccess(true)
      setDepositAmount('')
      setTimeout(() => {
        refetchBalances()
        refreshBuildings()
      }, 5000)
      setTimeout(() => setDepositSuccess(false), 5000)
    } else {
      setDepositError(result.error || 'Deposit failed')
    }
  }

  const handleDepositMax = () => {
    if (selectedToken === 'ETH') {
      const maxEth = Math.max(0, parseFloat(ethBalance) - 0.001)
      setDepositAmount(maxEth.toFixed(6))
    } else {
      setDepositAmount(usdcBalance)
    }
  }

  const handleWithdrawFromVault = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWithdrawError('Please enter a valid amount')
      return
    }
    setWithdrawError(null)
    setWithdrawSuccess(false)
    const result = await vaultWithdraw(withdrawToken, withdrawAmount)
    if (result.success) {
      setWithdrawSuccess(true)
      setWithdrawAmount('')
      setTimeout(() => {
        refetchBalances()
        refreshBuildings()
      }, 5000)
      setTimeout(() => setWithdrawSuccess(false), 5000)
    } else {
      setWithdrawError(result.error || 'Withdraw failed')
    }
  }

  const handleWithdrawMax = () => {
    if (withdrawToken === 'ETH') {
      setWithdrawAmount(smartWalletEthBalance)
    } else {
      setWithdrawAmount(smartWalletUsdcBalance)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-amber-400 text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>LOADING...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 relative">
        <div className="relative z-10 text-center max-w-md w-full px-4">
          <h1 className="text-amber-400 text-4xl mb-8" style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '4px 4px 0px #92400E' }}>DEFICITY</h1>
          <button onClick={login} className="relative group w-full">
            <div className="absolute inset-0 bg-amber-900 translate-x-2 translate-y-2" />
            <div className="relative px-8 py-5 bg-amber-500 border-4 border-amber-400 text-white flex items-center justify-center gap-3">
              <span className="text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>CONNECT WALLET</span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center px-4">
          <p className="text-green-400 text-sm mb-4" style={{ fontFamily: '"Press Start 2P", monospace' }}>CONNECTING...</p>
          {waitingTooLong && (
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-700 text-white text-xs">REFRESH</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b-4 border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-amber-400 text-lg" style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0px #92400E' }}>DEFICITY</h1>
          <button onClick={logout} className="relative group">
            <div className="absolute inset-0 bg-red-900 translate-x-1 translate-y-1" />
            <div className="relative px-4 py-2 bg-red-600 border-2 border-red-400 text-white text-xs transition-transform group-hover:-translate-y-0.5" style={{ fontFamily: '"Press Start 2P", monospace' }}>EXIT</div>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1 border-2 border-slate-700 max-w-fit mb-6">
          <button 
            onClick={() => setActiveTab('world')} 
            className={`px-4 py-2 text-[8px] transition-all flex items-center gap-2 ${activeTab === 'world' ? 'bg-amber-600 text-white shadow-[2px_2px_0px_#92400e]' : 'text-slate-500 hover:text-slate-300'}`}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>🌍</span> WORLD VIEW
          </button>
          <button 
            onClick={() => setActiveTab('vault')} 
            className={`px-4 py-2 text-[8px] transition-all flex items-center gap-2 ${activeTab === 'vault' ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#1e3a8a]' : 'text-slate-500 hover:text-slate-300'}`}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>🏛️</span> VAULT INFO
          </button>
        </div>

        {activeTab === 'world' ? (
          <>
            {/* City Map - Full Width */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-amber-400 text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>CITY MAP</h2>
                <div className="flex gap-4 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-700 border border-slate-600" />
                    <span className="text-slate-500">EMPTY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500/30 border border-blue-400" />
                    <span className="text-blue-400">SELECTED</span>
                  </div>
                </div>
              </div>
              <CityGrid 
                buildings={buildings}
                selectedCoords={selectedCoords}
                onSelectTile={(x, y) => setSelectedCoords({ x, y })}
                isLoading={buildingsLoading}
              />
              <div className="mt-4 p-4 bg-slate-900/50 border-2 border-slate-800 text-center">
                <p className="text-slate-400 text-[8px] leading-relaxed" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {selectedCoords ? `SELECTED: (${selectedCoords.x}, ${selectedCoords.y})` : 'SELECT AN EMPTY TILE TO BUILD'}
                </p>
              </div>
            </div>

            {/* Controls - 2 Columns Below Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Vault Controls */}
              {hasSmartWallet && smartWallet && (
                <div className="relative h-full">
                  <div className={`absolute inset-0 translate-x-2 translate-y-2 ${activeVaultTab === 'deposit' ? 'bg-blue-900' : 'bg-purple-900'}`} />
                  <div className={`relative bg-slate-800 border-4 p-6 h-full flex flex-col ${activeVaultTab === 'deposit' ? 'border-blue-500' : 'border-purple-500'}`}>
                    <div className="flex justify-between mb-6">
                      <h3 className={`text-sm ${activeVaultTab === 'deposit' ? 'text-blue-400' : 'text-purple-400'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>VAULT MGMT</h3>
                      <div className="flex bg-slate-900 p-1 border-2 border-slate-700">
                        <button onClick={() => setActiveVaultTab('deposit')} className={`px-2 py-1 text-[8px] ${activeVaultTab === 'deposit' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>DEPOSIT</button>
                        <button onClick={() => setActiveVaultTab('withdraw')} className={`px-2 py-1 text-[8px] ${activeVaultTab === 'withdraw' ? 'bg-purple-600 text-white' : 'text-slate-500'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>WITHDRAW</button>
                      </div>
                    </div>
                    {activeVaultTab === 'deposit' ? (
                      <div className="space-y-4">
                        {/* EOA Balance Display */}
                        <div className="bg-slate-900/50 border border-slate-700 p-4">
                          <p className="text-slate-500 text-[8px] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>YOUR WALLET (EOA)</p>
                          <p className="text-cyan-400 text-[7px] mb-3 truncate" style={{ fontFamily: '"Press Start 2P", monospace' }}>{address}</p>
                          <div className="flex justify-between text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                            <span className="text-green-400">ETH: {parseFloat(ethBalance).toFixed(4)}</span>
                            <span className="text-green-400">USDC: {parseFloat(usdcBalance).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {['ETH', 'USDC'].map(t => (
                            <button key={t} onClick={() => setSelectedToken(t as any)} className={`flex-1 py-3 border-2 text-[8px] ${selectedToken === t ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>{t}</button>
                          ))}
                        </div>
                        <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-900 border-2 border-slate-700 p-3 text-white text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }} />
                        <button onClick={handleDeposit} disabled={isDepositing || isConfirmingDeposit} className="w-full py-4 bg-blue-600 border-4 border-blue-400 text-white text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>DEPOSIT TO VAULT</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Smart Wallet Balance Display */}
                        <div className="bg-slate-900/50 border border-slate-700 p-4">
                          <p className="text-slate-500 text-[8px] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>VAULT (SMART WALLET)</p>
                          <p className="text-amber-400 text-[7px] mb-3 truncate" style={{ fontFamily: '"Press Start 2P", monospace' }}>{smartWallet}</p>
                          <div className="flex justify-between text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                            <span className="text-purple-400">ETH: {parseFloat(smartWalletEthBalance).toFixed(4)}</span>
                            <span className="text-purple-400">USDC: {parseFloat(smartWalletUsdcBalance).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {['ETH', 'USDC'].map(t => (
                            <button key={t} onClick={() => setWithdrawToken(t as any)} className={`flex-1 py-3 border-2 text-[8px] ${withdrawToken === t ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>{t}</button>
                          ))}
                        </div>
                        <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-900 border-2 border-slate-700 p-3 text-white text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }} />
                        <button onClick={handleWithdrawFromVault} disabled={isWithdrawingFromVault || isConfirmingWithdraw} className="w-full py-4 bg-purple-600 border-4 border-purple-400 text-white text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>WITHDRAW TO WALLET</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aave Bank */}
              <AavePanel 
                smartWallet={smartWallet ?? null} 
                hasSmartWallet={hasSmartWallet} 
                userAddress={address} 
                onSuccess={() => {
                  refetchBalances()
                  refreshBuildings()
                  setSelectedCoords(null)
                }}
                selectedCoords={selectedCoords}
              />
            </div>
          </>
        ) : (
          /* Vault Info Tab */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Welcome & Balances */}
            <div className="relative h-full">
              <div className="absolute inset-0 bg-green-900 translate-x-2 translate-y-2" />
              <div className="relative bg-slate-800 border-4 border-green-500 p-6 h-full">
                <h2 className="text-white text-lg mb-4" style={{ fontFamily: '"Press Start 2P", monospace' }}>WELCOME!</h2>
                <div className="space-y-4">
                  <div className="bg-slate-900 border-2 border-slate-700 p-4">
                    <p className="text-slate-500 text-[10px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>WALLET</p>
                    <p className="text-amber-400 text-[10px] break-all">{address}</p>
                  </div>
                  <div className="bg-slate-900 border-2 border-slate-700 p-4 border-l-green-500">
                    <p className="text-slate-500 text-[10px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>BALANCES</p>
                    <div className="flex justify-between text-[10px] text-white" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      <span>ETH: {parseFloat(ethBalance).toFixed(4)}</span>
                      <span>USDC: {parseFloat(usdcBalance).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Town Hall */}
            <div className="relative h-full">
              <div className="absolute inset-0 bg-amber-900 translate-x-2 translate-y-2" />
              <div className="relative bg-slate-800 border-4 border-amber-500 p-6 h-full">
                <h3 className="text-amber-400 text-sm mb-4" style={{ fontFamily: '"Press Start 2P", monospace' }}>TOWN HALL</h3>
                {hasSmartWallet && smartWallet ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 border-2 border-slate-700 p-4">
                      <p className="text-slate-500 text-[10px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>VAULT ADDRESS</p>
                      <p className="text-amber-400 text-[10px] break-all">{smartWallet}</p>
                    </div>
                    <div className="bg-slate-900 border-2 border-slate-700 p-4 border-l-amber-500">
                      <p className="text-slate-500 text-[10px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>VAULT BALANCES</p>
                      <div className="flex justify-between text-[10px] text-amber-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        <span>ETH: {parseFloat(smartWalletEthBalance).toFixed(4)}</span>
                        <span>USDC: {parseFloat(smartWalletUsdcBalance).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleCreateTownHall} disabled={isCreating} className="w-full py-4 bg-amber-500 border-4 border-amber-400 text-white text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {isCreating ? 'BUILDING...' : 'CREATE TOWN HALL'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-6xl mx-auto">
          {['LEVEL', 'COINS', 'LAND'].map(l => (
            <div key={l} className="bg-slate-800 border-2 border-slate-700 p-4 text-center">
              <p className="text-slate-500 text-[8px] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>{l}</p>
              <p className="text-amber-400 text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>{l === 'LEVEL' ? '01' : '0'}</p>
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        @keyframes pixelBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
