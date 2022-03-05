const os = require('os');
const { join } = require('path');
const { execSync, exec } = require('child_process');
const { pathExistsSync, copySync, removeSync } = require('fs-extra');
const argv = require('yargs').argv;

const nativeModules = [
  'node-pty',
  'nsfw',
  'spdlog',
  'keytar',
];

let commands;

const target = argv.target || 'node';
const force = argv['force-rebuild'] === 'true';
const arch = argv.arch || os.arch();
const version = argv.electronVersion || require('electron/package.json').version;

console.log('rebuilding native for electron version ' + version);

if (os.platform() === 'win32') {
  commands = [
    'set HOME=~/.electron-gyp',
    join(__dirname, '..\\node_modules\\.bin\\electron-rebuild.cmd'),
  ];
} else {
  commands = [
    `npm_config_arch=${arch}`,
    `npm_config_target_arch=${arch}`,
    'HOME=~/.electron-gyp',
    join(__dirname, '../node_modules/.bin/electron-rebuild'),
  ];
}

if (force) {
  commands.push('-f');
}

nativeModules.forEach(moduleName => {
  const command = `${commands.join(' ')} ${moduleName}`;
  execSync(command);
  const modulePath = join(__dirname, moduleName);
  console.log('ls cwd >>>', execSync(`ls ${modulePath}`).toString());
});
