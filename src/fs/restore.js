import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const restore = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const snapshotPath = resolve(projectRoot, 'snapshot.json');
  const restorePath = resolve(projectRoot, 'workspace_restored');

  await mkdir(projectRoot, { recursive: true });
  try {
    await mkdir(restorePath, { recursive: false });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error('FS operation failed');
    }
    throw error;
  }

  let data;
  try {
    data = await readFile(snapshotPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('FS operation failed');
    }
    throw error;
  }
  const snapshot = JSON.parse(data);

  for (const entry of snapshot.entries) {
    const fullPath = resolve(restorePath, entry.path);
    if (entry.type === 'directory') {
      await mkdir(fullPath, { recursive: true });
    } else {
      await mkdir(dirname(fullPath), { recursive: true });
      const buf = Buffer.from(entry.content, 'base64');
      await writeFile(fullPath, buf);
    }
  }
};

await restore();
