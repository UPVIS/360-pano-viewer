import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'

export function PanoEditor() {
  const { hidePropertiesPanel } = useEditorStore()
  const { currentSceneId, updatePanorama, getCurrentPanorama } = useProjectStore()

  const [name, setName] = useState('')
  const [pitchMin, setPitchMin] = useState(-30)
  const [pitchMax, setPitchMax] = useState(30)

  // Load panorama data
  useEffect(() => {
    const pano = getCurrentPanorama()
    if (pano) {
      setName(pano.name || '')
      setPitchMin(pano.pitchLimits?.min ?? -30)
      setPitchMax(pano.pitchLimits?.max ?? 30)
    }
  }, [currentSceneId, getCurrentPanorama])

  const handleSave = () => {
    if (!currentSceneId) return

    updatePanorama(currentSceneId, {
      name,
      pitchLimits: {
        min: pitchMin,
        max: pitchMax
      }
    })

    hidePropertiesPanel()
  }

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="pano-name">Name</Label>
        <Input
          id="pano-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Panorama-Name"
        />
      </div>

      {/* Pitch Limits */}
      <div className="space-y-4">
        <Label>Neigungsgrenzen</Label>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Minimum (nach unten)</span>
            <span>{pitchMin}°</span>
          </div>
          <input
            type="range"
            min="-90"
            max="0"
            value={pitchMin}
            onChange={(e) => setPitchMin(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Maximum (nach oben)</span>
            <span>{pitchMax}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            value={pitchMax}
            onChange={(e) => setPitchMax(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2">
        <Button onClick={handleSave} className="w-full">
          Speichern
        </Button>
      </div>
    </div>
  )
}
