// Utilitário para detecção de metadados de mídia

// Tipos de dados
export interface MediaQuality {
  resolution: string;  // 720p, 1080p, 4K, etc.
  source: string;      // WEB-DL, BluRay, HDTV, etc.
  bitrate?: number;    // em kbps
}

export interface MediaCodec {
  video: string;       // H.264, H.265, etc.
  audio: string;       // AAC, AC3, etc.
  audioChannels?: string; // 2.0, 5.1, etc.
}

export interface SubtitleInfo {
  language: string;    // pt-BR, en, es, etc.
  format: string;      // SRT, ASS, etc.
  embedded: boolean;   // Legendas embutidas no arquivo ou externas
}

export interface MediaMetadata {
  filename: string;
  filesize: number;    // em bytes
  quality: MediaQuality;
  codec: MediaCodec;
  subtitles: SubtitleInfo[];
  duration?: number;   // em minutos
}

// Expressões regulares para detecção de metadados
const RESOLUTION_PATTERNS = [
  { regex: /\b(2160p|4k|uhd)\b/i, value: '4K UHD' },
  { regex: /\b(1080p|fullhd|fhd)\b/i, value: '1080p' },
  { regex: /\b(720p|hd)\b/i, value: '720p' },
  { regex: /\b(480p|sd)\b/i, value: '480p' }
];

const SOURCE_PATTERNS = [
  { regex: /\b(bluray|blu-ray|bdrip|bd-rip|brrip)\b/i, value: 'BluRay' },
  { regex: /\b(web-?dl|webrip|web-?rip)\b/i, value: 'WEB-DL' },
  { regex: /\b(hdtv|pdtv|dsr)\b/i, value: 'HDTV' },
  { regex: /\b(dvdrip|dvd-rip)\b/i, value: 'DVD' },
  { regex: /\b(hdrip)\b/i, value: 'HDRip' },
  { regex: /\b(cam|camrip|hdcam)\b/i, value: 'CAM' }
];

const VIDEO_CODEC_PATTERNS = [
  { regex: /\b(x265|hevc|h\.?265)\b/i, value: 'H.265/HEVC' },
  { regex: /\b(x264|h\.?264|avc)\b/i, value: 'H.264/AVC' },
  { regex: /\b(xvid)\b/i, value: 'XviD' },
  { regex: /\b(av1)\b/i, value: 'AV1' },
  { regex: /\b(vp9)\b/i, value: 'VP9' }
];

const AUDIO_CODEC_PATTERNS = [
  { regex: /\b(dd\+|e-?ac-?3)\b/i, value: 'Dolby Digital Plus' },
  { regex: /\b(ac-?3|dd|dolby)\b/i, value: 'Dolby Digital' },
  { regex: /\b(dts-hd-?ma)\b/i, value: 'DTS-HD MA' },
  { regex: /\b(dts-hd)\b/i, value: 'DTS-HD' },
  { regex: /\b(dts)\b/i, value: 'DTS' },
  { regex: /\b(aac)\b/i, value: 'AAC' },
  { regex: /\b(mp3)\b/i, value: 'MP3' },
  { regex: /\b(flac)\b/i, value: 'FLAC' },
  { regex: /\b(opus)\b/i, value: 'Opus' },
];

const AUDIO_CHANNELS_PATTERNS = [
  { regex: /\b(7\.1)\b/i, value: '7.1' },
  { regex: /\b(5\.1)\b/i, value: '5.1' },
  { regex: /\b(2\.0)\b/i, value: '2.0' },
  { regex: /\b(1\.0|mono)\b/i, value: '1.0' }
];

const SUBTITLE_PATTERNS = [
  { regex: /\blegendas?\b/i, hasSubtitles: true },
  { regex: /\bsubtitles?\b/i, hasSubtitles: true },
  { regex: /\bsub(s|bed|s-?pt|s-?br)?\b/i, hasSubtitles: true },
  { regex: /\.srt$|\.ass$|\.sub$|\.idx$|\.vtt$/i, hasSubtitles: true }
];

const LANGUAGE_PATTERNS = [
  { regex: /\b(pt[-_]?br|brazil|portugues|português)\b/i, value: 'Português (Brasil)' },
  { regex: /\b(pt[-_]?pt|portugal)\b/i, value: 'Português (Portugal)' },
  { regex: /\b(eng?|english)\b/i, value: 'Inglês' },
  { regex: /\b(es|esp|spanish)\b/i, value: 'Espanhol' },
  { regex: /\b(fr|fre|french)\b/i, value: 'Francês' },
  { regex: /\b(ger?|deu|german|deutsch)\b/i, value: 'Alemão' },
  { regex: /\b(ita|italian)\b/i, value: 'Italiano' },
  { regex: /\b(jpn|japanese)\b/i, value: 'Japonês' },
  { regex: /\b(kor|korean)\b/i, value: 'Coreano' },
  { regex: /\b(chi|zh|chinese)\b/i, value: 'Chinês' }
];

/**
 * Extrai metadados de mídia a partir do nome do arquivo
 * @param filename Nome do arquivo incluindo extensão
 * @param filesize Tamanho do arquivo em bytes
 * @param existingDuration Duração do arquivo em minutos (opcional)
 */
