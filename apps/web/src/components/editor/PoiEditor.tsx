import { useEffect, useState, lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore, type PointOfInterest, type PoiContent } from '@/stores/projectStore'

// Lazy load RichTextEditor since Quill is heavy
const RichTextEditor = lazy(() => import('./RichTextEditor').then(m => ({ default: m.RichTextEditor })))

const iconOptions = [
  { value: 'info', label: 'Info' },
  { value: 'image', label: 'Bild' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Link' }
] as const

export function PoiEditor() {
  const { selectedElement, hidePropertiesPanel, setDraggingMarker } = useEditorStore()
  const { currentSceneId, updatePoi, deletePoi, getCurrentPanorama } = useProjectStore()

  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<PointOfInterest['icon']>('info')
  const [content, setContent] = useState<PoiContent>({ type: 'info', html: '' })

  // Load POI data when selection changes
  useEffect(() => {
    if (selectedElement?.type !== 'poi') return

    const pano = getCurrentPanorama()
    const poi = pano?.pois.find(p => p.id === selectedElement.id)
    
    if (poi) {
      setTitle(poi.title || '')
      setIcon(poi.icon || 'info')
      setContent(poi.content || { type: 'info', html: '' })
    }
  }, [selectedElement, getCurrentPanorama])

  const handleSave = () => {
    if (!selectedElement || !currentSceneId) return

    const newContent: PoiContent = { ...content, type: icon }
    
    updatePoi(currentSceneId, selectedElement.id, {
      title,
      icon,
      content: newContent
    })

    hidePropertiesPanel()
  }

  const handleDelete = () => {
    if (!selectedElement || !currentSceneId) return
    
    if (confirm('POI wirklich löschen?')) {
      deletePoi(currentSceneId, selectedElement.id)
      hidePropertiesPanel()
    }
  }

  const handleMove = () => {
    setDraggingMarker(true)
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="poi-title">Titel</Label>
        <Input
          id="poi-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="POI-Titel"
        />
      </div>

      {/* Icon/Type */}
      <div className="space-y-2">
        <Label htmlFor="poi-icon">Typ</Label>
        <select
          id="poi-icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value as PointOfInterest['icon'])}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          {iconOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Content based on type - WYSIWYG Editor for Info */}
      {icon === 'info' && (
        <div className="space-y-2">
          <Label>Inhalt</Label>
          <Suspense fallback={
            <div className="w-full h-32 rounded-md border border-input bg-background flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Editor wird geladen...</span>
            </div>
          }>
            <RichTextEditor
              value={content.html || ''}
              onChange={(html) => setContent({ ...content, html })}
              placeholder="Beschreibung eingeben..."
            />
          </Suspense>
        </div>
      )}

      {icon === 'image' && (
        <div className="space-y-2">
          <Label htmlFor="poi-image">Bild-URL</Label>
          <Input
            id="poi-image"
            value={content.src || ''}
            onChange={(e) => setContent({ ...content, src: e.target.value })}
            placeholder="https://..."
          />
          {content.src && (
            <img
              src={content.src}
              alt="Preview"
              className="w-full h-32 object-cover rounded-md"
            />
          )}
        </div>
      )}

      {icon === 'video' && (
        <div className="space-y-2">
          <Label htmlFor="poi-video">YouTube-URL</Label>
          <Input
            id="poi-video"
            value={content.url || ''}
            onChange={(e) => {
              const url = e.target.value
              const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
              setContent({ 
                ...content, 
                url, 
                youtubeId: match ? match[1] : undefined 
              })
            }}
            placeholder="https://youtube.com/watch?v=..."
          />
          {content.youtubeId && (
            <div className="aspect-video rounded-md overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${content.youtubeId}`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {icon === 'link' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poi-link-url">Link-URL</Label>
            <Input
              id="poi-link-url"
              value={content.url || ''}
              onChange={(e) => setContent({ ...content, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poi-link-label">Link-Text</Label>
            <Input
              id="poi-link-label"
              value={content.label || ''}
              onChange={(e) => setContent({ ...content, label: e.target.value })}
              placeholder="Mehr erfahren"
            />
          </div>
        </div>
      )}

      {/* Position hint */}
      <div className="text-xs text-muted-foreground">
        Klicke auf den POI im Panorama und dann auf eine neue Stelle, um ihn zu verschieben.
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} className="flex-1">
          Speichern
        </Button>
        <Button variant="destructive" onClick={handleDelete} className="flex-1">
          Löschen
        </Button>
      </div>
    </div>
  )
}
