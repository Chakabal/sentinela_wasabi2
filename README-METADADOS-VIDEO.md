# 🎬 POC - Leitor de Metadados de Vídeo MP4

Este projeto contém scripts para ler e extrair metadados de vídeos MP4 usando ffprobe integrado.

## 📁 Arquivos Criados

### 1. `poc-metadados-video.js`
**Script completo** com todas as funcionalidades:
- Lista todos os vídeos disponíveis
- Obtém metadados completos
- Exibe informações organizadas
- Salva metadados em arquivo JSON

### 2. `poc-metadados-video-avancado.js`
**Versão avançada** com funcionalidades extras:
- Informações básicas (rápido)
- Metadados completos (detalhado)
- Exemplo de uso programático
- Mais opções de configuração

### 3. `exemplo-metadados-simples.js`
**Exemplo simples** para começar:
- Código limpo e direto
- Funcionalidades básicas
- Fácil de entender e modificar

## 🚀 Como Usar

### Execução Direta

```bash
# Script completo
node poc-metadados-video.js

# Versão avançada
node poc-metadados-video-avancado.js

# Exemplo simples
node exemplo-metadados-simples.js
```

### Uso Programático

```javascript
// Importa as funções
const { getVideoMetadata, displayVideoInfo } = require('./exemplo-metadados-simples.js');

// Obtém metadados de um vídeo
async function exemplo() {
  const videoPath = 'caminho/para/video.mp4';
  const metadata = await getVideoMetadata(videoPath);
  
  // Exibe informações
  displayVideoInfo(metadata, 'video.mp4');
  
  // Acessa dados específicos
  console.log('Duração:', metadata.format.duration, 'segundos');
  console.log('Resolução:', metadata.streams[0].width + 'x' + metadata.streams[0].height);
  console.log('Codec:', metadata.streams[0].codec_name);
}
```

## 📊 Metadados Coletados

### Informações do Formato
- 📄 Nome do arquivo
- 📊 Tamanho em bytes
- ⏱️ Duração em segundos
- 🎵 Bitrate total
- 📦 Formato do arquivo
- 🏷️ Tags (título, artista, data)

### Informações de Vídeo
- 📹 Codec (h264, h265, etc.)
- 📐 Resolução (width x height)
- 🎯 Aspect Ratio
- 🎞️ Frame Rate
- 🎨 Pixel Format
- 🎬 Profile e Level
- 🎵 Bitrate do vídeo
- 🎬 Número de frames

### Informações de Áudio
- 🎵 Codec (aac, mp3, etc.)
- 🔊 Sample Rate
- 🎧 Número de canais
- 🎵 Bitrate do áudio
- 🎼 Sample Format
- 🎵 Número de frames

## 🔧 Configuração

### Estrutura de Pastas
```
Sentinela Wasabi/
├── videos/
│   └── enviados/          # Vídeos MP4 para processar
├── ffmpeg/
│   ├── ffmpeg.exe         # Binário ffmpeg
│   ├── ffprobe.exe        # Binário ffprobe
│   └── ffplay.exe         # Binário ffplay
├── poc-metadados-video.js
├── poc-metadados-video-avancado.js
└── exemplo-metadados-simples.js
```

### Compatibilidade
- ✅ **Desenvolvimento**: Usa `ffmpeg/ffprobe.exe`
- ✅ **Produção (pkg)**: Usa binários extraídos do executável
- ✅ **Windows**: Compatível com Windows 10/11
- ✅ **Node.js**: Versão 14+ recomendada

## 📝 Exemplo de Saída

```
🚀 POC - Leitor de Metadados de Vídeo MP4
==================================================

📁 Vídeos encontrados (23):
1. 20250726--GLEISI-HOFFMANN-2131.mp4 (60.02 MB)
2. 20250726--ROGERIO-CARVALHO-2131.mp4 (60.02 MB)
...

🎯 Usando como exemplo: 20250726--GLEISI-HOFFMANN-2131.mp4

================================================================================
🎬 METADADOS DO VÍDEO: 20250726--GLEISI-HOFFMANN-2131.mp4
================================================================================

📁 INFORMAÇÕES DO FORMATO:
----------------------------------------
📄 Nome do arquivo: C:\dev\Sentinela Wasabi\videos\enviados\20250726--GLEISI-HOFFMANN-2131.mp4
📊 Tamanho: 60.02 MB
⏱️  Duração: 2m 28s
🎵 Bitrate: 3391.371 kbps
📦 Formato: mov,mp4,m4a,3gp,3g2,mj2

🎥 STREAMS DE VÍDEO:
----------------------------------------

🎬 Stream 1 (Vídeo):
  📹 Codec: h264
  📐 Resolução: 1280x720
  🎯 Aspect Ratio: 16:9
  🎞️  Frame Rate: 30/1
  🎨 Pixel Format: yuv420p
  🎬 Profile: Constrained Baseline
  🎯 Level: 52
  🎵 Bitrate: 3189.998 kbps

🎵 Stream 2 (Áudio):
  🎵 Codec: aac
  🔊 Sample Rate: 48000 Hz
  🎧 Channels: 2
  🎵 Bitrate: 195.115 kbps
  🎼 Sample Format: fltp

🔍 INFORMAÇÕES ADICIONAIS:
----------------------------------------
📊 Número de streams: 2
🎬 Streams de vídeo: 1
🎵 Streams de áudio: 1

💾 Metadados salvos em: C:\dev\Sentinela Wasabi\metadados_20250726--GLEISI-HOFFMANN-2131.json
```

## 🎯 Casos de Uso

### 1. Análise de Qualidade
- Verificar resolução e bitrate
- Validar codecs suportados
- Analisar duração dos vídeos

### 2. Processamento Automático
- Filtrar vídeos por características
- Organizar por qualidade
- Validar compatibilidade

### 3. Relatórios
- Gerar estatísticas de vídeos
- Criar relatórios de qualidade
- Monitorar uso de espaço

## 🔍 Troubleshooting

### Erro: "ffprobe não encontrado"
```bash
# Verifique se o ffprobe existe
ls ffmpeg/ffprobe.exe

# Se não existir, baixe o ffmpeg
# https://ffmpeg.org/download.html
```

### Erro: "Arquivo não encontrado"
```bash
# Verifique se a pasta videos/enviados existe
ls videos/enviados/

# Crie a pasta se necessário
mkdir -p videos/enviados
```

### Erro: "Permissão negada"
```bash
# Execute como administrador (Windows)
# Ou verifique permissões da pasta
```

## 📚 Referências

- [FFprobe Documentation](https://ffmpeg.org/ffprobe.html)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)
- [FFmpeg Formats](https://ffmpeg.org/ffmpeg-formats.html)

## 🤝 Contribuição

Para contribuir com melhorias:

1. Teste os scripts com diferentes vídeos
2. Adicione novas funcionalidades
3. Melhore a documentação
4. Reporte bugs encontrados

---

**🎬 POC criado com sucesso!** Os scripts estão prontos para uso e podem ser facilmente integrados ao projeto principal. 
