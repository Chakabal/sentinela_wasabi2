const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { exiftool } = require('exiftool-vendored');

const execAsync = promisify(exec);

// Configurações
const VIDEOS_DIR = path.join(__dirname, 'videos', 'enviados');

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

// Função para verificar se ExifTool CLI está disponível
async function checkExifToolCLI() {
  try {
    const { stdout } = await execAsync('exiftool -ver');
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

// Função para obter metadados usando ExifTool CLI
async function getExifToolCLIMetadata(videoPath) {
  try {
    // Comando para obter todos os metadados em formato JSON
    const command = `exiftool -j -a -u -g1 "${videoPath}"`;
    const { stdout } = await execAsync(command);
    return JSON.parse(stdout)[0]; // ExifTool retorna array, pegamos o primeiro elemento
  } catch (error) {
    throw new Error(`Erro ao executar ExifTool CLI: ${error.message}`);
  }
}

// Função para obter metadados usando ExifTool npm
async function getExifToolNPMMetadata(videoPath) {
  try {
    const metadata = await exiftool.read(videoPath);
    return metadata;
  } catch (error) {
    throw new Error(`Erro ao executar ExifTool npm: ${error.message}`);
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
function extractForensicInfo(metadata, fileName, source) {
  const forensicInfo = {
    fileName: fileName,
    source: source, // 'cli' ou 'npm'
    fileSystem: getFileSystemInfo(metadata.SourceFile || ''),
    format: {},
    creation: {},
    software: {},
    hardware: {},
    user: {},
    system: {},
    camera: {},
    location: {},
    allMetadata: metadata
  };

  // Informações de formato
  forensicInfo.format = {
    format: metadata.FileType || metadata.MIMEType,
    duration: metadata.Duration || metadata.MediaDuration,
    size: metadata.FileSize,
    bitRate: metadata.BitRate || metadata.AvgBitrate,
    frameRate: metadata.VideoFrameRate,
    resolution: metadata.ImageSize || metadata.VideoImageSize,
    megapixels: metadata.Megapixels
  };

  // Informações de criação
  forensicInfo.creation = {
    creationDate: metadata.CreateDate || metadata.CreationDate || metadata.DateTimeOriginal || metadata.FileCreateDate,
    modifyDate: metadata.ModifyDate || metadata.FileModifyDate,
    accessDate: metadata.FileAccessDate,
    dateTime: metadata.DateTime || metadata.DateTimeOriginal,
    timeZone: metadata.TimeZone || metadata.TimeZoneOffset
  };

  // Informações de software
  forensicInfo.software = {
    software: metadata.Software || metadata.EncodingSoftware,
    encoder: metadata.Encoder || metadata.EncodingApplication,
    encodingTool: metadata.EncodingTool || metadata.EncodingApplication,
    version: metadata.SoftwareVersion || metadata.EncodingSoftwareVersion,
    producer: metadata.Producer || metadata.EncodingProducer,
    application: metadata.Application || metadata.EncodingApplication,
    handler: metadata.Handler || metadata.HandlerType,
    handlerName: metadata.HandlerName || metadata.HandlerDescription,
    exifToolVersion: metadata.ExifToolVersion
  };

  // Informações de hardware
  forensicInfo.hardware = {
    device: metadata.Device || metadata.CameraModelName,
    model: metadata.Model || metadata.CameraModel,
    manufacturer: metadata.Make || metadata.CameraMake,
    serial: metadata.SerialNumber || metadata.CameraSerialNumber,
    firmware: metadata.FirmwareVersion || metadata.CameraFirmware
  };

  // Informações de usuário
  forensicInfo.user = {
    artist: metadata.Artist || metadata.Creator,
    author: metadata.Author || metadata.Creator,
    user: metadata.User || metadata.Creator,
    owner: metadata.Owner || metadata.Creator,
    organization: metadata.Organization || metadata.Creator,
    copyright: metadata.Copyright || metadata.Rights
  };

  // Informações do sistema
  forensicInfo.system = {
    computer: metadata.Computer || metadata.HostComputer,
    os: metadata.OperatingSystem || metadata.Platform,
    platform: metadata.Platform || metadata.System,
    hostname: metadata.Hostname || metadata.ComputerName,
    domain: metadata.Domain || metadata.NetworkDomain,
    userAgent: metadata.UserAgent || metadata.CreatorTool
  };

  // Informações da câmera
  forensicInfo.camera = {
    make: metadata.Make || metadata.CameraMake,
    model: metadata.Model || metadata.CameraModel,
    serialNumber: metadata.SerialNumber || metadata.CameraSerialNumber,
    firmware: metadata.FirmwareVersion || metadata.CameraFirmware,
    lens: metadata.Lens || metadata.LensModel,
    focalLength: metadata.FocalLength,
    aperture: metadata.Aperture,
    iso: metadata.ISO,
    exposureTime: metadata.ExposureTime,
    flash: metadata.Flash,
    whiteBalance: metadata.WhiteBalance
  };

  // Informações de localização
  forensicInfo.location = {
    gpsLatitude: metadata.GPSLatitude,
    gpsLongitude: metadata.GPSLongitude,
    gpsAltitude: metadata.GPSAltitude,
    gpsTimestamp: metadata.GPSTimeStamp,
    gpsDateStamp: metadata.GPSDateStamp,
    location: metadata.Location || metadata.GPSLocation
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

// Função para exibir informações forenses
function displayForensicInfo(forensicInfo) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 METADADOS FORENSES EXIFTOOL (${forensicInfo.source.toUpperCase()}): ${forensicInfo.fileName}`);
  console.log('='.repeat(80));

  // Informações do sistema de arquivos
  console.log('\n📁 INFORMAÇÕES DO SISTEMA DE ARQUIVOS:');
  console.log('-'.repeat(40));
  console.log(`📅 Criado: ${formatDate(forensicInfo.fileSystem.created)}`);
  console.log(`📝 Modificado: ${formatDate(forensicInfo.fileSystem.modified)}`);
  console.log(`👁️  Acessado: ${formatDate(forensicInfo.fileSystem.accessed)}`);
  console.log(`📊 Tamanho: ${(forensicInfo.fileSystem.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🔐 Permissões: ${forensicInfo.fileSystem.permissions}`);

  // Informações de formato
  if (Object.keys(forensicInfo.format).some(key => forensicInfo.format[key])) {
    console.log('\n📦 INFORMAÇÕES DE FORMATO:');
    console.log('-'.repeat(40));
    Object.entries(forensicInfo.format).forEach(([key, value]) => {
      if (value) {
        console.log(`📄 ${key}: ${value}`);
      }
    });
  }

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

  // Contagem de metadados encontrados
  const metadataCount = Object.keys(forensicInfo.allMetadata).length;
  console.log(`\n📊 Total de metadados encontrados: ${metadataCount}`);
}

// Função para salvar metadados em arquivo JSON
function saveMetadata(metadata, fileName, source) {
  const outputFile = path.join(__dirname, `exiftool_${source}_${fileName.replace('.mp4', '')}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));
  return outputFile;
}

// Função para comparar resultados
function compareResults(npmResult, cliResult) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 COMPARAÇÃO ENTRE EXIFTOOL NPM E CLI');
  console.log('='.repeat(80));

  const npmCount = Object.keys(npmResult.allMetadata).length;
  const cliCount = Object.keys(cliResult.allMetadata).length;

  console.log(`\n📊 NPM ExifTool: ${npmCount} metadados encontrados`);
  console.log(`📊 CLI ExifTool: ${cliCount} metadados encontrados`);

  if (npmCount > cliCount) {
    console.log(`✅ NPM encontrou ${npmCount - cliCount} metadados a mais`);
  } else if (cliCount > npmCount) {
    console.log(`✅ CLI encontrou ${cliCount - npmCount} metadados a mais`);
  } else {
    console.log('✅ Ambos encontraram a mesma quantidade de metadados');
  }

  // Comparar campos específicos
  const fieldsToCompare = ['Duration', 'FileSize', 'ImageSize', 'Encoder', 'VideoFrameRate'];
  
  console.log('\n🔍 COMPARAÇÃO DE CAMPOS ESPECÍFICOS:');
  console.log('-'.repeat(40));
  
  fieldsToCompare.forEach(field => {
    const npmValue = npmResult.allMetadata[field];
    const cliValue = cliResult.allMetadata[field];
    
    if (npmValue !== cliValue) {
      console.log(`⚠️  ${field}:`);
      console.log(`   NPM:  ${npmValue}`);
      console.log(`   CLI:  ${cliValue}`);
    } else {
      console.log(`✅ ${field}: ${npmValue}`);
    }
  });
}

// Função principal
async function main() {
  console.log('🚀 POC - Leitor de Metadados Forenses com ExifTool (NPM vs CLI)');
  console.log('='.repeat(70));

  // Verifica se ExifTool CLI está disponível
  const cliVersion = await checkExifToolCLI();
  if (cliVersion) {
    console.log(`✅ ExifTool CLI encontrado: versão ${cliVersion}`);
  } else {
    console.log('⚠️  ExifTool CLI não encontrado, usando apenas versão NPM');
  }

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
    // Obtém metadados usando ExifTool NPM
    console.log('\n⏳ Obtendo metadados com ExifTool NPM...');
    const npmMetadata = await getExifToolNPMMetadata(selectedVideo.path);
    const npmForensicInfo = extractForensicInfo(npmMetadata, selectedVideo.name, 'npm');
    
    // Exibe informações forenses NPM
    displayForensicInfo(npmForensicInfo);

    // Salva metadados NPM
    const npmOutputFile = saveMetadata(npmForensicInfo, selectedVideo.name, 'npm');
    console.log(`\n💾 Metadados ExifTool NPM salvos em: ${npmOutputFile}`);

    // Tenta obter metadados usando ExifTool CLI se disponível
    if (cliVersion) {
      console.log('\n⏳ Obtendo metadados com ExifTool CLI...');
      const cliMetadata = await getExifToolCLIMetadata(selectedVideo.path);
      const cliForensicInfo = extractForensicInfo(cliMetadata, selectedVideo.name, 'cli');
      
      // Exibe informações forenses CLI
      displayForensicInfo(cliForensicInfo);

      // Salva metadados CLI
      const cliOutputFile = saveMetadata(cliForensicInfo, selectedVideo.name, 'cli');
      console.log(`\n💾 Metadados ExifTool CLI salvos em: ${cliOutputFile}`);

      // Compara resultados
      compareResults(npmForensicInfo, cliForensicInfo);
    }

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
  getExifToolCLIMetadata,
  getExifToolNPMMetadata,
  extractForensicInfo,
  displayForensicInfo,
  compareResults
}; 