'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface ErrorInfo {
  title: string
  message: string
  suggestion?: string
}

interface ErrorPopupProps {
  error: string | null
  onClose: () => void
}

const ERROR_MAP: { pattern: RegExp; info: ErrorInfo }[] = [
  {
    pattern: /insufficient liquidity/i,
    info: {
      title: 'LIQUIDITY ERROR',
      message: 'The pool has been heavily borrowed. Withdrawals are unavailable right now.',
      suggestion: 'Wait for borrowers to repay and try again later.',
    },
  },
  {
    pattern: /OVERFLOW|Panic|overflow/i,
    info: {
      title: 'TRANSACTION FAILED',
      message: 'The transaction failed. Please try again.',
    },
  },
  {
    pattern: /No balance to withdraw/i,
    info: {
      title: 'NO BALANCE',
      message: 'You have no balance to withdraw.',
    },
  },
  {
    pattern: /user rejected|User denied|ACTION_REJECTED/i,
    info: {
      title: 'CANCELLED',
      message: 'You cancelled the transaction.',
    },
  },
  {
    pattern: /Insufficient .+ in Smart Vault/i,
    info: {
      title: 'LOW VAULT BALANCE',
      message: 'Not enough funds in your Smart Vault.',
      suggestion: 'Deposit more to your vault using the "DEPOSIT TO VAULT" section above.',
    },
  },
  {
    pattern: /insufficient funds for gas|insufficient funds/i,
    info: {
      title: 'NOT ENOUGH GAS',
      message: 'Not enough ETH to pay for gas fees.',
      suggestion: 'Add more ETH to your wallet first.',
    },
  },
  {
    pattern: /Round has ended|purchasing is currently disabled|Wait for next round/i,
    info: {
      title: 'ROUND ENDED',
      message: 'This round has ended. Please wait for the next round to start.',
      suggestion: 'The timer will reset when a new round begins.',
    },
  },
  {
    pattern: /pool cap|reached maximum capacity/i,
    info: {
      title: 'POOL FULL',
      message: 'The LP pool has reached its maximum capacity.',
      suggestion: 'Wait for other LPs to withdraw or for the cap to increase.',
    },
  },
  {
    pattern: /Insufficient MPUSDC|Insufficient MUSDC/i,
    info: {
      title: 'LOW MUSDC BALANCE',
      message: 'Not enough MUSDC in your Smart Wallet.',
      suggestion: 'Deposit more USDC to the Megapot vault first.',
    },
  },
  {
    pattern: /Minimum deposit/i,
    info: {
      title: 'BELOW MINIMUM',
      message: 'Your deposit amount is below the minimum required.',
      suggestion: 'The minimum deposit is 250 USDC.',
    },
  },
  {
    pattern: /not ready|wait for.*jackpot/i,
    info: {
      title: 'NOT READY YET',
      message: 'Withdrawal is not ready yet.',
      suggestion: 'Wait for the next jackpot drawing to complete your withdrawal.',
    },
  },
  {
    pattern: /No LP position|no position/i,
    info: {
      title: 'NO POSITION',
      message: 'No LP position found for this wallet.',
      suggestion: 'Deposit MUSDC first to create an LP position.',
    },
  },
  {
    pattern: /already pending/i,
    info: {
      title: 'ALREADY PENDING',
      message: 'A withdrawal is already pending for this position.',
      suggestion: 'Wait for the next jackpot, then complete your withdrawal.',
    },
  },
]

const DEFAULT_ERROR: ErrorInfo = {
  title: 'ERROR',
  message: 'Something went wrong. Please try again.',
}

function mapError(raw: string): ErrorInfo {
  for (const { pattern, info } of ERROR_MAP) {
    if (pattern.test(raw)) return info
  }
  return DEFAULT_ERROR
}

const font = { fontFamily: '"Press Start 2P", monospace' } as const

export function ErrorPopup({ error, onClose }: ErrorPopupProps) {
  const info = error ? mapError(error) : null

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            className="relative w-[340px] max-w-[90vw]"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.15 }}
          >
            {/* Shadow */}
            <div className="absolute inset-0 bg-red-900 translate-x-2 translate-y-2" />

            {/* Box */}
            <div className="relative bg-slate-800 border-4 border-red-500 p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-2 right-3 text-slate-500 hover:text-white text-xs"
                style={font}
              >
                X
              </button>

              {/* Icon + Title */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <h3
                  className="text-red-400 text-xs"
                  style={font}
                >
                  {info.title}
                </h3>
              </div>

              {/* Divider */}
              <div className="flex gap-1 mb-4">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-2 h-1 bg-red-900" />
                ))}
              </div>

              {/* Message */}
              <p
                className="text-slate-300 text-[9px] leading-relaxed mb-3"
                style={font}
              >
                {info.message}
              </p>

              {/* Suggestion */}
              {info.suggestion && (
                <p
                  className="text-yellow-400 text-[8px] leading-relaxed mb-4"
                  style={font}
                >
                  TIP: {info.suggestion}
                </p>
              )}

              {/* OK Button */}
              <button
                onClick={onClose}
                className="relative group w-full"
              >
                <div className="absolute inset-0 bg-red-900 translate-x-1 translate-y-1" />
                <div
                  className="relative px-4 py-3 bg-red-600 border-2 border-red-400 text-white text-[10px] text-center transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0"
                  style={font}
                >
                  OK
                </div>
              </button>

              {/* Decorative Corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-red-400 -translate-x-1 -translate-y-1" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-red-400 translate-x-1 -translate-y-1" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-red-400 -translate-x-1 translate-y-1" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-red-400 translate-x-1 translate-y-1" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
