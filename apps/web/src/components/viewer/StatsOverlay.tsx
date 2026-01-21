import { useEffect, useState, useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'

interface StatsData {
  fps: number
  frameTime: number
  memoryUsed: number
  resolution: string
  gpu: string
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

export function StatsOverlay() {
  const { showStats, viewerPosition } = useEditorStore()
  const [stats, setStats] = useState<StatsData>({
    fps: 0,
    frameTime: 0,
    memoryUsed: 0,
    resolution: '0x0',
    gpu: 'Unknown'
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  // Detect GPU on mount
  useEffect(() => {
    if (!showStats) return

    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          // Shorten GPU name
          const shortGpu = renderer
            .replace(/ANGLE \(|, .*\)$/g, '')
            .replace(/Intel\(R\) |AMD |NVIDIA |Corporation /gi, '')
            .slice(0, 20)
          setStats(prev => ({ ...prev, gpu: shortGpu }))
        }
      }
    } catch {
      // GPU detection failed
    }

    // Get resolution
    const updateResolution = () => {
      setStats(prev => ({
        ...prev,
        resolution: `${window.innerWidth}x${window.innerHeight}`
      }))
    }
    updateResolution()
    window.addEventListener('resize', updateResolution)

    return () => window.removeEventListener('resize', updateResolution)
  }, [showStats])

  // FPS Counter
  useEffect(() => {
    if (!showStats) return

    let animationId: number

    const updateFPS = () => {
      frameCountRef.current++
      const now = performance.now()
      const elapsed = now - lastTimeRef.current

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed)
        const frameTime = parseFloat((elapsed / frameCountRef.current).toFixed(1))
        
        // Get memory usage if available
        const memory = (performance as any).memory
        const memoryUsed = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0

        setStats(prev => ({
          ...prev,
          fps,
          frameTime,
          memoryUsed
        }))

        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      animationId = requestAnimationFrame(updateFPS)
    }

    animationId = requestAnimationFrame(updateFPS)
    return () => cancelAnimationFrame(animationId)
  }, [showStats])

  if (!showStats) return null

  // Convert radians to degrees
  const yawDeg = Math.round((viewerPosition.yaw * 180) / Math.PI)
  const pitchDeg = Math.round((viewerPosition.pitch * 180) / Math.PI)
  const zoomPercent = Math.round(viewerPosition.zoom)

  return (
    <div className="absolute top-16 left-4 z-50 w-52 bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 text-xs font-mono shadow-xl">
      <div className="font-semibold mb-3 text-primary text-sm">Nerd Stats</div>
      
      {/* Performance */}
      <div className="space-y-1 mb-3">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Performance</div>
        <StatRow label="FPS" value={stats.fps.toString()} />
        <StatRow label="Frame Time" value={`${stats.frameTime}ms`} />
      </div>

      {/* Position */}
      <div className="space-y-1 mb-3 pt-2 border-t border-border">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Position</div>
        <StatRow label="Yaw" value={`${yawDeg}°`} />
        <StatRow label="Pitch" value={`${pitchDeg}°`} />
        <StatRow label="Zoom" value={`${zoomPercent}%`} />
      </div>

      {/* System */}
      <div className="space-y-1 pt-2 border-t border-border">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">System</div>
        {stats.memoryUsed > 0 && (
          <StatRow label="Memory" value={`${stats.memoryUsed.toFixed(1)} MB`} />
        )}
        <StatRow label="Resolution" value={stats.resolution} />
        <StatRow label="GPU" value={stats.gpu} />
      </div>
    </div>
  )
}
