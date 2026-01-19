'use client'

import { LandingPage } from '@/components/landing'

type View = 'dashboard' | 'map' | 'buildings' | 'settings'

export default function Home() {
  return <LandingPage />
}
