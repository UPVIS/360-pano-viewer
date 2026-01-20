# 360° Panorama Viewer v2

> Performanter, mobil-optimierter 360°-Panorama-Viewer mit Editor- und Viewer-Mode.

## Status

🚧 **Phase 1: Engine-Vergleich** - Vier Engines werden getestet

## Quick Start

```bash
# Dependencies installieren
npm install

# Prototypen-Server starten
npm run serve:prototypes

# Öffne im Browser:
# - http://localhost:3000/psv/          (Photo Sphere Viewer)
# - http://localhost:3000/pannellum/    (Pannellum)
# - http://localhost:3000/marzipano/    (Marzipano)
# - http://localhost:3000/threejs/      (Three.js direkt)
```

## Projektstruktur

```
360-pano-viewer/
├── apps/                    # Apps (nach Engine-Entscheidung)
│   └── web/                 # React Frontend
├── packages/
│   └── shared/              # Shared Types
├── prototypes/              # Engine-Vergleich
│   ├── psv/                 # Photo Sphere Viewer
│   ├── pannellum/           # Pannellum
│   ├── marzipano/           # Marzipano
│   └── threejs/             # Three.js direkt
├── test-assets/             # Test-Panoramen
├── docs/
│   └── ENGINE_COMPARISON.md # Vergleichs-Dokumentation
└── projects/                # Lokale Projekt-Daten
```

## Test-Panorama

Lege ein 4K Equirectangular Panorama (4096x2048) in `test-assets/sample-4k.jpg` ab.

## Engine-Vergleich

| Engine | Bundle | Status |
|--------|--------|--------|
| Photo Sphere Viewer | ~180KB | 🔄 Testen |
| Pannellum | ~21KB | 🔄 Testen |
| Marzipano | ~75KB | 🔄 Testen |
| Three.js direkt | ~150KB | 🔄 Testen |

Detaillierte Ergebnisse: [docs/ENGINE_COMPARISON.md](docs/ENGINE_COMPARISON.md)

## Tech Stack

- **Monorepo:** Turborepo + npm workspaces
- **Frontend:** React 18 + TypeScript + Vite (nach Entscheidung)
- **Styling:** Tailwind CSS + Radix UI
- **Backend:** Node.js + Hono (später)

## Roadmap

- [x] Phase 0: Projekt-Setup
- [ ] Phase 1: Engine-Vergleich
- [ ] Phase 2: MVP Core Viewer
- [ ] Phase 3: Multi-Panorama Navigation
- [ ] Phase 4: Editor Mode
- [ ] Phase 5: Backend & Persistenz
- [ ] Phase 6-9: Weitere Features

## Lizenz

Proprietär - Alle Rechte vorbehalten
