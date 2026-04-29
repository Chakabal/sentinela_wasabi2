// sentinela-wasabi.js – SentinelUploader (Wasabi edition) Versão 2.1.0
// Versão migrada para Wasabi com p-queue para resolver problemas de travamento
// REMOVIDA: Verificação de arquivos já processados - todos os arquivos são processados sempre
// CORREÇÃO: Qualquer arquivo pode ser reprocessado (regra estabelecida na v1.2.2)
// MIGRAÇÃO: B2 → Wasabi para melhor performance (74.6% mais rápido)
// VERSÃO 2.0.1: Payload Parla.app corrigido
// VERSÃO 2.0.2: Configuração automática de permissões públicas para arquivos e bucket
// VERSÃO 2.0.3: Migração para bucket videos.parla.app
// VERSÃO 2.0.4: Payload Parla.app simplificado (caminho relativo)
// VERSÃO 2.0.5: Payload Parla.app com https:// (sem endpoint Wasabi)
// VERSÃO 2.0.6: Funcionalidade de thumbnail automático (extração e upload)
// VERSÃO 2.1.0: Payload Parla.app corrigido (b2_file_id + imagem obrigatório)

const fs               = require('fs');
const path             = require('path');
const os               = require('os');
const chokidar         = require('chokidar');
const { S3Client }     = require('@aws-sdk/client-s3');
const { Upload }       = require('@aws-sdk/lib-storage');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const https            = require('https');
const ProgressBar      = require('cli-progress');
const axios            = require('axios');
const PQueue           = require('p-queue').default;

// Detecta pkg cedo para localizar config.js ao lado do executavel.
const isPkg     = typeof process.pkg !== 'undefined';
const ASSET_DIR = __dirname;

// ========================================
// CARREGAMENTO DE CONFIGURACOES
// ========================================
function getRuntimeDir() {
  return isPkg ? path.dirname(process.execPath) : process.cwd();
}

function waitBeforeExit(exitCode = 1) {
  if (process.stdin.isTTY) {
    console.log('');
    console.log('Pressione Enter para fechar...');
    process.stdin.resume();
    process.stdin.once('data', () => process.exit(exitCode));
    return;
  }
  process.exit(exitCode);
}

function writeConfigExampleIfMissing(runtimeDir) {
  const examplePath = path.join(runtimeDir, 'config.example.js');
  if (fs.existsSync(examplePath)) return;

  const exampleContent = `// config.example.js - Exemplo de configuracao do Sentinela Wasabi 2.0
module.exports = {
  WASABI: {
    ACCESS_KEY_ID: 'sua_access_key_id_aqui',
    SECRET_ACCESS_KEY: 'sua_secret_access_key_aqui',
    BUCKET_NAME: 'videos.parla.app',
    IMAGES_BUCKET_NAME: 'imagens.parla.app',
    REGION: 'us-east-1',
    ENDPOINT: 'https://s3.us-east-1.wasabisys.com'
  },
  PARLA: {
    TOKEN: 'seu_token_parla_aqui',
    WEBHOOK: 'https://parla.app/api/1.1/wf/b2_source',
    TRANSFERRING_WEBHOOK: 'https://parla.app/api/1.1/wf/istransfering'
  }
};
`;

  try {
    fs.writeFileSync(examplePath, exampleContent);
  } catch (e) {
    console.error('Nao foi possivel criar config.example.js:', e.message);
  }
}

function loadConfig() {
  const runtimeDir = getRuntimeDir();
  const configPath = path.join(runtimeDir, 'config.js');

  try {
    const loaded = require(configPath);
    console.log('Configuracoes carregadas:', configPath);
    return loaded;
  } catch (error) {
    writeConfigExampleIfMissing(runtimeDir);
    console.error('ERRO: arquivo config.js nao encontrado ou invalido.');
    console.error('');
    console.error('Crie este arquivo ao lado do executavel:');
    console.error(`  ${configPath}`);
    console.error('');
    console.error('Um modelo foi criado em:');
    console.error(`  ${path.join(runtimeDir, 'config.example.js')}`);
    console.error('');
    console.error('Preencha as credenciais Wasabi e Parla.app e abra o executavel novamente.');
    waitBeforeExit(1);
  }
}

let credentials = loadConfig();

// ========================================
// CONFIGURAÇÕES EMBUTIDAS - PRODUÇÃO
// ========================================
const VERSION = '2.0.0';

const CONFIG = {
  // CONFIGURAÇÕES WASABI - Carregadas do config.js
  WASABI: credentials.WASABI,

  // CONFIGURAÇÕES PARLA.APP - Carregadas do config.js
  PARLA: credentials.PARLA,

  // CONFIGURAÇÕES DE UPLOAD - OTIMIZADAS PARA 300 Mbps (37 MB/s)
  UPLOAD: {
    MAX_CONCURRENT: 5,           // 5 uploads simultâneos - otimizado para saturar 300 Mbps
    TIMEOUT: 15 * 60 * 1000,     // Timeout de 15 minutos (otimizado)
    STABILITY_THRESHOLD: 2000,   // 2000ms para aguardar arquivo estável
    POLL_INTERVAL: 100,          // 100ms entre verificações (mais responsivo)
    CHECK_INTERVAL: 100,         // 100ms entre verificações de disponibilidade (mais responsivo)
    RETRY_ATTEMPTS: 3,           // 3 tentativas de retry
    RETRY_DELAY: 5000,           // 5000ms entre tentativas (mais rápido)
    API_DELAY: 200,              // 200ms de delay entre chamadas de API (reduzido para menor latência)
    LARGE_FILE_THRESHOLD: 100 * 1024 * 1024, // 100MB - arquivos grandes
    LARGE_FILE_TIMEOUT: 30 * 60 * 1000,       // 30 minutos para arquivos grandes
    HEARTBEAT_INTERVAL: 30000,   // 30 segundos para verificação de heartbeat
    HEARTBEAT_TIMEOUT: 60000,    // 1 minuto sem progresso = possível travamento
    MAX_HEARTBEAT_WARNINGS: 3,   // Máximo 3 avisos antes de cancelar upload
    UPLOAD_CANCEL_TIMEOUT: 5 * 60 * 1000, // 5 minutos máximo para cancelar upload travado
    // Configurações dinâmicas de part size e queue size serão calculadas por arquivo
    MIN_PART_SIZE: 25 * 1024 * 1024,  // 25MB mínimo
    MAX_PART_SIZE: 100 * 1024 * 1024, // 100MB máximo
    INITIAL_QUEUE_SIZE: 4,            // 4 uploads paralelos de partes inicial
    MAX_QUEUE_SIZE: 6                 // 6 uploads paralelos de partes máximo
  },

  // CONFIGURAÇÕES DE MONITORAMENTO
  MONITORING: {
    STATUS_INTERVAL: 60000,      // ms para logs de status (1 minuto)
    LOG_LEVELS: ['INFO', 'ERROR', 'WARN', 'FATAL', 'STATUS'],
    ENABLE_DETAILED_LOGS: false, // Logs reduzidos para console limpo
    SAVE_UPLOAD_STATS: true      // Salvar estatísticas de upload
  },

  // CONFIGURAÇÕES DE PASTAS
  PATHS: {
    VIDEO_DIR: 'videos',
    ENVIADOS_DIR: 'videos/enviados',
    ERROR_DIR: 'videos/erro',
    LOG_FILE: 'log-producao.txt',
    // REMOVIDO: upload-stats.json - arquivo desnecessário
  },

  // CONFIGURAÇÕES DA BARRA DE PROGRESSO
  PROGRESS_BAR: {
    FORMAT: '{fileName} [{bar}] {percentage}%',
    BAR_COMPLETE_CHAR: '█',
    BAR_INCOMPLETE_CHAR: '░',
    HIDE_CURSOR: true,
    CLEAR_ON_COMPLETE: true,
    SHOW_SPEED: false,
    SHOW_ETA: false
  },

  // CONFIGURAÇÕES DE SEGURANÇA
  SECURITY: {
    VALIDATE_FILE_TYPES: true,   // Validar tipos de arquivo
    MAX_FILE_SIZE: 1024 * 1024 * 1024 * 10, // 10GB máximo
    ALLOWED_EXTENSIONS: ['.mp4', '.avi', '.mov', '.mkv'],
    CHECK_FILE_INTEGRITY: true   // Verificar integridade do arquivo
  }
};

