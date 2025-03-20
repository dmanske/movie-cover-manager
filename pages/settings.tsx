import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MigrateToSQLite } from "@/components/migrate-to-sqlite"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")

  // Carregar a chave da API do localStorage quando a página for carregada
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedApiKey = localStorage.getItem("imdbApiKey")
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }
    }
  }, [])

  // Salvar a chave da API no localStorage
  const saveApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("imdbApiKey", apiKey)
      toast({
        title: "Chave API salva",
        description: "Sua chave API do IMDB foi salva com sucesso.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Configurações</h1>
        <p className="text-blue-700">Gerencie as configurações da aplicação</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
        </TabsList>
        
        {/* Configurações Gerais */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Geral</CardTitle>
              <CardDescription>
                Configurações gerais da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <select
                  id="theme"
                  className="w-full rounded-md border border-blue-200 p-2"
                >
                  <option value="system">Sistema</option>
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Salvar</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Configurações de API */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API</CardTitle>
              <CardDescription>
                Configure as chaves de API para busca de informações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imdb-api-key">Chave API IMDB</Label>
                <Input
                  id="imdb-api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Insira sua chave API do IMDB"
                />
                <p className="text-xs text-muted-foreground">
                  Chave API usada para buscar informações de filmes e séries. Você pode obter uma chave em{" "}
                  <a
                    href="https://www.omdbapi.com/apikey.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OMDb API
                  </a>
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveApiKey}>Salvar</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Configurações de Banco de Dados */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Banco de Dados</CardTitle>
              <CardDescription>
                Gerencie o banco de dados da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MigrateToSQLite />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 