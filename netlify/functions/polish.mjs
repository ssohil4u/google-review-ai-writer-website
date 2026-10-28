import {polish} from '../../worker.mjs';
export default async function handler(request){
 return polish(request,{GEMINI_API_KEY:process.env.GEMINI_API_KEY,GEMINI_MODEL:process.env.GEMINI_MODEL||'gemini-3.5-flash-lite'});
}
export const config={path:'/api/polish'};
