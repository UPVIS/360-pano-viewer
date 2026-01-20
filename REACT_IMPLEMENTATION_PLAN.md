# 360° Panorama SaaS App - React Implementation Plan

> **Ziel:** Vollständige SaaS-App mit Editor und Viewer
> **Tech-Stack:** React 18 + TypeScript + Vite + shadcn/ui + Hono + Supabase
> **Basis:** Funktionierender Vanilla JS Prototyp (`prototypes/psv/viewer-tiles.html`)
> **Ansatz:** Sauberer Rewrite als React-Komponenten (kein Copy-Paste)
> **Repository:** https://github.com/UPVIS/360-pano-viewer (Branch: `v2`)

---

## Git-Strategie & Deployment

### Aktueller Stand

- **Repository:** https://github.com/UPVIS/360-pano-viewer
- **Aktueller Branch:** `v2` (Orphan Branch mit Prototyp)
- **Vercel-Projekt:** https://vercel.com/upvis/360-pano-viewer (bereits verbunden)

### Entwicklungs-Workflow

```
1. LOKAL ENTWICKELN (aktuell)
   - Lokaler Dev-Server (pnpm dev)
   - Alle Tests lokal
   - Kein Deployment bis explizite Freigabe

2. GITHUB PUSH (wenn bereit)
   - git push zu v2 Branch
   - Noch kein Auto-Deploy

3. VERCEL DEPLOYMENT (später)
   - v2 → main Branch machen
   - Vercel Auto-Deploy aktivieren
   - Build-Konfiguration anpassen
```

### Branch-Strategie

```
main (alt)     → Bleibt erstmal, wird später ersetzt
    │
v2 (aktuell)   → Neue Entwicklung
    │
    └──→ main (neu)  → Wenn v2 produktionsreif ist
```

### Vercel-Konfiguration (später)

```json
// vercel.json (wenn Deployment startet)
{
  "buildCommand": "pnpm build",
  "outputDirectory": "apps/web/dist",
  "installCommand": "pnpm install",
  "framework": "vite"
}
```

### Wichtig

- **KEIN Deployment** bis explizit angefordert
- Alle Tests laufen **lokal** über `pnpm dev`
- Git-Commits können jederzeit auf `v2` gepusht werden (ohne Auto-Deploy)

---

## Entwicklungs-Strategie

### Prinzip: Schrittweise Entwicklung

```
Phase 1: Turborepo + Viewer (lokal, ohne Backend)
    ↓
Phase 2: Volles Layout + Placeholder-Seiten
    ↓
Phase 3: Editor-Funktionen
    ↓
Phase 4: Backend + Persistenz
    ↓
Phase 5: Auth + User-Management
    ↓
Phase 6: Payments (später)
```

### Was kommt ZUERST:
1. Turborepo-Struktur aufsetzen
2. React-Viewer mit lokalen test-assets zum Laufen bringen
3. Editor-Mode (POIs, Navigation) direkt mit dabei

### Was kommt SPÄTER:
- Authentifizierung (Placeholder-UI zuerst)
- Backend/API (lokale JSON-Dateien zuerst)
- User-Profil, Zahlungsdaten (ausgegraut)

---

## Tech-Stack

| Komponente | Technologie | Anmerkung |
|------------|-------------|-----------|
| **Monorepo** | Turborepo + pnpm | Skalierbare Struktur |
| **Frontend** | React 18 + TypeScript + Vite | |
| **UI-Komponenten** | **shadcn/ui** | Für ALLES außer Viewer-Canvas |
| **Styling** | Tailwind CSS | Dark Mode |
| **State** | Zustand | Leichtgewichtig |
| **Routing** | React Router | Alle Routes von Anfang an |
| **Panorama** | Photo Sphere Viewer | Aus Prototyp |
| **Backend** | Hono | Später |
| **Datenbank** | Supabase | Später |
| **Auth** | Supabase Auth | Später |

