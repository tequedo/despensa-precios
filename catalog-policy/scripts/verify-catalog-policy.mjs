import fs from 'node:fs';
import {createHash} from 'node:crypto';
export function verifyCatalogPolicy(root=new URL('../',import.meta.url)){
 const manifest=JSON.parse(fs.readFileSync(new URL('data/catalog-policy-manifest.json',root),'utf8'));
 if(!manifest.version||Object.keys(manifest.files??{}).length<8)throw new Error('Catalog policy manifest is incomplete');
 for(const [path,expected] of Object.entries(manifest.files)){
  const actual=createHash('sha256').update(fs.readFileSync(new URL(path,root))).digest('hex');
  if(actual!==expected)throw new Error('Catalog rules changed without updating their shared policy: '+path);
 }
 return manifest;
}
console.log('Catalog policy verified: '+verifyCatalogPolicy().version);
