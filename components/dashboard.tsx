"use client"

import { useState, useEffect } from "react"
import { HardDrive, Film, Tv, Database, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StorageUsageChart } from "@/components/charts/storage-usage-chart"
import { HDComparisonChart } from "@/components/charts/hd-comparison-chart"
import { StorageHistoryChart } from "@/components/charts/storage-history-chart"
import { MediaDistributionChart } from "@/components/charts/media-distribution-chart"
import { NotificationCenter } from "@/components/notification-center"
import { useNotifications } from "@/hooks/use-notifications"
import type { HD, Movie, Series } from "@/lib/types"

export function Dashboard() {
  const [hds, setHds] = useState<HD[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const { notifications, addNotification } = useNotifications()

  // Load data from localStorage
  useEffect(() => {
    const storedHds = localStorage.getItem("hds")
    const storedMovies = localStorage.getItem("movies")
    const storedSeries = localStorage.getItem("series")

    if (storedHds) {
      setHds(JSON.parse(storedHds))
    }

    if (storedMovies) {
      setMovies(JSON.parse(storedMovies))
    }

    if (storedSeries) {
      setSeries(JSON.parse(storedSeries))
    }

    // Simulate initial notifications
    setTimeout(() => {
      addNotification({
        id: Date.now().toString(),
        title: "Bem-vindo ao Movie Cover Manager",
        message: "O sistema está pronto para gerenciar sua biblioteca de mídia.",
        type: "info",
        timestamp: new Date(),
      })
    }, 1000)

    // Simulate HD connection/disconnection events
    setTimeout(() => {
      const randomHd = Math.floor(Math.random() * 3) + 1
      const hdName = `HD ${randomHd}`

      addNotification({
        id: Date.now().toString(),
        title: "HD Conectado",
        message: `${hdName} foi conectado com sucesso.`,
        type: "success",
        timestamp: new Date(),
      })

      // Update HD status
      if (storedHds) {
        const updatedHds = JSON.parse(storedHds).map((hd: HD) => {
          if (hd.id === randomHd.toString()) {
            return { ...hd, connected: true }
          }
          return hd
        })

        setHds(updatedHds)
        localStorage.setItem("hds", JSON.stringify(updatedHds))
      }
    }, 5000)

    // Simulate low space warning
    setTimeout(() => {
      addNotification({
        id: Date.now().toString(),
        title: "Espaço em Disco Baixo",
        message: "HD 1TB Western Digital está com menos de 10% de espaço livre.",
        type: "warning",
        timestamp: new Date(),
      })
    }, 10000)

    // Simulate indexing completion
    setTimeout(() => {
      addNotification({
        id: Date.now().toString(),
        title: "Indexação Concluída",
        message: "A indexação de mídia foi concluída com sucesso. 120 arquivos processados.",
        type: "success",
        timestamp: new Date(),
      })
    }, 15000)
  }, [addNotification])

  // Calculate statistics
  const totalHDs = hds.length
  const connectedHDs = hds.filter((hd) => hd.connected).length
  const totalMovies = movies.length
  const totalSeries = series.length

  const totalSpace = hds.reduce((acc, hd) => acc + hd.totalSpace, 0)
  const totalFreeSpace = hds.reduce((acc, hd) => acc + hd.freeSpace, 0)
  const totalUsedSpace = totalSpace - totalFreeSpace
  const usedPercentage = Math.round((totalUsedSpace / totalSpace) * 100)

  const formatSpace = (space: number) => {
    if (space >= 1000) {
      return `${(space / 1000).toFixed(2)} TB`
    }
    return `${space.toFixed(2)} GB`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
          <p className="text-blue-700">Visão geral da sua biblioteca de mídia</p>
        </div>

        <NotificationCenter notifications={notifications} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <HardDrive className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600">HDs Conectados</p>
              <p className="text-2xl font-bold text-blue-900">
                {connectedHDs}/{totalHDs}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <Film className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total de Filmes</p>
              <p className="text-2xl font-bold text-blue-900">{totalMovies}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <Tv className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total de Séries</p>
              <p className="text-2xl font-bold text-blue-900">{totalSeries}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <Database className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Espaço Utilizado</p>
              <p className="text-2xl font-bold text-blue-900">{usedPercentage}%</p>
              <p className="text-xs text-blue-500">
                {formatSpace(totalUsedSpace)} de {formatSpace(totalSpace)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uso de Armazenamento</CardTitle>
          </CardHeader>
          <CardContent>
            <StorageUsageChart hds={hds} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparação de HDs</CardTitle>
          </CardHeader>
          <CardContent>
            <HDComparisonChart hds={hds} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Armazenamento</CardTitle>
          </CardHeader>
          <CardContent>
            <StorageHistoryChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Mídia</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaDistributionChart movies={movies} series={series} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.slice(0, 5).map((notification, index) => (
              <div
                key={`notification-${notification.id}-${index}`}
                className="flex items-start gap-3 rounded-md border p-3"
              >
                <div className="mt-0.5">
                  {notification.type === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {notification.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  {notification.type === "error" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  {notification.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">{notification.title}</h4>
                    <span className="text-xs text-blue-500">{notification.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-blue-700">{notification.message}</p>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="flex h-20 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 text-center">
                <p className="text-blue-700">Nenhuma atividade recente.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

