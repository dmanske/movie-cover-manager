"use client"

import { AppLayout } from "@/components/app-layout"
import { MoviesLibrary } from "@/components/movies-library"

export default function MoviesPage() {
  return (
    <AppLayout>
      <MoviesLibrary />
    </AppLayout>
  )
}

