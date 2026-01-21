import { useCallback, useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore, type Position3D } from '@/stores/projectStore'
import type { MarkerConfig, MarkerData } from './usePanoViewer'

interface ViewerMethods {
  addMarker: (config: MarkerConfig) => void
  removeMarker: (id: string) => void
  clearMarkers: () => void
  switchPanorama?: (tilesPath: string, previewPath: string, initialView?: { yaw: number; pitch: number; fov?: number }) => Promise<void>
}

interface UseEditorActionsProps {
  getViewerMethods: () => ViewerMethods | null
}

export function useEditorActions({ getViewerMethods }: UseEditorActionsProps) {
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
    getCurrentPanorama,
    getPanoramaById,
    setCurrentScene
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

  // Generate Nav Arrow marker HTML with 3D perspective
  const createNavMarkerHtml = useCallback((nav: { id: string; label?: string }, isEditor: boolean) => {
    return `<div class="nav-arrow-marker ${isEditor ? 'editable' : ''}" data-nav-id="${nav.id}">
      <div class="floor-arrow" role="button" aria-label="Navigation: ${nav.label || 'Navigation'}">
        <div class="floor-arrow-shape"></div>
      </div>
      <span class="nav-label">${nav.label || 'Navigation'}</span>
    </div>`
  }, [])

  // Generate tooltip content based on POI type
  const generateTooltipContent = useCallback((poi: {
    title: string
    description?: string
    icon: 'info' | 'image' | 'video' | 'link'
    content?: {
      type?: string
      html?: string
      src?: string
      url?: string
      label?: string
      youtubeId?: string
    }
  }) => {
    const content = poi.content
    let mainContent = ''

    switch (poi.icon) {
      case 'info':
        if (content?.html) {
          mainContent = content.html
        } else {
          mainContent = `<p>${poi.description || 'Keine Beschreibung'}</p>`
        }
        break

      case 'image':
        if (content?.src) {
          mainContent = `
            <img src="${content.src}" alt="${poi.title}" class="poi-tooltip-image" />
            ${poi.description ? `<p class="poi-tooltip-description">${poi.description}</p>` : ''}
          `
        } else {
          mainContent = '<p>Kein Bild vorhanden</p>'
        }
        break

      case 'video':
        if (content?.youtubeId) {
          mainContent = `
            <div class="poi-tooltip-video">
              <iframe 
                src="https://www.youtube.com/embed/${content.youtubeId}?rel=0" 
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
            ${poi.description ? `<p class="poi-tooltip-description">${poi.description}</p>` : ''}
          `
        } else if (content?.src) {
          mainContent = `
            <div class="poi-tooltip-video">
              <video src="${content.src}" controls playsinline preload="metadata">
                Dein Browser unterstützt dieses Video-Format nicht.
              </video>
            </div>
            ${poi.description ? `<p class="poi-tooltip-description">${poi.description}</p>` : ''}
          `
        } else if (content?.url) {
          mainContent = `
            <a href="${content.url}" target="_blank" rel="noopener noreferrer" class="poi-tooltip-video-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              <span>Video abspielen</span>
            </a>
            ${poi.description ? `<p class="poi-tooltip-description">${poi.description}</p>` : ''}
          `
        } else {
          mainContent = '<p>Kein Video vorhanden</p>'
        }
        break

      case 'link':
        if (content?.url) {
          mainContent = `
            <a href="${content.url}" target="_blank" rel="noopener noreferrer" class="poi-tooltip-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              <span>${content.label || 'Link öffnen'}</span>
            </a>
            <p class="poi-tooltip-url">${content.url}</p>
            ${poi.description ? `<p class="poi-tooltip-description">${poi.description}</p>` : ''}
          `
        } else {
          mainContent = '<p>Kein Link vorhanden</p>'
        }
        break

      default:
        mainContent = `<p>${poi.description || 'Keine Beschreibung'}</p>`
    }

    return mainContent
  }, [])

  // Refresh all markers for current scene
  const refreshMarkers = useCallback(() => {
    const methods = getViewerMethods()
    if (!methods) return
    
    methods.clearMarkers()
    
    const pano = getCurrentPanorama()
    if (!pano) return

    const isEditor = mode === 'editor'

    // Add POI markers with native tooltips (only in viewer mode)
    pano.pois?.forEach(poi => {
      const tooltipContent = generateTooltipContent(poi)
      
      methods.addMarker({
        id: poi.id,
        position: poi.position,
        html: createPoiMarkerHtml(poi, isEditor),
        anchor: 'center center',
        data: { type: 'poi', id: poi.id, ...poi },
        // Add native tooltip only in viewer mode
        tooltip: !isEditor ? {
          content: `<div class="poi-native-tooltip">
            <div class="poi-native-tooltip-title">${poi.title || 'Info'}</div>
            <div class="poi-native-tooltip-content">${tooltipContent}</div>
          </div>`,
          position: 'top',
          trigger: 'click'
        } : undefined
      })
    })

    // Add Nav Arrow markers
    pano.navArrows?.forEach(nav => {
      methods.addMarker({
        id: nav.id,
        position: nav.position,
        html: createNavMarkerHtml(nav, isEditor),
        anchor: 'bottom center',
        data: { type: 'nav', id: nav.id, targetPanoramaId: nav.targetScene, ...nav }
      })
    })
  }, [getViewerMethods, getCurrentPanorama, mode, createPoiMarkerHtml, createNavMarkerHtml])

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
  const handleMarkerClick = useCallback(async (markerId: string, data: MarkerData) => {
    if (mode === 'viewer') {
      // In viewer mode, show tooltip or navigate
      if (data.type === 'nav' && data.targetPanoramaId) {
        const targetSceneId = data.targetPanoramaId as string
        const targetPano = getPanoramaById(targetSceneId)
        const methods = getViewerMethods()
        
        if (targetPano && methods?.switchPanorama) {
          // Update store state first
          setCurrentScene(targetSceneId)
          
          // Then switch panorama without destroying viewer
          await methods.switchPanorama(
            targetPano.tilesPath, 
            targetPano.previewPath, 
            targetPano.initialView
          )
          
          // Refresh markers for new scene after a short delay
          setTimeout(() => refreshMarkers(), 100)
        }
      }
      // POI clicks in viewer mode are handled by PoiTooltip
      return
    }

    // In editor mode, select the element and enable drag
    if (data.type === 'poi' || data.type === 'nav') {
      selectElement(data.type, markerId)
      setDraggingMarker(true)
    }
  }, [mode, selectElement, setDraggingMarker, getPanoramaById, setCurrentScene, getViewerMethods, refreshMarkers])

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
