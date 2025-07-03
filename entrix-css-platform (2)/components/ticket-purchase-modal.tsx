"use client"

import { useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TicketPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  ticketType: string
  price: number
  matchName?: string
}

export function TicketPurchaseModal({ isOpen, onClose, ticketType, price, matchName }: TicketPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const { toast } = useToast()

  const handlePurchase = async () => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setStep(3) // Success step

    toast({
      title: "Achat réussi !",
      description: `Votre ${ticketType} a été acheté avec succès.`,
      variant: "success",
    })

    // Auto close after success
    setTimeout(() => {
      onClose()
      setStep(1)
    }, 3000)
  }

  const totalPrice = price * quantity

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            {step === 3 ? "Achat confirmé" : "Achat de billet"}
          </ModalTitle>
          <ModalDescription>
            {step === 3
              ? "Votre commande a été traitée avec succès"
              : `Finaliser l'achat de votre ${ticketType.toLowerCase()}`}
          </ModalDescription>
        </ModalHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold">{ticketType}</h3>
              {matchName && <p className="text-sm text-gray-600 dark:text-gray-400">{matchName}</p>}
              <p className="text-lg font-bold">{price} TND</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Select value={quantity.toString()} onValueChange={(value) => setQuantity(Number.parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{totalPrice} TND</span>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              Continuer vers le paiement
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="votre@email.com" />
              </div>

              <div>
                <Label htmlFor="cardNumber">Numéro de carte</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiration</Label>
                  <Input id="expiry" placeholder="MM/AA" />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>
                  {ticketType} x{quantity}
                </span>
                <span>{totalPrice} TND</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{totalPrice} TND</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Retour
              </Button>
              <Button onClick={handlePurchase} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Payer {totalPrice} TND
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Paiement réussi !</h3>
              <p className="text-gray-600 dark:text-gray-400">Vous recevrez vos billets par email sous peu.</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Référence:</strong> CSS-{Date.now().toString().slice(-6)}
              </p>
              <p className="text-sm">
                <strong>Billets:</strong> {quantity} x {ticketType}
              </p>
              <p className="text-sm">
                <strong>Total payé:</strong> {totalPrice} TND
              </p>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  )
}
