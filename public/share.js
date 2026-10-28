// Copy first, then navigate the current tab: mobile browsers need no popup permission.
export async function copyAndOpen({text,url,clipboard,fallbackCopy,navigate}){
 if(!text?.trim())throw new Error('The review is empty.');
 let copied=false;
 try{if(clipboard?.writeText){await clipboard.writeText(text);copied=true;}}catch{}
 if(!copied&&fallbackCopy){try{copied=fallbackCopy(text)===true;}catch{}}
 if(!copied)throw new Error('Automatic copying is unavailable.');
 let opened=false;
 if(url&&navigate){try{opened=navigate(url)!==false;}catch{}}
 return {copied:true,opened};
}
