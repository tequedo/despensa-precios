import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {argentinaDate} from '../price-safety.mjs';

// Offline evidence audit only. Never fetches, imports, publishes, notifies,
// changes schedules or renews any promotion's evidence timestamp.
const option = flag => {
  const i = process.argv.indexOf(flag);
  return i < 0 ? null : process.argv[i + 1];
};
const git = promisify(execFile);
const ref = option('--ref');
if (ref && !/^[a-f0-9]{40}$/.test(ref)) throw new Error('--ref requires an explicit commit SHA');
const sourceCommit = (await git('git',['rev-parse',ref??'HEAD'])).stdout.trim();
const files = ['san-juan-promotions','retailer-promotions-verified','partner-promotions-verified',
  'wallet-benefits-verified','promotion-matrix','price-refresh-history','sepa-provenance',
  'national-geography-audit'];
const source = {};
const hashes = {};
for (const name of files) {
  const bytes = ref ? Buffer.from((await git('git',['show',`${ref}:data/${name}.json`],{maxBuffer:2000000})).stdout) : await readFile(`data/${name}.json`);
  source[name] = JSON.parse(bytes);
  hashes[`data/${name}.json`] = createHash('sha256').update(bytes).digest('hex');
}
const candidates = source['san-juan-promotions'].promotions ?? [];
const verified = [...source['retailer-promotions-verified'].promotions ?? [],
  ...source['partner-promotions-verified'].promotions ?? []];
const benefits = source['wallet-benefits-verified'].benefits ?? [];
const history = source['price-refresh-history'];
const days = new Map((history.days ?? []).map(day=>[day.day,day]));
let streak = 0;
if (history.latestAttempt?.confirmed === true && history.latestAttempt.day === argentinaDate()) {
  for (let day = history.latestAttempt.day; days.get(day)?.confirmed === true;) {
    streak++;
    day = new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
  }
}
const report = {
  reportType:'window1_read_only_audit', checkedAt:new Date().toISOString(),sourceCommit,
  notice:'Snapshot audit; this report does not verify shelf prices or deploy code.',
  inputHashes:hashes,
  acquisition:{checkedAt:source['sepa-provenance'].checkedAt,
    sourceType:source['sepa-provenance'].sourceType,
    integrity:source['sepa-provenance'].status,
    originalComparison:source['sepa-provenance'].originalComparison,
    officialChannelRestored:history.officialChannelRestored===true},
  stability:{latestAttempt:history.latestAttempt,recordedStreak:history.consecutiveDaysConfirmed,
    confirmedStreakThroughToday:streak,sevenDaysProven:streak>=7,
    recordedDays:history.days?.length??0},
  productCandidates:{generatedAt:source['san-juan-promotions'].generatedAt,count:candidates.length,
    scopedLegacyKeys:candidates.filter(item=>String(item.ean).startsWith('sepa:')).length,
    missingExplicitBarcode:candidates.filter(item=>!item.barcode||!item.barcodeStatus).length,
    missingPresentation:candidates.filter(item=>!item.presentation).length,
    priceDates:[...new Set(candidates.map(item=>item.validDate))].sort(),
    verifiedProductProofs:verified.length},
  benefits:{generatedAt:source['wallet-benefits-verified'].generatedAt,
    verifiedTerms:benefits.length,automaticallyCalculable:benefits.filter(item=>item.calculationEligible===true).length,
    cappedWithoutPeriodOrOwner:benefits.filter(item=>item.capAmount!=null&&(!item.capPeriod||!item.capOwner)).length,
    unknownMinimum:benefits.filter(item=>!Number.isFinite(item.minimumPurchase)).length},
  publishedMatrix:{generatedAt:source['promotion-matrix'].generatedAt,summary:source['promotion-matrix'].summary},
  geography:{checkedAt:source['national-geography-audit'].checkedAt,rejectedStores:source['national-geography-audit'].rejectedCount},
};
const output = option('--output');
if (output) {
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
