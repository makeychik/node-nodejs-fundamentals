import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const getLines = () => {
  const index = process.argv.indexOf('--lines');
  if (index !== -1 && process.argv[index + 1]) {
    return parseInt(process.argv[index + 1], 10) || 10;
  }
  return 10;
};

const split = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const maxLines = getLines();
  const sourcePath = resolve(projectRoot, 'source.txt');
  const readStream = createReadStream(sourcePath, 'utf8');
  const rl = createInterface({ input: readStream, crlfDelay: Infinity });

  let chunkNum = 0;
  const lineBuffer = [];

  const flushChunk = () => {
    if (lineBuffer.length === 0) {
      return;
    }
    chunkNum += 1;
    const outPath = resolve(projectRoot, `chunk_${chunkNum}.txt`);
    const writeStream = createWriteStream(outPath, 'utf8');
    const text = lineBuffer.map((line) => line + '\n').join('');
    writeStream.write(text);
    writeStream.end();
    lineBuffer.length = 0;
  };

  await new Promise((resolvePromise, reject) => {
    rl.on('line', (line) => {
      lineBuffer.push(line);
      if (lineBuffer.length >= maxLines) {
        flushChunk();
      }
    });
    rl.on('close', () => {
      if (lineBuffer.length > 0) {
        flushChunk();
      }
      resolvePromise();
    });
    rl.on('error', reject);
  });
};

await split();
