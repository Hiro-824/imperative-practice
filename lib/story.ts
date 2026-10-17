export type Rank = 'lower' | 'equal' | 'higher';
export type Person = 'thomas' | 'elena' | 'aldric' | 'cook';
export type Scene = 'chamber' | 'kitchen' | 'storeroom' | 'hall';
export type Action = 'tracks' | 'log' | 'follow' | 'witness' | 'cart' | 'list' | 'julian' | 'guard' | 'unlock' | 'boxes' | 'noise' | 'dragon' | 'doors' | 'windows' | 'delay' | 'brooch' | 'cakes' | 'basket';
export interface Step {
  person: Person; verb: string; ing: string; tail: string; ja: string;
  act: number; scene: Scene; context: string; line: string; lineJa: string;
  result: string; action: Action; clue?: string;
}
export const people = {
  thomas: { name: 'Thomas', ja: 'トーマス', title: 'あなたの従者', rank: 'lower' as Rank, color: '#93b9a6' },
  elena: { name: 'Elena', ja: 'エレナ', title: '同僚の騎士', rank: 'equal' as Rank, color: '#96b9cf' },
  aldric: { name: 'Count Aldric', ja: 'アルドリック伯爵', title: '上級貴族', rank: 'higher' as Rank, color: '#d5b676' },
  cook: { name: 'The cook', ja: '料理人', title: '城の料理人', rank: 'lower' as Rank, color: '#cfa692' },
};
export const acts = ['王冠の消失', '厨房の怪しい男', '地下倉庫の秘密', 'ドラゴン大脱走', '最後の作戦'];
export const locations: Record<Scene, string> = { chamber: '王冠の間', kitchen: '王宮の厨房', storeroom: '地下の王室倉庫', hall: '戴冠式の大広間' };
export const steps: Step[] = [
 {person:'thomas',verb:'check',ing:'checking',tail:'the floor',ja:'床を調べて。',act:1,scene:'chamber',context:'午前11時40分。戴冠式まで20分。王冠が消えた部屋には、泥の跡と開いた扉だけが残されていた。',line:'The crown is gone! There is mud on the floor.',lineJa:'王冠がありません！ 床に泥がついています。',result:'トーマスがかがむと、小さな三本指の足跡が見つかった。すぐそばには、黒い焦げ跡もある。',action:'tracks',clue:'三本指の足跡と焦げ跡'},
 {person:'aldric',verb:'show',ing:'showing',tail:"me the guard’s log",ja:'警備記録を見せていただけますか。',act:1,scene:'chamber',context:'いつ王冠が持ち去られたのか。警備の責任者である伯爵が、記録を持っている。',line:'I have the guard’s log. What do you need?',lineJa:'警備記録は私が持っている。何が必要かな？',result:'伯爵が記録を広げた。11時30分には王冠があった。不審者の記録はないが、準備の使用人は何人も出入りしていた。',action:'log',clue:'11時30分には王冠があった'},
 {person:'elena',verb:'follow',ing:'following',tail:'these footprints',ja:'この足跡を追ってくれる？',act:1,scene:'chamber',context:'小さな足跡は部屋の外へ続いている。同僚のエレナに追跡を頼もう。',line:'These footprints lead out of the room.',lineJa:'この足跡、部屋の外へ続いているわ。',result:'エレナは足跡をたどり、使用人用の通路へ進んだ。その先から、厨房のにぎやかな音が聞こえる。',action:'follow'},
 {person:'cook',verb:'tell',ing:'telling',tail:'me what you saw',ja:'見たことを教えて。',act:2,scene:'kitchen',context:'厨房では料理人たちが大忙しだ。泥の足跡はここで途切れている。',line:'I saw a strange man here a little while ago.',lineJa:'さっき、ここで妙な男を見ましたよ。',result:'「青い外套の男が大きな木箱を抱えてきました。何かを追い回したあと、木箱を持って地下へ行きました」',action:'witness',clue:'青い外套の男と木箱'},
 {person:'elena',verb:'examine',ing:'examining',tail:'that cart',ja:'あの荷車を調べてくれる？',act:2,scene:'kitchen',context:'厨房の隅に、置き去りにされた荷車がある。何か手がかりが残っているかもしれない。',line:'That cart must belong to the man in blue.',lineJa:'あの荷車、青い外套の男が使ったものかしら。',result:'エレナが荷車を調べると、木箱の破片に王立動物飼育所の紋章があった。中にいたのは動物らしい。',action:'cart',clue:'王立動物飼育所の紋章'},
 {person:'aldric',verb:'show',ing:'showing',tail:'me today’s delivery list',ja:'今日の納品記録を見せていただけますか。',act:2,scene:'kitchen',context:'動物の届け物があったはずだ。王室への納品記録を伯爵に確認してもらおう。',line:'Every royal delivery is recorded.',lineJa:'王室への届け物はすべて記録されている。',result:'記録には、王女から新国王への「特別な贈り物」。届けたのは飼育係のジュリアンと書かれていた。',action:'list',clue:'王女の贈り物／飼育係ジュリアン'},
 {person:'thomas',verb:'find',ing:'finding',tail:'Julian',ja:'ジュリアンを探して。',act:2,scene:'kitchen',context:'贈り物を運んだ人物に、直接話を聞く必要がある。',line:'I can search the castle for you.',lineJa:'私が城内を探しましょう。',result:'トーマスが青い外套のジュリアンを連れてきた。「王女様の動物が逃げて……捕まえて木箱に戻しました。今は地下倉庫です。種類は約束で言えません」',action:'julian',clue:'動物は逃げたあと地下倉庫へ'},
 {person:'elena',verb:'ask',ing:'asking',tail:'the guard when the crate arrived',ja:'木箱がいつ届いたか、警備兵に聞いてくれる？',act:3,scene:'storeroom',context:'地下倉庫の入口。王女の木箱が運び込まれた時刻を確かめよう。',line:'The guard may know when the crate arrived.',lineJa:'木箱が届いた時刻なら、警備兵が知っていそうね。',result:'エレナが警備兵に尋ねた。木箱の到着は11時38分。王冠が消えた時間帯とぴったり一致する。',action:'guard',clue:'木箱の到着は11時38分'},
 {person:'aldric',verb:'open',ing:'opening',tail:'the royal storeroom',ja:'王室倉庫を開けていただけますか。',act:3,scene:'storeroom',context:'重い扉には鍵がかかっている。鍵を持つ伯爵に頼もう。',line:'Only my key can open this storeroom.',lineJa:'この倉庫を開けられるのは、私の鍵だけだ。',result:'伯爵が鍵を回すと、重い扉が開いた。薄暗い倉庫には、戴冠式の贈り物が大小の木箱に詰められている。',action:'unlock'},
 {person:'thomas',verb:'move',ing:'moving',tail:'those boxes',ja:'あの木箱を動かして。',act:3,scene:'storeroom',context:'木箱が積み上がり、奥が見えない。トーマスに道を作ってもらおう。',line:'These boxes are blocking the way.',lineJa:'この木箱が邪魔で、奥に進めません。',result:'トーマスが手前の木箱を横へ動かした。奥から、カリッ、カリッ……何かが木を引っかく音がする。',action:'boxes'},
 {person:'elena',verb:'check',ing:'checking',tail:'that noise',ja:'あの音を調べてくれる？',act:3,scene:'storeroom',context:'奇妙な音が倉庫に響く。その出どころを調べよう。',line:'Listen. Something is scratching inside.',lineJa:'聞いて。中で何かが引っかいているわ。',result:'エレナが大きな木箱に耳を寄せる。中には何かがいる。蓋には王女の封印が施されていた。',action:'noise',clue:'王女の封印がある木箱'},
 {person:'aldric',verb:'let',ing:'letting',tail:'us open this crate',ja:'この木箱を開ける許可をいただけますか。',act:3,scene:'storeroom',context:'王女の封印を勝手には破れない。伯爵に許可を求めよう。',line:'That is the princess’s seal. Be careful.',lineJa:'それは王女殿下の封印だ。慎重にな。',result:'伯爵の許可で蓋を開けると、王冠を抱いた赤い小さなドラゴン！ 足跡も焦げ跡も、この子の仕業だった。ジュリアンは翼の下の王冠に気づかなかったのだ。次の瞬間、ドラゴンが飛び出した！',action:'dragon',clue:'犯人は王女の小さなドラゴン'},
 {person:'thomas',verb:'close',ing:'closing',tail:'the doors',ja:'扉を閉めて！',act:4,scene:'hall',context:'ドラゴンが階段を駆け上がり、戴冠式の大広間に飛び込んだ。逃げ道をふさごう。',line:'The dragon is heading for the doors!',lineJa:'ドラゴンが扉の方へ向かっています！',result:'トーマスが大広間の両扉を閉めた。ドラゴンは翼を広げ、高い窓へ向かって飛び上がる。',action:'doors'},
 {person:'elena',verb:'shut',ing:'shutting',tail:'the windows',ja:'窓を閉めてくれる？',act:4,scene:'hall',context:'ドラゴンが窓から外へ出たら、王冠を取り戻せなくなる。',line:'It is flying toward the windows!',lineJa:'窓の方に飛んでいくわ！',result:'エレナが窓を閉めると、ドラゴンはシャンデリアにとまった。王冠はまだ腕の中。時計は11時58分、式まであと2分だ。',action:'windows'},
 {person:'aldric',verb:'delay',ing:'delaying',tail:'the ceremony for a few minutes',ja:'式を数分遅らせていただけますか。',act:4,scene:'hall',context:'このままでは戴冠式が始まってしまう。伯爵に時間を稼いでもらおう。',line:'The ceremony is about to begin.',lineJa:'まもなく戴冠式が始まってしまう。',result:'伯爵が進行役に使いを出し、国王の入場を遅らせた。ジュリアンがささやく。「この子、甘い食べ物と光るものが大好きなんです」',action:'delay',clue:'甘いものと光るものが大好物'},
 {person:'aldric',verb:'lend',ing:'lending',tail:'me your golden brooch',ja:'金のブローチを貸していただけますか。',act:5,scene:'hall',context:'光るものを使ってドラゴンをおびき寄せよう。伯爵の胸には大きな金のブローチが輝いている。',line:'My golden brooch? Do you have a plan?',lineJa:'私の金のブローチかね？ 何か考えがあるのだな？',result:'伯爵は一瞬ためらい、胸元の金のブローチを外して手渡した。「必ず王冠を取り戻すのだぞ」',action:'brooch'},
 {person:'thomas',verb:'bring',ing:'bringing',tail:'me the honey cakes',ja:'蜂蜜菓子を持ってきて！',act:5,scene:'hall',context:'次は甘い匂い。厨房の蜂蜜菓子なら、ドラゴンも気づくはずだ。',line:'There are honey cakes in the kitchen!',lineJa:'厨房に蜂蜜菓子がありました！',result:'トーマスが厨房へ駆け出し、蜂蜜たっぷりの焼き菓子を運んできた。大広間に甘い香りが広がる。',action:'cakes'},
 {person:'elena',verb:'hold',ing:'holding',tail:'this basket',ja:'この籠を持ってくれる？',act:5,scene:'hall',context:'籠の中に金のブローチと蜂蜜菓子を入れた。エレナと息を合わせよう。',line:'The basket is ready. Let’s catch our little thief.',lineJa:'籠の準備はできたわ。小さな泥棒を捕まえましょう。',result:'エレナが籠を構える。ドラゴンは王冠をシャンデリアに置き、籠へまっしぐら！ エレナが蓋を閉め、トーマスが梯子で王冠を回収した。ついに、王冠を取り戻した！',action:'basket',clue:'王冠を取り戻した！'},
];
export const tutorial: Step[] = [
 {...steps[0],verb:'open',ing:'opening',tail:'the door',ja:'扉を開けて。',context:'まずは城での日常から。従者のトーマスに扉を開けてもらいましょう。',line:'Good morning! How can I help?',lineJa:'おはようございます！ ご用は何でしょう？',result:'トーマスが扉を開けてくれた。従者には、動詞の原形ではっきり伝えよう。',action:'unlock'},
 {...steps[2],verb:'carry',ing:'carrying',tail:'this bag',ja:'この鞄を運んでくれる？',context:'同僚のエレナに鞄を運ぶのを手伝ってもらいましょう。',line:'That bag looks heavy.',lineJa:'その鞄、重そうね。',result:'エレナが鞄を持ってくれた。同僚には Can you ＋ 動詞の原形。',action:'cart'},
 {...steps[1],verb:'show',ing:'showing',tail:'me the garden',ja:'庭を案内していただけますか。',context:'目上の伯爵に庭の案内をお願いしましょう。',line:'The garden is lovely this morning.',lineJa:'今朝の庭は実に美しい。',result:'伯爵が庭を案内してくれた。目上には Would you mind ＋ 動詞のing形。準備はできた！',action:'log'},
];
export function correctPrefix(step: Step) {
 const rank = people[step.person].rank;
 return rank === 'higher' ? `Would you mind ${step.ing}` : rank === 'equal' ? `Can you ${step.verb}` : step.verb[0].toUpperCase()+step.verb.slice(1);
}
export function sentence(step: Step) {return `${correctPrefix(step)} ${step.tail}${people[step.person].rank==='lower'?'.':'?'}`;}
export const ending = { en:'Well, that was quite a surprise.', ja:'いやはや、これは驚いた。', text:'戴冠式は数分遅れで無事に始まった。新国王が王冠をかぶると、大広間は拍手に包まれる。王女から贈られたドラゴンを抱き上げた国王。ところが小さなくしゃみで炎が出て、髪が少し焦げてしまった。静まり返る大広間。国王は髪に触れ、そして大笑いした。' };
