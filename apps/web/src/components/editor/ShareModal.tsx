import { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Code, Link2, Compass, Layers, ZoomIn, Maximize } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useProjectStore } from '@/stores/projectStore'
import { useEditorStore } from '@/stores/editorStore'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPosition?: { yaw: number; pitch: number; zoom: number }
}

interface EmbedConfig {
  width: string
  height: string
  autorotate: boolean
  useCurrentPosition: boolean
  showCompass: boolean
  showScenes: boolean
  showZoom: boolean
  showFullscreen: boolean
}

export function ShareModal({ open, onOpenChange, currentPosition }: ShareModalProps) {
  const { project } = useProjectStore()
  const { viewerPosition } = useEditorStore()
  
  // Use passed position or store position
  const position = currentPosition || viewerPosition
  
  // Embed configuration state
  const [config, setConfig] = useState<EmbedConfig>({
    width: '100%',
    height: '500px',
    autorotate: true,
    useCurrentPosition: false,
    showCompass: true,
    showScenes: true,
    showZoom: true,
    showFullscreen: true,
  })
  
  // Copy states
  const [embedCopied, setEmbedCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Generate base URL
  const baseUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.origin
  }, [])
  
  const slug = project?.slug || 'demo-projekt'
  
  // Generate embed URL with parameters
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams()
    
    if (config.autorotate) params.set('autorotate', '1')
    if (config.useCurrentPosition && position) {
      params.set('yaw', position.yaw.toFixed(2))
      params.set('pitch', position.pitch.toFixed(2))
    }
    if (!config.showCompass) params.set('compass', '0')
    if (!config.showScenes) params.set('scenes', '0')
    if (!config.showZoom) params.set('zoom', '0')
    if (!config.showFullscreen) params.set('fs', '0')
    
    const queryString = params.toString()
    return `${baseUrl}/embed/${slug}${queryString ? `?${queryString}` : ''}`
  }, [baseUrl, slug, config, position])
  
  // Generate direct view URL
  const viewUrl = useMemo(() => {
    return `${baseUrl}/view/${slug}`
  }, [baseUrl, slug])
  
  // Generate iframe code
  const iframeCode = useMemo(() => {
    return `<iframe src="${embedUrl}" width="${config.width}" height="${config.height}" frameborder="0" allowfullscreen></iframe>`
  }, [embedUrl, config.width, config.height])
  
  // Copy handlers
  const copyToClipboard = useCallback(async (text: string, type: 'embed' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'embed') {
        setEmbedCopied(true)
        setTimeout(() => setEmbedCopied(false), 2000)
      } else {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])
  
  const updateConfig = useCallback((key: keyof EmbedConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Projekt teilen</DialogTitle>
          <DialogDescription>
            Teile dieses Panorama als eingebetteten Viewer oder direkten Link.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="embed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="embed" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Embed Code
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Direct Link
            </TabsTrigger>
          </TabsList>
          
          {/* Embed Code Tab */}
          <TabsContent value="embed" className="space-y-4 mt-4">
            {/* Size Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="embed-width">Breite</Label>
                <Input
                  id="embed-width"
                  value={config.width}
                  onChange={(e) => updateConfig('width', e.target.value)}
                  placeholder="100% oder 800px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="embed-height">Höhe</Label>
                <Input
                  id="embed-height"
                  value={config.height}
                  onChange={(e) => updateConfig('height', e.target.value)}
                  placeholder="500px"
                />
              </div>
            </div>
            
            {/* Autorotation */}
            <div className="flex items-center justify-between">
              <Label htmlFor="autorotate" className="flex-1">Autorotation</Label>
              <Switch
                id="autorotate"
                checked={config.autorotate}
                onCheckedChange={(checked) => updateConfig('autorotate', checked)}
              />
            </div>
            
            {/* Start Position */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-position" className="flex-1">
                  Aktuelle Blickrichtung verwenden
                </Label>
                <Switch
                  id="use-position"
                  checked={config.useCurrentPosition}
                  onCheckedChange={(checked) => updateConfig('useCurrentPosition', checked)}
                />
              </div>
              {config.useCurrentPosition && position && (
                <div className="pl-4 text-sm text-muted-foreground">
                  Yaw: {position.yaw.toFixed(1)}° | Pitch: {position.pitch.toFixed(1)}°
                </div>
              )}
            </div>
            
            {/* UI Elements */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">UI-Elemente anzeigen</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Kompass</span>
                  </div>
                  <Switch
                    checked={config.showCompass}
                    onCheckedChange={(checked) => updateConfig('showCompass', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Szenen</span>
                  </div>
                  <Switch
                    checked={config.showScenes}
                    onCheckedChange={(checked) => updateConfig('showScenes', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Zoom</span>
                  </div>
                  <Switch
                    checked={config.showZoom}
                    onCheckedChange={(checked) => updateConfig('showZoom', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Fullscreen</span>
                  </div>
                  <Switch
                    checked={config.showFullscreen}
                    onCheckedChange={(checked) => updateConfig('showFullscreen', checked)}
                  />
                </div>
              </div>
            </div>
            
            {/* Generated Code */}
            <div className="space-y-2">
              <Label>Embed Code</Label>
              <div className="relative">
                <pre className="p-3 rounded-md bg-muted text-xs overflow-x-auto whitespace-pre-wrap break-all">
                  {iframeCode}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(iframeCode, 'embed')}
                >
                  {embedCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Kopieren
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Direct Link Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Fullscreen Viewer Link</Label>
              <p className="text-sm text-muted-foreground">
                Dieser Link öffnet das Panorama im Vollbild-Modus ohne Editor-Funktionen.
              </p>
              <div className="relative">
                <Input
                  value={viewUrl}
                  readOnly
                  className="pr-24"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => copyToClipboard(viewUrl, 'link')}
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Kopieren
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(viewUrl, '_blank')}
              >
                <Maximize className="w-4 h-4 mr-2" />
                Vorschau öffnen
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
