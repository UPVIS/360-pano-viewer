# Fehlende Features - Detaillierte Analyse

## Status-Übersicht

| Bereich | Prototyp | React-App | Status |
|---------|----------|-----------|--------|
| Multi-Szenen | 3 echte Panoramen | Nur 1 Dummy | FEHLT |
| Szenen-Wechsel | Funktioniert | Lädt Viewer neu | DEFEKT |
| POI-Klick Viewer | Zeigt Tooltip | Nichts passiert | DEFEKT |
| Nav-Arrow Klick | Wechselt Szene | Lädt Viewer neu | DEFEKT |
| Zoom Buttons | Funktioniert | Keine Aktion | FEHLT |
| Autorotation | Start/Stop | Keine Wirkung | DEFEKT |
| Kompass-Rotation | Dreht mit Viewer | Statisch | DEFEKT |
| Debug-Stats | Vollständig | Fehlt komplett | FEHLT |
| Szenen-Panel Style | Kompakt, mittig | Breit, links-rechts | FALSCH |
| Loading Overlay | Blur-up, Progress | Minimal | FEHLT |

---

## 1. Demo-Projekt mit echten Panoramen

### Problem
Die React-App verwendet nur ein statisches Dummy-Projekt mit einem Panorama.

### Lösung
Projekt aus `/test-assets/demo-project.json` laden:

```typescript
// EditorPage.tsx - statt DEMO_PROJECT
useEffect(() => {
  fetch('/test-assets/demo-project.json')
    .then(res => res.json())
    .then(data => setProject(transformProject(data)))
}, [])
```

### Vorhandene Panoramen
- `minedump` - Weite Ebene (mit POI + 2 NavArrows)
- `modern-evening` - Abendstraße (mit POI + 2 NavArrows)
- `cedar-bridge` - Brücke mit Sonnenuntergang (mit POI + 2 NavArrows)

Jedes hat bereits POIs und NavArrows definiert!

---

## 2. Szenen-Wechsel ohne Viewer-Neuladung

### Problem
Bei Szenenwechsel wird der gesamte Viewer zerstört und neu erstellt. Das führt zu:
- Langsamem Laden
- Flackern
- Verlust des Viewer-States

### Prototyp-Lösung (Zeilen 4054-4111)
```javascript
async function switchScene(targetSceneId) {
  // Transition overlay anzeigen
  // Neue Tiles laden via viewer.setPanorama()
  // Marker aktualisieren
  // Ohne viewer.destroy()!
}
```

### React-Lösung
`usePanoViewer` muss `setPanorama()` exponieren:

```typescript
const switchPanorama = useCallback(async (tilesPath: string, previewPath: string) => {
  if (!viewerRef.current) return
  
  const manifest = await fetch(`${tilesPath}manifest.json`).then(r => r.json())
  const levelIndex = Math.min(1, manifest.levels.length - 1)
  const level = manifest.levels[levelIndex]
  
  await viewerRef.current.setPanorama({
    width: level.width,
    cols: level.cols,
    rows: level.rows,
    baseUrl: previewPath,
    tileUrl: (col: number, row: number) => 
      `${tilesPath}level-${levelIndex}/row-${row}/tile-${col}.webp`
  })
}, [])
```

---

## 3. Zoom-Funktionalität

### Problem
Zoom-Buttons rufen leere Funktionen auf.

### Lösung
```typescript
// usePanoViewer.ts - neue Methoden
const zoomIn = useCallback(() => {
  const current = viewerRef.current?.getZoomLevel() ?? 50
  viewerRef.current?.zoom(Math.min(100, current + 10))
}, [])

const zoomOut = useCallback(() => {
  const current = viewerRef.current?.getZoomLevel() ?? 50
  viewerRef.current?.zoom(Math.max(0, current - 10))
}, [])
```

Diese müssen dann an ViewerControls weitergegeben werden.

---

## 4. Autorotation

### Problem
Toggle ändert nur State, startet aber nicht den Viewer.

### Lösung
Der Viewer-Hook muss die Autorotation steuern:

```typescript
// usePanoViewer.ts
const startAutorotate = useCallback(() => {
  autorotatePluginRef.current?.start()
}, [])

const stopAutorotate = useCallback(() => {
  autorotatePluginRef.current?.stop()
}, [])
```

Diese müssen dann mit dem Store-State synchronisiert werden.

---

## 5. Kompass-Rotation

### Problem
Kompass ist statisch, dreht sich nicht mit der View.

### Aktueller Code
`onPositionUpdate` Callback ist implementiert, aber `setViewerPosition` erhält die Werte in Radianten, nicht Grad.

### Lösung
Position-Updates korrekt an Store weiterleiten und Compass.tsx verwendet `viewerPosition.yaw` bereits.

---

## 6. Szenen-Panel Styling

### Problem
Panel ist zu breit und nimmt volle Breite ein (left-4 right-4).

### Prototyp-Styling (Zeilen 1005-1045)
```css
.scenes-panel {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  max-width: 90vw;
  padding: 8px;
  gap: 8px;
}

.scene-thumb {
  width: 100px;
  height: 70px;
}
```

### Lösung
SceneStrip.tsx anpassen:
- `left-4 right-4` → `left-1/2 -translate-x-1/2 max-w-[90vw]`
- Thumbnails kleiner: `w-24 h-16` statt `w-28 h-20`
- Mehr Abstand zum unteren Rand (über den Controls)

