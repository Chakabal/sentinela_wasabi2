// config.example.js - Exemplo de configuracao do Sentinela Wasabi
// Copie este arquivo para config.js e preencha suas credenciais.

module.exports = {
  // CONFIGURACOES WASABI
  WASABI: {
    ACCESS_KEY_ID: 'sua_access_key_id_aqui',
    SECRET_ACCESS_KEY: 'sua_secret_access_key_aqui',
    BUCKET_NAME: 'videos.parla.app',
    IMAGES_BUCKET_NAME: 'imagens.parla.app',
    REGION: 'us-east-1',
    ENDPOINT: 'https://s3.us-east-1.wasabisys.com'
  },

  // CONFIGURACOES PARLA.APP
  PARLA: {
    TOKEN: 'seu_token_parla_aqui',
    WEBHOOK: 'https://parla.app/api/1.1/wf/b2_source',
    TRANSFERRING_WEBHOOK: 'https://parla.app/api/1.1/wf/istransfering'
  }
};

/*
INSTRUCOES:

1. Copie este arquivo para config.js:
   cp config.example.js config.js

2. Edite config.js e preencha suas credenciais reais.

3. NUNCA commite o arquivo config.js no git.

4. Para desenvolvimento, use suas credenciais de teste.
5. Para producao, use suas credenciais reais.

CREDENCIAIS WASABI:
- ACCESS_KEY_ID: Access Key criada no painel do Wasabi
- SECRET_ACCESS_KEY: Secret Key correspondente
- BUCKET_NAME: Bucket onde os videos serao enviados
- IMAGES_BUCKET_NAME: Bucket onde as thumbnails serao enviadas
- REGION: Regiao do bucket (ex: us-east-1)
- ENDPOINT: Endpoint S3 compativel do Wasabi

CREDENCIAIS PARLA.APP:
- TOKEN: Token de autenticacao do Parla.app
- WEBHOOK: URL do webhook para notificacao de upload
- TRANSFERRING_WEBHOOK: URL do webhook para status de transferencia

Observacao: os webhooks do Parla.app ainda podem usar nomes historicos
como b2_source, b2_file_id e b2_url. Eles sao contratos da API externa,
mesmo com o storage atual em Wasabi.
*/
