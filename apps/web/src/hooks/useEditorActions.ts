import { useCallback, useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore, type Position3D } from '@/stores/projectStore'
import type { MarkerConfig, MarkerData } from './usePanoViewer'

interface UseEditorActionsProps {
  addMarker: (config: MarkerConfig) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
}

export function useEditorActions({ addMarker, removeMarker, clearMarkers }: UseEditorActionsProps) {
  const {
    mode,
    placementMode,
    selectedElement,
    isDraggingMarker,
    setPlacementMode,
    selectElement,
    setDraggingMarker,
    hidePropertiesPanel
  } = useEditorStore()

  const {
    currentSceneId,
    addPoi,
    addNavArrow,
    updatePoiPosition,
    updateNavArrowPosition,
    getCurrentPanorama
  } = useProjectStore()

  // Generate POI marker HTML
  const createPoiMarkerHtml = useCallback((poi: { id: string; title: string; icon: string }, isEditor: boolean) => {
    return `<div class="poi-marker ${isEditor ? 'editable' : ''}" data-poi-id="${poi.id}">
      <div class="poi-icon poi-icon-${poi.icon || 'info'}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">i</text>
        </svg>
      </div>
      <span class="poi-label">${poi.title || 'POI'}</span>
    </div>`
  }, [])

  // Generate Nav Arrow marker HTML
  const createNavMarkerHtml = useCallback((nav: { id: string; label?: string }, isEditor: boolean) => {
    return `<div class="nav-arrow-marker ${isEditor ? 'editable' : ''}" data-nav-id="${nav.id}">
      <div class="floor-arrow">
        <svg viewBox="0 0 100 80" fill="currentColor">
          <polygon points="50,0 100,60 75,60 75,80 25,80 25,60 0,60"/>
        </svg>
      </div>
      <span class="nav-label">${nav.label || 'Navigation'}</span>
    </div>`
  }, [])

  // Refresh all markers for current scene
  const refreshMarkers = useCallback(() => {
    clearMarkers()
    
    const pano = getCurrentPanorama()
    if (!pano) return

    const isEditor = mode === 'editor'

    // Add POI markers
    pano.pois?.forEach(poi => {
      addMarker({
        id: poi.id,
        position: poi.position,
        html: createPoiMarkerHtml(poi, isEditor),
        anchor: 'center center',
        data: { type: 'poi', id: poi.id, ...poi }
      })
    })

    // Add Nav Arrow markers
    pano.navArrows?.forEach(nav => {
      addMarker({
        id: nav.id,
        position: nav.position,
        html: createNavMarkerHtml(nav, isEditor),
        anchor: 'bottom center',
        data: { type: 'nav', id: nav.id, targetPanoramaId: nav.targetScene, ...nav }
      })
    })
  }, [clearMarkers, getCurrentPanorama, mode, addMarker, createPoiMarkerHtml, createNavMarkerHtml])

  // Handle click on panorama
  const handlePanoramaClick = useCallback((position: Position3D) => {
    if (!currentSceneId) return

    // If dragging a marker, update its position
    if (isDraggingMarker && selectedElement) {
      if (selectedElement.type === 'poi') {
        updatePoiPosition(currentSceneId, selectedElement.id, position)
      } else if (selectedElement.type === 'nav') {
        updateNavArrowPosition(currentSceneId, selectedElement.id, position)
      }
      setDraggingMarker(false)
      refreshMarkers()
      return
    }

    // If in placement mode, create new element
    if (placementMode === 'poi') {
      const newPoi = addPoi(currentSceneId, position)
      selectElement('poi', newPoi.id)
      setPlacementMode(null)
      refreshMarkers()
      return
    }

    if (placementMode === 'nav') {
      const newNav = addNavArrow(currentSceneId, position)
      selectElement('nav', newNav.id)
      setPlacementMode(null)
      refreshMarkers()
      return
    }
  }, [
    currentSceneId,
    isDraggingMarker,
    selectedElement,
    placementMode,
    addPoi,
    addNavArrow,
    updatePoiPosition,
    updateNavArrowPosition,
    selectElement,
    setPlacementMode,
    setDraggingMarker,
    refreshMarkers
  ])

  // Handle click on marker
  const handleMarkerClick = useCallback((markerId: string, data: MarkerData) => {
    if (mode === 'viewer') {
      // In viewer mode, show tooltip or navigate
      if (data.type === 'nav' && data.targetPanoramaId) {
        // Navigate to target scene
        useProjectStore.getState().setCurrentScene(data.targetPanoramaId as string)
      }
      // POI clicks in viewer mode are handled by PoiTooltip
      return
    }

    // In editor mode, select the element and enable drag
    if (data.type === 'poi' || data.type === 'nav') {
      selectElement(data.type, markerId)
      setDraggingMarker(true)
    }
  }, [mode, selectElement, setDraggingMarker])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      // Only handle shortcuts in editor mode
      if (mode !== 'editor') return

      switch (e.key) {
        case 'Escape':
          if (isDraggingMarker) {
            setDraggingMarker(false)
          } else if (placementMode) {
            setPlacementMode(null)
          } else if (selectedElement) {
            hidePropertiesPanel()
          }
          break
        case 'p':
        case 'P':
          setPlacementMode(placementMode === 'poi' ? null : 'poi')
          break
        case 'n':
        case 'N':
          setPlacementMode(placementMode === 'nav' ? null : 'nav')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, placementMode, selectedElement, isDraggingMarker, setPlacementMode, setDraggingMarker, hidePropertiesPanel])

  return {
    handlePanoramaClick,
    handleMarkerClick,
    refreshMarkers
  }
}