// Agent HTTP com Keep-Alive para otimizar conexões TCP/TLS
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: CONFIG.UPLOAD.MAX_CONCURRENT * 2,  // 10 sockets para 5 uploads simultâneos
  keepAliveMsecs: 30000,  // 30 segundos keep-alive
  timeout: 60000          // 1 minuto timeout
});

// Configuração do cliente S3 para Wasabi - OTIMIZADA PARA 300 Mbps (37 MB/s)
const s3Client = new S3Client({
  endpoint: CONFIG.WASABI.ENDPOINT,
  region: CONFIG.WASABI.REGION,
  credentials: {
    accessKeyId: CONFIG.WASABI.ACCESS_KEY_ID,
    secretAccessKey: CONFIG.WASABI.SECRET_ACCESS_KEY
  },
  forcePathStyle: true,   // Força path-style para compatibilidade com Wasabi
  maxAttempts: 3,         // Máximo 3 tentativas
  requestHandler: new NodeHttpHandler({ 
    httpsAgent,
    requestTimeout: 300000,    // 5 minutos timeout
    connectionTimeout: 60000   // 1 minuto connect timeout
  })
});

// Pastas
const VIDEO_DIR    = path.resolve(process.cwd(), CONFIG.PATHS.VIDEO_DIR);
const ENVIADOS_DIR = path.join(VIDEO_DIR, CONFIG.PATHS.ENVIADOS_DIR.split('/').pop());
const ERROR_DIR    = path.join(VIDEO_DIR, CONFIG.PATHS.ERROR_DIR.split('/').pop());

// Log
const LOG_PATH = path.join(process.cwd(), CONFIG.PATHS.LOG_FILE);

// Fila de processamento com p-queue (substitui toda a lógica manual)
const processingQueue = new PQueue({ 
  concurrency: CONFIG.UPLOAD.MAX_CONCURRENT,
  autoStart: true,
  timeout: CONFIG.UPLOAD.TIMEOUT,
  throwOnTimeout: false // Permite tratamento manual de timeouts
});

// Sistema de auto-tuning para otimizar throughput
class ThroughputOptimizer {
  constructor() {
    this.uploadStats = []; // Histórico de velocidades de upload
    this.maxStats = 10;    // Manter últimos 10 uploads
    this.targetSpeed = 37; // 37 MB/s = 300 Mbps
    this.minSpeedThreshold = 0.8; // 80% da velocidade alvo
  }

  // Adiciona estatística de upload
  addUploadStat(fileSize, duration) {
    const speed = (fileSize / 1024 / 1024) / duration; // MB/s
    this.uploadStats.push({ speed, fileSize, duration, timestamp: Date.now() });
    
    // Mantém apenas os últimos uploads
    if (this.uploadStats.length > this.maxStats) {
      this.uploadStats.shift();
    }
    
    log('INFO', `Throughput: ${speed.toFixed(2)} MB/s (meta: ${this.targetSpeed} MB/s)`);
  }

  // Calcula velocidade média recente
  getAverageSpeed() {
    if (this.uploadStats.length === 0) return 0;
    
    const recentStats = this.uploadStats.slice(-5); // Últimos 5 uploads
    const totalSpeed = recentStats.reduce((sum, stat) => sum + stat.speed, 0);
    return totalSpeed / recentStats.length;
  }

  // Sugere ajustes baseado no throughput atual
  getOptimizationSuggestions() {
    const avgSpeed = this.getAverageSpeed();
    const speedRatio = avgSpeed / this.targetSpeed;
    
    if (speedRatio < this.minSpeedThreshold) {
      return {
        increaseQueueSize: true,
        increasePartSize: avgSpeed < this.targetSpeed * 0.5, // Se muito baixo, aumenta part size
        message: `Throughput baixo (${avgSpeed.toFixed(2)} MB/s), otimizando...`
      };
    }
    
    return {
      increaseQueueSize: false,
      increasePartSize: false,
      message: `Throughput adequado (${avgSpeed.toFixed(2)} MB/s)`
    };
  }
}

// Dashboard profissional de console sem dependencias externas
class ConsoleDashboard {
  constructor() {
    this.jobs = new Map();
    this.events = [];
    this.counters = {
      detected: 0,
      videoUploaded: 0,
      thumbnails: 0,
      parla: 0,
      completed: 0,
      errors: 0
    };
    this.startedAt = Date.now();
    this.timer = null;
    this.getQueueStats = () => ({ waiting: 0, pending: 0 });
    this.getAvgSpeed = () => 0;
  }

  start(getQueueStats, getAvgSpeed) {
    this.getQueueStats = getQueueStats;
    this.getAvgSpeed = getAvgSpeed;
    if (this.timer) return;
    this.timer = setInterval(() => this.render(), 1000);
    this.render();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  increment(counter, amount = 1) {
    if (!Object.prototype.hasOwnProperty.call(this.counters, counter)) return;
    this.counters[counter] += amount;
    this.renderSoon();
  }

  addEvent(level, message) {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    this.events.unshift({ time, level, message });
    this.events = this.events.slice(0, 8);
    this.renderSoon();
  }

  setJob(fileName, patch = {}) {
    const current = this.jobs.get(fileName) || {
      fileName,
      stage: 'fila',
      progress: 0,
      loaded: 0,
      total: patch.total || 0,
      speedMBps: 0,
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
    this.jobs.set(fileName, { ...current, ...patch, updatedAt: Date.now() });
    this.renderSoon();
  }

  finishJob(fileName) {
    this.jobs.delete(fileName);
    this.increment('completed');
    this.addEvent('OK', `Concluido: ${fileName}`);
  }

  failJob(fileName, reason) {
    this.jobs.delete(fileName);
    this.increment('errors');
    this.addEvent('ERRO', `${fileName}: ${reason}`);
  }

  renderSoon() {
    if (this.renderQueued) return;
    this.renderQueued = true;
    setTimeout(() => {
      this.renderQueued = false;
      this.render();
    }, 100);
  }

  formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
    if (m > 0) return `${m}m${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  }

  formatBytes(bytes) {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  truncate(value, width) {
    const text = String(value || '');
    if (text.length <= width) return text.padEnd(width, ' ');
    if (width <= 3) return text.slice(0, width);
    return `${text.slice(0, width - 3)}...`;
  }

  bar(percent, width = 24) {
    const safe = Math.max(0, Math.min(100, Number(percent) || 0));
    const filled = Math.round((safe / 100) * width);
    return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}]`;
  }

  render() {
    const columns = Math.max(process.stdout.columns || 110, 90);
    const now = new Date();
    const queue = this.getQueueStats();
    const uptime = this.formatDuration(Date.now() - this.startedAt);
    const avgSpeed = this.getAvgSpeed();
    const activeJobs = Array.from(this.jobs.values())
      .sort((a, b) => a.startedAt - b.startedAt)
      .slice(0, 8);

    const lines = [];
    lines.push('='.repeat(Math.min(columns, 120)));
    lines.push(`${this.truncate(`SENTINELA WASABI 2.0 v${VERSION}`, 42)} ${this.truncate(now.toLocaleString('pt-BR'), 24)} Uptime: ${uptime}`);
    lines.push('-'.repeat(Math.min(columns, 120)));
    lines.push(`Fila: ${queue.waiting} aguardando | ${queue.pending} processando | Detectados: ${this.counters.detected} | Concluidos: ${this.counters.completed} | Erros: ${this.counters.errors}`);
    lines.push(`Video Wasabi: ${this.counters.videoUploaded} | Thumbnails: ${this.counters.thumbnails} | Parla OK: ${this.counters.parla} | Throughput medio: ${avgSpeed.toFixed(2)} MB/s`);
    lines.push('-'.repeat(Math.min(columns, 120)));
    lines.push('ATIVOS');

    if (activeJobs.length === 0) {
      lines.push('  Nenhum arquivo em processamento no momento.');
    } else {
      for (const job of activeJobs) {
        const percent = Math.max(0, Math.min(100, Math.round(job.progress || 0)));
        const loaded = this.formatBytes(job.loaded || 0);
        const total = this.formatBytes(job.total || 0);
        const stale = Math.floor((Date.now() - job.updatedAt) / 1000);
        lines.push(`${this.truncate(job.fileName, 34)} ${this.truncate(job.stage, 18)} ${this.bar(percent)} ${String(percent).padStart(3, ' ')}% ${this.truncate(`${loaded}/${total}`, 19)} ${String((job.speedMBps || 0).toFixed(1)).padStart(6, ' ')} MB/s ${String(stale).padStart(3, ' ')}s`);
      }
    }

    lines.push('-'.repeat(Math.min(columns, 120)));
    lines.push('ULTIMOS EVENTOS');
    if (this.events.length === 0) {
      lines.push('  Aguardando eventos...');
    } else {
      for (const event of this.events) {
        lines.push(`${event.time} ${this.truncate(event.level, 5)} ${this.truncate(event.message, Math.min(columns - 16, 100))}`);
      }
    }

    lines.push('='.repeat(Math.min(columns, 120)));
    process.stdout.write('\x1b[2J\x1b[0f' + lines.join('\n'));
  }
}

// Gerenciador de progresso conectado ao dashboard
class ProgressManager {
  constructor() {
    this.bars = new Map();
    this.completedBars = new Map();
  }

