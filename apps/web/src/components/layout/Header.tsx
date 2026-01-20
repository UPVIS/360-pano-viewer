import { Link, useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Placeholder: Just redirect to login
    console.log('Logout clicked')
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">360</span>
        </div>
        <span className="font-semibold text-lg hidden sm:inline">Panorama Viewer</span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </nav>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>Demo User</span>
              <span className="text-xs font-normal text-muted-foreground">demo@example.com</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
