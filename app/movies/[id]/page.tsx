import { AppLayout } from "@/components/app-layout"
import { MovieDetail } from "@/components/movie-detail"

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <MovieDetail id={params.id} />
    </AppLayout>
  )
}

