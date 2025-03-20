"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { Movie, Series } from "@/lib/types"

// Register Chart.js components
Chart.register(...registerables)

interface MediaDistributionChartProps {
  movies: Movie[]
  series: Series[]
}

export function MediaDistributionChart({ movies, series }: MediaDistributionChartProps) {
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

    // Count genres for movies and series
    const genreCounts: Record<string, { movies: number; series: number }> = {}

    movies.forEach((movie) => {
      if (movie.genres) {
        movie.genres.forEach((genre) => {
          if (!genreCounts[genre]) {
            genreCounts[genre] = { movies: 0, series: 0 }
          }
          genreCounts[genre].movies += 1
        })
      }
    })

    series.forEach((s) => {
      if (s.genres) {
        s.genres.forEach((genre) => {
          if (!genreCounts[genre]) {
            genreCounts[genre] = { movies: 0, series: 0 }
          }
          genreCounts[genre].series += 1
        })
      }
    })

    // Sort genres by total count and take top 10
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => {
        const totalA = a[1].movies + a[1].series
        const totalB = b[1].movies + b[1].series
        return totalB - totalA
      })
      .slice(0, 10)

    const labels = topGenres.map(([genre]) => genre)
    const movieData = topGenres.map(([_, counts]) => counts.movies)
    const seriesData = topGenres.map(([_, counts]) => counts.series)

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Filmes",
            data: movieData,
            backgroundColor: "rgba(59, 130, 246, 0.7)", // Blue
            borderColor: "#3B82F6",
            borderWidth: 1,
          },
          {
            label: "Séries",
            data: seriesData,
            backgroundColor: "rgba(16, 185, 129, 0.7)", // Green
            borderColor: "#10B981",
            borderWidth: 1,
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
            },
            grid: {
              display: false,
            },
          },
          y: {
            ticks: {
              color: "#1E40AF", // Dark blue
              stepSize: 1,
            },
            grid: {
              color: "#E0F2FE", // Light blue
            },
            title: {
              display: true,
              text: "Quantidade",
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
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [movies, series])

  return (
    <div className="h-[300px]">
      <canvas ref={chartRef} />
    </div>
  )
}

