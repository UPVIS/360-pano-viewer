import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Upload, Eye, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PanoViewer } from '@/components/viewer/PanoViewer'
import { useState } from 'react'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'viewer' | 'editor'>('editor')

  const projectName = 'Demo Projekt'

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

  const handleShare = () => {
    console.log('Share clicked for project:', id)
    // TODO: Open share modal
  }

  const handleUpload = () => {
    console.log('Upload clicked')
    // TODO: Open upload dialog
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Editor Header */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        {/* Left: Back + Project Name */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <input
            type="text"
            defaultValue={projectName}
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

      {/* Main Content: Viewer */}
      <div className="flex-1 relative">
        <PanoViewer options={viewerOptions} />

        {/* Editor Mode Indicator */}
        {mode === 'editor' && (
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border text-sm">
            <span className="text-muted-foreground">Editor-Modus aktiv</span>
            <span className="ml-2 text-xs text-muted-foreground">(Klicke um POIs zu platzieren)</span>
          </div>
        )}

        {/* Scene Strip Placeholder */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
            <div className="flex items-center gap-3 overflow-x-auto">
              {/* Scene Thumbnails */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`shrink-0 w-24 h-16 rounded-md overflow-hidden border-2 cursor-pointer transition-colors ${
                    i === 1 ? 'border-primary' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <img
                    src="/test-assets/tiles/sample/preview.webp"
                    alt={`Szene ${i}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {/* Add Scene Button */}
              <button
                onClick={handleUpload}
                className="shrink-0 w-24 h-16 rounded-md border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
