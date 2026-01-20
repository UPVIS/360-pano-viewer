import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PointOfInterest } from '@/stores/projectStore'
import { cn } from '@/lib/utils'

interface PoiTooltipProps {
  poi: PointOfInterest | null
  onClose: () => void
}

export function PoiTooltip({ poi, onClose }: PoiTooltipProps) {
  if (!poi) return null

  const renderContent = () => {
    const content = poi.content

    switch (poi.icon) {
      case 'info':
        if (content?.html) {
          return (
            <div 
              className="prose prose-sm prose-invert max-w-none"
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
            <img
              src={content.src}
              alt={poi.title}
              className="w-full rounded-md max-h-64 object-cover"
            />
          )
        }
        return <p className="text-sm text-muted-foreground">Kein Bild vorhanden</p>

      case 'video':
        if (content?.youtubeId) {
          return (
            <div className="aspect-video rounded-md overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${content.youtubeId}`}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )
        }
        return <p className="text-sm text-muted-foreground">Kein Video vorhanden</p>

      case 'link':
        if (content?.url) {
          return (
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              {content.label || content.url}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Tooltip Card */}
      <div
        className={cn(
          'relative w-full max-w-md',
          'bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">{poi.title || 'Info'}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
