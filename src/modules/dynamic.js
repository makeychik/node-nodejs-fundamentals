import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dynamic = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const pluginName = process.argv[2];
  if (!pluginName) {
    console.error('Plugin not found');
    process.exit(1);
  }

  try {
    const pluginPath = resolve(__dirname, 'plugins', `${pluginName}.js`);
    const plugin = await import(pathToFileURL(pluginPath).href);
    if (typeof plugin.run === 'function') {
      const result = plugin.run();
      console.log(result);
    } else {
      console.error('Plugin not found');
      process.exit(1);
    }
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'ENOENT') {
      console.error('Plugin not found');
      process.exit(1);
    }
    throw error;
  }
};

await dynamic();
