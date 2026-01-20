import { create } from 'zustand'

export type EditorMode = 'viewer' | 'editor'
export type PlacementMode = 'poi' | 'nav' | null
export type SelectedElementType = 'poi' | 'nav' | 'panorama'

export interface SelectedElement {
  type: SelectedElementType
  id: string
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
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial State
  mode: 'editor',
  selectedElement: null,
  placementMode: null,
  isDraggingMarker: false,
  propsVisible: false,
  
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
  })
}))
