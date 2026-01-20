# 360° Panorama Viewer - Implementierungsplan

> **Ziel:** Performanter, mobil-optimierter 360°-Panorama-Viewer mit Editor- und Viewer-Mode, POIs, Navigation und SaaS-ready Architektur.
> **Tech-Stack:** React/TypeScript + Node.js + Photo Sphere Viewer + Vercel
> **Repository:** https://github.com/UPVIS/360-pano-viewer (Branch: `v2`)

---

## Git-Strategie: Orphan Branch

Das bestehende Repository wird mit einem **Orphan Branch** neu aufgesetzt:

```bash
# Repository klonen
git clone https://github.com/UPVIS/360-pano-viewer.git
cd 360-pano-viewer

# Orphan Branch erstellen (komplett leere History)
git checkout --orphan v2

# Alle alten Dateien aus Index entfernen
git rm -rf .

# Neues Setup aufbauen...

# Erster Commit
git add .
git commit -m "v2: Complete rewrite with React/TypeScript/PSV stack"

# Push zu GitHub
git push -u origin v2
```

**Vorteile:**
- Saubere, neue History ohne alten Ballast
- Original bleibt in `main` erhalten
- Später einfach `v2` → `main` umwandeln

---

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ PanoViewer   │ │ EditorMode   │ │ UIControls   │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Core Engine                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ PhotoSphere  │ │ Markers      │ │ VirtualTour  │             │
│  │ Viewer       │ │ Plugin       │ │ Plugin       │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ REST API     │ │ Sharp/libvips│ │ FileStorage  │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Datenstruktur                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ project.json │ │ panorama-    │ │ tiles/       │             │
│  │              │ │ configs/     │ │              │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech-Stack

| Komponente | Technologie | Begründung |
|------------|-------------|------------|
| Panorama-Engine | Photo Sphere Viewer | Feature-reich, VirtualTour+Markers integriert |
| Frontend | React 18 + TypeScript + Vite | Type-Safety, optimal für Vercel |
| Styling | Tailwind CSS + Radix UI | Minimal Dark Design |
| State | Zustand | Leichtgewichtig, TypeScript-native |
| Backend | Node.js + Hono | Konsistente Sprache, Sharp-Integration |
| Bildverarbeitung | Sharp (libvips) | 5x schneller, Tile-Generierung |
| Datenformat | JSON-Dateien | Portabel, Git-freundlich |

---

## Datenmodell

```typescript
interface Project {
  id: string
  name: string
  createdAt: string
  settings: ProjectSettings
  panoramas: Panorama[]
}

interface ProjectSettings {
  accentColor: string
  logo?: string
  autoRotate: boolean
  autoRotateSpeed: number
  showControls: boolean
  branding: BrandingConfig
}

interface Panorama {
  id: string
  name: string
  imagePath: string
  tilesPath?: string
  initialView: { yaw: number; pitch: number; fov: number }
  pitchLimits: { min: number; max: number }
  pois: PointOfInterest[]
  navArrows: NavigationArrow[]
  ambientAudio?: string
}

interface PointOfInterest {
  id: string
  position: { yaw: number; pitch: number }
  title: string
  description?: string
  content?: string  // HTML/Rich-Text
  icon?: string
}

interface NavigationArrow {
  id: string
  position: { yaw: number; pitch: number }
  targetPanoramaId: string
  label?: string
}
```

---

## Ordnerstruktur

```
360-pano-viewer/
├── apps/
│   ├── web/                    # React Frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── viewer/     # PanoramaViewer, Controls
│   │   │   │   ├── editor/     # EditorOverlay, POIEditor
│   │   │   │   └── ui/         # Button, Modal, Sidebar
│   │   │   ├── hooks/          # usePanorama, useProject
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── lib/            # PSV-Integration, utils
│   │   └── public/
│   └── api/                    # Node.js Backend
│       ├── routes/
│       ├── services/
│       │   └── image-processor.ts
│       └── storage/
├── packages/
│   └── shared/                 # Shared Types
├── projects/                   # Lokale Daten (gitignored)
└── docs/
```

---

## PHASE 0: Projekt-Setup

**Ziel:** Fundament für Entwicklung + Prototyping-Umgebung

### Tasks

#### 0.1 Git Repository Setup
```bash
git clone https://github.com/UPVIS/360-pano-viewer.git
cd 360-pano-viewer
git checkout --orphan v2
git rm -rf .
```
- [ ] `.gitignore` erstellen (node_modules, .env, projects/, dist/, .turbo/)

