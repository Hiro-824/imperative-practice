export type Rank = "lower" | "equal" | "higher";
export type Gender = "male" | "female";
export type Person = "thomas" | "elena" | "aldric" | "cook";
export type CharacterId = Person | "playerMale" | "playerFemale" | "king";
export type Scene = "chamber" | "kitchen" | "storeroom" | "hall";
export type BubbleKind =
  | "bag"
  | "tracks"
  | "cloakedMan"
  | "menagerieCrest"
  | "record"
  | "princessSeal"
  | "brooch"
  | "honeyCakes"
  | "basket"
  | "crown";
export type Action =
  | "tracks" | "log" | "follow" | "witness" | "cart" | "list"
  | "julian" | "guard" | "unlock" | "boxes" | "noise" | "dragon"
  | "doors" | "windows" | "delay" | "brooch" | "cakes" | "basket";

export interface Step {
  person: Person;
  verb: string;
  ing: string;
  tail: string;
  ja: string;
  act: number;
  scene: Scene;
  thoughtEn: string;
  thoughtJa: string;
  resultEn: string;
  resultJa: string;
  action: Action;
  bubble?: BubbleKind;
  bubbleAfterAct?: boolean;
  clue?: string;
}

export interface ScriptLine {
  speaker: "player" | Person | "king" | "narrator";
  en: string;
  ja: string;
}

export const people = {
  thomas: { name: "Thomas", ja: "トーマス", title: "あなたの従者", rank: "lower" as Rank, gender: "male" as Gender },
  elena: { name: "Elena", ja: "エレナ", title: "同僚の騎士", rank: "equal" as Rank, gender: "female" as Gender },
  aldric: { name: "Count Aldric", ja: "アルドリック伯爵", title: "上級貴族", rank: "higher" as Rank, gender: "male" as Gender },
  cook: { name: "The cook", ja: "料理人", title: "城の料理人", rank: "lower" as Rank, gender: "male" as Gender },
};

export const acts = ["王冠の消失", "厨房の怪しい男", "地下倉庫の秘密", "ドラゴン大脱走", "最後の作戦"];

export const locations: Record<Scene, string> = {
  chamber: "王冠の保管室",
  kitchen: "王宮の厨房",
  storeroom: "地下の王室倉庫",
  hall: "戴冠式の大広間",
};

