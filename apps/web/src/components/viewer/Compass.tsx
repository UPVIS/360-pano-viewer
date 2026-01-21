import { useEditorStore } from '@/stores/editorStore'

interface CompassProps {
  onResetNorth?: () => void
}

export function Compass({ onResetNorth }: CompassProps) {
  const { viewerPosition } = useEditorStore()
  
  // Convert yaw to degrees for rotation
  const yawDegrees = (viewerPosition.yaw * 180) / Math.PI

  return (
    <div className="absolute bottom-4 left-4 z-40">
      <button
        onClick={onResetNorth}
        className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center cursor-pointer hover:bg-card transition-colors"
        title="Klicken zum Zurücksetzen (Norden)"
        aria-label="Kompass - zeigt Blickrichtung"
      >
        {/* Compass Background */}
        <div className="relative w-10 h-10">
          {/* N Label */}
          <span 
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 text-[10px] font-bold text-primary"
            style={{ transform: `translateX(-50%) rotate(${-yawDegrees}deg)`, transformOrigin: 'center 20px' }}
          >
            N
          </span>
          
          {/* Compass Circle */}
          <div className="absolute inset-1 rounded-full border-2 border-border" />
          
          {/* Compass Needle */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${-yawDegrees}deg)` }}
          >
            <div className="w-0.5 h-6 relative">
              {/* North (red) */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-t-full" />
              {/* South (white) */}
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white rounded-b-full" />
            </div>
          </div>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-card border border-border" />
          </div>
        </div>
      </button>
    </div>
  )
}
