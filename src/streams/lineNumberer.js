import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const lineNumberer = async () => {
  let lineNum = 0;
  let buffer = '';
  const lineNumbererStream = new Transform({
    transform(chunk, _encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        lineNum += 1;
        this.push(`${lineNum} | ${line}\n`);
      }
      callback();
    },
    flush(callback) {
      if (buffer.length > 0) {
        lineNum += 1;
        this.push(`${lineNum} | ${buffer}\n`);
      }
      callback();
    },
  });
  await pipeline(process.stdin, lineNumbererStream, process.stdout);
};

await lineNumberer();
