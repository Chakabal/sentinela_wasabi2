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

// Função para obter metadados forenses completos do vídeo
async function getForensicMetadata(videoPath) {
  const ffprobePath = getFfprobePath();
  
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`ffprobe não encontrado em: ${ffprobePath}`);
  }

  // Comando para obter TODOS os metadados, incluindo tags e informações forenses
  const command = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams -show_chapters -show_private_data "${videoPath}"`;
  
  try {
    const { stdout } = await execAsync(command);
    const metadata = JSON.parse(stdout);
    return metadata;
  } catch (error) {
    throw new Error(`Erro ao executar ffprobe: ${error.message}`);
  }
}

// Função para obter metadados específicos de criação e software
async function getCreationMetadata(videoPath) {
  const ffprobePath = getFfprobePath();
  
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`ffprobe não encontrado em: ${ffprobePath}`);
  }

  // Comando específico para metadados de criação e software
  const command = `"${ffprobePath}" -v quiet -show_entries format_tags=* -show_entries stream_tags=* -show_entries format=* -of json "${videoPath}"`;
  
  try {
    const { stdout } = await execAsync(command);
    const metadata = JSON.parse(stdout);
    return metadata;
  } catch (error) {
    throw new Error(`Erro ao executar ffprobe: ${error.message}`);
  }
}

// Função para obter informações do arquivo do sistema
function getFileSystemInfo(filePath) {
  const stats = fs.statSync(filePath);
  return {
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    size: stats.size,
    permissions: stats.mode.toString(8)
  };
}

// Função para extrair informações forenses dos metadados
function extractForensicInfo(metadata, fileName) {
  const forensicInfo = {
    fileName: fileName,
    fileSystem: getFileSystemInfo(metadata.format?.filename || ''),
    format: {},
    streams: [],
    creation: {},
    software: {},
    hardware: {},
    user: {},
    system: {}
  };

  // Informações do formato
  if (metadata.format) {
    forensicInfo.format = {
      formatName: metadata.format.format_name,
      duration: metadata.format.duration,
      size: metadata.format.size,
      bitRate: metadata.format.bit_rate,
      tags: metadata.format.tags || {}
    };

    // Extrair informações forenses das tags
    if (metadata.format.tags) {
      const tags = metadata.format.tags;
      
      // Informações de criação
      forensicInfo.creation = {
        creationTime: tags.creation_time || tags.date || tags.DATE || tags.CreationTime,
        date: tags.date || tags.DATE || tags.Date,
        time: tags.time || tags.Time,
        year: tags.year || tags.Year,
        month: tags.month || tags.Month,
        day: tags.day || tags.Day
      };

      // Informações de software
      forensicInfo.software = {
        software: tags.software || tags.Software || tags.encoder || tags.Encoder,
        encoder: tags.encoder || tags.Encoder || tags.encoding_tool || tags.EncodingTool,
        encodingTool: tags.encoding_tool || tags.EncodingTool || tags.tool || tags.Tool,
        version: tags.version || tags.Version || tags.software_version || tags.SoftwareVersion,
        producer: tags.producer || tags.Producer || tags.creator || tags.Creator
      };

      // Informações de hardware
      forensicInfo.hardware = {
        device: tags.device || tags.Device || tags.camera || tags.Camera,
        model: tags.model || tags.Model || tags.device_model || tags.DeviceModel,
        manufacturer: tags.manufacturer || tags.Manufacturer || tags.make || tags.Make
      };

      // Informações de usuário
      forensicInfo.user = {
        artist: tags.artist || tags.Artist || tags.author || tags.Author,
        author: tags.author || tags.Author || tags.creator || tags.Creator,
        user: tags.user || tags.User || tags.username || tags.Username,
        owner: tags.owner || tags.Owner || tags.creator_name || tags.CreatorName
      };

      // Informações do sistema
      forensicInfo.system = {
        computer: tags.computer || tags.Computer || tags.machine || tags.Machine,
        os: tags.os || tags.OS || tags.operating_system || tags.OperatingSystem,
        platform: tags.platform || tags.Platform || tags.system || tags.System,
        hostname: tags.hostname || tags.Hostname || tags.computer_name || tags.ComputerName
      };
    }
  }

  // Informações dos streams
  if (metadata.streams) {
    metadata.streams.forEach((stream, index) => {
      const streamInfo = {
        index: stream.index,
        codecType: stream.codec_type,
        codecName: stream.codec_name,
        tags: stream.tags || {}
      };

      // Extrair informações forenses das tags do stream
      if (stream.tags) {
        const tags = stream.tags;
        
        // Informações de criação do stream
        streamInfo.creation = {
          creationTime: tags.creation_time || tags.date || tags.DATE,
          language: tags.language || tags.Language || tags.lang || tags.Lang
        };

        // Informações de software do stream
        streamInfo.software = {
          handler: tags.handler_name || tags.HandlerName || tags.handler || tags.Handler,
          vendor: tags.vendor_id || tags.VendorId || tags.vendor || tags.Vendor
        };
      }

      forensicInfo.streams.push(streamInfo);
    });
  }

  return forensicInfo;
}

// Função para formatar data
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  } catch (error) {
    return dateString;
  }
}

// Função para exibir informações forenses
function displayForensicInfo(forensicInfo) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 METADADOS FORENSES: ${forensicInfo.fileName}`);
  console.log('='.repeat(80));

  // Informações do sistema de arquivos
  console.log('\n📁 INFORMAÇÕES DO SISTEMA DE ARQUIVOS:');
  console.log('-'.repeat(40));
  console.log(`📅 Criado: ${formatDate(forensicInfo.fileSystem.created)}`);
  console.log(`📝 Modificado: ${formatDate(forensicInfo.fileSystem.modified)}`);
  console.log(`👁️  Acessado: ${formatDate(forensicInfo.fileSystem.accessed)}`);
  console.log(`📊 Tamanho: ${(forensicInfo.fileSystem.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🔐 Permissões: ${forensicInfo.fileSystem.permissions}`);

  // Informações de criação
  if (Object.keys(forensicInfo.creation).some(key => forensicInfo.creation[key])) {
    console.log('\n🕒 INFORMAÇÕES DE CRIAÇÃO:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.creation).forEach(([key, value]) => {
      if (value) {
        console.log(`📅 ${key}: ${formatDate(value)}`);
      }
    });
  }

  // Informações de software
  if (Object.keys(forensicInfo.software).some(key => forensicInfo.software[key])) {
    console.log('\n💻 INFORMAÇÕES DE SOFTWARE:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.software).forEach(([key, value]) => {
      if (value) {
        console.log(`🔧 ${key}: ${value}`);
      }
    });
  }

  // Informações de hardware
  if (Object.keys(forensicInfo.hardware).some(key => forensicInfo.hardware[key])) {
    console.log('\n🖥️  INFORMAÇÕES DE HARDWARE:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.hardware).forEach(([key, value]) => {
      if (value) {
        console.log(`⚙️  ${key}: ${value}`);
      }
    });
  }

  // Informações de usuário
  if (Object.keys(forensicInfo.user).some(key => forensicInfo.user[key])) {
    console.log('\n👤 INFORMAÇÕES DE USUÁRIO:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.user).forEach(([key, value]) => {
      if (value) {
        console.log(`👤 ${key}: ${value}`);
      }
    });
  }

  // Informações do sistema
  if (Object.keys(forensicInfo.system).some(key => forensicInfo.system[key])) {
    console.log('\n🖥️  INFORMAÇÕES DO SISTEMA:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.system).forEach(([key, value]) => {
      if (value) {
        console.log(`🖥️  ${key}: ${value}`);
      }
    });
  }

  // Informações dos streams
  if (forensicInfo.streams.length > 0) {
    console.log('\n🎥 INFORMAÇÕES DOS STREAMS:');
    console.log('-'.repeat(40));
    forensicInfo.streams.forEach((stream, index) => {
      console.log(`\n🎬 Stream ${index + 1} (${stream.codecType}):`);
      console.log(`  📹 Codec: ${stream.codecName}`);
      
      if (stream.creation && Object.keys(stream.creation).some(key => stream.creation[key])) {
        Object.entries(stream.creation).forEach(([key, value]) => {
          if (value) {
            console.log(`  📅 ${key}: ${value}`);
          }
        });
      }
      
      if (stream.software && Object.keys(stream.software).some(key => stream.software[key])) {
        Object.entries(stream.software).forEach(([key, value]) => {
          if (value) {
            console.log(`  🔧 ${key}: ${value}`);
          }
        });
      }
    });
  }

  // Todas as tags encontradas (para debug)
  console.log('\n🔍 TODAS AS TAGS ENCONTRADAS:');
  console.log('-'.repeat(40));
  if (forensicInfo.format.tags) {
    Object.entries(forensicInfo.format.tags).forEach(([key, value]) => {
      console.log(`🏷️  ${key}: ${value}`);
    });
  }
}

