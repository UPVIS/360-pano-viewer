import { useEffect, useRef, useState, useCallback } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter'
import { MarkersPlugin, type Marker } from '@photo-sphere-viewer/markers-plugin'
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

export interface MarkerConfig {
  id: string
  position: Position3D
  html: string
  anchor?: string
  data?: MarkerData
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
            autostartDelay: null,
            autorotateSpeed: `${options.autoRotateSpeed ?? 0.5}rpm`
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

      // Position update event
      viewer.addEventListener('position-updated', ({ position }) => {
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

    markersPluginRef.current.addMarker({
      id: config.id,
      position: config.position,
      html: config.html,
      anchor: config.anchor || 'center center',
      data: config.data
    })
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

  const toggleAutorotate = useCallback(() => {
    if (autorotatePluginRef.current?.isEnabled()) {
      autorotatePluginRef.current.stop()
    } else {
      autorotatePluginRef.current?.start()
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
    // Controls
    rotate,
    setZoom,
    toggleAutorotate,
    getPosition,
    getZoomLevel,
    getCanvas
  }
}
