'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Loader2 } from 'lucide-react'
import { PixelBackground } from './pixel'
import {
  HeroSection,
  ConceptSection,
  StrategiesSection,
  FeaturesSection,
  CTASection,
  FooterSection
} from './sections'

export function LandingPage() {
  const { ready } = usePrivy()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <span
            className="text-amber-400 text-sm"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Loading...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background */}
      <PixelBackground />

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
        <ConceptSection />
        <StrategiesSection />
        <FeaturesSection />
        <CTASection />
        <FooterSection />
      </div>
    </div>
  )
}
