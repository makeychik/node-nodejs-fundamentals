import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const getPattern = () => {
  const index = process.argv.indexOf('--pattern');
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return '';
};

const filter = async () => {
  const pattern = getPattern();
  const regex = pattern ? new RegExp(pattern) : null;
  let buffer = '';

  const filterStream = new Transform({
    transform(chunk, _encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!regex || regex.test(line)) {
          this.push(line + '\n');
        }
      }
      callback();
    },
    flush(callback) {
      if (buffer.length > 0 && (!regex || regex.test(buffer))) {
        this.push(buffer + '\n');
      }
      callback();
    },
  });
  await pipeline(process.stdin, filterStream, process.stdout);
};

await filter();
