import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Upload, Eye, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PanoViewer, type PanoViewerHandle } from '@/components/viewer/PanoViewer'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { SceneStrip } from '@/components/editor/SceneStrip'
import { PoiTooltip } from '@/components/viewer/PoiTooltip'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore, type PointOfInterest } from '@/stores/projectStore'
import { useEditorActions } from '@/hooks/useEditorActions'
import type { PanoViewerCallbacks, Position3D, MarkerData } from '@/hooks/usePanoViewer'
import { cn } from '@/lib/utils'

// Demo project data
const DEMO_PROJECT = {
  id: 'demo',
  name: 'Demo Projekt',
  panoramas: [
    {
      id: 'scene-1',
      name: 'Hauptansicht',
      tilesPath: '/test-assets/tiles/sample/',
      previewPath: '/test-assets/tiles/sample/preview.webp',
      initialView: { yaw: 0, pitch: 0, fov: 75 },
      pitchLimits: { min: -30, max: 30 },
      pois: [],
      navArrows: []
    }
  ]
}

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const viewerRef = useRef<PanoViewerHandle>(null)

  // Stores
  const { mode, setMode, placementMode, isDraggingMarker } = useEditorStore()
  const { project, currentSceneId, setProject, setCurrentScene, getCurrentPanorama } = useProjectStore()

  // Local state
  const [activePoiTooltip, setActivePoiTooltip] = useState<PointOfInterest | null>(null)

  // Initialize project on mount
  useEffect(() => {
    if (!project) {
      setProject(DEMO_PROJECT)
    }
  }, [project, setProject])

  // Editor actions with marker management
  const editorActions = useEditorActions({
    addMarker: viewerRef.current?.addMarker || (() => {}),
    removeMarker: viewerRef.current?.removeMarker || (() => {}),
    clearMarkers: viewerRef.current?.clearMarkers || (() => {})
  })

  // Viewer callbacks
  const viewerCallbacks: PanoViewerCallbacks = useMemo(() => ({
    onClick: (position: Position3D) => {
      editorActions.handlePanoramaClick(position)
    },
    onMarkerClick: (markerId: string, data: MarkerData) => {
      if (mode === 'viewer' && data.type === 'poi') {
        // Show POI tooltip in viewer mode
        const pano = getCurrentPanorama()
        const poi = pano?.pois.find(p => p.id === markerId)
        if (poi) {
          setActivePoiTooltip(poi)
        }
      } else {
        editorActions.handleMarkerClick(markerId, data)
      }
    },
    onReady: () => {
      // Refresh markers when viewer is ready
      setTimeout(() => editorActions.refreshMarkers(), 100)
    }
  }), [mode, editorActions, getCurrentPanorama])

  // Get current panorama options
  const currentPano = getCurrentPanorama()
  const viewerOptions = useMemo(() => {
    if (!currentPano) {
      return {
        tilesPath: '/test-assets/tiles/sample/',
        previewPath: '/test-assets/tiles/sample/preview.webp',
        initialView: { yaw: 0, pitch: 0, fov: 75 },
        autoRotate: false,
        autoRotateSpeed: 0.5
      }
    }
    return {
      tilesPath: currentPano.tilesPath,
      previewPath: currentPano.previewPath,
      initialView: currentPano.initialView,
      autoRotate: mode === 'viewer',
      autoRotateSpeed: 0.3
    }
  }, [currentPano, mode])

  // Refresh markers when scene or mode changes
  useEffect(() => {
    if (viewerRef.current) {
      editorActions.refreshMarkers()
    }
  }, [currentSceneId, mode])

  const handleShare = () => {
    console.log('Share clicked for project:', id)
    // TODO: Open share modal
  }

  const handleUpload = () => {
    console.log('Upload clicked')
    // TODO: Open upload dialog
  }

  const handleSceneChange = (sceneId: string) => {
    setCurrentScene(sceneId)
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Editor Header */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left: Back + Project Name */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <input
            type="text"
            defaultValue={project?.name || 'Demo Projekt'}
            className="bg-transparent border-none text-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1"
            onBlur={(e) => console.log('Rename to:', e.target.value)}
          />
        </div>

        {/* Center: Mode Toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <Button
            variant={mode === 'viewer' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('viewer')}
            className="h-7"
          >
            <Eye className="w-4 h-4 mr-1" />
            Viewer
          </Button>
          <Button
            variant={mode === 'editor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('editor')}
            className="h-7"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Editor
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Teilen
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Panorama Viewer */}
        <PanoViewer 
          ref={viewerRef}
          options={viewerOptions}
          callbacks={viewerCallbacks}
        />

        {/* Editor Toolbar */}
        <EditorToolbar />

        {/* Properties Panel */}
        <PropertiesPanel />

        {/* Scene Strip */}
        <SceneStrip 
          onUpload={handleUpload}
          onSceneChange={handleSceneChange}
        />

        {/* POI Tooltip (Viewer Mode) */}
        <PoiTooltip 
          poi={activePoiTooltip}
          onClose={() => setActivePoiTooltip(null)}
        />

        {/* Placement/Drag Cursor Indicator */}
        {(placementMode || isDraggingMarker) && (
          <div 
            className={cn(
              'fixed inset-0 pointer-events-none z-40',
              'cursor-crosshair'
            )}
            style={{ cursor: 'crosshair' }}
          />
        )}
      </div>
    </div>
  )
}
