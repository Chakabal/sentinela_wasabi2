const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const sourcePath = path.join(rootDir, 'config.js');
const outputPath = path.join(rootDir, 'embedded-config.js');

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
  fail('ERRO: config.js local nao encontrado. Copie config.example.js para config.js e preencha as credenciais antes do build.');
}

let config;
try {
  config = require(sourcePath);
} catch (error) {
  fail(`ERRO: config.js invalido: ${error.message}`);
}

const requiredPaths = [
  ['WASABI', 'ACCESS_KEY_ID'],
  ['WASABI', 'SECRET_ACCESS_KEY'],
  ['WASABI', 'BUCKET_NAME'],
  ['WASABI', 'IMAGES_BUCKET_NAME'],
  ['WASABI', 'REGION'],
  ['WASABI', 'ENDPOINT'],
  ['PARLA', 'TOKEN'],
  ['PARLA', 'WEBHOOK'],
  ['PARLA', 'TRANSFERRING_WEBHOOK']
];

for (const pathParts of requiredPaths) {
  const value = pathParts.reduce((current, key) => current && current[key], config);
  if (!value || typeof value !== 'string') {
    fail(`ERRO: config.js sem valor valido para ${pathParts.join('.')}`);
  }
}

const content = `// Arquivo gerado automaticamente por build-embedded-config.js.
// Nao commitar. As credenciais aqui serao empacotadas dentro do executavel.
module.exports = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(outputPath, content);
console.log(`Configuracao embutida gerada: ${outputPath}`);