  addBar(fileName, fileSize) {
    this.bars.set(fileName, {
      startTime: Date.now(),
      fileSize,
      lastLoaded: 0,
      lastUpdate: Date.now()
    });
    dashboard.setJob(fileName, {
      stage: 'upload video',
      progress: 0,
      loaded: 0,
      total: fileSize,
      speedMBps: 0
    });
    dashboard.addEvent('INFO', `Upload iniciado: ${fileName}`);
    return null;
  }

  updateBar(fileName, progress, fileSize) {
    const barInfo = this.bars.get(fileName);
    if (!barInfo) return;

    const now = Date.now();
    const deltaBytes = progress - barInfo.lastLoaded;
    const deltaSeconds = Math.max((now - barInfo.lastUpdate) / 1000, 0.001);
    const speedMBps = deltaBytes > 0 ? (deltaBytes / 1024 / 1024) / deltaSeconds : 0;
    const percent = fileSize > 0 ? (progress / fileSize) * 100 : 0;

    barInfo.lastLoaded = progress;
    barInfo.lastUpdate = now;

    dashboard.setJob(fileName, {
      stage: 'upload video',
      progress: percent,
      loaded: progress,
      total: fileSize,
      speedMBps
    });
  }

  completeBar(fileName, fileSize, uploadTime) {
    const barInfo = this.bars.get(fileName);
    if (!barInfo) return;

    const duration = Math.max(1, Math.round((Date.now() - barInfo.startTime) / 1000));
    const speed = (fileSize / 1024 / 1024 / duration).toFixed(2);
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    log('INFO', `Upload concluido: ${fileName} | ${fileSizeMB}MB | ${duration}s | ${speed}MB/s`);
    this.bars.delete(fileName);
    this.completedBars.set(fileName, {
      stats: `${fileName} | ${fileSizeMB}MB | ${duration}s | ${speed}MB/s`,
      timestamp: Date.now()
    });

    dashboard.increment('videoUploaded');
    dashboard.setJob(fileName, {
      stage: 'video enviado',
      progress: 100,
      loaded: fileSize,
      total: fileSize,
      speedMBps: Number(speed)
    });
    dashboard.addEvent('OK', `Video enviado: ${fileName}`);
  }

  removeBar(fileName) {
    this.bars.delete(fileName);
  }

  cleanupOldBars() {
    const now = Date.now();
    for (const [fileName, info] of this.completedBars.entries()) {
      if (now - info.timestamp > 5 * 60 * 1000) {
        this.completedBars.delete(fileName);
      }
    }
  }
}
// Instâncias globais
const throughputOptimizer = new ThroughputOptimizer();
const dashboard = new ConsoleDashboard();
const progressManager = new ProgressManager();

// Função para atualizar interface do console com informações de throughput
function updateConsoleStatus() {
  const avgSpeed = throughputOptimizer.getAverageSpeed();
  const status = `📊 Status: ${processingQueue.size} na fila | ${processingQueue.pending} processando | ${totalSucessos} sucessos | ${totalErros} erros | ${avgSpeed.toFixed(1)} MB/s`;
  process.title = `Sentinela Wasabi 2.0 v${VERSION} - ${status}`;
}

function getTimestamp(){ 
  return new Date().toISOString(); 
}

function log(level, ...msgs){
  const line = `[${getTimestamp()}] [${level}] ${msgs.join(' ')}\n`;
  try {
    fs.appendFileSync(LOG_PATH, line);
    // Não mostra no console - apenas no arquivo de log
  } catch (e) {
    console.error('Erro ao escrever log:', e.message);
  }
}

function fatal(msg, err){
  const errorMsg = `[${getTimestamp()}] [FATAL] ${msg} ${err ? err.message : ''}`;
  console.error(errorMsg);
  log('FATAL', msg, err ? err.message : '');
  if (err && err.stack) {
    console.error(`[${getTimestamp()}] [FATAL] Stack:`, err.stack);
    log('FATAL', 'Stack:', err.stack);
  }
  process.exit(1);
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

// Formata duração em segundos para formato legível (1h45m30s, 1m45s)
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h`;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m`;
  }
  
  if (secs > 0 || (hours === 0 && minutes === 0)) {
    result += `${secs}s`;
  }
  
  return result;
}

// Função para verificar se um arquivo está público no Wasabi
async function verifyFilePublicAccess(fileName) {
  try {
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');
    
    const command = new HeadObjectCommand({
      Bucket: CONFIG.WASABI.BUCKET_NAME,
      Key: fileName
    });
    
    const response = await s3Client.send(command);
    
    // Verifica se o arquivo tem ACL pública
    const isPublic = response.ACL === 'public-read' || 
                    (response.Metadata && response.Metadata['x-amz-acl'] === 'public-read');
    
    if (isPublic) {
      log('INFO', `Arquivo ${fileName} está público`);
    } else {
      log('WARN', `Arquivo ${fileName} pode não estar público. Verifique as configurações do bucket.`);
    }
    
    return isPublic;
  } catch (e) {
    log('WARN', `Não foi possível verificar acesso público do arquivo ${fileName}:`, e.message);
    return false;
  }
}

// Função para limpar arquivos temporários do ffmpeg
function cleanupFfmpegTemp() {
  try {
    const tempDir = path.join(os.tmpdir(), 'sentinela-ffmpeg');
    if (fs.existsSync(tempDir)) {
      // Remove apenas arquivos temporários, mantém os binários
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        if (file.endsWith('.tmp') || file.endsWith('.log')) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      });
    }
  } catch (e) {
    // Ignora erros de limpeza
  }
}

