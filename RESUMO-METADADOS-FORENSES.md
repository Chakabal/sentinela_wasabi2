# 🔍 RESUMO - Metadados Forenses de Vídeos MP4

## 📊 O que foi encontrado nos vídeos analisados

### ✅ **Informações Forenses Detectadas:**

#### 1. **Informações de Software**
- **Encoder:** `Lavf58.76.100` (FFmpeg versão 58.76.100)
- **Software:** `Lavf58.76.100` (FFmpeg)
- **Major Brand:** `isom` (ISO Media)
- **Minor Version:** `512`
- **Compatible Brands:** `isomiso2avc1mp41`

#### 2. **Informações do Sistema de Arquivos**
- **Data de Criação:** 04/08/2025, 22:27:13
- **Data de Modificação:** 26/07/2025, 21:34:55
- **Data de Acesso:** 08/08/2025, 11:10:22
- **Tamanho:** 60.02 MB
- **Permissões:** 100666

#### 3. **Informações dos Streams**
- **Stream de Vídeo:** h264, language: und, handler: VideoHandler
- **Stream de Áudio:** aac, language: eng, handler: SoundHandler

#### 4. **Análise Hexadecimal**
- **Assinatura:** `0000002066747970`
- **Tipo:** Formato MP4 (ISO Media)
- **Tamanho:** 62.937.927 bytes

---

## 🎯 **Informações Forenses que PODEM ser extraídas**

### ✅ **Informações Disponíveis (quando presentes):**

#### **1. Informações de Criação**
```json
{
  "creationTime": "2025-07-26T21:34:55.000Z",
  "date": "2025-07-26",
  "time": "21:34:55",
  "year": "2025",
  "month": "07",
  "day": "26"
}
```

#### **2. Informações de Software**
```json
{
  "software": "Adobe Premiere Pro 2024",
  "encoder": "H.264 Encoder",
  "encodingTool": "Adobe Media Encoder",
  "version": "24.0.0",
  "producer": "Adobe Systems Inc.",
  "application": "Premiere Pro"
}
```

#### **3. Informações de Hardware**
```json
{
  "device": "iPhone 15 Pro",
  "model": "A3102",
  "manufacturer": "Apple Inc.",
  "serial": "1234567890ABCDEF"
}
```

#### **4. Informações de Usuário**
```json
{
  "artist": "João Silva",
  "author": "João Silva",
  "user": "joao.silva",
  "owner": "João Silva",
  "organization": "Empresa XYZ"
}
```

#### **5. Informações do Sistema**
```json
{
  "computer": "DESKTOP-ABC123",
  "os": "Windows 11 Pro",
  "platform": "Windows",
  "hostname": "DESKTOP-ABC123",
  "domain": "empresa.local"
}
```

---

## ❌ **Informações Forenses NÃO encontradas nos vídeos atuais**

### **Razões possíveis:**

1. **Vídeos processados pelo FFmpeg:** Os vídeos foram re-encodados pelo FFmpeg, que remove metadados forenses originais
2. **Metadados não preservados:** O processo de conversão/compressão removeu informações
3. **Formato não suporta:** Alguns formatos MP4 não preservam metadados forenses extensos
4. **Software não adiciona:** O software de gravação não adicionou metadados forenses

---

## 🔧 **Como extrair mais informações forenses**

### **1. Análise de Vídeos Originais**
```bash
# Analisar vídeos antes do processamento FFmpeg
node poc-metadados-forenses.js caminho/para/video_original.mp4
```

### **2. Usar Ferramentas Especializadas**
```bash
# ExifTool (se disponível)
exiftool -a -u -g1 video.mp4

# MediaInfo
mediainfo --Output=JSON video.mp4

# FFprobe com mais detalhes
ffprobe -v quiet -print_format json -show_format -show_streams -show_chapters -show_private_data -show_entries format_tags=* -show_entries stream_tags=* video.mp4
```

### **3. Análise de Bytes**
```javascript
// Ler primeiros bytes para detectar assinaturas
const buffer = fs.readFileSync(videoPath, { encoding: null });
const signature = buffer.slice(0, 8).toString('hex');
```

---

## 📋 **Checklist de Metadados Forenses**

### **✅ Informações Técnicas (Sempre Disponíveis)**
- [x] Codec de vídeo (h264, h265, etc.)
- [x] Codec de áudio (aac, mp3, etc.)
- [x] Resolução (1280x720, etc.)
- [x] Frame rate (30fps, etc.)
- [x] Bitrate (3391 kbps, etc.)
- [x] Duração (148.466 segundos)
- [x] Tamanho do arquivo (60.02 MB)

### **⚠️ Informações Forenses (Dependem do Software)**
- [ ] Nome do usuário
- [ ] Nome da máquina
- [ ] Versão do OS
- [ ] Software de gravação
- [ ] Data/hora de criação
- [ ] Informações de hardware
- [ ] Informações de rede

### **🔍 Informações do Sistema de Arquivos (Sempre Disponíveis)**
- [x] Data de criação do arquivo
- [x] Data de modificação
- [x] Data de último acesso
- [x] Permissões do arquivo
- [x] Tamanho em bytes

---

## 🎯 **Recomendações para Extração de Metadados Forenses**

### **1. Analisar Vídeos Originais**
- **Antes do processamento:** Extrair metadados antes de re-encodar
- **Preservar metadados:** Usar flags do FFmpeg para preservar metadados
- **Backup original:** Manter cópia original antes do processamento

### **2. Configurar Software de Gravação**
- **Adicionar metadados:** Configurar software para incluir informações forenses
- **Metadados personalizados:** Adicionar tags com informações do usuário/sistema
- **Preservar timestamps:** Manter timestamps originais

### **3. Usar Ferramentas Especializadas**
- **ExifTool:** Para metadados EXIF
- **MediaInfo:** Para informações detalhadas
- **FFprobe:** Para análise técnica
- **Análise hexadecimal:** Para assinaturas de arquivo

### **4. Processamento Inteligente**
- **Detectar formato:** Identificar formato original
- **Preservar metadados:** Manter metadados durante conversão
- **Log de processamento:** Registrar alterações feitas

---

## 📁 **Arquivos Criados**

1. **`poc-metadados-forenses.js`** - Script básico para metadados forenses
2. **`poc-metadados-forenses-avancado.js`** - Script avançado com múltiplas técnicas
3. **`forenses_*.json`** - Arquivos JSON com metadados extraídos
4. **`README-METADADOS-VIDEO.md`** - Documentação completa

---

## 🎬 **Conclusão**

Os scripts criados **capturam informações forenses quando disponíveis**, mas os vídeos atuais foram processados pelo FFmpeg, que remove metadados forenses originais. Para obter informações como nome do usuário, máquina e versão do OS, é necessário:

1. **Analisar vídeos originais** (antes do processamento)
2. **Configurar software de gravação** para incluir metadados forenses
3. **Usar ferramentas especializadas** para análise mais profunda
4. **Preservar metadados** durante o processamento

Os scripts estão prontos para detectar e extrair essas informações quando presentes nos vídeos! 