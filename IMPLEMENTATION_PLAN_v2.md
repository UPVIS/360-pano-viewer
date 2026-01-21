# React Panorama Viewer - Vollständige Feature-Implementierung

## Übersicht

Dieser Plan bringt die React-App auf Feature-Parität mit dem Vanilla-JS-Prototyp. Alle kritischen Funktionen werden parallel implementiert.

---

## 1. Core Engine Fixes

### 1.1 Demo-Projekt laden (statt Dummy-Daten)

**Problem:** `EditorPage.tsx` verwendet ein statisches `DEMO_PROJECT` mit nur einem Panorama.

**Lösung:** Dynamisches Laden aus `/test-assets/demo-project.json` mit Transformation.

```typescript
// apps/web/src/lib/projectLoader.ts
export async function loadProject(url: string): Promise<Project> {
  const response = await fetch(url)
  const data = await response.json()
  
  return {
    id: data.id,
    name: data.name,
    panoramas: data.panoramas.map((pano: any) => ({
      ...pano,
      pois: pano.pois || [],
      navArrows: (pano.navArrows || []).map((nav: any) => ({
        ...nav,
        targetScene: nav.targetPanoramaId  // Transform field name
      }))
    }))
  }
}
```

**Änderung in `EditorPage.tsx`:**
```typescript
useEffect(() => {
  loadProject('/test-assets/demo-project.json')
    .then(setProject)
    .catch(console.error)
}, [setProject])
```

### 1.2 Szenen-Wechsel ohne Viewer-Neustart

**Problem:** Bei `currentSceneId`-Änderung wird der Viewer komplett zerstört und neu erstellt.

**Lösung:** Neue `switchPanorama()` Methode in `usePanoViewer.ts`:

```typescript
const switchPanorama = useCallback(async (
  tilesPath: string, 
  previewPath: string,
  initialView?: { yaw: number; pitch: number; fov: number }
) => {
  if (!viewerRef.current) return

  // Load manifest
  const manifest = await fetch(`${tilesPath}manifest.json`).then(r => r.json())
  const levelIndex = Math.min(1, manifest.levels.length - 1)
  const level = manifest.levels[levelIndex]

  // Use setPanorama instead of destroying viewer
  await viewerRef.current.setPanorama({
    width: level.width,
    cols: level.cols,
    rows: level.rows,
    baseUrl: previewPath,
    tileUrl: (col: number, row: number) => 
      `${tilesPath}level-${levelIndex}/row-${row}/tile-${col}.webp`
  })

  // Rotate to initial view
  if (initialView) {
    viewerRef.current.rotate({ yaw: initialView.yaw, pitch: initialView.pitch })
    viewerRef.current.zoom(50)
  }
}, [])
```

**Export in `PanoViewerHandle`:**
```typescript
export interface PanoViewerHandle {
  // ... existing methods
  switchPanorama: (tilesPath: string, previewPath: string, initialView?: {...}) => Promise<void>
}
```

### 1.3 Zoom-Buttons verbinden

**Problem:** `handleZoomIn` und `handleZoomOut` sind leere Funktionen.

**Lösung in `usePanoViewer.ts`:**
```typescript
const zoomIn = useCallback(() => {
  if (!viewerRef.current) return
  const current = viewerRef.current.getZoomLevel()
  viewerRef.current.zoom(Math.min(100, current + 10))
}, [])

const zoomOut = useCallback(() => {
  if (!viewerRef.current) return
  const current = viewerRef.current.getZoomLevel()
  viewerRef.current.zoom(Math.max(0, current - 10))
}, [])
```

**Änderung in `EditorPage.tsx`:**
```typescript
const handleZoomIn = useCallback(() => {
  viewerRef.current?.zoomIn()
}, [])

const handleZoomOut = useCallback(() => {
  viewerRef.current?.zoomOut()
}, [])
```

### 1.4 Autorotation verbinden

**Problem:** Store-State ändert sich, aber Viewer wird nicht gesteuert.

**Lösung in `usePanoViewer.ts`:**
```typescript
const startAutorotate = useCallback(() => {
  autorotatePluginRef.current?.start()
}, [])

const stopAutorotate = useCallback(() => {
  autorotatePluginRef.current?.stop()
}, [])

const isAutorotating = useCallback(() => {
  return autorotatePluginRef.current?.isEnabled() ?? false
}, [])
```

**Änderung in `ViewerControls.tsx`:**
```typescript
const handleAutorotate = useCallback(() => {
  if (isAutorotating) {
    viewerRef.current?.stopAutorotate()
  } else {
    viewerRef.current?.startAutorotate()
  }
  toggleAutorotate()
}, [isAutorotating, toggleAutorotate])
```

### 1.5 Navigation Arrow Klick fixen

