"use client"

import { AddSeries } from "@/components/add-series"
import { AppLayout } from "@/components/app-layout"

export default function AddSeriesPage() {
  return (
    <AppLayout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Adicionar Série</h1>
        <AddSeries />
      </div>
    </AppLayout>
  )
} 