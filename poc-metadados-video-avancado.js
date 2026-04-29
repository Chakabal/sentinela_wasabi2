const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configurações
const VIDEOS_DIR = path.join(__dirname, 'videos', 'enviados');
const FFMPEG_DIR = path.join(__dirname, 'ffmpeg');

// Função para verificar se está compilado com pkg
function isCompiled() {
  return process.pkg !== undefined;
}

// Função para obter o caminho do ffprobe
function getFfprobePath() {
  if (isCompiled()) {
    const ASSET_DIR = path.dirname(process.execPath);
    return path.join(ASSET_DIR, 'ffmpeg', 'ffprobe.exe');
  } else {
    return path.join(FFMPEG_DIR, 'ffprobe.exe');
  }
}

// Função para listar vídeos disponíveis
function listVideos() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.log('❌ Pasta de vídeos não encontrada:', VIDEOS_DIR);
    return [];
  }

  const files = fs.readdirSync(VIDEOS_DIR)
    .filter(file => file.toLowerCase().endsWith('.mp4'))
    .map(file => ({
      name: file,
      path: path.join(VIDEOS_DIR, file),
      size: fs.statSync(path.join(VIDEOS_DIR, file)).size
    }));

  return files;
}

// Função para obter metadados completos do vídeo
async function getVideoMetadata(videoPath) {
  const ffprobePath = getFfprobePath();
  
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`ffprobe não encontrado em: ${ffprobePath}`);
  }

  const command = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
  
  try {
    const { stdout } = await execAsync(command);
    const metadata = JSON.parse(stdout);
    return metadata;
  } catch (error) {
    throw new Error(`Erro ao executar ffprobe: ${error.message}`);
  }
}

// Função para obter apenas informações básicas (mais rápido)
async function getBasicVideoInfo(videoPath) {
  const ffprobePath = getFfprobePath();
  
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`ffprobe não encontrado em: ${ffprobePath}`);
  }

  const command = `"${ffprobePath}" -v quiet -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,channels,sample_rate -of json "${videoPath}"`;
  
  try {
    const { stdout } = await execAsync(command);
    const info = JSON.parse(stdout);
    return info;
  } catch (error) {
    throw new Error(`Erro ao executar ffprobe: ${error.message}`);
  }
}

// Função para formatar tamanho em bytes
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Função para formatar duração em segundos
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

// Função para exibir metadados de forma organizada
function displayMetadata(metadata, fileName) {
  console.log('\n' + '='.repeat(80));
  console.log(`🎬 METADADOS DO VÍDEO: ${fileName}`);
  console.log('='.repeat(80));

  // Informações do formato
  if (metadata.format) {
    console.log('\n📁 INFORMAÇÕES DO FORMATO:');
    console.log('-'.repeat(40));
    console.log(`📄 Nome do arquivo: ${metadata.format.filename || 'N/A'}`);
    console.log(`📊 Tamanho: ${formatFileSize(parseInt(metadata.format.size || 0))}`);
    console.log(`⏱️  Duração: ${formatDuration(parseFloat(metadata.format.duration || 0))}`);
    console.log(`🎵 Bitrate: ${parseInt(metadata.format.bit_rate || 0) / 1000} kbps`);
    console.log(`📦 Formato: ${metadata.format.format_name || 'N/A'}`);
    
    // Tags se existirem
    if (metadata.format.tags) {
      console.log(`🏷️  Título: ${metadata.format.tags.title || 'N/A'}`);
      console.log(`👤 Artista: ${metadata.format.tags.artist || 'N/A'}`);
      console.log(`📅 Data: ${metadata.format.tags.date || 'N/A'}`);
      console.log(`📝 Comentário: ${metadata.format.tags.comment || 'N/A'}`);
    }
  }

  // Informações dos streams
  if (metadata.streams && metadata.streams.length > 0) {
    console.log('\n🎥 STREAMS:');
    console.log('-'.repeat(40));
    
    metadata.streams.forEach((stream, index) => {
      if (stream.codec_type === 'video') {
        console.log(`\n🎬 Stream ${index + 1} (Vídeo):`);
        console.log(`  📹 Codec: ${stream.codec_name || 'N/A'}`);
        console.log(`  📐 Resolução: ${stream.width || 'N/A'}x${stream.height || 'N/A'}`);
        console.log(`  🎯 Aspect Ratio: ${stream.display_aspect_ratio || 'N/A'}`);
        console.log(`  🎞️  Frame Rate: ${stream.r_frame_rate || 'N/A'}`);
        console.log(`  🎨 Pixel Format: ${stream.pix_fmt || 'N/A'}`);
        console.log(`  🎬 Profile: ${stream.profile || 'N/A'}`);
        console.log(`  🎯 Level: ${stream.level || 'N/A'}`);
        console.log(`  🎵 Bitrate: ${parseInt(stream.bit_rate || 0) / 1000} kbps`);
        console.log(`  🎬 Frames: ${stream.nb_frames || 'N/A'}`);
      } else if (stream.codec_type === 'audio') {
        console.log(`\n🎵 Stream ${index + 1} (Áudio):`);
        console.log(`  🎵 Codec: ${stream.codec_name || 'N/A'}`);
        console.log(`  🔊 Sample Rate: ${stream.sample_rate || 'N/A'} Hz`);
        console.log(`  🎧 Channels: ${stream.channels || 'N/A'}`);
        console.log(`  🎵 Bitrate: ${parseInt(stream.bit_rate || 0) / 1000} kbps`);
        console.log(`  🎼 Sample Format: ${stream.sample_fmt || 'N/A'}`);
        console.log(`  🎵 Frames: ${stream.nb_frames || 'N/A'}`);
      }
    });
  }

  // Informações adicionais
  console.log('\n🔍 INFORMAÇÕES ADICIONAIS:');
  console.log('-'.repeat(40));
  console.log(`📊 Número de streams: ${metadata.streams?.length || 0}`);
  console.log(`🎬 Streams de vídeo: ${metadata.streams?.filter(s => s.codec_type === 'video').length || 0}`);
  console.log(`🎵 Streams de áudio: ${metadata.streams?.filter(s => s.codec_type === 'audio').length || 0}`);
}