---

## 7. Debug-Statistiken

### Prototyp-Features (Zeilen 1862-1959)
- FPS + Frame Time
- Tiles Loaded / Requests
- Load Time
- Yaw / Pitch / Zoom
- Memory Usage
- GPU Info
- Resolution
- Cache Level / Size / Hit Rate
- Preloaded Scenes

### Lösung
Neues `StatsOverlay` Komponente:

```typescript
// components/viewer/StatsOverlay.tsx
export function StatsOverlay() {
  // Performance.now() für FPS
  // performance.memory für Memory
  // Viewer-State für Position
}
```

Toggle in SettingsPanel einbauen.

---

## 8. Loading Overlay mit Blur-up

### Problem
Minimaler Loading-Spinner statt Blur-up Effekt wie im Prototyp.

### Prototyp (Zeilen 1734-1742)
```html
<div id="loading-overlay">
  <img id="loading-preview" src="preview.webp" alt="">
  <div class="loading-content">
    <div class="loading-spinner"></div>
    <div class="loading-text">Panorama wird geladen...</div>
    <div class="loading-progress"></div>
  </div>
</div>
```

- Preview-Bild als Hintergrund (blur-Filter)
- Spinner + Progress-Text darüber
- Fade-out bei Ready

### Lösung
PanoViewer.tsx erweitern:

```tsx
{isLoading && (
  <div className="absolute inset-0 z-10">
    {/* Blurred Preview Background */}
    <img 
      src={options.previewPath} 
      className="w-full h-full object-cover blur-xl scale-110"
    />
    {/* Spinner Overlay */}
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <Loader2 className="animate-spin" />
      <span>Panorama wird geladen...</span>
    </div>
  </div>
)}
```

---

## 9. POI-Tooltip im Viewer-Mode

### Problem
Klick auf POI zeigt nichts oder verhält sich falsch.

### Analyse
- `activePoiTooltip` wird in EditorPage gesetzt
- Aber die POI-Daten aus dem Demo-Projekt haben `description`, nicht `content.html`
- PoiTooltip erwartet `content.html`

### Lösung
PoiTooltip.tsx anpassen, um beide Formate zu unterstützen:

```typescript
case 'info':
  if (content?.html) {
    return <div dangerouslySetInnerHTML={{ __html: content.html }} />
  }
  return <p>{poi.description || 'Keine Beschreibung'}</p>
```

---

## 10. Navigation Arrow Klick

### Problem
Klick auf Nav-Arrow lädt Viewer neu statt Szene zu wechseln.

### Aktueller Code (useEditorActions.ts)
```typescript
if (data.type === 'nav' && data.targetPanoramaId) {
  useProjectStore.getState().setCurrentScene(data.targetPanoramaId)
}
```

Dies ändert nur den State, was einen Re-Render triggert und den Viewer neu initialisiert.

### Lösung
Statt `setCurrentScene` muss `switchPanorama()` aufgerufen werden:

```typescript
if (data.type === 'nav' && data.targetPanoramaId) {
  const targetPano = useProjectStore.getState().getPanoramaById(data.targetPanoramaId)
  if (targetPano) {
    // Szene im Store setzen OHNE Viewer-Neustart
    useProjectStore.getState().setCurrentScene(data.targetPanoramaId)
    // Dann Panorama wechseln via setPanorama
    switchPanorama(targetPano.tilesPath, targetPano.previewPath)
    // Marker aktualisieren
    refreshMarkers()
  }
}
```

---

## Implementierungs-Reihenfolge

1. **Demo-Projekt laden** - Echte Panoramen mit POIs/NavArrows
2. **switchPanorama Methode** - Szenen-Wechsel ohne Neustart
3. **Zoom verbinden** - Buttons an Viewer anbinden
4. **Autorotation verbinden** - Plugin starten/stoppen
5. **Kompass verbinden** - Position-Updates
6. **Szenen-Panel Styling** - Kompakter, mittig
7. **Nav-Arrow Klick fixen** - switchPanorama statt setCurrentScene
8. **Loading Overlay** - Blur-up Effekt
9. **Stats-Overlay** - Debug-Informationen (optional)

---

## Dateien zu ändern

| Datei | Änderungen |
|-------|------------|
| `EditorPage.tsx` | Demo-Projekt laden, Viewer-Ref weitergeben |
| `usePanoViewer.ts` | `switchPanorama()`, `zoomIn()`, `zoomOut()`, `startAutorotate()`, `stopAutorotate()` |
| `useEditorActions.ts` | switchPanorama statt setCurrentScene bei Nav-Klick |
| `ViewerControls.tsx` | Viewer-Ref Props, Zoom/Autorotate verbinden |
| `SceneStrip.tsx` | Kompakteres Styling, Position mittig |
| `SettingsPanel.tsx` | Stats-Toggle verbinden |
| `PanoViewer.tsx` | Loading Overlay mit Preview-Blur |
| `projectStore.ts` | Projekt-Transformation von JSON (targetPanoramaId -> targetScene) |
| `PoiTooltip.tsx` | description als Fallback wenn kein content.html |
| `Compass.tsx` | Prüfen ob yaw korrekt in Grad umgerechnet wird |
