import {matchesReviewLanguage} from './review-language.js';
import {isRepeatedReview} from './review-variation.js';
import {createWaitTypewriter} from './wait-typewriter.js';
import {playWaitingLottie} from './waiting-lottie.js';
import {startWaitingMessages} from './wait-messages.js';
import {readReviewStream} from './review-stream.js';
import {services,experiences,pointsForService} from './experiences.js';
import {copyAndOpen} from './share.js';
import {rotatePoints,showAllPoints,expandPoints} from './point-rotation.js';
const visiblePointIds=new Map();
const $=id=>document.getElementById(id);
const selectedIds=new Set();
let config,revision=0,busy=false,drafts=[],activeDraft=0,awaitingGoogleReturn=false;
const SESSION_KEY='demo-studio-review-tab-v1';
let savedSession;try{savedSession=JSON.parse(sessionStorage.getItem(SESSION_KEY));}catch{}
let reviewLanguage=['en','hi','hinglish','gu'].includes(savedSession?.language)?savedSession.language:'en';
const recentReviews=Array.isArray(savedSession?.recentReviews)?savedSession.recentReviews.filter(x=>typeof x==='string').slice(-20):[];
function saveSession(){try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({service:$('service').value,points:[...selectedIds],recentReviews,language:reviewLanguage,visible:[...visiblePointIds],feedback:$('feedback').value,drafts,activeDraft,awaitingGoogleReturn,step:currentStep}));}catch{}}
window.addEventListener('pagehide',saveSession);
function compactCategory(){const service=services.find(x=>x.id===$('service').value);document.body.classList.toggle('category-chosen',Boolean(service));$('chosen-service').hidden=!service;if(service)$('chosen-service-name').textContent=service.label;}
$('change-service').onclick=()=>{document.body.classList.remove('category-chosen');$('chosen-service').hidden=true;$('popular-services').scrollIntoView({block:'center',behavior:'smooth'});};
function syncServiceButtons(){document.querySelectorAll('[data-service]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.service===$('service').value)));}
const status=text=>{$('status').textContent=text;};
const selectedPoints=()=>experiences.filter(x=>selectedIds.has(x.id));
const sourceText=()=>[...selectedPoints().map(x=>x.statement),$('feedback').value.trim()].filter(Boolean).join(' ');
const cleanReview=text=>text.replace(/&amp;(?=#(?:x[0-9a-f]+|[0-9]+);)/gi,'&').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,value)=>{const code=value[0].toLowerCase()==='x'?parseInt(value.slice(1),16):parseInt(value,10);return code>0&&code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff)?String.fromCodePoint(code):'';});
const countWords=text=>text.trim()?text.trim().split(/\s+/u).length:0;
function ready(){return Boolean(config&&$('service').value&&(selectedIds.size>=1||$('feedback').value.trim()));}
function updateQuickAction(){
 const step=Number(document.body.dataset.step||1);
 const hint=busy?'Please wait — your review is being prepared.':step===3?'Copy your review, then tap Open Google Profile.':step===2?'Read your review → Copy review → Open Google Business.':!$('service').value?'Start here: choose your service.':ready()?'Ready! Tap Write my AI review below.':'Tap any point that matches your experience.';
 $('step-direction-text').textContent=hint;document.body.classList.toggle('action-ready',!busy&&ready());document.body.dataset.guide=busy?'wait':step===1?(!$('service').value?'category':ready()?'generate':'points'):step===2?'copy':'share';

 const show=(ready()||drafts.length>0||busy)&&!(Number(document.body.dataset.step)===2&&drafts.length&&!busy);
 $('quick-action').hidden=!show||document.body.classList.contains('waiting-error');document.body.classList.toggle('has-quick-action',show);
 $('quick-button').disabled=busy;
 $('quick-title').textContent=busy?'Preparing your review':currentStep===1?`${selectedIds.size} ${selectedIds.size===1?'point':'points'} selected`:drafts.length?`Draft ${activeDraft+1} ready to share`:`${selectedIds.size} ${selectedIds.size===1?'point':'points'} selected`;
 $('quick-note').textContent=busy?'Pehla draft taiyar ho raha hai…':currentStep===1?'Ready! Write my AI review · More points optional.':drafts.length?'Read it, edit if needed, then share.':'Ready! Write my AI review · More points optional.';
 $('quick-button').textContent=busy?'Preparing your review…':currentStep===2?'Use this draft →':currentStep===3?'Copy review ⧉':'Write my AI review →';
 $('quick-disclosure').textContent=drafts.length?'You paste, choose your rating and post on Google.':'Generate confirms your own experience and sends it to Gemini. Google may use free-tier data to improve its products.';
}
function updateGenerateState(){$('polish').disabled=busy||!ready();$('another-draft').disabled=busy;$('share-another-draft').disabled=busy;
 document.querySelectorAll('[data-language],[data-service],#tags button,#refresh-points,#all-points,#feedback,#use-original,#retry,#fallback-points').forEach(el=>el.disabled=busy);
 $('refresh-points').disabled=busy||(pointsForService($('service').value).length>0&&selectedIds.size===pointsForService($('service').value).length);
 updateQuickAction();saveSession();}
function scrollToPoints(){document.querySelector('fieldset').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
function restoreAfterGoogle(){if(!awaitingGoogleReturn||!drafts.length||document.visibilityState==='hidden')return;awaitingGoogleReturn=false;document.body.classList.remove('review-copied');setStep(3);$('share-final').textContent='Copy again ⧉';$('share-status').textContent='Welcome back. Your review is ready. Copy again, then paste on Google.';requestAnimationFrame(()=>{$('share-final').scrollIntoView({behavior:'instant',block:'center'});});saveSession();}
window.addEventListener('focus',restoreAfterGoogle);
document.addEventListener('visibilitychange',restoreAfterGoogle);
$('copy-again').onclick=()=>copyDraft(activeDraft);
$('waiting-retry').onclick=()=>{if(!busy)$('review-form').requestSubmit($('polish'));};
$('waiting-use-points').onclick=()=>{document.body.classList.remove('waiting-error');$('step-loading').hidden=true;$('use-original').click();if(drafts.length)setStep(3);};
$('retry').onclick=()=>{if(!busy)$('review-form').requestSubmit($('polish'));};
$('fallback-points').onclick=()=>{$('recovery-actions').hidden=true;$('use-original').click();};
for(const id of ['google','draft-google'])$(id).addEventListener('click',()=>{if(drafts.length){awaitingGoogleReturn=true;saveSession();}});
$('quick-button').onclick=()=>{if(currentStep===2&&drafts.length)setStep(3);else if(currentStep===3)copyDraft(activeDraft);else $('review-form').requestSubmit($('polish'));};
let currentStep=1,historyReady=false,activeController,backgroundController;
function setStep(step,{fromHistory=false,initial=false}={}){step=Math.max(1,Math.min(3,step));if(step>1&&!drafts.length&&!busy)step=1;if(!fromHistory){const state={reviewStep:step};if(historyReady&&step!==currentStep)history.pushState(state,'');else history.replaceState(state,'');historyReady=true;}if(step!==2){document.body.classList.remove('waiting-error');$('step-loading').hidden=true;}const oldStep=currentStep;currentStep=step;if(oldStep!==step&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelector('.card').animate([{opacity:.35,transform:`translateY(${step>oldStep?12:-8}px)`},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.2,.7,.2,1)'});}document.body.dataset.step=String(step);$('step-back').hidden=step===1||busy;$('step-label').textContent=`Step ${step} of 3 · ${step===1?'Your experience':step===2?'Choose your draft':'Copy & share'}`;document.querySelectorAll('.flow-steps span').forEach((el,i)=>{el.classList.toggle('active',i+1===step);if(i+1===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});if(step===3)$('share-preview').value=drafts[activeDraft]||'';updateQuickAction();saveSession();if(!initial)document.querySelector('.card').scrollIntoView({behavior:'instant',block:'start'});}
window.addEventListener('popstate',e=>{if(busy)activeController?.abort();setStep(e.state?.reviewStep||1,{fromHistory:true});});
$('step-back').onclick=()=>history.back();
$('copied-go-back').onclick=()=>{document.body.classList.remove('review-copied');$('open-google-profile').classList.remove('next-action','guide-google');$('share-status').textContent='Your review is still here. Edit it or copy again whenever you’re ready.';setStep(3);$('share-final').focus({preventScroll:true});};
$('change-draft').onclick=()=>{setStep(2);$('editor-panel').open=true;$('draft').focus();$('editor-panel').scrollIntoView({block:'nearest'});};
$('share-another-draft').onclick=()=>{if(!busy)$('review-form').requestSubmit($('polish'));};
for(const button of document.querySelectorAll('[data-language]')){button.setAttribute('aria-pressed',String(button.dataset.language===reviewLanguage));button.onclick=()=>{if(busy||reviewLanguage===button.dataset.language)return;reviewLanguage=button.dataset.language;clearDraft();document.querySelectorAll('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===reviewLanguage)));saveSession();};}
$('share-final').onclick=()=>copyDraft(activeDraft);
$('open-google-profile').onclick=e=>{if(!config?.businesses[0].reviewUrl){e.preventDefault();$('share-status').textContent='Demo only: configure your Google review URL first.';return;}awaitingGoogleReturn=true;saveSession();};
$('select-review').onclick=()=>{$('share-status').classList.remove('copy-success');$('share-preview').focus();$('share-preview').select();$('share-preview').setSelectionRange(0,$('share-preview').value.length);$('share-status').textContent='Review selected. Long-press the text and choose Copy.';};
$('share-copy-again').onclick=()=>copyDraft(activeDraft);
setStep(1,{initial:true});

function clearDraft(){document.body.classList.remove('review-copied');backgroundController?.abort();revision++;awaitingGoogleReturn=false;$('copy-again').hidden=true;$('recovery-actions').hidden=true;drafts=[];$('draft-section').hidden=true;$('draft-google').hidden=true;$('draft-options').replaceChildren();updateQuickAction();status('');}
function renderPoints({rotate=false,all=false,expand=false}={}){
 const pool=pointsForService($('service').value);const serviceId=$('service').value;const previous=visiblePointIds.get(serviceId)||[];const chosen=expand?expandPoints(pool,previous):all?showAllPoints(pool,previous):rotate||!previous.length?rotatePoints(pool,{selectedIds:[...selectedIds],previousIds:previous}):previous.map(id=>pool.find(x=>x.id===id)).filter(Boolean);const list=chosen;visiblePointIds.set(serviceId,list.map(x=>x.id));const service=services.find(x=>x.id===$('service').value);$('points-title').textContent=service?`${service.label}: what did you experience?`:'Choose your category to see relevant points';$('tags').replaceChildren();
 for(const [pointIndex,point] of list.entries()){const b=document.createElement('button');b.type='button';b.className='tag';b.dataset.pointId=point.id;b.dataset.pointOrder=pointIndex;b.style.setProperty('--point-index',String(Math.min(pointIndex,7)));b.textContent=point.label;if(point.kind==='photography'){const camera=document.createElement('span');camera.className='point-camera';camera.setAttribute('aria-hidden','true');camera.textContent='📷';b.prepend(camera,document.createTextNode(' '));}if(point.kind==='photography')b.classList.add('photo-point');b.setAttribute('aria-pressed',String(selectedIds.has(point.id)));b.onclick=()=>{if(selectedIds.has(point.id))selectedIds.delete(point.id);else selectedIds.add(point.id);clearDraft();b.setAttribute('aria-pressed',String(selectedIds.has(point.id)));b.classList.toggle('just-selected',selectedIds.has(point.id));if(selectedIds.size===1&&list.length===6&&pool.length>6){renderPoints({expand:true});const same=[...$('tags').children].find(el=>el.dataset.pointId===point.id);same?.focus({preventScroll:true});}else updateSelectionState();};$('tags').append(b);}
 $('points-placeholder').hidden=Boolean(list.length);$('point-tools').hidden=!pool.length;$('all-points').hidden=list.length>=pool.length;$('refresh-points').disabled=pool.length>0&&selectedIds.size===pool.length;$('point-set-note').textContent=pool.length?`${list.length} of ${pool.length} points · Select only what you experienced`:'';
 updateSelectionState();
}
$('show-extra-info').onclick=()=>{const open=document.body.classList.toggle('show-extra-info');$('show-extra-info').setAttribute('aria-expanded',String(open));$('show-extra-info').textContent=open?'Hide extra details −':'Add feedback / more info +';};
function updateSelectionState(){
 const nodes=[...$('tags').children];nodes.sort((a,b)=>Number(selectedIds.has(b.dataset.pointId))-Number(selectedIds.has(a.dataset.pointId))||Number(a.dataset.pointOrder)-Number(b.dataset.pointOrder));for(const node of nodes)$('tags').append(node);

 document.body.classList.toggle('points-focused',selectedIds.size>0);$('show-extra-info').hidden=selectedIds.size===0;
 if(!selectedIds.size){document.body.classList.remove('show-extra-info');$('show-extra-info').setAttribute('aria-expanded','false');$('show-extra-info').textContent='Add feedback / more info +';}
 $('selection-count').textContent=selectedIds.size>=1?`${selectedIds.size} selected · Ready! Write my AI review · More points optional`:`${selectedIds.size} selected · Choose at least 1 point`;
 updateGenerateState();
}

$('service').onchange=()=>{syncServiceButtons();selectedIds.clear();clearDraft();renderPoints({rotate:true});const s=services.find(x=>x.id===$('service').value);$('service-context').textContent=s?`${s.label} · Demo Studio, Sample City`:'';};
const popularServices=[['birthday-setup','Birthday celebration'],['birthday-photo','Birthday photography'],['anniversary','Anniversary celebration'],['baby','Baby photography'],['pre-wedding','Pre-wedding']];
for(const service of services){const popular=popularServices.find(([id])=>id===service.id);if(popular)continue;addServiceButton(service.id,service.label,'other-services');}
for(const [id,label] of popularServices)addServiceButton(id,label,'popular-services');
function addServiceButton(id,label,target){const b=document.createElement('button');b.type='button';b.dataset.service=id;const icon=document.createElement('span');icon.className='service-icon';icon.setAttribute('aria-hidden','true');const photography=services.find(x=>x.id===id)?.group==='photo';icon.innerHTML=photography?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 6l1.5-2h5L16 6h4v14H4V6z"/><circle cx="12" cy="12" r="4"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/><path d="M20 2v4M18 4h4"/></svg>';const name=document.createElement('span');name.textContent=label;b.append(icon,name);b.setAttribute('aria-pressed','false');b.onclick=()=>{if(busy)return;if($('service').value!==id){$('service').value=id;$('service').onchange();}$('more-services').open=false;compactCategory();scrollToPoints();};$(target).append(b);}
$('refresh-points').onclick=()=>{renderPoints({rotate:true});status('Fresh options shown. Your selected points are kept.');};
$('all-points').onclick=()=>{renderPoints({all:true});status('All points shown. Select as many as match your experience.');};
$('feedback').oninput=()=>{$('count').textContent=`${$('feedback').value.length} / 3000`;clearDraft();updateGenerateState();};
function updateEditor(){$('draft').value=drafts[activeDraft];$('draft-count').textContent=`${countWords(drafts[activeDraft])} words · Target: about 60–90`;}
function copyWithSelection(text){
 const previous=document.activeElement;const field=document.createElement('textarea');field.value=text;field.readOnly=true;field.setAttribute('aria-label','Copy review');field.style.cssText='position:fixed;left:-9999px;top:0;font-size:16px;';document.body.append(field);
 try{field.focus({preventScroll:true});field.select();field.setSelectionRange(0,text.length);return document.execCommand('copy');}
 finally{field.remove();previous?.focus?.({preventScroll:true});}
}
window.addEventListener('pageshow',restoreAfterGoogle);
async function copyDraft(index,openGoogle=false){
 setActiveSlide(index);const text=drafts[index]?.trim();if(!text)return;
 const reviewUrl=openGoogle?config?.businesses[0].reviewUrl:undefined;
 if(openGoogle){awaitingGoogleReturn=true;saveSession();}
 try{const result=await copyAndOpen({text,url:reviewUrl,clipboard:{writeText:async text=>{if(copyWithSelection(text))return;if(!navigator.clipboard?.writeText)throw Error('No clipboard');await navigator.clipboard.writeText(text);}},fallbackCopy:copyWithSelection,navigate:url=>{saveSession();window.location.assign(url);return true;}});status(`Draft ${index+1} copied. Open Google and paste your review.`);$('copy-status').textContent='Copied ✓ Google par paste karein, rating dein aur Post karein.';
 if(openGoogle&&!result.opened){awaitingGoogleReturn=false;saveSession();}
 if(openGoogle&&reviewUrl)$('copy-status').textContent=result.opened?'Copied ✓ Google par paste karein, rating dein aur Post karein.':'Copied ✓ Tap Open Google below to continue.';
 $('draft-google').hidden=!config?.businesses[0].reviewUrl;
 $('step-direction-text').textContent='Copied! Now tap Open Google Profile.';$('open-google-profile').classList.add('next-action');document.body.classList.add('review-copied');document.body.dataset.guide='open-google';if(currentStep===3){const next=$('open-google-profile');next.classList.remove('guide-google');void next.offsetWidth;next.classList.add('guide-google');$('step-direction-text').textContent='Copied ✓ Next: tap Open Google Profile.';requestAnimationFrame(()=>{next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});}
 $('share-status').classList.add('copy-success');$('share-status').textContent=$('copy-status').textContent;$('share-final').textContent='Copied ✓';$('share-copy-again').textContent='Copied ✓';setTimeout(()=>{$('share-final').textContent='1. Copy review ⧉';$('share-copy-again').textContent='Copy again ⧉';},2500);document.querySelectorAll('.draft-choice').forEach((el,i)=>{el.classList.toggle('copied',i===index);el.setAttribute('aria-label',`Draft ${i+1}. ${i===index?'Copied.':'Tap to copy.'} ${drafts[i]}`);});}
 catch{$('share-status').classList.remove('copy-success');awaitingGoogleReturn=false;saveSession();setStep(3);$('share-preview').focus();$('share-preview').select();$('share-status').textContent='Your browser blocked automatic copy. Long-press the selected review → Copy. Then tap Open Google Profile.';}
}
function renderDrafts(){
 $('draft-options').replaceChildren();
 drafts.forEach((text,index)=>{const card=document.createElement('div');card.className='draft-card';card.style.setProperty('--draft-index',String(index));const b=document.createElement('button');b.type='button';b.className='draft-choice';b.setAttribute('aria-label',`Draft ${index+1}. Select this draft. ${text}`);const top=document.createElement('span');top.className='draft-top';top.textContent=`DRAFT ${index+1} · ${countWords(text)} words`;const body=document.createElement('span');body.className='draft-text';body.textContent=text;const hint=document.createElement('span');hint.className='draft-tap';hint.textContent='Read once before sharing';b.append(top,body,hint);b.onclick=()=>goToSlide(index);const edit=document.createElement('button');edit.type='button';edit.className='edit-draft';edit.textContent=`Edit draft ${index+1}`;edit.onclick=()=>{setActiveSlide(index);$('editor-panel').open=true;$('draft').focus();$('editor-panel').scrollIntoView({block:'nearest'});};const share=document.createElement('button');share.type='button';share.className='share-draft';share.textContent='More sharing options →';share.onclick=()=>{setActiveSlide(index);setStep(3);};const copyOnly=document.createElement('button');copyOnly.type='button';copyOnly.className='draft-copy-only';copyOnly.textContent='1. Copy review ⧉';copyOnly.onclick=async()=>{await copyDraft(index);if($('share-status').classList.contains('copy-success')){copyOnly.textContent='Copied ✓';confirmation.textContent='Review copied. Now open Google, paste, choose your rating and post.';direct.classList.remove('guide-google');void direct.offsetWidth;direct.classList.add('guide-google');requestAnimationFrame(()=>{direct.focus({preventScroll:true});direct.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});$('step-direction-text').textContent='Copied ✓ Now tap Open Google Business below.';}};const direct=document.createElement('a');direct.className='draft-open-google';direct.textContent='2. Open Google Business ↗';if(config?.businesses[0].reviewUrl)direct.href=config.businesses[0].reviewUrl;else{direct.setAttribute('aria-disabled','true');direct.textContent='Google link not configured';}direct.onclick=()=>{setActiveSlide(index);awaitingGoogleReturn=true;saveSession();};const confirmation=document.createElement('p');confirmation.className='inline-copy-confirmation';confirmation.setAttribute('role','status');confirmation.setAttribute('aria-live','polite');const tools=document.createElement('div');tools.className='draft-tools';tools.append(edit,share,copyOnly,confirmation,direct);card.append(b,tools);card.setAttribute('role','group');card.setAttribute('aria-roledescription','slide');card.setAttribute('aria-label',`Draft ${index+1} of ${drafts.length}`);$('draft-options').append(card);});
 renderSliderControls();
}

function setActiveSlide(index){
 if(!drafts.length)return;activeDraft=Math.max(0,Math.min(index,drafts.length-1));
 $('slide-count').textContent=`Draft ${activeDraft+1} of ${drafts.length}`;
 $('draft-prev').disabled=activeDraft===0;$('draft-next').disabled=activeDraft===drafts.length-1;
 [...$('draft-dots').children].forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===activeDraft)));
 updateEditor();updateQuickAction();saveSession();
}
function goToSlide(index){if(!drafts.length)return;setActiveSlide(index);const card=$('draft-options').children[activeDraft];$('draft-options').scrollTo({left:card.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function renderSliderControls(){
 $('draft-dots').replaceChildren();$('slider-controls').hidden=drafts.length<2;document.body.classList.toggle('single-draft',drafts.length===1);
 drafts.forEach((_,i)=>{const dot=document.createElement('button');dot.type='button';dot.className='draft-dot';dot.setAttribute('aria-label',`Show draft ${i+1}`);dot.onclick=()=>goToSlide(i);$('draft-dots').append(dot);});
 setActiveSlide(activeDraft);
 requestAnimationFrame(()=>{$('draft-options').scrollTo({left:$('draft-options').children[activeDraft]?.offsetLeft||0,behavior:'instant'});});
}
$('draft-prev').onclick=()=>goToSlide(activeDraft-1);$('draft-next').onclick=()=>goToSlide(activeDraft+1);
$('draft-options').addEventListener('keydown',e=>{if(e.target!==$('draft-options'))return;if(e.key==='ArrowRight'){e.preventDefault();goToSlide(activeDraft+1);}if(e.key==='ArrowLeft'){e.preventDefault();goToSlide(activeDraft-1);}});
let slideFrame=0;
$('draft-options').addEventListener('scroll',()=>{if(slideFrame)return;slideFrame=requestAnimationFrame(()=>{slideFrame=0;const track=$('draft-options');const middle=track.getBoundingClientRect().left+track.clientWidth/2;let index=0,distance=Infinity;[...track.children].forEach((card,i)=>{const rect=card.getBoundingClientRect();const next=Math.abs(rect.left+rect.width/2-middle);if(next<distance){distance=next;index=i;}});if(index!==activeDraft&&drafts.length)setActiveSlide(index);});},{passive:true});
// A swipe scrolls cards; it must not accidentally trigger copy or open Google.
let slideStart=null,slideMoved=false;
$('draft-options').addEventListener('pointerdown',e=>{slideStart={x:e.clientX,y:e.clientY};slideMoved=false;},{passive:true});
$('draft-options').addEventListener('pointermove',e=>{if(slideStart&&Math.hypot(e.clientX-slideStart.x,e.clientY-slideStart.y)>12)slideMoved=true;},{passive:true});
$('draft-options').addEventListener('pointerup',()=>{slideStart=null;},{passive:true});
$('draft-options').addEventListener('pointercancel',()=>{slideStart=null;slideMoved=true;},{passive:true});
$('draft-options').addEventListener('click',e=>{if(slideMoved&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
function showDrafts(values,label){$('draft-title').textContent=values.length===3?'Your review is ready.':'Your words, ready to share.';document.body.classList.remove('review-copied');$('open-google-profile').classList.remove('next-action','guide-google');$('share-final').textContent='1. Copy review ⧉';drafts=values.map(cleanReview);activeDraft=0;$('draft-label').textContent=label;$('original-text').textContent=sourceText();$('copy-status').textContent='';$('draft-google').hidden=true;$('editor-panel').open=false;renderDrafts();updateEditor();updateQuickAction();$('draft-section').hidden=false;setStep(2);$('draft-section').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
$('draft').oninput=()=>{drafts[activeDraft]=$('draft').value;$('draft-count').textContent=`${countWords($('draft').value)} words · Target: about 60–90`;$('draft-google').hidden=true;$('copy-status').textContent='Edited. Tap your updated draft or Copy edited review to copy again.';renderDrafts();saveSession();};
$('copy').textContent='Use edited draft →';$('copy').onclick=()=>setStep(3);
$('use-original').onclick=()=>{if(!sourceText()){status('Select your own experience points, or add your words first.');return;}revision++;showDrafts([sourceText()],'Your own points and words, ready to edit or copy.');};
$('another-draft').onclick=()=>{if(!busy)$('review-form').requestSubmit($('polish'));};
$('review-form').onsubmit=async e=>{e.preventDefault();if(busy)return;if(!ready()){status('Choose your service and at least 1 point, or add your own feedback.');return;}
 document.body.classList.remove('waiting-error');$('waiting-recovery').hidden=true;const source={language:reviewLanguage,previousDraft:[drafts[activeDraft],...recentReviews.toReversed()].find(text=>text&&matchesReviewLanguage(text,reviewLanguage)),serviceId:$('service').value,experienceIds:[...selectedIds],feedback:$('feedback').value.trim(),firsthandConfirmed:true,consent:true};const current=revision;const controller=new AbortController();activeController=controller;const timeout=setTimeout(()=>controller.abort(),70000);$('recovery-actions').hidden=true;$('live-review').textContent='';$('live-review').hidden=true;busy=true;setStep(2);$('step-loading').hidden=false;document.body.classList.add('is-writing');$('review-form').setAttribute('aria-busy','true');$('draft-section').hidden=true;$('step-label').textContent='Step 2 of 3 · Preparing your review';updateGenerateState();$('polish').textContent='Preparing your review…';status('Preparing your review. Please wait a moment.');
 let stopLottie=()=>{},stopWaiting=()=>{},waitingTyper={stop(){}};let receivedText=false;
 try{
 $('step-loading').scrollIntoView({behavior:'instant',block:'start'});
 stopLottie=playWaitingLottie();waitingTyper=createWaitTypewriter({title:$('waiting-title'),description:$('waiting-description'),announcement:$('waiting-announcement')});stopWaiting=startWaitingMessages({isStreaming:()=>receivedText,render:({seconds,message,changed})=>{$('waiting-seconds').textContent=`${seconds}s elapsed`;if(!changed)return;waitingTyper.show(message);}});

 let data;let previousDraft=source.previousDraft;
 for(let attempt=0;attempt<3;attempt++){
  if(attempt){receivedText=false;$('live-review').textContent='';$('live-review').hidden=true;waitingTyper.show(['Writing a fresh version…','We’re checking the language and wording for your selected review.']);}
  const res=await fetch('/api/polish',{signal:controller.signal,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...source,previousDraft,draftCount:1,stream:true})});
  try{data=await readReviewStream(res,delta=>{if(current!==revision)return;receivedText=true;$('live-review').hidden=false;$('live-review').textContent+=delta;$('step-direction-text').textContent='Your review is being written. Copy will be ready when it finishes.';});
  }catch(error){if(error.code==='language_mismatch'&&attempt<2){previousDraft=undefined;continue;}throw error;}
  if(!isRepeatedReview(data.drafts[0],recentReviews))break;
  previousDraft=data.drafts[0];data=undefined;
 }
 if(!data)throw Error('The new wording was too similar. Please retry for a fresh version.');
 if(current!==revision)return;recentReviews.push(data.drafts[0]);if(recentReviews.length>20)recentReviews.shift();showDrafts(data.drafts,'Read it, edit if needed, then choose this review.');$('draft-title').textContent='Your review is ready.';setStep(3);$('share-status').classList.remove('copy-success');$('share-status').textContent='Review ready. Read it once, then tap Copy review.';status('Your review is ready.');requestAnimationFrame(()=>{if(currentStep===3){$('share-final').scrollIntoView({behavior:'instant',block:'center'});$('share-final').focus({preventScroll:true});}});}
 catch(err){if(current===revision&&currentStep===2){document.body.classList.add('waiting-error');$('waiting-recovery').hidden=false;$('waiting-error-text').textContent=err.name==='AbortError'?'AI is taking longer than expected. Your points are safe. Tap Retry to try again.':err.message.includes('wording was too similar')?'We couldn’t get sufficiently different wording this time. Your points are safe. Tap Retry.':'Your review could not be completed. Your points are safe. Please try again.';$('live-review').hidden=true;}}
 finally{waitingTyper.stop();stopLottie();stopWaiting();clearTimeout(timeout);busy=false;const failed=document.body.classList.contains('waiting-error');$('step-loading').hidden=!failed;if(failed){$('waiting-title').textContent='Let’s try again';$('waiting-description').textContent='Your selected experiences are still here.';$('step-label').textContent='Step 2 of 3 · Try again';}$('step-back').hidden=currentStep===1;document.body.classList.remove('is-writing');$('review-form').removeAttribute('aria-busy');updateGenerateState();$('polish').textContent='Write my AI review →';}
};

try{const res=await fetch('/config.json');if(!res.ok)throw Error();config=await res.json();const b=config.businesses[0];if(b.reviewUrl){const u=new URL(b.reviewUrl);if(u.protocol!=='https:'||!['g.page','search.google.com','maps.google.com','www.google.com'].includes(u.hostname))b.reviewUrl='';}for(const id of ['google','draft-google','open-google-profile']){const a=$(id);if(b.reviewUrl){a.href=b.reviewUrl;a.removeAttribute('aria-disabled');}else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');}}document.querySelector('.direct-review').hidden=!b.reviewUrl; $('google').hidden=!b.reviewUrl;$('link-note').textContent=b.reviewUrl?'':'The Google review link is not configured.';renderPoints();}catch{status('Studio details could not load. Please refresh.');$('polish').disabled=true;}
renderPoints();

if(savedSession&&services.some(x=>x.id===savedSession.service)){
 $('service').value=savedSession.service;
 const pool=pointsForService(savedSession.service);
 for(const id of savedSession.points||[])if(pool.some(x=>x.id===id))selectedIds.add(id);
 for(const [id,ids] of savedSession.visible||[])if(services.some(x=>x.id===id)&&Array.isArray(ids))visiblePointIds.set(id,ids.filter(p=>pointsForService(id).some(x=>x.id===p)));
 $('feedback').value=typeof savedSession.feedback==='string'?savedSession.feedback.slice(0,3000):'';
 $('count').textContent=`${$('feedback').value.length} / 3000`;
 $('service-context').textContent=`${services.find(x=>x.id===savedSession.service).label} · Demo Studio, Sample City`;
 syncServiceButtons();compactCategory();renderPoints();
 if(!popularServices.some(([id])=>id===savedSession.service))$('more-services').open=true;
 if(Array.isArray(savedSession.drafts)&&savedSession.drafts.length<=3&&savedSession.drafts.every(x=>typeof x==='string'&&x.length<=5000)&&savedSession.drafts.length){showDrafts(savedSession.drafts,'Your saved drafts · Read, edit and share.');setActiveSlide(Number.isInteger(savedSession.activeDraft)?savedSession.activeDraft:0);goToSlide(activeDraft);}
 saveSession();
}

if(savedSession?.awaitingGoogleReturn&&drafts.length){awaitingGoogleReturn=true;restoreAfterGoogle();}

if(drafts.length&&savedSession?.step===3)setStep(3);
