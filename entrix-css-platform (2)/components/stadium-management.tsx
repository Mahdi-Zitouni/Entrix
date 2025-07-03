"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { MapPin, Users, Plus, Edit, Trash2 } from "lucide-react"
import { useStadium, type Stadium, type Zone } from "./stadium-context"
import { EnhancedStadiumLayout } from "./enhanced-stadium-layout"
import { useToast } from "@/hooks/use-toast"

const zoneColors = [
  {
    value: "bg-blue-200",
    label: "Bleu",
    className: "bg-blue-200 hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700",
  },
  {
    value: "bg-green-200",
    label: "Vert",
    className: "bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700",
  },
  {
    value: "bg-yellow-200",
    label: "Jaune",
    className: "bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800 dark:hover:bg-yellow-700",
  },
  {
    value: "bg-orange-200",
    label: "Orange",
    className: "bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700",
  },
  {
    value: "bg-pink-200",
    label: "Rose",
    className: "bg-pink-200 hover:bg-pink-300 dark:bg-pink-800 dark:hover:bg-pink-700",
  },
  {
    value: "bg-purple-200",
    label: "Violet",
    className: "bg-purple-200 hover:bg-purple-300 dark:bg-purple-800 dark:hover:bg-purple-700",
  },
  {
    value: "bg-red-200",
    label: "Rouge",
    className: "bg-red-200 hover:bg-red-300 dark:bg-red-800 dark:hover:bg-red-700",
  },
]

