'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useMemo } from 'react'

export default function AppPage() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  // Get external wallet address (not Privy embedded wallet)
  const wallet = useMemo(() => {
    return wallets.find(w => w.walletClientType !== 'privy')
  }, [wallets])

  const address = wallet?.address

  // Loading
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Pixel Loading */}
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 bg-amber-400"
                style={{
                  animation: `pixelBounce 0.6s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <p
            className="text-amber-400 text-sm tracking-wider"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            LOADING...
          </p>
        </div>

        <style jsx>{`
          @keyframes pixelBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    )
  }

  // Not connected
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(245, 158, 11, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245, 158, 11, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-md w-full">
          {/* Logo */}
          <div className="mb-8">
            <h1
              className="text-amber-400 text-3xl md:text-4xl mb-2"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                textShadow: '4px 4px 0px #92400E',
              }}
            >
              DEFICITY
            </h1>
            <div className="flex justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-amber-400" />
              ))}
            </div>
          </div>

          {/* Subtitle */}
          <p
            className="text-slate-400 text-xs mb-8 tracking-wide"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            BUILD • EARN • PLAY
          </p>

          {/* Connect Button */}
          <button
            onClick={login}
            className="relative group w-full"
          >
            {/* Button Shadow */}
            <div
              className="absolute inset-0 bg-amber-900 translate-x-2 translate-y-2"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            />

            {/* Button */}
            <div
              className="relative px-8 py-5 bg-amber-500 border-4 border-amber-400 text-white flex items-center justify-center gap-3 transition-transform group-hover:-translate-y-1 group-active:translate-y-0"
            >
              {/* Pixel Wallet Icon */}
              <div className="grid grid-cols-4 gap-px w-6 h-5">
                <div className="bg-white col-span-4 h-1" />
                <div className="bg-white" />
                <div className="bg-transparent col-span-2" />
                <div className="bg-white" />
                <div className="bg-white col-span-4 h-1" />
                <div className="bg-white" />
                <div className="bg-white" />
                <div className="bg-white" />
                <div className="bg-white" />
              </div>

              <span
                className="text-sm"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                CONNECT
              </span>
            </div>
          </button>

          {/* Supported Wallets */}
          <div className="mt-10 flex justify-center gap-6">
            {['🦊', '🐰', '🔗'].map((emoji, i) => (
              <div
                key={i}
                className="w-12 h-12 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl hover:border-amber-500 transition-colors cursor-default"
              >
                {emoji}
              </div>
            ))}
          </div>

          {/* Footer */}
          <p
            className="mt-8 text-slate-600 text-[8px]"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            POWERED BY PRIVY
          </p>
        </div>
      </div>
    )
  }

  // Connected but no wallet address yet
  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 bg-green-400"
                style={{
                  animation: `pixelBounce 0.6s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <p
            className="text-green-400 text-sm tracking-wider"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            CONNECTING...
          </p>
        </div>

        <style jsx>{`
          @keyframes pixelBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    )
  }

  // Connected with wallet
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b-4 border-slate-700 bg-slate-900/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-amber-400 text-lg"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              textShadow: '2px 2px 0px #92400E',
            }}
          >
            DEFICITY
          </h1>

          {/* Disconnect Button */}
          <button
            onClick={logout}
            className="relative group"
          >
            <div className="absolute inset-0 bg-red-900 translate-x-1 translate-y-1" />
            <div
              className="relative px-4 py-2 bg-red-600 border-2 border-red-400 text-white text-xs flex items-center gap-2 transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              <span>EXIT</span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          {/* Welcome Box */}
          <div className="relative mb-6">
            {/* Box Shadow */}
            <div className="absolute inset-0 bg-green-900 translate-x-2 translate-y-2" />

            {/* Box */}
            <div className="relative bg-slate-800 border-4 border-green-500 p-6">
              {/* Status Bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-400 animate-pulse" />
                <span
                  className="text-green-400 text-xs"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  CONNECTED
                </span>
              </div>

              {/* Title */}
              <h2
                className="text-white text-lg mb-4"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                WELCOME!
              </h2>

              {/* Divider */}
              <div className="flex gap-1 mb-4">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-2 h-1 bg-slate-600" />
                ))}
              </div>

              {/* Address Box */}
              <div className="bg-slate-900 border-2 border-slate-700 p-4">
                <p
                  className="text-slate-500 text-[10px] mb-2"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  WALLET ADDRESS
                </p>
                <p
                  className="text-amber-400 text-[10px] break-all leading-relaxed"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {address}
                </p>
              </div>

              {/* Decorative Corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400 -translate-x-1 -translate-y-1" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400 translate-x-1 -translate-y-1" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400 -translate-x-1 translate-y-1" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400 translate-x-1 translate-y-1" />
            </div>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'LEVEL', value: '01' },
              { label: 'COINS', value: '0' },
              { label: 'LAND', value: '0' },
            ].map((stat, i) => (
              <div key={i} className="relative">
                <div className="absolute inset-0 bg-slate-950 translate-x-1 translate-y-1" />
                <div className="relative bg-slate-800 border-2 border-slate-600 p-3 text-center">
                  <p
                    className="text-slate-500 text-[8px] mb-1"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-amber-400 text-sm"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
