/**
 * Shared Types for 360° Panorama Viewer
 */

// ============================================
// PROJECT TYPES
// ============================================

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  settings: ProjectSettings
  panoramas: Panorama[]
}

export interface ProjectSettings {
  accentColor: string
  logo?: string
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  autoRotate: boolean
  autoRotateSpeed: number
  showControls: boolean
  branding: BrandingConfig
}

export interface BrandingConfig {
  enabled: boolean
  companyName?: string
  website?: string
  customCSS?: string
}

// ============================================
// PANORAMA TYPES
// ============================================

export interface Panorama {
  id: string
  name: string
  imagePath: string
  tilesPath?: string
  previewPath?: string
  initialView: ViewState
  pitchLimits: PitchLimits
  pois: PointOfInterest[]
  navArrows: NavigationArrow[]
  ambientAudio?: string
  order: number
}

export interface ViewState {
  yaw: number      // Horizontal rotation in degrees (-180 to 180)
  pitch: number    // Vertical rotation in degrees (-90 to 90)
  fov: number      // Field of view in degrees (30 to 120)
}

export interface PitchLimits {
  min: number      // Minimum pitch (looking down), e.g., -30
  max: number      // Maximum pitch (looking up), e.g., 30
}

// ============================================
// POI TYPES
// ============================================

export interface PointOfInterest {
  id: string
  type: 'info' | 'media' | 'link'
  position: Position3D
  title: string
  description?: string
  content?: string      // HTML/Rich-Text content
  icon?: string         // Custom icon URL
  style?: POIStyle
}

export interface Position3D {
  yaw: number
  pitch: number
}

export interface POIStyle {
  color?: string
  size?: 'small' | 'medium' | 'large'
  animation?: 'none' | 'pulse' | 'bounce'
}

// ============================================
// NAVIGATION TYPES
// ============================================

export interface NavigationArrow {
  id: string
  position: Position3D
  targetPanoramaId: string
  label?: string
  style?: NavArrowStyle
}

export interface NavArrowStyle {
  color?: string
  size?: 'small' | 'medium' | 'large'
}

// ============================================
// VIEWER TYPES
// ============================================

export type ViewerMode = 'viewer' | 'editor'

export interface ViewerConfig {
  mode: ViewerMode
  projectId: string
  initialPanoramaId?: string
  enableFullscreen?: boolean
  enableKeyboard?: boolean
  showWatermark?: boolean
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface UploadProgress {
  phase: 'uploading' | 'processing' | 'tiling' | 'complete'
  progress: number   // 0-100
  message?: string
}