// Função para extrair binários do ffmpeg quando compilado
function extractFfmpegBinaries() {
  if (!isPkg) return null; // Não precisa extrair se não estiver compilado
  
  try {
    const tempDir = path.join(os.tmpdir(), 'sentinela-ffmpeg');
    
    // Cria pasta temporária se não existir
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Limpa arquivos temporários antes de extrair
    cleanupFfmpegTemp();
    
    // Lista de arquivos do ffmpeg que precisam ser extraídos
    const ffmpegFiles = ['ffmpeg.exe', 'ffprobe.exe', 'ffplay.exe'];
    
    for (const fileName of ffmpegFiles) {
      const sourcePath = path.join(ASSET_DIR, 'ffmpeg', fileName);
      const destPath = path.join(tempDir, fileName);
      
      // Só extrai se o arquivo de destino não existir
      if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        log('INFO', `Binário extraído: ${fileName}`);
      }
    }
    
    return tempDir;
  } catch (e) {
    log('ERROR', 'Erro ao extrair binários ffmpeg:', e.message);
    return null;
  }
}

// Captura a duração real do vídeo usando ffprobe local
async function getVideoDurationSeconds(filePath) {
  try {
    const { exec } = require('child_process');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      log('ERROR', 'Arquivo não encontrado:', filePath);
      throw new Error('Arquivo não encontrado');
    }

    // Caminho para o ffprobe local - detecta se está compilado
    let ffprobePath;
    if (isPkg) {
      // Se estiver compilado, extrai os binários para pasta temporária
      const tempDir = extractFfmpegBinaries();
      if (tempDir) {
        ffprobePath = path.join(tempDir, 'ffprobe.exe');
        log('INFO', 'ffprobe extraído para:', ffprobePath);
      } else {
        // Fallback: tenta usar ffprobe do PATH do sistema
        ffprobePath = 'ffprobe.exe';
        log('INFO', 'Usando ffprobe do PATH do sistema');
      }
    } else {
      // Se estiver em desenvolvimento, usa __dirname
      ffprobePath = path.join(__dirname, 'ffmpeg', 'ffprobe.exe');
      
      // Verificar se o ffprobe existe
      if (!fs.existsSync(ffprobePath)) {
        log('ERROR', 'ffprobe não encontrado em:', ffprobePath);
        throw new Error('ffprobe não encontrado');
      }
    }

    // Comando para obter a duração
    const ffprobeCommand = `"${ffprobePath}" -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`;

    const duration = await new Promise((resolve, reject) => {
      exec(ffprobeCommand, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Erro ao executar ffprobe: ${error.message}`));
          return;
        }

        const duration = parseFloat(stdout.trim());
        
        if (isNaN(duration) || duration <= 0) {
          reject(new Error('Duração inválida retornada pelo ffprobe'));
          return;
        }

        resolve(duration);
      });
    });
    
    const durationSeconds = Math.floor(duration);
    log('INFO', 'Duração capturada pelo ffprobe:', durationSeconds, 'segundos');
    return durationSeconds;
    
  } catch (e) {
    log('ERROR', 'Erro ao capturar duração do vídeo:', e.message);
    throw e; // Re-lança o erro para que o processamento pare
  }
}

// Extrai thumbnail do vídeo usando ffmpeg local
async function extractVideoThumbnail(filePath, fileName) {
  try {
    const { exec } = require('child_process');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error('Arquivo de vídeo não encontrado');
    }

    // Cria pasta temporária com nome do arquivo
    const tempDir = path.join('./temp', fileName.replace(/\.[^/.]+$/, ''));
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Nome do arquivo de saída (mesmo nome + .jpg)
    const thumbnailName = fileName.replace(/\.[^/.]+$/, '.jpg');
    const thumbnailPath = path.join(tempDir, thumbnailName);

    // Obtém duração para calcular 10% do vídeo
    dashboard.setJob(fileName, { stage: 'lendo duracao', progress: 0 });
    const duration = await getVideoDurationSeconds(filePath);
    const thumbnailTime = Math.floor(duration * 0.1); // 10% do vídeo
    const timeString = formatTimeForFfmpeg(thumbnailTime);

    // Caminho para o ffmpeg local - detecta se está compilado
    let ffmpegPath;
    if (isPkg) {
      // Se estiver compilado, extrai os binários para pasta temporária
      const tempDir = extractFfmpegBinaries();
      if (tempDir) {
        ffmpegPath = path.join(tempDir, 'ffmpeg.exe');
        log('INFO', 'ffmpeg extraído para:', ffmpegPath);
      } else {
        // Fallback: tenta usar ffmpeg do PATH do sistema
        ffmpegPath = 'ffmpeg.exe';
        log('INFO', 'Usando ffmpeg do PATH do sistema');
      }
    } else {
      // Se estiver em desenvolvimento, usa __dirname
      ffmpegPath = path.join(__dirname, 'ffmpeg', 'ffmpeg.exe');
      
      // Verificar se o ffmpeg existe
      if (!fs.existsSync(ffmpegPath)) {
        throw new Error('ffmpeg não encontrado');
      }
    }

    // Comando para extrair thumbnail
    const ffmpegCommand = `"${ffmpegPath}" -i "${filePath}" -ss ${timeString} -vframes 1 -vf scale=400:-1 -q:v 2 "${thumbnailPath}"`;

    await new Promise((resolve, reject) => {
      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Erro ao executar ffmpeg: ${error.message}`));
          return;
        }
        resolve();
      });
    });

    // Verifica se o thumbnail foi criado
    if (!fs.existsSync(thumbnailPath)) {
      throw new Error('Thumbnail não foi gerado');
    }

    log('INFO', 'Thumbnail extraído:', thumbnailPath);
    return { thumbnailPath, tempDir };
    
  } catch (e) {
    log('ERROR', 'Erro ao extrair thumbnail do vídeo:', e.message);
    throw e;
  }
}

// Converte segundos para formato HH:MM:SS do ffmpeg
function formatTimeForFfmpeg(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Upload thumbnail para Wasabi (bucket de imagens)
async function uploadThumbnailToWasabi(wasabi, thumbnailPath, fileName, clientName) {
  try {
    const fileSize = fs.statSync(thumbnailPath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    
    log('INFO', 'Iniciando upload do thumbnail:', fileName, `(${fileSizeKB}KB)`);

    // Cria nome do arquivo no Wasabi com pasta do cliente
    const wasabiFileName = `${clientName}/${fileName.replace(/\.[^/.]+$/, '.jpg')}`;

    const { Upload } = require('@aws-sdk/lib-storage');
    
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: CONFIG.WASABI.IMAGES_BUCKET_NAME,
        Key: wasabiFileName,
        Body: fs.createReadStream(thumbnailPath),
        ContentType: 'image/jpeg',
        ACL: 'public-read' // Torna o arquivo público
      },
      queueSize: 1, // Para arquivos pequenos, usa 1 parte
      partSize: 5 * 1024 * 1024, // 5MB por parte
      leavePartsOnError: false
    });

    // Monitora progresso
    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        log('INFO', `Thumbnail upload progress: ${percent}%`);
      }
    });

    const result = await upload.done();
    
    log('INFO', 'Thumbnail enviado para Wasabi:', wasabiFileName);
    
    // Verifica se o arquivo está público
    await verifyThumbnailPublicAccess(wasabiFileName);
    
    return {
      fileId: result.ETag,
      url: `https://${CONFIG.WASABI.IMAGES_BUCKET_NAME}/${wasabiFileName}`
    };
    
  } catch (e) {
    log('ERROR', 'Erro ao fazer upload do thumbnail:', e.message);
    throw e;
  }
}

