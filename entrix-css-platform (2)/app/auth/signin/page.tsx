import { SignInForm } from "@/components/auth/signin-form"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
