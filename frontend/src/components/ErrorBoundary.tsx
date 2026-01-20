'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
          <div className="w-full max-w-md border-2 border-slate-700 rounded-lg bg-slate-800 p-6 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h1>
              <p className="text-sm text-slate-400">
                An unexpected error occurred. Please try again.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-900 rounded-md border border-slate-700">
                <p className="text-sm font-mono text-slate-300 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 border-2 border-slate-600 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 border-2 border-amber-600 bg-amber-700 text-white rounded hover:bg-amber-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