**Problem:** Nav-Arrow-Klick in `useEditorActions.ts` setzt nur Store-State, was Viewer-Neustart auslöst.

**Lösung:**
```typescript
// useEditorActions.ts
const handleMarkerClick = useCallback((markerId: string, data: MarkerData) => {
  if (mode === 'viewer' && data.type === 'nav' && data.targetPanoramaId) {
    const targetPano = useProjectStore.getState().getPanoramaById(data.targetPanoramaId as string)
    if (targetPano) {
      // 1. Update store state (without triggering viewer reinit)
      useProjectStore.getState().setCurrentScene(targetPano.id)
      // 2. Switch panorama via viewer method
      switchPanorama(targetPano.tilesPath, targetPano.previewPath, targetPano.initialView)
      // 3. Refresh markers for new scene
      setTimeout(() => refreshMarkers(), 100)
    }
    return
  }
  // ... rest of handler
}, [mode, switchPanorama, refreshMarkers])
```

---

## 2. UI Styling Fixes

### 2.1 SceneStrip - Kompakt und Mittig

**Aktuelle Styles:** `bottom-4 left-4 right-4` (volle Breite)

**Prototyp-Styles:**
```css
.scenes-panel {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  max-width: calc(100vw - 2rem);
  padding: 0.875rem;
  gap: 0.75rem;
}

.scene-thumb {
  width: 120px;
  min-width: 120px;
  height: 80px;
}
```

**Änderung in `SceneStrip.tsx`:**
```tsx
return (
  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)]">
    <div className="bg-card/90 backdrop-blur-md border border-border rounded-lg p-3">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin">
        {panoramas.map((pano, index) => (
          <div
            key={pano.id}
            className={cn(
              'relative shrink-0 group cursor-pointer transition-all',
              'rounded-md overflow-hidden border-2',
              'w-[120px] min-w-[120px] h-[80px]',  // Fixed size like prototype
              // ...
            )}
          >
```

### 2.2 Kompass-Rotation korrigieren

**Problem:** Kompass rotiert möglicherweise nicht korrekt.

**Prüfung:** Die `onPositionUpdate` Callback muss korrekt aufgerufen werden.

**Änderung in `usePanoViewer.ts`:**
```typescript
viewer.addEventListener('position-updated', ({ position }) => {
  callbacksRef.current?.onPositionUpdate?.({
    yaw: position.yaw,
    pitch: position.pitch
  })
})
```

**Änderung in `EditorPage.tsx`:**
```typescript
onPositionUpdate: (position: Position3D) => {
  const zoomLevel = viewerRef.current?.getZoomLevel() ?? 50
  setViewerPosition({
    yaw: position.yaw,
    pitch: position.pitch,
    zoom: zoomLevel
  })
}
```

---

## 3. Loading Overlay mit Blur-up

### 3.1 Neues Loading Overlay

**Datei:** `apps/web/src/components/viewer/LoadingOverlay.tsx`

```tsx
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  previewPath: string
  onLoaded?: () => void
}

export function LoadingOverlay({ isLoading, previewPath }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className={cn(
      'absolute inset-0 z-50 transition-opacity duration-500',
      isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      {/* Blurred Preview Background */}
      <img 
        src={previewPath} 
        alt=""
        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Loading Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-sm font-medium">Panorama wird geladen...</p>
      </div>
    </div>
  )
}
```

**Integration in `PanoViewer.tsx`:**
```tsx
<LoadingOverlay 
  isLoading={isLoading} 
  previewPath={options.previewPath} 
/>
```

---

## 4. Stats Overlay (Debug-Statistiken)

### 4.1 Neue Komponente

**Datei:** `apps/web/src/components/viewer/StatsOverlay.tsx`

```tsx
import { useEffect, useState, useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'

interface StatsData {
  fps: number
  frameTime: number
  tilesLoaded: number
  activeRequests: number
  loadTime: number
  yaw: number
  pitch: number
  zoom: number
  memoryUsed: number
  gpu: string
  resolution: string
  cacheLevel: string
  cacheSize: number
  cacheHitRate: number
  preloadedScenes: number
}

export function StatsOverlay() {
  const { showStats, viewerPosition } = useEditorStore()
  const [stats, setStats] = useState<StatsData>({...})
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

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
        const frameTime = (elapsed / frameCountRef.current).toFixed(1)
        
        setStats(prev => ({
          ...prev,
          fps,
          frameTime: parseFloat(frameTime),
          memoryUsed: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0
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

  return (
    <div className="absolute top-16 left-4 z-50 w-48 bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 text-xs font-mono">
      <div className="font-semibold mb-2 text-primary">Nerd Stats</div>
      
      <div className="space-y-1">
        <StatRow label="FPS" value={stats.fps.toString()} />
        <StatRow label="Frame Time" value={`${stats.frameTime}ms`} />
      </div>

      <div className="border-t border-border my-2" />
      
      <div className="space-y-1">
        <StatRow label="Yaw" value={`${Math.round(viewerPosition.yaw * 180 / Math.PI)}°`} />
        <StatRow label="Pitch" value={`${Math.round(viewerPosition.pitch * 180 / Math.PI)}°`} />
        <StatRow label="Zoom" value={`${Math.round(viewerPosition.zoom)}%`} />
      </div>

      <div className="border-t border-border my-2" />
      
      <div className="space-y-1">
        <StatRow label="Memory" value={`${stats.memoryUsed.toFixed(1)} MB`} />
        <StatRow label="Resolution" value={stats.resolution} />
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
```

