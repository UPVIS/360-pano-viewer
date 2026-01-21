import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PanoViewer, type PanoViewerHandle } from '@/components/viewer/PanoViewer'
import { ViewerControls } from '@/components/viewer/ViewerControls'
import { Compass } from '@/components/viewer/Compass'
import { SettingsPanel } from '@/components/viewer/SettingsPanel'
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
  const { 
    mode, 
    setMode, 
    placementMode, 
    isDraggingMarker,
    setViewerPosition,
    isAutorotating,
    setAutorotating
  } = useEditorStore()
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
    onPositionUpdate: (position: Position3D) => {
      const zoom = viewerRef.current?.getPosition() ? 50 : 50 // Default zoom
      setViewerPosition({
        yaw: position.yaw,
        pitch: position.pitch,
        zoom
      })
    },
    onReady: () => {
      // Refresh markers when viewer is ready
      setTimeout(() => editorActions.refreshMarkers(), 100)
    }
  }), [mode, editorActions, getCurrentPanorama, setViewerPosition])

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
      autoRotate: isAutorotating,
      autoRotateSpeed: 0.3
    }
  }, [currentPano, isAutorotating])

  // Refresh markers when scene or mode changes
  useEffect(() => {
    if (viewerRef.current) {
      editorActions.refreshMarkers()
    }
  }, [currentSceneId, mode])

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/view/${id}`
    navigator.clipboard.writeText(shareUrl)
    alert(`Link kopiert: ${shareUrl}`)
  }, [id])

  const handleUpload = useCallback(() => {
    console.log('Upload clicked')
    // TODO: Open upload dialog
  }, [])

  const handleSceneChange = useCallback((sceneId: string) => {
    setCurrentScene(sceneId)
  }, [setCurrentScene])

  const handleZoomIn = useCallback(() => {
    // Zoom in by 10%
    const currentZoom = viewerRef.current?.getPosition()
    if (viewerRef.current) {
      // PSV uses zoom levels 0-100
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    // Zoom out by 10%
  }, [])

  const handleResetNorth = useCallback(() => {
    viewerRef.current?.rotate(0, 0)
  }, [])

  const handleToggleAutorotate = useCallback(() => {
    // Toggle is handled in store, but we could trigger viewer here
  }, [])

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Minimal Header */}
      <div className="h-12 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left: Back + Project Name */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <input
            type="text"
            defaultValue={project?.name || 'Demo Projekt'}
            className="bg-transparent border-none text-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 max-w-[200px]"
            onBlur={(e) => console.log('Rename to:', e.target.value)}
          />
        </div>

        {/* Center: Compact Mode Toggle */}
        <div className="flex items-center">
          <Button
            variant={mode === 'viewer' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('viewer')}
            className="h-8 rounded-r-none"
          >
            <Eye className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Viewer</span>
          </Button>
          <Button
            variant={mode === 'editor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('editor')}
            className="h-8 rounded-l-none border-l border-border"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Editor</span>
          </Button>
        </div>

        {/* Right: Spacer (controls moved to overlay) */}
        <div className="w-[100px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Panorama Viewer */}
        <PanoViewer 
          ref={viewerRef}
          options={viewerOptions}
          callbacks={viewerCallbacks}
        />

        {/* Viewer Controls (Overlay) */}
        <ViewerControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onShare={handleShare}
          onToggleAutorotate={handleToggleAutorotate}
        />

        {/* Compass */}
        <Compass onResetNorth={handleResetNorth} />

        {/* Settings Panel */}
        <SettingsPanel />

        {/* Editor Toolbar (only in editor mode) */}
        <EditorToolbar />

        {/* Properties Panel */}
        <PropertiesPanel />

        {/* Scenes Panel (toggle-able) */}
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
              'absolute inset-0 pointer-events-none z-20'
            )}
            style={{ cursor: 'crosshair' }}
          />
        )}
      </div>
    </div>
  )
}
