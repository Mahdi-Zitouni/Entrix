import { AdminDashboard } from "@/components/admin-dashboard"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/auth/signin")
  }
  const user = session.user as typeof session.user & { role?: string }
  if (user.role !== "SUPERADMIN") {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard />
    </div>
  )
}