#### 0.2 Turborepo + pnpm Workspace
- [ ] `pnpm init` im Root
- [ ] `pnpm-workspace.yaml` erstellen
- [ ] Turborepo installieren: `pnpm add -D turbo`
- [ ] `turbo.json` konfigurieren (pipeline: dev, build, lint)

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "prototypes/*"
```

#### 0.3 Ordnerstruktur anlegen
```
360-pano-viewer/
├── apps/
│   └── web/                    # React Frontend (später)
├── packages/
│   └── shared/                 # Shared Types
├── prototypes/                 # Engine-Vergleich (Phase 1)
│   ├── psv/
│   ├── pannellum/
│   ├── marzipano/
│   └── threejs/
├── test-assets/                # Test-Panoramen
│   └── sample-4k.jpg
├── docs/
│   └── ENGINE_COMPARISON.md
└── projects/                   # Lokale Daten (gitignored)
```

#### 0.4 Tooling (Minimal für Prototypen)
- [ ] ESLint + Prettier im Root
- [ ] TypeScript Base-Config (`tsconfig.base.json`)
- [ ] Simple HTTP Server für Prototypen (`npx serve`)

#### 0.5 Test-Panorama vorbereiten
- [ ] Sample 4K Equirectangular Bild in `test-assets/`
- [ ] Verschiedene Formate: JPG, WebP

#### 0.6 Erster Commit
```bash
git add .
git commit -m "v2: Initial setup with Turborepo + Prototyping structure"
git push -u origin v2
```

**Deliverable:** 
- Lauffähige Workspace-Struktur auf Branch `v2`
- Prototyping-Ordner vorbereitet
- Test-Panorama bereit

**Hinweis:** Backend (Hono API) wird erst in Phase 5 aufgesetzt. Tests ab Phase 2.

---

## PHASE 1: Engine-Vergleich & Technologie-Entscheidung

**Ziel:** 4 Engines vergleichen, datenbasierte Entscheidung treffen

### Zu testende Engines

| Engine | Typ | Erwartete Stärken |
|--------|-----|-------------------|
| Photo Sphere Viewer | Three.js-basiert | Feature-reich, Plugins |
| Pannellum | Standalone WebGL | Ultra-leicht (21KB) |
| Marzipano | Standalone | Performance-optimiert |
| Three.js direkt | Low-Level | Maximale Kontrolle |

### Bewertungskriterien

| Kriterium | Gewichtung | Messmethode |
|-----------|------------|-------------|
| Initiale Ladezeit | Hoch | Chrome DevTools Network |
| FPS bei Navigation | Hoch | DevTools Performance |
| Bundle Size | Mittel | gzip-Größe messen |
| Mobile Performance | Hoch | DevTools Throttling |
| Erweiterbarkeit | Hoch | API-Analyse |
| Touch-Gesten | Hoch | Manuelle Bewertung |

### Tasks

#### 1.1 Prototyp: Photo Sphere Viewer
Datei: `prototypes/psv/index.html`
- [ ] PSV + MarkersPlugin via CDN einbinden
- [ ] 4K Equirectangular laden
- [ ] Basis-Navigation (Drag, Zoom, Touch)
- [ ] **Hotspot-Test (vollständig):**
  - [ ] Statischer Marker mit Icon
  - [ ] Klick-Event + Tooltip
  - [ ] Custom HTML Content im Marker
  - [ ] Drag-Repositionierung (falls möglich)
- [ ] Performance messen + dokumentieren

#### 1.2 Prototyp: Pannellum
Datei: `prototypes/pannellum/index.html`
- [ ] Pannellum via CDN einbinden
- [ ] 4K Equirectangular laden
- [ ] Basis-Navigation testen
- [ ] **Hotspot-Test (vollständig):**
  - [ ] Hotspot mit Icon
  - [ ] Klick-Event + Tooltip
  - [ ] Custom HTML in Tooltip
  - [ ] Drag-Repositionierung testen
- [ ] Performance messen + dokumentieren

#### 1.3 Prototyp: Marzipano
Datei: `prototypes/marzipano/index.html`
- [ ] Marzipano via CDN einbinden
- [ ] 4K Equirectangular laden
- [ ] Basis-Navigation testen
- [ ] **Hotspot-Test:**
  - [ ] Hotspot-Implementierung recherchieren
  - [ ] Falls möglich: vollständiger Test
- [ ] Performance messen + dokumentieren

#### 1.4 Prototyp: Three.js direkt
Datei: `prototypes/threejs/index.html`
- [ ] Three.js + OrbitControls via CDN
- [ ] SphereGeometry + Equirectangular Texture
- [ ] Basis-Navigation
- [ ] **Hotspot-Test (custom):**
  - [ ] CSS2DRenderer oder Sprite für Marker
  - [ ] Raycasting für Klick-Detection
  - [ ] Aufwand für Custom HTML bewerten
- [ ] Performance messen + dokumentieren
- [ ] **Aufwand-Einschätzung:** Wie viel müsste selbst gebaut werden?

#### 1.5 Vergleichs-Dokumentation
Datei: `docs/ENGINE_COMPARISON.md`
- [ ] Tabelle mit allen Messwerten
- [ ] Screenshots der DevTools
- [ ] Subjektive Bewertung (DX, Code-Qualität)
- [ ] Empfehlung mit Begründung

#### 1.6 Entscheidungs-Meeting
- [ ] Ergebnisse präsentieren
- [ ] Gemeinsam finale Engine wählen
- [ ] Entscheidung im Plan dokumentieren

### Mess-Template pro Engine

```markdown
## [Engine Name]

