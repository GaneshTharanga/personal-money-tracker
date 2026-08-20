import { execFileSync } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import { stdin, stdout } from 'node:process';

const [username, mode = '--local'] = process.argv.slice(2);
if (!username || !/^[A-Za-z0-9_.-]{3,40}$/.test(username) || !['--local', '--remote'].includes(mode)) {
  console.error('Usage: npm run user:create -- <username> [--local|--remote]');
  console.error('Username: 3-40 letters, numbers, dot, underscore, or hyphen.');
  process.exit(1);
}

async function readPassword(prompt) {
  if (!stdin.isTTY) throw new Error('User creation must be run in an interactive terminal.');
  stdout.write(prompt); stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
  return new Promise((resolve) => {
    let value = '';
    function onData(char) {
      if (char === '\r' || char === '\n') {
        stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); stdout.write('\n'); resolve(value);
      } else if (char === '\u0003') process.exit(130);
      else if (char === '\u007f') { if (value) { value = value.slice(0, -1); stdout.write('\b \b'); } }
      else { value += char; stdout.write('*'); }
    }
    stdin.on('data', onData);
  });
}

const password = await readPassword('Password (minimum 8 characters): ');
if (password.length < 8) {
  console.error('Password must contain at least 8 characters.'); process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const sql = `INSERT INTO users (username, password_hash) VALUES ('${username}', '${hash}');`;
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
execFileSync(npx, ['wrangler', 'd1', 'execute', 'personal-money-tracker-db', mode, '--command', sql], { stdio: 'inherit' });
console.log(`User "${username}" created in the ${mode === '--remote' ? 'production' : 'local'} database.`);
