import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useEditorStore } from '@/stores/editorStore'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SettingsPanelProps {
  onAutorotateChange?: (enabled: boolean) => void
  onSpeedChange?: (speed: number) => void
}

export function SettingsPanel({ onAutorotateChange, onSpeedChange }: SettingsPanelProps) {
  const { 
    settingsVisible, 
    toggleSettings, 
    isAutorotating, 
    setAutorotating,
    viewerPosition 
  } = useEditorStore()

  const [speed, setSpeed] = useState(5)
  const [showStats, setShowStats] = useState(false)

  if (!settingsVisible) return null

  const handleAutorotateToggle = () => {
    setAutorotating(!isAutorotating)
    onAutorotateChange?.(!isAutorotating)
  }

  const handleSpeedChange = (value: number) => {
    setSpeed(value)
    onSpeedChange?.(value)
  }

  // Convert radians to degrees
  const yawDeg = Math.round((viewerPosition.yaw * 180) / Math.PI)
  const pitchDeg = Math.round((viewerPosition.pitch * 180) / Math.PI)

  return (
    <div
      className={cn(
        'fixed top-16 right-4 w-72 z-50',
        'bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl',
        'animate-in slide-in-from-right-4 fade-in duration-200'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold">Einstellungen</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSettings}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Ansicht Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Ansicht</h4>
          
          {/* Auto-Rotation Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="autorotate">Auto-Rotation</Label>
            <button
              id="autorotate"
              role="switch"
              aria-checked={isAutorotating}
              onClick={handleAutorotateToggle}
              className={cn(
                'w-11 h-6 rounded-full transition-colors',
                isAutorotating ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <span
                className={cn(
                  'block w-5 h-5 rounded-full bg-white shadow transition-transform',
                  isAutorotating ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {/* Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="speed">Geschwindigkeit</Label>
              <span className="text-sm text-muted-foreground">{speed}</span>
            </div>
            <input
              id="speed"
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Position Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Position</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Yaw</div>
              <div className="text-sm font-mono">{yawDeg}°</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Pitch</div>
              <div className="text-sm font-mono">{pitchDeg}°</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Zoom</div>
              <div className="text-sm font-mono">{Math.round(viewerPosition.zoom)}%</div>
            </div>
          </div>
        </div>

        {/* Stats Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="stats">Debug-Statistiken</Label>
          <button
            id="stats"
            role="switch"
            aria-checked={showStats}
            onClick={() => setShowStats(!showStats)}
            className={cn(
              'w-11 h-6 rounded-full transition-colors',
              showStats ? 'bg-primary' : 'bg-secondary'
            )}
          >
            <span
              className={cn(
                'block w-5 h-5 rounded-full bg-white shadow transition-transform',
                showStats ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
