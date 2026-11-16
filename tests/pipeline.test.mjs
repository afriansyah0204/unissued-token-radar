import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {cpSync,existsSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
const base='/home/ape/makefun-workspace/token-radar';
test('entrypoint creates deterministic board data and an offline dashboard',()=>{
 assert.ok(existsSync(join(base,'main.ts')),'main.ts must exist');
 const outputs=['/home/ape/makefun-workspace/setup/test-run-a','/home/ape/makefun-workspace/setup/test-run-b'];
 for(const out of outputs){
  rmSync(out,{recursive:true,force:true});
  const run=spawnSync(process.execPath,['main.ts','--input','/home/ape/makefun-workspace/kits/token-radar-01/token-radar-01-kit/input/snapshot.json','--output',out],{cwd:base,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  assert.ok(existsSync(join(out,'dashboard/index.html')));
  assert.ok(JSON.parse(readFileSync(join(out,'board.json'),'utf8')).rows.length>=100);
 }
 for(const file of ['board.json','data.js','dashboard/index.html','dashboard/app.js','dashboard/app.css','dossier.json','screenshots/1-board.jpg','screenshots/2-detail.jpg','screenshots/3-filtered.jpg']) assert.deepEqual(readFileSync(join(outputs[0],file)),readFileSync(join(outputs[1],file)),file+' bytes must repeat');
});
test('entrypoint fails clearly when required screenshots are absent',()=>{
 const isolated=mkdtempSync('/home/ape/.hermes/cache/scratch/radar-missing-shots-');
 try{
  for(const name of ['main.ts','lib','vendor','dashboard']) cpSync(join(base,name),join(isolated,name),{recursive:true});
  const run=spawnSync(process.execPath,['main.ts','--input','/home/ape/makefun-workspace/kits/token-radar-01/token-radar-01-kit/input/snapshot.json','--output',join(isolated,'out')],{cwd:isolated,encoding:'utf8'});
  assert.notEqual(run.status,0,'a build without screenshots must not report success');
  assert.match(run.stderr,/screenshots/);
 }finally{rmSync(isolated,{recursive:true,force:true});}
});
