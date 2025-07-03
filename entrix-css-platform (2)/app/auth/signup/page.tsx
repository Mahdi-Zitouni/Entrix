"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Signup failed")
      }
      setSuccess(true)
      setTimeout(() => router.push("/auth/signin"), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center bg-background py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/images/css-logo-new.png" alt="CSS Logo" width={60} height={60} className="rounded-lg" />
            </div>
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">Rejoignez la plateforme Entrix CSS</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mb-2">Inscription réussie ! Redirection...</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded mb-2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="firstName">Prénom</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Votre prénom"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded mb-2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName">Nom</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Votre nom"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded mb-2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mot de passe (min 8 caractères)"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                  className="w-full px-4 py-2 border rounded mb-2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone">Téléphone (optionnel)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Votre numéro de téléphone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded mb-2"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark transition"
              >
                {loading ? "Inscription..." : "S'inscrire"}
              </button>
            </form>
            <Separator />
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Déjà un compte ? {" "}
              <Button variant="link" className="p-0 h-auto font-normal" onClick={() => router.push('/auth/signin')}>
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  )
} 