import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { usePanoViewer, type PanoViewerOptions, type PanoViewerCallbacks, type Position3D, type MarkerConfig } from '@/hooks/usePanoViewer'
import { cn } from '@/lib/utils'

// Import marker styles
import './markers.css'

export interface PanoViewerHandle {
  addMarker: (config: MarkerConfig) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
  updateMarkerPosition: (id: string, position: Position3D) => void
  showMarkerTooltip: (markerId: string) => void
  hideMarkerTooltip: (markerId: string) => void
  hideAllTooltips: () => void
  getPosition: () => Position3D | undefined
  getZoomLevel: () => number | undefined
  rotate: (yaw: number, pitch: number) => void
  zoomIn: () => void
  zoomOut: () => void
  setPitchRange: (minDegrees: number, maxDegrees: number) => void
  startAutorotate: () => void
  stopAutorotate: () => void
  isAutorotating: () => boolean
  switchPanorama: (tilesPath: string, previewPath: string, initialView?: { yaw: number; pitch: number; fov?: number }) => Promise<void>
  dataToScreenCoords: (position: Position3D) => { x: number; y: number } | null
}

interface PanoViewerProps {
  options: PanoViewerOptions
  className?: string
  callbacks?: PanoViewerCallbacks
}

export const PanoViewer = forwardRef<PanoViewerHandle, PanoViewerProps>(
  function PanoViewer({ options, className = '', callbacks }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const optionsRef = useRef(options)
    const initializedRef = useRef(false)
    
    const { 
      initViewer, 
      isLoading, 
      error, 
      isReady,
      addMarker,
      removeMarker,
      clearMarkers,
      updateMarkerPosition,
      showMarkerTooltip,
      hideMarkerTooltip,
      hideAllTooltips,
      getPosition,
      getZoomLevel,
      rotate,
      zoomIn,
      zoomOut,
      setPitchRange,
      startAutorotate,
      stopAutorotate,
      isAutorotating,
      switchPanorama,
      dataToScreenCoords
    } = usePanoViewer(containerRef, callbacks)

    // Keep options ref updated
    optionsRef.current = options

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addMarker,
      removeMarker,
      clearMarkers,
      updateMarkerPosition,
      showMarkerTooltip,
      hideMarkerTooltip,
      hideAllTooltips,
      getPosition,
      getZoomLevel,
      rotate,
      zoomIn,
      zoomOut,
      setPitchRange,
      startAutorotate,
      stopAutorotate,
      isAutorotating,
      switchPanorama,
      dataToScreenCoords
    }), [addMarker, removeMarker, clearMarkers, updateMarkerPosition, showMarkerTooltip, hideMarkerTooltip, hideAllTooltips, getPosition, getZoomLevel, rotate, zoomIn, zoomOut, setPitchRange, startAutorotate, stopAutorotate, isAutorotating, switchPanorama, dataToScreenCoords])

    // Initialize viewer only once, or when tilesPath changes
    useEffect(() => {
      if (!initializedRef.current || optionsRef.current.tilesPath !== options.tilesPath) {
        initializedRef.current = true
        initViewer(options)
      }
    }, [options.tilesPath, initViewer, options])

    return (
      <div className={`relative w-full h-full ${className}`}>
        {/* Viewer Container */}
        <div 
          ref={containerRef} 
          className="w-full h-full"
        />

        {/* Loading Overlay with Blur-up Effect */}
        {isLoading && (
          <div className={cn(
            'absolute inset-0 z-50 transition-opacity duration-500',
            isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}>
            {/* Blurred Preview Background */}
            <img 
              src={options.previewPath} 
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Loading Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm font-medium">Panorama wird geladen...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 z-50">
            <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border border-destructive/50">
              <p className="text-destructive font-medium">Fehler beim Laden</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </div>
    )
  }
)
