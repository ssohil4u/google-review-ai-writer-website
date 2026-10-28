import test from 'node:test';
import assert from 'node:assert/strict';
import {polish,formatDraft} from './worker.mjs';
import {pointsForService,services} from './public/experiences.js';
const env={GEMINI_API_KEY:'test-key'};
const valid={serviceId:'beach',experienceIds:['beach-point-1','beach-point-2','beach-point-5'],feedback:'',firsthandConfirmed:true,consent:true};
function req(data=valid,headers={}){return new Request('https://example.com/api/polish',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json',...headers},body:JSON.stringify(data)});}
const options=['I used the beach setup and decoration service from Demo Studio in Sample City. The team was helpful, I liked the decoration, and the setup was ready on time.','For beach setup and decoration, I used Demo Studio in Sample City. I liked the decoration. The team was helpful and the setup was ready on time.','My beach setup and decoration experience was with Demo Studio in Sample City. The setup was ready on time, the team was helpful, and I liked the decoration.'];
const answer=(drafts=options)=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({drafts})}]}}]});
test('rejects cross-origin requests',async()=>assert.equal((await polish(req(valid,{Origin:'https://other.example'}),env)).status,403));
test('requires consent and firsthand confirmation through Generate',async()=>{for(const patch of [{consent:false},{firsthandConfirmed:false}])assert.equal((await polish(req({...valid,...patch}),env)).status,400);});
test('requires a valid category and at least one point for selection-only generation',async()=>{for(const patch of [{serviceId:''},{serviceId:'invented'},{experienceIds:[]}])assert.equal((await polish(req({...valid,...patch}),env)).status,400);});
test('permits more than three and all available points',async()=>{const ids=pointsForService('beach').map(x=>x.id);assert.ok(ids.length>3);assert.equal((await polish(req({...valid,experienceIds:ids}),env,async()=>answer())).status,200);});
test('rejects unknown, duplicate, and wrong-category points',async()=>{for(const ids of [['made-up','team-helpful','value-good'],['team-helpful','team-helpful','value-good'],['team-helpful','film-liked','value-good']])assert.equal((await polish(req({...valid,experienceIds:ids}),env)).status,400);});
test('allows written criticism without preset points and passes it unchanged',async()=>{let source;const feedback='The setup was late and communication was poor.';const response=await polish(req({...valid,experienceIds:[],feedback}),env,async(url,opts)=>{const body=JSON.parse(opts.body);source=JSON.parse(body.contents[0].parts[0].text);assert.match(body.systemInstruction.parts[0].text,/Never turn negative or mixed feedback positive/);return answer();});assert.equal(response.status,200);assert.equal(source.feedback,feedback);assert.deepEqual(source.selectedExperienceStatements,[]);});
test('uses canonical service/location and asks for exactly three JSON drafts',async()=>{let source;const response=await polish(req(),env,async(url,opts)=>{assert.match(url,/gemini-3.5-flash-lite:generateContent$/);assert.equal(opts.headers['x-goog-api-key'],'test-key');const body=JSON.parse(opts.body);source=JSON.parse(body.contents[0].parts[0].text);assert.equal(body.generationConfig.responseMimeType,'application/json');assert.equal(body.generationConfig.responseSchema.properties.drafts.maxItems,3);return answer();});assert.deepEqual(await response.json(),{drafts:options.map(formatDraft)});assert.equal(source.serviceName,'beach setup and decoration');assert.equal(source.businessLocation,'Sample City');assert.deepEqual(source.selectedExperienceStatements,['The beach arrangement matched our plan.','We liked the beach decoration.','The beach setup was ready on time.']);});
test('reports missing key and production rate limiting',async()=>{assert.equal((await polish(req(),{})).status,503);assert.equal((await polish(req(),{...env,POLISH_LIMITER:{limit:async()=>({success:false})}})).status,429);});
test('handles provider errors without leaking secrets',async()=>{for(const code of [401,429,500]){const res=await polish(req(),env,async()=>new Response('private detail',{status:code}));assert.equal(res.status,code===429?429:502);assert.doesNotMatch(await res.text(),/private detail|test-key/);}});
test('rejects missing, duplicate or context-free variants',async()=>{for(const drafts of [options.slice(0,2),[options[0],options[0],options[0]],['A','B','C']])assert.equal((await polish(req(),env,async()=>answer(drafts))).status,502);});
test('rejects incomplete, malformed JSON and failed upstream requests',async()=>{for(const fetcher of [async()=>Response.json({candidates:[{finishReason:'MAX_TOKENS'}]}),async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'not json'}]}}]}),async()=>{throw Error('network');}])assert.equal((await polish(req(),env,fetcher)).status,502);});
test('category change exposes relevant options and no negative presets',()=>{assert.ok(pointsForService('beach').some(x=>x.id==='beach-point-1'));assert.ok(!pointsForService('beach').some(x=>x.id==='wedding-point-1'));assert.ok(pointsForService('wedding').some(x=>x.id==='wedding-point-1'));assert.ok(!pointsForService('beach').some(x=>/did not|late|could improve/i.test(x.label)));});

