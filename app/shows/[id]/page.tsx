import { AppLayout } from "@/components/app-layout"
import { ShowDetail } from "@/components/show-detail"

export default function ShowDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <ShowDetail id={params.id} />
    </AppLayout>
  )
}

