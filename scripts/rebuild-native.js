const os = require('os');
const { resolve } = require('path');
const { execSync } = require('child_process');
const { pathExistsSync, copySync, removeSync } = require('fs-extra');
const argv = require('yargs').argv;

const nativeModules = [
  resolve(__dirname, '../node_modules/node-pty'),
  resolve(__dirname, '../node_modules/nsfw'),
  resolve(__dirname, '../node_modules/spdlog')
]

let commands;

const target = argv.target || 'node';
const arch = argv.arch || os.arch();
let version;

if (target === 'electron') {

  version = argv.electronVersion || require('electron/package.json').version;

  console.log('rebuilding native for electron version ' + version);

  if (os.platform() === 'win32') {
    commands = [
      'set HOME=~/.electron-gyp',
      resolve(__dirname, '..\\node_modules\\.bin\\electron-rebuild.cmd'),
    ];
  } else {
    commands = [
      `npm_config_arch=${arch}`,
      `npm_config_target_arch=${arch}`,
      'HOME=~/.electron-gyp',
      resolve(__dirname, '../node_modules/.bin/electron-rebuild'),
    ];
  }
} else if (target === 'node') {

  console.log('rebuilding native for node version ' + process.version);

  version = process.version;

  commands = ['node-gyp', 'rebuild']

}

function rebuildModule(modulePath, type, version) {
  const info = require(resolve(modulePath, './package.json'));
  console.log('rebuilding ' + info.name)
  const cache = getBuildCacheDir(modulePath, type, version, target);
  if (pathExistsSync(cache) && !argv['force-rebuild']) {
    console.log('cache found for ' + info.name)
    copySync(cache, resolve(modulePath, 'build'));
  }
  else {
    const command = commands.join(' ');
    console.log(command);
    execSync(command, {
      cwd: modulePath,
      HOME: target === 'electron' ? '~/.electron-gyp' : undefined
    });
    removeSync(cache);
    copySync(resolve(modulePath, 'build'), cache);
  }
}

function getBuildCacheDir(modulePath, type, version, target) {
  const info = require(resolve(modulePath, './package.json'));
  return resolve(require('os').tmpdir(), 'ide_build_cache', target, info.name + '-' + info.version, type + '-' + version);
}


nativeModules.forEach(path => {
  rebuildModule(path, target, version);
});
