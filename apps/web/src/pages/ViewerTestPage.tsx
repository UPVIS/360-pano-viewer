import { PanoViewer } from '@/components/viewer/PanoViewer'

export function ViewerTestPage() {
  const viewerOptions = {
    tilesPath: '/test-assets/tiles/sample/',
    previewPath: '/test-assets/tiles/sample/preview.webp',
    initialView: {
      yaw: 0,
      pitch: 0,
      fov: 75
    },
    autoRotate: false,
    autoRotateSpeed: 0.5
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-4">
        <h1 className="text-lg font-semibold">360° Panorama Viewer Test</h1>
      </header>

      {/* Viewer */}
      <div className="h-[calc(100vh-3.5rem)]">
        <PanoViewer options={viewerOptions} />
      </div>
    </div>
  )
}