---

## shadcn/ui Komponenten

### Zu verwendende Komponenten:

| Bereich | shadcn/ui Komponenten |
|---------|----------------------|
| **Layout** | `Card`, `Separator`, `ScrollArea` |
| **Navigation** | `NavigationMenu`, `DropdownMenu`, `Tabs` |
| **Formulare** | `Input`, `Label`, `Select`, `Slider`, `Switch`, `Textarea` |
| **Buttons** | `Button`, `Toggle`, `ToggleGroup` |
| **Overlays** | `Dialog`, `Sheet`, `Popover`, `Tooltip`, `ContextMenu` |
| **Feedback** | `Toast`, `Progress`, `Skeleton` |
| **Daten** | `Avatar`, `Badge` |

### NICHT shadcn/ui:
- Der Panorama-Viewer selbst (PSV + Three.js)
- Custom Marker-Styles
- Szenen-Strip (custom, aber mit shadcn-Buttons)

---

## User Journey (Vollständig)

### 1. Erster Besuch (nicht eingeloggt)
```
Besucher → Login-Seite
           ├── Anmelden (bestehender User)
           └── Registrieren (neuer User)
```

### 2. Nach Registrierung/Login
```
→ Dashboard (leer bei neuem User)
  └── "Erstes Projekt erstellen" CTA
```

### 3. Neues Projekt erstellen
```
Klick "Neues Projekt"
  → Dialog: Projekt-Name eingeben
  → Editor öffnet sich
  → Empty State: "Lade dein erstes Panorama hoch"
  → Upload-Button klicken
  → Upload-Dialog (Drag & Drop, Multi-Select)
  → Verarbeitung (Tiles generieren, Progress-Bar)
  → Erstes Panorama wird angezeigt, alle in Timeline
```

### 4. Im Editor
```
Viewer-Mode ←→ Editor-Mode (Toggle-Button)

Editor-Mode:
  - POIs hinzufügen (Klick auf Position)
  - Navigation-Pfeile setzen
  - Szenen umordnen (Drag in Timeline)
  - Einstellungen (Initial-View, Pitch-Limits)
  
Alle Änderungen → Auto-Save
```

### 5. Projekt-Einstellungen
```
/project/:id/settings (separate Seite)
  - Name ändern
  - Branding (Logo, Farben)
  - Projekt löschen
```

### 6. Teilen
```
Klick "Teilen"-Button im Editor
  → Modal mit:
     - Fullscreen-Link + Copy-Button
     - iframe-Code + Copy-Button
```

### 7. Public Viewer (Share-Link)
```
Externer Besucher öffnet Link
  → Nur Viewer (kein Editor, kein Login-Hinweis)
  → Kann navigieren, POIs anklicken
```

### 8. User-Profil
```
User-Menu (Header rechts) → "Einstellungen"
  → /settings Seite
     - Profil (Name, Email, Avatar)
     - Passwort ändern
     - Zahlungen (ausgegraut, später)
```

---

## Seiten-Struktur

| Route | Status Phase 1 | Beschreibung |
|-------|----------------|--------------|
| `/` | Redirect zu `/dashboard` | |
| `/login` | **Placeholder UI** | Login-Form ohne Funktion |
| `/register` | **Placeholder UI** | Register-Form ohne Funktion |
| `/dashboard` | **Placeholder UI** | Projekt-Grid mit Dummy-Daten |
| `/project/:id` | **Funktional** | Editor + Viewer (Hauptfokus) |
| `/view/:id` | **Funktional** | Public Viewer |
| `/embed/:id` | **Funktional** | iframe Viewer |
| `/settings` | **Placeholder UI** | Profil, Zahlungen (ausgegraut) |

---

## Phase 1: Turborepo + Viewer

### Ziel
React-Viewer lädt lokale test-assets und funktioniert wie der Prototyp.

### 1.1 Turborepo Setup

