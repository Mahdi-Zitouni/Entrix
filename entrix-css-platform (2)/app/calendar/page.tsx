"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { TicketPurchaseModal } from "@/components/ticket-purchase-modal"

const matches = [
  {
    id: 1,
    opponent: "Espérance Sportive de Tunis",
    date: "2025-01-15",
    time: "16:00",
    venue: "Stade Taïeb Mhiri",
    competition: "Championnat",
    status: "upcoming",
    ticketsAvailable: true,
    price: 75, // Changed from 25€ to 75 TND
    homeAway: "home",
  },
  {
    id: 2,
    opponent: "Club Africain",
    date: "2025-01-22",
    time: "19:00",
    venue: "Stade Olympique de Radès",
    competition: "Coupe de Tunisie",
    status: "upcoming",
    ticketsAvailable: true,
    price: 90, // Changed from 30€ to 90 TND
    homeAway: "away",
  },
  {
    id: 3,
    opponent: "Étoile Sportive du Sahel",
    date: "2025-01-29",
    time: "15:30",
    venue: "Stade Taïeb Mhiri",
    competition: "Championnat",
    status: "upcoming",
    ticketsAvailable: false,
    price: 75, // Changed from 25€ to 75 TND
    homeAway: "home",
  },
  {
    id: 4,
    opponent: "Stade Tunisien",
    date: "2025-02-05",
    time: "18:00",
    venue: "Stade Taïeb Mhiri",
    competition: "Championnat",
    status: "upcoming",
    ticketsAvailable: true,
    price: 60, // Changed from 20€ to 60 TND
    homeAway: "home",
  },
  {
    id: 5,
    opponent: "US Monastir",
    date: "2025-02-12",
    time: "16:30",
    venue: "Stade Mustapha Ben Jannet",
    competition: "Championnat",
    status: "upcoming",
    ticketsAvailable: true,
    price: 75, // Changed from 25€ to 75 TND
    homeAway: "away",
  },
]

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 0)) // January 2025
  const [selectedMatch, setSelectedMatch] = useState<(typeof matches)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "home" | "away">("all")

  const handleTicketPurchase = (match: (typeof matches)[0]) => {
    setSelectedMatch(match)
    setIsModalOpen(true)
  }

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true
    return match.homeAway === filter
  })

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-gray-900 dark:text-white mb-4">
              Calendrier des Matchs
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Tous les matchs de la saison 2024-2025</p>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={prevMonth} className="bg-transparent hover-lift">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-bold font-display">
                {currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </h2>
              <Button variant="outline" onClick={nextMonth} className="bg-transparent hover-lift">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-black text-white" : "bg-transparent hover-lift"}
              >
                Tous
              </Button>
              <Button
                variant={filter === "home" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("home")}
                className={filter === "home" ? "bg-black text-white" : "bg-transparent hover-lift"}
              >
                Domicile
              </Button>
              <Button
                variant={filter === "away" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("away")}
                className={filter === "away" ? "bg-black text-white" : "bg-transparent hover-lift"}
              >
                Extérieur
              </Button>
            </div>
          </div>

          {/* Matches Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-all duration-300 hover-lift">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={match.competition === "Championnat" ? "default" : "secondary"}>
                        {match.competition}
                      </Badge>
                      <Badge variant={match.homeAway === "home" ? "default" : "outline"}>
                        {match.homeAway === "home" ? "Domicile" : "Extérieur"}
                      </Badge>
                    </div>
                    <Badge variant={match.ticketsAvailable ? "default" : "outline"}>
                      {match.ticketsAvailable ? "Billets disponibles" : "Complet"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {match.homeAway === "home" ? `CSS vs ${match.opponent}` : `${match.opponent} vs CSS`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(match.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      {match.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {match.venue}
                    </div>
                    {match.ticketsAvailable && match.homeAway === "home" && (
                      <div className="flex items-center text-sm font-medium text-black dark:text-white">
                        <span>À partir de {match.price} TND</span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-300"
                    disabled={!match.ticketsAvailable || match.homeAway === "away"}
                    onClick={() => handleTicketPurchase(match)}
                  >
                    {match.homeAway === "away"
                      ? "Match à l'extérieur"
                      : match.ticketsAvailable
                        ? "Réserver des billets"
                        : "Match complet"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Aucun match trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400">Aucun match ne correspond aux critères sélectionnés.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {selectedMatch && (
        <TicketPurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ticketType="Billet Match"
          price={selectedMatch.price}
          matchName={`CSS vs ${selectedMatch.opponent}`}
        />
      )}
    </div>
  )
}
