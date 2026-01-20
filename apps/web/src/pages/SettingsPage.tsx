import { User, CreditCard, Key, Badge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">
          Verwalte dein Konto und deine Einstellungen
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Profil</CardTitle>
            </div>
            <CardDescription>
              Deine persönlichen Informationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <Button variant="outline" size="sm">
                Foto ändern
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Demo User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="demo@example.com" />
              </div>
            </div>
            <Button>Speichern</Button>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              <CardTitle>Passwort</CardTitle>
            </div>
            <CardDescription>
              Ändere dein Passwort
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Aktuelles Passwort</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>
            <Button>Passwort ändern</Button>
          </CardContent>
        </Card>

        {/* Billing Section (Disabled) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <CardTitle>Zahlungen</CardTitle>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                Bald verfügbar
              </span>
            </div>
            <CardDescription>
              Verwalte dein Abo und deine Zahlungsmethoden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 text-center border border-dashed border-border rounded-lg">
              <Badge className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Zahlungsfunktionen werden bald verfügbar sein
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section (Disabled) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              <CardTitle>API-Schlüssel</CardTitle>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                Bald verfügbar
              </span>
            </div>
            <CardDescription>
              Erstelle und verwalte API-Schlüssel für Integrationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 text-center border border-dashed border-border rounded-lg">
              <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                API-Funktionen werden bald verfügbar sein
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
