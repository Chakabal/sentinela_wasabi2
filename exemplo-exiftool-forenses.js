const fs = require('fs');
const path = require('path');
const { exiftool } = require('exiftool-vendored');

// Configurações
const VIDEOS_DIR = path.join(__dirname, 'videos', 'enviados');

/**
 * 🎬 EXEMPLO PRÁTICO - Metadados Forenses com ExifTool
 * 
 * Este script demonstra como extrair informações forenses específicas
 * como nome do usuário, máquina, versão do OS e outras informações
 * técnicas gravadas no arquivo de vídeo.
 */

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

// Função para obter metadados usando ExifTool
async function getExifToolMetadata(videoPath) {
  try {
    const metadata = await exiftool.read(videoPath);
    return metadata;
  } catch (error) {
    throw new Error(`Erro ao executar ExifTool: ${error.message}`);
  }
}

// Função para extrair informações forenses específicas
function extractForensicInfo(metadata, fileName) {
  const forensicInfo = {
    fileName: fileName,
    // Informações do arquivo
    fileInfo: {
      size: metadata.FileSize,
      type: metadata.FileType,
      permissions: metadata.FilePermissions,
      created: metadata.FileCreateDate,
      modified: metadata.FileModifyDate,
      accessed: metadata.FileAccessDate
    },
    // Informações de criação
    creation: {
      createDate: metadata.CreateDate,
      creationDate: metadata.CreationDate,
      dateTimeOriginal: metadata.DateTimeOriginal,
      timeZone: metadata.TimeZone
    },
    // Informações de software
    software: {
      software: metadata.Software,
      encoder: metadata.Encoder,
      encodingTool: metadata.EncodingTool,
      version: metadata.SoftwareVersion,
      producer: metadata.Producer,
      application: metadata.Application,
      handler: metadata.Handler,
      handlerName: metadata.HandlerName,
      exifToolVersion: metadata.ExifToolVersion
    },
    // Informações de hardware
    hardware: {
      device: metadata.Device,
      model: metadata.Model,
      manufacturer: metadata.Make,
      serial: metadata.SerialNumber,
      firmware: metadata.FirmwareVersion
    },
    // Informações de usuário
    user: {
      artist: metadata.Artist,
      author: metadata.Author,
      user: metadata.User,
      owner: metadata.Owner,
      organization: metadata.Organization,
      copyright: metadata.Copyright
    },
    // Informações do sistema
    system: {
      computer: metadata.Computer,
      os: metadata.OperatingSystem,
      platform: metadata.Platform,
      hostname: metadata.Hostname,
      domain: metadata.Domain,
      userAgent: metadata.UserAgent
    },
    // Informações da câmera
    camera: {
      make: metadata.Make,
      model: metadata.Model,
      serialNumber: metadata.SerialNumber,
      firmware: metadata.FirmwareVersion,
      lens: metadata.Lens,
      focalLength: metadata.FocalLength,
      aperture: metadata.Aperture,
      iso: metadata.ISO,
      exposureTime: metadata.ExposureTime,
      flash: metadata.Flash,
      whiteBalance: metadata.WhiteBalance
    },
    // Informações de localização
    location: {
      gpsLatitude: metadata.GPSLatitude,
      gpsLongitude: metadata.GPSLongitude,
      gpsAltitude: metadata.GPSAltitude,
      gpsTimestamp: metadata.GPSTimeStamp,
      gpsDateStamp: metadata.GPSDateStamp,
      location: metadata.Location
    },
    // Informações técnicas
    technical: {
      duration: metadata.Duration,
      frameRate: metadata.VideoFrameRate,
      resolution: metadata.ImageSize,
      bitRate: metadata.BitRate,
      audioFormat: metadata.AudioFormat,
      audioChannels: metadata.AudioChannels,
      audioSampleRate: metadata.AudioSampleRate
    },
    // Todos os metadados (para análise completa)
    allMetadata: metadata
  };

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

// Função para exibir informações forenses organizadas
function displayForensicInfo(forensicInfo) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 ANÁLISE FORENSE COMPLETA: ${forensicInfo.fileName}`);
  console.log('='.repeat(80));

  // Informações do arquivo
  console.log('\n📁 INFORMAÇÕES DO ARQUIVO:');
  console.log('-'.repeat(40));
  console.log(`📄 Tipo: ${forensicInfo.fileInfo.type}`);
  console.log(`📊 Tamanho: ${forensicInfo.fileInfo.size}`);
  console.log(`🔐 Permissões: ${forensicInfo.fileInfo.permissions}`);
  console.log(`📅 Criado: ${formatDate(forensicInfo.fileInfo.created)}`);
  console.log(`📝 Modificado: ${formatDate(forensicInfo.fileInfo.modified)}`);
  console.log(`👁️  Acessado: ${formatDate(forensicInfo.fileInfo.accessed)}`);

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

  // Informações da câmera
  if (Object.keys(forensicInfo.camera).some(key => forensicInfo.camera[key])) {
    console.log('\n📷 INFORMAÇÕES DA CÂMERA:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.camera).forEach(([key, value]) => {
      if (value) {
        console.log(`📷 ${key}: ${value}`);
      }
    });
  }

  // Informações de localização
  if (Object.keys(forensicInfo.location).some(key => forensicInfo.location[key])) {
    console.log('\n📍 INFORMAÇÕES DE LOCALIZAÇÃO:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.location).forEach(([key, value]) => {
      if (value) {
        console.log(`📍 ${key}: ${value}`);
      }
    });
  }

  // Informações técnicas
  if (Object.keys(forensicInfo.technical).some(key => forensicInfo.technical[key])) {
    console.log('\n⚙️  INFORMAÇÕES TÉCNICAS:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.technical).forEach(([key, value]) => {
      if (value) {
        console.log(`⚙️  ${key}: ${value}`);
      }
    });
  }

  // Resumo forense
  console.log('\n🔍 RESUMO FORENSE:');
  console.log('-'.repeat(40));
  const metadataCount = Object.keys(forensicInfo.allMetadata).length;
  console.log(`📊 Total de metadados encontrados: ${metadataCount}`);
  
  // Verificar se encontrou informações forenses importantes
  const hasUserInfo = Object.keys(forensicInfo.user).some(key => forensicInfo.user[key]);
  const hasSystemInfo = Object.keys(forensicInfo.system).some(key => forensicInfo.system[key]);
  const hasHardwareInfo = Object.keys(forensicInfo.hardware).some(key => forensicInfo.hardware[key]);
  const hasLocationInfo = Object.keys(forensicInfo.location).some(key => forensicInfo.location[key]);
  
  console.log(`👤 Informações de usuário: ${hasUserInfo ? '✅ Encontradas' : '❌ Não encontradas'}`);
  console.log(`🖥️  Informações do sistema: ${hasSystemInfo ? '✅ Encontradas' : '❌ Não encontradas'}`);
  console.log(`⚙️  Informações de hardware: ${hasHardwareInfo ? '✅ Encontradas' : '❌ Não encontradas'}`);
  console.log(`📍 Informações de localização: ${hasLocationInfo ? '✅ Encontradas' : '❌ Não encontradas'}`);
}

// Função para salvar metadados em arquivo JSON
function saveMetadata(metadata, fileName) {
  const outputFile = path.join(__dirname, `forenses_exiftool_${fileName.replace('.mp4', '')}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));
  return outputFile;
}

