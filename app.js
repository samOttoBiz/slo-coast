'use strict';
/* A small, deterministic preference matcher. No network calls or clock lookups. */
const TIMES = Object.freeze({'sunrise':'Sunrise','morning':'Morning','midday':'Midday','golden-hour':'Golden hour','sunset':'Sunset'});
const VIBES = Object.freeze({'surf':'Surf','relax':'Relax','coastal-walk':'Coastal walk','scenery':'Scenery'});
const TIME_NOTES = Object.freeze({
  sunrise:'For your sunrise mood, think early coastal light, not a promise of an ocean sunrise. Verify early access first.',
  morning:'For a morning outing, we lean toward a simple place to begin the day. This is an editorial preference.',
  midday:'For a midday pause, we favor a beach or cove setting. Bring sun protection and check access.',
  'golden-hour':'For a golden-hour mood, we favor a broad coastal view. Light and visibility are never guaranteed.',
  sunset:'For a sunset mood, we favor an ocean-view landmark. Check access and plan your return before dark.'
});
function validPlace(p){
  return p && ['id','name','fact','detail','note'].every(k=>typeof p[k]==='string'&&p[k].trim())
    && typeof p.source==='string' && /^https:\/\/(www\.)?(parks\.ca\.gov|pismobeach\.org|morrobayca\.gov|experiencepismobeach\.com|visitavilabeach\.com)\//.test(p.source)
    && Array.isArray(p.vibes)&&p.vibes.length>0&&p.vibes.every(v=>Object.hasOwn(VIBES,v))
    && Array.isArray(p.times)&&p.times.length>0&&p.times.every(t=>Object.hasOwn(TIMES,t));
}
function officialURL(url){return typeof url==='string' && /^https:\/\/(www\.)?(parks\.ca\.gov|pismobeach\.org|morrobayca\.gov|morrobay\.org|experiencepismobeach\.com|visitavilabeach\.com|portsanluis\.com)\//.test(url);}
function rankPlaces(data,time,vibe){return data.filter(p=>p.vibes.includes(vibe)).sort((a,b)=>Number(b.times.includes(time))-Number(a.times.includes(time)));}
function validPhoto(photo){return photo && ['src','alt','author','source','license','licenseURL','year'].every(key=>typeof photo[key]==='string'&&photo[key].trim()) && /^assets\/photos\/[a-z-]+\.jpg$/.test(photo.src) && /^https:\/\/(commons\.wikimedia\.org|www\.flickr\.com)\//.test(photo.source) && /^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//.test(photo.licenseURL) && Number.isFinite(photo.width)&&photo.width>0&&Number.isFinite(photo.height)&&photo.height>0;}
function recommend(data,time,vibe,placeId){
  if(!Object.hasOwn(TIMES,time)||!Object.hasOwn(VIBES,vibe)) return {error:'Choose a listed time and vibe, then try again.'};
  if(!Array.isArray(data)||data.length===0||!data.every(validPlace)||new Set(data.map(p=>p.id)).size!==data.length) return {error:'The local place list is unavailable. Reload the page, or read the sources below.'};
  const candidates=rankPlaces(data,time,vibe);
  if(!candidates.length) return {error:'No supported pick for this vibe in our small collection. Try another vibe.'};
  // A supported vibe is required. Time preference breaks ties; stable file order resolves equal scores.
  const place=placeId?candidates.find(p=>p.id===placeId):candidates[0];
  if(!place)return {error:'This place does not fit the selected vibe. Choose another place.'};
  const partial=!place.times.includes(time);
  const surf=vibe==='surf'?'Surf interest only: this is a place to consider, not a recommendation to enter the water. No swell, skill suitability or safety is assessed. ':'';
  return {place,time,vibe,partial,reason:`${place.detail} ${TIME_NOTES[time]}${partial?' Your vibe fits; we do not have a distinct time match in this small collection.':''}`,note:surf+place.note};
}
if(typeof module!=='undefined'&&module.exports) module.exports={TIMES,VIBES,recommend,validPlace,rankPlaces,officialURL,validPhoto};
if(typeof document!=='undefined'){
  const form=document.getElementById('coast-form');
  const result=document.getElementById('result'),status=document.getElementById('status');
  const spotName=document.getElementById('spot-name');
  const shareStatus=document.getElementById('share-status');
  const selected=name=>form.querySelector(`input[name="${name}"]:checked`);
  const value=name=>selected(name)?.value;
  const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activePick=null,revealTimer;
  const places=()=>Array.isArray(globalThis.COAST_DATA)?globalThis.COAST_DATA:[];
  const safePlaces=()=>places().filter(validPlace);
  function updateMood(){
    document.body.dataset.time=value('time');
    document.getElementById('mood-label').textContent=TIMES[value('time')]||'Coastal light';
  }
  function clearPlanURL(){
    const url=new URL(location.href); ['time','vibe','place'].forEach(key=>url.searchParams.delete(key));if(url.hash==='#result')url.hash='';
    try{history.replaceState(null,'',url);}catch{}
  }
  function hideResult(){
    clearTimeout(revealTimer);result.hidden=true;activePick=null;shareStatus.textContent='';clearPlanURL();
  }
  function setChoice(name,choice){
    const input=form.querySelector(`input[name="${name}"][value="${choice}"]`);
    if(input)input.checked=true;
  }
  function planURL(pick){
    const url=new URL(location.href);url.searchParams.set('time',pick.time);url.searchParams.set('vibe',pick.vibe);url.searchParams.set('place',pick.place.id);url.hash='result';return url;
  }
  function renderPick(pick,focus=true){
    clearTimeout(revealTimer);result.classList.remove('revealing');
    if(pick.error){hideResult();status.textContent=pick.error;return;}
    activePick=pick;shareStatus.textContent='';
    const p=pick.place;
    document.getElementById('selection-label').textContent=`${TIMES[pick.time]} / ${VIBES[pick.vibe]} / ${pick.partial?'Vibe match':'Time + vibe match'}`;
    spotName.textContent=p.name;
    document.getElementById('spot-number').textContent=String(places().findIndex(item=>item.id===p.id)+1).padStart(2,'0');
    document.getElementById('spot-area').textContent=p.area||'SLO County';
    document.getElementById('spot-kind').textContent=p.kind||'Coastal place';
    const photo=document.getElementById('spot-photo'),fallback=document.getElementById('photo-fallback'),credit=document.getElementById('photo-credit');
    result.querySelector('.photo-context').hidden=!validPhoto(p.photo);
    credit.replaceChildren();photo.hidden=false;fallback.hidden=true;
    photo.onload=()=>{photo.hidden=false;fallback.hidden=true;};
    photo.onerror=()=>{photo.hidden=true;fallback.hidden=false;};
    if(validPhoto(p.photo)){
      photo.alt=p.photo.alt;photo.width=p.photo.width;photo.height=p.photo.height;photo.src=p.photo.src;
      const author=document.createElement('a');author.href=p.photo.source;author.textContent=p.photo.author;author.target='_blank';author.rel='noopener noreferrer';
      const license=document.createElement('a');license.href=p.photo.licenseURL;license.textContent=p.photo.license;license.target='_blank';license.rel='noopener noreferrer';
      credit.append('Photo: ',author,' · ',license,'. Resized; cropped in layout.');
      document.getElementById('photo-year').textContent=p.photo.year;
    }else{photo.removeAttribute('src');photo.hidden=true;fallback.hidden=false;document.getElementById('photo-year').textContent='an earlier season';}
    document.getElementById('spot-reason').textContent=pick.reason;
    document.getElementById('spot-fact').textContent=p.fact;
    document.getElementById('spot-note').textContent=pick.note;
    document.getElementById('spot-access').textContent=p.access||'Check the official place guide for access details before leaving.';
    document.getElementById('spot-prompt').textContent=p.prompt||'Take your time and follow posted guidance.';
    document.getElementById('spot-source').href=p.source;
    document.getElementById('access-source').href=officialURL(p.accessSource)?p.accessSource:p.source;
    document.getElementById('spot-map').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.mapQuery||p.name+', San Luis Obispo County, CA')}`;
    const alternatives=document.getElementById('alternatives');alternatives.replaceChildren();
    const others=rankPlaces(places(),pick.time,pick.vibe).filter(item=>item.id!==p.id);
    if(others.length){
      const heading=document.createElement('p');heading.textContent='Another way to '+(pick.vibe==='coastal-walk'?'take a walk':pick.vibe==='scenery'?'take in the view':pick.vibe==='surf'?'watch the surf':'unwind');alternatives.append(heading);
      others.forEach(other=>{const button=document.createElement('button');button.type='button';button.className='alternative-button';button.textContent=other.name+' ↗';button.addEventListener('click',()=>renderPick(recommend(places(),value('time'),value('vibe'),other.id)));alternatives.append(button);});
    }
    result.hidden=false;
    if(!reducedMotion()){void result.offsetWidth;result.classList.add('revealing');revealTimer=setTimeout(()=>result.classList.remove('revealing'),400);}
    try{history.replaceState(null,'',planURL(pick));}catch{}
    status.textContent=`${p.name}. ${pick.partial?'Vibe match; no distinct time match.':'An editorial time and vibe match.'}`;
    if(focus){spotName.focus({preventScroll:true});result.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});}
  }
  form.querySelectorAll('input[type="radio"]').forEach(input=>input.addEventListener('change',()=>{hideResult();updateMood();status.textContent='Your moment is set. Find your spot to see the match.';}));
  form.addEventListener('submit',event=>{event.preventDefault();renderPick(recommend(places(),value('time'),value('vibe')));});
  document.getElementById('change-pick').addEventListener('click',()=>{hideResult();status.textContent='Choose your next moment.';selected('time')?.focus({preventScroll:true});document.getElementById('picker').scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});});
  document.getElementById('share-pick').addEventListener('click',async()=>{
    if(!activePick)return;
    const url=planURL(activePick).href;
    try{await navigator.clipboard.writeText(url);shareStatus.textContent='Plan link copied. Send it to your coast-going crew.';}
    catch{shareStatus.textContent='Copy the link from your address bar to share this plan.';}
  });
  const collection=document.getElementById('place-collection');
  safePlaces().forEach((p,index)=>{
    const button=document.createElement('button');button.type='button';button.className='place-card';
    const top=document.createElement('span');top.className='card-top';top.textContent=String(index+1).padStart(2,'0')+' / '+(p.area||'SLO County');
    const name=document.createElement('strong');name.textContent=p.name;
    const kind=document.createElement('span');kind.className='card-kind';kind.textContent=p.kind||'Coastal place';
    const cta=document.createElement('span');cta.className='card-cta';cta.textContent='Explore this place ↗';
    if(validPhoto(p.photo)){const image=document.createElement('img');image.className='card-photo';image.src=p.photo.src;image.alt='';image.width=p.photo.width;image.height=p.photo.height;image.loading='lazy';image.decoding='async';image.onerror=()=>{image.hidden=true;};button.append(image);}
    button.append(top,name,kind,cta);button.addEventListener('click',()=>{
      const vibe=p.vibes.includes(value('vibe'))?value('vibe'):p.vibes[0];
      setChoice('vibe',vibe);setChoice('time',p.times.includes(value('time'))?value('time'):p.times[0]);updateMood();renderPick(recommend(places(),value('time'),value('vibe'),p.id));
    });collection.append(button);
  });
  if(!safePlaces().length){collection.textContent='The local collection is unavailable. Read the linked sources below, or reload to try again.';}
  updateMood();
  const params=new URLSearchParams(location.search);
  if(params.has('time')||params.has('vibe')||params.has('place')){
    const pick=recommend(places(),params.get('time'),params.get('vibe'),params.get('place'));
    if(!pick.error){setChoice('time',pick.time);setChoice('vibe',pick.vibe);updateMood();renderPick(pick,false);}
    else{status.textContent='That plan link is incomplete or unavailable. Choose a new time and vibe.';clearPlanURL();}
  }
}
