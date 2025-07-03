"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Check } from "lucide-react"
import { useStadium, type Zone } from "./stadium-context"

interface EnhancedStadiumLayoutProps {
  selectedZone: string | null
  onZoneSelect: (zoneId: string) => void
  showAvailability?: boolean
}

export function EnhancedStadiumLayout({
  selectedZone,
  onZoneSelect,
  showAvailability = true,
}: EnhancedStadiumLayoutProps) {
  const { currentStadium } = useStadium()

  if (!currentStadium) {
    return (
      <Card className="css-shadow-elegant">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Aucun stade sélectionné</p>
        </CardContent>
      </Card>
    )
  }

  const activeZones = currentStadium.zones.filter((zone) => zone.isActive)

  return (
    <Card className="css-shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center font-display">
          <MapPin className="h-5 w-5 mr-2" />
          {currentStadium.name}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">{currentStadium.description}</p>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
          {/* Stadium Grid Layout - Fixed to match the image */}
          <div className="space-y-3">
            {/* Tribune Nord */}
            <div className="w-full">
              {renderZone(
                activeZones.find((z) => z.id === "tribune-nord"),
                selectedZone,
                onZoneSelect,
                showAvailability,
                "w-full h-20",
              )}
            </div>

            {/* Middle Row with West, VIP sections, and East */}
            <div className="grid grid-cols-4 gap-3 h-32">
              {/* Tribune Ouest */}
              <div className="col-span-1">
                {renderZone(
                  activeZones.find((z) => z.id === "tribune-ouest"),
                  selectedZone,
                  onZoneSelect,
                  showAvailability,
                  "w-full h-full",
                )}
              </div>

              {/* VIP Sections */}
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  {renderZone(
                    activeZones.find((z) => z.id === "vip-lateral"),
                    selectedZone,
                    onZoneSelect,
                    showAvailability,
                    "w-full h-full text-xs",
                  )}
                </div>
                <div>
                  {renderZone(
                    activeZones.find((z) => z.id === "vip-central"),
                    selectedZone,
                    onZoneSelect,
                    showAvailability,
                    "w-full h-full text-xs",
                  )}
                </div>
              </div>

              {/* Tribune Est */}
              <div className="col-span-1">
                {renderZone(
                  activeZones.find((z) => z.id === "tribune-est"),
                  selectedZone,
                  onZoneSelect,
                  showAvailability,
                  "w-full h-full",
                )}
              </div>
            </div>

            {/* Tribune Sud */}
            <div className="w-full">
              {renderZone(
                activeZones.find((z) => z.id === "tribune-sud"),
                selectedZone,
                onZoneSelect,
                showAvailability,
                "w-full h-20",
              )}
            </div>
          </div>

          {/* Stadium Legend */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {activeZones.map((zone) => (
              <div key={zone.id} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${zone.position.className.split(" ")[0]}`}></div>
                <span className="truncate">{zone.name}</span>
                <Badge variant="outline" className="text-xs">
                  {zone.basePrice} TND
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function renderZone(
  zone: Zone | undefined,
  selectedZone: string | null,
  onZoneSelect: (zoneId: string) => void,
  showAvailability: boolean,
  additionalClasses = "",
) {
  if (!zone) return null

  const isSelected = selectedZone === zone.id
  const isAvailable = zone.available > 0
  const occupancyRate = ((zone.total - zone.available) / zone.total) * 100

  return (
    <div
      className={`
        p-3 rounded-lg cursor-pointer transition-all duration-300 hover-lift
        ${zone.position.className}
        ${isSelected ? "ring-2 ring-black dark:ring-white css-shadow-elegant" : ""}
        ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}
        ${additionalClasses}
        flex flex-col items-center justify-center
      `}
      onClick={() => isAvailable && onZoneSelect(zone.id)}
    >
      <div className="text-center">
        <div className="font-medium text-gray-900 dark:text-gray-100">{zone.name}</div>
        <div className="text-sm font-bold">{zone.basePrice} TND</div>
        {showAvailability && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <div className="flex items-center justify-center space-x-1">
              <Users className="h-3 w-3" />
              <span>
                {zone.available}/{zone.total}
              </span>
            </div>
            {occupancyRate > 80 && (
              <Badge variant="destructive" className="text-xs mt-1">
                Presque complet
              </Badge>
            )}
          </div>
        )}
        {isSelected && (
          <div className="mt-1">
            <Check className="h-4 w-4 mx-auto text-green-600" />
          </div>
        )}
      </div>
    </div>
  )
}
