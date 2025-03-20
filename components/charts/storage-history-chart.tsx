"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

// Register Chart.js components
Chart.register(...registerables)

export function StorageHistoryChart() {
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

    // Generate sample data for the last 30 days
    const labels = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - 29 + i)
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    })

    // Simulate storage usage over time for 3 HDs
    const hd1Data = Array.from({ length: 30 }, (_, i) => {
      // Start at 500GB and gradually increase
      return 500 + Math.floor(i * 5 + Math.random() * 20)
    })

    const hd2Data = Array.from({ length: 30 }, (_, i) => {
      // Start at 800GB and increase more slowly
      return 800 + Math.floor(i * 3 + Math.random() * 15)
    })

    const hd3Data = Array.from({ length: 30 }, (_, i) => {
      // Start at 1200GB with some fluctuations
      return 1200 + Math.floor(i * 2 + Math.sin(i) * 30 + Math.random() * 10)
    })

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "HD 1TB Western Digital",
            data: hd1Data,
            borderColor: "#3B82F6", // Blue
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
          {
            label: "HD 2TB Seagate",
            data: hd2Data,
            borderColor: "#10B981", // Green
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
          {
            label: "HD 4TB Toshiba",
            data: hd3Data,
            borderColor: "#F59E0B", // Amber
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: "#1E40AF", // Dark blue
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              display: false,
            },
            title: {
              display: true,
              text: "Data",
              color: "#1E40AF", // Dark blue
            },
          },
          y: {
            ticks: {
              color: "#1E40AF", // Dark blue
            },
            grid: {
              color: "#E0F2FE", // Light blue
            },
            title: {
              display: true,
              text: "Espaço Utilizado (GB)",
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
        interaction: {
          mode: "index",
          intersect: false,
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <div className="h-[300px]">
      <canvas ref={chartRef} />
    </div>
  )
}

