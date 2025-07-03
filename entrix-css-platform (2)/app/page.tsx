import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { UpcomingMatches } from "@/components/upcoming-matches"
import { QuickActions } from "@/components/quick-actions"
import { NewsSection } from "@/components/news-section"
import { MobileAppPreview } from "@/components/mobile-app-preview"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <UpcomingMatches />
        <QuickActions />
        <NewsSection />
        <MobileAppPreview />
      </main>
      <Footer />
    </div>
  )
}