// Verifica se thumbnail está acessível publicamente
async function verifyThumbnailPublicAccess(fileName) {
  try {
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');
    const command = new HeadObjectCommand({ 
      Bucket: CONFIG.WASABI.IMAGES_BUCKET_NAME, 
      Key: fileName 
    });
    const response = await s3Client.send(command);
    
    const isPublic = response.ACL === 'public-read' || 
                    (response.Metadata && response.Metadata['x-amz-acl'] === 'public-read');
    
    if (isPublic) {
      log('INFO', 'Thumbnail verificado como público:', fileName);
    } else {
      log('WARN', 'Thumbnail pode não estar público:', fileName);
    }
    
    return isPublic;
  } catch (e) {
    log('WARN', 'Não foi possível verificar acesso público do thumbnail:', e.message);
    return false;
  }
}

// Salva erro de thumbnail em arquivo de texto
function saveThumbnailError(fileName, error) {
  try {
    const errorFileName = `${fileName.replace(/\.[^/.]+$/, '')}_thumb_error.txt`;
    const errorPath = path.join(ERROR_DIR, errorFileName);
    
    const errorContent = `ERRO NO THUMBNAIL
Arquivo: ${fileName}
Data/Hora: ${new Date().toISOString()}
Erro: ${error.message}
Stack: ${error.stack || 'N/A'}
`;
    
    fs.writeFileSync(errorPath, errorContent);
    log('INFO', 'Erro de thumbnail salvo em:', errorPath);
    
  } catch (e) {
    log('ERROR', 'Erro ao salvar arquivo de erro do thumbnail:', e.message);
  }
}

// Limpa pasta temporária do thumbnail
function cleanupThumbnailTemp(tempDir) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      log('INFO', 'Pasta temporária removida:', tempDir);
    }
  } catch (e) {
    log('WARN', 'Erro ao remover pasta temporária:', e.message);
  }
}

// Extrai nome do cliente do arquivo
function extractClientName(fileName) {
  try {
    // Remove extensão
    const nameWithoutExt = fileName.replace(/\.(mp4|avi|mov|mkv)$/i, '');
    
    // Procura por padrão: DATA--NOME-CLIENTE-NUMERO
    const match = nameWithoutExt.match(/^\d{8}--([^-]+(?:-[^-]+)*?)(?:-\d+)?$/);
    
    if (match) {
      return match[1];
    }
    
    // Se não encontrou o padrão com "--", procura por padrão: DATA-CODIGO-NOME-CLIENTE-NUMERO
    const matchWithCode = nameWithoutExt.match(/^\d{8}-[^-]+-([^-]+(?:-[^-]+)*?)(?:-\d+)?$/);
    
    if (matchWithCode) {
      return matchWithCode[1];
    }
    
    // Se não encontrou nenhum padrão, retorna o nome sem a data
    const withoutDate = nameWithoutExt.replace(/^\d{8}-?/, '');
    return withoutDate || 'CLIENTE_DESCONHECIDO';
    
  } catch (e) {
    log('WARN', 'Erro ao extrair nome do cliente de:', fileName, e.message);
    return 'CLIENTE_DESCONHECIDO';
  }
}

// Verifica se arquivo está disponível para processamento (melhorado)
function checaDisponibilidade(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const now = Date.now();
    const fileAge = now - stats.mtime.getTime();
    
    // Verifica se arquivo não está sendo modificado há pelo menos 5 segundos
    return fileAge > CONFIG.UPLOAD.STABILITY_THRESHOLD;
  } catch (e) {
    return false;
  }
}

// ========================================
// API Wasabi via AWS SDK v3 (S3 compatible)
// ========================================

class WasabiAPI {
  constructor(s3Client) {
    this.s3Client = s3Client;
  }

  async authorize() {
    try {
      // Testa a conexão fazendo uma operação simples
      await this.s3Client.config.credentials();
      log('INFO', 'Wasabi autorizado com sucesso via AWS SDK v3');
      return { success: true };
    } catch (e) {
      throw new Error(`Erro na autorização Wasabi: ${e.message}`);
    }
  }

  async getUploadUrl(bucketId) {
    // Para AWS SDK, não precisamos de URL de upload específica
    // O SDK gerencia isso internamente
    return { data: { uploadUrl: 'managed-by-aws-sdk', authorizationToken: 'managed-by-aws-sdk' } };
  }

  // Verifica se o bucket está configurado corretamente para arquivos públicos
  async checkBucketConfiguration() {
    try {
      const { GetBucketAclCommand } = require('@aws-sdk/client-s3');
      
      const command = new GetBucketAclCommand({
        Bucket: CONFIG.WASABI.BUCKET_NAME
      });
      
      const response = await this.s3Client.send(command);
      
      // Verifica se o bucket tem permissões públicas
      const hasPublicRead = response.Grants.some(grant => 
        grant.Grantee.URI === 'http://acs.amazonaws.com/groups/global/AllUsers' &&
        grant.Permission === 'READ'
      );
      
      if (hasPublicRead) {
        log('INFO', 'Bucket configurado corretamente para acesso público');
      } else {
        log('WARN', 'Bucket não está configurado para acesso público. Arquivos podem não estar acessíveis.');
        log('INFO', 'Configure o bucket como público no painel do Wasabi ou use ACL: public-read nos uploads');
      }
      
      return hasPublicRead;
    } catch (e) {
      log('WARN', 'Não foi possível verificar configuração do bucket:', e.message);
      return false;
    }
  }

