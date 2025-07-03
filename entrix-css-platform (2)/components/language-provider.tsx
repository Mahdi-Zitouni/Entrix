"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "ar" | "fr"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.tickets": "التذاكر",
    "nav.profile": "الملف الشخصي",
    "nav.news": "الأخبار",
    "hero.title": "النادي الرياضي الصفاقسي",
    "hero.subtitle": "منصة إدارة الأحداث والتحكم في الوصول",
    "hero.cta": "احجز تذكرتك الآن",
    "tickets.title": "حجز التذاكر",
    "tickets.subscriptions": "الاشتراكات",
    "tickets.single": "تذاكر فردية",
    "profile.title": "الملف الشخصي",
    "profile.history": "التاريخ",
    "profile.subscriptions": "الاشتراكات",
    "dashboard.title": "لوحة التحكم",
    "dashboard.events": "إدارة الأحداث",
    "dashboard.users": "إدارة المستخدمين",
    "dashboard.reports": "التقارير",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.tickets": "Billets",
    "nav.profile": "Profil",
    "nav.news": "Actualités",
    "hero.title": "Club Sportif Sfaxien",
    "hero.subtitle": "Plateforme de gestion d'événements et contrôle d'accès",
    "hero.cta": "Réservez votre billet",
    "tickets.title": "Réservation de billets",
    "tickets.subscriptions": "Abonnements",
    "tickets.single": "Billets individuels",
    "profile.title": "Profil",
    "profile.history": "Historique",
    "profile.subscriptions": "Abonnements",
    "dashboard.title": "Tableau de bord",
    "dashboard.events": "Gestion des événements",
    "dashboard.users": "Gestion des utilisateurs",
    "dashboard.reports": "Rapports",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr")

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)["fr"]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className={language === "ar" ? "rtl" : "ltr"}>{children}</div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
