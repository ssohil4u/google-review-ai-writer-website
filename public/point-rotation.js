function shuffle(items,random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
// In-memory sampling only; no cookies, identifiers, storage or provider requests.
export function rotatePoints(pool,{selectedIds=[],previousIds=[],count=6,random=Math.random}={}){
 const selected=new Set(selectedIds),previous=new Set(previousIds);
 const pinned=pool.filter(x=>selected.has(x.id));
 const unselected=pool.filter(x=>!selected.has(x.id));
 const fresh=shuffle(unselected.filter(x=>!previous.has(x.id)),random);
 const returning=shuffle(unselected.filter(x=>previous.has(x.id)),random);
 const size=Math.min(pool.length,Math.max(count,pinned.length+Math.min(3,unselected.length)));
 const candidates=[...fresh,...returning];
 const out=[...pinned];
 if(pool.some(x=>x.kind==='photography')){
  // Keep combined-service options discoverable in every fresh sample.
  for(const isPhoto of [true,false]){
   const target=Math.min(2,pool.filter(x=>(x.kind==='photography')===isPhoto).length);
   let have=out.filter(x=>(x.kind==='photography')===isPhoto).length;
   for(const item of candidates){if(have>=target||out.length>=size)break;if((item.kind==='photography')===isPhoto&&!out.some(x=>x.id===item.id)){out.push(item);have++;}}
  }
 }
 for(const item of candidates){if(out.length>=size)break;if(!out.some(x=>x.id===item.id))out.push(item);}
 return out;
}
export function showAllPoints(pool,currentIds=[],random=Math.random){const byId=new Map(pool.map(x=>[x.id,x]));const current=currentIds.map(id=>byId.get(id)).filter(Boolean);const seen=new Set(current.map(x=>x.id));return [...current,...shuffle(pool.filter(x=>!seen.has(x.id)),random)];}

// Append a fresh batch without moving or duplicating the visible options.
export function expandPoints(pool,currentIds=[],count=6,random=Math.random){
 const byId=new Map(pool.map(x=>[x.id,x]));const current=[...new Set(currentIds)].map(id=>byId.get(id)).filter(Boolean);const seen=new Set(current.map(x=>x.id));
 return [...current,...shuffle(pool.filter(x=>!seen.has(x.id)),random).slice(0,count)];
}
