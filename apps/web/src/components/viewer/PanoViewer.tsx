import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { usePanoViewer, type PanoViewerOptions, type PanoViewerCallbacks, type Position3D, type MarkerConfig } from '@/hooks/usePanoViewer'
import { Loader2 } from 'lucide-react'

// Import marker styles
import './markers.css'

export interface PanoViewerHandle {
  addMarker: (config: MarkerConfig) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
  updateMarkerPosition: (id: string, position: Position3D) => void
  getPosition: () => Position3D | undefined
  rotate: (yaw: number, pitch: number) => void
}

interface PanoViewerProps {
  options: PanoViewerOptions
  className?: string
  callbacks?: PanoViewerCallbacks
}

export const PanoViewer = forwardRef<PanoViewerHandle, PanoViewerProps>(
  function PanoViewer({ options, className = '', callbacks }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { 
      initViewer, 
      isLoading, 
      error, 
      isReady,
      addMarker,
      removeMarker,
      clearMarkers,
      updateMarkerPosition,
      getPosition,
      rotate
    } = usePanoViewer(containerRef, callbacks)

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addMarker,
      removeMarker,
      clearMarkers,
      updateMarkerPosition,
      getPosition,
      rotate
    }), [addMarker, removeMarker, clearMarkers, updateMarkerPosition, getPosition, rotate])

    useEffect(() => {
      initViewer(options)
    }, [options, initViewer])

    return (
      <div className={`relative w-full h-full ${className}`}>
        {/* Viewer Container */}
        <div 
          ref={containerRef} 
          className="w-full h-full"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Panorama wird geladen...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
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
