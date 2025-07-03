"use client"

import { useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Gift, Share, Download, Star, Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscription: {
    id: string
    name: string
    price: number
    description: string
    features: string[]
    popular?: boolean
  }
}

export function SubscriptionModal({ isOpen, onClose, subscription }: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<"buy" | "gift" | "transfer" | null>(null)
  const { toast } = useToast()

  const handleAction = async (actionType: "buy" | "gift" | "transfer") => {
    setAction(actionType)
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)

    const messages = {
      buy: "Abonnement acheté avec succès !",
      gift: "Abonnement offert avec succès !",
      transfer: "Abonnement transféré avec succès !",
    }

    toast({
      title: messages[actionType],
      description: `Votre ${subscription.name} a été traité.`,
      variant: "success",
    })

    onClose()
    setAction(null)
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Gestion d'abonnement
          </ModalTitle>
          <ModalDescription>Choisissez une action pour votre abonnement</ModalDescription>
        </ModalHeader>

        <div className="space-y-6">
          {/* Subscription Details */}
          <Card className={`relative ${subscription.popular ? "border-black dark:border-white" : ""}`}>
            {subscription.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-black text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Populaire
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{subscription.name}</CardTitle>
              <div className="text-3xl font-bold">{subscription.price} TND</div>
              <p className="text-gray-600 dark:text-gray-400">{subscription.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => handleAction("buy")}
              disabled={isLoading}
              className="h-16 flex flex-col items-center justify-center bg-black hover:bg-gray-800 text-white"
            >
              {isLoading && action === "buy" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Acheter maintenant</span>
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleAction("gift")}
                disabled={isLoading}
                className="h-16 flex flex-col items-center justify-center bg-transparent hover-lift"
              >
                {isLoading && action === "gift" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Gift className="h-5 w-5 mb-1" />
                    <span className="text-sm font-medium">Offrir</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleAction("transfer")}
                disabled={isLoading}
                className="h-16 flex flex-col items-center justify-center bg-transparent hover-lift"
              >
                {isLoading && action === "transfer" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Share className="h-5 w-5 mb-1" />
                    <span className="text-sm font-medium">Transférer</span>
                  </>
                )}
              </Button>
            </div>

            <Button variant="outline" className="h-12 flex items-center justify-center bg-transparent hover-lift">
              <Download className="h-4 w-4 mr-2" />
              Télécharger les détails
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
