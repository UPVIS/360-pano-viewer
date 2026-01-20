import { create } from 'zustand'

// Local types matching the prototype structure
export interface Position3D {
  yaw: number
  pitch: number
}

export interface PoiContent {
  type: 'info' | 'image' | 'video' | 'link'
  html?: string
  src?: string
  url?: string
  label?: string
  youtubeId?: string
}

export interface PointOfInterest {
  id: string
  position: Position3D
  title: string
  description?: string
  icon: 'info' | 'image' | 'video' | 'link'
  content?: PoiContent
}

export interface NavigationArrow {
  id: string
  position: Position3D
  targetScene: string
  label?: string
}

export interface PitchLimits {
  min: number
  max: number
}

export interface Panorama {
  id: string
  name: string
  tilesPath: string
  previewPath: string
  initialView?: {
    yaw: number
    pitch: number
    fov: number
  }
  pitchLimits?: PitchLimits
  pois: PointOfInterest[]
  navArrows: NavigationArrow[]
}

export interface Project {
  id: string
  name: string
  panoramas: Panorama[]
}

interface ProjectState {
  // Data
  project: Project | null
  currentSceneId: string | null
  
  // Loading
  isLoading: boolean
  error: string | null
  
  // Actions
  setProject: (project: Project) => void
  setCurrentScene: (sceneId: string) => void
  
  // Panorama Actions
  updatePanorama: (sceneId: string, updates: Partial<Panorama>) => void
  reorderPanoramas: (fromId: string, toId: string) => void
  deletePanorama: (sceneId: string) => void
  
  // POI Actions
  addPoi: (sceneId: string, position: Position3D) => PointOfInterest
  updatePoi: (sceneId: string, poiId: string, updates: Partial<PointOfInterest>) => void
  deletePoi: (sceneId: string, poiId: string) => void
  updatePoiPosition: (sceneId: string, poiId: string, position: Position3D) => void
  
  // Navigation Arrow Actions
  addNavArrow: (sceneId: string, position: Position3D) => NavigationArrow
  updateNavArrow: (sceneId: string, navId: string, updates: Partial<NavigationArrow>) => void
  deleteNavArrow: (sceneId: string, navId: string) => void
  updateNavArrowPosition: (sceneId: string, navId: string, position: Position3D) => void
  
  // Helpers
  getCurrentPanorama: () => Panorama | null
  getPanoramaById: (id: string) => Panorama | null
}

