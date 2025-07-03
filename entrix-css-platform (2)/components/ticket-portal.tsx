"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import {
  MapPin,
  Check,
  ArrowRight,
  ArrowLeft,
  Star,
  Shield,
  AlertCircle,
  Upload,
  CheckCircle,
  Loader2,
  Minus,
  Plus,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { EnhancedStadiumLayout } from "./enhanced-stadium-layout"
import { useStadium } from "./stadium-context"

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

const availableMatches = [
  {
    id: "css-est",
    name: "CSS vs EST",
    date: "2025-01-15",
    time: "16:00",
    venue: "Stade Taïeb Mhiri",
  },
  {
    id: "css-ca",
    name: "CSS vs CA",
    date: "2025-01-22",
    time: "19:00",
    venue: "Stade Taïeb Mhiri",
  },
  {
    id: "css-ess",
    name: "CSS vs ESS",
    date: "2025-01-29",
    time: "15:30",
    venue: "Stade Taïeb Mhiri",
  },
]

const paymentMethods = [
  {
    id: "flouci",
    name: "Flouci",
    description: "Paiement mobile sécurisé",
    icon: "💳",
    requiresReceipt: true,
  },
  {
    id: "smt",
    name: "SMT",
    description: "Société Monétique Tunisienne",
    icon: "🏦",
    requiresReceipt: false,
  },
  {
    id: "card",
    name: "Carte bancaire",
    description: "Visa, Mastercard",
    icon: "💳",
    requiresReceipt: false,
  },
]

