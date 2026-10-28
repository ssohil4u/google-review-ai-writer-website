import test from 'node:test';
import assert from 'node:assert/strict';
import {rotatePoints,showAllPoints} from './public/point-rotation.js';
import {pointsForService,services} from './public/experiences.js';
const pool=pointsForService('wedding');
test('starts with six distinct category-relevant choices without changing catalog',()=>{const before=JSON.stringify(pool);const sample=rotatePoints(pool,{random:()=>0.3});assert.equal(sample.length,6);assert.equal(new Set(sample.map(x=>x.id)).size,6);assert.ok(sample.every(x=>x.serviceId==='wedding'));assert.equal(JSON.stringify(pool),before);});
test('different random draws produce different opening sets and order',()=>{assert.notDeepEqual(rotatePoints(pool,{random:()=>0.1}).map(x=>x.id),rotatePoints(pool,{random:()=>0.9}).map(x=>x.id));});
test('rotation prioritizes unseen options and preserves selected points',()=>{const initial=rotatePoints(pool,{random:()=>0.4});const pinned=initial.slice(0,3).map(x=>x.id);const rotated=rotatePoints(pool,{selectedIds:pinned,previousIds:initial.map(x=>x.id),random:()=>0.4});assert.ok(pinned.every(id=>rotated.some(x=>x.id===id)));assert.ok(rotated.some(x=>!initial.some(y=>y.id===x.id)));assert.equal(rotated.length,6);});
test('all selected points survive rotation even beyond the initial sample size',()=>{const selected=pool.slice(0,8).map(x=>x.id);const rotated=rotatePoints(pool,{selectedIds:selected,previousIds:pool.map(x=>x.id)});assert.ok(selected.every(id=>rotated.some(x=>x.id===id)));assert.equal(rotated.length,9);});
test('show all appends remaining choices without moving current ones or duplicating',()=>{const initial=rotatePoints(pool);const expanded=showAllPoints(pool,initial.map(x=>x.id));assert.deepEqual(expanded.slice(0,6),initial);assert.equal(expanded.length,pool.length);assert.equal(new Set(expanded.map(x=>x.id)).size,pool.length);});
test('every category can rotate independently, empty category stays empty',()=>{for(const service of services)assert.ok(rotatePoints(pointsForService(service.id)).every(x=>x.serviceId===service.id));assert.deepEqual(rotatePoints([]),[]);});
test('combined categories show photography and setup choices in fresh samples',()=>{for(const service of services.filter(x=>x.group==='setup')){const pool=pointsForService(service.id);assert.equal(pool.filter(x=>x.kind==='photography').length,5);for(const draw of [0.1,0.4,0.9]){const sample=rotatePoints(pool,{random:()=>draw});assert.ok(sample.filter(x=>x.kind==='photography').length>=2);assert.ok(sample.filter(x=>x.kind!=='photography').length>=2);assert.ok(sample.every(x=>x.serviceId===service.id));}}});

test('adds six unique unseen options without moving the initial six',async()=>{
 const {expandPoints}=await import('./public/point-rotation.js');
 const pool=Array.from({length:15},(_,i)=>({id:String(i)}));const ids=pool.slice(0,6).map(p=>p.id);
 const expanded=expandPoints(pool,ids,6,()=>.4);
 assert.equal(expanded.length,12);assert.deepEqual(expanded.slice(0,6).map(p=>p.id),ids);assert.equal(new Set(expanded.map(p=>p.id)).size,12);
 assert.equal(expandPoints(pool.slice(0,9),ids).length,9);
});
