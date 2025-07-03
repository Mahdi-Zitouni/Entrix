"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { Calendar, MapPin, Users, Trophy, ArrowRight, Play, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

// Slideshow images - you can replace these with actual CSS stadium/team photos
const heroImages = [
  {
    src: "/placeholder.svg?height=800&width=1200",
    alt: "Stade Taïeb Mhiri - Vue panoramique",
    title: "Notre Stade",
  },
  {
    src: "/placeholder.svg?height=800&width=1200",
    alt: "Équipe CSS en action",
    title: "Nos Joueurs",
  },
  {
    src: "/placeholder.svg?height=800&width=1200",
    alt: "Supporters CSS dans les tribunes",
    title: "Nos Supporters",
  },
  {
    src: "/placeholder.svg?height=800&width=1200",
    alt: "Trophées et victoires CSS",
    title: "Nos Victoires",
  },
  {
    src: "/placeholder.svg?height=800&width=1200",
    alt: "Match CSS au stade",
    title: "L'Action",
  },
]

export function HeroSection() {
  const { t } = useLanguage()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance slideshow
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1))
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1))
  }

  const goToPrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? heroImages.length - 1 : prevIndex - 1))
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <section
      className="relative text-white py-20 lg:py-32 overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Slideshow */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
        ))}
      </div>

      {/* Slideshow Controls */}
      <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevImage}
          className="text-white hover:bg-white/20 transition-all duration-300 rounded-full w-12 h-12 p-0"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextImage}
          className="text-white hover:bg-white/20 transition-all duration-300 rounded-full w-12 h-12 p-0"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Slideshow Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex ? "bg-white scale-110" : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Title Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-sm font-medium text-white">{heroImages[currentImageIndex].title}</p>
        </div>
      </div>

      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 z-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="relative group">
                <div className="absolute -inset-4 css-metallic rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image
                  src="/images/css-logo-new.png"
                  alt="CSS Logo"
                  width={100}
                  height={100}
                  className="rounded-full css-shadow-elegant relative z-10"
                />
              </div>
            </div>

            <h1 className="text-4xl lg:text-7xl font-bold font-display mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent drop-shadow-lg">
                {t("hero.title")}
              </span>
            </h1>

            <p className="text-xl lg:text-2xl mb-8 text-gray-200 font-light leading-relaxed drop-shadow-md">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="btn-secondary hover-lift css-shadow-elegant group">
                <Link href="/tickets" className="flex items-center">
                  {t("hero.cta")}
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="btn-glass hover-lift group bg-white/10 backdrop-blur-sm border-white/20"
              >
                <Link href="/news" className="flex items-center">
                  <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Actualités du club
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Calendar,
                title: "Prochain Match",
                subtitle: "CSS vs EST",
                detail: "15 Jan 2025",
                color: "from-black/60 to-black/80",
              },
              {
                icon: MapPin,
                title: "Stade",
                subtitle: "Stade Taïeb Mhiri",
                detail: "Sfax",
                color: "from-black/70 to-black/90",
              },
              {
                icon: Users,
                title: "Abonnés",
                subtitle: "15,000+",
                detail: "Supporters",
                color: "from-black/50 to-black/70",
              },
              {
                icon: Trophy,
                title: "Trophées",
                subtitle: "8 Championnats",
                detail: "Nationaux",
                color: "from-black/80 to-black/95",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`backdrop-blur-md rounded-xl p-6 text-center hover-lift group cursor-pointer bg-gradient-to-br ${item.color} border border-white/10`}
              >
                <item.icon className="h-8 w-8 mx-auto mb-4 text-white group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-semibold font-display mb-2 text-white">{item.title}</h3>
                <p className="text-sm text-gray-200 font-medium">{item.subtitle}</p>
                <p className="text-sm text-gray-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
