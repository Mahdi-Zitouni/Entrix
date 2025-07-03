"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string>("Une erreur s'est produite lors de l'authentification.")

  useEffect(() => {
    const error = searchParams.get("error")

    if (error) {
      switch (error) {
        case "CredentialsSignin":
          setErrorMessage("Email ou mot de passe incorrect. Veuillez réessayer.")
          break
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
          setErrorMessage("Une erreur s'est produite avec le fournisseur d'authentification. Veuillez réessayer.")
          break
        case "EmailCreateAccount":
        case "EmailSignin":
          setErrorMessage("Une erreur s'est produite avec l'authentification par email. Veuillez réessayer.")
          break
        case "SessionRequired":
          setErrorMessage("Vous devez être connecté pour accéder à cette page.")
          break
        default:
          setErrorMessage("Une erreur inattendue s'est produite. Veuillez réessayer.")
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4 text-red-600">
                <AlertCircle size={48} />
              </div>
              <CardTitle className="text-2xl">Erreur d'authentification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-700 dark:text-gray-300">{errorMessage}</p>
              <div className="flex flex-col space-y-3">
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link href="/auth/signin">Retour à la page de connexion</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Retour à l'accueil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
