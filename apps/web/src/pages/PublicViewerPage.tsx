import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react'
import { PanoViewer, type PanoViewerHandle } from '@/components/viewer/PanoViewer'
import { Compass } from '@/components/viewer/Compass'
import { Button } from '@/components/ui/button'
import { loadProject } from '@/lib/projectLoader'
import { useProjectStore } from '@/stores/projectStore'
import type { PanoViewerCallbacks } from '@/hooks/usePanoViewer'

export function PublicViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const viewerRef = useRef<PanoViewerHandle>(null)
  
  const { project, currentSceneId, setProject, setCurrentScene, getCurrentPanorama } = useProjectStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Load project on mount (in production, would load by slug from API)
  useEffect(() => {
    if (!project) {
      loadProject('/test-assets/demo-project.json')
        .then((loadedProject) => {
          setProject(loadedProject)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error('Failed to load project:', err)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [project, setProject])
  
  // Get current panorama
  const currentPano = getCurrentPanorama()
  
  // Build viewer options
  const viewerOptions = useMemo(() => {
    if (!currentPano) {
      return {
        tilesPath: '/test-assets/tiles/sample/',
        previewPath: '/test-assets/tiles/sample/preview.webp',
        initialView: { yaw: 0, pitch: 0, fov: 75 },
        autoRotate: true,
        autoRotateSpeed: 0.3
      }
    }
    
    return {
      tilesPath: currentPano.tilesPath,
      previewPath: currentPano.previewPath,
      initialView: {
        yaw: currentPano.initialView?.yaw ?? 0,
        pitch: currentPano.initialView?.pitch ?? 0,
        fov: currentPano.initialView?.fov ?? 75
      },
      autoRotate: true,
      autoRotateSpeed: 0.3
    }
  }, [currentPano])
  
  // Viewer callbacks
  const viewerCallbacks: PanoViewerCallbacks = useMemo(() => ({
    onReady: () => {
      console.log('Public viewer ready')
    }
  }), [])
  
  // Control handlers
  const handleZoomIn = useCallback(() => {
    viewerRef.current?.zoomIn()
  }, [])
  
  const handleZoomOut = useCallback(() => {
    viewerRef.current?.zoomOut()
  }, [])
  
  const handleResetNorth = useCallback(() => {
    viewerRef.current?.rotate(0, 0)
  }, [])
  
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])
  
  // Handle scene changes
  const handleSceneChange = useCallback((sceneId: string) => {
    const pano = project?.panoramas.find(p => p.id === sceneId)
    if (!pano) return
    
    setCurrentScene(sceneId)
    viewerRef.current?.switchPanorama(pano.tilesPath, pano.previewPath, pano.initialView)
  }, [project, setCurrentScene])
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    )
  }
  
  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* Main Viewer */}
      <PanoViewer 
        ref={viewerRef}
        options={viewerOptions} 
        callbacks={viewerCallbacks}
        className="h-full w-full" 
      />
      
      {/* Compass */}
      <Compass onResetNorth={handleResetNorth} />
      
      {/* Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-black/50 hover:bg-black/70 text-white border-0"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-black/50 hover:bg-black/70 text-white border-0"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Fullscreen Button */}
      <div className="absolute right-4 bottom-4 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleToggleFullscreen}
          className="bg-black/50 hover:bg-black/70 text-white border-0"
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      {/* Scene Strip */}
      {project && project.panoramas.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex gap-2 p-2 bg-black/70 backdrop-blur-sm rounded-lg">
            {project.panoramas.map((pano) => (
              <button
                key={pano.id}
                onClick={() => handleSceneChange(pano.id)}
                className={`relative w-20 h-12 rounded overflow-hidden transition-all ${
                  pano.id === currentSceneId 
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-black' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={pano.previewPath}
                  alt={pano.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-[10px] text-white truncate">
                  {pano.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Minimal branding */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-xs text-white/80 z-10">
        {project?.name || slug}
      </div>
    </div>
  )
}