export const steps: Step[] = [
  {
    person: "thomas", verb: "check", ing: "checking", tail: "the floor", ja: "床を調べて(check)。",
    act: 1, scene: "chamber", action: "tracks", bubble: "tracks", bubbleAfterAct: true, clue: "三本指の足跡と焦げ跡",
    thoughtEn: "The crown is gone, and the coronation is only twenty minutes away. Those muddy marks on the floor may be a clue. I should ask Thomas to check them.",
    thoughtJa: "王冠が消えた。戴冠式まであと20分しかない。床の泥が気になる。トーマスに調べてもらおう。",
    resultEn: "Look! There are small, three-toed footprints—and a black scorch mark right beside them!",
    resultJa: "あっ！ 小さな三本指の足跡があります！ すぐそばには黒い焦げ跡も……。",
  },
  {
    person: "aldric", verb: "show", ing: "showing", tail: "me the guard’s log", ja: "警備記録を見せて(show)いただけますか。",
    act: 1, scene: "chamber", action: "log", bubble: "record", bubbleAfterAct: true, clue: "11時30分には王冠があった",
    thoughtEn: "We need to narrow down when the crown vanished. Count Aldric oversees security, so he should have the guard’s log.",
    thoughtJa: "王冠が消えた時刻を絞りたい。警備を預かるアルドリック伯爵なら、記録を持っているはずだ。",
    resultEn: "The log says the crown was still here at eleven thirty. No intruder entered, but several servants came and went while preparing the ceremony.",
    resultJa: "記録では11時30分まで王冠はあった。不審者の侵入はないが、準備の使用人は何人も出入りしている。",
  },
  {
    person: "elena", verb: "follow", ing: "following", tail: "these footprints", ja: "この足跡を追跡して(follow)くれる？",
    act: 1, scene: "chamber", action: "follow",
    thoughtEn: "The footprints continue out of the room. Elena is an excellent tracker, so I should ask her to follow them.",
    thoughtJa: "足跡は部屋の外へ続いている。追跡が得意な同僚のエレナに頼もう。",
    resultEn: "This way. The footprints pass through the servants’ corridor and lead straight to the kitchen!",
    resultJa: "こっちよ。足跡は使用人用の通路を通って、厨房へ続いているわ！",
  },
  {
    person: "cook", verb: "tell", ing: "telling", tail: "me what you saw", ja: "見たことを教えて(tell)。",
    act: 2, scene: "kitchen", action: "witness", bubble: "cloakedMan", bubbleAfterAct: true, clue: "青い外套の男と木箱",
    thoughtEn: "The muddy trail ends in the kitchen. The cook may have seen what happened, so I should ask him.",
    thoughtJa: "厨房で泥の足跡が途切れている。料理人なら何か見ているかもしれない。",
    resultEn: "A man in a blue cloak arrived carrying a large crate. He chased something around, then took the crate down to the cellar.",
    resultJa: "青い外套の男が大きな木箱を抱えてきました。何かを追い回してから、木箱を持って地下へ行きましたよ。",
  },
  {
    person: "elena", verb: "examine", ing: "examining", tail: "that cart", ja: "あの荷車を調べて(examine)くれる？",
    act: 2, scene: "kitchen", action: "cart", bubble: "menagerieCrest", bubbleAfterAct: true, clue: "王立動物飼育所の紋章",
    thoughtEn: "A cart was abandoned in the corner of the kitchen. It may belong to the man in the blue cloak. I should ask Elena to examine it.",
    thoughtJa: "厨房の隅に荷車が置き去りだ。青い外套の男のものだろうか。エレナに見てもらおう。",
    resultEn: "There is the royal menagerie’s crest on this broken piece of the crate. Whatever was inside must have been an animal.",
    resultJa: "木箱の破片に王立動物飼育所の紋章があるわ。中にいたのは、たぶん動物ね。",
  },
  {
    person: "aldric", verb: "show", ing: "showing", tail: "me today’s delivery list", ja: "今日の納品記録を見せて(show)いただけますか。",
    act: 2, scene: "kitchen", action: "list", bubble: "record", bubbleAfterAct: true, clue: "王女の贈り物／飼育係ジュリアン",
    thoughtEn: "An animal must have been delivered to the castle. I should ask the count to show me today’s delivery list.",
    thoughtJa: "王宮に動物が届けられたはずだ。伯爵に今日の納品記録を確認していただこう。",
    resultEn: "It says, ‘A special gift from the princess to the new king.’ The keeper who delivered it was Julian.",
    resultJa: "王女殿下から新国王への特別な贈り物、とある。届けたのは飼育係のジュリアンだ。",
  },
  {
    person: "thomas", verb: "find", ing: "finding", tail: "Julian", ja: "ジュリアンを探して(find)。",
    act: 2, scene: "kitchen", action: "julian", clue: "動物は逃げたあと地下倉庫へ",
    thoughtEn: "We need to question Julian, the keeper who delivered the gift. Thomas can search the castle quickly.",
    thoughtJa: "贈り物を運んだジュリアン本人に話を聞こう。トーマスなら城内をすぐ探せる。",
    resultEn: "I found Julian! He is the man in the blue cloak. He says the animal escaped, but he caught it and returned it to a crate in the cellar.",
    resultJa: "ジュリアンを連れてきました！ 青い外套の彼が、逃げた動物を捕まえて地下倉庫の木箱へ戻したそうです。",
  },
  {
    person: "elena", verb: "ask", ing: "asking", tail: "the guard when the crate arrived", ja: "木箱が届いた時刻を警備兵に尋ねて(ask)くれる？",
    act: 3, scene: "storeroom", action: "guard", bubble: "record", bubbleAfterAct: true, clue: "木箱の到着は11時38分",
    thoughtEn: "We have reached the cellar. I want to know exactly when the princess’s crate arrived, so Elena should ask the guard.",
    thoughtJa: "地下倉庫まで来た。王女の木箱が運び込まれた時刻を警備兵に確認したい。",
    resultEn: "The guard says the crate arrived at eleven thirty-eight—the same time the crown disappeared.",
    resultJa: "警備兵に聞いたわ。木箱が着いたのは11時38分。王冠が消えた時間と一致する。",
  },
  {
    person: "aldric", verb: "open", ing: "opening", tail: "the royal storeroom", ja: "王室倉庫を開けて(open)いただけますか。",
    act: 3, scene: "storeroom", action: "unlock",
    thoughtEn: "The heavy storeroom door is locked. Only Count Aldric has the key, so I must ask him to open it.",
    thoughtJa: "倉庫の重い扉には鍵がかかっている。鍵を持つ伯爵に開けていただこう。",
    resultEn: "It is open. The room is dark and packed with crates of every size. Watch your step.",
    resultJa: "開いたぞ。中は暗く、大小の木箱が積まれている。足元に気をつけなさい。",
  },
  {
    person: "thomas", verb: "move", ing: "moving", tail: "those boxes", ja: "あの木箱を動かして(move)。",
    act: 3, scene: "storeroom", action: "boxes",
    thoughtEn: "The stacked boxes block our view of the back. Thomas is strong enough to clear a path.",
    thoughtJa: "木箱が積み上がって奥が見えない。力のあるトーマスに道を作ってもらおう。",
    resultEn: "The boxes are out of the way! Wait—something is scratching at the wood in the back.",
    resultJa: "木箱を動かしました！ ……待ってください。奥から、何かが木を引っかく音がします。",
  },
  {
    person: "elena", verb: "check", ing: "checking", tail: "that noise", ja: "あの音を確認して(check)くれる？",
    act: 3, scene: "storeroom", action: "noise", bubble: "princessSeal", bubbleAfterAct: true, clue: "王女の封印がある木箱",
    thoughtEn: "Scratch, scratch… A strange sound echoes through the storeroom. I should ask Elena to find its source.",
    thoughtJa: "カリッ、カリッ……奇妙な音が倉庫に響く。エレナに音の出どころを見てもらおう。",
    resultEn: "Something is inside this large crate. Look—the lid bears the princess’s seal.",
    resultJa: "この大きな木箱の中に何かいるわ。見て、蓋には王女殿下の封印がある。",
  },
  {
    person: "aldric", verb: "let", ing: "letting", tail: "us open this crate", ja: "私たちにこの木箱を開けさせて(let)いただけますか。",
    act: 3, scene: "storeroom", action: "dragon", bubble: "crown", bubbleAfterAct: true, clue: "犯人は王女の小さなドラゴン",
    thoughtEn: "We cannot break the princess’s seal without permission. I must ask Count Aldric to let us open the crate.",
    thoughtJa: "王女の封印を勝手には破れない。伯爵に木箱を開ける許可をいただこう。",
    resultEn: "You may open it. What—a red dragon clutching the crown? It has flown out!",
    resultJa: "開けてよい。……何だ、王冠を抱いた赤いドラゴンだと!? あっ、飛び出したぞ！",
  },
  {
    person: "thomas", verb: "close", ing: "closing", tail: "the doors", ja: "扉を閉めて(close)！",
    act: 4, scene: "hall", action: "doors",
    thoughtEn: "The dragon has escaped into the great hall with the crown. We must block the doors first!",
    thoughtJa: "ドラゴンが王冠を持ったまま大広間へ逃げ込んだ。まず扉をふさがなければ！",
    resultEn: "The doors are closed! Now the dragon is flying toward the windows!",
    resultJa: "扉を閉めました！ ……ドラゴンが窓へ向かって飛んでいきます！",
  },
  {
    person: "elena", verb: "shut", ing: "shutting", tail: "the windows", ja: "窓を閉めて(shut)くれる？",
    act: 4, scene: "hall", action: "windows",
    thoughtEn: "If it escapes through a window, the crown will be lost. Elena has to reach them in time.",
    thoughtJa: "窓から外へ逃げられたら王冠を取り戻せない。エレナ、間に合ってくれ！",
    resultEn: "The windows are shut! The dragon is on the chandelier, and it still has the crown. The ceremony starts in two minutes!",
    resultJa: "窓は閉めたわ！ ドラゴンはシャンデリアの上。王冠もまだ持っている。式まであと2分よ！",
  },
  {
    person: "aldric", verb: "delay", ing: "delaying", tail: "the ceremony for a few minutes", ja: "式を数分遅らせて(delay)いただけますか。",
    act: 4, scene: "hall", action: "delay", clue: "甘いものと光るものが大好物",
    thoughtEn: "The coronation is about to begin. I need Count Aldric to buy us a few more minutes.",
    thoughtJa: "このままでは戴冠式が始まってしまう。伯爵に少しだけ時間を稼いでいただこう。",
    resultEn: "I have delayed the king’s entrance. Julian says the dragon loves sweet things and anything shiny. Hurry.",
    resultJa: "国王の入場を遅らせた。ジュリアンによれば、あのドラゴンは甘いものと光るものが大好きらしい。急ぎたまえ。",
  },
  {
    person: "aldric", verb: "lend", ing: "lending", tail: "me your golden brooch", ja: "金のブローチを貸して(lend)いただけますか。",
    act: 5, scene: "hall", action: "brooch", bubble: "brooch",
    thoughtEn: "We can lure the dragon with something shiny. Count Aldric’s golden brooch may be just what we need.",
    thoughtJa: "光るものでドラゴンをおびき寄せよう。伯爵の胸の金のブローチをお借りできれば……。",
    resultEn: "Use this. Make certain you bring back the crown.",
    resultJa: "これを使いたまえ。必ず王冠を取り戻すのだぞ。",
  },
  {
    person: "thomas", verb: "bring", ing: "bringing", tail: "me the honey cakes", ja: "蜂蜜菓子を持ってきて(bring)！",
    act: 5, scene: "hall", action: "cakes", bubble: "honeyCakes",
    thoughtEn: "Now we need a sweet scent. The honey cakes in the kitchen should catch the dragon’s attention.",
    thoughtJa: "次は甘い匂いだ。厨房の蜂蜜菓子ならドラゴンも気づくはず。トーマスに頼もう。",
    resultEn: "I brought the honey cakes! The dragon has caught the scent, and it is looking this way!",
    resultJa: "蜂蜜菓子を持ってきました！ 甘い香りに気づいて、ドラゴンがこちらを見ています！",
  },
  {
    person: "elena", verb: "hold", ing: "holding", tail: "this basket", ja: "この籠を支えて(hold)くれる？",
    act: 5, scene: "hall", action: "basket", bubble: "basket", clue: "王冠を取り戻した！",
    thoughtEn: "The golden brooch and honey cakes are in the basket. Elena and I must work together to catch the dragon.",
    thoughtJa: "籠に金のブローチと蜂蜜菓子を入れた。エレナと息を合わせて捕まえよう。",
    resultEn: "Now! We caught it! Thomas has the crown. We did it—the crown is safe!",
    resultJa: "今よ！ ……捕まえたわ！ トーマスも王冠を回収した。やった、王冠を取り戻したわ！",
  },
];

