# Changelog - Sentinela Wasabi

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## Versão 2.0.4 - Simplificação do Payload Parla.app

### 🎯 **Simplificação do Payload**
- **Payload anterior:** URL completa do Wasabi (`https://s3.us-east-1.wasabisys.com/videos.parla.app/...`)
- **Novo payload:** Caminho relativo do bucket (`videos.parla.app/...`)
- **Benefício:** Mais limpo e flexível para o Parla.app

### ✅ **Atualizações Realizadas**
- ✅ Payload simplificado para Parla.app
- ✅ Mantém todas as funcionalidades de acesso público
- ✅ Mantém bucket `videos.parla.app` configurado
- ✅ URLs de acesso mantidas para verificação

### 📊 **Exemplo de Payload Atualizado**
```json
{
  "b2_url": "videos.parla.app/CORONEL-MEIRA/20250804--CORONEL-MEIRA-11.mp4"
}
```

### 📁 **Arquivos Modificados**
- `sentinela-wasabi.js` - Versão atualizada para 2.0.4
- `package.json` - Versão atualizada para 2.0.4
- `RELEASE-v2.0.4.md` - Documentação da nova versão

---

## Versão 2.0.3 - Migração para Bucket videos.parla.app

### 🎯 **Mudança de Bucket**
- **Bucket anterior:** `parla.app`
- **Novo bucket:** `videos.parla.app`
- **Status:** Bucket público configurado no Wasabi
- **Compatibilidade:** Mantém todas as funcionalidades de acesso público

### ✅ **Atualizações Realizadas**
- ✅ Configuração atualizada para usar `videos.parla.app`
- ✅ URLs de acesso atualizadas automaticamente
- ✅ Mantém todas as correções de acesso público da v2.0.2
- ✅ Sistema totalmente compatível com o novo bucket

### 🌐 **Novas URLs de Acesso**
```
https://s3.us-east-1.wasabisys.com/videos.parla.app/CLIENTE/nome-do-arquivo.mp4
```

### 📁 **Arquivos Modificados**
- `config.js` - Bucket atualizado para `videos.parla.app`
- `sentinela-wasabi.js` - Versão atualizada para 2.0.3
- `package.json` - Versão atualizada para 2.0.3
- `WASABI-PUBLIC-ACCESS.md` - Documentação atualizada

---

## Versão 2.0.2 - Configuração Automática de Acesso Público no Wasabi

### 🎯 **Problema Resolvido**
- **Bucket público, arquivos privados**: O bucket `parla.app` estava configurado como público no Wasabi, mas os arquivos individuais estavam sendo enviados como privados
- **Acesso negado aos vídeos**: Usuários não conseguiam acessar os vídeos via URL direta

### ✅ **Soluções Implementadas**

#### 1. **ACL Pública nos Uploads**
- ✅ Adicionado `ACL: 'public-read'` em todos os uploads para Wasabi
- ✅ Garante que cada arquivo seja público individualmente
- ✅ Configuração automática de permissões por arquivo

#### 2. **Verificação Automática do Bucket**
- ✅ Função `checkBucketConfiguration()` para verificar permissões do bucket
- ✅ Detecta automaticamente se o bucket está configurado para acesso público
- ✅ Logs informativos sobre o status das configurações

#### 3. **Configuração Automática do Bucket**
- ✅ Função `configureBucketForPublicAccess()` para configurar bucket automaticamente
- ✅ Aplica ACL pública ao bucket via `PutBucketAclCommand`
- ✅ Configura política de bucket para permitir acesso público aos objetos
- ✅ Política JSON automática com `s3:GetObject` para todos os objetos

#### 4. **Verificação de Arquivos**
- ✅ Função `verifyFilePublicAccess()` para verificar arquivos após upload
- ✅ Confirma se cada arquivo está realmente público
- ✅ Logs detalhados sobre o status de acesso de cada arquivo

