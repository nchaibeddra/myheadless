// Fichier d'exécution pour cPanel/o2switch
// Génération automatique du client Prisma si nécessaire
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Vérifier si le client Prisma est généré
const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client', 'index.js');
const prismaBinPath = path.join(__dirname, 'node_modules', '.bin', 'prisma');

if (!fs.existsSync(prismaClientPath)) {
  console.log('Génération du client Prisma...');
  try {
    // Essayer d'utiliser le binaire local d'abord
    if (fs.existsSync(prismaBinPath)) {
      execSync(`"${prismaBinPath}" generate`, { stdio: 'inherit', cwd: __dirname });
    } else {
      // Sinon, utiliser npx (peut ne pas fonctionner avec node_modules partagés)
      execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
    }
    console.log('Client Prisma généré avec succès.');
  } catch (error) {
    console.error('Erreur lors de la génération du client Prisma:', error.message);
    console.log('Tentative de continuation... Le client peut être généré ailleurs.');
  }
}

// Charger l'application principale
require('./src/index.js');

