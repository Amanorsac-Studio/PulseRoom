// Launcher that avoids Windows cmd-shim issues with "&" in the folder name.
const { spawn } = require('child_process');
const electron = require('electron'); // resolves to the binary path under Node

spawn(electron, ['.'], { stdio: 'inherit', cwd: __dirname })
  .on('close', code => process.exit(code));
