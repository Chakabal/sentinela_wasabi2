# 🔍 EXIFTOOL - Metadados Forenses de Vídeos MP4

Este projeto demonstra como usar o **ExifTool** para extrair metadados forenses completos de vídeos MP4, incluindo informações como nome do usuário, máquina, versão do OS e outras informações técnicas gravadas no arquivo.

## 📦 Instalação

### Dependências NPM
```bash
npm install exiftool-vendored
```

### ExifTool CLI (Opcional)
Para usar o ExifTool via linha de comando:
- **Windows:** Baixe de https://exiftool.org/
- **Linux:** `sudo apt-get install exiftool`
- **macOS:** `brew install exiftool`

## 📁 Scripts Criados

### 1. `poc-metadados-exiftool.js`
**Script básico** que usa ExifTool npm para extrair metadados:
- Extrai todos os metadados disponíveis
- Organiza informações por categoria
- Salva resultados em JSON

### 2. `poc-metadados-exiftool-cli.js`
**Script comparativo** que testa ExifTool NPM vs CLI:
- Compara resultados entre as duas versões
- Detecta automaticamente se CLI está disponível
- Mostra diferenças nos metadados extraídos

### 3. `exemplo-exiftool-forenses.js`
**Exemplo prático** focado em informações forenses:
- Extrai informações específicas (usuário, sistema, hardware)
- Fornece resumo forense
- Inclui dicas para obter mais informações

## 🚀 Como Usar

### Execução Básica
```bash
# Script básico com ExifTool npm
node poc-metadados-exiftool.js

# Script comparativo (NPM vs CLI)
node poc-metadados-exiftool-cli.js

# Exemplo prático focado em forenses
node exemplo-exiftool-forenses.js
```

### Uso Programático
```javascript
const { exiftool } = require('exiftool-vendored');

// Obter metadados
const metadata = await exiftool.read('video.mp4');

// Fechar conexão
await exiftool.end();
```

## 🔍 Metadados Forenses Detectados

### ✅ **Informações Sempre Disponíveis:**
- **Arquivo:** Tipo, tamanho, permissões, datas
- **Técnicas:** Duração, frame rate, resolução, codecs
- **Software:** Encoder, handler, versão do ExifTool

### ⚠️ **Informações Forenses (Dependem do Software):**
- **Usuário:** Nome, autor, proprietário, organização
- **Sistema:** Computador, OS, plataforma, hostname
- **Hardware:** Dispositivo, modelo, fabricante, serial
- **Localização:** GPS, coordenadas, altitude
- **Câmera:** Fabricante, modelo, firmware, configurações

## 📊 Resultados dos Testes

### Vídeo Analisado: `20250726--GLEISI-HOFFMANN-2131.mp4`

#### **Informações Encontradas:**
```
📊 Total de metadados: 78
📄 Tipo: MP4
📊 Tamanho: 63 MB
⚙️  Duração: 148.467 segundos
⚙️  Frame Rate: 30.007 fps
⚙️  Resolução: 1280x720
🔧 Encoder: Lavf58.76.100 (FFmpeg)
🔧 ExifTool Version: 13.31
```

#### **Informações Forenses:**
- ❌ **Usuário:** Não encontradas
- ❌ **Sistema:** Não encontradas  
- ❌ **Hardware:** Não encontradas
- ❌ **Localização:** Não encontradas

## 🎯 Por que Informações Forenses não foram encontradas?

### **Razões Principais:**

1. **Vídeos Processados pelo FFmpeg:**
   - Os vídeos foram re-encodados pelo FFmpeg
   - FFmpeg remove metadados forenses originais durante conversão
   - Apenas informações técnicas são preservadas

2. **Software de Gravação:**
   - O software original não adicionou metadados forenses
   - Metadados dependem da configuração do software de gravação

3. **Formato MP4:**
   - Alguns formatos MP4 não preservam metadados forenses extensos
   - Metadados podem ser removidos durante compressão

## 🔧 Como Obter Mais Informações Forenses

### **1. Analisar Vídeos Originais**
```bash
# Extrair metadados ANTES do processamento FFmpeg
node exemplo-exiftool-forenses.js caminho/para/video_original.mp4
```

### **2. Configurar Software de Gravação**
- **Adobe Premiere Pro:** Adicionar metadados personalizados
- **OBS Studio:** Configurar informações de stream
- **Câmeras:** Ativar GPS e informações de dispositivo
- **Smartphones:** Permitir metadados de localização

### **3. Preservar Metadados no FFmpeg**
```bash
# Preservar metadados durante conversão
ffmpeg -i input.mp4 -map_metadata 0 -c copy output.mp4

# Adicionar metadados personalizados
ffmpeg -i input.mp4 -metadata artist="Nome do Usuário" -metadata computer="Nome da Máquina" output.mp4
```

### **4. Usar Ferramentas Especializadas**
```bash
# ExifTool CLI com mais detalhes
exiftool -a -u -g1 -j video.mp4

# MediaInfo para análise detalhada
mediainfo --Output=JSON video.mp4

# FFprobe com todas as tags
ffprobe -v quiet -print_format json -show_format -show_streams -show_chapters -show_private_data video.mp4
```

