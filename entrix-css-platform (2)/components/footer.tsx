"use client"

import Image from "next/image"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Club Info */}
          <div>
            <div className="flex items-center mb-4">
              <Image src="/images/css-logo-new.png" alt="CSS Logo" width={40} height={40} className="rounded mr-3" />
              <span className="text-xl font-bold">CSS</span>
            </div>
            <p className="text-gray-400 mb-4">
              Club Sportif Sfaxien - Fondé en 1928, l'un des clubs les plus prestigieux de Tunisie.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tickets" className="text-gray-400 hover:text-white transition-colors">
                  Billets
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-gray-400 hover:text-white transition-colors">
                  Calendrier
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-gray-400 hover:text-white transition-colors">
                  Actualités
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-gray-400 hover:text-white transition-colors">
                  Équipe
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/subscriptions" className="text-gray-400 hover:text-white transition-colors">
                  Abonnements
                </Link>
              </li>
              <li>
                <Link href="/groups" className="text-gray-400 hover:text-white transition-colors">
                  Groupes
                </Link>
              </li>
              <li>
                <Link href="/vip" className="text-gray-400 hover:text-white transition-colors">
                  Espaces VIP
                </Link>
              </li>
              <li>
                <Link href="/mobile-app" className="text-gray-400 hover:text-white transition-colors">
                  App Mobile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">Stade Taïeb Mhiri, Sfax</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm">+216 74 123 456</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm">contact@css.tn</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Club Sportif Sfaxien. Tous droits réservés. | Développé par Entrix Platform
          </p>
        </div>
      </div>
    </footer>
  )
}
