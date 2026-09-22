import { spawn } from 'child_process';

function run(cmd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, [], { shell: true });
    let out = '', err = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('close', code => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`Error: ${err}`));
    });
  });
}

async function main() {
  // Verificar portas
  await run('netstat -an 2>/dev/null | find "5434"');
  await run('netstat -an 2>/dev/null | find "5438"');
  await run('netstat -an 2>/dev/null | find "5432"');
  
  // Tentar pg_isready
  try { 
    const r = await run('pg_isready -h localhost -p 5434 2>&1');
    console.log('pg_isready 5434:', r.out, r.err); 
  } catch(e) { console.log('pg_isready 5434 erro:', e.message); }
  
  try { 
    const r = await run('pg_isready -h localhost -p 5432 2>&1'); 
    console.log('pg_isready 5432:', r.out, r.err); 
  } catch(e) { console.log('pg_isready 5432 erro:', e.message); }
  
  // Verificar serviços
  try { 
    const r = await run('sc query postgresql 2>&1'); 
    console.log('Service:', r.out, r.err); 
  } catch(e) { console.log('Service erro:', e.message); }
  
  // Listar processos
  try { 
    const r = await run('tasklist 2>/dev/null'); 
    console.log('Processos:', r.out); 
  } catch(e) { console.log('Processo erro:', e.message); }
}

main();
