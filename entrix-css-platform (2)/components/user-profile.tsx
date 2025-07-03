"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Ticket, CreditCard, BarChart3, Gift, Download, Share } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const userStats = {
  totalMatches: 12,
  currentSeason: 8,
  subscriptionType: "Abonnement Saison",
  memberSince: "2020",
  favoriteSection: "Tribune Nord",
}

const ticketHistory = [
  {
    id: 1,
    match: "CSS vs EST",
    date: "2025-01-15",
    section: "Tribune Nord",
    status: "upcoming",
    price: 45, // Changed from 15€ to 45 TND
  },
  {
    id: 2,
    match: "CSS vs CA",
    date: "2025-01-08",
    section: "Tribune Nord",
    status: "attended",
    price: 45, // Changed from 15€ to 45 TND
  },
  {
    id: 3,
    match: "CSS vs ESS",
    date: "2024-12-20",
    section: "Tribune Nord",
    status: "attended",
    price: 45, // Changed from 15€ to 45 TND
  },
]

const upcomingMatches = [
  {
    id: 1,
    opponent: "EST",
    date: "2025-01-15",
    time: "16:00",
    venue: "Stade Taïeb Mhiri",
  },
  {
    id: 2,
    opponent: "CA",
    date: "2025-01-22",
    time: "19:00",
    venue: "Stade Olympique",
  },
]

export function UserProfile() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">John Doe</h1>
            <p className="text-gray-600 dark:text-gray-400">Supporter CSS depuis {userStats.memberSince}</p>
            <Badge className="mt-2 bg-red-600 text-white">{userStats.subscriptionType}</Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{userStats.totalMatches}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Matchs assistés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{userStats.currentSeason}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cette saison</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">4</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Années d'abonnement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">95%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux de présence</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="tickets">Billets</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Statistiques de présence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Matchs à domicile</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Matchs à l'extérieur</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Coupes</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: "90%" }}></div>
                      </div>
                      <span className="text-sm font-medium">90%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Prochains matchs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">CSS vs {match.opponent}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(match.date).toLocaleDateString("fr-FR")} - {match.time}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{match.venue}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center">
                  <Gift className="h-6 w-6 mb-2" />
                  <span className="text-sm">Offrir un billet</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                  <Share className="h-6 w-6 mb-2" />
                  <span className="text-sm">Transférer</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                  <CreditCard className="h-6 w-6 mb-2" />
                  <span className="text-sm">Renouveler</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                  <Download className="h-6 w-6 mb-2" />
                  <span className="text-sm">Télécharger</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ticket className="h-5 w-5 mr-2" />
                Historique des billets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticketHistory.map((ticket) => (
                  <div key={ticket.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{ticket.match}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(ticket.date).toLocaleDateString("fr-FR")} - {ticket.section}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={ticket.status === "upcoming" ? "default" : "secondary"}>
                        {ticket.status === "upcoming" ? "À venir" : "Assisté"}
                      </Badge>
                      <span className="font-medium">{ticket.price} TND</span>
                      {ticket.status === "upcoming" && (
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          QR
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier interactif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Calendrier interactif avec tous les matchs de la saison
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du compte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Notifications</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Rappels de matchs
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Actualités du club
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Offres spéciales
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Préférences</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Recevoir les billets par email
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Partage automatique sur réseaux sociaux
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
