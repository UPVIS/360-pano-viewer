import { useRef, useEffect } from 'react'
import { usePanoViewer, type PanoViewerOptions } from '@/hooks/usePanoViewer'
import { Loader2 } from 'lucide-react'

interface PanoViewerProps {
  options: PanoViewerOptions
  className?: string
}

export function PanoViewer({ options, className = '' }: PanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { initViewer, isLoading, error, isReady } = usePanoViewer(containerRef)

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

      {/* Ready Indicator (for debugging) */}
      {isReady && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 px-2 py-1 rounded bg-card/80 backdrop-blur-sm text-xs text-muted-foreground">
          Viewer bereit
        </div>
      )}
    </div>
  )
}
