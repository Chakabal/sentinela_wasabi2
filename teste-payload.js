// teste-payload.js - Teste do payload Parla.app
const axios = require('axios');

console.log('=== TESTE PAYLOAD PARLA.APP ===');

// Teste 1: Payload com b2_file_id (correto)
async function testePayloadCorreto() {
  try {
    console.log('\n🔍 TESTE 1: Payload com b2_file_id (correto)');
    
    const payloadCorreto = {
      "token": "test_token_parla_app_2025",
      "arquivo": "20250805--CORONEL-MEIRA-45.mp4",
      "b2_file_id": "62390d2a0ba3041f604469f2619ba9aa-4",
      "b2_url": "https://videos.parla.app/CORONEL-MEIRA/20250805--CORONEL-MEIRA-45.mp4",
      "durationSec": "157",
      "durationFormated": "2m37s",
      "sizeMB": "103.27",
      "imagem": "https://imagens.parla.app/CORONEL-MEIRA/20250805--CORONEL-MEIRA-45.jpg"
    };
    
    console.log('📤 Payload correto:');
    console.log(JSON.stringify(payloadCorreto, null, 2));
    
    const response = await axios.post('https://parla.app/api/1.1/wf/b2_source', payloadCorreto, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Resposta:', response.data);
    
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Resposta:', error.response?.data);
    console.log('❌ Headers:', error.response?.headers);
  }
}

// Teste 2: Payload com b2_file_id (sem aspas)
async function testePayloadSemAspas() {
  try {
    console.log('\n🔍 TESTE 2: Payload com b2_file_id (sem aspas)');
    
    const payloadSemAspas = {
      "token": "test_token_parla_app_2025",
      "arquivo": "20250805--CORONEL-MEIRA-45.mp4",
      "b2_file_id": "62390d2a0ba3041f604469f2619ba9aa-4",
      "b2_url": "https://videos.parla.app/CORONEL-MEIRA/20250805--CORONEL-MEIRA-45.mp4",
      "durationSec": "157",
      "durationFormated": "2m37s",
      "sizeMB": "103.27",
      "imagem": "https://imagens.parla.app/CORONEL-MEIRA/20250805--CORONEL-MEIRA-45.jpg"
    };
    
    console.log('📤 Payload sem aspas:');
    console.log(JSON.stringify(payloadSemAspas, null, 2));
    
    const response = await axios.post('https://parla.app/api/1.1/wf/b2_source', payloadSemAspas, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Resposta:', response.data);
    
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Resposta:', error.response?.data);
    console.log('❌ Headers:', error.response?.headers);
  }
}

// Teste 3: Payload mínimo (apenas campos essenciais)
async function testePayloadMinimo() {
  try {
    console.log('\n🔍 TESTE 3: Payload mínimo (apenas campos essenciais)');
    
    const payloadMinimo = {
      "token": "test_token_parla_app_2025",
      "arquivo": "20250805--CORONEL-MEIRA-45.mp4",
      "b2_file_id": "62390d2a0ba3041f604469f2619ba9aa-4",
      "b2_url": "https://videos.parla.app/CORONEL-MEIRA/20250805--CORONEL-MEIRA-45.mp4",
      "durationSec": "157",
      "durationFormated": "2m37s",
      "sizeMB": "103.27"
    };
    
    console.log('📤 Payload mínimo:');
    console.log(JSON.stringify(payloadMinimo, null, 2));
    
    const response = await axios.post('https://parla.app/api/1.1/wf/b2_source', payloadMinimo, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Resposta:', response.data);
    
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Resposta:', error.response?.data);
    console.log('❌ Headers:', error.response?.headers);
  }
}

// Executa os testes
async function executarTestes() {
  await testePayloadCorreto();
  await testePayloadSemAspas();
  await testePayloadMinimo();
  
  console.log('\n=== FIM DOS TESTES ===');
}

executarTestes().catch(console.error); 