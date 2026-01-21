import { Info, Navigation, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { cn } from '@/lib/utils'

export function EditorToolbar() {
  const { mode, placementMode, setPlacementMode, cancelPlacement } = useEditorStore()

  // Only show in editor mode
  if (mode !== 'editor') return null

  const handleToolClick = (tool: 'poi' | 'nav' | null) => {
    if (placementMode === tool) {
      cancelPlacement()
    } else {
      setPlacementMode(tool)
    }
  }

  return (
    <>
      {/* Toolbar - fixed position and size */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 px-2 py-1.5 bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-lg">
          {/* Selection Tool */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-9 w-9',
              placementMode === null && 'bg-primary text-primary-foreground'
            )}
            onClick={() => handleToolClick(null)}
            title="Auswahl-Werkzeug (ESC)"
          >
            <MousePointer className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* POI Tool */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-9 w-9',
              placementMode === 'poi' && 'bg-primary text-primary-foreground'
            )}
            onClick={() => handleToolClick('poi')}
            title="POI hinzufügen (P)"
          >
            <Info className="h-4 w-4" />
          </Button>

          {/* Navigation Tool */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-9 w-9',
              placementMode === 'nav' && 'bg-primary text-primary-foreground'
            )}
            onClick={() => handleToolClick('nav')}
            title="Navigation hinzufügen (N)"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Placement Mode Hint - separate from toolbar to not affect its width */}
      {placementMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
          <div className="px-3 py-1.5 bg-card/90 backdrop-blur-md border border-border rounded-md text-sm whitespace-nowrap">
            <span className="text-muted-foreground">
              Klicke auf das Panorama, um {placementMode === 'poi' ? 'einen POI' : 'einen Navigationspfeil'} zu platzieren
            </span>
          </div>
        </div>
      )}
    </>
  )
}
