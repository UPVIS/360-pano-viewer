import { useParams } from 'react-router-dom'
import { PanoViewer } from '@/components/viewer/PanoViewer'

export function EmbedViewerPage() {
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

  // Embed-Version: Keine UI, nur Viewer
  return (
    <div className="h-screen w-screen">
      <PanoViewer options={viewerOptions} className="h-full w-full" />
    </div>
  )
}
