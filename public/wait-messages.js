const messages=[
 ['Preparing your review…','Our AI is putting your selected experiences into words.'],
 ['A little moment for your demo-studio.','Your request is still in progress. You can read and edit the review when it arrives.'],
 ['Thanks for staying with us.','AI response times can vary. Your selected points are safe.'],
 ['Your review is still on its way.','It’s taking a little longer. There’s no need to tap Generate again.'],
 ['We’re still waiting for the AI.','Your review will appear here as soon as text arrives.'],
 ['A little more patience, please.','If the request cannot finish, you’ll be able to retry without selecting your points again.']
];
export function waitingMessage(seconds,streaming=false){
 if(streaming)return ['Your review is appearing…','You can read along. Copy and Open Google will be available once it’s complete.'];
 return messages[Math.min(Math.floor(Math.max(0,seconds)/5),messages.length-1)];
}
export function startWaitingMessages({render,isStreaming,now=()=>Date.now(),schedule=setInterval,unschedule=clearInterval}){
 const started=now();let lastKey='';
 const tick=()=>{const seconds=Math.floor((now()-started)/1000);const streaming=isStreaming();const message=waitingMessage(seconds,streaming);const key=message.join('|');render({seconds,message,changed:key!==lastKey});lastKey=key;};
 tick();const timer=schedule(tick,1000);return ()=>unschedule(timer);
}
