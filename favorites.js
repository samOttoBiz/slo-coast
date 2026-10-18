'use strict';
(function(){
  const store=globalThis.CoastFavorites,$=id=>document.getElementById(id),tabs=[$('explore-tab'),$('favorites-tab')];
  const form=$('favorite-form'),list=$('favorite-list'),status=$('favorites-status'),formStatus=$('favorite-form-status');
  let entries=[],editing=null,draftPhoto=null,previewURL=null,imageURLs=[],busy=false,photoBusy=false,ready=false,photoSequence=0;
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('slo-coast-favorites'):null;
  const places=Array.isArray(globalThis.COAST_DATA)?globalThis.COAST_DATA:[];
  const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
  function show(view,focus=false){
    const favorites=view==='favorites';$('explore-panel').hidden=favorites;$('favorites-panel').hidden=!favorites;
    tabs.forEach((tab,index)=>{const active=Boolean(index)===favorites;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    const url=new URL(location.href);url.hash=favorites?'favorites':($('result').hidden?'':'result');try{history.replaceState(null,'',url);}catch{}
    if(focus)(favorites?$('favorites-heading'):$('explore-tab')).focus({preventScroll:true});
    if(favorites)refresh();
  }
  tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>show(index?'favorites':'explore'));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?1:1-index;show(target?'favorites':'explore');tabs[target].focus();});});
  document.querySelectorAll('.header-action,.skip-link').forEach(link=>link.addEventListener('click',()=>show('explore')));
  places.forEach(place=>{const option=element('option',null,place.name);option.value=place.id;$('favorite-place').append(option);});
  function setReady(value){ready=value;$('add-favorite').disabled=!value;$('save-favorite').disabled=!value||busy||photoBusy;}
  async function refresh(){
    try{entries=await store.read();setReady(true);$('storage-retry').hidden=true;render();}catch(error){setReady(false);status.textContent=store.errorMessage(error);$('storage-retry').hidden=false;render();$('favorites-empty').hidden=true;$('favorites-count').textContent='—';}
  }
  function button(text,label,handler){const node=element('button','favorite-action',text);node.type='button';node.setAttribute('aria-label',label);node.addEventListener('click',handler);return node;}
  function render(){
    imageURLs.forEach(URL.revokeObjectURL);imageURLs=[];list.replaceChildren();$('favorites-count').textContent=String(entries.length);$('favorites-empty').hidden=entries.length>0;
    entries.forEach((entry,index)=>{
      const item=element('li','favorite-card'),rank=element('span','favorite-rank',String(index+1).padStart(2,'0'));rank.setAttribute('aria-label','Rank '+(index+1));item.append(rank);
      if(entry.photo instanceof Blob){const image=element('img','favorite-photo');const url=URL.createObjectURL(entry.photo);imageURLs.push(url);image.src=url;image.alt='Your photo of '+entry.name;image.loading='lazy';item.append(image);}
      const body=element('div','favorite-body'),heading=element('h2',null,entry.name);body.append(heading);
      if(entry.notes)body.append(element('p','favorite-notes',entry.notes));
      const actions=element('div','favorite-actions');
      const up=button('↑ Move up','Move '+entry.name+' up',()=>move(entry,-1)),down=button('↓ Move down','Move '+entry.name+' down',()=>move(entry,1));up.disabled=index===0||busy||!ready;down.disabled=index===entries.length-1||busy||!ready;
      up.dataset.focusKey=entry.id+'up';down.dataset.focusKey=entry.id+'down';
      const edit=button('Edit','Edit '+entry.name,()=>openEditor(entry));edit.disabled=busy||!ready;
      const remove=button('Remove','Remove '+entry.name,()=>{
        const confirmation=element('div','favorite-confirm');confirmation.append(element('p',null,'Remove '+entry.name+' and its saved photo?'));
        const yes=button('Remove place','Confirm remove '+entry.name,()=>commit(current=>current.filter(e=>e.id!==entry.id),'Removed '+entry.name+'.',()=>{if(editing?.id===entry.id)closeEditor();$('add-favorite').focus();}).catch(()=>{}));
        const no=button('Keep it','Keep '+entry.name,()=>{confirmation.remove();remove.hidden=false;remove.focus();});confirmation.append(yes,no);body.append(confirmation);remove.hidden=true;yes.focus();
      });remove.disabled=busy||!ready;actions.append(up,down,edit,remove);body.append(actions);item.append(body);list.append(item);
    });
  }
  async function commit(change,message,after){
    if(busy||!ready)return;busy=true;setReady(ready);render();status.textContent='Saving…';
    try{entries=await store.change(change);status.textContent=message;channel?.postMessage('changed');after?.();}
    catch(error){status.textContent=store.errorMessage(error);throw error;}
    finally{busy=false;setReady(ready);render();}
  }
  async function move(entry,direction){
    try{await commit(current=>store.moveEntry(current,entry.id,direction),'Moved '+entry.name+'.');const target=[...list.querySelectorAll('[data-focus-key]')].find(node=>node.dataset.focusKey===entry.id+(direction<0?'up':'down'));if(target&&!target.disabled)target.focus();else list.querySelector('button:not(:disabled)')?.focus();}catch{}
  }
  function updateName(){const custom=$('favorite-place').value==='custom';$('custom-place-field').hidden=!custom;$('favorite-name').required=custom;}
  function preview(){if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;$('favorite-photo-preview').hidden=!draftPhoto;$('remove-draft-photo').hidden=!draftPhoto;if(draftPhoto){previewURL=URL.createObjectURL(draftPhoto);$('favorite-photo-preview').src=previewURL;}else $('favorite-photo-preview').removeAttribute('src');}
  function openEditor(entry=null,place=null){
    if(!ready){show('favorites');status.textContent='Local storage is still loading. Try again in a moment.';return;}
    editing=entry;draftPhoto=entry?.photo||null;photoSequence++;photoBusy=false;form.reset();formStatus.textContent='';
    $('favorite-form-heading').textContent=entry?'Edit favorite':'Add a visited place';$('favorite-place').value=entry?.placeId||place?.id||'custom';if(!$('favorite-place').value)$('favorite-place').value='custom';
    $('favorite-name').value=entry?.name||'';$('favorite-notes').value=entry?.notes||'';updateName();preview();$('favorite-editor').hidden=false;setReady(ready);$('favorite-place').focus();$('favorite-editor').scrollIntoView({behavior:'auto',block:'start'});
  }
  function closeEditor(){photoSequence++;photoBusy=false;editing=null;draftPhoto=null;preview();form.reset();$('favorite-editor').hidden=true;formStatus.textContent='';setReady(ready);}
  $('add-favorite').addEventListener('click',()=>openEditor());$('cancel-favorite').addEventListener('click',()=>{closeEditor();status.textContent='';$('add-favorite').focus();});$('favorite-place').addEventListener('change',updateName);
  $('remove-draft-photo').addEventListener('click',()=>{photoSequence++;photoBusy=false;draftPhoto=null;$('favorite-photo').value='';preview();setReady(ready);formStatus.textContent='Photo removed from this draft. Save to keep the change.';});
  $('favorite-photo').addEventListener('change',async()=>{
    const file=$('favorite-photo').files[0];if(!file)return;const sequence=++photoSequence;photoBusy=true;setReady(ready);formStatus.textContent='Preparing photo on this device…';
    try{const photo=await store.preparePhoto(file);if(sequence!==photoSequence)return;draftPhoto=photo;preview();formStatus.textContent='Photo ready. Save to keep it with this place.';}
    catch(error){if(sequence===photoSequence){$('favorite-photo').value='';formStatus.textContent=store.errorMessage(error);}}
    finally{if(sequence===photoSequence){photoBusy=false;setReady(ready);}}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(photoBusy||busy||!ready)return;const place=places.find(p=>p.id===$('favorite-place').value);
    const draft={name:place?place.name:$('favorite-name').value,placeId:place?.id||null,notes:$('favorite-notes').value,photo:draftPhoto},id=editing?.id,version=editing?.version;
    try{store.cleanDraft(draft);await commit(current=>store.saveEntry(current,draft,id,version),id?'Favorite updated.':'Added to your favorites.',()=>{closeEditor();$('add-favorite').focus();});}
    catch(error){formStatus.textContent=store.errorMessage(error);}
  });
  $('save-place-favorite').addEventListener('click',async()=>{
    const place=places.find(p=>p.id===new URLSearchParams(location.search).get('place'));show('favorites');await refresh();if(place)openEditor(entries.find(e=>e.placeId===place.id)||null,place);
  });
  $('storage-retry').addEventListener('click',()=>{status.textContent='Trying local storage…';refresh().then(()=>{if(ready)status.textContent='Your favorites are ready.';});});
  channel?.addEventListener('message',()=>refresh());window.addEventListener('focus',()=>{if(!$('favorites-panel').hidden)refresh();});
  refresh();if(location.hash==='#favorites')show('favorites');
})();
