import { spawn } from 'node:child_process';

const execCommand = () => {
  const cmdArg = process.argv[2];
  if (cmdArg == null || cmdArg === '') {
    process.exit(1);
  }

  const child = spawn(cmdArg, [], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.once('exit', (code, signal) => {
    if (code !== null) {
      process.exit(code);
    }
    if (signal) {
      process.kill(process.pid, signal);
    }
  });
};

execCommand();
