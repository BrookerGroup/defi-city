'use client'

/**
 * GameCanvas - PixiJS Application wrapper
 * Initializes the PixiJS Application and mounts it to a container div.
 * Full-screen canvas with pixel-art rendering settings.
 */

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Application } from 'pixi.js'

export interface GameCanvasHandle {
  app: Application | null
}

interface GameCanvasProps {
  onReady?: (app: Application) => void
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)
    const initRef = useRef(false)

    useImperativeHandle(ref, () => ({
      get app() {
        return appRef.current
      },
    }))

    const init = useCallback(async () => {
      if (initRef.current || !containerRef.current) return
      initRef.current = true

      const app = new Application()

      await app.init({
        background: 0x0f172a, // slate-900
        resizeTo: containerRef.current,
        antialias: false, // pixel art
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      // Pixel-perfect rendering
      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen

      containerRef.current.appendChild(app.canvas as HTMLCanvasElement)
      appRef.current = app

      onReady?.(app)
    }, [onReady])

    useEffect(() => {
      init()

      return () => {
        if (appRef.current) {
          appRef.current.destroy(true, { children: true })
          appRef.current = null
          initRef.current = false
        }
      }
    }, [init])

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    )
  }
)