// Função principal
async function main() {
  console.log('🚀 EXEMPLO - Metadados Forenses com ExifTool');
  console.log('='.repeat(50));

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
  console.log(`\n🎯 Analisando: ${selectedVideo.name}`);

  try {
    // Obtém metadados usando ExifTool
    console.log('\n⏳ Obtendo metadados com ExifTool...');
    const metadata = await getExifToolMetadata(selectedVideo.path);
    
    // Extrai informações forenses
    const forensicInfo = extractForensicInfo(metadata, selectedVideo.name);
    
    // Exibe informações forenses
    displayForensicInfo(forensicInfo);

    // Salva metadados em arquivo JSON
    const outputFile = saveMetadata(forensicInfo, selectedVideo.name);
    console.log(`\n💾 Metadados forenses salvos em: ${outputFile}`);

    // Dicas para obter mais informações forenses
    console.log('\n💡 DICAS PARA OBTER MAIS INFORMAÇÕES FORENSES:');
    console.log('-'.repeat(40));
    console.log('1. Analise vídeos originais (antes do processamento FFmpeg)');
    console.log('2. Use software de gravação que adiciona metadados forenses');
    console.log('3. Configure câmeras para incluir informações de GPS');
    console.log('4. Preserve metadados durante conversões');
    console.log('5. Use ferramentas especializadas como MediaInfo ou ExifTool CLI');

  } catch (error) {
    console.error('❌ Erro ao obter metadados:', error.message);
  } finally {
    // Fecha o ExifTool
    await exiftool.end();
  }
}

// Executa o script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getExifToolMetadata,
  extractForensicInfo,
  displayForensicInfo
}; 