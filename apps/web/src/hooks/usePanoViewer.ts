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

export function usePanoViewer(containerRef: React.RefObject<HTMLDivElement | null>) {
  const viewerRef = useRef<Viewer | null>(null)
  const markersPluginRef = useRef<MarkersPlugin | null>(null)
  const autorotatePluginRef = useRef<AutorotatePlugin | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initViewer = useCallback(async (options: PanoViewerOptions) => {
    if (!containerRef.current) return
    
    // Destroy existing viewer
    if (viewerRef.current) {
      viewerRef.current.destroy()
      viewerRef.current = null
    }

    setIsLoading(true)
    setError(null)

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
        adapter: [EquirectangularTilesAdapter, {
          // Tile configuration
        }],
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
      markersPluginRef.current = viewer.getPlugin(MarkersPlugin)
      autorotatePluginRef.current = viewer.getPlugin(AutorotatePlugin)

      viewer.addEventListener('ready', () => {
        setIsReady(true)
        setIsLoading(false)
        
        if (options.autoRotate) {
          autorotatePluginRef.current?.start()
        }
      })

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

  const getPosition = useCallback(() => {
    return viewerRef.current?.getPosition()
  }, [])

  const getZoomLevel = useCallback(() => {
    return viewerRef.current?.getZoomLevel()
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
    initViewer,
    destroy,
    rotate,
    setZoom,
    toggleAutorotate,
    getPosition,
    getZoomLevel
  }
}
