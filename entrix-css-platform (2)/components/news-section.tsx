"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const news = [
  {
    id: 1,
    title: "Victoire éclatante contre l'EST",
    excerpt: "Le CSS s'impose 3-1 face à l'Espérance dans un match spectaculaire au stade Taïeb Mhiri.",
    date: "2025-01-10",
    category: "Match",
    image: "/placeholder.svg?height=200&width=300",
    featured: true,
  },
  {
    id: 2,
    title: "Nouveau renfort en attaque",
    excerpt: "Le club annonce l'arrivée d'un nouvel attaquant international pour renforcer l'équipe.",
    date: "2025-01-08",
    category: "Transfert",
    image: "/placeholder.svg?height=200&width=300",
    featured: false,
  },
  {
    id: 3,
    title: "Programme de formation jeunes",
    excerpt: "Lancement d'un nouveau programme de formation pour les jeunes talents de la région.",
    date: "2025-01-05",
    category: "Formation",
    image: "/placeholder.svg?height=200&width=300",
    featured: false,
  },
]

export function NewsSection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">Actualités du Club</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Restez informé des dernières nouvelles</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/news">
              Voir tout
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured Article */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64 lg:h-80">
                <Image src={news[0].image || "/placeholder.svg"} alt={news[0].title} fill className="object-cover" />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-600 text-white">{news[0].category}</Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(news[0].date).toLocaleDateString("fr-FR")}
                </div>
                <CardTitle className="text-xl lg:text-2xl">{news[0].title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{news[0].excerpt}</p>
                <Button asChild>
                  <Link href={`/news/${news[0].id}`}>Lire la suite</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Other Articles */}
          <div className="space-y-6">
            {news.slice(1).map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <div className="relative h-32">
                  <Image
                    src={article.image || "/placeholder.svg"}
                    alt={article.title}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(article.date).toLocaleDateString("fr-FR")}
                  </div>
                  <CardTitle className="text-sm leading-tight">{article.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{article.excerpt}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/news/${article.id}`}>Lire</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
