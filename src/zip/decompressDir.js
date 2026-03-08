import { writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createBrotliDecompress } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const decompressDir = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const compressedDir = resolve(projectRoot, 'workspace', 'compressed');
  const archivePath = resolve(compressedDir, 'archive.br');
  const outDir = resolve(projectRoot, 'workspace', 'decompressed');

  try {
    await mkdir(outDir, { recursive: true });

    const chunks = [];
    const archiveStream = createReadStream(archivePath);
    const decompress = createBrotliDecompress();
    const collector = new Writable({
      write(chunk, enc, callback) {
        chunks.push(chunk);
        callback();
      },
    });
    await pipeline(archiveStream, decompress, collector);

    const buffer = Buffer.concat(chunks);
    const newline = buffer.indexOf('\n');
    const manifestLine = buffer.subarray(0, newline).toString('utf8');
    const manifest = JSON.parse(manifestLine);
    let offset = newline + 1;

    for (const entry of manifest) {
      const fullPath = resolve(outDir, entry.path);
      if (entry.type === 'dir') {
        await mkdir(fullPath, { recursive: true });
      } else {
        await mkdir(dirname(fullPath), { recursive: true });
        const size = entry.size || 0;
        const slice = buffer.subarray(offset, offset + size);
        offset += size;
        await writeFile(fullPath, slice);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('FS operation failed');
    } else {
      throw error;
    }
  }
};

await decompressDir();
