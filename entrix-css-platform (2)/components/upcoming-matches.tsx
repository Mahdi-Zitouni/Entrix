"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Ticket } from "lucide-react"
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
  },
]

export function UpcomingMatches() {
  const [selectedMatch, setSelectedMatch] = useState<(typeof matches)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleTicketPurchase = (match: (typeof matches)[0]) => {
    setSelectedMatch(match)
    setIsModalOpen(true)
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">Prochains Matchs</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Ne manquez aucun match du Club Sportif Sfaxien</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-all duration-300 hover-lift">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={match.competition === "Championnat" ? "default" : "secondary"}>
                    {match.competition}
                  </Badge>
                  <Badge variant={match.ticketsAvailable ? "default" : "outline"}>
                    {match.ticketsAvailable ? "Billets disponibles" : "Complet"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">CSS vs {match.opponent}</CardTitle>
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
                  {match.ticketsAvailable && (
                    <div className="flex items-center text-sm font-medium text-black dark:text-white">
                      <Ticket className="h-4 w-4 mr-2" />À partir de {match.price} TND
                    </div>
                  )}
                </div>
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-300"
                  disabled={!match.ticketsAvailable}
                  onClick={() => handleTicketPurchase(match)}
                >
                  {match.ticketsAvailable ? "Réserver des billets" : "Match complet"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedMatch && (
        <TicketPurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ticketType="Billet Match"
          price={selectedMatch.price}
          matchName={`CSS vs ${selectedMatch.opponent}`}
        />
      )}
    </section>
  )
}
