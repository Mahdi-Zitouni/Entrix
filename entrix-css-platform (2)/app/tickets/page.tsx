import { Header } from "@/components/header"
import { TicketPortal } from "@/components/ticket-portal"
import { Footer } from "@/components/footer"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

export default async function TicketsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <TicketPortal />
      </main>
      <Footer />
    </div>
  )
}
