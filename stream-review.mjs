// Frame upstream SSE safely across arbitrary network chunk boundaries.
export async function* geminiEvents(body,onReader=()=>{}){
 const reader=body.getReader(),decoder=new TextDecoder();onReader(reader);let buffer='';
 try{while(true){const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');let boundary;
 while((boundary=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);const data=frame.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');if(data&&data!=='[DONE]')yield JSON.parse(data);}
 if(done){if(buffer.trim()){const data=buffer.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');if(data&&data!=='[DONE]')yield JSON.parse(data);}break;}}
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function streamReview(upstream,serviceName,formatDraft,validLanguage=()=>true){
 const encoder=new TextEncoder();let cancelled=false,upstreamReader;
 const stream=new ReadableStream({async start(controller){const send=data=>{if(!cancelled)controller.enqueue(encoder.encode(JSON.stringify(data)+'\n'));};let raw='',reason='';
 try{for await(const event of geminiEvents(upstream.body,reader=>{upstreamReader=reader;})){if(cancelled)break;const candidate=event.candidates?.[0];if(event.error||event.promptFeedback?.blockReason)throw Error();if(candidate?.finishReason)reason=candidate.finishReason;const delta=(candidate?.content?.parts||[]).filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('');if(delta){raw+=delta;if(raw.length>5000)throw Error();send({type:'delta',text:delta});}}
 if(!cancelled){const draft=formatDraft(raw);if(reason!=='STOP'||!draft.trim()||!draft.toLowerCase().includes('sample city')||!draft.toLowerCase().includes(serviceName.toLowerCase()))throw Error();if(!validLanguage(draft)){send({type:'error',code:'language_mismatch',error:'The review used the wrong language. Retrying is needed.'});return;}send({type:'done',drafts:[draft]});}
 }catch{send({type:'error',error:'Your review could not finish. Please retry; your selections are safe.'});}
 finally{if(!cancelled)controller.close();}},cancel(){cancelled=true;if(upstreamReader)upstreamReader.cancel().catch(()=>{});}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff'}});
}
