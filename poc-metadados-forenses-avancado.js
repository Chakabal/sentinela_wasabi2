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

// Função para obter metadados forenses completos usando múltiplas técnicas
async function getAdvancedForensicMetadata(videoPath) {
  const ffprobePath = getFfprobePath();
  
  if (!fs.existsSync(ffprobePath)) {
    throw new Error(`ffprobe não encontrado em: ${ffprobePath}`);
  }

  const results = {
    basic: null,
    detailed: null,
    exif: null,
    hex: null
  };

  try {
    // 1. Metadados básicos
    const basicCommand = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const { stdout: basicOutput } = await execAsync(basicCommand);
    results.basic = JSON.parse(basicOutput);

    // 2. Metadados detalhados com todas as tags
    const detailedCommand = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams -show_chapters -show_private_data -show_entries format_tags=* -show_entries stream_tags=* "${videoPath}"`;
    const { stdout: detailedOutput } = await execAsync(detailedCommand);
    results.detailed = JSON.parse(detailedOutput);

    // 3. Tentar extrair informações EXIF se disponível
    try {
      const exifCommand = `"${ffprobePath}" -v quiet -print_format json -show_entries format_tags=* -show_entries stream_tags=* -show_entries format=* -of json "${videoPath}"`;
      const { stdout: exifOutput } = await execAsync(exifCommand);
      results.exif = JSON.parse(exifOutput);
    } catch (error) {
      console.log('⚠️  Não foi possível extrair informações EXIF');
    }

    // 4. Análise hexadecimal dos primeiros bytes (para detectar assinaturas)
    try {
      const buffer = fs.readFileSync(videoPath, { encoding: null });
      results.hex = {
        firstBytes: buffer.slice(0, 64).toString('hex'),
        fileSignature: buffer.slice(0, 8).toString('hex'),
        size: buffer.length
      };
    } catch (error) {
      console.log('⚠️  Não foi possível analisar bytes do arquivo');
    }

  } catch (error) {
    throw new Error(`Erro ao executar ffprobe: ${error.message}`);
  }

  return results;
}

// Função para extrair informações forenses avançadas
function extractAdvancedForensicInfo(results, fileName) {
  const forensicInfo = {
    fileName: fileName,
    fileSystem: getFileSystemInfo(results.basic?.format?.filename || ''),
    format: {},
    streams: [],
    creation: {},
    software: {},
    hardware: {},
    user: {},
    system: {},
    exif: {},
    hex: {},
    metadata: {}
  };

  // Informações do formato
  if (results.basic?.format) {
    forensicInfo.format = {
      formatName: results.basic.format.format_name,
      duration: results.basic.format.duration,
      size: results.basic.format.size,
      bitRate: results.basic.format.bit_rate,
      tags: results.basic.format.tags || {}
    };

    // Extrair informações forenses das tags
    if (results.basic.format.tags) {
      const tags = results.basic.format.tags;
      
      // Informações de criação
      forensicInfo.creation = {
        creationTime: tags.creation_time || tags.date || tags.DATE || tags.CreationTime || tags.creation_date,
        date: tags.date || tags.DATE || tags.Date || tags.creation_date,
        time: tags.time || tags.Time || tags.creation_time,
        year: tags.year || tags.Year || tags.creation_year,
        month: tags.month || tags.Month || tags.creation_month,
        day: tags.day || tags.Day || tags.creation_day
      };

      // Informações de software
      forensicInfo.software = {
        software: tags.software || tags.Software || tags.encoder || tags.Encoder || tags.encoding_software,
        encoder: tags.encoder || tags.Encoder || tags.encoding_tool || tags.EncodingTool || tags.encoding_application,
        encodingTool: tags.encoding_tool || tags.EncodingTool || tags.tool || tags.Tool || tags.encoding_application,
        version: tags.version || tags.Version || tags.software_version || tags.SoftwareVersion || tags.encoder_version,
        producer: tags.producer || tags.Producer || tags.creator || tags.Creator || tags.encoding_producer,
        application: tags.application || tags.Application || tags.encoding_application || tags.EncodingApplication
      };

      // Informações de hardware
      forensicInfo.hardware = {
        device: tags.device || tags.Device || tags.camera || tags.Camera || tags.recording_device,
        model: tags.model || tags.Model || tags.device_model || tags.DeviceModel || tags.camera_model,
        manufacturer: tags.manufacturer || tags.Manufacturer || tags.make || tags.Make || tags.device_manufacturer,
        serial: tags.serial || tags.Serial || tags.device_serial || tags.DeviceSerial
      };

      // Informações de usuário
      forensicInfo.user = {
        artist: tags.artist || tags.Artist || tags.author || tags.Author || tags.creator_name,
        author: tags.author || tags.Author || tags.creator || tags.Creator || tags.recording_artist,
        user: tags.user || tags.User || tags.username || tags.Username || tags.recording_user,
        owner: tags.owner || tags.Owner || tags.creator_name || tags.CreatorName || tags.file_owner,
        organization: tags.organization || tags.Organization || tags.company || tags.Company
      };

      // Informações do sistema
      forensicInfo.system = {
        computer: tags.computer || tags.Computer || tags.machine || tags.Machine || tags.host_computer,
        os: tags.os || tags.OS || tags.operating_system || tags.OperatingSystem || tags.platform_os,
        platform: tags.platform || tags.Platform || tags.system || tags.System || tags.platform_name,
        hostname: tags.hostname || tags.Hostname || tags.computer_name || tags.ComputerName || tags.machine_name,
        domain: tags.domain || tags.Domain || tags.network_domain || tags.NetworkDomain
      };
    }
  }

  // Informações dos streams
  if (results.basic?.streams) {
    results.basic.streams.forEach((stream, index) => {
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
          creationTime: tags.creation_time || tags.date || tags.DATE || tags.stream_creation_time,
          language: tags.language || tags.Language || tags.lang || tags.Lang || tags.stream_language
        };

        // Informações de software do stream
        streamInfo.software = {
          handler: tags.handler_name || tags.HandlerName || tags.handler || tags.Handler || tags.stream_handler,
          vendor: tags.vendor_id || tags.VendorId || tags.vendor || tags.Vendor || tags.stream_vendor
        };
      }

      forensicInfo.streams.push(streamInfo);
    });
  }

  // Informações EXIF se disponível
  if (results.exif) {
    forensicInfo.exif = {
      format: results.exif.format || {},
      streams: results.exif.streams || [],
      chapters: results.exif.chapters || []
    };
  }

  // Informações hexadecimais
  if (results.hex) {
    forensicInfo.hex = {
      firstBytes: results.hex.firstBytes,
      fileSignature: results.hex.fileSignature,
      size: results.hex.size,
      analysis: analyzeHexSignature(results.hex.fileSignature)
    };
  }

  // Metadados completos
  forensicInfo.metadata = {
    basic: results.basic,
    detailed: results.detailed,
    exif: results.exif
  };

  return forensicInfo;
}

// Função para analisar assinatura hexadecimal
function analyzeHexSignature(signature) {
  const signatures = {
    '000000186674797069736f6d': 'MP4 (ISO Media)',
    '000000206674797069736f6d': 'MP4 (ISO Media)',
    '0000001c667479704d534e56': 'MP4 (Microsoft)',
    '00000020667479704d534e56': 'MP4 (Microsoft)',
    '000000186674797071742020': 'QuickTime',
    '000000206674797071742020': 'QuickTime'
  };

  return signatures[signature] || 'Formato desconhecido';
}

// Função para obter informações do arquivo do sistema
function getFileSystemInfo(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      created: null,
      modified: null,
      accessed: null,
      size: 0,
      permissions: null
    };
  }

  const stats = fs.statSync(filePath);
  return {
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    size: stats.size,
    permissions: stats.mode.toString(8)
  };
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

// Função para exibir informações forenses avançadas
function displayAdvancedForensicInfo(forensicInfo) {
  console.log('\n' + '='.repeat(80));
  console.log(`🔍 METADADOS FORENSES AVANÇADOS: ${forensicInfo.fileName}`);
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

  // Informações hexadecimais
  if (forensicInfo.hex && forensicInfo.hex.analysis) {
    console.log('\n🔍 ANÁLISE HEXADECIMAL:');
    console.log('-'.repeat(40));
    console.log(`📄 Assinatura: ${forensicInfo.hex.fileSignature}`);
    console.log(`🔍 Tipo: ${forensicInfo.hex.analysis}`);
    console.log(`📊 Tamanho: ${forensicInfo.hex.size} bytes`);
  }

  // Todas as tags encontradas (para debug)
  console.log('\n🔍 TODAS AS TAGS ENCONTRADAS:');
  console.log('-'.repeat(40));
  if (forensicInfo.format.tags) {
    Object.entries(forensicInfo.format.tags).forEach(([key, value]) => {
      console.log(`🏷️  ${key}: ${value}`);
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
}

// Função principal
async function main() {
  console.log('🚀 POC - Leitor de Metadados Forenses Avançados de Vídeo MP4');
  console.log('='.repeat(70));

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
    // Obtém metadados forenses avançados
    console.log('\n⏳ Obtendo metadados forenses avançados...');
    const results = await getAdvancedForensicMetadata(selectedVideo.path);
    
    // Extrai informações forenses
    const forensicInfo = extractAdvancedForensicInfo(results, selectedVideo.name);
    
    // Exibe informações forenses
    displayAdvancedForensicInfo(forensicInfo);

    // Salva metadados forenses em arquivo JSON
    const outputFile = path.join(__dirname, `forenses_avancado_${selectedVideo.name.replace('.mp4', '')}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(forensicInfo, null, 2));
    console.log(`\n💾 Metadados forenses avançados salvos em: ${outputFile}`);

  } catch (error) {
    console.error('❌ Erro ao obter metadados forenses:', error.message);
  }
}

// Executa o script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getAdvancedForensicMetadata,
  extractAdvancedForensicInfo,
  displayAdvancedForensicInfo
}; 