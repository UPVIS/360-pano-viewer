import { useEffect, useRef, useState, useCallback } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin'

// Import styles
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'

export interface PanoViewerOptions {
  tilesPath: string
  previewPath: string
  initialView?: {
    yaw: number
    pitch: number
    fov: number
  }
  autoRotate?: boolean
  autoRotateSpeed?: number
  pitchLimits?: {
    min: number // In degrees
    max: number // In degrees
  }
}

export interface TileManifest {
  width: number
  height: number
  tileSize: number
  levels: {
    width: number
    height: number
    cols: number
    rows: number
  }[]
}

export interface Position3D {
  yaw: number
  pitch: number
}

export interface MarkerData {
  type: 'poi' | 'nav'
  id: string
  [key: string]: unknown
}

export interface MarkerTooltip {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click'
}

export interface MarkerConfig {
  id: string
  position: Position3D
  html: string
  anchor?: string
  data?: MarkerData
  tooltip?: MarkerTooltip
}

export interface PanoViewerCallbacks {
  onClick?: (position: Position3D) => void
  onMarkerClick?: (markerId: string, data: MarkerData) => void
  onPositionUpdate?: (position: Position3D) => void
  onReady?: () => void
}

export function usePanoViewer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  callbacks?: PanoViewerCallbacks
) {
  const viewerRef = useRef<Viewer | null>(null)
  const markersPluginRef = useRef<MarkersPlugin | null>(null)
  const autorotatePluginRef = useRef<AutorotatePlugin | null>(null)
  const callbacksRef = useRef(callbacks)
  const pitchLimitsRef = useRef<{ min: number; max: number }>({ min: -Math.PI / 4, max: Math.PI / 4 })
  
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  const initViewer = useCallback(async (options: PanoViewerOptions) => {
    if (!containerRef.current) return
    
    // Destroy existing viewer
    if (viewerRef.current) {
      viewerRef.current.destroy()
      viewerRef.current = null
    }

    setIsLoading(true)
    setError(null)
    setIsReady(false)

    try {
      // Load manifest
      const manifestResponse = await fetch(`${options.tilesPath}manifest.json`)
      if (!manifestResponse.ok) {
        throw new Error('Failed to load tile manifest')
      }
      const manifest: TileManifest = await manifestResponse.json()

      // Use level 1 (4K) as default
      const levelIndex = Math.min(1, manifest.levels.length - 1)
      const level = manifest.levels[levelIndex]

      const viewer = new Viewer({
        container: containerRef.current,
        adapter: [EquirectangularTilesAdapter, {}],
        panorama: {
          width: level.width,
          cols: level.cols,
          rows: level.rows,
          baseUrl: options.previewPath,
          tileUrl: (col: number, row: number) => 
            `${options.tilesPath}level-${levelIndex}/row-${row}/tile-${col}.webp`
        },
        defaultYaw: options.initialView?.yaw ?? 0,
        defaultPitch: options.initialView?.pitch ?? 0,
        defaultZoomLvl: options.initialView?.fov ?? 50,
        navbar: false,
        plugins: [
          [MarkersPlugin, {}],
          [AutorotatePlugin, {
            autorotatePitch: 0,
            autostartDelay: null, // Disable auto-start completely
            autostartOnIdle: false,
            // Use slower speed for smoother rotation (0.3 rpm = 1 full rotation in ~3 minutes)
            autorotateSpeed: `${options.autoRotateSpeed ?? 0.3}rpm`
          }]
        ]
      })

      viewerRef.current = viewer
      markersPluginRef.current = viewer.getPlugin(MarkersPlugin) as MarkersPlugin
      autorotatePluginRef.current = viewer.getPlugin(AutorotatePlugin) as AutorotatePlugin

      // Ready event
      viewer.addEventListener('ready', () => {
        setIsReady(true)
        setIsLoading(false)
        
        if (options.autoRotate) {
          autorotatePluginRef.current?.start()
        }
        
        callbacksRef.current?.onReady?.()
      })

      // Click event - for placing markers
      viewer.addEventListener('click', (e) => {
        const { yaw, pitch } = e.data
        callbacksRef.current?.onClick?.({ yaw, pitch })
      })

      // Position update event with pitch clamping
      viewer.addEventListener('position-updated', ({ position }) => {
        const { min, max } = pitchLimitsRef.current
        
        // Clamp pitch if it exceeds limits
        if (position.pitch < min || position.pitch > max) {
          const clampedPitch = Math.max(min, Math.min(max, position.pitch))
          viewer.rotate({ yaw: position.yaw, pitch: clampedPitch })
        }
        
        callbacksRef.current?.onPositionUpdate?.({
          yaw: position.yaw,
          pitch: position.pitch
        })
      })

      // Marker click event
      if (markersPluginRef.current) {
        markersPluginRef.current.addEventListener('select-marker', ({ marker }) => {
          const data = marker.config.data as MarkerData
          if (data) {
            callbacksRef.current?.onMarkerClick?.(marker.id, data)
          }
        })
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }, [containerRef])

  const destroy = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.destroy()
      viewerRef.current = null
      markersPluginRef.current = null
      autorotatePluginRef.current = null
      setIsReady(false)
    }
  }, [])

  // Marker Management
  const addMarker = useCallback((config: MarkerConfig) => {
    if (!markersPluginRef.current) return

    // Remove existing marker with same ID if any
    try {
      markersPluginRef.current.removeMarker(config.id)
    } catch {
      // Ignore if marker doesn't exist
    }

    const markerOptions: Record<string, unknown> = {
      id: config.id,
      position: config.position,
      html: config.html,
      anchor: config.anchor || 'center center',
      data: config.data
    }

    // Add tooltip if provided
    if (config.tooltip) {
      markerOptions.tooltip = {
        content: config.tooltip.content,
        position: config.tooltip.position || 'top',
        trigger: config.tooltip.trigger || 'click'
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markersPluginRef.current.addMarker(markerOptions as any)
  }, [])

  const removeMarker = useCallback((markerId: string) => {
    if (!markersPluginRef.current) return
    
    try {
      markersPluginRef.current.removeMarker(markerId)
    } catch {
      // Ignore if marker doesn't exist
    }
  }, [])

  const clearMarkers = useCallback(() => {
    if (!markersPluginRef.current) return
    markersPluginRef.current.clearMarkers()
  }, [])

  // Show/hide marker tooltips (native PSV tooltips that follow the marker)
  const showMarkerTooltip = useCallback((markerId: string) => {
    if (!markersPluginRef.current) return
    try {
      markersPluginRef.current.showMarkerTooltip(markerId)
    } catch {
      // Marker might not exist
    }
  }, [])

  const hideMarkerTooltip = useCallback((markerId: string) => {
    if (!markersPluginRef.current) return
    try {
      markersPluginRef.current.hideMarkerTooltip(markerId)
    } catch {
      // Marker might not exist
    }
  }, [])

  const hideAllTooltips = useCallback(() => {
    if (!markersPluginRef.current) return
    markersPluginRef.current.hideAllTooltips()
  }, [])

  const updateMarkerPosition = useCallback((markerId: string, position: Position3D) => {
    if (!markersPluginRef.current) return
    
    try {
      const marker = markersPluginRef.current.getMarker(markerId)
      if (marker) {
        markersPluginRef.current.updateMarker({
          id: markerId,
          position
        })
      }
    } catch {
      // Ignore if marker doesn't exist
    }
  }, [])

  // Viewer Controls
  const rotate = useCallback((yaw: number, pitch: number) => {
    viewerRef.current?.rotate({ yaw, pitch })
  }, [])

  const setZoom = useCallback((level: number) => {
    viewerRef.current?.zoom(level)
  }, [])

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!viewerRef.current) return
    const current = viewerRef.current.getZoomLevel()
    viewerRef.current.zoom(Math.min(100, current + 10))
  }, [])

  const zoomOut = useCallback(() => {
    if (!viewerRef.current) return
    const current = viewerRef.current.getZoomLevel()
    viewerRef.current.zoom(Math.max(0, current - 10))
  }, [])

  // Autorotation controls
  const startAutorotate = useCallback(() => {
    autorotatePluginRef.current?.start()
  }, [])

  const stopAutorotate = useCallback(() => {
    autorotatePluginRef.current?.stop()
  }, [])

  const isAutorotating = useCallback(() => {
    return autorotatePluginRef.current?.isEnabled() ?? false
  }, [])

  const toggleAutorotate = useCallback(() => {
    if (autorotatePluginRef.current?.isEnabled()) {
      autorotatePluginRef.current.stop()
    } else {
      autorotatePluginRef.current?.start()
    }
  }, [])

  // Set pitch limits (min/max in degrees)
  const setPitchRange = useCallback((minDegrees: number, maxDegrees: number) => {
    // Convert degrees to radians and store in ref
    const minRadians = (minDegrees * Math.PI) / 180
    const maxRadians = (maxDegrees * Math.PI) / 180
    pitchLimitsRef.current = { min: minRadians, max: maxRadians }
    
    // If viewer exists and current pitch exceeds new limits, clamp it
    if (viewerRef.current) {
      const currentPos = viewerRef.current.getPosition()
      if (currentPos.pitch < minRadians || currentPos.pitch > maxRadians) {
        const clampedPitch = Math.max(minRadians, Math.min(maxRadians, currentPos.pitch))
        viewerRef.current.rotate({ yaw: currentPos.yaw, pitch: clampedPitch })
      }
    }
  }, [])

  const getPosition = useCallback((): Position3D | undefined => {
    const pos = viewerRef.current?.getPosition()
    if (pos) {
      return { yaw: pos.yaw, pitch: pos.pitch }
    }
    return undefined
  }, [])

  const getZoomLevel = useCallback(() => {
    return viewerRef.current?.getZoomLevel()
  }, [])

  // Convert 3D coordinates (yaw, pitch) to screen coordinates (x, y)
  const dataToScreenCoords = useCallback((position: Position3D): { x: number; y: number } | null => {
    if (!viewerRef.current) return null
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewer = viewerRef.current as any
      const coords = viewer.dataToViewerCoords({ yaw: position.yaw, pitch: position.pitch })
      if (coords) {
        return { x: coords.x, y: coords.y }
      }
    } catch {
      // Position might be behind camera
    }
    return null
  }, [])

  // Switch panorama without destroying viewer
  const switchPanorama = useCallback(async (
    tilesPath: string,
    previewPath: string,
    initialView?: { yaw: number; pitch: number; fov?: number }
  ) => {
    if (!viewerRef.current) return

    setIsLoading(true)

    try {
      // Load manifest for new panorama
      const manifestResponse = await fetch(`${tilesPath}manifest.json`)
      if (!manifestResponse.ok) {
        throw new Error('Failed to load tile manifest')
      }
      const manifest: TileManifest = await manifestResponse.json()

      // Use level 1 (4K) as default
      const levelIndex = Math.min(1, manifest.levels.length - 1)
      const level = manifest.levels[levelIndex]

      // Use setPanorama to switch without destroying viewer
      await viewerRef.current.setPanorama({
        width: level.width,
        cols: level.cols,
        rows: level.rows,
        baseUrl: previewPath,
        tileUrl: (col: number, row: number) => 
          `${tilesPath}level-${levelIndex}/row-${row}/tile-${col}.webp`
      })

      // Rotate to initial view if provided
      if (initialView) {
        viewerRef.current.rotate({ 
          yaw: initialView.yaw, 
          pitch: initialView.pitch 
        })
        viewerRef.current.zoom(50)
      }

      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch panorama')
      setIsLoading(false)
    }
  }, [])

  // Get canvas for screenshots
  const getCanvas = useCallback(() => {
    if (!viewerRef.current) return null
    // Access the Three.js renderer
    const renderer = (viewerRef.current as any).renderer?.renderer
    return renderer?.domElement as HTMLCanvasElement | null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy()
    }
  }, [destroy])

  return {
    viewer: viewerRef.current,
    markersPlugin: markersPluginRef.current,
    autorotatePlugin: autorotatePluginRef.current,
    isReady,
    isLoading,
    error,
    // Lifecycle
    initViewer,
    destroy,
    // Markers
    addMarker,
    removeMarker,
    clearMarkers,
    updateMarkerPosition,
    showMarkerTooltip,
    hideMarkerTooltip,
    hideAllTooltips,
    // Controls
    rotate,
    setZoom,
    zoomIn,
    zoomOut,
    setPitchRange,
    // Autorotation
    startAutorotate,
    stopAutorotate,
    isAutorotating,
    toggleAutorotate,
    // Position
    getPosition,
    getZoomLevel,
    getCanvas,
    dataToScreenCoords,
    // Scene switching
    switchPanorama
  }
}
