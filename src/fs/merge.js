import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const merge = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const partsDir = resolve(projectRoot, 'workspace', 'parts');
  const mergedPath = resolve(projectRoot, 'workspace', 'merged.txt');

  let fileNames;
  const filesIndex = process.argv.indexOf('--files');
  if (filesIndex !== -1 && process.argv[filesIndex + 1]) {
    fileNames = process.argv[filesIndex + 1].split(',').map((name) => name.trim());
  } else {
    try {
      const names = await readdir(partsDir);
      fileNames = names.filter((name) => name.endsWith('.txt')).sort();
      if (fileNames.length === 0) {
        throw new Error('FS operation failed');
      }
    } catch (error) {
      if (error.message === 'FS operation failed') {
        throw error;
      }
      if (error.code === 'ENOENT') {
        throw new Error('FS operation failed');
      } else {
        throw error;
      }
    }
  }

  try {
    const contents = await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = resolve(partsDir, fileName);
        return await readFile(filePath, { encoding: 'utf-8' });
      })
    );
    const mergedContent = contents.join('');

    await mkdir(dirname(mergedPath), { recursive: true });
    await writeFile(mergedPath, mergedContent, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('FS operation failed');
    } else {
      throw error;
    }
  }
};

await merge();
