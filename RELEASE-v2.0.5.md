# Release Notes - Sentinela Wasabi v2.0.5

## 🎯 **Correção do Payload Parla.app**

### **Mudança Realizada:**
- **Payload anterior:** `videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`
- **Novo payload:** `https://videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`
- **Benefício:** Mantém o protocolo HTTPS sem o endpoint completo do Wasabi

## 🚀 **Atualizações Implementadas**

### 1. **Payload Corrigido**
- ✅ **Antes:** `videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`
- ✅ **Agora:** `https://videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`

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
  "b2_url": "https://videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4",
  "status": "completed",
  "timestamp": "2025-08-05T13:30:00.000Z"
}
```

## 📁 **Arquivos Incluídos**

### **Executável Principal:**
- `sentinela-wasabi-v2.0.5.exe` (435MB)
- Inclui todos os binários ffmpeg
- Totalmente autônomo, sem dependências externas
- Configurado para usar `videos.parla.app`
- Payload corrigido para Parla.app com https://

### **Documentação Atualizada:**
- `RELEASE-v2.0.5.md` - Este arquivo
- `CHANGELOG.md` - Histórico completo incluindo v2.0.5

## 🔧 **Configuração Automática**

O sistema continua funcionando automaticamente:
1. **Verifica** se o bucket `videos.parla.app` está configurado para acesso público
2. **Configura** automaticamente ACL pública se necessário
3. **Aplica** política de bucket para permitir acesso aos objetos
4. **Verifica** cada arquivo após upload para confirmar acesso público
5. **Envia** payload corrigido para Parla.app com https://

## 📊 **Melhorias Técnicas**

### **Payload Parla.app (Corrigido):**
```javascript
// ANTES (v2.0.4):
b2_url: `${CONFIG.WASABI.BUCKET_NAME}/${clientName}/${fileName}`

// AGORA (v2.0.5):
b2_url: `https://${CONFIG.WASABI.BUCKET_NAME}/${clientName}/${fileName}`
```

### **Exemplo de Resultado:**
- **Antes:** `videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`
- **Agora:** `https://videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4`

## 🧪 **Testes Realizados**

- ✅ **Payload corrigido** funcionando
- ✅ **Protocolo HTTPS** incluído
- ✅ **URLs de acesso** mantidas para verificação
- ✅ **Upload com ACL pública** mantido
- ✅ **Configuração automática do bucket** funcionando
- ✅ **Verificação de arquivos** após upload
- ✅ **Logs informativos** sobre status de acesso

## 🚀 **Instalação e Uso**

1. **Baixe** o arquivo `sentinela-wasabi-v2.0.5.exe`
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
[INFO] Payload enviado para Parla.app com https://
```

## 🔄 **Compatibilidade**

### **URLs de Acesso (Mantidas para Verificação):**
```
https://s3.us-east-1.wasabisys.com/videos.parla.app/CLIENTE/nome-do-arquivo.mp4
```

### **Payload Parla.app (Corrigido):**
```
https://videos.parla.app/CLIENTE/nome-do-arquivo.mp4
```

## 🎯 **Status: PRONTO PARA PRODUÇÃO**

Esta versão mantém **todas as funcionalidades anteriores** e corrige o **payload para o Parla.app** incluindo o protocolo HTTPS.

---

**Versão:** 2.0.5  
**Data:** 05/08/2025  
**Tamanho:** 435MB  
**Bucket:** videos.parla.app  
**Payload:** Corrigido (https:// + caminho relativo)  
**Status:** ✅ PRONTO PARA DISTRIBUIÇÃO 