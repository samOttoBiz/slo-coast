'use strict';
/* Browser-local storage only. This module makes no network requests. */
(function(root){
  const MAX_ENTRIES=100, MAX_FILE=10*1024*1024, MAX_PHOTOS=30*1024*1024;
  function cleanDraft(draft){
    const name=String(draft.name||'').trim(),notes=String(draft.notes||'').trim();
    if(!name||name.length>100)throw new Error('Enter a place name between 1 and 100 characters.');
    if(notes.length>3000)throw new Error('Keep notes under 3,000 characters.');
    if(draft.photo!=null&&(!(draft.photo instanceof Blob)||draft.photo.type!=='image/jpeg'||draft.photo.size>2*1024*1024))throw new Error('Choose a supported photo again.');
    return {name,notes,placeId:typeof draft.placeId==='string'?draft.placeId:null,photo:draft.photo||null};
  }
  function saveEntry(entries,draft,id,expectedVersion){
    const clean=cleanDraft(draft),index=id?entries.findIndex(e=>e.id===id):-1;
    if(id&&index<0)throw new Error('This favorite was removed in another tab. Add it again.');
    if(id&&entries[index].version!==expectedVersion)throw new Error('This favorite changed in another tab. Cancel and reopen it before saving.');
    if(entries.some(e=>e.id!==id&&e.name.toLocaleLowerCase()===clean.name.toLocaleLowerCase()))throw new Error('That place is already in your favorites. Edit its existing entry.');
    if(!id&&entries.length>=MAX_ENTRIES)throw new Error('Your list has 100 places. Remove one before adding another.');
    const entry={...clean,id:id||root.crypto.randomUUID(),version:(index<0?0:entries[index].version)+1};
    const next=entries.slice();if(index<0)next.push(entry);else next[index]=entry;
    if(next.reduce((n,e)=>n+(e.photo?.size||0),0)>MAX_PHOTOS)throw new Error('Your photos have reached the 30 MB local limit. Remove a photo before adding another.');
    return next;
  }
  function moveEntry(entries,id,direction){
    const next=entries.slice(),index=next.findIndex(e=>e.id===id),target=index+direction;
    if(![-1,1].includes(direction)||index<0||target<0||target>=next.length)return next;
    [next[index],next[target]]=[next[target],next[index]];return next;
  }
  function photoSignature(bytes,type){
    if(type==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if(type==='image/png')return [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
    return type==='image/webp'&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  }
  async function preparePhoto(file){
    if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP photo.');
    if(file.size>MAX_FILE)throw new Error('Choose a photo smaller than 10 MB.');
    if(!photoSignature(new Uint8Array(await file.slice(0,12).arrayBuffer()),file.type))throw new Error('This file is not a valid JPG, PNG or WebP photo.');
    const url=URL.createObjectURL(file),image=new Image();
    try{
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('This photo could not be opened. Try another image.'));image.src=url;});
      if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>25000000)throw new Error('Choose a photo under 25 megapixels.');
      const ratio=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*ratio);canvas.height=Math.round(image.naturalHeight*ratio);
      const context=canvas.getContext('2d');if(!context)throw new Error('Photo processing is unavailable in this browser.');
      context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
      if(!blob||blob.size>2*1024*1024)throw new Error('This photo is too detailed to save. Try a smaller image.');
      return blob;
    }finally{URL.revokeObjectURL(url);}
  }
  let connection;
  function open(){
    if(connection)return connection;
    connection=new Promise((resolve,reject)=>{
      if(!root.indexedDB){reject(new Error('Local storage is unavailable. Try a regular browser window.'));return;}
      const request=root.indexedDB.open('slo-coast-favorites',1);let blocked=false;
      request.onupgradeneeded=()=>{request.result.createObjectStore('lists');};
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>{blocked=true;reject(new Error('Close other SLO Coast tabs, then try local storage again.'));};
      request.onsuccess=()=>{const db=request.result;if(blocked){db.close();return;}db.onversionchange=()=>{db.close();connection=null;};resolve(db);};
    }).catch(error=>{connection=null;throw error;});return connection;
  }
  async function transact(change){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('lists',change?'readwrite':'readonly'),store=tx.objectStore('lists');let next,error;
      tx.oncomplete=()=>resolve(next);tx.onerror=()=>reject(error||tx.error);tx.onabort=()=>reject(error||tx.error||new Error('Your changes could not be saved.'));
      const request=store.get('favorites');
      request.onsuccess=()=>{try{const entries=request.result||[];if(!Array.isArray(entries)||entries.some(e=>!e||typeof e.id!=='string'||typeof e.name!=='string'||typeof e.notes!=='string'||!Number.isInteger(e.version)||(e.photo!=null&&!(e.photo instanceof Blob))))throw new Error('The saved list could not be read. Your stored data has been left untouched.');next=change?change(entries):entries;if(change)store.put(next,'favorites');}catch(e){error=e;tx.abort();}};
    });
  }
  function errorMessage(error){return error?.name==='QuotaExceededError'?'Browser storage is full. Remove a saved photo or free browser storage, then try again.':error?.message||'Local storage is unavailable. Your changes were not saved. Try again.';}
  const api={cleanDraft,saveEntry,moveEntry,photoSignature,preparePhoto,read:()=>transact(),change:transact,errorMessage};
  root.CoastFavorites=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
