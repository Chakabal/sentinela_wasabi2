# Release Notes - Sentinela Wasabi v2.0.4

## 🎯 **Simplificação do Payload Parla.app**

### **Mudança Realizada:**
- **Payload anterior:** URL completa do Wasabi
- **Novo payload:** Caminho relativo do bucket
- **Benefício:** Mais limpo e flexível para o Parla.app

## 🚀 **Atualizações Implementadas**

### 1. **Payload Simplificado**
- ✅ **Antes:** `https://s3.us-east-1.wasabisys.com/videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`
- ✅ **Agora:** `videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`

### 2. **Funcionalidades Mantidas**
- ✅ ACL pública automática em todos os uploads
- ✅ Configuração automática do bucket para acesso público
- ✅ Verificação de permissões após cada upload
- ✅ Logs detalhados sobre status de acesso
- ✅ Bucket `videos.parla.app` configurado

### 3. **Exemplo de Payload Atualizado**
```json
{
  "token": "test_token_parla_app_2025",
  "arquivo": "20250804--CORONEL-MEIRA-11.mp4",
  "fileId": "ETag_do_arquivo",
  "b2_file_id": "ETag_do_arquivo",
  "clientName": "CORONEL-MEIRA",
  "durationSec": "217",
  "durationFormated": "3m37s",
  "sizeMB": "182.81",
  "b2_url": "videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4",
  "status": "completed",
  "timestamp": "2025-08-05T13:30:00.000Z"
}
```

## 📁 **Arquivos Incluídos**

### **Executável Principal:**
- `sentinela-wasabi-v2.0.4.exe` (435MB)
- Inclui todos os binários ffmpeg
- Totalmente autônomo, sem dependências externas
- Configurado para usar `videos.parla.app`
- Payload simplificado para Parla.app

### **Documentação Atualizada:**
- `RELEASE-v2.0.4.md` - Este arquivo
- `CHANGELOG.md` - Histórico completo incluindo v2.0.4

## 🔧 **Configuração Automática**

O sistema continua funcionando automaticamente:
1. **Verifica** se o bucket `videos.parla.app` está configurado para acesso público
2. **Configura** automaticamente ACL pública se necessário
3. **Aplica** política de bucket para permitir acesso aos objetos
4. **Verifica** cada arquivo após upload para confirmar acesso público
5. **Envia** payload simplificado para Parla.app

## 📊 **Melhorias Técnicas**

### **Payload Parla.app (Simplificado):**
```javascript
// ANTES (v2.0.3):
b2_url: `https://s3.us-east-1.wasabisys.com/${CONFIG.WASABI.BUCKET_NAME}/${clientName}/${fileName}`

// AGORA (v2.0.4):
b2_url: `${CONFIG.WASABI.BUCKET_NAME}/${clientName}/${fileName}`
```

### **Exemplo de Resultado:**
- **Antes:** `https://s3.us-east-1.wasabisys.com/videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`
- **Agora:** `videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`

## 🧪 **Testes Realizados**

- ✅ **Payload simplificado** funcionando
- ✅ **URLs de acesso** mantidas para verificação
- ✅ **Upload com ACL pública** mantido
- ✅ **Configuração automática do bucket** funcionando
- ✅ **Verificação de arquivos** após upload
- ✅ **Logs informativos** sobre status de acesso

## 🚀 **Instalação e Uso**

1. **Baixe** o arquivo `sentinela-wasabi-v2.0.4.exe`
2. **Configure** o arquivo `config.js` (já atualizado para `videos.parla.app`)
3. **Execute** o programa
4. **Monitore** os logs para confirmar configuração automática
5. **Verifique** o payload enviado para Parla.app

## 📝 **Logs de Verificação**

Ao executar, você verá logs como:
```
[INFO] Wasabi autorizado com sucesso via AWS SDK v3
[INFO] Bucket configurado corretamente para acesso público
[INFO] Tentando configurar bucket para acesso público...
[INFO] Política de bucket configurada para acesso público aos objetos
[INFO] Arquivo CLIENTE/arquivo.mp4 está público
[INFO] Payload enviado para Parla.app com caminho relativo
```

## 🔄 **Compatibilidade**

### **URLs de Acesso (Mantidas para Verificação):**
```
https://s3.us-east-1.wasabisys.com/videos.parla.app/CLIENTE/nome-do-arquivo.mp4
```

### **Payload Parla.app (Simplificado):**
```
videos.parla.app/CLIENTE/nome-do-arquivo.mp4
```

## 🎯 **Status: PRONTO PARA PRODUÇÃO**

Esta versão mantém **todas as funcionalidades anteriores** e adiciona a **simplificação do payload** para o Parla.app, tornando-o mais limpo e flexível.

---

**Versão:** 2.0.4  
**Data:** 05/08/2025  
**Tamanho:** 435MB  
**Bucket:** videos.parla.app  
**Payload:** Simplificado (caminho relativo)  
**Status:** ✅ PRONTO PARA DISTRIBUIÇÃO 