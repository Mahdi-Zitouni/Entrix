"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export interface Zone {
  id: string
  name: string
  basePrice: number
  available: number
  total: number
  description: string
  color: string
  isActive: boolean
  position: {
    gridArea: string
    className: string
  }
}

export interface Stadium {
  id: string
  name: string
  description: string
  capacity: number
  zones: Zone[]
  isActive: boolean
}

interface StadiumContextType {
  stadiums: Stadium[]
  currentStadium: Stadium | null
  setCurrentStadium: (stadium: Stadium | null) => void
  addStadium: (stadium: Omit<Stadium, "id">) => void
  updateStadium: (id: string, updates: Partial<Stadium>) => void
  deleteStadium: (id: string) => void
  addZone: (stadiumId: string, zone: Omit<Zone, "id">) => void
  updateZone: (stadiumId: string, zoneId: string, updates: Partial<Zone>) => void
  deleteZone: (stadiumId: string, zoneId: string) => void
  updateSeatAvailability: (stadiumId: string, zoneId: string, quantity: number) => void
}

const StadiumContext = createContext<StadiumContextType | undefined>(undefined)

const defaultStadium: Stadium = {
  id: "stade-taieb-mhiri",
  name: "Stade Taïeb Mhiri",
  description: "Stade principal du Club Sportif Sfaxien",
  capacity: 15000,
  isActive: true,
  zones: [
    {
      id: "tribune-nord",
      name: "Tribune Nord",
      basePrice: 45,
      available: 1200,
      total: 1200,
      description: "Vue excellente, ambiance garantie",
      color: "bg-blue-200",
      isActive: true,
      position: {
        gridArea: "1 / 1 / 2 / 4",
        className: "bg-blue-200 hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700",
      },
    },
    {
      id: "tribune-ouest",
      name: "Tribune Ouest",
      basePrice: 75,
      available: 320,
      total: 320,
      description: "Vue latérale premium",
      color: "bg-orange-200",
      isActive: true,
      position: {
        gridArea: "2 / 1 / 4 / 2",
        className: "bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700",
      },
    },
    {
      id: "tribune-est",
      name: "Tribune Est",
      basePrice: 75,
      available: 450,
      total: 450,
      description: "Vue latérale premium",
      color: "bg-yellow-200",
      isActive: true,
      position: {
        gridArea: "2 / 3 / 4 / 4",
        className: "bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800 dark:hover:bg-yellow-700",
      },
    },
    {
      id: "vip-lateral",
      name: "VIP Latérale",
      basePrice: 180,
      available: 25,
      total: 25,
      description: "Vue latérale, services premium",
      color: "bg-pink-200",
      isActive: true,
      position: {
        gridArea: "3 / 2 / 4 / 2.5",
        className: "bg-pink-200 hover:bg-pink-300 dark:bg-pink-800 dark:hover:bg-pink-700",
      },
    },
    {
      id: "vip-central",
      name: "VIP Centrale",
      basePrice: 240,
      available: 15,
      total: 15,
      description: "Vue centrale, services premium",
      color: "bg-purple-200",
      isActive: true,
      position: {
        gridArea: "3 / 2.5 / 4 / 3",
        className: "bg-purple-200 hover:bg-purple-300 dark:bg-purple-800 dark:hover:bg-purple-700",
      },
    },
    {
      id: "tribune-sud",
      name: "Tribune Sud",
      basePrice: 45,
      available: 800,
      total: 800,
      description: "Proche des supporters, ambiance chaude",
      color: "bg-green-200",
      isActive: true,
      position: {
        gridArea: "4 / 1 / 5 / 4",
        className: "bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700",
      },
    },
  ],
}

export function StadiumProvider({ children }: { children: React.ReactNode }) {
  const [stadiums, setStadiums] = useState<Stadium[]>([defaultStadium])
  const [currentStadium, setCurrentStadium] = useState<Stadium | null>(defaultStadium)

  const addStadium = (newStadium: Omit<Stadium, "id">) => {
    const stadium: Stadium = {
      ...newStadium,
      id: `stadium-${Date.now()}`,
    }
    setStadiums((prev) => [...prev, stadium])
  }

  const updateStadium = (id: string, updates: Partial<Stadium>) => {
    setStadiums((prev) => prev.map((stadium) => (stadium.id === id ? { ...stadium, ...updates } : stadium)))
    if (currentStadium?.id === id) {
      setCurrentStadium((prev) => (prev ? { ...prev, ...updates } : null))
    }
  }

  const deleteStadium = (id: string) => {
    setStadiums((prev) => prev.filter((stadium) => stadium.id !== id))
    if (currentStadium?.id === id) {
      setCurrentStadium(stadiums.find((s) => s.id !== id) || null)
    }
  }

  const addZone = (stadiumId: string, newZone: Omit<Zone, "id">) => {
    const zone: Zone = {
      ...newZone,
      id: `zone-${Date.now()}`,
    }
    updateStadium(stadiumId, {
      zones: [...(stadiums.find((s) => s.id === stadiumId)?.zones || []), zone],
    })
  }

  const updateZone = (stadiumId: string, zoneId: string, updates: Partial<Zone>) => {
    const stadium = stadiums.find((s) => s.id === stadiumId)
    if (stadium) {
      const updatedZones = stadium.zones.map((zone) => (zone.id === zoneId ? { ...zone, ...updates } : zone))
      updateStadium(stadiumId, { zones: updatedZones })
    }
  }

  const deleteZone = (stadiumId: string, zoneId: string) => {
    const stadium = stadiums.find((s) => s.id === stadiumId)
    if (stadium) {
      const updatedZones = stadium.zones.filter((zone) => zone.id !== zoneId)
      updateStadium(stadiumId, { zones: updatedZones })
    }
  }

  const updateSeatAvailability = (stadiumId: string, zoneId: string, quantity: number) => {
    const stadium = stadiums.find((s) => s.id === stadiumId)
    if (stadium) {
      const zone = stadium.zones.find((z) => z.id === zoneId)
      if (zone && zone.available >= quantity) {
        updateZone(stadiumId, zoneId, {
          available: zone.available - quantity,
        })
      }
    }
  }

  return (
    <StadiumContext.Provider
      value={{
        stadiums,
        currentStadium,
        setCurrentStadium,
        addStadium,
        updateStadium,
        deleteStadium,
        addZone,
        updateZone,
        deleteZone,
        updateSeatAvailability,
      }}
    >
      {children}
    </StadiumContext.Provider>
  )
}

export function useStadium() {
  const context = useContext(StadiumContext)
  if (context === undefined) {
    throw new Error("useStadium must be used within a StadiumProvider")
  }
  return context
}
