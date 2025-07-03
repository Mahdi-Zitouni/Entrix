"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, QrCode, Wifi, WifiOff, Download, Star } from "lucide-react"

export function MobileAppPreview() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display text-gray-900 dark:text-white mb-4">
            Application Mobile CSS
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Accédez à vos billets et gérez vos abonnements depuis votre smartphone
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Phone Mockup */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-[500px] bg-black rounded-[3rem] p-2 css-shadow-elegant">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="bg-black text-white text-xs px-4 py-2 flex justify-between items-center">
                    <span>9:41</span>
                    <div className="flex items-center space-x-1">
                      <Wifi className="h-3 w-3" />
                      <div className="w-6 h-3 border border-white rounded-sm">
                        <div className="w-4 h-1.5 bg-white rounded-sm m-0.5"></div>
                      </div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="p-4 space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">CSS</span>
                      </div>
                      <h3 className="font-bold text-lg">Entrix CSS</h3>
                    </div>

                    {/* QR Scanner */}
                    <Card className="border-2 border-dashed border-gray-300">
                      <CardContent className="p-4 text-center">
                        <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Scanner QR Code</p>
                      </CardContent>
                    </Card>

                    {/* Live Counter */}
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-3 text-center">
                          <div className="text-lg font-bold text-green-600">8,750</div>
                          <p className="text-xs text-green-600">Entrées</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-3 text-center">
                          <div className="text-lg font-bold text-blue-600">15,000</div>
                          <p className="text-xs text-blue-600">Capacité</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Offline Mode Indicator */}
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                      <WifiOff className="h-3 w-3" />
                      <span>Mode hors ligne disponible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold font-display mb-4">Fonctionnalités principales</h3>
              <div className="space-y-4">
                {[
                  {
                    icon: QrCode,
                    title: "Scanner QR intégré",
                    description: "Validation rapide des billets et contrôle d'accès en temps réel",
                  },
                  {
                    icon: Smartphone,
                    title: "Interface optimisée",
                    description: "Design adaptatif pour une expérience utilisateur fluide",
                  },
                  {
                    icon: WifiOff,
                    title: "Mode hors ligne",
                    description: "Fonctionnalités essentielles disponibles sans connexion",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold font-display">{feature.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">4.8/5 sur Google Play</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="btn-primary hover-lift css-shadow-elegant">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger sur Android
                </Button>
                <Button variant="outline" className="hover-lift bg-transparent">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Version iOS bientôt
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
