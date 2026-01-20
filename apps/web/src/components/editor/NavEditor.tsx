import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'

export function NavEditor() {
  const { selectedElement, hidePropertiesPanel, setDraggingMarker } = useEditorStore()
  const { 
    currentSceneId, 
    project, 
    updateNavArrow, 
    deleteNavArrow, 
    getCurrentPanorama 
  } = useProjectStore()

  const [targetScene, setTargetScene] = useState('')
  const [label, setLabel] = useState('')

  // Available target scenes (all except current)
  const availableTargets = project?.panoramas.filter(p => p.id !== currentSceneId) || []

  // Load nav data when selection changes
  useEffect(() => {
    if (selectedElement?.type !== 'nav') return

    const pano = getCurrentPanorama()
    const nav = pano?.navArrows.find(n => n.id === selectedElement.id)
    
    if (nav) {
      setTargetScene(nav.targetScene || '')
      setLabel(nav.label || '')
    }
  }, [selectedElement, getCurrentPanorama])

  const handleSave = () => {
    if (!selectedElement || !currentSceneId) return

    updateNavArrow(currentSceneId, selectedElement.id, {
      targetScene,
      label
    })

    hidePropertiesPanel()
  }

  const handleDelete = () => {
    if (!selectedElement || !currentSceneId) return
    
    if (confirm('Navigationspfeil wirklich löschen?')) {
      deleteNavArrow(currentSceneId, selectedElement.id)
      hidePropertiesPanel()
    }
  }

  const handleMove = () => {
    setDraggingMarker(true)
  }

  return (
    <div className="space-y-4">
      {/* Target Scene */}
      <div className="space-y-2">
        <Label htmlFor="nav-target">Ziel-Panorama</Label>
        <select
          id="nav-target"
          value={targetScene}
          onChange={(e) => {
            setTargetScene(e.target.value)
            // Auto-fill label if empty
            if (!label) {
              const targetPano = project?.panoramas.find(p => p.id === e.target.value)
              if (targetPano) setLabel(targetPano.name)
            }
          }}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">Ziel auswählen...</option>
          {availableTargets.map(pano => (
            <option key={pano.id} value={pano.id}>{pano.name}</option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="nav-label">Beschriftung</Label>
        <Input
          id="nav-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="z.B. Zum Wohnzimmer"
        />
      </div>

      {/* Position hint */}
      <div className="text-xs text-muted-foreground">
        Klicke auf den Pfeil im Panorama und dann auf eine neue Stelle, um ihn zu verschieben.
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
