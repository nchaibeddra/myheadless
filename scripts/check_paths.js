const path = require('path');
const fs = require('fs');

const srcDir = path.join(__dirname, '..', 'src');
const projectRoot = path.join(__dirname, '..');

const checks = [
  {label: 'src/public', p: path.join(srcDir, 'public')},
  {label: 'root/public', p: path.join(projectRoot, 'public')},
  {label: 'src/uploads', p: path.join(srcDir, 'uploads')},
  {label: 'root/uploads', p: path.join(projectRoot, 'uploads')}
];

console.log('Vérification des emplacements attendus pour public/uploads');
for (const c of checks) {
  console.log(`${c.label}: ${c.p} -> ${fs.existsSync(c.p) ? 'EXISTE' : 'MANQUANT'}`);
}

console.log('\n__dirname (script):', __dirname);
console.log('cwd:', process.cwd());

// Print suggestion
// Show the exact decision logic used by the server (same as src/index.js)
const projectRootDecider = path.resolve(__dirname, '..');
const candidatePublicRootDecider = path.join(projectRootDecider, 'public');
const candidateUploadsRootDecider = path.join(projectRootDecider, 'uploads');
const publicDirRes = fs.existsSync(candidatePublicRootDecider) ? candidatePublicRootDecider : path.join(srcDir, 'public');
const uploadsDirRes = fs.existsSync(candidateUploadsRootDecider) ? candidateUploadsRootDecider : path.join(srcDir, 'uploads');

console.log('\nServe static public dir chosen by logic:', publicDirRes);
console.log('Uploads dir chosen by logic:', uploadsDirRes);