### Ladezeit
- Time to First Paint: ___ms
- Time to Interactive: ___ms
- Vollständig geladen: ___ms

### Performance
- FPS (Desktop): ___
- FPS (Mobile Simulation): ___
- CPU Usage: ___%

### Bundle
- Gesamt (gzip): ___KB
- Nur Engine: ___KB

### Erweiterbarkeit
- Plugin-System: ja/nein
- Custom Marker: einfach/mittel/schwer
- Dokumentation: gut/mittel/schlecht

### Touch
- Drag: ⭐⭐⭐⭐⭐
- Pinch-Zoom: ⭐⭐⭐⭐⭐
- Inertia: ⭐⭐⭐⭐⭐

### Fazit
[1-2 Sätze]
```

**Deliverable:** 
- 4 funktionierende HTML-Prototypen
- Vergleichs-Dokumentation mit Messwerten
- Gemeinsam getroffene Engine-Entscheidung

**Hinweis:** Tile-Streaming wird erst in Phase 2 getestet (nach Engine-Entscheidung)

---

## PHASE 2: MVP Core Viewer

**Ziel:** Performanter Single-Panorama Viewer mit vollständigen Controls
**Entscheidung:** Photo Sphere Viewer als Engine

### Strategie
1. Prototyp erweitern (kein React-Setup in Phase 2)
2. Fokus auf Viewer-Funktionalität
3. Tile-Streaming am Ende von Phase 2

### 2.1 Viewer-Container & Responsive
- [ ] Fullscreen-Container (100vh, 100vw)
- [ ] Mobile-first CSS
- [ ] Touch-optimierte Interaktion
- [ ] Orientierungswechsel (Portrait/Landscape)

### 2.2 Loading-System (Blur-up)
- [ ] Low-res Preview-Bild generieren (256px)
- [ ] Blur-up Effekt beim Laden
- [ ] Smooth Transition zu High-res
- [ ] Loading-Spinner als Fallback

### 2.3 Panorama-Einstellungen
- [ ] Initial View Direction (yaw, pitch, fov)
- [ ] Pitch-Limits konfigurierbar pro Panorama
- [ ] Default Pitch-Limits: -30° bis +30°
- [ ] FOV-Limits (min: 30°, max: 120°)
- [ ] Auto-Rotate (ein/aus, Speed einstellbar)

### 2.4 UI-Controls (Vollständig)
- [ ] Fullscreen-Button
- [ ] Zoom +/- Buttons
- [ ] Autorotate Toggle
- [ ] Kompass-Anzeige (zeigt Blickrichtung)
- [ ] Szenen-Liste (Thumbnails der Panoramen)
- [ ] Share-Button (Link kopieren)
- [ ] Settings-Button (öffnet Einstellungs-Panel)
- [ ] Mobile: Touch-freundliche Button-Größen

### 2.5 Keyboard & Accessibility
- [ ] Pfeiltasten für Navigation
- [ ] ESC zum Schließen von Overlays
- [ ] ARIA-Labels für Screen Reader
- [ ] Fokus-Management

### 2.6 Tile-Streaming (Ende Phase 2)
- [ ] Sharp-Script: 4K → Multi-Resolution Tiles
- [ ] Tile-Levels: 256px, 512px, 1024px
- [ ] PSV Multiresolution-Adapter
- [ ] Lazy Loading der Tiles
- [ ] Viewport-basiertes Streaming

### 2.7 Performance
- [ ] Memory Management (alte Tiles entladen)
- [ ] Lighthouse Mobile Score > 90
- [ ] FPS-Monitoring einbauen

**Deliverable:** Performanter Viewer, alle Basis-Controls

---

## PHASE 3: Multi-Panorama & Navigation

**Ziel:** Mehrere Panoramen verknüpfen

### Tasks
- [ ] VirtualTourPlugin Integration
- [ ] Mehrere Panoramen laden
- [ ] Szenen-Wechsel mit Fade-Transition
- [ ] Navigations-Pfeil Marker erstellen
- [ ] Klick → Smooth Transition
- [ ] Label-Anzeige (Hover/Touch)
- [ ] `project.json` Schema definieren
- [ ] Load/Save Projekt implementieren
- [ ] Panorama hinzufügen/entfernen

**Deliverable:** Multi-Panorama Tour mit Navigation

---

## PHASE 4: Editor Mode

**Ziel:** Vollständiger visueller Editor

### Tasks

#### 4.1 Mode-Switching
- [ ] Editor/Viewer Toggle
- [ ] URL-Parameter für Modus
- [ ] Conditional UI Rendering

#### 4.2 Overlay UI (Figma-Style)
- [ ] Floating Toolbar (oben)
- [ ] Panorama-Liste Panel (links)
- [ ] Properties Panel (rechts, kontextabhängig)
- [ ] Minimal Dark Design
- [ ] Dezente Glassmorphism-Effekte

#### 4.3 POI-Management
- [ ] POI hinzufügen (Klick auf Position)
- [ ] POI bearbeiten (Panel öffnet sich)
- [ ] POI verschieben (Drag & Drop)
- [ ] POI löschen

#### 4.4 POI-Content Editor
- [ ] TinyMCE oder Tiptap Integration
- [ ] Text, Bilder, Videos, Links
- [ ] Preview im Editor

#### 4.5 Navigations-Pfeil Editor
- [ ] Pfeil platzieren
- [ ] Ziel-Panorama auswählen (Dropdown)
- [ ] Label setzen

#### 4.6 Panorama-Einstellungen
- [ ] Initial View setzen ("Von hier starten")
- [ ] Pitch-Limits anpassen (Slider)
- [ ] Reihenfolge ändern (Drag)

**Deliverable:** Vollständiger Editor für Panoramen, POIs, Navigation

---

## PHASE 5: Persistenz & API

**Ziel:** Backend, Upload, Auto-Save

### Tasks

#### 5.1 Backend API
- [ ] `GET /api/projects` - Liste
- [ ] `GET /api/projects/:id` - Projekt laden
- [ ] `PUT /api/projects/:id` - Speichern
- [ ] `POST /api/projects/:id/panoramas` - Upload

#### 5.2 Bild-Upload Pipeline
- [ ] Multer für Upload
- [ ] Sharp: Resize, Tiles, WebP
- [ ] Fortschrittsanzeige Frontend

#### 5.3 Datei-Struktur
```
projects/
└── {projectId}/
    ├── project.json
    ├── panoramas/
    │   ├── {panoId}/
    │   │   ├── original.jpg
    │   │   ├── preview.webp
    │   │   └── tiles/
    │   │       ├── 0/  (low-res)
    │   │       ├── 1/  (medium)
    │   │       └── 2/  (high-res)
    └── assets/
        └── logo.png
