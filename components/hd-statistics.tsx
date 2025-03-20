import { HardDrive, Database, WifiOff, Server } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { HD } from "@/lib/types"

interface HDStatisticsProps {
  hds: HD[]
}

export function HDStatistics({ hds }: HDStatisticsProps) {
  // Calculate statistics
  const totalHDs = hds.length
  const connectedHDs = hds.filter((hd) => hd.connected).length
  const disconnectedHDs = totalHDs - connectedHDs

  // Total space calculations in TB
  const totalSpace = hds.reduce((acc, hd) => acc + hd.totalSpace, 0)
  const totalFreeSpace = hds.reduce((acc, hd) => acc + hd.freeSpace, 0)
  const totalUsedSpace = totalSpace - totalFreeSpace

  // Format space values
  const formatSpace = (space: number) => {
    if (space >= 1) {
      return `${space.toFixed(2)} TB`
    } else {
      return `${(space * 1024).toFixed(0)} GB`
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center p-4">
          <div className="mr-4 rounded-full bg-blue-100 p-2">
            <HardDrive className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-blue-600">HDs Totais</p>
            <p className="text-2xl font-bold text-blue-900">{totalHDs}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-4">
          <div className="mr-4 rounded-full bg-green-100 p-2">
            <HardDrive className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <p className="text-sm text-green-600">HDs Conectados</p>
            <p className="text-2xl font-bold text-green-900">{connectedHDs}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-4">
          <div className="mr-4 rounded-full bg-red-100 p-2">
            <WifiOff className="h-6 w-6 text-red-700" />
          </div>
          <div>
            <p className="text-sm text-red-600">HDs Desconectados</p>
            <p className="text-2xl font-bold text-red-900">{disconnectedHDs}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-4">
          <div className="mr-4 rounded-full bg-blue-100 p-2">
            <Server className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-blue-600">Espaço Total</p>
            <p className="text-2xl font-bold text-blue-900">{formatSpace(totalSpace)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-4">
          <div className="mr-4 rounded-full bg-blue-100 p-2">
            <Database className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-blue-600">Espaço Livre Total</p>
            <p className="text-2xl font-bold text-blue-900">{formatSpace(totalFreeSpace)}</p>
            <p className="text-xs text-blue-500">
              de {formatSpace(totalSpace)} ({Math.round((totalFreeSpace / totalSpace) * 100)}% livre)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

