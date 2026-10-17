export interface RecognitionResultEvent { results: { [index:number]: { [index:number]: {transcript:string}; isFinal:boolean }; length:number }; }
export interface Recognition {
 lang:string; interimResults:boolean; continuous:boolean; maxAlternatives:number;
 onresult:((event:RecognitionResultEvent)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null; start():void; stop():void; abort():void;
}
export function recognitionConstructor(): (new()=>Recognition)|undefined {
 const w=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
 return w.SpeechRecognition||w.webkitSpeechRecognition;
}
export function speak(lines:{text:string;lang:string}[]) {
 if(!('speechSynthesis' in window)) return;
 window.speechSynthesis.cancel();
 const voices=window.speechSynthesis.getVoices();
 for(const line of lines){
  const u=new SpeechSynthesisUtterance(line.text); u.lang=line.lang;u.rate=line.lang==='en-US'?.88:1;
  const candidates=voices.filter(v=>v.lang.startsWith(line.lang.slice(0,2)));
  u.voice=candidates.find(v=>/Google/i.test(v.name))||candidates.find(v=>!/Apple/i.test(v.name))||candidates[0]||null;
  window.speechSynthesis.speak(u);
 }
}
export function stopSpeaking(){if('speechSynthesis' in window) window.speechSynthesis.cancel();}