// Função principal
async function main() {
  console.log('🚀 POC - Leitor de Metadados Forenses de Vídeo MP4');
  console.log('='.repeat(60));

  // Lista vídeos disponíveis
  const videos = listVideos();
  
  if (videos.length === 0) {
    console.log('❌ Nenhum vídeo MP4 encontrado na pasta:', VIDEOS_DIR);
    return;
  }

  console.log(`\n📁 Vídeos encontrados (${videos.length}):`);
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.name} (${(video.size / 1024 / 1024).toFixed(2)} MB)`);
  });

  // Pega o primeiro vídeo como exemplo
  const selectedVideo = videos[0];
  console.log(`\n🎯 Usando como exemplo: ${selectedVideo.name}`);

  try {
    // Obtém metadados forenses
    console.log('\n⏳ Obtendo metadados forenses...');
    const metadata = await getForensicMetadata(selectedVideo.path);
    
    // Extrai informações forenses
    const forensicInfo = extractForensicInfo(metadata, selectedVideo.name);
    
    // Exibe informações forenses
    displayForensicInfo(forensicInfo);

    // Salva metadados forenses em arquivo JSON
    const outputFile = path.join(__dirname, `forenses_${selectedVideo.name.replace('.mp4', '')}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(forensicInfo, null, 2));
    console.log(`\n💾 Metadados forenses salvos em: ${outputFile}`);

  } catch (error) {
    console.error('❌ Erro ao obter metadados forenses:', error.message);
  }
}

// Executa o script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getForensicMetadata,
  getCreationMetadata,
  extractForensicInfo,
  displayForensicInfo
}; 