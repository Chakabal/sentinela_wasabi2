// teste.js - Teste simples para verificar configurações
console.log('=== TESTE INICIADO ===');

try {
  console.log('1. Testando carregamento de config.js...');
  const credentials = require('./config.js');
  console.log('✅ Configurações carregadas:', Object.keys(credentials));
  
  console.log('2. Testando configurações WASABI...');
  console.log('Bucket:', credentials.WASABI.BUCKET_NAME);
  console.log('Images Bucket:', credentials.WASABI.IMAGES_BUCKET_NAME);
  
  console.log('3. Testando configurações PARLA...');
  console.log('Token:', credentials.PARLA.TOKEN);
  
  console.log('✅ TODOS OS TESTES PASSARAM!');
  
} catch (error) {
  console.error('❌ ERRO NO TESTE:', error.message);
  console.error('Stack:', error.stack);
}

console.log('=== TESTE FINALIZADO ==='); 