export function TicketPortal() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showFlouciModal, setShowFlouciModal] = useState(false)
  const [flouciReceipt, setFlouciReceipt] = useState<File | null>(null)
  const [receiptNumber, setReceiptNumber] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const { currentStadium, updateSeatAvailability } = useStadium()
  const seatSections = currentStadium?.zones.filter((zone) => zone.isActive) || []

  const steps = [
    { id: 1, name: "Sélection", description: "Choisir vos billets" },
    { id: 2, name: "Places", description: "Sélectionner les places" },
    { id: 3, name: "Paiement", description: "Finaliser la commande" },
  ]

  const progress = (currentStep / steps.length) * 100

  const validateStep = (step: number): string[] => {
    const newErrors: string[] = []

    if (step === 1) {
      if (!selectedPlan) {
        newErrors.push("Veuillez sélectionner un type de billet ou d'abonnement")
      }
      if (selectedPlan && selectedPlan.includes("single") && !selectedMatch) {
        newErrors.push("Veuillez sélectionner un match")
      }
    }

    if (step === 2) {
      if (!selectedSection) {
        newErrors.push("Veuillez sélectionner une section")
      }
      if (quantity < 1) {
        newErrors.push("La quantité doit être d'au moins 1")
      }
    }

    if (step === 3) {
      if (!selectedPaymentMethod) {
        newErrors.push("Veuillez sélectionner une méthode de paiement")
      }
    }

    return newErrors
  }

  const handleContinue = () => {
    const stepErrors = validateStep(currentStep)
    setErrors(stepErrors)

    if (stepErrors.length > 0) {
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setCurrentStep(currentStep + 1)
      setIsLoading(false)
      setErrors([])
    }, 1000)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
    setErrors([])
  }

  const handlePayment = () => {
    const stepErrors = validateStep(currentStep)
    setErrors(stepErrors)

    if (stepErrors.length > 0) {
      return
    }

    if (selectedPaymentMethod === "flouci") {
      setShowFlouciModal(true)
    } else {
      processPayment()
    }
  }

  const processPayment = async () => {
    setIsProcessingPayment(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setIsProcessingPayment(false)
    setShowFlouciModal(false)

    toast({
      title: "Paiement réussi !",
      description: "Votre commande a été confirmée. Vous recevrez vos billets par email.",
      variant: "success",
    })

    // Reset form or redirect
    setTimeout(() => {
      window.location.href = "/"
    }, 2000)
  }

  const handleFlouciSubmit = () => {
    if (!flouciReceipt && !receiptNumber) {
      toast({
        title: "Reçu requis",
        description: "Veuillez télécharger le reçu ou saisir le numéro de transaction.",
        variant: "destructive",
      })
      return
    }

    processPayment()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "Le fichier ne doit pas dépasser 5MB.",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format non supporté",
          description: "Veuillez télécharger une image (JPG, PNG, etc.).",
          variant: "destructive",
        })
        return
      }

      setFlouciReceipt(file)
      toast({
        title: "Reçu téléchargé",
        description: "Le reçu a été téléchargé avec succès.",
        variant: "success",
      })
    }
  }

  const getSelectedMatchDetails = () => {
    return availableMatches.find((match) => match.id === selectedMatch)
  }

  const getSelectedSectionDetails = () => {
    return seatSections.find((section) => section.id === selectedSection)
  }

  const calculateTotalPrice = () => {
    if (selectedPlan && selectedPlan !== "single") {
      const plan = subscriptionPlans.find((p) => p.id === selectedPlan)
      return plan ? plan.price : 0
    }

    const section = getSelectedSectionDetails()
    return section ? section.basePrice * quantity : 0
  }

  const canContinue = () => {
    const stepErrors = validateStep(currentStep)
    return stepErrors.length === 0 && !isLoading
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  currentStep >= step.id
                    ? "bg-black text-white css-shadow-elegant"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <div className="ml-3 hidden sm:block">
                <p
                  className={`text-sm font-medium ${currentStep >= step.id ? "text-black dark:text-white" : "text-gray-500"}`}
                >
                  {step.name}
                </p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Selection */}
      {currentStep === 1 && (
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900 dark:text-white mb-8">{t("tickets.title")}</h1>

          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="subscriptions" className="font-medium">
                {t("tickets.subscriptions")}
              </TabsTrigger>
              <TabsTrigger value="single" className="font-medium">
                {t("tickets.single")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all duration-300 hover-lift ${
                      selectedPlan === plan.id
                        ? "ring-2 ring-black dark:ring-white css-shadow-elegant"
                        : "hover:shadow-lg"
                    } ${plan.popular ? "border-black dark:border-white" : ""}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-black text-white css-shadow-elegant">
                          <Star className="h-3 w-3 mr-1" />
                          Populaire
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                      <div className="text-3xl font-bold font-display text-black dark:text-white">{plan.price} TND</div>
                      <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="single" className="space-y-6">
              <div className="mb-6">
                <Label htmlFor="match-select" className="text-base font-medium">
                  Sélectionner un match *
                </Label>
                <Select
                  value={selectedMatch || ""}
                  onValueChange={(value) => {
                    setSelectedMatch(value)
                    setSelectedPlan("single")
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choisir un match" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMatches.map((match) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.name} - {new Date(match.date).toLocaleDateString("fr-FR")} à {match.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMatch && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Match sélectionné</h3>
                    <p className="text-blue-800 dark:text-blue-200">{getSelectedMatchDetails()?.name}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {getSelectedMatchDetails()?.date &&
                        new Date(getSelectedMatchDetails()!.date).toLocaleDateString("fr-FR")}{" "}
                      à {getSelectedMatchDetails()?.time}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">{getSelectedMatchDetails()?.venue}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="btn-primary hover-lift css-shadow-elegant"
            >
              {isLoading ? (
                <span className="loading-dots">Chargement</span>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Seat Selection */}
      {currentStep === 2 && (
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-8">Sélection des places</h2>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <Card className="css-shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center font-display">
                    <MapPin className="h-5 w-5 mr-2" />
                    Plan du stade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8">
                    <div className="text-center mb-6">
                      <div className="bg-green-500 text-white py-3 px-6 rounded-lg mb-6 font-medium css-shadow-elegant">
                        TERRAIN
                      </div>
                    </div>

                    {/* Stadium Layout */}
                    <EnhancedStadiumLayout
                      selectedZone={selectedSection}
                      onZoneSelect={setSelectedSection}
                      showAvailability={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Selected Section Details */}
              {selectedSection && (
                <Card className="css-shadow-elegant">
                  <CardHeader>
                    <CardTitle className="font-display">Section sélectionnée</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{getSelectedSectionDetails()?.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{getSelectedSectionDetails()?.description}</p>
                        <p className="text-2xl font-bold text-black dark:text-white mt-2">
                          {getSelectedSectionDetails()?.basePrice} TND{" "}
                          <span className="text-sm font-normal">par billet</span>
                        </p>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Places disponibles:</span>
                        <span className="font-medium">
                          {getSelectedSectionDetails()?.available}/{getSelectedSectionDetails()?.total}
                        </span>
                      </div>
                      <Progress
                        value={
                          getSelectedSectionDetails()
                            ? (getSelectedSectionDetails()!.available / getSelectedSectionDetails()!.total) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quantity Selection */}
              <Card className="css-shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display">Quantité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Nombre de billets:</span>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover-lift bg-transparent"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium w-8 text-center text-lg">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover-lift bg-transparent"
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          disabled={quantity >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{calculateTotalPrice()} TND</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack} className="hover-lift bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="btn-primary hover-lift css-shadow-elegant"
            >
              {isLoading ? (
                <span className="loading-dots">Chargement</span>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {currentStep === 3 && (
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-8">Paiement sécurisé</h2>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="css-shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display">Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="font-medium">
                        Prénom
                      </Label>
                      <Input id="firstName" placeholder="Votre prénom" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="font-medium">
                        Nom
                      </Label>
                      <Input id="lastName" placeholder="Votre nom" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="font-medium">
                      Email
                    </Label>
                    <Input id="email" type="email" placeholder="votre@email.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="font-medium">
                      Téléphone
                    </Label>
                    <Input id="phone" placeholder="+216 XX XXX XXX" className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card className="css-shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center font-display">
                    <Shield className="h-5 w-5 mr-2" />
                    Méthode de paiement *
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 mb-6">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover-lift ${
                          selectedPaymentMethod === method.id
                            ? "border-black dark:border-white bg-black/5 dark:bg-white/5 css-shadow-elegant"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPaymentMethod === method.id
                                ? "border-black dark:border-white bg-black dark:bg-white"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {selectedPaymentMethod === method.id && (
                              <div className="w-2 h-2 rounded-full bg-white dark:bg-black"></div>
                            )}
                          </div>
                          <div className="text-2xl">{method.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{method.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                          </div>
                          {selectedPaymentMethod === method.id && <Check className="h-5 w-5 text-green-500" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Details (only show if card is selected) */}
                  {selectedPaymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="cardNumber" className="font-medium">
                          Numéro de carte
                        </Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry" className="font-medium">
                            Expiration
                          </Label>
                          <Input id="expiry" placeholder="MM/AA" className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="cvv" className="font-medium">
                            CVV
                          </Label>
                          <Input id="cvv" placeholder="123" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="css-shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-display">Récapitulatif de commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPlan && selectedPlan !== "single" ? (
                      <div className="flex justify-between">
                        <span>{subscriptionPlans.find((p) => p.id === selectedPlan)?.name}</span>
                        <span className="font-medium">
                          {subscriptionPlans.find((p) => p.id === selectedPlan)?.price} TND
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>Match: {getSelectedMatchDetails()?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Section: {getSelectedSectionDetails()?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantité: {quantity} billet(s)</span>
                          <span className="font-medium">{calculateTotalPrice()} TND</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>Frais de service</span>
                      <span className="font-medium">15 TND</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{calculateTotalPrice() + 15} TND</span>
                    </div>
                    <Button
                      onClick={handlePayment}
                      disabled={!canContinue() || isProcessingPayment}
                      className="w-full btn-primary hover-lift css-shadow-elegant mt-6"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Finaliser le paiement
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-2">Paiement sécurisé SSL 256-bit</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack} className="hover-lift bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      )}

      {/* Flouci Receipt Modal */}
      <Modal open={showFlouciModal} onOpenChange={setShowFlouciModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center">💳 Paiement Flouci</ModalTitle>
          </ModalHeader>
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Montant à payer</h3>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{calculateTotalPrice() + 15} TND</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Effectuez le paiement via Flouci puis téléchargez le reçu ou saisissez le numéro de transaction.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="receiptUpload" className="font-medium">
                  Télécharger le reçu Flouci
                </Label>
                <div className="mt-2">
                  <input
                    id="receiptUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full bg-transparent hover-lift"
                    onClick={() => document.getElementById("receiptUpload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {flouciReceipt ? flouciReceipt.name : "Choisir un fichier"}
                  </Button>
                </div>
                {flouciReceipt && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reçu téléchargé avec succès
                  </div>
                )}
              </div>

              <div className="text-center text-gray-500">
                <span className="text-sm">ou</span>
              </div>

              <div>
                <Label htmlFor="receiptNumber" className="font-medium">
                  Numéro de transaction Flouci
                </Label>
                <Input
                  id="receiptNumber"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Ex: FL123456789"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFlouciModal(false)}
                className="flex-1 bg-transparent hover-lift"
                disabled={isProcessingPayment}
              >
                Annuler
              </Button>
              <Button
                onClick={handleFlouciSubmit}
                disabled={(!flouciReceipt && !receiptNumber) || isProcessingPayment}
                className="flex-1 btn-primary hover-lift"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer le paiement
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Le reçu sera vérifié automatiquement. Vous recevrez une confirmation par email.
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}