export const tutorial: Step[] = [
  {
    ...steps[0], verb: "open", ing: "opening", tail: "the door", ja: "扉を開けて。💡目下の者なので、Open [the door]", action: "unlock", bubble: undefined,
    thoughtEn: "Thomas is my attendant. He is a little hasty, but dependable. I should ask him to open the door.",
    thoughtJa: "トーマスは私の従者。少し慌て者だが、頼りになる。まずは扉を開けてもらおう。",
    resultEn: "Yes! The door is open. Please give me any other orders you have.", resultJa: "はい、扉を開けました！ ほかにもご命令をどうぞ。",
  },
  {
    ...steps[2], verb: "carry", ing: "carrying", tail: "this bag", ja: "この鞄を運んでくれる？　💡同じ身分なので、Can you carry [this bag?]", action: "cart", bubble: "bag",
    thoughtEn: "Elena is a fellow knight and a trusted friend. I should ask her to help carry this heavy bag.",
    thoughtJa: "エレナは同僚の騎士で、何度も任務を共にした友人だ。重い鞄を運ぶのを手伝ってもらおう。",
    resultEn: "Of course. I will carry half of it. Leave it to me.", resultJa: "もちろん。半分持つわ。任せて。",
  },
  {
    ...steps[1], verb: "show", ing: "showing", tail: "me the garden", ja: "庭を案内して(show)いただけますか。　💡高貴なお方なので、Would you mind showing [me the garden?]", action: "log", bubble: undefined,
    thoughtEn: "Count Aldric is the senior noble in charge of castle security. I should respectfully ask him to show me the garden.",
    thoughtJa: "アルドリック伯爵は城の警備を預かる上級貴族。敬意をこめて庭の案内をお願いしよう。",
    resultEn: "Very well. I shall show you the way. Follow me.", resultJa: "よろしい、案内しよう。こちらへ来たまえ。",
  },
];

