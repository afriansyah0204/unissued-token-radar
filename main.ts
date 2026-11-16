import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildRadar} from './lib/model.ts';
import {buildDossier} from './vendor/makefun-board.ts';
const here=fileURLToPath(new URL('.',import.meta.url));
const arg=(name:string,fallback:string)=>{const i=process.argv.indexOf('--'+name);return i<0?fallback:process.argv[i+1]??fallback;};
const input=arg('input','/input/snapshot.json');
const out=arg('output',process.env.MAKEFUN_OUTPUT_DIR??'/output');
const snapshot=JSON.parse(readFileSync(input.endsWith('.json')?input:join(input,'snapshot.json'),'utf8'));
const radar=buildRadar(snapshot);
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'board.json'),JSON.stringify({rows:radar.rows})+'\n');
writeFileSync(join(out,'data.js'),'window.RADAR='+JSON.stringify(radar).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n');
cpSync(join(here,'dashboard'),join(out,'dashboard'),{recursive:true});
const shots=join(here,'screenshots');
if(!existsSync(shots)||readdirSync(shots).filter(n=>/\.(png|jpe?g)$/.test(n)).length<3){
 throw new Error('screenshots/: at least 3 real dashboard captures are required before building a submission');
}
cpSync(shots,join(out,'screenshots'),{recursive:true});
writeFileSync(join(out,'dossier.json'),buildDossier(out,{text_max_bytes:65536,screenshots:{max:4,max_bytes:524288},dashboard:{max_files:400,max_bytes:4194304}}));
console.log(JSON.stringify({rows:radar.rows.length,watchlist:radar.watchlist_count,peers:radar.peer_count,output:out,dossier:existsSync(join(out,'dossier.json'))}));