export function StadiumManagement() {
  const {
    stadiums,
    currentStadium,
    setCurrentStadium,
    addStadium,
    updateStadium,
    deleteStadium,
    addZone,
    updateZone,
    deleteZone,
  } = useStadium()

  const [isCreateStadiumModalOpen, setIsCreateStadiumModalOpen] = useState(false)
  const [isCreateZoneModalOpen, setIsCreateZoneModalOpen] = useState(false)
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  const [stadiumFormData, setStadiumFormData] = useState({
    name: "",
    description: "",
    capacity: 0,
  })

  const [zoneFormData, setZoneFormData] = useState({
    name: "",
    description: "",
    basePrice: 0,
    total: 0,
    color: "bg-blue-200",
    gridArea: "1 / 1 / 2 / 2",
  })

  const { toast } = useToast()

  const handleCreateStadium = () => {
    if (!stadiumFormData.name || !stadiumFormData.description || stadiumFormData.capacity <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    const newStadium: Omit<Stadium, "id"> = {
      ...stadiumFormData,
      zones: [],
      isActive: true,
    }

    addStadium(newStadium)
    setStadiumFormData({ name: "", description: "", capacity: 0 })
    setIsCreateStadiumModalOpen(false)
    toast({
      title: "Succès",
      description: "Stade créé avec succès",
    })
  }

  const handleCreateZone = () => {
    if (!currentStadium || !zoneFormData.name || zoneFormData.basePrice <= 0 || zoneFormData.total <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    const colorConfig = zoneColors.find((c) => c.value === zoneFormData.color)
    const newZone: Omit<Zone, "id"> = {
      ...zoneFormData,
      available: zoneFormData.total,
      isActive: true,
      position: {
        gridArea: zoneFormData.gridArea,
        className: colorConfig?.className || zoneColors[0].className,
      },
    }

    addZone(currentStadium.id, newZone)
    setZoneFormData({
      name: "",
      description: "",
      basePrice: 0,
      total: 0,
      color: "bg-blue-200",
      gridArea: "1 / 1 / 2 / 2",
    })
    setIsCreateZoneModalOpen(false)
    toast({
      title: "Succès",
      description: "Zone créée avec succès",
    })
  }

  const handleEditZone = () => {
    if (
      !currentStadium ||
      !selectedZone ||
      !zoneFormData.name ||
      zoneFormData.basePrice <= 0 ||
      zoneFormData.total <= 0
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    const colorConfig = zoneColors.find((c) => c.value === zoneFormData.color)
    const updates: Partial<Zone> = {
      ...zoneFormData,
      position: {
        gridArea: zoneFormData.gridArea,
        className: colorConfig?.className || zoneColors[0].className,
      },
    }

    updateZone(currentStadium.id, selectedZone.id, updates)
    setIsEditZoneModalOpen(false)
    setSelectedZone(null)
    toast({
      title: "Succès",
      description: "Zone mise à jour avec succès",
    })
  }

  const handleToggleZone = (zoneId: string, isActive: boolean) => {
    if (!currentStadium) return
    updateZone(currentStadium.id, zoneId, { isActive })
    toast({
      title: "Succès",
      description: `Zone ${isActive ? "activée" : "désactivée"} avec succès`,
    })
  }

  const handleDeleteZone = (zoneId: string) => {
    if (!currentStadium) return
    deleteZone(currentStadium.id, zoneId)
    toast({
      title: "Succès",
      description: "Zone supprimée avec succès",
    })
  }

  const openEditZoneModal = (zone: Zone) => {
    setSelectedZone(zone)
    setZoneFormData({
      name: zone.name,
      description: zone.description,
      basePrice: zone.basePrice,
      total: zone.total,
      color: zone.color,
      gridArea: zone.position.gridArea,
    })
    setIsEditZoneModalOpen(true)
  }

  const totalCapacity = currentStadium?.zones.reduce((sum, zone) => sum + zone.total, 0) || 0
  const activeZones = currentStadium?.zones.filter((zone) => zone.isActive).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display">Gestion des Stades</h2>
          <p className="text-gray-600 dark:text-gray-400">Gérez les stades et leurs zones</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateStadiumModalOpen} onOpenChange={setIsCreateStadiumModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Stade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Stade</DialogTitle>
                <DialogDescription>Ajoutez les informations de base du stade</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="stadium-name">Nom du stade *</Label>
                  <Input
                    id="stadium-name"
                    value={stadiumFormData.name}
                    onChange={(e) => setStadiumFormData({ ...stadiumFormData, name: e.target.value })}
                    placeholder="Stade Taïeb Mhiri"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stadium-description">Description *</Label>
                  <Textarea
                    id="stadium-description"
                    value={stadiumFormData.description}
                    onChange={(e) => setStadiumFormData({ ...stadiumFormData, description: e.target.value })}
                    placeholder="Description du stade..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stadium-capacity">Capacité totale *</Label>
                  <Input
                    id="stadium-capacity"
                    type="number"
                    value={stadiumFormData.capacity}
                    onChange={(e) =>
                      setStadiumFormData({ ...stadiumFormData, capacity: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="15000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateStadiumModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateStadium}>Créer le Stade</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stadium Selection */}
      <Card className="css-shadow-elegant">
        <CardHeader>
          <CardTitle>Stade Actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Select
              value={currentStadium?.id || ""}
              onValueChange={(value) => {
                const stadium = stadiums.find((s) => s.id === value)
                setCurrentStadium(stadium || null)
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Sélectionner un stade" />
              </SelectTrigger>
              <SelectContent>
                {stadiums.map((stadium) => (
                  <SelectItem key={stadium.id} value={stadium.id}>
                    {stadium.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentStadium && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{totalCapacity.toLocaleString()} places</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{activeZones} zones actives</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentStadium && (
        <>
          {/* Stadium Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedStadiumLayout
              selectedZone={selectedZoneId}
              onZoneSelect={setSelectedZoneId}
              showAvailability={false}
            />

            {/* Zone Management */}
            <Card className="css-shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Gestion des Zones
                  <Dialog open={isCreateZoneModalOpen} onOpenChange={setIsCreateZoneModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter Zone
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Créer une Nouvelle Zone</DialogTitle>
                        <DialogDescription>Définissez les caractéristiques de la zone</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="zone-name">Nom de la zone *</Label>
                            <Input
                              id="zone-name"
                              value={zoneFormData.name}
                              onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                              placeholder="Tribune Nord"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zone-color">Couleur</Label>
                            <Select
                              value={zoneFormData.color}
                              onValueChange={(value) => setZoneFormData({ ...zoneFormData, color: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {zoneColors.map((color) => (
                                  <SelectItem key={color.value} value={color.value}>
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-4 h-4 rounded ${color.value}`}></div>
                                      <span>{color.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zone-description">Description</Label>
                          <Textarea
                            id="zone-description"
                            value={zoneFormData.description}
                            onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                            placeholder="Description de la zone..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="zone-price">Prix de base (TND) *</Label>
                            <Input
                              id="zone-price"
                              type="number"
                              value={zoneFormData.basePrice}
                              onChange={(e) =>
                                setZoneFormData({ ...zoneFormData, basePrice: Number.parseFloat(e.target.value) || 0 })
                              }
                              placeholder="45"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zone-capacity">Capacité *</Label>
                            <Input
                              id="zone-capacity"
                              type="number"
                              value={zoneFormData.total}
                              onChange={(e) =>
                                setZoneFormData({ ...zoneFormData, total: Number.parseInt(e.target.value) || 0 })
                              }
                              placeholder="1200"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zone-grid">Position (Grid Area)</Label>
                          <Input
                            id="zone-grid"
                            value={zoneFormData.gridArea}
                            onChange={(e) => setZoneFormData({ ...zoneFormData, gridArea: e.target.value })}
                            placeholder="1 / 1 / 2 / 4"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateZoneModalOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleCreateZone}>Créer la Zone</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentStadium.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${zone.color}`}></div>
                        <div>
                          <h4 className="font-medium">{zone.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{zone.basePrice} TND</span>
                            <span>•</span>
                            <span>{zone.total} places</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={zone.isActive}
                          onCheckedChange={(checked) => handleToggleZone(zone.id, checked)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => openEditZoneModal(zone)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteZone(zone.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Zone Modal */}
          <Dialog open={isEditZoneModalOpen} onOpenChange={setIsEditZoneModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Modifier la Zone</DialogTitle>
                <DialogDescription>Modifiez les caractéristiques de la zone</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-name">Nom de la zone *</Label>
                    <Input
                      id="edit-zone-name"
                      value={zoneFormData.name}
                      onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                      placeholder="Tribune Nord"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-color">Couleur</Label>
                    <Select
                      value={zoneFormData.color}
                      onValueChange={(value) => setZoneFormData({ ...zoneFormData, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneColors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded ${color.value}`}></div>
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zone-description">Description</Label>
                  <Textarea
                    id="edit-zone-description"
                    value={zoneFormData.description}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                    placeholder="Description de la zone..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-price">Prix de base (TND) *</Label>
                    <Input
                      id="edit-zone-price"
                      type="number"
                      value={zoneFormData.basePrice}
                      onChange={(e) =>
                        setZoneFormData({ ...zoneFormData, basePrice: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone-capacity">Capacité *</Label>
                    <Input
                      id="edit-zone-capacity"
                      type="number"
                      value={zoneFormData.total}
                      onChange={(e) =>
                        setZoneFormData({ ...zoneFormData, total: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="1200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zone-grid">Position (Grid Area)</Label>
                  <Input
                    id="edit-zone-grid"
                    value={zoneFormData.gridArea}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, gridArea: e.target.value })}
                    placeholder="1 / 1 / 2 / 4"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditZoneModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditZone}>Sauvegarder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
