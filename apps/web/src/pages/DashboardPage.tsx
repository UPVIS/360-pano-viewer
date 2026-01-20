import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Trash2, Copy, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Dummy-Projekte für Placeholder
const demoProjects = [
  {
    id: 'demo-1',
    name: 'Hotel Lobby Tour',
    createdAt: '2026-01-15',
    thumbnail: '/test-assets/tiles/sample/preview.webp',
    scenesCount: 5
  },
  {
    id: 'demo-2',
    name: 'Restaurant 360°',
    createdAt: '2026-01-10',
    thumbnail: '/test-assets/tiles/sample/preview.webp',
    scenesCount: 3
  }
]

export function DashboardPage() {
  const navigate = useNavigate()

  const handleCreateProject = () => {
    console.log('Create new project')
    // Placeholder: Navigate to demo project
    navigate('/project/demo')
  }

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`)
  }

  const handleDeleteProject = (projectId: string) => {
    console.log('Delete project:', projectId)
  }

  const handleDuplicateProject = (projectId: string) => {
    console.log('Duplicate project:', projectId)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Meine Projekte</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine 360°-Panorama-Touren
          </p>
        </div>
        <Button onClick={handleCreateProject}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Projekt
        </Button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Existing Projects */}
        {demoProjects.map((project) => (
          <Card 
            key={project.id}
            className="group cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
            onClick={() => handleOpenProject(project.id)}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-secondary relative overflow-hidden">
              <img
                src={project.thumbnail}
                alt={project.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </div>
              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => handleOpenProject(project.id)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplizieren
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Info */}
            <CardContent className="p-4">
              <h3 className="font-medium truncate">{project.name}</h3>
              <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
                <span>{project.scenesCount} Szenen</span>
                <span>{new Date(project.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Project Card */}
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors border-dashed"
          onClick={handleCreateProject}
        >
          <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Neues Projekt</span>
          </div>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Erstelle eine neue 360°-Tour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State (wenn keine Projekte) */}
      {demoProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Noch keine Projekte</h2>
          <p className="text-muted-foreground mb-6">
            Erstelle dein erstes 360°-Panorama-Projekt
          </p>
          <Button onClick={handleCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            Erstes Projekt erstellen
          </Button>
        </div>
      )}
    </div>
  )
}
