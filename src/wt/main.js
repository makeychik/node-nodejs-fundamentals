import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

const kWayMerge = (chunks) => {
  const result = [];
  const indices = chunks.map(() => 0);
  const k = chunks.length;
  while (true) {
    let minVal = Infinity;
    let minIdx = -1;
    for (let i = 0; i < k; i++) {
      if (indices[i] < chunks[i].length && chunks[i][indices[i]] < minVal) {
        minVal = chunks[i][indices[i]];
        minIdx = i;
      }
    }
    if (minIdx === -1) {
      break;
    }
    result.push(minVal);
    indices[minIdx] += 1;
  }
  return result;
};

const main = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..', '..');
  const dataPath = resolve(projectRoot, 'data.json');
  const workerFilePath = resolve(__dirname, 'worker.js');

  const data = await readFile(dataPath, { encoding: 'utf-8' });
  const arr = JSON.parse(data);
  if (!Array.isArray(arr)) {
    console.log(JSON.stringify([]));
    return;
  }
  const numWorkers = Math.min(cpus().length, Math.max(1, arr.length));
  const chunkSize = Math.ceil(arr.length / numWorkers);

  const runWorker = (chunk) =>
    new Promise((resolve, reject) => {
      const worker = new Worker(workerFilePath, { workerData: { chunk }, eval: false });
      let result;

      worker.once('message', (msg) => {
        result = msg;
        worker.terminate();
      });
      worker.once('error', reject);
      worker.once('exit', (code) => {
        if (code === 0) {
          resolve(result ?? []);
        } else {
          resolve([]);
        }
      });
    });

  const sortedChunks = [];
  for (let i = 0; i < numWorkers; i++) {
    const chunk = arr.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length) {
      sortedChunks.push(await runWorker(chunk));
    }
  }
  const merged = kWayMerge(sortedChunks);
  console.log(JSON.stringify(merged));
};

await main();
