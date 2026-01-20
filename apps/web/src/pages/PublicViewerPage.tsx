import { useParams } from 'react-router-dom'
import { PanoViewer } from '@/components/viewer/PanoViewer'

export function PublicViewerPage() {
  const { id } = useParams<{ id: string }>()

  const viewerOptions = {
    tilesPath: '/test-assets/tiles/sample/',
    previewPath: '/test-assets/tiles/sample/preview.webp',
    initialView: {
      yaw: 0,
      pitch: 0,
      fov: 75
    },
    autoRotate: true,
    autoRotateSpeed: 0.3
  }

  return (
    <div className="h-screen w-screen bg-background">
      <PanoViewer options={viewerOptions} className="h-full w-full" />
      
      {/* Minimal branding (optional) */}
      <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-card/80 backdrop-blur-sm text-xs text-muted-foreground">
        Projekt: {id}
      </div>
    </div>
  )
}
