"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function ImportData() {
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Basic file validation
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/json") {
        toast({
          title: "Tipo de Arquivo Inválido",
          description: "Por favor, selecione um arquivo JSON.",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleImport = () => {
    if (!file) {
      toast({
        title: "Nenhum Arquivo Selecionado",
        description: "Por favor, selecione um arquivo JSON para importar.",
        variant: "destructive",
      })
      return
    }

    setImporting(true)

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)

        // Basic data validation (customize as needed)
        if (!Array.isArray(jsonData)) {
          toast({
            title: "Dados Inválidos",
            description: "O arquivo JSON deve conter um array.",
            variant: "destructive",
          })
          return
        }

        // Save to localStorage (customize keys as needed)
        localStorage.setItem("movies", JSON.stringify(jsonData))

        toast({
          title: "Dados Importados",
          description: "Os dados foram importados com sucesso.",
        })
      } catch (error) {
        console.error("Erro ao importar dados:", error)
        toast({
          title: "Erro ao Importar",
          description: "Falha ao analisar o arquivo JSON.",
          variant: "destructive",
        })
      } finally {
        setImporting(false)
      }
    }

    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Dados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="import">Arquivo JSON</Label>
          <Input id="import" type="file" accept=".json" onChange={handleFileChange} disabled={importing} />
        </div>

        <Button onClick={handleImport} disabled={importing || !file}>
          {importing ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

