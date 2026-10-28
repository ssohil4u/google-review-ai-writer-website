export async function readReviewStream(response,onDelta){
 if(!response.ok){let data;try{data=await response.json();}catch{}const error=Error(data?.error||'Review writing is unavailable.');error.code=data?.code;throw error;}
 if(!response.headers.get('Content-Type')?.includes('application/x-ndjson'))return response.json();
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',complete;
 const consume=line=>{if(!line.trim())return;const event=JSON.parse(line);if(event.type==='delta')onDelta(event.text);else if(event.type==='done')complete=event;else if(event.type==='error'){const error=Error(event.error);error.code=event.code;throw error;}};
 try{while(true){const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});let end;while((end=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,end));buffer=buffer.slice(end+1);}if(done)break;}if(buffer.trim())consume(buffer);if(!Array.isArray(complete?.drafts)||complete.drafts.length!==1||typeof complete.drafts[0]!=='string')throw Error('Review interrupted. Please retry.');return complete;}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
