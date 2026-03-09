import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hashFile = (filePath) => {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolvePromise(hash.digest('hex')));
    stream.on('error', reject);
  });
};

const verify = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const checksumsPath = resolve(projectRoot, 'checksums.json');
  const baseDir = projectRoot;

  try {
    const data = await readFile(checksumsPath, { encoding: 'utf-8' });
    const checksums = JSON.parse(data);
    const entries = Object.entries(checksums);

    const results = await Promise.all(
      entries.map(async ([filename, expected]) => {
        const filePath = resolve(baseDir, filename);
        try {
          const actual = await hashFile(filePath);
          return { filename, ok: actual === expected };
        } catch {
          return { filename, ok: false };
        }
      })
    );
    for (const { filename, ok } of results) {
      console.log(`${filename} — ${ok ? 'OK' : 'FAIL'}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('FS operation failed');
    } else {
      throw error;
    }
  }
};

await verify();
