'use strict';
const assert=require('node:assert/strict');
const {TIMES,VIBES,recommend,validPlace,rankPlaces,officialURL,validPhoto}=require('./app.js');
require('./data.js');
const data=globalThis.COAST_DATA;
let combinations=0,alternatives=0;
assert.equal(data.length,5);assert.ok(data.every(validPlace));
for(const time of Object.keys(TIMES))for(const vibe of Object.keys(VIBES)){
  const pick=recommend(data,time,vibe);assert.ok(!pick.error,`${time}/${vibe}`);
  assert.ok(pick.place.vibes.includes(vibe));assert.equal(pick.partial,!pick.place.times.includes(time));
  assert.deepEqual(pick,recommend(data,time,vibe),'deterministic selection');
  const ranked=rankPlaces(data,time,vibe);
  if(ranked.some(p=>p.times.includes(time)))assert.ok(pick.place.times.includes(time));
  if(vibe==='surf')assert.match(pick.note,/not a recommendation to enter the water/);
  for(const p of ranked){assert.equal(recommend(data,time,vibe,p.id).place.id,p.id);alternatives++;}
  combinations++;
}
for(const invalid of [undefined,null,[],{},[data[0],data[0]],[{...data[0],name:''}],[{...data[0],source:'javascript:alert(1)'}],[{...data[0],vibes:['flight']}]])assert.ok(recommend(invalid,'morning','relax').error);
for(const [time,vibe] of [['night','relax'],['morning','flight'],['__proto__','relax'],[null,null]])assert.ok(recommend(data,time,vibe).error);
assert.ok(recommend(data,'morning','relax','missing').error);
assert.ok(recommend(data,'morning','surf','avila').error);
assert.ok(recommend([data[1]],'morning','surf').error);
for(const p of data){assert.ok(officialURL(p.accessSource));assert.ok(p.access&&p.mapQuery&&p.prompt);}
for(const url of ['javascript:alert(1)','https://parks.ca.gov.evil.com/','http://www.parks.ca.gov/','https://example.com/'])assert.equal(officialURL(url),false);
for(const p of data){assert.ok(validPhoto(p.photo));const bytes=require('node:fs').readFileSync(p.photo.src);assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);}
for(const photo of [null,{}, {...data[0].photo,src:'https://example.com/photo.jpg'},{...data[0].photo,licenseURL:'javascript:alert(1)'}])assert.ok(!validPhoto(photo));
console.log(`PASS: ${combinations} time/vibe combinations, ${alternatives} explicit place plans, malformed/missing data, unsupported combinations, source validation.`);
