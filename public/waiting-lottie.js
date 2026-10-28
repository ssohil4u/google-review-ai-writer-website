let library;
function loadPlayer(){
 if(window.lottie)return Promise.resolve(window.lottie);
 if(!library)library=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/lottie-light.min.js';script.onload=()=>resolve(window.lottie);script.onerror=()=>{library=null;script.remove();reject(Error('Animation unavailable'));};document.head.append(script);});
 return library;
}
export function playWaitingLottie(){
 let stopped=false,animation;const container=document.getElementById('waiting-lottie'),panel=document.getElementById('step-loading'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const sync=()=>{if(!animation)return;if(reduced.matches)animation.goToAndStop(75,true);else if(document.hidden)animation.pause();else animation.play();};
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 Promise.all([loadPlayer(),fetch('/assets/review-writing-lottie.json').then(res=>{if(!res.ok)throw Error();return res.json();})]).then(([lottie,data])=>{if(stopped)return;animation=lottie.loadAnimation({container,renderer:'svg',loop:true,autoplay:false,animationData:data,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});animation.addEventListener('DOMLoaded',()=>{if(stopped)return;panel.classList.add('has-lottie');sync();});animation.addEventListener('data_failed',()=>panel.classList.remove('has-lottie'));}).catch(()=>{});
 return ()=>{stopped=true;document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);animation?.destroy();container.replaceChildren();panel.classList.remove('has-lottie');};
}
