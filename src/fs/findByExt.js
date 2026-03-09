import { readdir, stat } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const getExt = () => {
  const index = process.argv.indexOf('--ext');
  if (index !== -1 && process.argv[index + 1]) {
    const ext = process.argv[index + 1];
    return ext.startsWith('.') ? ext : `.${ext}`;
  }
  return '.txt';
};

const collectByExt = async (basePath, dir, ext, results) => {
  const names = await readdir(dir);
  for (const name of names) {
    const fullPath = resolve(dir, name);
    const st = await stat(fullPath);
    if (st.isDirectory()) {
      await collectByExt(basePath, fullPath, ext, results);
    } else if (name.endsWith(ext)) {
      results.push(relative(basePath, fullPath).replace(/\\/g, '/'));
    }
  }
};

const findByExt = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const workspacePath = resolve(projectRoot, 'workspace');

  try {
    const results = [];
    await collectByExt(workspacePath, workspacePath, getExt(), results);
    results.sort();
    for (const path of results) {
      console.log(path);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('FS operation failed');
    } else {
      throw error;
    }
  }
};

await findByExt();
