// Business/service names may remain Latin; the surrounding review must match the chosen script.
export function matchesReviewLanguage(text,language){
 const hindi=(text.match(/[\u0900-\u097f]/g)||[]).length;
 const gujarati=(text.match(/[\u0a80-\u0aff]/g)||[]).length;
 if(language==='hi')return hindi>=5&&gujarati===0;
 if(language==='gu')return gujarati>=5&&hindi===0;
 return hindi===0&&gujarati===0;
}
