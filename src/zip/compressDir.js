import { readdir, stat, mkdir } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createBrotliCompress } from 'node:zlib';
import { dirname, resolve, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const buildManifest = async (dir, basePath = '') => {
  const names = await readdir(dir);
  const parts = await Promise.all(
    names.map(async (name) => {
      const fullPath = join(dir, name);
      const relPath = basePath ? `${basePath}/${name}` : name;
      const st = await stat(fullPath);
      if (st.isDirectory()) {
        const sub = await buildManifest(fullPath, relPath);
        return [{ path: relPath, type: 'dir' }, ...sub];
      }
      return [{ path: relPath, type: 'file', size: st.size }];
    })
  );
  return parts.flat();
};

const compressDir = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const toCompressPath = resolve(projectRoot, 'workspace', 'toCompress');
  const outDir = resolve(projectRoot, 'workspace', 'compressed');
  const archivePath = resolve(outDir, 'archive.br');

  try {
    const manifest = await buildManifest(toCompressPath);
    await mkdir(outDir, { recursive: true });

    const manifestLine = JSON.stringify(manifest) + '\n';
    const compress = createBrotliCompress();
    const out = createWriteStream(archivePath);
    const fileEntries = manifest.filter((entry) => entry.type === 'file');
    const readable = Readable.from(
      (async function* () {
        yield Buffer.from(manifestLine, 'utf8');
        for (const entry of fileEntries) {
          const fullPath = resolve(toCompressPath, entry.path);
          const stream = createReadStream(fullPath);
          for await (const chunk of stream) yield chunk;
        }
      })()
    );
    await pipeline(readable, compress, out);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('FS operation failed');
    } else {
      throw error;
    }
  }
};

await compressDir();
