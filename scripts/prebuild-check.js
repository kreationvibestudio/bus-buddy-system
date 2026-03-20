// Pre-build script to ensure index.html is a file and clean up any conflicts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const distDir = path.join(rootDir, 'dist');

// Check if index.html exists and is a file
if (fs.existsSync(indexPath)) {
  const stat = fs.statSync(indexPath);
  if (!stat.isFile()) {
    console.error('ERROR: index.html exists but is not a file! It appears to be a directory.');
    console.error('This is likely a build artifact issue. Cleaning up...');
    
    // Try to remove if it's a directory
    try {
      if (stat.isDirectory()) {
        fs.rmSync(indexPath, { recursive: true, force: true });
        console.log('Removed index.html directory');
      }
    } catch (err) {
      console.error('Failed to remove index.html directory:', err.message);
    }
    process.exit(1);
  }
  console.log('✓ index.html is a valid file');
} else {
  console.error('ERROR: index.html not found!');
  process.exit(1);
}

// Clean dist directory to avoid conflicts
if (fs.existsSync(distDir)) {
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
  } catch (err) {
    console.warn('Warning: Could not clean dist directory:', err.message);
  }
}

// Ensure no index.html directory exists anywhere
const checkAndRemoveIndexHtmlDir = (dir) => {
  try {
    const indexPath = path.join(dir, 'index.html');
    if (fs.existsSync(indexPath)) {
      const stat = fs.statSync(indexPath);
      if (stat.isDirectory()) {
        console.log(`Found index.html directory at ${indexPath}, removing...`);
        fs.rmSync(indexPath, { recursive: true, force: true });
        console.log('✓ Removed index.html directory');
      }
    }
  } catch (err) {
    // Ignore errors
  }
};

// Check current directory and dist
checkAndRemoveIndexHtmlDir(rootDir);
checkAndRemoveIndexHtmlDir(distDir);

console.log('Pre-build checks passed');
