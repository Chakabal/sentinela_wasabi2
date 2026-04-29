// teste-simples.js - Teste de compilação básico
console.log('=== TESTE SIMPLES INICIADO ===');
console.log('Versão: 2.0.7');
console.log('Teste de compilação básico');

try {
  const fs = require('fs');
  const path = require('path');
  
  console.log('✅ Imports básicos funcionando');
  
  // Teste de configuração
  const config = require('./config.js');
  console.log('✅ Configuração carregada');
  console.log('Bucket:', config.WASABI.BUCKET_NAME);
  
  console.log('✅ TESTE SIMPLES CONCLUÍDO COM SUCESSO!');
  
} catch (error) {
  console.error('❌ ERRO:', error.message);
  process.exit(1);
}

// Aguarda um pouco para não fechar imediatamente
setTimeout(() => {
  console.log('Finalizando teste...');
}, 2000); 