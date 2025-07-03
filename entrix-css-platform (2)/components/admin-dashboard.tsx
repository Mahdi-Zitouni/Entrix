"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Calendar, Users, TrendingUp, MapPin, BarChart3, PieChartIcon, Activity } from "lucide-react"
import { EventManagement } from "./event-management"
import { StadiumManagement } from "./stadium-management"
import { useStadium } from "./stadium-context"

// Mock data for charts
const revenueData = [
  { month: "Jan", revenue: 45000, tickets: 1200 },
  { month: "Fév", revenue: 52000, tickets: 1400 },
  { month: "Mar", revenue: 48000, tickets: 1300 },
  { month: "Avr", revenue: 61000, tickets: 1650 },
  { month: "Mai", revenue: 55000, tickets: 1500 },
  { month: "Jun", revenue: 67000, tickets: 1800 },
]

const zoneDistribution = [
  { name: "Tribune Nord", value: 35, color: "#3B82F6" },
  { name: "Tribune Sud", value: 30, color: "#10B981" },
  { name: "Tribune Est", value: 15, color: "#F59E0B" },
  { name: "Tribune Ouest", value: 12, color: "#EF4444" },
  { name: "VIP", value: 8, color: "#8B5CF6" },
]

const attendanceData = [
  { match: "CSS vs EST", attendance: 14500, capacity: 15000 },
  { match: "CSS vs CA", attendance: 13200, capacity: 15000 },
  { match: "CSS vs ST", attendance: 12800, capacity: 15000 },
  { match: "CSS vs ESS", attendance: 14800, capacity: 15000 },
  { match: "CSS vs US", attendance: 11500, capacity: 15000 },
]

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { currentStadium, stadiums } = useStadium()

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0)
  const totalTickets = revenueData.reduce((sum, item) => sum + item.tickets, 0)
  const averageAttendance = attendanceData.reduce((sum, item) => sum + item.attendance, 0) / attendanceData.length
  const occupancyRate = (averageAttendance / 15000) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Tableau de Bord Administrateur</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les événements, stades et analysez les performances</p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Événements</span>
            </TabsTrigger>
            <TabsTrigger value="stadiums" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Stades</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="css-shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus totaux</p>
                      <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} TND</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      +12% ce mois
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="css-shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Billets vendus</p>
                      <p className="text-2xl font-bold text-blue-600">{totalTickets.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      +8% ce mois
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="css-shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux d'occupation</p>
                      <p className="text-2xl font-bold text-purple-600">{occupancyRate.toFixed(1)}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      +5% ce mois
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="css-shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stades actifs</p>
                      <p className="text-2xl font-bold text-orange-600">{stadiums.filter((s) => s.isActive).length}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {stadiums.length} total
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="css-shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Évolution des Revenus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value.toLocaleString()} ${name === "revenue" ? "TND" : ""}`,
                          name === "revenue" ? "Revenus" : "Billets",
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Zone Distribution */}
              <Card className="css-shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Répartition par Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={zoneDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {zoneDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Trends */}
            <Card className="css-shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Tendances de Fréquentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="match" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        value.toLocaleString(),
                        name === "attendance" ? "Présence" : "Capacité",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#10B981" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="capacity"
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#EF4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="css-shadow-elegant">
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      action: "Nouveau match créé",
                      details: "CSS vs EST - 15 Février 2024",
                      time: "Il y a 2 heures",
                      type: "event",
                    },
                    {
                      action: "Zone mise à jour",
                      details: "Tribune Nord - Capacité modifiée",
                      time: "Il y a 4 heures",
                      type: "stadium",
                    },
                    {
                      action: "Vente de billets",
                      details: "1,250 billets vendus pour CSS vs CA",
                      time: "Il y a 6 heures",
                      type: "sale",
                    },
                    {
                      action: "Nouveau stade ajouté",
                      details: "Stade Olympique de Sfax",
                      time: "Il y a 1 jour",
                      type: "stadium",
                    },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.type === "event"
                            ? "bg-blue-500"
                            : activity.type === "stadium"
                              ? "bg-green-500"
                              : "bg-purple-500"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{activity.details}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <EventManagement />
          </TabsContent>

          {/* Stadiums Tab */}
          <TabsContent value="stadiums">
            <StadiumManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
