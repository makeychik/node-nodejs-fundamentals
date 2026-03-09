const parseArg = (name, defaultVal, parse = Number) => {
  const i = process.argv.indexOf(name);
  if (i !== -1 && process.argv[i + 1] != null) {
    const v = parse(process.argv[i + 1]);
    return Number.isNaN(v) ? defaultVal : v;
  }
  return defaultVal;
};

const isValidHexColor = (s) => /^#[0-9A-Fa-f]{6}$/.test(s);

const progress = () => {
  const duration = parseArg('--duration', 5000);
  const interval = parseArg('--interval', 100);
  const length = parseArg('--length', 30);
  const colorArg = process.argv[process.argv.indexOf('--color') + 1];
  const color = isValidHexColor(colorArg) ? colorArg : null;

  const steps = Math.max(1, Math.floor(duration / interval));
  let step = 0;

  const id = setInterval(() => {
    step += 1;
    const pct = Math.min(100, Math.round((step / steps) * 100));
    const filled = Math.round((pct / 100) * length);
    const barFilled = '█'.repeat(filled);
    const barEmpty = ' '.repeat(length - filled);
    const colorStart = color ? `\x1b[38;2;${parseInt(color.slice(1, 3), 16)};${parseInt(color.slice(3, 5), 16)};${parseInt(color.slice(5, 7), 16)}m` : '';
    const colorEnd = color ? '\x1b[0m' : '';
    process.stdout.write(`\r[${colorStart}${barFilled}${colorEnd}${barEmpty}] ${pct}%`);
    if (step >= steps) {
      clearInterval(id);
      process.stdout.write('\nDone!\n');
    }
  }, interval);
};

progress();