  // Configura o bucket para permitir ACLs públicas (se necessário)
  async configureBucketForPublicAccess() {
    try {
      const { PutBucketAclCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
      
      // Primeiro, configura ACL pública
      const aclCommand = new PutBucketAclCommand({
        Bucket: CONFIG.WASABI.BUCKET_NAME,
        ACL: 'public-read'
      });
      
      await this.s3Client.send(aclCommand);
      log('INFO', 'Bucket configurado para acesso público via ACL');
      
      // Depois, configura política de bucket para garantir acesso público aos objetos
      const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${CONFIG.WASABI.BUCKET_NAME}/*`
          }
        ]
      };
      
      const policyCommand = new PutBucketPolicyCommand({
        Bucket: CONFIG.WASABI.BUCKET_NAME,
        Policy: JSON.stringify(bucketPolicy)
      });
      
      await this.s3Client.send(policyCommand);
      log('INFO', 'Política de bucket configurada para acesso público aos objetos');
      
      return true;
    } catch (e) {
      log('WARN', 'Não foi possível configurar bucket para acesso público:', e.message);
      return false;
    }
  }
}

// ========================================
// FUNÇÕES DE PROCESSAMENTO REFATORADAS
// ========================================

async function authorizeWasabiWithRetry(maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const wasabi = new WasabiAPI(s3Client);
      await wasabi.authorize();
      
      // Verifica configuração do bucket
      const isPublic = await wasabi.checkBucketConfiguration();
      
      // Se o bucket não está público, tenta configurar
      if (!isPublic) {
        log('INFO', 'Tentando configurar bucket para acesso público...');
        await wasabi.configureBucketForPublicAccess();
      }
      
      return wasabi;
    } catch (e) {
      log('WARN', `Tentativa ${i + 1}/${maxRetries} de autorização Wasabi falhou:`, e.message);
      if (i === maxRetries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Contadores para estatísticas
let totalSucessos = 0;
let totalErros = 0;

// REMOVIDO: Função loadInitialStats - não mais necessária
// Estatísticas são mantidas apenas no log (dist/log-producao.txt)

// Função para adicionar arquivo à fila de processamento
function addToProcessingQueue(wasabi, filePath) {
  const fileName = path.basename(filePath);
  
  // Verifica se arquivo existe fisicamente
  if (!fs.existsSync(filePath)) {
    log('INFO', 'Arquivo não existe mais, ignorando:', fileName);
    return;
  }
  
  // REMOVIDA: Verificação de arquivos já processados - TODOS os arquivos são processados sempre
  // REGRA: QUALQUER ARQUIVO PODE SER REPROCESSADO
  
  log('INFO', 'Adicionando arquivo à fila de processamento:', fileName);
  
  // Adiciona à fila p-queue com retry automático
  processingQueue.add(
    () => processFileWithRetry(wasabi, filePath),
    { 
      priority: 1,
      timeout: CONFIG.UPLOAD.TIMEOUT,
      throwOnTimeout: false // Garante que não quebre o processamento
    }
  ).catch(e => {
    // Tratamento específico para diferentes tipos de erro
    if (e.name === 'TimeoutError') {
      log('ERROR', 'Timeout no processamento do arquivo:', fileName, `(${Math.round(CONFIG.UPLOAD.TIMEOUT / 1000 / 60)}min)`);
    } else {
      log('ERROR', 'Erro no processamento do arquivo:', fileName, e.message);
    }
    if (dashboard.jobs.has(fileName)) {
      dashboard.failJob(fileName, e.message);
    }
    updateConsoleStatus();
  });
  
  // Atualiza interface
  updateConsoleStatus();
}

// Função para processar arquivo com retry
async function processFileWithRetry(wasabi, filePath, retryCount = 0) {
  // Verifica se arquivo ainda existe antes de tentar processar
  if (!fs.existsSync(filePath)) {
    log('WARN', `Arquivo não encontrado, pulando processamento:`, path.basename(filePath));
    return;
  }
  
  try {
    await processFile(wasabi, filePath);
  } catch (e) {
    if (retryCount < CONFIG.UPLOAD.RETRY_ATTEMPTS) {
      log('WARN', `Tentativa ${retryCount + 1}/${CONFIG.UPLOAD.RETRY_ATTEMPTS} falhou:`, path.basename(filePath), e.message);
      await new Promise(resolve => setTimeout(resolve, CONFIG.UPLOAD.RETRY_DELAY));
      return processFileWithRetry(wasabi, filePath, retryCount + 1);
    } else {
      log('ERROR', `Todas as tentativas falharam para:`, path.basename(filePath), e.message);
      throw e;
    }
  }
}

async function processFile(wasabi, filePath){
  const fileName = path.basename(filePath);
  
  try {
    log('INFO', 'Iniciando processamento:', fileName);
    dashboard.setJob(fileName, { stage: 'validando arquivo', progress: 0 });

    // Verifica se arquivo está disponível (aguarda se necessário com timeout)
    const startWait = Date.now();
    const maxWaitTime = 10000; // 10 segundos máximo
    
    while (!checaDisponibilidade(filePath) && (Date.now() - startWait) < maxWaitTime) {
      log('INFO', 'Aguardando arquivo ficar disponível:', fileName);
      await new Promise(resolve => setTimeout(resolve, CONFIG.UPLOAD.CHECK_INTERVAL));
    }
    
    // Se ainda não está disponível após timeout, loga aviso mas continua
    if (!checaDisponibilidade(filePath)) {
      log('WARN', 'Timeout aguardando arquivo ficar disponível, continuando mesmo assim:', fileName);
    }

    // Verifica se arquivo ainda existe antes de continuar
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${fileName}`);
    }

    // Validação de segurança
    if (CONFIG.SECURITY.VALIDATE_FILE_TYPES) {
      const ext = path.extname(fileName).toLowerCase();
      if (!CONFIG.SECURITY.ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`Tipo de arquivo não permitido: ${ext}`);
      }
    }

    // Validação de nome de arquivo
    if (fileName.length > 100) {
      throw new Error(`Nome de arquivo muito longo: ${fileName.length} caracteres (máximo 100)`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size > CONFIG.SECURITY.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)}GB`);
    }

    // Obtém informações básicas do arquivo
    dashboard.setJob(fileName, { stage: 'lendo duracao', progress: 0 });
    const duration = await getVideoDurationSeconds(filePath);
    const mediaInfo = {
      duration: duration,
      size: (stats.size / 1024 / 1024).toFixed(2)
    };
    log('INFO', `Informações do arquivo: ${mediaInfo.size}MB, duração: ${formatDuration(mediaInfo.duration)}`);

    // Extrai nome do cliente
    const clientName = extractClientName(fileName);
    log('INFO', 'Cliente identificado:', clientName);

    // Notifica início de transferência (YES)
    dashboard.setJob(fileName, { stage: 'avisando inicio', progress: 0 });
    await notifyParlaTransferring(fileName, clientName, 'yes');
    
    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, CONFIG.UPLOAD.API_DELAY));

          // Upload para Wasabi com organização por cliente
      log('INFO', 'Chamando uploadToWasabiViaS3 para:', fileName);
    dashboard.setJob(fileName, { stage: 'upload video', progress: 0 });
    const uploadResult = await uploadToWasabiViaS3(wasabi, filePath, fileName, clientName);
    log('INFO', 'Upload concluído:', fileName);

    // Processamento do thumbnail
    let thumbnailUrl = null;
    let tempDir = null;
    
    try {
      // Extrai thumbnail do vídeo
      log('INFO', 'Iniciando extração do thumbnail:', fileName);
      dashboard.setJob(fileName, { stage: 'gerando thumbnail' });
      const thumbnailResult = await extractVideoThumbnail(filePath, fileName);
      tempDir = thumbnailResult.tempDir;
      
      // Upload do thumbnail para Wasabi
      log('INFO', 'Iniciando upload do thumbnail para Wasabi:', fileName);
      dashboard.setJob(fileName, { stage: 'upload thumbnail' });
      const thumbnailUploadResult = await uploadThumbnailToWasabi(wasabi, thumbnailResult.thumbnailPath, fileName, clientName);
      thumbnailUrl = thumbnailUploadResult.url;
      
      log('INFO', 'Thumbnail processado com sucesso:', fileName);
      dashboard.increment('thumbnails');
      dashboard.addEvent('OK', 'Thumbnail enviada: ' + fileName);
      
    } catch (thumbnailError) {
      // Se falhar o thumbnail, salva erro mas continua o processo
      log('WARN', 'Erro no processamento do thumbnail:', fileName, thumbnailError.message);
      saveThumbnailError(fileName, thumbnailError);
      thumbnailUrl = null;
    } finally {
      // Sempre limpa a pasta temporária
      if (tempDir) {
        cleanupThumbnailTemp(tempDir);
      }
    }

    // Adiciona URL do thumbnail ao mediaInfo
    if (thumbnailUrl) {
      mediaInfo.imagem = thumbnailUrl;
    }

    // Notifica Parla.app
    dashboard.setJob(fileName, { stage: 'notificando Parla' });
    await notifyParlaApp(fileName, uploadResult.fileId, mediaInfo, clientName);
    dashboard.increment('parla');
    dashboard.addEvent('OK', 'Parla notificado: ' + fileName);
    
    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, CONFIG.UPLOAD.API_DELAY));

    // Notifica fim de transferência (NO)
    await notifyParlaTransferring(fileName, clientName, 'no');

    // Move arquivo para pasta enviados (local)
    const destPath = path.join(ENVIADOS_DIR, fileName);
    dashboard.setJob(fileName, { stage: 'movendo arquivo' });
    fs.renameSync(filePath, destPath);
    log('INFO', 'Arquivo movido para enviados:', fileName);
    
    // Atualiza contadores e interface
    totalSucessos++;
    dashboard.finishJob(fileName);
    updateConsoleStatus();
    
    // Log de sucesso do thumbnail
    if (thumbnailUrl) {
      log('INFO', 'imagem ok');
    }

    // Salva estatísticas
    if (CONFIG.MONITORING.SAVE_UPLOAD_STATS) {
      // REMOVIDO: saveUploadStats - arquivo de estatísticas desnecessário
    }
    
  } catch (e) {
    // Em caso de erro, move arquivo para pasta de erro (se ainda existir)
    try {
      if (fs.existsSync(filePath)) {
        const errorPath = path.join(ERROR_DIR, fileName);
        fs.renameSync(filePath, errorPath);
        log('ERROR', 'Arquivo movido para pasta de erro:', fileName, 'Motivo:', e.message);
        dashboard.failJob(fileName, e.message);
      } else {
        log('WARN', 'Arquivo não encontrado para mover para erro:', fileName, 'Motivo:', e.message);
      }
      
      // Atualiza contadores e interface
      totalErros++;
      updateConsoleStatus();
    } catch (moveError) {
      log('ERROR', 'Erro ao mover arquivo para pasta de erro:', fileName, moveError.message);
    }
    throw e; // Re-lança o erro para ser tratado pela fila
  }
}

// Upload para Wasabi via AWS SDK v3 com organização por cliente
async function uploadToWasabiViaS3(wasabi, filePath, fileName, clientName) {
  const fileSize = fs.statSync(filePath).size;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
  
  // Usa o gerenciador de progresso para criar barra em linha separada
  const progressBar = progressManager.addBar(fileName, fileSize);

      // Cria nome do arquivo no Wasabi com pasta do cliente
    const wasabiFileName = `${clientName}/${fileName}`;
  
  // Calcula timeout dinâmico baseado no tamanho do arquivo
  const isLargeFile = fileSize > CONFIG.UPLOAD.LARGE_FILE_THRESHOLD;
  const uploadTimeout = isLargeFile ? CONFIG.UPLOAD.LARGE_FILE_TIMEOUT : CONFIG.UPLOAD.TIMEOUT; // 10 minutos para arquivos pequenos, 30 para grandes

  try {
    // Log de diagnóstico para confirmar entrada na função de upload
    log('INFO', 'Iniciando upload para Wasabi:', wasabiFileName);

    // Cálculo dinâmico de part size e queue size com auto-tuning
    const optimization = throughputOptimizer.getOptimizationSuggestions();
    
    let queueSize = Math.min(
      CONFIG.UPLOAD.MAX_QUEUE_SIZE,
      Math.max(
        CONFIG.UPLOAD.INITIAL_QUEUE_SIZE,
        Math.ceil(fileSize / (50 * 1024 * 1024)) // 1 parte por 50MB
      )
    );
    
    let partSize = Math.min(
      CONFIG.UPLOAD.MAX_PART_SIZE,
      Math.max(
        CONFIG.UPLOAD.MIN_PART_SIZE,
        Math.floor(fileSize / queueSize) // ~1/queueSize do arquivo
      )
    );

    // Aplica otimizações baseadas no throughput atual
    if (optimization.increaseQueueSize && queueSize < CONFIG.UPLOAD.MAX_QUEUE_SIZE) {
      queueSize = Math.min(queueSize + 1, CONFIG.UPLOAD.MAX_QUEUE_SIZE);
    }
    
    if (optimization.increasePartSize && partSize < CONFIG.UPLOAD.MAX_PART_SIZE) {
      partSize = Math.min(partSize * 1.2, CONFIG.UPLOAD.MAX_PART_SIZE);
    }

    log('INFO', `Upload configurado: ${fileName} - PartSize: ${(partSize / 1024 / 1024).toFixed(1)}MB, QueueSize: ${queueSize} - ${optimization.message}`);

    // Upload usando AWS SDK v3 com multipart otimizado para 300 Mbps
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: CONFIG.WASABI.BUCKET_NAME,
        Key: wasabiFileName,
        Body: fs.createReadStream(filePath),
        ContentType: 'application/octet-stream',
        ACL: 'public-read' // Torna o arquivo público
      },
      queueSize: queueSize, // Concorrência otimizada de partes (4-6)
      partSize: partSize,   // Tamanho de parte dinâmico (25-100MB)
      leavePartsOnError: false,
      tags: [
        {
          Key: 'Client',
          Value: clientName
        },
        {
          Key: 'UploadedBy',
          Value: 'Sentinela-Wasabi'
        }
      ]
    });

    // Monitor de progresso preciso com heartbeat e detecção de travamento
    let lastProgress = 0;
    let lastProgressTime = Date.now();
    let stuckWarningCount = 0;
    const maxStuckWarnings = 3;
    
    upload.on('httpUploadProgress', (progress) => {
      const percent = Math.round((progress.loaded / fileSize) * 100);
      const loadedMB = (progress.loaded / 1024 / 1024).toFixed(2);
      const now = Date.now();
      
      // Atualiza sempre que houver progresso
      if (progress.loaded > lastProgress) {
        progressManager.updateBar(fileName, progress.loaded, fileSize);
        lastProgress = progress.loaded;
        lastProgressTime = now;
        stuckWarningCount = 0; // Reset contador quando há progresso
        
        // Log de progresso a cada 5% (apenas no arquivo)
        if (percent % 5 === 0) {
          log('INFO', `Progresso upload: ${fileName} - ${percent}% (${loadedMB}MB)`);
        }
      }
      
             // Heartbeat para detectar travamentos (mais agressivo)
       if (now - lastProgressTime > 15000) { // 15 segundos sem progresso
         stuckWarningCount++;
         log('WARN', `Travamento detectado: ${fileName} - ${percent}% há ${Math.round((now - lastProgressTime) / 1000)}s (aviso ${stuckWarningCount}/${maxStuckWarnings})`);
         
         // Se travou por muito tempo, cancela o upload
         if (stuckWarningCount >= maxStuckWarnings) {
           log('ERROR', `Upload cancelado por travamento: ${fileName} - ${percent}%`);
           upload.abort();
           throw new Error(`Upload cancelado por travamento em ${percent}%`);
         }
       }
    });

    // Executa upload com timeout e logs de diagnóstico
    log('INFO', `Iniciando upload com timeout de ${Math.round(uploadTimeout / 1000 / 60)}min`);
    
    const result = await Promise.race([
      upload.done(),
      new Promise((_, reject) => {
        setTimeout(() => {
          log('ERROR', `Timeout atingido para ${fileName} após ${Math.round(uploadTimeout / 1000 / 60)}min`);
          reject(new Error(`Upload cancelado por timeout após ${Math.round(uploadTimeout / 1000 / 60)}min`));
        }, uploadTimeout);
      })
    ]);
    
    // Log de conclusão
    log('INFO', `Upload concluído com sucesso: ${fileName} - ETag: ${result.ETag}`);

    // Verifica se o arquivo está público
    await verifyFilePublicAccess(wasabiFileName);

    // Registra estatísticas de throughput para auto-tuning
    const barInfo = progressManager.bars.get(fileName);
    const uploadDuration = barInfo ? (Date.now() - barInfo.startTime) / 1000 : 0; // segundos
    throughputOptimizer.addUploadStat(fileSize, uploadDuration);

    // Finaliza barra e mostra estatísticas
    progressManager.completeBar(fileName, fileSize, new Date().toISOString());
    
    return {
      fileId: result.ETag,
      fileName: wasabiFileName,
      size: fileSize,
      uploadTime: new Date().toISOString()
    };

  } catch (error) {
    // Em caso de erro, remove a barra
    progressManager.removeBar(fileName);
    throw error;
  }
}

// Notifica início de transferência para Parla.app
async function notifyParlaTransferring(fileName, clientName, status) {
  try {
    const payload = {
      token: CONFIG.PARLA.TOKEN,
      arquivo: fileName,
      clientName: clientName,
      status: status,
      timestamp: new Date().toISOString()
    };
    
    log('INFO', 'Enviando notificação de transferência:', fileName, 'Status:', status);
    
    const response = await axios.post(CONFIG.PARLA.TRANSFERRING_WEBHOOK, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    log('INFO', 'Parla.app notificado - Transferência:', fileName, 'Status:', response.status);
  } catch (e) {
    log('ERROR', 'Erro ao notificar transferência Parla.app:', e.message);
    if (e.response) {
      log('ERROR', 'Resposta do servidor:', e.response.status, e.response.data);
    }
  }
}

// Notifica Parla.app (corrigido)
async function notifyParlaApp(fileName, fileId, mediaInfo, clientName) {
  try {
    const payload = {
      token: CONFIG.PARLA.TOKEN,
      arquivo: fileName,
      b2_file_id: fileId.replace(/"/g, ''), // Remove aspas do ETag
      b2_url: `https://${CONFIG.WASABI.BUCKET_NAME}/${clientName}/${fileName}`,
      durationSec: String(mediaInfo.duration),
      durationFormated: formatDuration(mediaInfo.duration),
      sizeMB: mediaInfo.size
    };
    
    // Adiciona campo imagem se disponível
    if (mediaInfo.imagem) {
      payload.imagem = mediaInfo.imagem;
    }
    
    log('INFO', 'Enviando notificação de conclusão:', fileName);
    log('INFO', 'Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(CONFIG.PARLA.WEBHOOK, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    log('INFO', 'Parla.app notificado - Upload concluído:', fileName, 'Status:', response.status);
  } catch (e) {
    log('ERROR', 'Erro ao notificar Parla.app:', e.message);
    if (e.response) {
      log('ERROR', 'Resposta do servidor:', e.response.status, e.response.data);
    }
  }
}

// REMOVIDO: Função saveUploadStats - arquivo de estatísticas desnecessário
// Todas as informações já estão no log (dist/log-producao.txt)

// Função para processar arquivos existentes
async function processExistingFiles(wasabi) {
  try {
    const files = fs.readdirSync(VIDEO_DIR).filter(file => {
      const filePath = path.join(VIDEO_DIR, file);
      const ext = path.extname(file).toLowerCase();
      
      // Verifica se é arquivo (não pasta) e se está na pasta root
      return fs.statSync(filePath).isFile() && 
             CONFIG.SECURITY.ALLOWED_EXTENSIONS.includes(ext);
    });

    if (files.length > 0) {
      log('INFO', `${files.length} arquivos existentes encontrados para processamento`);
      
      // Adiciona todos os arquivos à fila p-queue
      for (const file of files) {
        const filePath = path.join(VIDEO_DIR, file);
        addToProcessingQueue(wasabi, filePath);
      }
    }
  } catch (e) {
    log('WARN', 'Erro ao processar arquivos existentes:', e.message);
  }
}

// Função para iniciar o monitoramento
function startWatcher(wasabi) {
  const watcher = chokidar.watch(VIDEO_DIR, {
    ignored: [/enviados/, /erro/, /node_modules/],
    persistent: true,
    ignoreInitial: true,
    depth: 0, // Monitora apenas a pasta root
    awaitWriteFinish: {
      stabilityThreshold: CONFIG.UPLOAD.STABILITY_THRESHOLD,
      pollInterval: CONFIG.UPLOAD.POLL_INTERVAL
    }
  });

  watcher.on('add', (filePath) => {
    const fileName = path.basename(filePath);
    
    // Verifica se é um arquivo na pasta root (não subpasta)
    if (path.dirname(filePath) !== VIDEO_DIR) {
      log('INFO', 'Arquivo em subpasta ignorado:', fileName);
      return;
    }
    
    log('INFO', 'Novo arquivo detectado:', fileName);
    
    // Adiciona à fila de processamento
          addToProcessingQueue(wasabi, filePath);
  });

  // Adiciona listener para eventos de mudança para evitar loops
  watcher.on('change', (filePath) => {
    const fileName = path.basename(filePath);
    log('INFO', 'Arquivo modificado detectado:', fileName);
  });

  // Adiciona listener para eventos de remoção
  watcher.on('unlink', (filePath) => {
    const fileName = path.basename(filePath);
    log('INFO', 'Arquivo removido:', fileName);
  });

  return watcher;
}

// Função para monitorar status da fila
function startQueueMonitor() {
  setInterval(() => {
    updateConsoleStatus();
    
    // Log de status periódico com informações de throughput
    if (processingQueue.size > 0 || processingQueue.pending > 0) {
      const avgSpeed = throughputOptimizer.getAverageSpeed();
      const optimization = throughputOptimizer.getOptimizationSuggestions();
      log('INFO', `Status da fila: ${processingQueue.size} aguardando, ${processingQueue.pending} em processamento | Throughput: ${avgSpeed.toFixed(2)} MB/s | ${optimization.message}`);
    }
  }, 10000); // A cada 10 segundos (menos frequente)
  
  // Limpeza periódica de arquivos temporários
  setInterval(() => {
    cleanupFfmpegTemp();
  }, 300000); // Limpa a cada 5 minutos
  
  // Limpeza periódica de barras antigas
  setInterval(() => {
    progressManager.cleanupOldBars();
  }, 60000); // Limpa a cada 1 minuto
}

// Função principal
async function init() {
  try {
    log('INFO', `=== SENTINELA WASABI v${VERSION} INICIADO ===`);
    log('INFO', `Versão: ${VERSION}`);
    log('INFO', 'OTIMIZADO PARA 300 Mbps (37 MB/s) - Configurações de alta performance:');
    log('INFO', `- Uploads simultâneos: ${CONFIG.UPLOAD.MAX_CONCURRENT}`);
    log('INFO', `- Queue size inicial: ${CONFIG.UPLOAD.INITIAL_QUEUE_SIZE} (máx: ${CONFIG.UPLOAD.MAX_QUEUE_SIZE})`);
    log('INFO', `- Part size: ${CONFIG.UPLOAD.MIN_PART_SIZE / 1024 / 1024}MB - ${CONFIG.UPLOAD.MAX_PART_SIZE / 1024 / 1024}MB`);
    log('INFO', `- API delay: ${CONFIG.UPLOAD.API_DELAY}ms`);
    log('INFO', `- Check interval: ${CONFIG.UPLOAD.CHECK_INTERVAL}ms`);
    log('INFO', 'Usando p-queue para controle robusto de concorrência');
    
    // Interface limpa do console
    console.clear();
    
    log('INFO', 'Configurações carregadas do código');
    
    // Cria pastas necessárias
    if (!fs.existsSync(VIDEO_DIR)) {
      fs.mkdirSync(VIDEO_DIR, { recursive: true });
      log('INFO', 'Pasta videos criada');
    }
    
    if (!fs.existsSync(ENVIADOS_DIR)) {
      fs.mkdirSync(ENVIADOS_DIR, { recursive: true });
      log('INFO', 'Pasta enviados criada');
    }
    
    if (!fs.existsSync(ERROR_DIR)) {
      fs.mkdirSync(ERROR_DIR, { recursive: true });
      log('INFO', 'Pasta erro criada');
    }

    // Carrega estatísticas iniciais
    // REMOVIDO: loadInitialStats - não mais necessário

    // Autoriza Wasabi
    const wasabi = await authorizeWasabiWithRetry();
    
    // Atualiza interface inicial
    updateConsoleStatus();
    
    // Processa arquivos existentes (sem aguardar conclusão)
    await processExistingFiles(wasabi);
    
    // Inicia monitoramento imediatamente
    const watcher = startWatcher(wasabi);
    
    // Inicia monitor da fila
    dashboard.start(
      () => ({ waiting: processingQueue.size, pending: processingQueue.pending }),
      () => throughputOptimizer.getAverageSpeed()
    );
    startQueueMonitor();
    
    log('INFO', 'Sistema pronto! Monitorando pasta:', VIDEO_DIR);
    log('INFO', 'Pressione Ctrl+C para parar');
    
  } catch (e) {
    fatal('Erro na inicialização:', e);
  }
}

// Inicia o sistema
init(); 