export const openingScript: ScriptLine[] = [
  { speaker: "player", en: "All right, today is the coronation. We have prepared thoroughly for this day. Surely everything will go smoothly.", ja: "さあ、今日は戴冠式。ここまで十分に準備してきた。きっと無事に終わるはずだ。" },
  { speaker: "thomas", en: "This is terrible!", ja: "大変です！" },
  { speaker: "player", en: "What is it? Has something happened?", ja: "どうした！ 何かあったのか？" },
  { speaker: "thomas", en: "The crown… they say it is not in the storage room!", ja: "王冠が……保管室にないそうです！" },
  { speaker: "elena", en: "What did you say?", ja: "なんですって？" },
  { speaker: "player", en: "This is a disaster! We cannot hold the coronation without the crown!", ja: "それは一大事だぞ！ 王冠がなければ戴冠式を行うことができない！" },
  { speaker: "elena", en: "There are only twenty minutes until the coronation.", ja: "戴冠式まであと20分しかないわよ。" },
  { speaker: "aldric", en: "{nameEn}, Elena—find the crown before the coronation, whatever it takes.", ja: "{nameJa}、エレナ、戴冠式までになんとしても王冠を見つけ出せ。" },
  { speaker: "player", en: "Yes, my lord!", ja: "はっ！" },
];

