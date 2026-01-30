'use client'

/**
 * TownHallModal - Full-screen overlay for Town Hall / Smart Account creation
 * Shows when user has no smart wallet yet.
 */

interface TownHallModalProps {
  visible: boolean
  isCreating: boolean
  onCreateTownHall: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

export function TownHallModal({
  visible,
  isCreating,
  onCreateTownHall,
}: TownHallModalProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm pointer-events-auto">
      {/* Animated background sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-amber-400/60 rounded-full animate-ping"
            style={{
              left: `${10 + ((i * 37) % 80)}%`,
              top: `${10 + ((i * 53) % 80)}%`,
              animationDelay: `${(i * 0.15) % 3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Modal Content */}
      <div className="relative max-w-lg mx-4">
        {/* Shadow */}
        <div className="absolute inset-0 bg-amber-900 translate-x-4 translate-y-4" />

        {/* Main Card */}
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-amber-500 p-8">
          {/* Top Banner */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-amber-600 border-4 border-amber-400">
            <p className="text-white text-[10px]" style={pixelFont}>
              REQUIRED
            </p>
          </div>

          {/* Building Icon */}
          <div className="flex justify-center mb-6 mt-4">
            <div className="relative">
              <div className="text-8xl animate-bounce" style={{ animationDuration: '2s' }}>
                <span role="img" aria-label="town hall">&#x1F3DB;</span>
              </div>
              <div className="absolute inset-0 bg-amber-400/30 blur-2xl animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h2
            className="text-center text-amber-400 text-xl mb-4"
            style={{
              ...pixelFont,
              textShadow: '3px 3px 0px #92400E',
            }}
          >
            BUILD YOUR
            <br />
            TOWN HALL
          </h2>

          {/* Description */}
          <p className="text-center text-slate-400 text-xs leading-relaxed mb-6" style={pixelFont}>
            Every great city starts with a Town Hall! This creates your Smart Wallet vault to manage assets.
          </p>

          {/* Benefits List */}
          <div className="bg-slate-900/80 border-2 border-slate-700 p-4 mb-6">
            <p className="text-slate-500 text-[8px] mb-3" style={pixelFont}>
              UNLOCKS:
            </p>
            <div className="space-y-2">
              {[
                'AAVE Bank Building',
                'Deposit & Withdraw',
                'City Management',
                'DeFi Strategies',
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[10px] text-green-400"
                  style={pixelFont}
                >
                  <span className="text-green-500">+</span> {item}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onCreateTownHall}
            disabled={isCreating}
            className="relative w-full group"
          >
            <div className="absolute inset-0 bg-green-900 translate-x-2 translate-y-2 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
            <div
              className={`relative px-6 py-4 border-4 transition-all ${
                isCreating
                  ? 'bg-slate-700 border-slate-600'
                  : 'bg-green-600 border-green-400 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-green-500/30'
              }`}
            >
              <p className="text-white text-sm" style={pixelFont}>
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">*</span> BUILDING...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    CREATE TOWN HALL
                  </span>
                )}
              </p>
            </div>
          </button>

          {/* Cost Info */}
          <p className="text-center text-slate-600 text-[8px] mt-4" style={pixelFont}>
            * ONE-TIME GAS FEE REQUIRED
          </p>
        </div>
      </div>
    </div>
  )
}
