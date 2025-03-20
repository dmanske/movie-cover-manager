import { AppLayout } from "@/components/app-layout"
import { MediaScanner } from "@/components/media-scanner"
import { ImportData } from "@/components/import-data"

export default function ImportPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Importação de Mídia</h1>
          <p className="text-blue-700">Escaneie e importe filmes e séries para sua biblioteca</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <MediaScanner />
          <ImportData />
        </div>
      </div>
    </AppLayout>
  )
}

