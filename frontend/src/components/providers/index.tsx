'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F172A',
            color: '#F59E0B',
            border: '2px solid #CA8A04',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            borderRadius: '0',
          },
        }}
      />
    </ErrorBoundary>
  )
}