export const finaleScript: ScriptLine[] = [
  { speaker: "narrator", en: "The crown returned to the king, and the coronation began safely, only a few minutes late.", ja: "王冠は、ふたたび国王のもとへ。戴冠式は数分遅れで無事に始まった。" },
  { speaker: "narrator", en: "When the new king put on the crown, the great hall filled with applause. He lifted the dragon, a gift from the princess, into his arms.", ja: "新国王が王冠をかぶると、大広間は拍手に包まれた。国王は王女から贈られたドラゴンを抱き上げた。" },
  { speaker: "narrator", en: "The little dragon sneezed a tiny flame and singed the king’s hair. The entire hall fell silent.", ja: "ところがドラゴンが小さなくしゃみをして炎を吐き、国王の髪を少し焦がしてしまった。大広間は静まり返った。" },
  { speaker: "king", en: "Well, that was quite a surprise.", ja: "いやはや、これは驚いた。" },
  { speaker: "narrator", en: "The king touched his hair—and burst out laughing. Eighteen well-chosen phrases had saved the kingdom.", ja: "国王は髪に触れ、そして大笑いした。18のひと言が、王国を救った。" },
];

export function correctPrefix(step: Step) {
  const rank = people[step.person].rank;
  return rank === "higher" ? `Would you mind ${step.ing}` : rank === "equal" ? `Can you ${step.verb}` : step.verb[0].toUpperCase() + step.verb.slice(1);
}

export function sentence(step: Step) {
  return `${correctPrefix(step)} ${step.tail}${people[step.person].rank === "lower" ? "." : "?"}`;
}