```bash
# Struktur erstellen
360-pano-viewer/
├── apps/
│   └── web/              # React Frontend
├── packages/
│   └── shared/           # Types
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Tasks:**
- [ ] pnpm Workspace initialisieren
- [ ] Turborepo konfigurieren
- [ ] `apps/web` mit Vite + React + TypeScript erstellen
- [ ] Tailwind CSS + Dark Mode einrichten
- [ ] shadcn/ui initialisieren
- [ ] `packages/shared` für Types erstellen

### 1.2 Basis-Komponenten (shadcn/ui)

**Zu installierende shadcn/ui Komponenten:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add toggle
npx shadcn-ui@latest add toggle-group
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add context-menu
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add skeleton
```

### 1.3 React-Viewer Komponenten

**Sauberer Rewrite der Prototyp-Logik:**

```
src/components/viewer/
├── PanoViewer.tsx           # Haupt-Container, PSV-Integration
├── ViewerControls.tsx       # Zoom, Fullscreen, Autorotate
├── ViewerSettings.tsx       # Settings-Sheet (shadcn Sheet)
├── SceneStrip.tsx           # Szenen-Timeline unten
├── SceneCard.tsx            # Einzelne Szene in der Timeline
└── hooks/
    ├── usePanoViewer.ts     # PSV Lifecycle
    ├── useViewerState.ts    # Zustand Store
    └── useKeyboardShortcuts.ts
```

**Viewer-Features (wie Prototyp):**
- [ ] PSV mit EquirectangularTilesAdapter
- [ ] Lokale Tiles laden (`test-assets/tiles/`)
- [ ] Zoom-basiertes Level-Switching
- [ ] Szenen-Wechsel mit Transition
- [ ] Marker (POIs + Navigation)
- [ ] Controls (Zoom, Fullscreen, Autorotate)
- [ ] Settings-Panel (shadcn Sheet)
- [ ] Keyboard-Shortcuts

### 1.4 Test-Assets einbinden

**Vorhandene Dateien nutzen:**
```
test-assets/
├── demo-project.json        # Projekt-Definition
├── tiles/
│   ├── sample/              # Szene 1
│   │   ├── manifest.json
│   │   ├── preview.webp
│   │   └── level-0/, level-1/, level-2/
│   └── sample-2/            # Szene 2 (falls vorhanden)
```

**Laden in React:**
- Dateien in `public/test-assets/` kopieren oder symlinken
- `demo-project.json` per fetch laden
- Tiles relativ zum public-Ordner laden

---

## Phase 2: Volles Layout + Placeholder-Seiten

### Ziel
Alle Seiten existieren mit UI, aber ohne Backend-Logik.

### 2.1 App-Layout

```tsx
// src/components/layout/AppLayout.tsx
<div className="min-h-screen bg-background">
  <Header />           {/* Logo, Navigation, User-Menu */}
  <main>
    <Outlet />         {/* React Router */}
  </main>
</div>
```

**Header-Komponente (shadcn):**
- Logo (links)
- Navigation: Dashboard, Projekte
- User-Menu (DropdownMenu): Profil, Einstellungen, Logout

### 2.2 Placeholder-Seiten

**Login/Register (`/login`, `/register`):**
```
┌─────────────────────────────────────┐
│         ┌─────────────────┐         │
│         │     LOGO        │         │
│         └─────────────────┘         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Card (shadcn)              │   │
│   │  Tabs: Anmelden/Registrieren│   │
│   │  Input: Email               │   │
│   │  Input: Passwort            │   │
│   │  Button: Anmelden           │   │
│   │  Separator                  │   │
│   │  Button: Google             │   │
│   │  Button: GitHub             │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```
- Forms ohne Funktion (console.log bei Submit)
- "Demo-Login" Button → Redirect zu Dashboard

