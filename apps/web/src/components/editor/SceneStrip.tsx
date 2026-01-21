import { Plus, GripVertical, MoreVertical, Trash2, Edit, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { cn } from '@/lib/utils'

interface SceneStripProps {
  onUpload?: () => void
  onSceneChange?: (sceneId: string) => void
}

export function SceneStrip({ onUpload, onSceneChange }: SceneStripProps) {
  const { mode, selectElement, scenesVisible, toggleScenes } = useEditorStore()
  const { 
    project, 
    currentSceneId, 
    setCurrentScene, 
    updatePanorama,
    deletePanorama,
    reorderPanoramas 
  } = useProjectStore()

  const isEditor = mode === 'editor'
  const panoramas = project?.panoramas || []

  // Only show when scenesVisible is true
  if (!scenesVisible) return null

  const handleSceneClick = (sceneId: string) => {
    setCurrentScene(sceneId)
    onSceneChange?.(sceneId)
  }

  const handleRename = (sceneId: string) => {
    const pano = panoramas.find(p => p.id === sceneId)
    if (!pano) return

    const newName = prompt('Neuer Name:', pano.name)
    if (newName && newName.trim()) {
      updatePanorama(sceneId, { name: newName.trim() })
    }
  }

  const handleSetAsStart = (sceneId: string) => {
    // Move to first position
    if (panoramas[0]?.id !== sceneId) {
      reorderPanoramas(sceneId, panoramas[0].id)
    }
  }

  const handleDelete = (sceneId: string) => {
    if (panoramas.length <= 1) {
      alert('Die letzte Szene kann nicht gelöscht werden.')
      return
    }
    
    if (confirm('Szene wirklich löschen?')) {
      deletePanorama(sceneId)
    }
  }

  const handleEditPanorama = (sceneId: string) => {
    setCurrentScene(sceneId)
    selectElement('panorama', sceneId)
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 z-40">
      <div className="bg-card/90 backdrop-blur-md border border-border rounded-lg p-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin">
          {panoramas.map((pano, index) => (
            <div
              key={pano.id}
              className={cn(
                'relative shrink-0 group cursor-pointer transition-all',
                'rounded-md overflow-hidden border-2',
                currentSceneId === pano.id
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-transparent hover:border-primary/50'
              )}
              onClick={() => handleSceneClick(pano.id)}
            >
              {/* Thumbnail */}
              <div className="w-28 h-20 bg-secondary">
                <img
                  src={pano.previewPath}
                  alt={pano.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-pano.jpg'
                  }}
                />
              </div>

              {/* Number Badge */}
              <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/70 text-white text-xs flex items-center justify-center font-medium">
                {index + 1}
              </div>

              {/* Name */}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-xs text-white font-medium truncate block">
                  {pano.name}
                </span>
              </div>

              {/* Editor Controls */}
              {isEditor && (
                <>
                  {/* Drag Handle */}
                  <div className="absolute top-1 right-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center cursor-grab">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center hover:bg-black/90">
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handleEditPanorama(pano.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRename(pano.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Umbenennen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetAsStart(pano.id)}>
                          <Star className="w-4 h-4 mr-2" />
                          Als Start setzen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(pano.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add Scene Button */}
          {isEditor && (
            <button
              onClick={onUpload}
              className={cn(
                'shrink-0 w-28 h-20 rounded-md',
                'border-2 border-dashed border-border',
                'hover:border-primary/50 hover:bg-secondary/50',
                'flex flex-col items-center justify-center gap-1',
                'text-muted-foreground hover:text-foreground',
                'transition-colors'
              )}
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">Hinzufügen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
