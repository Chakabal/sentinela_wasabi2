# 🎬 RELEASE v2.0.6 - Thumbnail Automático

## 📋 **Resumo da Versão**

**Versão:** 2.0.6  
**Data:** Janeiro 2025  
**Tipo:** Nova Funcionalidade  
**Compatibilidade:** Total com versões anteriores  

## 🎯 **Problema Resolvido**

Implementação de **thumbnail automático** para vídeos, extraindo frames em 10% da duração e fazendo upload para bucket separado `imagens.parla.app`, integrando o link no payload do Parla.app.

## ✨ **Novas Funcionalidades**

### 🎬 **Extração Automática de Thumbnail**
- **Posição:** 10% da duração do vídeo
- **Dimensões:** Width 400px (height proporcional)
- **Formato:** JPG com qualidade otimizada
- **Tecnologia:** ffmpeg local (mesma lógica da duração)

### ☁️ **Upload para Bucket Separado**
- **Bucket:** `imagens.parla.app`
- **Permissões:** Mesmas regras do vídeo (público)
- **Estrutura:** Mesma pasta do cliente
- **URL:** `https://imagens.parla.app/[CLIENTE]/[ARQUIVO].jpg`

### 🔗 **Integração Parla.app**
- **Campo:** `imagem` no payload
- **Formato:** URL completa sem endpoint Wasabi
- **Timing:** Após upload do vídeo, antes do payload

### 🛡️ **Tratamento de Erros Robusto**
- **Processo não-bloqueante:** Falhas não param o upload do vídeo
- **Arquivos de erro:** `erro/[ARQUIVO]_thumb_error.txt`
- **Logs específicos:** "imagem ok" na linha de estatísticas

## 🔧 **Detalhes Técnicos**

### **Fluxo de Processamento:**
```
1. Upload vídeo → videos.parla.app/[CLIENTE]/video.mp4
2. Extrair thumbnail → ./temp/video/video.jpg
3. Upload thumbnail → imagens.parla.app/[CLIENTE]/video.jpg
4. Payload Parla → { arquivo: "...", imagem: "..." }
5. Limpar pasta temporária
6. Log: "imagem ok"
```

### **Comando ffmpeg:**
```bash
ffmpeg -i "video.mp4" -ss 00:00:21 -vframes 1 -vf scale=400:-1 -q:v 2 "thumbnail.jpg"
```

### **Configuração:**
```javascript
// config.js
WASABI: {
  IMAGES_BUCKET_NAME: 'imagens.parla.app',  // ← Novo bucket
  // ... outras configurações
}
```

## 📁 **Arquivos Incluídos**

### **Arquivos Modificados:**
- `sentinela-wasabi.js` - Novas funções de thumbnail
- `config.js` - Configuração do bucket de imagens
- `package.json` - Versão atualizada

### **Novas Funções:**
- `extractVideoThumbnail()` - Extração usando ffmpeg
- `formatTimeForFfmpeg()` - Conversão de tempo
- `uploadThumbnailToWasabi()` - Upload para bucket de imagens
- `verifyThumbnailPublicAccess()` - Verificação de permissões
- `saveThumbnailError()` - Salvamento de erros
- `cleanupThumbnailTemp()` - Limpeza de pasta temporária

## 🚀 **Instalação e Uso**

### **1. Atualização:**
```bash
# Substitua os arquivos existentes pelos novos
# Execute o build
npm run build
```

### **2. Configuração:**
- Certifique-se de que o bucket `imagens.parla.app` existe no Wasabi
- Configure as permissões públicas no bucket (se necessário)

### **3. Uso:**
- **Zero mudanças** no uso atual
- Thumbnails são gerados automaticamente
- Logs mostram "imagem ok" quando bem-sucedido

## 🎯 **Benefícios**

### **Para o Usuário:**
- ✅ **Automatização completa** - zero trabalho manual
- ✅ **Integração transparente** - não afeta fluxo existente
- ✅ **Processamento seguro** - falhas não quebram uploads
- ✅ **Logs claros** - acompanhamento fácil

### **Para o Sistema:**
- ✅ **Performance otimizada** - processamento paralelo
- ✅ **Compatibilidade total** - funciona em dev e produção
- ✅ **Tratamento robusto** - erros bem gerenciados
- ✅ **Limpeza automática** - pastas temporárias removidas

## 🔍 **Monitoramento**

### **Logs de Sucesso:**
```
[INFO] Thumbnail extraído: ./temp/video/video.jpg
[INFO] Thumbnail enviado para Wasabi: CLIENTE/video.jpg
[INFO] Thumbnail verificado como público: CLIENTE/video.jpg
[INFO] imagem ok
```

### **Logs de Erro:**
```
[WARN] Erro no processamento do thumbnail: video.mp4 Error message
[INFO] Erro de thumbnail salvo em: erro/video_thumb_error.txt
```

## 🎬 **Payload Parla.app CORRETO**

```json
{
  "token": "test_token_parla_app_2025",
  "arquivo": "20250101--CLIENTE_A-001.mp4",
  "fileId": "abc123def456ghi789",
  "b2_url": "https://videos.parla.app/CLIENTE_A/20250101--CLIENTE_A-001.mp4",
  "durationSec": "217",
  "durationFormated": "3m37s",
  "sizeMB": "182.81",
  "imagem": "https://imagens.parla.app/CLIENTE_A/20250101--CLIENTE_A-001.jpg"
}
```

### **Campos do Payload:**
- `token` - Token de autenticação
- `arquivo` - Nome do arquivo de vídeo
- `fileId` - ID único do arquivo no Wasabi
- `b2_url` - URL do vídeo
- `durationSec` - Duração em segundos
- `durationFormated` - Duração formatada
- `sizeMB` - Tamanho em MB
- `imagem` - URL do thumbnail (quando disponível)

## 🚀 **Status: PRONTO PARA PRODUÇÃO**

✅ **Testado e validado**  
✅ **Compatível com versões anteriores**  
✅ **Zero breaking changes**  
✅ **Processamento seguro e robusto**  

---

**🎬 Thumbnail automático implementado com sucesso!** 