### 🔧 **Melhorias Técnicas**

#### **Configuração de Upload:**
```javascript
params: {
  Bucket: CONFIG.WASABI.BUCKET_NAME,
  Key: wasabiFileName,
  Body: fs.createReadStream(filePath),
  ContentType: 'application/octet-stream',
  ACL: 'public-read' // ← NOVO: Torna o arquivo público
}
```

#### **Política de Bucket Automática:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::parla.app/*"
    }
  ]
}
```

### 📊 **Logs de Verificação**
O sistema agora mostra logs como:
- `Bucket configurado corretamente para acesso público`
- `Arquivo CLIENTE/arquivo.mp4 está público`
- `Política de bucket configurada para acesso público aos objetos`
- `Tentando configurar bucket para acesso público...`

### 🌐 **URLs de Acesso**
Com as configurações corretas, os arquivos estarão acessíveis via:
```
https://s3.us-east-1.wasabisys.com/parla.app/CLIENTE/nome-do-arquivo.mp4
```

### 📁 **Arquivos Criados/Modificados**
- `sentinela-wasabi.js` - Versão 2.0.2 com configurações de acesso público
- `WASABI-PUBLIC-ACCESS.md` - Documentação completa sobre configuração
- `CHANGELOG.md` - Atualizado com as mudanças da v2.0.2

### 🚀 **Status: PRONTO PARA PRODUÇÃO**
Sistema agora configura automaticamente o acesso público no Wasabi, garantindo que todos os vídeos sejam acessíveis via URL direta!

---

## Versão 1.1.2 - Correção de Fila e Interface Melhorada

### 🐛 **Correções Críticas**
- **Corrigido problema de fila** que impedia processamento de múltiplos arquivos
- **Implementado monitor periódico** da fila (verificação a cada 10s)
- **Adicionado logs detalhados** do status da fila
- **Prevenção de arquivos presos** na fila sem processamento

### 🎨 **Interface Console Melhorada**
- **Interface visual moderna** com bordas e cores
- **Status em tempo real** da fila e processamento
- **Contadores dinâmicos** de arquivos enviados e com erro
- **Atualização automática** da interface sem poluir logs
- **Informações de configuração** visíveis no console

### 🔧 **Melhorias Técnicas**
- **Função `startQueueMonitor()`** para verificação periódica da fila
- **Função `updateConsoleStatus()`** para interface dinâmica
- **Contadores `totalEnviados` e `totalErros`** para estatísticas
- **Logs de debug** para rastreamento da fila
- **Prevenção de starvation** de arquivos na fila

### 🎯 **Benefícios**
- ✅ **Processamento de múltiplos arquivos** funcionando corretamente
- ✅ **Interface mais informativa** e profissional
- ✅ **Monitoramento em tempo real** do status
- ✅ **Prevenção de travamentos** da fila
- ✅ **Logs mais organizados** e limpos

### 📁 **Arquivos Modificados**
- `sentinela-wasabi.js` - Lógica de fila e interface console
- `package.json` - Versão atualizada

---

## Versão 1.1.1 - Correção de Loop Infinito

### 🐛 **Correções Críticas**
- **Corrigido loop infinito** ao processar múltiplos arquivos simultaneamente
- **Implementado controle em memória** para arquivos já processados
- **Prevenção de reprocessamento** de arquivos com erro
- **Carregamento automático** de arquivos processados na inicialização

### 🔧 **Melhorias Técnicas**
- **Set em memória** para rastrear arquivos processados (mais rápido que I/O)
- **Função `markFileAsProcessed()`** para marcar arquivos como processados
- **Função `loadProcessedFiles()`** para carregar estado na inicialização
- **Watcher melhorado** com verificações adicionais de existência de arquivo
- **Logs mais informativos** sobre arquivos ignorados

### 🎯 **Benefícios**
- ✅ **Eliminação de loops infinitos**
- ✅ **Performance melhorada** (verificação em memória)
- ✅ **Sistema mais robusto** após reinicialização
- ✅ **Controle de estado eficiente**

### 📁 **Arquivos Modificados**
- `sentinela-wasabi.js` - Lógica de controle de arquivos processados
- `CORRECAO-LOOP.md` - Documentação da correção

---

## Versão 1.1.0 - FFprobe Integrado e Interface Melhorada

### ✅ **Novas Funcionalidades**

#### 1. **FFprobe Integrado**
- ✅ Binários ffmpeg incluídos no executável (422MB)
- ✅ Extração automática para pasta temporária quando necessário
- ✅ Captura de duração de vídeos sem dependências externas
- ✅ Funcionamento em ambiente compilado

#### 2. **Interface Melhorada**
- ✅ Versão exibida no console: `🚀 Sentinela Wasabi v1.1.0`
- ✅ Informações de inicialização mais claras
- ✅ Timestamp de início em formato brasileiro
- ✅ Separador visual para melhor legibilidade

#### 3. **Controle de Arquivos**
- ✅ Verificação aprimorada de arquivos já processados
- ✅ Prevenção de reprocessamento de arquivos em pasta erro/enviados
- ✅ Logs mais informativos sobre arquivos ignorados

### 🔧 **Correções Técnicas**

#### 1. **Dependências**
- ❌ Removida dependência `@ffprobe-installer/ffprobe`
- ✅ Sistema totalmente independente
- ✅ Binários ffmpeg incluídos no executável

#### 2. **Configuração pkg**
- ✅ Assets atualizados para incluir `ffmpeg/**/*`
- ✅ Executável único com todas as dependências
- ✅ Tamanho otimizado: 422MB

#### 3. **Extração de Binários**
- ✅ Função `extractFfmpegBinaries()` implementada
- ✅ Extração automática para `%TEMP%\sentinela-ffmpeg\`
- ✅ Reutilização de binários já extraídos

### 📊 **Resultados dos Testes**
- ✅ **Binários extraídos**: ffmpeg.exe, ffprobe.exe, ffplay.exe
- ✅ **Duração capturada**: 217 segundos (3m37s)
- ✅ **Upload concluído**: 182.81MB enviado para B2
- ✅ **Sistema totalmente independente**

### 📁 **Arquivos Criados/Modificados**
- `CHANGELOG-v1.1.0.md` - Documentação completa
- `README-VIDEO-DURATION.md` - Guia de uso do ffprobe
- `get-duration-video.js` - Script de teste
- `get-duration-video-compiled.js` - Versão otimizada
- `package.json` - Versão atualizada
- `pkg.config.json` - Assets atualizados
- `sentinela-wasabi.js` - Código principal atualizado

### 🚀 **Status: PRONTO PARA DISTRIBUIÇÃO**
O executável agora é **completamente autônomo** e pode ser distribuído sem nenhum arquivo adicional!

---

## Versão 1.0.18 - Integração FFprobe Local

### 🎯 **Objetivo**
Integrar funcionalidade de captura de duração de vídeo usando ffprobe local no script principal `sentinela-wasabi.js`, mantendo a compatibilidade com compilação pkg.

### ✅ **Implementações Realizadas**

#### 1. **Nova Função `getVideoDurationSeconds()`**
- ✅ Integrada no `sentinela-wasabi.js`
- ✅ Usa ffprobe local em `ffmpeg/ffprobe.exe`
- ✅ Compatível com compilação pkg
- ✅ Tratamento de erros robusto
- ✅ Logs informativos

#### 2. **Remoção de Dependência Externa**
- ❌ Removido `@ffprobe-installer/ffprobe` do `package.json`
- ✅ Sistema mais leve e independente
- ✅ Menos dependências externas

#### 3. **Atualização de Configuração pkg**
- ✅ `package.json` atualizado com novos assets
- ✅ `pkg.config.json` atualizado para incluir `ffmpeg/**/*`
- ✅ Binários ffmpeg incluídos no executável

### 🔧 **Como Funciona**

#### **Em Desenvolvimento:**
```javascript
ffprobePath = path.join(__dirname, 'ffmpeg', 'ffprobe.exe');
```

#### **Em Produção (Compilado):**
```javascript
// Detecta se está compilado com pkg
if (isPkg) {
  // Usa caminho do snapshot
  ffprobePath = path.join(ASSET_DIR, 'ffmpeg', 'ffprobe.exe');
} else {
  // Usa caminho de desenvolvimento
  ffprobePath = path.join(__dirname, 'ffmpeg', 'ffprobe.exe');
}
```

### 📊 **Benefícios**
- ✅ **Captura de duração real** do vídeo
- ✅ **Sistema independente** sem dependências externas
- ✅ **Compatibilidade total** com pkg
- ✅ **Logs detalhados** para debugging
- ✅ **Tratamento de erros** robusto

### 📁 **Estrutura de Arquivos**
```
Sentinela Wasabi/
├── ffmpeg/
│   ├── ffmpeg.exe
│   ├── ffprobe.exe
│   └── ffplay.exe
├── sentinela-wasabi.js (atualizado)
├── package.json (atualizado)
├── pkg.config.json (atualizado)
└── config.example.js
```

### 🧪 **Testes Realizados**
- ✅ **Desenvolvimento**: ffprobe local funciona
- ✅ **Compilação**: pkg inclui binários corretamente
- ✅ **Execução**: captura duração de vídeo.mp4
- ✅ **Logs**: informações detalhadas de duração

### 🚀 **Status: FUNCIONAL**
A integração está **100% funcional** e pronta para uso em produção!

---

## Versão 1.0.17 - Sistema de Upload Automático

### 🎯 **Funcionalidades Principais**

#### 1. **Monitoramento Automático**
- ✅ Monitora pasta `videos/` em tempo real
- ✅ Detecta novos arquivos automaticamente
- ✅ Processamento em background não-bloqueante

#### 2. **Upload para Wasabi**
- ✅ Upload direto via API S3 compatível
- ✅ Organização por cliente (pasta por cliente)
- ✅ Barra de progresso em tempo real
- ✅ Retry automático em caso de falha

#### 3. **Integração Parla.app**
- ✅ Notificação de início de transferência
- ✅ Notificação de conclusão com metadados
- ✅ Informações de duração e tamanho do vídeo
- ✅ URL direta para acesso no B2

#### 4. **Controle de Arquivos**
- ✅ Validação de tipos de arquivo (.mp4, .avi, .mov, .mkv)
- ✅ Limite de tamanho (10GB máximo)
- ✅ Movimentação automática para `enviados/` ou `erro/`
- ✅ Prevenção de reprocessamento

### 🔧 **Configurações**

#### **Upload:**
- Máximo 3 uploads simultâneos
- Timeout infinito para arquivos grandes
- 5 tentativas de retry com delay de 15s
- Aguarda arquivo estável por 5s

#### **Monitoramento:**
- Logs detalhados em `log-producao.txt`
- Estatísticas salvas em `upload-stats.json`
- Status a cada 1 minuto

### 📁 **Estrutura de Pastas**
```
videos/
├── [arquivos novos] ← Monitorados
├── enviados/ ← Processados com sucesso
└── erro/ ← Com falha no processamento
```

### 🚀 **Status: PRONTO PARA PRODUÇÃO**
Sistema estável e testado para uso em ambiente de produção! 

---

## [2.1.0] - 2025-01-XX

### 🎯 **CORREÇÃO CRÍTICA: Payload Parla.app**

#### **❌ Problema Resolvido:**
- **Status 400 no Parla.app** - Payload com campos incorretos
- **Campo `fileId` errado** - Mudado para `b2_file_id`
- **Aspas duplas no ETag** - Remoção automática
- **Campos desnecessários** - Removidos `status` e `timestamp`

#### **✅ Correções Implementadas:**
- **Campo correto:** `b2_file_id` em vez de `fileId`
- **ETag limpo:** Remoção automática de aspas duplas
- **Payload mínimo:** Apenas campos essenciais
- **Thumbnail obrigatório:** Campo `imagem` requerido

#### **🔧 Payload Final:**
```json
{
  "token": "test_token_parla_app_2025",
  "arquivo": "20250805--CORONEL-MEIRA-45.mp4",
  "b2_file_id": "62390d2a0ba3041f604469f2619ba9aa-4",
  "b2_url": "https://videos.parla.app/CORONEL-MEIRA/20250805--CORONEL-MEIRA-45.mp4",
  "durationSec": "157",
  "durationFormated": "2m37s",
  "sizeMB": "103.27",
  "imagem": "https://imagens.parla.app/CORONEL-MEIRA/20250805--CORONEL-MEIRA-45.jpg"
}
```

#### **📁 Arquivos Modificados:**
- `sentinela-wasabi.js` - Payload corrigido
- `package.json` - Versão atualizada
- `RELEASE-v2.1.0.md` - Documentação completa

#### **🎯 Benefícios:**
- ✅ **Status 200** - Parla.app aceita o payload
- ✅ **Zero erros** - Sem mais rejeições 400
- ✅ **Thumbnail obrigatório** - Garantia de qualidade
- ✅ **Compatibilidade total** - Funciona com APIs existentes

---

## [2.0.6] - 2025-01-XX

### 🎬 **NOVA FUNCIONALIDADE: Thumbnail Automático**

#### **✨ Novas Funcionalidades:**
- **Extração automática de thumbnail** de vídeos usando ffmpeg
- **Upload de thumbnails** para bucket separado `imagens.parla.app`
- **Integração no payload Parla.app** com campo `imagem`
- **Processamento não-bloqueante** - falhas de thumbnail não param o upload do vídeo

#### **🔧 Funcionalidades Técnicas:**
- **Posição do thumbnail:** 10% da duração do vídeo
- **Dimensões:** Width 400px (height proporcional)
- **Formato:** JPG com qualidade otimizada
- **Pasta temporária:** `./temp/[NOME_ARQUIVO]/` (limpa automaticamente)
- **Bucket de imagens:** `imagens.parla.app` com mesmas permissões públicas
- **URL do thumbnail:** `https://imagens.parla.app/[CLIENTE]/[ARQUIVO].jpg`

