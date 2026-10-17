'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { acts, correctPrefix, ending, people, steps, tutorial } from '@/lib/story';
import { evaluate, wordBank, type Answer } from '@/lib/answer';
import { recognitionConstructor, speak, stopSpeaking, type Recognition } from '@/lib/speech';
import { Character, Item, Scene } from './scene';

type Screen='home'|'rules'|'tutorial'|'game'|'ending';
type Settings={gender:'male'|'female';audio:boolean;tutorialDone:boolean};
type Save={version:1;settings:Settings;index:number;completed:boolean;mistakes:number;clues:string[]};
const STORAGE='crown-quest-v1';
const defaults:Save={version:1,settings:{gender:'female',audio:true,tutorialDone:false},index:0,completed:false,mistakes:0,clues:[]};
function readSave():Save {
 try { const v=JSON.parse(localStorage.getItem(STORAGE)||'null');
 if(v?.version!==1)return defaults;
 return {...defaults,index:Number.isInteger(v.index)?Math.max(0,Math.min(17,v.index)):0,completed:v.completed===true,mistakes:Number.isInteger(v.mistakes)?Math.max(0,v.mistakes):0,clues:Array.isArray(v.clues)?v.clues.filter((x:unknown)=>typeof x==='string'):[],settings:{gender:v.settings?.gender==='male'?'male':'female',audio:v.settings?.audio!==false,tutorialDone:v.settings?.tutorialDone===true}};
 }catch{return defaults;}
}
function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="modal" onCancel={onClose}><div className="modal-heading"><h2>{title}</h2><button aria-label="閉じる" className="icon-button" onClick={onClose}>×</button></div>{children}</dialog>;
}
function RuleCards(){return <div className="rule-cards">
 <div><span className="rank-icon">↓</span><strong>従者に、はっきりと</strong><p>Open <small>the door.</small></p><span>動詞の原形で指示する</span></div>
 <div><span className="rank-icon">＝</span><strong>同僚に、親しみをこめて</strong><p>Can you open <small>the door?</small></p><span>Can you ＋ 動詞の原形</span></div>
 <div><span className="rank-icon">↑</span><strong>目上に、敬意をこめて</strong><p>Would you mind opening <small>the door?</small></p><span>Would you mind ＋ 動詞のing形</span></div>
 </div>}
