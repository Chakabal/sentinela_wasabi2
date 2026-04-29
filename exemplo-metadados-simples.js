const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 🎬 EXEMPLO SIMPLES - Leitor de Metadados de Vídeo MP4
 * 
 * Este script demonstra como ler metadados básicos de um vídeo MP4
 * usando ffprobe integrado no projeto.
 */

// Configurações
const VIDEOS_DIR = path.join(__dirname, 'videos', 'enviados');
const FFMPEG_DIR = path.join(__dirname, 'ffmpeg');

/**
 * Obtém o caminho do ffprobe (compatível com pkg)
 */
function getFfprobePath() {
  if (process.pkg !== undefined) {
    // Se estiver compilado com pkg
    const ASSET_DIR = path.dirname(process.execPath);
    return path.join(ASSET_DIR, 'ffmpeg', 'ffprobe.exe');
  } else {
    // Se estiver em desenvolvimento
    return path.join(FFMPEG_DIR, 'ffprobe.exe');
  }
}

/**
 * Obtém metadados básicos de um vídeo
 */
async function getVideoMetadata(videoPath) {
  const ffprobePath = getFfprobePath();
  
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`ffprobe não encontrado em: ${ffprobePath}`);
  }

  // Comando para obter informações básicas
  const command = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
  
  try {
    const { stdout } = await execAsync(command);
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Erro ao executar ffprobe: ${error.message}`);
  }
}

/**
 * Formata duração em segundos para formato legível
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Formata tamanho em bytes para formato legível
 */
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Exibe metadados de forma organizada
 */
function displayVideoInfo(metadata, fileName) {
  console.log('\n🎬 INFORMAÇÕES DO VÍDEO:');
  console.log('='.repeat(50));
  console.log(`📄 Arquivo: ${fileName}`);
  
  if (metadata.format) {
    console.log(`📊 Tamanho: ${formatFileSize(parseInt(metadata.format.size || 0))}`);
    console.log(`⏱️  Duração: ${formatDuration(parseFloat(metadata.format.duration || 0))}`);
    console.log(`🎵 Bitrate: ${parseInt(metadata.format.bit_rate || 0) / 1000} kbps`);
  }

  if (metadata.streams) {
    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

    if (videoStream) {
      console.log(`🎬 Vídeo: ${videoStream.codec_name} ${videoStream.width}x${videoStream.height} ${videoStream.r_frame_rate}fps`);
    }
    if (audioStream) {
      console.log(`🎵 Áudio: ${audioStream.codec_name} ${audioStream.sample_rate}Hz ${audioStream.channels}ch`);
    }
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Exemplo Simples - Leitor de Metadados de Vídeo');
  console.log('='.repeat(50));

  // Lista vídeos disponíveis
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.log('❌ Pasta de vídeos não encontrada:', VIDEOS_DIR);
    return;
  }

  const videos = fs.readdirSync(VIDEOS_DIR)
    .filter(file => file.toLowerCase().endsWith('.mp4'))
    .slice(0, 3); // Pega apenas os 3 primeiros

  if (videos.length === 0) {
    console.log('❌ Nenhum vídeo MP4 encontrado');
    return;
  }

  console.log(`📁 Vídeos encontrados: ${videos.length}`);
  
  // Processa o primeiro vídeo
  const videoFile = videos[0];
  const videoPath = path.join(VIDEOS_DIR, videoFile);
  
  console.log(`\n🎯 Processando: ${videoFile}`);

  try {
    const metadata = await getVideoMetadata(videoPath);
    displayVideoInfo(metadata, videoFile);

    // Exemplo de acesso programático aos dados
    console.log('\n🔧 EXEMPLO DE ACESSO AOS DADOS:');
    console.log('-'.repeat(30));
    console.log(`Duração em segundos: ${metadata.format?.duration || 'N/A'}`);
    console.log(`Resolução: ${metadata.streams?.[0]?.width || 'N/A'}x${metadata.streams?.[0]?.height || 'N/A'}`);
    console.log(`Codec de vídeo: ${metadata.streams?.find(s => s.codec_type === 'video')?.codec_name || 'N/A'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executa se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getVideoMetadata,
  displayVideoInfo,
  formatDuration,
  formatFileSize
}; 