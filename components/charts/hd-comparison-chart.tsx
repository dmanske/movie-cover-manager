"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { HD } from "@/lib/types"

// Register Chart.js components
Chart.register(...registerables)

interface HDComparisonChartProps {
  hds: HD[]
}

export function HDComparisonChart({ hds }: HDComparisonChartProps) {
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
      type: "bar",
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
          {
            label: "Espaço Livre (GB)",
            data: freeSpace,
            backgroundColor: colors.map((color) => `${color}33`), // More transparency
            borderColor: colors.map((color) => `${color}66`),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            ticks: {
              color: "#1E40AF", // Dark blue
            },
            grid: {
              display: false,
            },
          },
          y: {
            stacked: true,
            ticks: {
              color: "#1E40AF", // Dark blue
            },
            grid: {
              color: "#E0F2FE", // Light blue
            },
            title: {
              display: true,
              text: "Espaço (GB)",
              color: "#1E40AF", // Dark blue
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#1E40AF", // Dark blue
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || ""
                const value = context.raw as number
                return `${label}: ${value} GB`
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

