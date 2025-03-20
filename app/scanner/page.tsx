import { AppLayout } from "@/components/app-layout"
import { MediaScanner } from "@/components/media-scanner"

export default function ScannerPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Media Scanner</h1>
          <p className="text-blue-700">Automatically scan your hard drive for media files</p>
        </div>

        <MediaScanner />
      </div>
    </AppLayout>
  )
}

