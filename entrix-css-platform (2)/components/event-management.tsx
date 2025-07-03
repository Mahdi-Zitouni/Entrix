"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, Eye, Edit, Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  opponent: string
  stadium: string
  ticketsSold: number
  revenue: number
  status: "upcoming" | "live" | "completed" | "cancelled"
  category: "match" | "training" | "event"
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "CSS vs EST",
    description: "Match de championnat contre l'Espérance Sportive de Tunis",
    date: "2024-02-15",
    time: "16:00",
    opponent: "Espérance Sportive de Tunis",
    stadium: "Stade Taïeb Mhiri",
    ticketsSold: 12500,
    revenue: 562500,
    status: "upcoming",
    category: "match",
  },
  {
    id: "2",
    title: "CSS vs CA",
    description: "Match de coupe contre le Club Africain",
    date: "2024-02-22",
    time: "19:00",
    opponent: "Club Africain",
    stadium: "Stade Taïeb Mhiri",
    ticketsSold: 14200,
    revenue: 639000,
    status: "upcoming",
    category: "match",
  },
]

export function EventManagement() {
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    opponent: "",
    stadium: "Stade Taïeb Mhiri",
    category: "match" as const,
  })
  const { toast } = useToast()

  const handleCreateEvent = () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      ...formData,
      ticketsSold: 0,
      revenue: 0,
      status: "upcoming",
    }

    setEvents([...events, newEvent])
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      opponent: "",
      stadium: "Stade Taïeb Mhiri",
      category: "match",
    })
    setIsCreateModalOpen(false)
    toast({
      title: "Succès",
      description: "Événement créé avec succès",
    })
  }

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsViewModalOpen(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId))
    toast({
      title: "Succès",
      description: "Événement supprimé avec succès",
    })
  }

  const getStatusBadge = (status: Event["status"]) => {
    const variants = {
      upcoming: "default",
      live: "destructive",
      completed: "secondary",
      cancelled: "outline",
    } as const

    const labels = {
      upcoming: "À venir",
      live: "En cours",
      completed: "Terminé",
      cancelled: "Annulé",
    }

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0)
  const totalTicketsSold = events.reduce((sum, event) => sum + event.ticketsSold, 0)

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display">Gestion des Événements</h2>
          <p className="text-gray-600 dark:text-gray-400">Gérez les matchs, entraînements et événements</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Événement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Créer un Nouvel Événement</DialogTitle>
              <DialogDescription>Ajoutez les détails de votre nouvel événement</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="CSS vs EST"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "match" | "training" | "event") =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">Match</SelectItem>
                      <SelectItem value="training">Entraînement</SelectItem>
                      <SelectItem value="event">Événement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'événement..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Heure *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opponent">Adversaire</Label>
                  <Input
                    id="opponent"
                    value={formData.opponent}
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    placeholder="Nom de l'équipe adverse"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stadium">Stade</Label>
                  <Select
                    value={formData.stadium}
                    onValueChange={(value) => setFormData({ ...formData, stadium: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stade Taïeb Mhiri">Stade Taïeb Mhiri</SelectItem>
                      <SelectItem value="Stade Olympique">Stade Olympique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateEvent}>Créer l'Événement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="css-shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Événements totaux</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="css-shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Billets vendus</p>
                <p className="text-2xl font-bold text-green-600">{totalTicketsSold.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="css-shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus totaux</p>
                <p className="text-2xl font-bold text-purple-600">{totalRevenue.toLocaleString()} TND</p>
              </div>
              <div className="text-purple-600">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card className="css-shadow-elegant">
        <CardHeader>
          <CardTitle>Liste des Événements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">{event.title}</h3>
                    {getStatusBadge(event.status)}
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.stadium}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm">
                    <p className="font-medium">{event.ticketsSold.toLocaleString()} billets</p>
                    <p className="text-green-600 font-semibold">{event.revenue.toLocaleString()} TND</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewEvent(event)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Event Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'Événement</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Titre</Label>
                  <p className="font-semibold">{selectedEvent.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="mt-1">{selectedEvent.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date</Label>
                  <p>{new Date(selectedEvent.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Heure</Label>
                  <p>{selectedEvent.time}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Adversaire</Label>
                  <p>{selectedEvent.opponent}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Stade</Label>
                  <p>{selectedEvent.stadium}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Billets vendus</Label>
                  <p className="font-semibold text-green-600">{selectedEvent.ticketsSold.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Revenus</Label>
                  <p className="font-semibold text-green-600">{selectedEvent.revenue.toLocaleString()} TND</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
