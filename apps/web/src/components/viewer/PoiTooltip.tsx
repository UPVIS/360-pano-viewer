import { X, ExternalLink, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PointOfInterest } from '@/stores/projectStore'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState, useCallback } from 'react'

interface ScreenPosition {
  x: number
  y: number
}

interface PoiTooltipProps {
  poi: PointOfInterest | null
  onClose: () => void
  // Function to get current screen position of the POI
  getScreenPosition?: () => ScreenPosition | null
  // Container element for bounds checking
  containerRef?: React.RefObject<HTMLElement>
}

export function PoiTooltip({ poi, onClose, getScreenPosition, containerRef }: PoiTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<ScreenPosition | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const animationFrameRef = useRef<number>()

  // Update position continuously
  const updatePosition = useCallback(() => {
    if (!poi || !getScreenPosition) return
    
    const newPos = getScreenPosition()
    if (newPos) {
      setPosition(newPos)
      setIsVisible(true)
    } else {
      // POI is behind camera, hide tooltip
      setIsVisible(false)
    }
    
    // Continue updating
    animationFrameRef.current = requestAnimationFrame(updatePosition)
  }, [poi, getScreenPosition])

  // Start/stop position tracking
  useEffect(() => {
    if (poi && getScreenPosition) {
      updatePosition()
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [poi, getScreenPosition, updatePosition])

  // Close on Escape key
  useEffect(() => {
    if (!poi) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [poi, onClose])

  if (!poi) return null

  const renderContent = () => {
    const content = poi.content

    switch (poi.icon) {
      case 'info':
        if (content?.html) {
          return (
            <div 
              className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-primary [&_a]:no-underline [&_a:hover]:underline"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          )
        }
        return (
          <p className="text-sm text-muted-foreground">
            {poi.description || 'Keine Beschreibung'}
          </p>
        )

      case 'image':
        if (content?.src) {
          return (
            <div className="space-y-2">
              <img
                src={content.src}
                alt={poi.title}
                className="w-full rounded-md max-h-[250px] object-contain bg-black/20"
              />
              {poi.description && (
                <p className="text-xs text-muted-foreground">{poi.description}</p>
              )}
            </div>
          )
        }
        return <p className="text-sm text-muted-foreground">Kein Bild vorhanden</p>

      case 'video':
        // YouTube Video
        if (content?.youtubeId) {
          return (
            <div className="space-y-2">
              <div className="aspect-video rounded-md overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${content.youtubeId}?rel=0`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              {poi.description && (
                <p className="text-xs text-muted-foreground">{poi.description}</p>
              )}
            </div>
          )
        }
        // Direct video file (mp4, webm, etc.)
        if (content?.src) {
          return (
            <div className="space-y-2">
              <div className="aspect-video rounded-md overflow-hidden bg-black">
                <video
                  src={content.src}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                >
                  <source src={content.src} />
                  Dein Browser unterstützt dieses Video-Format nicht.
                </video>
              </div>
              {poi.description && (
                <p className="text-xs text-muted-foreground">{poi.description}</p>
              )}
            </div>
          )
        }
        // Video URL (external link to video page)
        if (content?.url) {
          return (
            <div className="space-y-3">
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 px-4 bg-red-600/90 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                <Play className="w-5 h-5" />
                <span className="font-medium">Video abspielen</span>
              </a>
              {poi.description && (
                <p className="text-xs text-muted-foreground">{poi.description}</p>
              )}
            </div>
          )
        }
        return <p className="text-sm text-muted-foreground">Kein Video vorhanden</p>

      case 'link':
        if (content?.url) {
          return (
            <div className="space-y-3">
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-md transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary group-hover:underline truncate">
                    {content.label || 'Link öffnen'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {content.url}
                  </p>
                </div>
              </a>
              {poi.description && (
                <p className="text-xs text-muted-foreground">{poi.description}</p>
              )}
            </div>
          )
        }
        return <p className="text-sm text-muted-foreground">Kein Link vorhanden</p>

      default:
        return (
          <p className="text-sm text-muted-foreground">
            {poi.description || 'Keine Beschreibung'}
          </p>
        )
    }
  }

  // Calculate tooltip position (above the POI marker)
  const tooltipStyle: React.CSSProperties = position ? {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y - 20}px`, // 20px above the marker
    transform: 'translate(-50%, -100%)', // Center horizontally, position above
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? 'auto' : 'none',
    transition: 'opacity 0.15s ease',
  } : {
    position: 'absolute',
    left: '50%',
    top: '80px',
    transform: 'translateX(-50%)',
  }

  return (
    <div 
      ref={tooltipRef}
      style={tooltipStyle}
      className={cn(
        'z-50 w-[320px] max-w-[calc(100vw-2rem)]',
        'bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl',
        !position && 'animate-in slide-in-from-top-4 fade-in duration-200'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <h4 className="font-semibold text-sm truncate pr-2">{poi.title || 'Info'}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 max-h-[300px] overflow-y-auto text-sm">
        {renderContent()}
      </div>
    </div>
  )
}
