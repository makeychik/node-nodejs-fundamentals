import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const snapshot = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const workspacePath = resolve(projectRoot, 'workspace');
  const snapshotPath = resolve(projectRoot, 'snapshot.json');

  const entries = [];

  const scan = async (dir, basePath = '') => {
    const names = await readdir(dir);
    for (const name of names) {
      const fullPath = join(dir, name);
      const relPath = basePath ? `${basePath}/${name}` : name;
      const st = await stat(fullPath);
      if (st.isDirectory()) {
        entries.push({ path: relPath, type: 'directory' });
        await scan(fullPath, relPath);
      } else {
        const content = await readFile(fullPath);
        entries.push({
          path: relPath,
          type: 'file',
          size: st.size,
          content: content.toString('base64'),
        });
      }
    }
  };

  try {
    await scan(workspacePath);
    await writeFile(snapshotPath, JSON.stringify({ rootPath: workspacePath, entries }, null, 2), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('FS operation failed');
    } else {
      throw error;
    }
  }
};

await snapshot();
