import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { APPLICATION_ID, ORIGIN, releasePreflight } from '../mobile/android/release-preflight.mjs';

// Synthetic proof is used only in this test, never deployed as asset links.
const fingerprint=createHash('sha256').update('unit-test-only-not-a-certificate').digest('hex').toUpperCase().match(/../g).join(':');
const env={RINDECASA_UPLOAD_KEYSTORE:'/private/test-upload-key',RINDECASA_UPLOAD_STORE_PASSWORD:'secret-store',RINDECASA_UPLOAD_KEY_ALIAS:'upload',RINDECASA_UPLOAD_KEY_PASSWORD:'secret-key',RINDECASA_APPLICATION_ID_CONFIRMED:APPLICATION_ID,RINDECASA_PLAY_SIGNING_SHA256:fingerprint};
const assetLinks=[{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:APPLICATION_ID,sha256_cert_fingerprints:[fingerprint]}}];
test('missing owner inputs block release and never expose secret values',()=>{
  const r=releasePreflight({env:{}});assert.equal(r.readyForSignedBuild,false);assert.equal(r.readyForPlaySubmission,false);assert.ok(r.blockers.length>=7);
  assert.equal(JSON.stringify(releasePreflight({env})).includes('secret-key'),false);
});
test('a fully matched input allows signed build only, not a Play submission',()=>{
  const r=releasePreflight({env,assetLinks,fileExists:()=>true});assert.equal(r.readyForSignedBuild,true);assert.equal(r.readyForPlaySubmission,false);
});
test('wrong package, missing files, debug key and placeholder fingerprint never pass',()=>{
  for(const delta of [{RINDECASA_APPLICATION_ID_CONFIRMED:'other.app'},{RINDECASA_UPLOAD_KEY_ALIAS:'androiddebugkey'},{RINDECASA_PLAY_SIGNING_SHA256:'00:'.repeat(31)+'00'},{RINDECASA_UPLOAD_KEY_PASSWORD:''}]) assert.equal(releasePreflight({env:{...env,...delta},assetLinks,fileExists:()=>true}).readyForSignedBuild,false);
  assert.equal(releasePreflight({env,assetLinks,fileExists:()=>false}).readyForSignedBuild,false);
  const wrong=[{...assetLinks[0],target:{...assetLinks[0].target,package_name:'other.app'}}];
  assert.equal(releasePreflight({env,assetLinks:wrong,fileExists:()=>true}).readyForSignedBuild,false);
  assert.equal(releasePreflight({env,assetLinks:[null,{relation:'wrong'}],fileExists:()=>true}).readyForSignedBuild,false);
});
test('manifest and signing gate preserve the same origin and avoid debug signing',()=>{
  const manifest=readFileSync(new URL('../mobile/android/app/src/main/AndroidManifest.xml',import.meta.url),'utf8');
  assert.ok(manifest.includes(ORIGIN));
  const gradle=readFileSync(new URL('../mobile/android/app/build.gradle',import.meta.url),'utf8');
  assert.ok(gradle.includes(`applicationId '${APPLICATION_ID}'`));assert.ok(gradle.includes('if (signedRelease) signingConfig signingConfigs.upload'));assert.equal(gradle.includes('signingConfigs.debug'),false);
});