// Função para exibir informações básicas
function displayBasicInfo(info, fileName) {
  console.log('\n' + '='.repeat(60));
  console.log(`🎬 INFORMAÇÕES BÁSICAS: ${fileName}`);
  console.log('='.repeat(60));

  if (info.format) {
    console.log(`📊 Tamanho: ${formatFileSize(parseInt(info.format.size || 0))}`);
    console.log(`⏱️  Duração: ${formatDuration(parseFloat(info.format.duration || 0))}`);
    console.log(`🎵 Bitrate: ${parseInt(info.format.bit_rate || 0) / 1000} kbps`);
  }

  if (info.streams) {
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    const audioStream = info.streams.find(s => s.codec_type === 'audio');

    if (videoStream) {
      console.log(`🎬 Vídeo: ${videoStream.codec_name} ${videoStream.width}x${videoStream.height}`);
    }
    if (audioStream) {
      console.log(`🎵 Áudio: ${audioStream.codec_name} ${audioStream.sample_rate}Hz ${audioStream.channels}ch`);
    }
  }
}

// Função para salvar metadados em arquivo
function saveMetadata(metadata, fileName) {
  const outputFile = path.join(__dirname, `metadados_${fileName.replace('.mp4', '')}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));
  return outputFile;
}

// Função principal
async function main() {
  console.log('🚀 POC - Leitor de Metadados de Vídeo MP4 (Avançado)');
  console.log('='.repeat(60));

  // Lista vídeos disponíveis
  const videos = listVideos();
  
  if (videos.length === 0) {
    console.log('❌ Nenhum vídeo MP4 encontrado na pasta:', VIDEOS_DIR);
    return;
  }

  console.log(`\n📁 Vídeos encontrados (${videos.length}):`);
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.name} (${formatFileSize(video.size)})`);
  });

  // Simula seleção do usuário (pode ser expandido para input real)
  const selectedIndex = 0; // Primeiro vídeo
  const selectedVideo = videos[selectedIndex];
  
  console.log(`\n🎯 Vídeo selecionado: ${selectedVideo.name}`);
  console.log(`📁 Caminho: ${selectedVideo.path}`);

  try {
    // Opção 1: Informações básicas (rápido)
    console.log('\n⏳ Obtendo informações básicas...');
    const basicInfo = await getBasicVideoInfo(selectedVideo.path);
    displayBasicInfo(basicInfo, selectedVideo.name);

    // Opção 2: Metadados completos (mais lento)
    console.log('\n⏳ Obtendo metadados completos...');
    const metadata = await getVideoMetadata(selectedVideo.path);
    displayMetadata(metadata, selectedVideo.name);

    // Salva metadados em arquivo JSON
    const outputFile = saveMetadata(metadata, selectedVideo.name);
    console.log(`\n💾 Metadados salvos em: ${outputFile}`);

    // Exemplo de uso programático
    console.log('\n🔧 EXEMPLO DE USO PROGRAMÁTICO:');
    console.log('-'.repeat(40));
    console.log('const { getVideoMetadata } = require("./poc-metadados-video-avancado.js");');
    console.log('const metadata = await getVideoMetadata("caminho/para/video.mp4");');
    console.log('console.log("Duração:", metadata.format.duration, "segundos");');
    console.log('console.log("Resolução:", metadata.streams[0].width + "x" + metadata.streams[0].height);');

  } catch (error) {
    console.error('❌ Erro ao obter metadados:', error.message);
  }
}

// Executa o script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getVideoMetadata,
  getBasicVideoInfo,
  listVideos,
  displayMetadata,
  displayBasicInfo,
  saveMetadata
}; 