**Dashboard (`/dashboard`):**
```
┌────────────────────────────────────────────────────┐
│  [Header]                                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Meine Projekte                                    │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Card     │  │ Card     │  │ Card     │         │
│  │ [thumb]  │  │ [thumb]  │  │    +     │         │
│  │ Projekt1 │  │ Projekt2 │  │  Neues   │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                    │
└────────────────────────────────────────────────────┘
```
- Dummy-Projekte (hardcoded)
- Klick auf Projekt → `/project/demo`
- "Neues Projekt" → Dialog (ohne Funktion)

**Settings (`/settings`):**
```
┌────────────────────────────────────────────────────┐
│  [Header]                                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Tabs: Profil | Zahlungen | API-Keys              │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  Profil                                     │   │
│  │  Avatar, Name, Email                        │   │
│  │  [Speichern] (disabled)                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  Zahlungen (Badge: "Bald verfügbar")        │   │
│  │  [Ausgegraut]                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 2.3 Routing

```tsx
// src/App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/project/:id" element={<EditorPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    
    {/* Public Routes (kein Layout) */}
    <Route path="/view/:id" element={<ViewerPage />} />
    <Route path="/embed/:id" element={<EmbedPage />} />
  </Routes>
</BrowserRouter>
```

---

## Phase 3: Editor-Funktionen

### Ziel
Vollständiger Editor wie im Prototyp.

### 3.1 Editor-Komponenten

```
src/components/editor/
├── Editor.tsx               # Haupt-Editor-Container
├── EditorToolbar.tsx        # Floating Toolbar (POI, Nav hinzufügen)
├── PropertiesPanel.tsx      # Rechtes Panel (shadcn Sheet)
├── PoiEditor.tsx            # POI bearbeiten
├── NavArrowEditor.tsx       # Nav-Arrow bearbeiten
├── UploadDialog.tsx         # Panorama hochladen (Dialog)
├── ShareDialog.tsx          # Share-Links (Dialog)
└── hooks/
    └── useEditorState.ts    # Editor Zustand Store
```

### 3.2 Mode-Toggle

```tsx
// Viewer-Mode vs Editor-Mode
<ToggleGroup type="single" value={mode}>
  <ToggleGroupItem value="viewer">Viewer</ToggleGroupItem>
  <ToggleGroupItem value="editor">Editor</ToggleGroupItem>
</ToggleGroup>
```

### 3.3 Properties Panel (shadcn Sheet)

```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>POI bearbeiten</SheetTitle>
    </SheetHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Titel</Label>
        <Input value={poi.title} onChange={...} />
      </div>
      
      <div>
        <Label>Typ</Label>
        <Select value={poi.icon}>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="image">Bild</SelectItem>
          <SelectItem value="video">Video</SelectItem>
          <SelectItem value="link">Link</SelectItem>
        </Select>
      </div>
      
      {/* Typ-spezifischer Content */}
      
      <div className="flex gap-2">
        <Button onClick={save}>Speichern</Button>
        <Button variant="destructive" onClick={delete}>Löschen</Button>
      </div>
    </div>
  </SheetContent>
</Sheet>
```

---

## Phase 4: Backend + Persistenz + Upload-Pipeline

### Ziel
Daten werden in Supabase gespeichert, Bilder werden verarbeitet.

### 4.1 Backend Setup

**Tasks:**
- [ ] Supabase Projekt erstellen
- [ ] Datenbank-Schema deployen
- [ ] Storage Bucket "panoramas" erstellen
- [ ] Hono API (`apps/api`)
- [ ] API-Endpunkte (CRUD)
- [ ] Frontend mit API verbinden

### 4.2 Upload-Pipeline

#### Architektur

```
[Browser]                    [Vercel Function]              [Supabase]
    │                              │                            │
    │ 1. Bild auswählen           │                            │
    │ 2. Client-Komprimierung     │                            │
    │    (max 16K, WebP)          │                            │
    │                              │                            │
    │ 3. Upload zu Storage ────────────────────────────────────►│ Storage
    │    (Progress-Bar)           │                            │
    │                              │                            │
    │ 4. POST /api/process ───────►│                            │
    │                              │ 5. Download von Storage ◄──│
    │                              │ 6. Sharp: Tiles generieren │
    │                              │ 7. Upload Tiles ──────────►│ Storage
    │                              │ 8. DB-Eintrag ────────────►│ Postgres
    │ ◄─────── Progress Updates ──│                            │
    │                              │                            │
    │ 9. Fertig, Szene laden      │                            │
