'use client'

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
