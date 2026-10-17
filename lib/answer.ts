import { people, type Step, type Rank } from './story';
export function normalize(text: string) {
 return text.toLowerCase().normalize('NFKC').replace(/[’‘']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g,' ').trim();
}
export type Answer = {kind:'correct';rank:Rank}|{kind:'social';rank:Rank;message:string}|{kind:'grammar'|'empty';message:string};
export function evaluate(text: string, step: Step): Answer {
 const value=normalize(text);
 if(!value) return {kind:'empty',message:'聞き取れませんでした。もう一度言ってみましょう。'};
 const forms: [Rank,string][]=[['lower',step.verb],['equal',`can you ${step.verb}`],['higher',`would you mind ${step.ing}`]];
 const found=forms.find(([,prefix])=>value===normalize(prefix)||value===normalize(prefix+' '+step.tail));
 if(!found) return {kind:'grammar',message:'言葉の形を確認しましょう。Can you の後は動詞の原形、Would you mind の後は ing形です。指定の動詞で、空欄部分だけ、または文全体を言ってみましょう。'};
 const actual=found[0], expected=people[step.person].rank;
 if(actual===expected) return {kind:'correct',rank:actual};
 const message=expected==='lower'?'えっ、そんなに丁寧に頼まれると戸惑います……。いつもどおり、はっきり指示してください。':expected==='equal'?(actual==='lower'?'今日はぶっきらぼうね。焦っているの？ 同僚として頼んでほしいわ。':'ずいぶん改まっているのね。私たち、同じ騎士でしょう？'):actual==='equal'?'もう少し身分をわきまえた頼み方があるだろう。丁寧に言い直してもらおうか。':'何たる無礼！ 騎士の身分を剥奪されたいのか！ ……緊急事態ゆえ今回は許そう。丁寧に言い直しなさい。';
 return {kind:'social',rank:actual,message};
}
export function wordBank(step:Step) {return ['Would','you','mind',step.verb,'Can',step.ing,'Could','to','is'].map((word,id)=>({word,id}));}
