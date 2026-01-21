import { create } from 'zustand'

export type EditorMode = 'viewer' | 'editor'
export type PlacementMode = 'poi' | 'nav' | null
export type SelectedElementType = 'poi' | 'nav' | 'panorama'

export interface SelectedElement {
  type: SelectedElementType
  id: string
}

export interface ViewerPosition {
  yaw: number
  pitch: number
  zoom: number
}

export interface PitchLimits {
  min: number // In degrees, e.g. -45
  max: number // In degrees, e.g. 45
}

interface EditorState {
  // Mode
  mode: EditorMode
  
  // Selection
  selectedElement: SelectedElement | null
  
  // Placement
  placementMode: PlacementMode
  isDraggingMarker: boolean
  
  // Panels
  propsVisible: boolean
  scenesVisible: boolean
  settingsVisible: boolean
  
  // Viewer State
  isAutorotating: boolean
  viewerPosition: ViewerPosition
  showStats: boolean
  pitchLimits: PitchLimits
  
  // Actions
  setMode: (mode: EditorMode) => void
  toggleMode: () => void
  
  selectElement: (type: SelectedElementType, id: string) => void
  clearSelection: () => void
  
  setPlacementMode: (mode: PlacementMode) => void
  cancelPlacement: () => void
  
  setDraggingMarker: (isDragging: boolean) => void
  
  showPropertiesPanel: () => void
  hidePropertiesPanel: () => void
  
  toggleScenes: () => void
  toggleSettings: () => void
  closeAllPanels: () => void
  
  setAutorotating: (isAutorotating: boolean) => void
  toggleAutorotate: () => void
  
  setViewerPosition: (position: ViewerPosition) => void
  
  setShowStats: (show: boolean) => void
  toggleStats: () => void
  
  setPitchLimits: (limits: PitchLimits) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial State
  mode: 'editor',
  selectedElement: null,
  placementMode: null,
  isDraggingMarker: false,
  propsVisible: false,
  scenesVisible: false,
  settingsVisible: false,
  isAutorotating: false,
  viewerPosition: { yaw: 0, pitch: 0, zoom: 50 },
  showStats: false,
  pitchLimits: { min: -45, max: 45 },
  
  // Mode Actions
  setMode: (mode) => set((state) => {
    // Clear selection when switching to viewer
    if (mode === 'viewer') {
      return {
        mode,
        selectedElement: null,
        placementMode: null,
        isDraggingMarker: false,
        propsVisible: false
      }
    }
    return { mode }
  }),
  
  toggleMode: () => set((state) => {
    const newMode = state.mode === 'editor' ? 'viewer' : 'editor'
    if (newMode === 'viewer') {
      return {
        mode: newMode,
        selectedElement: null,
        placementMode: null,
        isDraggingMarker: false,
        propsVisible: false
      }
    }
    return { mode: newMode }
  }),
  
  // Selection Actions
  selectElement: (type, id) => set({
    selectedElement: { type, id },
    propsVisible: true,
    placementMode: null
  }),
  
  clearSelection: () => set({
    selectedElement: null,
    propsVisible: false
  }),
  
  // Placement Actions
  setPlacementMode: (placementMode) => set({
    placementMode,
    selectedElement: null,
    propsVisible: false
  }),
  
  cancelPlacement: () => set({
    placementMode: null,
    isDraggingMarker: false
  }),
  
  // Dragging
  setDraggingMarker: (isDragging) => set({
    isDraggingMarker: isDragging
  }),
  
  // Properties Panel
  showPropertiesPanel: () => set({ propsVisible: true }),
  hidePropertiesPanel: () => set({ 
    propsVisible: false,
    selectedElement: null 
  }),
  
  // Scenes Panel
  toggleScenes: () => set((state) => ({
    scenesVisible: !state.scenesVisible,
    settingsVisible: false // Close settings when opening scenes
  })),
  
  // Settings Panel
  toggleSettings: () => set((state) => ({
    settingsVisible: !state.settingsVisible,
    scenesVisible: false // Close scenes when opening settings
  })),
  
  // Close all panels
  closeAllPanels: () => set({
    scenesVisible: false,
    settingsVisible: false,
    propsVisible: false
  }),
  
  // Autorotate
  setAutorotating: (isAutorotating) => set({ isAutorotating }),
  toggleAutorotate: () => set((state) => ({ isAutorotating: !state.isAutorotating })),
  
  // Viewer Position
  setViewerPosition: (position) => set({ viewerPosition: position }),
  
  // Stats
  setShowStats: (show) => set({ showStats: show }),
  toggleStats: () => set((state) => ({ showStats: !state.showStats })),
  
  // Pitch Limits
  setPitchLimits: (limits) => set({ pitchLimits: limits })
}))