```

#### 5.4 Auto-Save
- [ ] Debounced Save bei Änderungen
- [ ] Optimistic Updates
- [ ] Save-Indikator UI

**Deliverable:** Vollständige Persistenz, Upload funktioniert

---

## PHASE 6: Branding & Customization

**Ziel:** White-Label Fähigkeit

### Tasks
- [ ] Logo Upload
- [ ] Akzentfarbe wählen (Color Picker)
- [ ] Logo-Position konfigurierbar
- [ ] Control-Buttons stylen
- [ ] Show/Hide individuelle Controls
- [ ] CSS-Variablen für Theming
- [ ] iframe-fähige Viewer-Route
- [ ] Responsive Embed-Code Generator
- [ ] CSP-Headers für Embedding

**Deliverable:** Gebrandete Viewer, Embed-ready

---

## PHASE 7: Audio Integration

**Ziel:** Ambient Sound + Audio-POIs

### Tasks
- [ ] Audio-Datei pro Panorama
- [ ] Autoplay mit Mute-Button
- [ ] Fade bei Szenen-Wechsel
- [ ] Neuer POI-Typ: Audio
- [ ] Play/Pause Controls
- [ ] Transkript-Option (Accessibility)

**Deliverable:** Audio-Features funktionieren

---

## PHASE 8: Advanced Features

**Ziel:** Autoplay, Fullscreen, Sharing

### Tasks

#### 8.1 Autoplay-Modus
- [ ] Szenen-Sequenz definieren
- [ ] Start/End-View pro Szene
- [ ] Dauer pro Szene
- [ ] Loop-Option

#### 8.2 Fullscreen
- [ ] Native Fullscreen API
- [ ] Responsive UI-Anpassung
- [ ] ESC zum Beenden

#### 8.3 Sharing
- [ ] Projekt-Link generieren
- [ ] Embed-Code kopieren
- [ ] QR-Code generieren

**Deliverable:** Fertige Viewer-Features

---

## PHASE 9: SaaS-Vorbereitung

**Ziel:** Produktionsreife, Security, Testing

### Tasks

#### 9.1 Multi-Tenancy Vorbereitung
- [ ] Projekt-Isolation
- [ ] User-ID in Pfaden
- [ ] Rate Limiting vorbereiten

#### 9.2 Storage-Optimierung
- [ ] Kompressionsoptionen
- [ ] Duplikat-Erkennung
- [ ] Cleanup alte Tiles

#### 9.3 Security
- [ ] Input-Validierung (Zod)
- [ ] File-Type Validation
- [ ] XSS-Prevention im HTML-Content
- [ ] CORS-Konfiguration
- [ ] Helmet.js Headers

#### 9.4 Testing
- [ ] Vitest Unit Tests
- [ ] Playwright E2E Tests
- [ ] Performance-Regression Tests
- [ ] Mobile Device Testing

**Deliverable:** Produktionsreife, sichere Anwendung

---

## PHASE 10: Zukunfts-Features (Backlog)

> Diese Features sind dokumentiert für spätere Implementierung

### 10.1 Minimap/Grundriss
- Grundriss-Upload
- Panorama-Positionen auf Karte markieren
- Klick auf Karte → Panorama wechseln

### 10.2 3D-Übergänge
- Point-Cloud Generierung
- Smooth Fly-Through Effekt
- Depth-Estimation (ML-basiert)

### 10.3 Custom Domains
- DNS-Verifizierung
- SSL-Zertifikate
- Subdomain-Routing

### 10.4 Admin-Dashboard
- Nutzungsstatistiken
- Storage-Übersicht
- User-Management

### 10.5 Payment Integration
- Stripe Integration
- Abo-Modelle
- Usage-Based Billing

---

## Prinzipien

| Prinzip | Beschreibung |
|---------|--------------|
| **Mobile-First** | Jede Komponente zuerst für Touch optimiert |
| **Progressive Enhancement** | Basis funktioniert ohne erweiterte Features |
| **Lazy Loading** | Nur laden was sichtbar ist |
| **Lokal First** | Alles läuft lokal bis zum expliziten Deploy-Befehl |
| **Type-Safety** | Strict TypeScript durchgängig |
| **Clean Git** | Atomic Commits, Feature-Branches |
| **Testbar** | Komponenten isoliert testbar |
| **Security-First** | Validierung, Sanitization von Anfang an |

---

## Entscheidungen (Design Decisions)

| Entscheidung | Wahl | Alternativen |
|--------------|------|--------------|
| Panorama-Engine | Photo Sphere Viewer | Pannellum (leichter), Marzipano |
| Frontend Framework | React + TypeScript | Vue, Svelte, Vanilla |
| State Management | Zustand | Redux, Jotai, Context |
| Styling | Tailwind + Radix | styled-components, CSS Modules |
| Backend | Node.js + Hono | Express, Fastify |
| Bildverarbeitung | Sharp | ImageMagick, Jimp |
| Datenformat | JSON Files | SQLite, PostgreSQL |
| Editor Style | Overlay Panels | Sidebar, Floating |
| POI Interaction | Hover + Click | Click only |
| Design | Minimal Dark | Light, Glassmorphism |

---

## Quick Reference

### Starten
```bash
pnpm install
pnpm dev
```

### Projekt erstellen
```bash
pnpm run create-project "Mein Projekt"
```

### Build
```bash
pnpm build
```

### Tests
```bash
pnpm test
pnpm test:e2e
```

---

## Ressourcen

- [Photo Sphere Viewer Docs](https://photo-sphere-viewer.js.org/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
