import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { PoiEditor } from './PoiEditor'
import { NavEditor } from './NavEditor'
import { PanoEditor } from './PanoEditor'
import { cn } from '@/lib/utils'

export function PropertiesPanel() {
  const { mode, selectedElement, propsVisible, hidePropertiesPanel } = useEditorStore()

  // Only show in editor mode when visible
  if (mode !== 'editor' || !propsVisible) return null

  const getTitle = () => {
    switch (selectedElement?.type) {
      case 'poi':
        return 'Point of Interest'
      case 'nav':
        return 'Navigation'
      case 'panorama':
        return 'Panorama'
      default:
        return 'Eigenschaften'
    }
  }

  const renderEditor = () => {
    switch (selectedElement?.type) {
      case 'poi':
        return <PoiEditor />
      case 'nav':
        return <NavEditor />
      case 'panorama':
        return <PanoEditor />
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            Wähle ein Element zum Bearbeiten aus
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        'fixed top-1/2 right-4 -translate-y-1/2 w-80 max-h-[80vh]',
        'bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl',
        'flex flex-col z-50',
        'animate-in slide-in-from-right-4 fade-in duration-200'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold">{getTitle()}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={hidePropertiesPanel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderEditor()}
      </div>
    </div>
  )
}