export default function Game(){
 const [save,setSave]=useState<Save>(defaults);
 const [ready,setReady]=useState(false);
 const [screen,setScreen]=useState<Screen>('home');
 const [tutorialIndex,setTutorialIndex]=useState(0);
 const [mode,setMode]=useState<'voice'|'words'>('voice');
 const [selected,setSelected]=useState<number[]>([]);
 const [answer,setAnswer]=useState<Answer|null>(null);
 const [transcript,setTranscript]=useState('');
 const [listening,setListening]=useState(false);
 const [voiceAvailable,setVoiceAvailable]=useState(true);
 const [voiceMessage,setVoiceMessage]=useState('');
 const [panel,setPanel]=useState<'settings'|'journal'|'help'|null>(null);
 const [showHint,setShowHint]=useState(false);
 const [storageWarning,setStorageWarning]=useState(false);
 const [dragId,setDragId]=useState<number|null>(null);
 const recognition=useRef<Recognition|null>(null);
 const gotResult=useRef(false);
 const busy=useRef(false);
 const step=screen==='tutorial'?tutorial[tutorialIndex]:steps[save.index];
 const person=people[step.person];
 const bank=wordBank(step);
 const acted=answer?.kind==='correct';
 const playing=screen==='game'||screen==='tutorial';
 const update=useCallback((fn:(s:Save)=>Save)=>setSave(old=>{const next=fn(old);try{localStorage.setItem(STORAGE,JSON.stringify(next));}catch{setStorageWarning(true);}return next;}),[]);
 useEffect(()=>{
  // Read browser-only preferences after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setSave(readSave());setReady(true);setVoiceAvailable(!!recognitionConstructor());
  window.speechSynthesis?.getVoices();
  return ()=>{recognition.current?.abort();stopSpeaking();};
 },[]);
 useEffect(()=>{
  if(!ready||!save.settings.audio||panel||!playing)return;
  speak([{text:step.context,lang:'ja-JP'},{text:step.line,lang:'en-US'},{text:step.lineJa,lang:'ja-JP'}]);
  return stopSpeaking;
 },[ready,screen,save.index,tutorialIndex,save.settings.audio,panel,playing,step.context,step.line,step.lineJa]);
 useEffect(()=>{
  if(screen==='ending'&&save.settings.audio)speak([{text:ending.text,lang:'ja-JP'},{text:ending.en,lang:'en-US'},{text:ending.ja,lang:'ja-JP'}]);
 },[screen,save.settings.audio]);
 function resetInput(){recognition.current?.abort();busy.current=false;setListening(false);setSelected([]);setAnswer(null);setTranscript('');setVoiceMessage('');setShowHint(false);}
 function startGame(resume=false){resetInput();if(!resume)update(s=>({...s,index:0,completed:false,mistakes:0,clues:[]}));setScreen('game');}
 function beginTutorial(){resetInput();setTutorialIndex(0);setScreen('tutorial');}
 function submit(text:string){
  if(busy.current)return;
  const result=evaluate(text,step);setTranscript(text);setAnswer(result);
  if(result.kind==='correct'){
   busy.current=true;
   requestAnimationFrame(()=>document.querySelector('.game-main .scene')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
   if(screen==='game') update(s=>({...s,clues:step.clue&&!s.clues.includes(step.clue)?[...s.clues,step.clue]:s.clues}));
   if(save.settings.audio)speak([{text:step.result,lang:'ja-JP'}]);
  }else if(result.kind==='social'){
   if(screen==='game')update(s=>({...s,mistakes:s.mistakes+1}));
   if(save.settings.audio)speak([{text:result.message,lang:'ja-JP'}]);
  }
 }
 function listen(){
  if(listening){recognition.current?.stop();return;}
  const Constructor=recognitionConstructor();
  if(!Constructor){setVoiceAvailable(false);return;}
  stopSpeaking();setAnswer(null);setVoiceMessage('');setTranscript('');gotResult.current=false;
  const r=new Constructor();recognition.current=r;r.lang='en-US';r.interimResults=false;r.continuous=false;r.maxAlternatives=1;
  r.onresult=e=>{gotResult.current=true;const text=e.results[0]?.[0]?.transcript||'';submit(text);};
  r.onerror=e=>{gotResult.current=true;setVoiceMessage(e.error==='not-allowed'||e.error==='service-not-allowed'?'マイクを利用できません。ブラウザでマイクを許可するか、語句モードで続けられます。':e.error==='network'?'音声認識に接続できません。再試行するか、語句モードをお使いください。':'聞き取れませんでした。もう一度言ってみましょう。');};
  r.onend=()=>{setListening(false);if(!gotResult.current)setVoiceMessage('聞き取れませんでした。もう一度言ってみましょう。');};
  try{r.start();setListening(true);}catch{setListening(false);setVoiceMessage('音声入力を開始できませんでした。もう一度試すか、語句モードをお使いください。');}
 }
 function next(){
  document.querySelector('.chapter-bar')?.scrollIntoView({block:'start'});
  stopSpeaking();resetInput();
  if(screen==='tutorial'){
   if(tutorialIndex<2)setTutorialIndex(i=>i+1);
   else{update(s=>({...s,settings:{...s.settings,tutorialDone:true}}));setScreen('game');}
  }else if(save.index<17)update(s=>({...s,index:s.index+1}));
  else{update(s=>({...s,completed:true}));setScreen('ending');}
 }
 function reorder(id:number,target:number|null){
  if(!selected.includes(id)) {setSelected(s=>target===null?[...s,id]:[...s.slice(0,s.indexOf(target)),id,...s.slice(s.indexOf(target))]);}
  else setSelected(s=>{const rest=s.filter(x=>x!==id);const at=target===null?rest.length:rest.indexOf(target);return [...rest.slice(0,Math.max(0,at)),id,...rest.slice(Math.max(0,at))];});
  setAnswer(null);setDragId(null);
 }
 useEffect(()=>{if(panel){recognition.current?.abort();stopSpeaking();}},[panel]);
 function switchMode(){recognition.current?.abort();setListening(false);setMode(m=>m==='voice'?'words':'voice');setAnswer(null);setVoiceMessage('');}
 const phaseIndex=screen==='tutorial'?tutorialIndex:save.index;
 if(!ready)return <div className="loading"><span>♜</span>物語を開いています…</div>;
 return <div className="app-shell">
 <header className="site-header"><button className="brand" onClick={()=>{recognition.current?.abort();stopSpeaking();setScreen('home');}} aria-label="タイトルへ"><span className="crest">♜</span><span>THE MISSING CROWN<small>王冠と、ことばの騎士</small></span></button><div className="header-actions"><span className="chapter-label">ENGLISH ADVENTURE · CHAPTER 01</span><button className="icon-button" onClick={()=>{if(save.settings.audio)stopSpeaking();update(s=>({...s,settings:{...s.settings,audio:!s.settings.audio}}));}} aria-label={save.settings.audio?'読み上げをオフ':'読み上げをオン'} title="読み上げ">{save.settings.audio?'♫':'♪̸'}</button><button className="icon-button" aria-label="設定" onClick={()=>setPanel('settings')}>⚙</button></div></header>
 {storageWarning&&<p className="storage-warning" role="status">このブラウザでは記録を保存できません。このまま遊べますが、再読み込みすると進行が戻ります。</p>}
 {screen==='home'&&<main className="home">
 <div className="home-art"><Scene step={steps[0]} acted={false} index={0}/><div className="home-art-overlay"/></div>
 <div className="home-content"><p className="eyebrow"><span/> AN ENGLISH LEARNING ADVENTURE</p><h1>王冠と、<br/>ことばの騎士<span>The Missing Crown</span></h1><p className="home-lead">王冠が消えた。戴冠式まで、あと20分。<br/>王国を救うのは、あなたのひと言。</p><p className="home-description">従者には、はっきりと。同僚には、親しみを。<br/>伯爵には、敬意をこめて。<br/>英語で頼んで、謎を解く冒険へ。</p>
 <div className="home-meta"><span>01 <small>王冠消失事件</small></span><span>18 <small>回のことばの冒険</small></span><span>約20分</span></div>
 <fieldset className="gender-choice"><legend>あなたの騎士を選ぶ <small>あとで設定から変更できます</small></legend>{(['female','male'] as const).map(g=><button key={g} aria-pressed={save.settings.gender===g} onClick={()=>update(s=>({...s,settings:{...s.settings,gender:g}}))}><span>{g==='female'?'♘':'♞'}</span>{g==='female'?'女性の騎士':'男性の騎士'}</button>)}</fieldset>
 <button className="primary home-start" onClick={()=>{resetInput();setScreen('rules');}}>物語をはじめる <span>→</span></button>
 {!save.completed&&save.index>0&&<button className="text-button continue-save" onClick={()=>startGame(true)}>続きから · {save.index+1} / 18 →</button>}
 <p className="home-note">マイクで話すのがおすすめ。声を出せない時は語句でも遊べます。</p>
 </div><div className="home-bottom"><span>言葉を選ぶ。その先に、物語がある。</span><span>日本語ガイドつき · スマホ / PC</span></div></main>}
 {screen==='rules'&&<main className="rules-page"><p className="eyebrow">BEFORE THE ADVENTURE</p><h1>{save.settings.tutorialDone?'チュートリアルは必要ですか？':'相手に合わせて、ことばを選ぼう。'}</h1><p>あなたは城に仕える{save.settings.gender==='female'?'若き女性騎士':'若き男性騎士'}。この物語では、3つの言い方を使い分けます。</p><RuleCards/><div className="rule-note"><span>✦</span><div><strong>話すのは、空欄の部分だけ。</strong><p><b>Can you open</b> <span className="muted">the door?</span></p><p>目的語の部分は用意してあります。文全体を話してもOKです。間違えても、何度でも挑戦できます。</p></div></div><p className="real-world-note">このゲームは身分のある王国での練習です。実際の英会話では、親しさや場面によって丁寧さを選びます。</p><div className="rules-actions"><button className="primary" onClick={beginTutorial}>{save.settings.tutorialDone?'もう一度練習する':'3回の練習で試してみる'} →</button><button className={save.settings.tutorialDone?'primary secondary-primary':'text-button'} onClick={()=>startGame(false)}>物語へ進む →</button></div>{save.index>0&&!save.completed&&<button className="text-button" onClick={()=>startGame(true)}>保存した続きから遊ぶ</button>}</main>}
 {playing&&<main className="game-layout"><section className="game-main">
 <div className="chapter-bar"><div><span className="eyebrow">{screen==='tutorial'?'PROLOGUE · チュートリアル':`ACT 0${step.act} / 05`}</span><h1>{screen==='tutorial'?'騎士の、ことばの稽古':acts[step.act-1]}</h1></div><div className="step-count"><strong>{String(phaseIndex+1).padStart(2,'0')}</strong><span>/ {screen==='tutorial'?'03':'18'}</span></div></div>
 <div className="progress-track"><span style={{width:`${(phaseIndex+(acted?1:0))/(screen==='tutorial'?3:18)*100}%`}}/></div>
 <Scene step={step} acted={acted} index={screen==='tutorial'?0:save.index}/>
 {acted?<div className="dialogue action-result"><div className="speaker-label"><span/>STORY UPDATE<small>あなたのことばで、物語が動いた。</small></div><p className="result-narration">{step.result}</p><button className="primary next-button" onClick={next}>{screen==='tutorial'&&tutorialIndex===2?'王冠の物語へ':screen==='game'&&save.index===17?'エンディングへ':'物語を進める'} <span>→</span></button></div>:<div className="dialogue"><div className="speaker-label"><span style={{background:person.color}}/>{person.name}<small>{person.ja} · {person.title}</small><button className="icon-button replay" aria-label="セリフをもう一度聞く" onClick={()=>speak([{text:step.line,lang:'en-US'},{text:step.lineJa,lang:'ja-JP'}])}>▷</button></div><p className="npc-english">“{step.line}”</p><p className="npc-ja">{step.lineJa}</p></div>}

 <section className="input-panel" aria-label="あなたの依頼"><div className="input-heading"><span className="eyebrow">YOUR TURN <span>あなたのひと言</span></span><button className="text-button mode-toggle" disabled={acted} onClick={switchMode}>{mode==='voice'?'声が出せませんか？ 語句で組み立てる':'音声で伝える'} ⇄</button></div><p className="request-ja">{step.ja}</p>
 <div className={`sentence-area ${acted?'sentence-correct':''}`}><span className="sentence-blank">{acted?correctPrefix(step):mode==='words'&&selected.length?selected.map(id=>bank[id].word).join(' '):'　　　　　　　　　'}</span><span className="sentence-tail"> {step.tail}{person.rank==='lower'?'.':'?'}</span></div>
 {!acted&&mode==='voice'&&<div className="voice-input"><button className={`mic-button ${listening?'listening':''}`} onClick={listen} disabled={!voiceAvailable} aria-label={listening?'録音を終了':'マイクで話す'}><svg width="24" height="28" viewBox="0 0 24 28" aria-hidden="true"><rect x="8" y="2" width="8" height="15" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M4 11v3a8 8 0 0 0 16 0v-3M12 22v4m-4 0h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button><div><strong>{listening?'聞いています…':voiceAvailable?'マイクを押して、英語で伝えよう':'このブラウザは音声入力に対応していません'}</strong><p>{voiceAvailable?'空欄だけでOK。文全体を言っても大丈夫。':'語句で組み立てるモードなら、そのまま遊べます。'}</p>{!voiceAvailable&&<button className="text-button" onClick={switchMode}>語句モードで続ける →</button>}</div></div>}
 {!acted&&mode==='words'&&<div className="word-input"><div className="word-answer" aria-label="組み立てた語句" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragId!==null)reorder(dragId,null);}}>{selected.length===0?<span className="word-placeholder">語句をタップ、またはここへドラッグ</span>:selected.map((id,i)=><div key={id} className="selected-word" draggable onDragStart={e=>{setDragId(id);e.dataTransfer.setData('text/plain',String(id));}} onDragEnd={()=>setDragId(null)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();e.stopPropagation();if(dragId!==null&&dragId!==id)reorder(dragId,id);}}><button aria-label={`${bank[id].word}を戻す`} onClick={()=>{setSelected(s=>s.filter(x=>x!==id));setAnswer(null);}}>{bank[id].word}<span>×</span></button><div className="reorder-buttons"><button disabled={i===0} aria-label={`${bank[id].word}を左へ`} onClick={()=>reorder(id,selected[i-1])}>‹</button><button disabled={i===selected.length-1} aria-label={`${bank[id].word}を右へ`} onClick={()=>{const target=selected[i+2]??null;reorder(id,target);}}>›</button></div></div>)}</div><div className="word-bank" aria-label="使える語句">{bank.map(({word,id})=><button key={id} draggable={!selected.includes(id)} disabled={selected.includes(id)} onClick={()=>{setSelected(s=>[...s,id]);setAnswer(null);}} onDragStart={e=>{setDragId(id);e.dataTransfer.setData('text/plain',String(id));}} onDragEnd={()=>setDragId(null)}>{word}</button>)}</div><div className="word-actions"><button className="text-button" disabled={!selected.length} onClick={()=>{setSelected([]);setAnswer(null);}}>すべて戻す</button><button className="primary" disabled={!selected.length} onClick={()=>submit(selected.map(id=>bank[id].word).join(' '))}>このことばで伝える →</button></div></div>}
 {voiceMessage&&<p className="system-message" role="status">{voiceMessage}</p>}
 {transcript&&mode==='voice'&&<p className="transcript">聞き取ったことば：<span>{transcript}</span></p>}
 {answer&&<div className={`feedback feedback-${answer.kind}`} role="status">{answer.kind==='correct'?<><span className="feedback-symbol">✓</span><div><strong>ことばが、届いた。</strong></div></>:<><span className="feedback-symbol">{answer.kind==='social'?'…':'↻'}</span><div><strong>{answer.kind==='social'?`${person.ja}の反応`:answer.kind==='empty'?'もう一度、どうぞ':'ことばの形を確認しよう'}</strong><p>{answer.message}</p><button className="text-button" onClick={()=>{setAnswer(null);setSelected([]);setTranscript('');}}>もう一度伝える ↻</button></div></>}</div>}
 {!acted&&<div className="input-footnote"><span>{person.rank==='lower'?'↓ あなたより下の身分':person.rank==='equal'?'＝ あなたと同じ身分':'↑ あなたより上の身分'}</span><button className="text-button" onClick={()=>setShowHint(v=>!v)}>{showHint?'ヒントを閉じる':'ヒントを見る'} ◇</button></div>}
 {showHint&&!acted&&<p className="hint">{person.rank==='lower'?'動詞の原形から始めよう。':person.rank==='equal'?'Can you に動詞の原形を続けよう。':'Would you mind に動詞のing形を続けよう。'}<br/><strong>{correctPrefix(step)}</strong><span className="muted"> {step.tail}</span></p>}
 </section></section>
 <aside className="quest-sidebar"><div className="quest-card"><p className="eyebrow">YOUR QUEST</p><div className="quest-icon"><Item kind="crown"/></div><h2>消えた王冠を探せ</h2><p>{step.context}</p><div className="quest-time"><span>◷ 戴冠式まで</span><strong>{save.index<7?'20':save.index<12?'10':save.index<14?'05':save.index<15?'02':'あと少し'}<small>{save.index<15?'分':''}</small></strong></div><p className="time-note">物語上の時刻です。自分のペースで進めましょう。</p></div><div className="party-card"><p className="eyebrow">YOUR COMPANIONS</p>{(['thomas','elena','aldric'] as const).map(p=><div className={`party-member ${p===step.person?'active':''}`} key={p}><div className="party-avatar"><Character person={p}/></div><div><strong>{people[p].name}</strong><span>{people[p].title}</span></div><span className="party-rank">{people[p].rank==='lower'?'↓':people[p].rank==='equal'?'＝':'↑'}</span></div>)}</div><button className="journal-button" onClick={()=>setPanel('journal')}><span>▤ 冒険の手帳</span><small>{save.clues.length} の手がかり →</small></button><button className="text-button sidebar-help" onClick={()=>setPanel('help')}>ことばのルールを確認 ◇</button></aside>
 <button className="mobile-journal" onClick={()=>setPanel('journal')}>▤ 手帳 · {save.clues.length}</button>
 </main>}
 {screen==='ending'&&<main className="ending-page"><div className="ending-emblem"><Item kind="crown"/><Item kind="dragon"/></div><p className="eyebrow">QUEST COMPLETE</p><h1>王冠は、ふたたび国王のもとへ。</h1><p className="ending-story">{ending.text}</p><blockquote>“{ending.en}”<small>{ending.ja}</small></blockquote><p className="ending-message">18のひと言が、王国を救った。<br/>あなたの冒険は、ここでひと区切り。</p><div className="ending-stats"><span><strong>18 / 18</strong>依頼を達成</span><span><strong>6 × 3</strong>3つの言い方を練習</span><span><strong>{save.clues.length}</strong>集めた手がかり</span></div><RuleCards/><button className="primary" onClick={()=>{stopSpeaking();setScreen('home');}}>タイトルに戻る →</button><p className="eyebrow end-label">THE END · THANK YOU FOR PLAYING</p></main>}
 <footer className="site-footer"><span>THE MISSING CROWN</span><span>あなたのひと言で、物語が動く。</span><button className="text-button" onClick={()=>setPanel('help')}>遊び方</button></footer>
 {panel==='settings'&&<Modal title="冒険の設定" onClose={()=>setPanel(null)}><label className="setting-row">読み上げ<button role="switch" aria-checked={save.settings.audio} className={`switch ${save.settings.audio?'on':''}`} onClick={()=>{stopSpeaking();update(s=>({...s,settings:{...s.settings,audio:!s.settings.audio}}));}}>{save.settings.audio?'ON':'OFF'}</button></label><p className="setting-note">利用できる場合はGoogleの音声を優先します。音声入力はブラウザや端末の対応状況によって利用できない場合があります。</p><fieldset className="gender-choice"><legend>プレイヤーの性別</legend>{(['female','male'] as const).map(g=><button key={g} aria-pressed={save.settings.gender===g} onClick={()=>update(s=>({...s,settings:{...s.settings,gender:g}}))}>{g==='female'?'女性の騎士':'男性の騎士'}</button>)}</fieldset><button className="text-button" onClick={()=>{setPanel(null);resetInput();setScreen('rules');}}>ルールとチュートリアルを見る →</button><p className="setting-note">性別・チュートリアルの受講状況・冒険の進行は、このブラウザに自動保存されます。</p></Modal>}
 {panel==='help'&&<Modal title="ことばのルール" onClose={()=>setPanel(null)}><RuleCards/><p>入力するのは、依頼のはじめと動詞だけ。後ろの言葉は画面に用意してあります。文全体を話しても正解です。</p><p>語句モードではタップで選択・取り消しができます。選んだ語句はドラッグ、または下の矢印で並べ替えられます。</p><p className="real-world-note">身分による使い分けはこの物語の設定です。実際には、相手との関係や状況に合わせて選びましょう。</p></Modal>}
 {panel==='journal'&&<Modal title="冒険の手帳" onClose={()=>setPanel(null)}><p className="eyebrow">CLUES & DISCOVERIES</p>{save.clues.length?<ol className="clue-list">{save.clues.map((c,i)=><li key={c}><span>{String(i+1).padStart(2,'0')}</span>{c}</li>)}</ol>:<p>まだ手がかりはありません。仲間に声をかけて、王冠の行方を探しましょう。</p>}</Modal>}
 </div>;
}
