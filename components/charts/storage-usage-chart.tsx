"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { HD } from "@/lib/types"

// Register Chart.js components
Chart.register(...registerables)

interface StorageUsageChartProps {
  hds: HD[]
}

export function StorageUsageChart({ hds }: StorageUsageChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Prepare data
    const labels = hds.map((hd) => hd.name)
    const usedSpace = hds.map((hd) => hd.totalSpace - hd.freeSpace)
    const freeSpace = hds.map((hd) => hd.freeSpace)
    const colors = hds.map((hd) => hd.color)

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Espaço Utilizado (GB)",
            data: usedSpace,
            backgroundColor: colors.map((color) => `${color}CC`), // Add transparency
            borderColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: {
                size: 12,
              },
              color: "#1E40AF", // Dark blue
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw as number
                const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0) as number
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} GB (${percentage}%)`
              },
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [hds])

  return (
    <div className="h-[300px]">
      <canvas ref={chartRef} />
    </div>
  )
}

