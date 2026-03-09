import { parentPort, workerData } from 'node:worker_threads';

const sendResult = () => {
  const data = workerData?.chunk ?? [];
  const sorted = [...data].sort((a, b) => a - b);
  parentPort.postMessage(sorted);
};

sendResult();
