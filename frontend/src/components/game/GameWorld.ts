/**
 * GameWorld - Camera system with pan, zoom, and keyboard controls
 * Manages a world container within the PixiJS Application.
 */

import { Application, Container } from 'pixi.js'
import { TILE_WIDTH, TILE_HEIGHT, isoToScreen } from '@/lib/isometric'
import { GRID_SIZE } from '@/lib/constants'

const MIN_SCALE = 0.3
const MAX_SCALE = 2.0
const ZOOM_SPEED = 0.1
const PAN_SPEED = 8

export class GameWorld {
  public container: Container
  private app: Application
  private isDragging = false
  private lastPointer = { x: 0, y: 0 }
  private keys = new Set<string>()

  // Callbacks
  public onPointerDownOnWorld?: (worldX: number, worldY: number, e: PointerEvent) => void
  public onPointerMoveOnWorld?: (worldX: number, worldY: number, e: PointerEvent) => void
  public onPointerUpOnWorld?: (worldX: number, worldY: number, e: PointerEvent) => void

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.container.sortableChildren = true
    app.stage.addChild(this.container)

    this.setupEvents()
    this.centerCamera()
  }

  /** Center the camera on the middle of the grid */
  centerCamera() {
    const center = isoToScreen(GRID_SIZE / 2, GRID_SIZE / 2)
    const screenW = this.app.screen.width
    const screenH = this.app.screen.height

    this.container.x = screenW / 2 - center.x * this.container.scale.x
    this.container.y = screenH / 3 - center.y * this.container.scale.y
  }

  private setupEvents() {
    const canvas = this.app.canvas as HTMLCanvasElement

    // Pointer events for pan + forwarding to interactions
    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointermove', this.handlePointerMove)
    canvas.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('pointerleave', this.handlePointerUp)

    // Wheel for zoom
    canvas.addEventListener('wheel', this.handleWheel, { passive: false })

    // Keyboard for WASD/arrow pan
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    // Tick for keyboard movement
    this.app.ticker.add(this.tick)
  }

  /** Convert screen coordinates to world coordinates */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.container.x) / this.container.scale.x,
      y: (screenY - this.container.y) / this.container.scale.y,
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    const worldPos = this.screenToWorld(e.offsetX, e.offsetY)

    // Forward to interaction handler first
    if (this.onPointerDownOnWorld) {
      this.onPointerDownOnWorld(worldPos.x, worldPos.y, e)
    }

    // Start pan drag
    this.isDragging = true
    this.lastPointer = { x: e.clientX, y: e.clientY }
  }

  private handlePointerMove = (e: PointerEvent) => {
    const worldPos = this.screenToWorld(e.offsetX, e.offsetY)

    // Forward to interaction handler
    if (this.onPointerMoveOnWorld) {
      this.onPointerMoveOnWorld(worldPos.x, worldPos.y, e)
    }

    // Pan camera
    if (this.isDragging && e.buttons === 1) {
      const dx = e.clientX - this.lastPointer.x
      const dy = e.clientY - this.lastPointer.y
      this.container.x += dx
      this.container.y += dy
      this.lastPointer = { x: e.clientX, y: e.clientY }
    }
  }

  private handlePointerUp = (e: PointerEvent) => {
    const worldPos = this.screenToWorld(e.offsetX, e.offsetY)

    if (this.onPointerUpOnWorld) {
      this.onPointerUpOnWorld(worldPos.x, worldPos.y, e)
    }

    this.isDragging = false
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const direction = e.deltaY < 0 ? 1 : -1
    const factor = 1 + direction * ZOOM_SPEED

    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
      this.container.scale.x * factor
    ))

    // Zoom toward cursor position
    const mouseX = e.offsetX
    const mouseY = e.offsetY

    const worldBefore = this.screenToWorld(mouseX, mouseY)

    this.container.scale.set(newScale)

    const worldAfter = this.screenToWorld(mouseX, mouseY)

    this.container.x += (worldAfter.x - worldBefore.x) * newScale
    this.container.y += (worldAfter.y - worldBefore.y) * newScale
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase())
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase())
  }

  private tick = () => {
    let dx = 0
    let dy = 0
    if (this.keys.has('w') || this.keys.has('arrowup')) dy += PAN_SPEED
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy -= PAN_SPEED
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx += PAN_SPEED
    if (this.keys.has('d') || this.keys.has('arrowright')) dx -= PAN_SPEED

    if (dx || dy) {
      this.container.x += dx
      this.container.y += dy
    }
  }

  /** Set zoom level programmatically */
  setZoom(scale: number) {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
    const centerX = this.app.screen.width / 2
    const centerY = this.app.screen.height / 2

    const worldBefore = this.screenToWorld(centerX, centerY)
    this.container.scale.set(clamped)
    const worldAfter = this.screenToWorld(centerX, centerY)

    this.container.x += (worldAfter.x - worldBefore.x) * clamped
    this.container.y += (worldAfter.y - worldBefore.y) * clamped
  }

  get zoom(): number {
    return this.container.scale.x
  }

  destroy() {
    const canvas = this.app.canvas as HTMLCanvasElement
    canvas.removeEventListener('pointerdown', this.handlePointerDown)
    canvas.removeEventListener('pointermove', this.handlePointerMove)
    canvas.removeEventListener('pointerup', this.handlePointerUp)
    canvas.removeEventListener('pointerleave', this.handlePointerUp)
    canvas.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.app.ticker.remove(this.tick)
  }
}
