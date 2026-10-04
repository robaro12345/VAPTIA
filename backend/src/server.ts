import dotenv from 'dotenv';
import path from 'path';

// Prioritize root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import { getDocumentsDir, getUploadsDir } from './services/storage';

const PORT = parseInt(process.env.PORT || '5000', 10);
const APP_VERSION = process.env.APP_VERSION || 'v1';

// Ensure storage directories exist at startup
getDocumentsDir();
getUploadsDir();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  CampusHub Security Laboratory Backend Server`);
  console.log(`=======================================================`);
  console.log(`  Running on:           http://localhost:${PORT}`);
  console.log(`  Active Env Version:   ${APP_VERSION.toUpperCase()}`);
  console.log(`  V1 Endpoints:         http://localhost:${PORT}/api/v1/* (Vulnerable)`);
  console.log(`  V2 Endpoints:         http://localhost:${PORT}/api/v2/* (Hardened)`);
  console.log(`  Documents Storage:    ${getDocumentsDir()}`);
  console.log(`  Uploads Storage:      ${getUploadsDir()}`);
  console.log(`=======================================================`);
});
