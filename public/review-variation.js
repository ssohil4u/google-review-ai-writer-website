const words=text=>text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu,' ').trim().split(/\s+/).filter(Boolean);
const pairs=tokens=>new Set(tokens.slice(1).map((word,i)=>tokens[i]+' '+word));
export function repeatsReview(candidate,previous){
 const a=words(candidate),b=words(previous);
 if(a.join(' ')===b.join(' '))return true;
 if(Math.min(a.length,b.length)<12)return false;
 const x=pairs(a),y=pairs(b);const shared=[...x].filter(pair=>y.has(pair)).length;
 return 2*shared/(x.size+y.size)>=.72;
}
export function isRepeatedReview(candidate,history){return history.some(previous=>repeatsReview(candidate,previous));}
