# Sentinela Wasabi 2.0

Nova linha do Sentinela Wasabi com foco em operacao confiavel no console, uploads para Wasabi Cloud Storage e integracao Parla.app.

## Objetivo da Versao 2.0

Esta versao nasce separada do projeto oficial para evoluir a operacao no servidor sem mexer na base que ja esta em producao.

Principais diferencas:

- Dashboard fixo no console, redesenhado automaticamente.
- Estados por arquivo: fila, validacao, upload, thumbnail, webhook e conclusao.
- Contadores separados para video enviado, thumbnail enviada, Parla notificado, concluidos e erros.
- Logs tecnicos continuam em `log-producao.txt`.
- Scripts de build preparados para gerar executavel Windows unico.

## Console Operacional

O console agora mostra uma tela de acompanhamento:

```text
SENTINELA WASABI 2.0 v2.0.0
Fila: 3 aguardando | 2 processando | Detectados: 20 | Concluidos: 15 | Erros: 1
Video Wasabi: 16 | Thumbnails: 15 | Parla OK: 15 | Throughput medio: 31.20 MB/s

ATIVOS
arquivo.mp4                       upload video       [########............]  40% 200.0 MB/500.0 MB  18.5 MB/s   2s

ULTIMOS EVENTOS
14:30:12 OK    Video enviado: arquivo.mp4
14:30:18 OK    Thumbnail enviada: arquivo.mp4
14:30:19 OK    Parla notificado: arquivo.mp4
```

## Fluxo

1. Detecta videos novos em `videos/`.
2. Aguarda estabilidade do arquivo.
3. Extrai duracao com `ffprobe`.
4. Envia video para Wasabi.
5. Gera e envia thumbnail.
6. Notifica o Parla.app.
7. Move o arquivo para `videos/enviados/` ou `videos/erro/`.

## Configuracao

Copie o exemplo e preencha as credenciais locais:

```bash
copy config.example.js config.js
```

O arquivo `config.js` nao deve ser commitado.

## Desenvolvimento

```bash
npm install
npm start
```

## Build do Executavel

```bash
npm run build
```

Saida esperada:

```text
dist/sentinela-wasabi-2.0.exe
```

## Observacao Sobre Campos b2_ no Payload

Os campos `b2_file_id`, `b2_url` e o endpoint `b2_source` podem continuar existindo porque fazem parte do contrato atual do Parla.app. O storage usado por esta versao e Wasabi.