export function extractMediaMetadata(
  filename: string, 
  filesize: number,
  existingDuration?: number
): MediaMetadata {
  // Detectar qualidade
  const quality: MediaQuality = {
    resolution: detectPattern(filename, RESOLUTION_PATTERNS, '720p'),
    source: detectPattern(filename, SOURCE_PATTERNS, 'Desconhecido')
  };

  // Detectar codec
  const codec: MediaCodec = {
    video: detectPattern(filename, VIDEO_CODEC_PATTERNS, 'Desconhecido'),
    audio: detectPattern(filename, AUDIO_CODEC_PATTERNS, 'Desconhecido')
  };

  // Tentar detectar canais de áudio
  const audioChannels = detectPattern(filename, AUDIO_CHANNELS_PATTERNS, '');
  if (audioChannels) {
    codec.audioChannels = audioChannels;
  }

  // Detectar legendas
  const subtitles: SubtitleInfo[] = [];
  
  // Verifica se o nome do arquivo indica presença de legendas
  const hasSubtitles = SUBTITLE_PATTERNS.some(pattern => pattern.regex.test(filename));
  
  if (hasSubtitles) {
    // Tenta detectar idioma das legendas
    let language = 'Desconhecido';
    for (const pattern of LANGUAGE_PATTERNS) {
      if (pattern.regex.test(filename)) {
        language = pattern.value;
        break;
      }
    }
    
    // Assume formato baseado na extensão ou padrão mais comum
    const format = filename.toLowerCase().includes('.srt') ? 'SRT' : 
                  filename.toLowerCase().includes('.ass') ? 'ASS' : 'Desconhecido';
    
    // Assume que legendas são embutidas se não há arquivos separados
    const embedded = !filename.match(/\.srt$|\.ass$|\.sub$/i);
    
    subtitles.push({ language, format, embedded });
  }

  return {
    filename,
    filesize,
    quality,
    codec,
    subtitles,
    duration: existingDuration
  };
}

/**
 * Função auxiliar para detectar padrões nos nomes de arquivos
 */
function detectPattern(
  text: string, 
  patterns: { regex: RegExp; value: string }[],
  defaultValue: string
): string {
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return pattern.value;
    }
  }
  return defaultValue;
}

/**
 * Estima a duração de um vídeo com base no tamanho do arquivo e qualidade
 * Esta é uma estimativa grosseira e deve ser substituída por valores reais quando disponíveis
 */
export function estimateVideoDuration(filesize: number, resolution: string): number {
  // Taxa de bits média em KBps para diferentes resoluções (estimativa aproximada)
  const bitrateMap: Record<string, number> = {
    '4K UHD': 25000,
    '1080p': 8000,
    '720p': 3500,
    '480p': 1500,
    'Desconhecido': 5000
  };

  // Usa a resolução para estimar a taxa de bits
  const bitrate = bitrateMap[resolution] || bitrateMap['Desconhecido'];
  
  // Converte bits para bytes
  const bytesPerSecond = bitrate * 1024 / 8;
  
  // Calcula a duração em segundos
  const durationSeconds = filesize / bytesPerSecond;
  
  // Converte para minutos e arredonda
  return Math.round(durationSeconds / 60);
}

/**
 * Detecta informações de qualidade e codec a partir de uma string de texto
 * Útil para descrever arquivos de mídia em texto
 */
export function formatMediaInfo(metadata: MediaMetadata): string {
  const parts = [];
  
  // Adiciona a resolução
  if (metadata.quality.resolution) {
    parts.push(metadata.quality.resolution);
  }
  
  // Adiciona a fonte
  if (metadata.quality.source && metadata.quality.source !== 'Desconhecido') {
    parts.push(metadata.quality.source);
  }
  
  // Adiciona o codec de vídeo
  if (metadata.codec.video && metadata.codec.video !== 'Desconhecido') {
    parts.push(metadata.codec.video);
  }
  
  // Adiciona o codec de áudio e canais, se disponíveis
  if (metadata.codec.audio && metadata.codec.audio !== 'Desconhecido') {
    let audioInfo = metadata.codec.audio;
    if (metadata.codec.audioChannels) {
      audioInfo += ` ${metadata.codec.audioChannels}`;
    }
    parts.push(audioInfo);
  }
  
  // Adiciona informações sobre legendas
  if (metadata.subtitles.length > 0) {
    const subLanguages = metadata.subtitles.map(sub => sub.language).join(', ');
    parts.push(`LEG: ${subLanguages}`);
  }
  
  // Formata o tamanho do arquivo
  const sizeGB = (metadata.filesize / (1024 * 1024 * 1024)).toFixed(2);
  parts.push(`${sizeGB} GB`);
  
  // Adiciona a duração, se disponível
  if (metadata.duration) {
    const hours = Math.floor(metadata.duration / 60);
    const minutes = metadata.duration % 60;
    parts.push(`${hours}h${minutes.toString().padStart(2, '0')}m`);
  }
  
  return parts.join(' • ');
} 