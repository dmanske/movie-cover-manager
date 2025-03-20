import { AppLayout } from "@/components/app-layout"
import { HDContentFilter } from "@/components/hd-content-filter"

export default function HDContentPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <HDContentFilter hdId={params.id} />
    </AppLayout>
  )
}

