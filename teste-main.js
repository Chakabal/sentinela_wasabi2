// teste-main.js - Teste do início do arquivo principal
console.log('=== TESTE MAIN INICIADO ===');

try {
  console.log('1. Testando imports básicos...');
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  console.log('✅ Imports básicos OK');
  
  console.log('2. Testando imports de terceiros...');
  const { S3Client } = require('@aws-sdk/client-s3');
  const { Upload } = require('@aws-sdk/lib-storage');
  const { NodeHttpHandler } = require('@smithy/node-http-handler');
  const https = require('https');
  const ProgressBar = require('cli-progress');
  const axios = require('axios');
  const PQueue = require('p-queue').default;
  console.log('✅ Imports de terceiros OK');
  
  console.log('3. Testando carregamento de config...');
  let credentials;
  try {
    credentials = require('./config.js');
    console.log('✅ Configurações carregadas do arquivo config.js');
  } catch (error) {
    console.error('❌ ERRO: Arquivo config.js não encontrado!');
    console.error('   Crie o arquivo config.js com suas credenciais Wasabi e Parla.app');
    console.error('   Use config.example.js como modelo');
    process.exit(1);
  }
  
  console.log('4. Testando configurações...');
  const VERSION = '2.0.7';
  const CONFIG = {
    WASABI: credentials.WASABI,
    PARLA: credentials.PARLA,
    UPLOAD: {
      MAX_CONCURRENT: 5,
      TIMEOUT: 15 * 60 * 1000,
      STABILITY_THRESHOLD: 2000,
      POLL_INTERVAL: 100,
      CHECK_INTERVAL: 100,
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY: 5000,
      API_DELAY: 200,
      LARGE_FILE_THRESHOLD: 100 * 1024 * 1024,
      LARGE_FILE_TIMEOUT: 30 * 60 * 1000,
      HEARTBEAT_INTERVAL: 30000,
      HEARTBEAT_TIMEOUT: 60000,
      MAX_HEARTBEAT_WARNINGS: 3,
      UPLOAD_CANCEL_TIMEOUT: 5 * 60 * 1000,
      MIN_PART_SIZE: 25 * 1024 * 1024,
      MAX_PART_SIZE: 100 * 1024 * 1024,
      INITIAL_QUEUE_SIZE: 4,
      MAX_QUEUE_SIZE: 6
    },
    MONITORING: {
      STATUS_INTERVAL: 60000,
      LOG_LEVELS: ['INFO', 'ERROR', 'WARN', 'FATAL', 'STATUS'],
      ENABLE_DETAILED_LOGS: false,
      SAVE_UPLOAD_STATS: true
    },
    PATHS: {
      VIDEO_DIR: 'videos',
      ENVIADOS_DIR: 'videos/enviados',
      ERROR_DIR: 'videos/erro',
      LOG_FILE: 'log-producao.txt'
    },
    PROGRESS_BAR: {
      FORMAT: '{fileName} [{bar}] {percentage}%',
      BAR_COMPLETE_CHAR: '█',
      BAR_INCOMPLETE_CHAR: '░',
      HIDE_CURSOR: true,
      CLEAR_ON_COMPLETE: true,
      SHOW_SPEED: false,
      SHOW_ETA: false
    },
    SECURITY: {
      VALIDATE_FILE_TYPES: true,
      ALLOWED_EXTENSIONS: ['.mp4', '.avi', '.mov', '.mkv'],
      MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024 // 10GB
    }
  };
  console.log('✅ Configurações criadas');
  
  console.log('5. Testando detecção de ambiente...');
  const isPkg = typeof process !== 'undefined' && process.pkg !== undefined;
  console.log('isPkg:', isPkg);
  
  console.log('6. Testando criação de pastas...');
  const VIDEO_DIR = CONFIG.PATHS.VIDEO_DIR;
  const ENVIADOS_DIR = CONFIG.PATHS.ENVIADOS_DIR;
  const ERROR_DIR = CONFIG.PATHS.ERROR_DIR;
  
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
    console.log('Pasta videos criada');
  }
  if (!fs.existsSync(ENVIADOS_DIR)) {
    fs.mkdirSync(ENVIADOS_DIR, { recursive: true });
    console.log('Pasta enviados criada');
  }
  if (!fs.existsSync(ERROR_DIR)) {
    fs.mkdirSync(ERROR_DIR, { recursive: true });
    console.log('Pasta erro criada');
  }
  console.log('✅ Pastas criadas/verificadas');
  
  console.log('✅ TODOS OS TESTES PASSARAM!');
  
} catch (error) {
  console.error('❌ ERRO NO TESTE MAIN:', error.message);
  console.error('Stack:', error.stack);
}

console.log('=== TESTE MAIN FINALIZADO ==='); 
