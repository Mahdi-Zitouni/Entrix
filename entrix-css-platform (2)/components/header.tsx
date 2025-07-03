"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, X, User, LogOut, Settings, Moon, Sun, Globe, ChevronDown } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const session = null // Static version - remove when auth is fixed
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "fr" : "ar")
  }

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover-lift">
            <div className="relative">
              <Image
                src="/images/css-logo-new.png"
                alt="CSS Logo"
                width={40}
                height={40}
                className="rounded css-shadow-metallic"
              />
            </div>
            <span className="text-xl font-bold font-display text-gray-900 dark:text-white">Entrix CSS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium relative group"
            >
              {t("nav.home")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/tickets"
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium relative group"
            >
              {t("nav.tickets")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {/* TODO: Re-enable authentication check after fixing NextAuth */}
            {/* {session && ( */}
            <Link
              href="/profile"
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium relative group"
            >
              {t("nav.profile")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {/* )} */}
            <Link
              href="/news"
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium relative group"
            >
              {t("nav.news")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {language.toUpperCase()}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Changer la langue / تغيير اللغة</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mode {theme === "dark" ? "clair" : "sombre"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User Menu */}
            {/* TODO: Re-enable authentication after fixing NextAuth */}
            {/* {session ? ( */}
            {false ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {/* {session.user?.name || session.user?.email} */}
                    User Name
                    <ChevronDown className="h-3 w-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  {/* TODO: Re-enable role check after fixing NextAuth */}
                  {/* {session.user?.role === "admin" && ( */}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      {t("dashboard.title")}
                    </Link>
                  </DropdownMenuItem>
                  {/* )} */}
                  <DropdownMenuItem
                    // TODO: Re-enable signOut after fixing NextAuth
                    // onClick={() => signOut()}
                    onClick={() => console.log("Sign out clicked")}
                    className="flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Button asChild className="btn-primary css-shadow-elegant hover-lift">
                  <Link href="/auth/signin">Connexion</Link>
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild variant="outline" className="hover-lift bg-transparent">
                        <Link href="/dashboard">
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Accéder au tableau de bord</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800 css-glass">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.home")}
              </Link>
              <Link
                href="/tickets"
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.tickets")}
              </Link>
              {/* TODO: Re-enable authentication check after fixing NextAuth */}
              {/* {session && ( */}
              <Link
                href="/profile"
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.profile")}
              </Link>
              {/* )} */}
              <Link
                href="/news"
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.news")}
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-medium px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("dashboard.title")}
              </Link>
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {language.toUpperCase()}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
