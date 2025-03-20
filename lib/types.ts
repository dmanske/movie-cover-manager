export interface HD {
  id: string
  name: string
  path: string
  connected: boolean
  totalSpace: number // Em terabytes (TB)
  freeSpace: number // Em terabytes (TB)
  color: string
  dateAdded: string
  type: string // 'internal', 'external', 'network', 'ssd'
  serialNumber?: string
  transferSpeed?: string
}

export interface Episode {
  number: number
  title: string
  titlePt?: string
  filename: string
  path?: string // Caminho completo para o arquivo
  duration: number
  watched: boolean
  synopsis: string
  imdbRating: number
  releaseDate: string
  cast?: string[]
  stillImage?: string // Imagem local do episódio
  stillImageUrl?: string // URL da imagem do episódio
}

export interface Season {
  number: number
  totalEpisodes: number
  availableEpisodes: number
  episodes: Episode[]
  poster?: string // Caminho local do pôster
  posterUrl?: string // URL do pôster
}

export interface Series {
  id: string
  title: string
  hdId: string
  hdPath?: string // Caminho completo no HD para a série
  hidden: boolean
  imdbId?: string // Tornando opcional para permitir adição manual
  poster: string // Caminho local da imagem ou URL se não foi baixada
  posterUrl?: string // URL original do pôster
  posterLocal?: boolean // Indica se a imagem está armazenada localmente
  backdrop?: string // Caminho local da imagem de fundo
  backdropUrl?: string // URL original da imagem de fundo
  backdropLocal?: boolean // Indica se a imagem de fundo está armazenada localmente
  seasons: Season[]
  synopsis?: string
  genres?: string[]
  year?: string | number // Permitir formato de string como "2018-2022"
  cast?: string[]
  creator?: string
  totalWatchTime?: number
  watched?: boolean // Status geral da série
}

export interface Movie {
  id: string
  title: string
  hdId: string
  hidden: boolean
  imdbId: string
  poster: string // Caminho local da imagem ou URL se não foi baixada
  posterUrl?: string // URL original do pôster
  posterLocal?: boolean // Indica se a imagem está armazenada localmente
  backdrop?: string // Caminho local da imagem de fundo
  backdropUrl?: string // URL original da imagem de fundo
  backdropLocal?: boolean // Indica se a imagem de fundo está armazenada localmente
  year: number
  duration: number
  watched: boolean
  synopsis?: string
  genres: string[]
  cast?: string[]
  director?: string
  imdbRating?: number
  releaseDate?: string
  filename?: string
}

export interface Show {
  id: string
  title: string
  hdId: string
  hidden: boolean
  imdbId: string
  poster: string // Caminho local da imagem ou URL se não foi baixada
  posterUrl?: string // URL original do pôster
  posterLocal?: boolean // Indica se a imagem está armazenada localmente
  year: number
  duration: number
  watched: boolean
  synopsis?: string
  genres: string[]
  director?: string
  performers: string[]
  venue: string
  imdbRating?: number
  releaseDate?: string
  filename?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "warning" | "error" | "info"
  timestamp: Date
  read?: boolean
}

export interface ImageDownloadResult {
  success: boolean;
  localPath: string;
  error?: string;
}

