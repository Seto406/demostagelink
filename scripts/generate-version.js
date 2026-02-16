import fs from 'fs';
import path from 'path';

const versionFilePath = path.join(process.cwd(), 'public', 'version.json');
const version = Date.now().toString();

const versionData = {
  version,
};

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

console.log(`Version ${version} generated at ${versionFilePath}`);
