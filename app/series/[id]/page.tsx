import { AppLayout } from "@/components/app-layout"
import { SeriesDetail } from "@/components/series-detail"

export default function SeriesDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <SeriesDetail id={params.id} />
    </AppLayout>
  )
}

