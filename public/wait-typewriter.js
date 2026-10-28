export function createWaitTypewriter({title,description,announcement,reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches}){
 let timer,stopped=false;
 const cancel=()=>{clearTimeout(timer);title.classList.remove('typing-active');description.classList.remove('typing-active');};
 function show(message){
  cancel();if(stopped)return;const [heading,body]=message;if(announcement)announcement.textContent=heading+' '+body;
  if(reduced()){title.textContent=heading;description.textContent=body;return;}
  title.textContent='';description.textContent='';const targets=[[title,Array.from(heading)],[description,Array.from(body)]];let section=0,index=0;
  const tick=()=>{if(stopped)return;const [element,letters]=targets[section];element.classList.add('typing-active');element.textContent=letters.slice(0,++index).join('');if(index>=letters.length){element.classList.remove('typing-active');if(section===0){section=1;index=0;timer=setTimeout(tick,120);}return;}timer=setTimeout(tick,section===0?32:20);};
  tick();
 }
 return {show,stop(){stopped=true;cancel();}};
}