test('all 18 categories contain only their own points and never reuse another category’s IDs',()=>{const seen=new Set();for(const service of services){const points=pointsForService(service.id);assert.ok(points.length>=3);for(const point of points){assert.equal(point.serviceId,service.id);assert.equal(seen.has(point.id),false);seen.add(point.id);}}assert.equal(services.length,18);});

test('preserves two review paragraphs and their criticism for display and copy',()=>{const source='We booked the service in Sample City.  The setup matched our plan.\n\nThe photos arrived late. We wanted clearer updates.';assert.equal(formatDraft(source),'We booked the service in Sample City. The setup matched our plan.\n\nThe photos arrived late. We wanted clearer updates.');});
test('adds paragraph spacing to a flat review without dropping or inventing sentences',()=>{assert.equal(formatDraft('The setup matched our plan. The photos arrived late.'),'The setup matched our plan.\n\nThe photos arrived late.');});
test('supports first draft and two background variants with matching schema',async()=>{for(const count of [1,2]){let schema;const res=await polish(req({...valid,draftCount:count,previousDraft:options[2]}),env,async(url,init)=>{schema=JSON.parse(init.body).generationConfig.responseSchema.properties.drafts;return answer(options.slice(0,count));});assert.equal(res.status,200);assert.equal(schema.minItems,count);assert.equal((await res.json()).drafts.length,count);}assert.equal((await polish(req({...valid,draftCount:4}),env)).status,400);});

test('converts decimal, hex and escaped emoji entities into actual Unicode',()=>{assert.equal(formatDraft('Cake &#127874;&#127881;'), 'Cake 🎂🎉');assert.equal(formatDraft('Cake &#x1F382;'), 'Cake 🎂');assert.equal(formatDraft('Cake &amp;#127874;'), 'Cake 🎂');assert.equal(formatDraft('Invalid &#99999999;'), 'Invalid');});

test("accepts one genuine point for a single draft",async()=>assert.equal((await polish(req({...valid,experienceIds:valid.experienceIds.slice(0,1),draftCount:1}),env,async()=>answer(options.slice(0,1)))).status,200));

test('supports four explicit output languages and rejects unknown languages',async()=>{
 for(const [language,script] of [['en','Indian English'],['hi','Devanagari'],['hinglish','Latin script'],['gu','Gujarati script']]){
  let instruction;const res=await polish(req({...valid,language}),env,async(url,init)=>{instruction=JSON.parse(init.body).systemInstruction.parts[0].text;return answer(options.map(x=>(language==='hi'?'हमारा अनुभव अच्छा था। ':language==='gu'?'અમારો અનુભવ સારો હતો. ':'')+x));});
  assert.equal(res.status,200);assert.ok(instruction.includes('REQUIRED OUTPUT LANGUAGE:'));assert.ok(instruction.includes(script));
 }
 assert.equal((await polish(req({...valid,language:'unsupported'}),env)).status,400);
});

test('does not send a Gujarati previous draft as a Hindi wording reference',async()=>{
 let sent;const response=await polish(req({...valid,language:'hi',previousDraft:'અમારો અનુભવ સારો હતો.'}),env,async(url,init)=>{sent=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);return answer(options.map(x=>'हमारा अनुभव अच्छा था। '+x));});
 assert.equal(response.status,200);assert.equal(sent.previousDraft,undefined);
});