// ID Generator
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial State
  project: null,
  currentSceneId: null,
  isLoading: false,
  error: null,
  
  // Project Actions
  setProject: (project) => set({ 
    project,
    currentSceneId: project.panoramas[0]?.id || null
  }),
  
  setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),
  
  // Panorama Actions
  updatePanorama: (sceneId, updates) => set((state) => {
    if (!state.project) return state
    
    return {
      project: {
        ...state.project,
        panoramas: state.project.panoramas.map(p =>
          p.id === sceneId ? { ...p, ...updates } : p
        )
      }
    }
  }),
  
  reorderPanoramas: (fromId, toId) => set((state) => {
    if (!state.project || fromId === toId) return state
    
    const panoramas = [...state.project.panoramas]
    const fromIndex = panoramas.findIndex(p => p.id === fromId)
    const toIndex = panoramas.findIndex(p => p.id === toId)
    
    if (fromIndex === -1 || toIndex === -1) return state
    
    const [removed] = panoramas.splice(fromIndex, 1)
    panoramas.splice(toIndex, 0, removed)
    
    return {
      project: {
        ...state.project,
        panoramas
      }
    }
  }),
  
  deletePanorama: (sceneId) => set((state) => {
    if (!state.project || state.project.panoramas.length <= 1) return state
    
    const newPanoramas = state.project.panoramas.filter(p => p.id !== sceneId)
    const newCurrentScene = state.currentSceneId === sceneId 
      ? newPanoramas[0]?.id || null
      : state.currentSceneId
    
    return {
      project: {
        ...state.project,
        panoramas: newPanoramas
      },
      currentSceneId: newCurrentScene
    }
  }),
  
  // POI Actions
  addPoi: (sceneId, position) => {
    const newPoi: PointOfInterest = {
      id: generateId('poi'),
      position,
      title: 'Neuer POI',
      description: '',
      icon: 'info'
    }
    
    set((state) => {
      if (!state.project) return state
      
      return {
        project: {
          ...state.project,
          panoramas: state.project.panoramas.map(p =>
            p.id === sceneId
              ? { ...p, pois: [...p.pois, newPoi] }
              : p
          )
        }
      }
    })
    
    return newPoi
  },
  
  updatePoi: (sceneId, poiId, updates) => set((state) => {
    if (!state.project) return state
    
    return {
      project: {
        ...state.project,
        panoramas: state.project.panoramas.map(p =>
          p.id === sceneId
            ? {
                ...p,
                pois: p.pois.map(poi =>
                  poi.id === poiId ? { ...poi, ...updates } : poi
                )
              }
            : p
        )
      }
    }
  }),
  
  deletePoi: (sceneId, poiId) => set((state) => {
    if (!state.project) return state
    
    return {
      project: {
        ...state.project,
        panoramas: state.project.panoramas.map(p =>
          p.id === sceneId
            ? { ...p, pois: p.pois.filter(poi => poi.id !== poiId) }
            : p
        )
      }
    }
  }),
  
  updatePoiPosition: (sceneId, poiId, position) => set((state) => {
    if (!state.project) return state
    
    return {
      project: {
        ...state.project,
        panoramas: state.project.panoramas.map(p =>
          p.id === sceneId
            ? {
                ...p,
                pois: p.pois.map(poi =>
                  poi.id === poiId ? { ...poi, position } : poi
                )
              }
            : p
        )
      }
    }
  }),
  
  // Navigation Arrow Actions
  addNavArrow: (sceneId, position) => {
    const state = get()
    
    // Find first other panorama as default target
    const otherPano = state.project?.panoramas.find(p => p.id !== sceneId)
    
    const newNav: NavigationArrow = {
      id: generateId('nav'),
      position,
      targetScene: otherPano?.id || '',
      label: otherPano?.name || 'Ziel wählen'
    }
    
    set((state) => {
      if (!state.project) return state
      
      return {
        project: {
          ...state.project,
          panoramas: state.project.panoramas.map(p =>
            p.id === sceneId
              ? { ...p, navArrows: [...p.navArrows, newNav] }
              : p
          )
        }
      }
    })
    
    return newNav
  },
  
  updateNavArrow: (sceneId, navId, updates) => set((state) => {
    if (!state.project) return state
    
    return {
      project: {
        ...state.project,
        panoramas: state.project.panoramas.map(p =>
          p.id === sceneId
            ? {
                ...p,
                navArrows: p.navArrows.map(nav =>
                  nav.id === navId ? { ...nav, ...updates } : nav
                )
              }
            : p
        )
      }
    }
  }),
  
  deleteNavArrow: (sceneId, navId) => set((state) => {
    if (!state.project) return state
    
    return {
      project: {
        ...state.project,
        panoramas: state.project.panoramas.map(p =>
          p.id === sceneId
            ? { ...p, navArrows: p.navArrows.filter(nav => nav.id !== navId) }
            : p
        )
      }
    }
  }),
  
  updateNavArrowPosition: (sceneId, navId, position) => set((state) => {
    if (!state.project) return state
    
    return {
      project: {
        ...state.project,
        panoramas: state.project.panoramas.map(p =>
          p.id === sceneId
            ? {
                ...p,
                navArrows: p.navArrows.map(nav =>
                  nav.id === navId ? { ...nav, position } : nav
                )
              }
            : p
        )
      }
    }
  }),
  
  // Helpers
  getCurrentPanorama: () => {
    const state = get()
    if (!state.project || !state.currentSceneId) return null
    return state.project.panoramas.find(p => p.id === state.currentSceneId) || null
  },
  
  getPanoramaById: (id) => {
    const state = get()
    if (!state.project) return null
    return state.project.panoramas.find(p => p.id === id) || null
  }
}))
