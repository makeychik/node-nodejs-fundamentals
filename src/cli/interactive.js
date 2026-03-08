import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const interactive = () => {
  const rl = createInterface({ input: stdin, output: stdout });
  const startTime = Date.now();

  const handleCommand = (line) => {
    const cmd = (line || '').trim().toLowerCase();
    switch (cmd) {
      case 'uptime': {
        const sec = (Date.now() - startTime) / 1000;
        console.log(`Uptime: ${sec.toFixed(2)}s`);
        break;
      }
      case 'cwd':
        console.log(process.cwd());
        break;
      case 'date':
        console.log(new Date().toISOString());
        break;
      case 'exit':
        rl.close();
        return;
      case '':
        break;
      default:
        console.log('Unknown command');
    }
  };

  const exit = () => {
    console.log('Goodbye!');
    rl.close();
    process.exit(0);
  };

  const showPrompt = () => stdout.write('> ');

  rl.on('line', (line) => {
    handleCommand(line);
    if (process.exitCode == null) {
      showPrompt();
    }
  });
  rl.on('close', exit);
  process.on('SIGINT', exit);

  showPrompt();
};

interactive();