### 4.2 Store-Erweiterung

**Änderung in `editorStore.ts`:**
```typescript
interface EditorState {
  // ... existing
  showStats: boolean
  setShowStats: (show: boolean) => void
  toggleStats: () => void
}
```

### 4.3 Settings Panel Integration

**Änderung in `SettingsPanel.tsx`:**
```typescript
const { showStats, toggleStats } = useEditorStore()

// Im JSX:
<div className="flex items-center justify-between">
  <Label htmlFor="stats">Debug-Statistiken</Label>
  <button
    onClick={toggleStats}
    className={cn(
      'w-11 h-6 rounded-full transition-colors',
      showStats ? 'bg-primary' : 'bg-secondary'
    )}
  >
    {/* ... toggle knob */}
  </button>
</div>
```

---

## 5. Dateien zu ändern

| Datei | Änderungen |
|-------|------------|
| `apps/web/src/lib/projectLoader.ts` | **NEU** - Projekt laden + transformieren |
| `apps/web/src/hooks/usePanoViewer.ts` | `switchPanorama`, `zoomIn`, `zoomOut`, `startAutorotate`, `stopAutorotate`, `getZoomLevel` |
| `apps/web/src/hooks/useEditorActions.ts` | Nav-Click: `switchPanorama` statt Store-only |
| `apps/web/src/components/viewer/PanoViewer.tsx` | Handle-Erweiterung, Loading Overlay |
| `apps/web/src/components/viewer/LoadingOverlay.tsx` | **NEU** - Blur-up Loading |
| `apps/web/src/components/viewer/StatsOverlay.tsx` | **NEU** - Debug Stats |
| `apps/web/src/components/viewer/ViewerControls.tsx` | Viewer-Ref für Zoom/Autorotate |
| `apps/web/src/components/editor/SceneStrip.tsx` | Kompaktes, mittiges Styling |
| `apps/web/src/pages/EditorPage.tsx` | Projekt laden, Viewer-Ref Props |
| `apps/web/src/stores/editorStore.ts` | `showStats` State |
| `apps/web/src/stores/projectStore.ts` | `targetScene` Feld prüfen |

---

## 6. Implementierungsreihenfolge

```
Phase 1: Core Engine (parallel)
├── 1.1 Projekt-Loader + EditorPage Integration
├── 1.2 switchPanorama in usePanoViewer
├── 1.3 zoomIn/zoomOut Methoden
└── 1.4 Autorotation Methoden

Phase 2: Fixes
├── 1.5 Nav-Arrow Click Handler
├── 2.1 SceneStrip Styling
└── 2.2 Kompass-Rotation Check

Phase 3: Polish
├── 3.1 Loading Overlay mit Blur
└── 4.1-4.3 Stats Overlay + Integration
```

---

## 7. Abhängigkeiten-Diagramm

```
loadProject() 
    │
    ▼
setProject() ──► currentPano ──► viewerOptions
                      │
                      ▼
              switchPanorama() ◄── Nav-Arrow Click
                      │
                      ▼
              refreshMarkers()
```

---

## 8. Test-Checkliste

Nach Implementierung prüfen:

- [ ] 3 Panoramen werden geladen (minedump, modern-evening, cedar-bridge)
- [ ] Szenen-Wechsel per Klick auf Thumbnail funktioniert ohne Flackern
- [ ] Nav-Arrow Klick wechselt Szene smooth
- [ ] Zoom +/- Buttons funktionieren
- [ ] Autorotation startet/stoppt per Button und Settings
- [ ] Kompass dreht sich synchron mit View
- [ ] POI-Klick im Viewer-Mode zeigt Tooltip
- [ ] POI-Klick im Editor-Mode selektiert + zeigt Properties Panel
- [ ] SceneStrip ist mittig und kompakt
- [ ] Loading Overlay zeigt blurred Preview
- [ ] Stats Overlay zeigt FPS, Position, Memory
