import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Edit2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PanoViewer, type PanoViewerHandle } from '@/components/viewer/PanoViewer'
import { ViewerControls } from '@/components/viewer/ViewerControls'
import { Compass } from '@/components/viewer/Compass'
import { SettingsPanel } from '@/components/viewer/SettingsPanel'
import { StatsOverlay } from '@/components/viewer/StatsOverlay'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { SceneStrip } from '@/components/editor/SceneStrip'
import { ShareModal } from '@/components/editor/ShareModal'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorActions } from '@/hooks/useEditorActions'
import { loadProject } from '@/lib/projectLoader'
import { loadFromStorage } from '@/stores/projectStore'
import type { PanoViewerCallbacks, Position3D, MarkerData } from '@/hooks/usePanoViewer'
import { cn } from '@/lib/utils'

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
  const [isProjectLoading, setIsProjectLoading] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Load project on mount - check localStorage first, then load from JSON
  useEffect(() => {
    if (!project && !isProjectLoading) {
      setIsProjectLoading(true)
      
      // First try to load from localStorage (saved changes)
      const savedProject = loadFromStorage()
      if (savedProject) {
        console.log('[EditorPage] Gespeichertes Projekt geladen')
        setProject(savedProject)
        setIsProjectLoading(false)
        return
      }
      
      // Otherwise load from demo JSON
      loadProject('/test-assets/demo-project.json')
        .then((loadedProject) => {
          setProject(loadedProject)
          setIsProjectLoading(false)
        })
        .catch((err) => {
          console.error('Failed to load project:', err)
          setIsProjectLoading(false)
        })
    }
  }, [project, setProject, isProjectLoading])

  // Get viewer methods via a getter function to always get current ref
  const getViewerMethods = useCallback(() => {
    if (!viewerRef.current) return null
    return {
      addMarker: viewerRef.current.addMarker,
      removeMarker: viewerRef.current.removeMarker,
      clearMarkers: viewerRef.current.clearMarkers,
      switchPanorama: viewerRef.current.switchPanorama
    }
  }, [])

  // Editor actions with marker management and switchPanorama
  const editorActions = useEditorActions({
    getViewerMethods
  })

  // Viewer callbacks
  const viewerCallbacks: PanoViewerCallbacks = useMemo(() => ({
    onClick: (position: Position3D) => {
      editorActions.handlePanoramaClick(position)
    },
    onMarkerClick: (markerId: string, data: MarkerData) => {
      // In viewer mode, POI tooltips are handled natively by PSV (trigger: 'click')
      // We only need to handle editor mode and navigation arrows
      if (mode === 'viewer' && data.type === 'poi') {
        // Native PSV tooltip handles this - do nothing
        return
      }
      editorActions.handleMarkerClick(markerId, data)
    },
    onPositionUpdate: (position: Position3D) => {
      const zoom = viewerRef.current?.getZoomLevel() ?? 50
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
  }), [mode, editorActions, setViewerPosition])

  // Get current panorama options - only change when panorama changes
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
      autoRotate: false, // Don't trigger reinit on autorotate change
      autoRotateSpeed: 0.3
    }
  }, [currentPano?.tilesPath, currentPano?.previewPath, currentPano?.initialView])

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

  const handleSceneChange = useCallback(async (sceneId: string) => {
    const targetPano = project?.panoramas.find(p => p.id === sceneId)
    if (targetPano && viewerRef.current) {
      // Update store state
      setCurrentScene(sceneId)
      // Switch panorama without destroying viewer
      await viewerRef.current.switchPanorama(
        targetPano.tilesPath,
        targetPano.previewPath,
        targetPano.initialView
      )
      // Refresh markers for new scene
      setTimeout(() => editorActions.refreshMarkers(), 100)
    }
  }, [project, setCurrentScene, editorActions])

  const handleZoomIn = useCallback(() => {
    viewerRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    viewerRef.current?.zoomOut()
  }, [])

  const handleResetNorth = useCallback(() => {
    viewerRef.current?.rotate(0, 0)
  }, [])

  const handleToggleAutorotate = useCallback(() => {
    if (viewerRef.current?.isAutorotating()) {
      viewerRef.current?.stopAutorotate()
      setAutorotating(false)
    } else {
      viewerRef.current?.startAutorotate()
      setAutorotating(true)
    }
  }, [setAutorotating])

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

        {/* Right: Share Button */}
        <div className="w-[100px] flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Teilen</span>
          </Button>
        </div>
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
        <SettingsPanel 
          onAutorotateChange={(enabled) => {
            if (enabled) {
              viewerRef.current?.startAutorotate()
            } else {
              viewerRef.current?.stopAutorotate()
            }
          }}
          onPitchLimitsChange={(min, max) => {
            viewerRef.current?.setPitchRange(min, max)
          }}
        />

        {/* Stats Overlay */}
        <StatsOverlay />

        {/* Editor Toolbar (only in editor mode) */}
        <EditorToolbar />

        {/* Properties Panel */}
        <PropertiesPanel />

        {/* Scenes Panel (toggle-able) */}
        <SceneStrip 
          onUpload={handleUpload}
          onSceneChange={handleSceneChange}
        />

        {/* POI Tooltips are now handled natively by PSV MarkersPlugin */}

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

      {/* Share Modal */}
      <ShareModal 
        open={shareModalOpen} 
        onOpenChange={setShareModalOpen}
      />
    </div>
  )
}
