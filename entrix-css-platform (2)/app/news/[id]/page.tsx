import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Share2, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Mock data - in a real app, this would come from an API
const newsArticles = {
  "1": {
    id: "1",
    title: "Victoire éclatante contre l'EST",
    content: `
      <p>Le Club Sportif Sfaxien a livré une performance exceptionnelle hier soir au stade Taïeb Mhiri, s'imposant 3-1 face à l'Espérance Sportive de Tunis dans un match qui restera gravé dans les mémoires.</p>
      
      <p>Dès les premières minutes, les joueurs du CSS ont montré leur détermination et leur volonté de dominer cette rencontre cruciale. L'ouverture du score est venue à la 15ème minute grâce à un magnifique coup franc de notre capitaine, qui a su trouver la lucarne opposée avec une précision chirurgicale.</p>
      
      <p>La seconde période a été marquée par une intensité remarquable. Malgré l'égalisation temporaire de l'EST à la 55ème minute, nos joueurs ont su garder leur sang-froid et ont répondu par deux buts spectaculaires dans les 20 dernières minutes du match.</p>
      
      <p>Cette victoire consolide notre position en tête du championnat et démontre une fois de plus la qualité exceptionnelle de notre équipe et de notre staff technique. Les supporters présents dans les tribunes ont créé une ambiance électrisante qui a sans aucun doute contribué à cette performance remarquable.</p>
      
      <p>Le prochain match aura lieu le 22 janvier contre le Club Africain. Nous comptons sur votre soutien pour continuer sur cette lancée positive !</p>
    `,
    excerpt: "Le CSS s'impose 3-1 face à l'Espérance dans un match spectaculaire au stade Taïeb Mhiri.",
    date: "2025-01-10",
    category: "Match",
    image: "/placeholder.svg?height=400&width=800",
    author: "Équipe CSS Media",
    readTime: "3 min",
  },
  "2": {
    id: "2",
    title: "Nouveau renfort en attaque",
    content: `
      <p>Le Club Sportif Sfaxien est fier d'annoncer l'arrivée d'un nouveau talent exceptionnel dans ses rangs. Notre nouveau attaquant international apporte avec lui une expérience précieuse et des qualités techniques remarquables.</p>
      
      <p>Âgé de 26 ans, ce joueur polyvalent a évolué dans plusieurs championnats européens et possède une expérience internationale solide avec sa sélection nationale. Son profil correspond parfaitement aux ambitions du club et aux exigences de notre système de jeu.</p>
      
      <p>Le président du club s'est exprimé sur cette acquisition : "Nous sommes ravis d'accueillir ce joueur de grande qualité. Son expérience et sa mentalité de gagnant seront des atouts précieux pour notre équipe."</p>
      
      <p>L'intégration du nouveau joueur se déroule dans d'excellentes conditions, et il devrait être disponible pour le prochain match contre le Club Africain. Les supporters peuvent s'attendre à découvrir un joueur technique, rapide et efficace devant les buts.</p>
    `,
    excerpt: "Le club annonce l'arrivée d'un nouvel attaquant international pour renforcer l'équipe.",
    date: "2025-01-08",
    category: "Transfert",
    image: "/placeholder.svg?height=400&width=800",
    author: "Direction Sportive",
    readTime: "2 min",
  },
}

interface NewsDetailPageProps {
  params: {
    id: string
  }
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const article = newsArticles[params.id as keyof typeof newsArticles]

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article non trouvé</h1>
            <Link href="/news">
              <Button>Retour aux actualités</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" className="bg-transparent hover-lift">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge variant={article.category === "Match" ? "default" : "secondary"}>{article.category}</Badge>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(article.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{article.readTime} de lecture</span>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold font-display text-gray-900 dark:text-white mb-4 leading-tight">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{article.excerpt}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CSS</span>
                </div>
                <div>
                  <p className="font-medium">{article.author}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Équipe de rédaction</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="bg-transparent hover-lift">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent hover-lift">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <div className="relative h-64 lg:h-96 rounded-xl overflow-hidden css-shadow-elegant">
              <Image src={article.image || "/placeholder.svg"} alt={article.title} fill className="object-cover" />
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div
              dangerouslySetInnerHTML={{ __html: article.content }}
              className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-6"
            />
          </div>

          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" className="bg-transparent hover-lift">
                  <Heart className="h-4 w-4 mr-2" />
                  J'aime
                </Button>
                <Button variant="outline" className="bg-transparent hover-lift">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>

              <Link href="/">
                <Button className="bg-black hover:bg-gray-800 text-white">Plus d'actualités</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
