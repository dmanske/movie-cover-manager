"use client"

import { useEffect, useRef } from "react"

interface HDSpaceChartProps {
  usedSpace: number
  freeSpace: number
  color: string
}

export function HDSpaceChart({ usedSpace, freeSpace, color }: HDSpaceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const totalSpace = usedSpace + freeSpace
    const usedPercentage = usedSpace / totalSpace

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw pie chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 5

    // Draw free space (light gray)
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = "#E5E7EB" // Light gray
    ctx.fill()

    // Draw used space
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, -0.5 * Math.PI + usedPercentage * 2 * Math.PI)
    ctx.fillStyle = color || "#3B82F6" // Use provided color or default blue
    ctx.fill()

    // Draw inner circle (white hole)
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI)
    ctx.fillStyle = "#FFFFFF"
    ctx.fill()

    // Draw text in center
    ctx.fillStyle = "#1E40AF" // Dark blue
    ctx.font = "bold 14px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${Math.round(usedPercentage * 100)}%`, centerX, centerY)
  }, [usedSpace, freeSpace, color])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} width={120} height={120} className="max-w-full" />
    </div>
  )
}

