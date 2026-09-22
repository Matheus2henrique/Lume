import { spawn } from 'child_process';

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [], { shell: true });
    let data = '';
    proc.stdout.on('data', (d) => data += d.toString());
    proc.stderr.on('data', (d) => data += d.toString());
    proc.on('close', (code) => {
      if (code === 0) resolve(data.trim());
      else reject(new Error(`Command failed with code ${code}: ${data}`));
    });
  });
}

async function main() {
  try {
    // Check what's running on port 5434, 5432, 5438
    console.log('Checking ports...');
    
    // Try to find postgres processes
    const psOutput = await runCommand('tasklist 2>/dev/null | grep -i postgres');
    console.log('PostgreSQL processes:', psOutput || 'None found');
    
    // Check network connections
    const connections = await runCommand('netstat -an 2>/dev/null | grep -E "543[2348]"');
    console.log('Connections on ports 5432/5434/5438:', connections || 'None');
    
    // Try pg_isready or psql
    try {
      const ready = await runCommand('pg_isready -h localhost -p 5434 2>&1');
      console.log('pg_isready 5434:', ready);
    } catch(e) {
      console.log('pg_isready 5434: Error', e.message);
    }
    
    try {
      const ready = await runCommand('pg_isready -h localhost -p 5438 2>&1');
      console.log('pg_isready 5438:', ready);
    } catch(e) {
      console.log('pg_isready 5438: Error', e.message);
    }
    
    try {
      const ready = await runCommand('pg_isready -h localhost -p 5432 2>&1');
      console.log('pg_isready 5432:', ready);
    } catch(e) {
      console.log('pg_isready 5432: Error', e.message);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
