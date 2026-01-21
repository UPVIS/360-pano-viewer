import type { Project, Panorama, PointOfInterest, NavigationArrow } from '@/stores/projectStore'

interface RawNavArrow {
  id: string
  position: { yaw: number; pitch: number }
  targetPanoramaId: string
  label?: string
}

interface RawPoi {
  id: string
  position: { yaw: number; pitch: number }
  title: string
  description?: string
  icon?: 'info' | 'image' | 'video' | 'link'
}

interface RawPanorama {
  id: string
  name: string
  description?: string
  tilesPath: string
  previewPath: string
  initialView?: {
    yaw: number
    pitch: number
    fov: number
  }
  pitchLimits?: {
    min: number
    max: number
  }
  pois?: RawPoi[]
  navArrows?: RawNavArrow[]
}

interface RawProject {
  id: string
  name: string
  slug?: string  // Optional in raw data, will be generated if missing
  description?: string
  version?: number
  created?: string
  modified?: string
  settings?: Record<string, unknown>
  panoramas: RawPanorama[]
}

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

/**
 * Transform raw project data from JSON to store format
 * Handles field name mapping (targetPanoramaId -> targetScene)
 */
function transformProject(raw: RawProject): Project {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug || generateSlug(raw.name),
    panoramas: raw.panoramas.map((pano): Panorama => ({
      id: pano.id,
      name: pano.name,
      tilesPath: pano.tilesPath,
      previewPath: pano.previewPath,
      initialView: pano.initialView,
      pitchLimits: pano.pitchLimits,
      pois: (pano.pois || []).map((poi): PointOfInterest => ({
        id: poi.id,
        position: poi.position,
        title: poi.title,
        description: poi.description,
        icon: poi.icon || 'info'
      })),
      navArrows: (pano.navArrows || []).map((nav): NavigationArrow => ({
        id: nav.id,
        position: nav.position,
        targetScene: nav.targetPanoramaId, // Transform field name
        label: nav.label
      }))
    }))
  }
}

/**
 * Load project from URL and transform to store format
 */
export async function loadProject(url: string): Promise<Project> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to load project: ${response.status} ${response.statusText}`)
  }
  
  const rawProject: RawProject = await response.json()
  return transformProject(rawProject)
}

/**
 * Load project from static import (for production builds)
 */
export function loadProjectFromData(rawProject: RawProject): Project {
  return transformProject(rawProject)
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV
}

/**
 * Get default project URL based on environment
 */
export function getDefaultProjectUrl(): string {
  if (isDevelopment()) {
    return '/test-assets/demo-project.json'
  }
  // In production, this would be an API call
  return '/api/projects/default'
}
