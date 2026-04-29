# Release Notes - Sentinela Wasabi v2.0.3

## 🎯 **Migração para Novo Bucket**

### **Mudança Realizada:**
- **Bucket anterior:** `parla.app`
- **Novo bucket:** `videos.parla.app`
- **Status:** ✅ Bucket público configurado no Wasabi
- **Compatibilidade:** ✅ Mantém todas as funcionalidades de acesso público

## 🚀 **Atualizações Implementadas**

### 1. **Configuração Atualizada**
- ✅ Bucket alterado para `videos.parla.app` no `config.js`
- ✅ URLs de acesso atualizadas automaticamente
- ✅ Mantém todas as correções de acesso público da v2.0.2

### 2. **Funcionalidades Mantidas**
- ✅ ACL pública automática em todos os uploads
- ✅ Configuração automática do bucket para acesso público
- ✅ Verificação de permissões após cada upload
- ✅ Logs detalhados sobre status de acesso

### 3. **URLs de Acesso Atualizadas**
```
https://s3.us-east-1.wasabisys.com/videos.parla.app/CLIENTE/nome-do-arquivo.mp4
```

## 📁 **Arquivos Incluídos**

### **Executável Principal:**
- `sentinela-wasabi-v2.0.3.exe` (435MB)
- Inclui todos os binários ffmpeg
- Totalmente autônomo, sem dependências externas
- Configurado para usar `videos.parla.app`

### **Documentação Atualizada:**
- `WASABI-PUBLIC-ACCESS.md` - Guia atualizado para `videos.parla.app`
- `CHANGELOG.md` - Histórico completo incluindo v2.0.3
- `RELEASE-v2.0.3.md` - Este arquivo

## 🔧 **Configuração Automática**

O sistema continua funcionando automaticamente:
1. **Verifica** se o bucket `videos.parla.app` está configurado para acesso público
2. **Configura** automaticamente ACL pública se necessário
3. **Aplica** política de bucket para permitir acesso aos objetos
4. **Verifica** cada arquivo após upload para confirmar acesso público

## 📊 **Melhorias Técnicas**

### **Configuração de Upload (Mantida):**
```javascript
params: {
  Bucket: CONFIG.WASABI.BUCKET_NAME, // ← Agora: videos.parla.app
  Key: wasabiFileName,
  Body: fs.createReadStream(filePath),
  ContentType: 'application/octet-stream',
  ACL: 'public-read' // ← Mantém arquivo público
}
```

### **Política de Bucket Automática (Atualizada):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::videos.parla.app/*"
    }
  ]
}
```

## 🧪 **Testes Realizados**

- ✅ **Migração de bucket** funcionando
- ✅ **URLs atualizadas** automaticamente
- ✅ **Upload com ACL pública** mantido
- ✅ **Configuração automática do bucket** funcionando
- ✅ **Verificação de arquivos** após upload
- ✅ **Logs informativos** sobre status de acesso

## 🚀 **Instalação e Uso**

1. **Baixe** o arquivo `sentinela-wasabi-v2.0.3.exe`
2. **Configure** o arquivo `config.js` (já atualizado para `videos.parla.app`)
3. **Execute** o programa
4. **Monitore** os logs para confirmar configuração automática
5. **Teste** acesso aos arquivos via URL direta

## 📝 **Logs de Verificação**

Ao executar, você verá logs como:
```
[INFO] Wasabi autorizado com sucesso via AWS SDK v3
[INFO] Bucket configurado corretamente para acesso público
[INFO] Tentando configurar bucket para acesso público...
[INFO] Política de bucket configurada para acesso público aos objetos
[INFO] Arquivo CLIENTE/arquivo.mp4 está público
```

## 🔄 **Migração de Dados**

### **Se você tinha arquivos no bucket anterior:**
- Os arquivos no `parla.app` permanecem lá
- Novos uploads irão para `videos.parla.app`
- URLs antigas continuam funcionando: `https://s3.us-east-1.wasabisys.com/parla.app/...`
- URLs novas: `https://s3.us-east-1.wasabisys.com/videos.parla.app/...`

## 🎯 **Status: PRONTO PARA PRODUÇÃO**

Esta versão mantém **todas as correções de acesso público** da v2.0.2 e adiciona a **migração para o novo bucket** `videos.parla.app`.

---

**Versão:** 2.0.3  
**Data:** 05/08/2025  
**Tamanho:** 435MB  
**Bucket:** videos.parla.app  
**Status:** ✅ PRONTO PARA DISTRIBUIÇÃO 