```

#### Upload-Dialog UI (detailliert)

```
┌───────────────────────────────────────────────────────┐
│  Panoramen hochladen                               [×]│
├───────────────────────────────────────────────────────┤
│                                                       │
│   ┌─────────────────────────────────────────────┐     │
│   │      Dateien hierher ziehen                 │     │
│   │              oder                           │     │
│   │      [Dateien auswählen]                    │     │
│   │                                             │     │
│   │   Unterstützt: JPG, PNG, WebP (max. 16K)   │     │
│   └─────────────────────────────────────────────┘     │
│                                                       │
│   ┌─────────────────────────────────────────────┐     │
│   │ 📷 panorama1.jpg                            │     │
│   │    ████████████░░░░░░░░  60%                │     │
│   │    Status: Hochladen...                     │     │
│   └─────────────────────────────────────────────┘     │
│                                                       │
│   ┌─────────────────────────────────────────────┐     │
│   │ 📷 panorama2.jpg                            │     │
│   │    ████████████████████  100%               │     │
│   │    Status: Generiere Tiles...               │     │
│   └─────────────────────────────────────────────┘     │
│                                                       │
│   ┌─────────────────────────────────────────────┐     │
│   │ 📷 panorama3.jpg                     ✓      │     │
│   │    ████████████████████  100%               │     │
│   │    Status: Fertig                           │     │
│   └─────────────────────────────────────────────┘     │
│                                                       │
│                              [Schließen]              │
└───────────────────────────────────────────────────────┘
```

#### Status-Schritte pro Bild

1. **Komprimieren...** (Client-seitig, falls > 16K)
2. **Hochladen...** (Upload zu Supabase Storage, mit %)
3. **Generiere Preview...** (Serverless Function)
4. **Generiere Tiles...** (Serverless Function)
5. **Fertig** ✓

#### Tile-Generierung (Sharp in Vercel Function)

```typescript
// apps/api/src/services/tileGenerator.ts

interface TileConfig {
  levels: [
    { name: 'level-0', width: 2048, cols: 4, rows: 2 },   // 2K
    { name: 'level-1', width: 4096, cols: 8, rows: 4 },   // 4K
    { name: 'level-2', width: 8192, cols: 16, rows: 8 },  // 8K
  ]
}

async function generateTiles(imagePath: string, outputPath: string) {
  // 1. Preview generieren (512px, blur-up)
  // 2. Für jedes Level: Resize + in Tiles schneiden
  // 3. WebP konvertieren (Quality: 85)
  // 4. Zu Supabase Storage hochladen
  // 5. manifest.json erstellen
}
```

#### Storage-Struktur (Supabase)

```
panoramas/
└── {user_id}/
    └── {project_id}/
        └── {panorama_id}/
            ├── original.jpg       # Original-Upload
            ├── preview.webp       # 512px für Blur-up
            ├── manifest.json      # Tile-Konfiguration
            └── tiles/
                ├── level-0/
                │   ├── row-0/
                │   │   ├── tile-0.webp
                │   │   └── tile-1.webp
                │   └── row-1/
                ├── level-1/
                └── level-2/