#### **🛡️ Tratamento de Erros:**
- **Arquivos de erro:** Salva detalhes em `erro/[ARQUIVO]_thumb_error.txt`
- **Processo não-bloqueante:** Continua upload mesmo se thumbnail falhar
- **Logs específicos:** "imagem ok" na linha de estatísticas

#### **📁 Arquivos Modificados:**
- `sentinela-wasabi.js` - Novas funções de thumbnail
- `config.js` - Adicionado `IMAGES_BUCKET_NAME`
- `package.json` - Versão atualizada para 2.0.6

#### **🔧 Novas Funções:**
- `extractVideoThumbnail()` - Extrai thumbnail usando ffmpeg
- `formatTimeForFfmpeg()` - Converte segundos para formato HH:MM:SS
- `uploadThumbnailToWasabi()` - Upload para bucket de imagens
- `verifyThumbnailPublicAccess()` - Verifica permissões públicas
- `saveThumbnailError()` - Salva erros em arquivo de texto
- `cleanupThumbnailTemp()` - Remove pasta temporária

#### **🎯 Benefícios:**
- **Automatização completa** do processo de thumbnail
- **Integração transparente** com fluxo existente
- **Zero impacto** no processamento de vídeos
- **Compatibilidade total** com ambiente compilado
- **Logs detalhados** para monitoramento

---

## [2.0.5] - 2025-01-XX 
