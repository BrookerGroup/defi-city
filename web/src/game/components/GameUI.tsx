import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Building, GameState } from '../types'
import { BUILDINGS } from '../constants'
import './GameUI.css'

interface GameUIProps {
  gameState: GameState
  selectedBuilding: Building | null
  placingType: string | null
  onStartPlacing: (type: string) => boolean
  onCancelPlacing: () => void
  onClosePanel: () => void
  onHarvest: (building: Building) => void
  onDeposit: (building: Building, amount: number) => void
  onDemolish: (building: Building) => void
  onConnectWallet: () => void
}

export function GameUI({
  gameState,
  selectedBuilding,
  placingType,
  onStartPlacing,
  onCancelPlacing,
  onClosePanel,
  onHarvest,
  onDeposit,
  onDemolish,
  onConnectWallet
}: GameUIProps) {
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)

  const showToast = (message: string, type: string = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleStartPlacing = (type: string) => {
    const success = onStartPlacing(type)
    if (!success) {
      const def = BUILDINGS[type]
      const count = gameState.buildings.filter(b => b.type === type).length
      if (count >= def.max) {
        showToast(`Max ${def.max} reached!`, 'error')
      } else if (def.minLevel && gameState.level < def.minLevel) {
        showToast(`Need LV${def.minLevel}!`, 'error')
      } else {
        showToast('Not enough resources!', 'error')
      }
    } else {
      showToast(`Click to place ${BUILDINGS[type].name}`, 'info')
    }
  }

  const handleHarvest = () => {
    if (!selectedBuilding) return
    const earned = selectedBuilding.earned || 0
    if (earned <= 0) {
      showToast('Nothing to harvest!', 'error')
      return
    }
    onHarvest(selectedBuilding)
    showToast(`+$${earned.toFixed(2)}!`, 'success')
  }

  const handleDeposit = () => {
    if (!selectedBuilding) return
    const amount = parseFloat(depositAmount) || 0
    if (amount <= 0) {
      showToast('Enter amount!', 'error')
      return
    }
    if (amount > gameState.resources.stable) {
      showToast('Not enough funds!', 'error')
      return
    }
    onDeposit(selectedBuilding, amount)
    setShowDepositModal(false)
    setDepositAmount('')
    showToast(`+$${amount.toFixed(2)} deposited!`, 'success')
  }

  const handleDemolish = () => {
    if (!selectedBuilding) return
    if (selectedBuilding.type === 'towncenter') {
      showToast('Cannot demolish HQ!', 'error')
      return
    }
    onDemolish(selectedBuilding)
    showToast('Demolished!', 'info')
  }

  const tvl = 6000 + gameState.buildings.reduce((sum, b) => sum + (b.deposited || 0), 0)
  const daily = gameState.buildings.reduce((sum, b) => {
    const def = BUILDINGS[b.type]
    return sum + (def?.apy || 0) / 100 / 365 * (b.deposited || 0)
  }, 0)

  const selectedDef = selectedBuilding ? BUILDINGS[selectedBuilding.type] : null

  return (
    <>
      {/* Back Button */}
      <Link to="/" className="back-btn">← BACK TO HOME</Link>

      {/* Top HUD */}
      <div className="top-hud">
        <div className="resource-bar">
          <div className="resource-item">
            <span className="resource-icon">💵</span>
            <span className="resource-value">{Math.floor(gameState.resources.stable)}</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">⟠</span>
            <span className="resource-value">{gameState.resources.eth.toFixed(2)}</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">💎</span>
            <span className="resource-value">{Math.floor(gameState.resources.lp)}</span>
          </div>
        </div>
        <div className="wallet-area">
          <button className="wallet-btn" onClick={onConnectWallet}>
            <span>{gameState.wallet ? `${gameState.wallet.slice(0, 6)}..` : 'CONNECT'}</span>
          </button>
          <div className="view-toggle">
            <button
              className={`view-btn ${!showPortfolio ? 'active' : ''}`}
              onClick={() => setShowPortfolio(false)}
            >
              CITY
            </button>
            <button
              className={`view-btn ${showPortfolio ? 'active' : ''}`}
              onClick={() => setShowPortfolio(true)}
            >
              PORTFOLIO
            </button>
          </div>
        </div>
      </div>

      {/* City Stats */}
      <div className="city-stats">
        <h3>[ STATUS ]</h3>
        <div className="stat-row">
          <span>TVL</span>
          <span className="stat-value">${tvl.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span>Daily</span>
          <span className="stat-value">+${daily.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span>Buildings</span>
          <span className="stat-value">{gameState.buildings.length}</span>
        </div>
        <div className="level-badge">LV {gameState.level}</div>
      </div>

      {/* Controls */}
      <div className="controls-hint">
        <kbd>WASD</kbd> Move | <kbd>CLICK</kbd> Build | <kbd>ESC</kbd> Cancel
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        {Object.entries(BUILDINGS).map(([type, def]) => {
          const count = gameState.buildings.filter(b => b.type === type).length
          const locked = def.minLevel && gameState.level < def.minLevel
          const maxed = count >= def.max
          let costText = def.cost.amount === 0 ? 'FREE' : def.cost.type === 'eth' ? `${def.cost.amount}E` : `${def.cost.amount}`

          return (
            <div
              key={type}
              className={`toolbar-item ${placingType === type ? 'selected' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => !locked && !maxed && handleStartPlacing(type)}
            >
              {count > 0 && <span className="count">{count}</span>}
              <span className="icon">{locked ? '🔒' : def.icon}</span>
              <span className="name">{def.name}</span>
              <span className="cost">{locked ? `LV${def.minLevel}` : costText}</span>
            </div>
          )
        })}
      </div>

      {/* Info Panel */}
      {selectedBuilding && selectedDef && (
        <div className="info-panel show">
          <button className="close-btn" onClick={onClosePanel}>X</button>
          <h2>{selectedDef.icon} {selectedDef.name}</h2>
          <div className="info-row">
            <span className="label">Type</span>
            <span className="value">{selectedDef.desc}</span>
          </div>
          <div className="info-row">
            <span className="label">Deposited</span>
            <span className="value">${(selectedBuilding.deposited || 0).toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="label">APY</span>
            <span className="value">{selectedDef.apy}%</span>
          </div>
          <div className="info-row">
            <span className="label">Earned</span>
            <span className="value">${(selectedBuilding.earned || 0).toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="label">Total</span>
            <span className="value">${((selectedBuilding.deposited || 0) + (selectedBuilding.earned || 0)).toFixed(2)}</span>
          </div>
          <div className="info-actions">
            <button className="info-btn primary" onClick={handleHarvest}>HARVEST</button>
            <button className="info-btn secondary" onClick={() => setShowDepositModal(true)}>+ ADD</button>
            <button className="info-btn danger" onClick={handleDemolish}>X</button>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && selectedBuilding && selectedDef && (
        <div className="modal show">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowDepositModal(false)}>X</button>
            <h2>DEPOSIT</h2>
            <div className="input-group">
              <label>Amount <span>MAX: {gameState.resources.stable.toFixed(2)}</span></label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="info-row">
              <span className="label">Deposit</span>
              <span className="value">${parseFloat(depositAmount) || 0}</span>
            </div>
            <div className="info-row">
              <span className="label">APY</span>
              <span className="value">{selectedDef.apy}%</span>
            </div>
            <div className="info-row">
              <span className="label">Daily</span>
              <span className="value">+${((parseFloat(depositAmount) || 0) * selectedDef.apy / 100 / 365).toFixed(4)}</span>
            </div>
            <button className="info-btn primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleDeposit}>
              CONFIRM
            </button>
          </div>
        </div>
      )}

      {/* Portfolio View */}
      {showPortfolio && (
        <div className="portfolio-view show">
          <div className="portfolio-header">
            <h1>PORTFOLIO</h1>
            <div className="portfolio-total">+${gameState.totalEarned.toFixed(2)} ALL TIME</div>
          </div>
          <div className="portfolio-grid">
            <div className="portfolio-card">
              <h3>POSITIONS</h3>
              <div>
                {Object.entries(
                  gameState.buildings.reduce((acc, b) => {
                    if (!acc[b.type]) acc[b.type] = { count: 0, deposited: 0, earned: 0, def: BUILDINGS[b.type] }
                    acc[b.type].count++
                    acc[b.type].deposited += b.deposited || 0
                    acc[b.type].earned += b.earned || 0
                    return acc
                  }, {} as Record<string, any>)
                ).map(([type, data]) => (
                  <div key={type} className="position-item">
                    <div className="position-info">
                      <span className="position-icon">{data.def.icon}</span>
                      <div>
                        <div className="position-name">{data.def.name} x{data.count}</div>
                        <div className="position-strategy">{data.def.strategy}</div>
                      </div>
                    </div>
                    <div className="position-apy">+{data.def.apy}% APY</div>
                  </div>
                ))}
                {gameState.buildings.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#8888aa', padding: '20px' }}>
                    Build to start earning!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div
            className="toast"
            style={{
              borderColor: toast.type === 'success' ? '#39FF14' : toast.type === 'error' ? '#FF0044' : '#00FFFF'
            }}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '!'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  )
}