## 📋 Checklist de Metadados Forenses

### **✅ Informações Técnicas (Sempre Disponíveis)**
- [x] Codec de vídeo (h264, h265, etc.)
- [x] Codec de áudio (aac, mp3, etc.)
- [x] Resolução (1280x720, etc.)
- [x] Frame rate (30fps, etc.)
- [x] Bitrate (3.38 Mbps, etc.)
- [x] Duração (148.467 segundos)
- [x] Tamanho do arquivo (63 MB)

### **⚠️ Informações Forenses (Dependem do Software)**
- [ ] Nome do usuário
- [ ] Nome da máquina
- [ ] Versão do OS
- [ ] Software de gravação
- [ ] Data/hora de criação
- [ ] Informações de hardware
- [ ] Informações de rede
- [ ] Coordenadas GPS

### **🔍 Informações do Sistema de Arquivos (Sempre Disponíveis)**
- [x] Data de criação do arquivo
- [x] Data de modificação
- [x] Data de último acesso
- [x] Permissões do arquivo
- [x] Tamanho em bytes

## 🎬 Exemplos de Uso

### **Exemplo 1: Análise Básica**
```javascript
const { exiftool } = require('exiftool-vendored');

async function analyzeVideo(videoPath) {
  const metadata = await exiftool.read(videoPath);
  
  console.log('Informações do vídeo:');
  console.log(`- Tipo: ${metadata.FileType}`);
  console.log(`- Tamanho: ${metadata.FileSize}`);
  console.log(`- Duração: ${metadata.Duration}s`);
  console.log(`- Encoder: ${metadata.Encoder}`);
  
  await exiftool.end();
}
```

### **Exemplo 2: Busca por Informações Forenses**
```javascript
function findForensicInfo(metadata) {
  const forensicInfo = {
    user: metadata.Artist || metadata.Author || metadata.User,
    computer: metadata.Computer || metadata.Hostname,
    os: metadata.OperatingSystem || metadata.Platform,
    software: metadata.Software || metadata.Encoder,
    location: metadata.GPSLatitude && metadata.GPSLongitude ? 
      `${metadata.GPSLatitude}, ${metadata.GPSLongitude}` : null
  };
  
  return forensicInfo;
}
```

### **Exemplo 3: Análise de Múltiplos Vídeos**
```javascript
async function analyzeAllVideos(videoDir) {
  const videos = fs.readdirSync(videoDir)
    .filter(file => file.endsWith('.mp4'));
  
  for (const video of videos) {
    const metadata = await exiftool.read(path.join(videoDir, video));
    console.log(`\nAnálise de ${video}:`);
    console.log(`- Encoder: ${metadata.Encoder}`);
    console.log(`- Usuário: ${metadata.Artist || 'Não encontrado'}`);
  }
  
  await exiftool.end();
}
```

## 📁 Arquivos Gerados

### **Arquivos JSON:**
- `exiftool_*.json` - Metadados básicos
- `exiftool_npm_*.json` - Metadados via NPM
- `exiftool_cli_*.json` - Metadados via CLI
- `forenses_exiftool_*.json` - Análise forense completa

### **Estrutura dos Arquivos JSON:**
```json
{
  "fileName": "video.mp4",
  "fileInfo": { /* Informações do arquivo */ },
  "creation": { /* Datas de criação */ },
  "software": { /* Informações de software */ },
  "hardware": { /* Informações de hardware */ },
  "user": { /* Informações de usuário */ },
  "system": { /* Informações do sistema */ },
  "camera": { /* Informações da câmera */ },
  "location": { /* Informações de localização */ },
  "technical": { /* Informações técnicas */ },
  "allMetadata": { /* Todos os metadados */ }
}
```

## 🎯 Conclusão

O **ExifTool** é uma ferramenta poderosa para extrair metadados forenses de vídeos MP4. Embora os vídeos atuais não contenham informações forenses extensas (devido ao processamento FFmpeg), o ExifTool demonstrou ser capaz de:

1. **Extrair 78 metadados** diferentes do vídeo
2. **Identificar informações técnicas** completas
3. **Detectar software usado** (FFmpeg 58.76.100)
4. **Organizar informações** por categoria
5. **Salvar resultados** em formato estruturado

Para obter informações forenses como nome do usuário, máquina e versão do OS, é necessário:
- Analisar vídeos originais (antes do processamento)
- Configurar software de gravação para incluir metadados forenses
- Preservar metadados durante conversões
- Usar ferramentas especializadas

Os scripts criados estão prontos para detectar e extrair essas informações quando presentes nos vídeos!

## 🔗 Links Úteis

- **ExifTool:** https://exiftool.org/
- **ExifTool NPM:** https://www.npmjs.com/package/exiftool-vendored
- **FFmpeg:** https://ffmpeg.org/
- **MediaInfo:** https://mediaarea.net/en/MediaInfo 