```

#### Limits

| Limit | Wert |
|-------|------|
| Max. Bildgröße | 16K (16384 x 8192) |
| Max. Dateigröße | 50 MB |
| Formate | JPG, PNG, WebP |
| Tile-Format | WebP (Quality 85) |
| Serverless Timeout | 60s (Vercel Pro)

---

## Phase 5: Auth + User-Management

### Ziel
Echte Authentifizierung.

**Tasks:**
- [ ] Supabase Auth einrichten
- [ ] Login/Register funktional machen
- [ ] Protected Routes
- [ ] User-Profil bearbeiten
- [ ] Row Level Security aktivieren

---

## Phase 6: Payments (Zukunft)

### Ziel
Monetarisierung.

**Tasks:**
- [ ] Stripe Integration
- [ ] Abo-Modelle definieren
- [ ] Zahlungs-UI aktivieren
- [ ] Usage-Limits

---

## Ordnerstruktur

```
360-pano-viewer/
├── apps/
│   ├── web/                          # React Frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui Komponenten
│   │   │   │   ├── layout/
│   │   │   │   │   ├── AppLayout.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── UserMenu.tsx
│   │   │   │   ├── viewer/
│   │   │   │   │   ├── PanoViewer.tsx
│   │   │   │   │   ├── ViewerControls.tsx
│   │   │   │   │   ├── ViewerSettings.tsx
│   │   │   │   │   ├── SceneStrip.tsx
│   │   │   │   │   └── SceneCard.tsx
│   │   │   │   ├── editor/
│   │   │   │   │   ├── Editor.tsx
│   │   │   │   │   ├── EditorToolbar.tsx
│   │   │   │   │   ├── PropertiesPanel.tsx
│   │   │   │   │   ├── PoiEditor.tsx
│   │   │   │   │   ├── NavArrowEditor.tsx
│   │   │   │   │   ├── UploadDialog.tsx
│   │   │   │   │   └── ShareDialog.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── ProjectGrid.tsx
│   │   │   │   │   └── ProjectCard.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── ProfileSettings.tsx
│   │   │   │       └── PaymentSettings.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── EditorPage.tsx
│   │   │   │   ├── ViewerPage.tsx
│   │   │   │   ├── EmbedPage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePanoViewer.ts
│   │   │   │   ├── useProject.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── stores/
│   │   │   │   ├── viewerStore.ts
│   │   │   │   ├── editorStore.ts
│   │   │   │   └── authStore.ts
│   │   │   ├── lib/
│   │   │   │   ├── psv.ts            # PSV Wrapper
│   │   │   │   ├── api.ts            # API Client
│   │   │   │   ├── supabase.ts       # Später
│   │   │   │   └── utils.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── globals.css
│   │   ├── public/
│   │   │   └── test-assets/          # Symlink zu /test-assets
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── components.json           # shadcn/ui config
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Später (Phase 4)
│
├── packages/
│   └── shared/
│       └── src/
│           └── types.ts
│
├── test-assets/                      # Bestehende Assets
│   ├── demo-project.json
│   └── tiles/
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .gitignore
```

---

## Entwicklungs-Commands

```bash
# Installation
pnpm install

# Entwicklung
pnpm dev

# Nur Frontend
pnpm dev --filter web

# Build
pnpm build

# shadcn/ui Komponente hinzufügen
cd apps/web && npx shadcn-ui@latest add [component]
```

---

## Zusammenfassung der Phasen

| Phase | Fokus | Backend | Auth |
|-------|-------|---------|------|
| **1** | Turborepo + Viewer mit lokalen Assets | Nein | Nein |
| **2** | Volles Layout + Placeholder-Seiten | Nein | Placeholder |
| **3** | Editor-Funktionen (POIs, Nav) | Nein | Placeholder |
| **4** | Supabase + API | Ja | Nein |
| **5** | Echte Authentifizierung | Ja | Ja |
| **6** | Payments | Ja | Ja |

---

## Nächster Schritt

**Phase 1.1 starten:** Turborepo + pnpm Workspace + Vite React App + shadcn/ui
