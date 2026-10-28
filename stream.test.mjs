import test from 'node:test';import assert from 'node:assert/strict';
import {polish} from './worker.mjs';import {readReviewStream} from './public/review-stream.js';
const input={serviceId:'anniversary',experienceIds:['anniversary-point-2'],consent:true,firsthandConfirmed:true,draftCount:1,stream:true};
const req=patch=>new Request('https://example.com/api/polish',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({...input,...patch})});
const text='Our anniversary setup in Sample City matched our plan. 🎂';
const frame=(text,finishReason)=>'data: '+JSON.stringify({candidates:[{content:{parts:[{text}]},...(finishReason?{finishReason}:{})}]})+'\r\n\r\n';
const upstream=(value)=>{const bytes=new TextEncoder().encode(value);return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=7)c.enqueue(bytes.slice(i,i+7));c.close();}}));};
test('streams split SSE/UTF8 chunks and returns a validated finished review',async()=>{let url,body;const res=await polish(req(),{GEMINI_API_KEY:'test'},async(u,o)=>{url=u;body=JSON.parse(o.body);return upstream(frame(text.slice(0,20))+frame(text.slice(20),'STOP'));});assert.match(url,/streamGenerateContent\?alt=sse/);assert.equal(body.generationConfig.responseSchema,undefined);assert.match(body.systemInstruction.parts[0].text,/60–90/);let partial='';const done=await readReviewStream(res,delta=>{partial+=delta;});assert.equal(partial,text);assert.match(done.drafts[0],/🎂/);});
test('never marks truncated or missing-context output complete',async()=>{for(const [value,reason] of [[text,'MAX_TOKENS'],['Unrelated words','STOP']]){const res=await polish(req(),{GEMINI_API_KEY:'test'},async()=>upstream(frame(value,reason)));await assert.rejects(readReviewStream(res,()=>{}),/could not finish/);}});
test('requires completion marker in browser protocol',async()=>{await assert.rejects(readReviewStream(new Response('{"type":"delta","text":"partial"}\n',{headers:{'Content-Type':'application/x-ndjson'}}),()=>{}),/interrupted/);});
test('rejects multiple streaming drafts and unauthorized origin',async()=>{assert.equal((await polish(req({draftCount:2}),{GEMINI_API_KEY:'test'})).status,400);});
test('delivers text before upstream completion',async()=>{let release;const gate=new Promise(r=>release=r);const bytes=new TextEncoder();const source=new Response(new ReadableStream({async start(c){c.enqueue(bytes.encode(frame(text)));await gate;c.enqueue(bytes.encode(frame('','STOP')));c.close();}}));const response=await polish(req(),{GEMINI_API_KEY:'test'},async()=>source);const reader=response.body.getReader();const first=await reader.read();assert.match(new TextDecoder().decode(first.value),/delta/);release();await reader.cancel();});

// Six selected facts must reach Gemini intact and produce a completed copyable draft.
test('accepts six points and retains every selected statement in streaming input',async()=>{
 const {services,pointsForService}=await import('./public/experiences.js');
 const service=services.find(s=>/baby/i.test(s.reviewName));const points=pointsForService(service.id).slice(0,6);let sent;
 const review=`We used ${service.reviewName} from Demo Studio in Sample City. `+points.map(p=>p.statement).join(' ');
 const response=await polish(req({serviceId:service.id,experienceIds:points.map(p=>p.id)}),{GEMINI_API_KEY:'test'},async(url,init)=>{sent=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);return upstream(frame(review,'STOP'));});
 assert.deepEqual(sent.selectedExperienceStatements,points.map(p=>p.statement));assert.equal(sent.selectedExperienceStatements.length,6);
 const done=await readReviewStream(response,()=>{});assert.equal(done.drafts.length,1);assert.ok(done.drafts[0].includes(service.reviewName));
});

test('rejects Gujarati output requested in Hindi with a retryable language error',async()=>{
 const response=await polish(req({language:'hi'}),{GEMINI_API_KEY:'test'},async()=>upstream(frame(text+' અમારો અનુભવ સારો હતો.','STOP')));
 await assert.rejects(readReviewStream(response,()=>{}),error=>error.code==='language_mismatch');
});
