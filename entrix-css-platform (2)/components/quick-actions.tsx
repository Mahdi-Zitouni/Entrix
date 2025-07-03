"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ticket, CreditCard, Calendar, Users, Gift, Smartphone } from "lucide-react"
import { TicketPurchaseModal } from "@/components/ticket-purchase-modal"
import { SubscriptionModal } from "@/components/subscription-modal"
import { useToast } from "@/hooks/use-toast"

const subscriptionPlans = [
  {
    id: "season",
    name: "Abonnement Saison",
    price: 450, // Changed from 150€ to 450 TND
    description: "Accès à tous les matchs à domicile",
    features: ["Tous les matchs à domicile", "Places réservées", "Réductions boutique", "Newsletter exclusive"],
    popular: true,
  },
  {
    id: "half-season",
    name: "Demi-Saison",
    price: 240, // Changed from 80€ to 240 TND
    description: "Accès aux matchs de la seconde partie de saison",
    features: ["Matchs 2ème partie", "Places réservées", "Réductions boutique"],
    popular: false,
  },
  {
    id: "vip",
    name: "Abonnement VIP",
    price: 900, // Changed from 300€ to 900 TND
    description: "Expérience premium avec services exclusifs",
    features: ["Tous les matchs", "Loges VIP", "Restauration incluse", "Parking gratuit", "Rencontres joueurs"],
    popular: false,
  },
]

const actions = [
  {
    icon: Ticket,
    title: "Billets individuels",
    description: "Achetez des billets pour un match spécifique",
    href: "/tickets/single",
    color: "from-gray-600 to-gray-800",
    action: "ticket",
  },
  {
    icon: CreditCard,
    title: "Abonnements",
    description: "Abonnements saisonniers et packages",
    href: "/tickets/subscriptions",
    color: "from-gray-700 to-gray-900",
    action: "subscription",
  },
  {
    icon: Calendar,
    title: "Calendrier",
    description: "Consultez tous les matchs de la saison",
    href: "/calendar",
    color: "from-gray-500 to-gray-700",
    action: "calendar",
  },
  {
    icon: Users,
    title: "Groupes",
    description: "Réservations pour groupes et entreprises",
    href: "/tickets/groups",
    color: "from-gray-600 to-gray-800",
    action: "groups",
  },
  {
    icon: Gift,
    title: "Cadeaux",
    description: "Offrez des billets ou abonnements",
    href: "/gifts",
    color: "from-gray-400 to-gray-600",
    action: "gifts",
  },
  {
    icon: Smartphone,
    title: "App Mobile",
    description: "Téléchargez notre application mobile",
    href: "/mobile-app",
    color: "from-gray-800 to-black",
    action: "mobile",
  },
]

export function QuickActions() {
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState(subscriptionPlans[0])
  const { toast } = useToast()

  const handleActionClick = (action: string) => {
    switch (action) {
      case "ticket":
        setTicketModalOpen(true)
        break
      case "subscription":
        setSubscriptionModalOpen(true)
        break
      case "calendar":
        toast({
          title: "Calendrier",
          description: "Redirection vers le calendrier des matchs...",
        })
        break
      case "groups":
        toast({
          title: "Réservations groupes",
          description: "Contactez notre service commercial pour les réservations de groupe.",
        })
        break
      case "gifts":
        toast({
          title: "Cadeaux",
          description: "Fonctionnalité de cadeaux bientôt disponible !",
        })
        break
      case "mobile":
        toast({
          title: "Application mobile",
          description: "Téléchargement de l'app mobile en cours...",
        })
        break
      default:
        break
    }
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">Actions Rapides</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Accédez rapidement à nos services</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover-lift cursor-pointer">
              <CardHeader>
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 css-shadow-elegant`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{action.description}</p>
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-300"
                  onClick={() => handleActionClick(action.action)}
                >
                  Accéder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <TicketPurchaseModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        ticketType="Billet individuel"
        price={25}
        matchName="Prochain match CSS"
      />

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        subscription={selectedSubscription}
      />
    </section>
  )
}
