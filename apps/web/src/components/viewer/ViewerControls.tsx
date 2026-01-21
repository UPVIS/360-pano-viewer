import { 
  Settings, 
  Share2, 
  Maximize, 
  Minimize,
  ZoomIn, 
  ZoomOut, 
  LayoutGrid,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { cn } from '@/lib/utils'
import { useState, useCallback } from 'react'

interface ViewerControlsProps {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onShare?: () => void
  onToggleAutorotate?: () => void
}

export function ViewerControls({
  onZoomIn,
  onZoomOut,
  onShare,
  onToggleAutorotate
}: ViewerControlsProps) {
  const { 
    isAutorotating, 
    scenesVisible, 
    settingsVisible,
    toggleScenes, 
    toggleSettings,
    toggleAutorotate
  } = useEditorStore()
  
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleAutorotate = useCallback(() => {
    toggleAutorotate()
    onToggleAutorotate?.()
  }, [toggleAutorotate, onToggleAutorotate])

  return (
    <>
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            'w-10 h-10 bg-card/80 backdrop-blur-sm border border-border',
            settingsVisible && 'bg-primary text-primary-foreground'
          )}
          onClick={toggleSettings}
          title="Einstellungen (S)"
        >
          <Settings className="w-5 h-5" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="w-10 h-10 bg-card/80 backdrop-blur-sm border border-border"
          onClick={onShare}
          title="Teilen"
        >
          <Share2 className="w-5 h-5" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="w-10 h-10 bg-card/80 backdrop-blur-sm border border-border"
          onClick={handleFullscreen}
          title="Vollbild (F)"
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Bottom Center Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10"
            onClick={onZoomOut}
            title="Herauszoomen (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-10 h-10',
              scenesVisible && 'bg-primary text-primary-foreground'
            )}
            onClick={toggleScenes}
            title="Szenen"
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-10 h-10',
              isAutorotating && 'bg-primary text-primary-foreground'
            )}
            onClick={handleAutorotate}
            title="Auto-Rotation (R)"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10"
            onClick={onZoomIn}
            title="Hineinzoomen (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  )
}
