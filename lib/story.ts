export type Rank = "lower" | "equal" | "higher";
export type Person = "thomas" | "elena" | "aldric" | "cook";
export type Scene = "chamber" | "kitchen" | "storeroom" | "hall";
export type Action =
  | "tracks"
  | "log"
  | "follow"
  | "witness"
  | "cart"
  | "list"
  | "julian"
  | "guard"
  | "unlock"
  | "boxes"
  | "noise"
  | "dragon"
  | "doors"
  | "windows"
  | "delay"
  | "brooch"
  | "cakes"
  | "basket";
export interface Step {
  person: Person;
  verb: string;
  ing: string;
  tail: string;
  ja: string;
  act: number;
  scene: Scene;
  context: string;
  line: string;
  lineJa: string;
  result: string;
  action: Action;
  clue?: string;
}
export const people = {
  thomas: {
    name: "Thomas",
    ja: "トーマス",
    title: "あなたの従者",
    rank: "lower" as Rank,
    color: "#93b9a6",
  },
  elena: {
    name: "Elena",
    ja: "エレナ",
    title: "同僚の騎士",
    rank: "equal" as Rank,
    color: "#96b9cf",
  },
  aldric: {
    name: "Count Aldric",
    ja: "アルドリック伯爵",
    title: "上級貴族",
    rank: "higher" as Rank,
    color: "#d5b676",
  },
  cook: {
    name: "The cook",
    ja: "料理人",
    title: "城の料理人",
    rank: "lower" as Rank,
    color: "#cfa692",
  },
};
export const acts = [
  "王冠の消失",
  "厨房の怪しい男",
  "地下倉庫の秘密",
  "ドラゴン大脱走",
  "最後の作戦",
];
export const locations: Record<Scene, string> = {
  chamber: "王冠の間",
  kitchen: "王宮の厨房",
  storeroom: "地下の王室倉庫",
  hall: "戴冠式の大広間",
};
export const steps: Step[] = [
  {
    person: "thomas",
    verb: "check",
    ing: "checking",
    tail: "the floor",
    ja: "床を調べて。",
    act: 1,
    scene: "chamber",
    context:
      "王冠が消えた。戴冠式まであと20分しかない。床の泥が気になる。トーマスに調べてもらおう。",
    line: "The crown is gone! There is mud on the floor.",
    lineJa: "王冠がありません！ 床に泥がついています。",
    result: "あっ！ 小さな三本指の足跡があります！ すぐそばには黒い焦げ跡も……。",
    action: "tracks",
    clue: "三本指の足跡と焦げ跡",
  },
  {
    person: "aldric",
    verb: "show",
    ing: "showing",
    tail: "me the guard’s log",
    ja: "警備記録を見せていただけますか。",
    act: 1,
    scene: "chamber",
    context:
      "王冠が消えた時刻を絞りたい。警備を預かるアルドリック伯爵なら、記録を持っているはずだ。",
    line: "I have the guard’s log. What do you need?",
    lineJa: "警備記録は私が持っている。何が必要かな？",
    result: "記録では11時30分まで王冠はあった。不審者の侵入はないが、準備の使用人は何人も出入りしている。",
    action: "log",
    clue: "11時30分には王冠があった",
  },
  {
    person: "elena",
    verb: "follow",
    ing: "following",
    tail: "these footprints",
    ja: "この足跡を追ってくれる？",
    act: 1,
    scene: "chamber",
    context: "足跡は部屋の外へ続いている。追跡が得意な同僚のエレナに頼もう。",
    line: "These footprints lead out of the room.",
    lineJa: "この足跡、部屋の外へ続いているわ。",
    result: "こっちよ。足跡は使用人用の通路を通って、厨房へ続いているわ！",
    action: "follow",
  },
  {
    person: "cook",
    verb: "tell",
    ing: "telling",
    tail: "me what you saw",
    ja: "見たことを教えて。",
    act: 2,
    scene: "kitchen",
    context: "厨房まで来たが、泥の足跡はここで途切れている。料理人なら何か見ているかもしれない。",
    line: "I saw a strange man here a little while ago.",
    lineJa: "さっき、ここで妙な男を見ましたよ。",
    result: "青い外套の男が大きな木箱を抱えてきました。何かを追い回してから、木箱を持って地下へ行きましたよ。",
    action: "witness",
    clue: "青い外套の男と木箱",
  },
  {
    person: "elena",
    verb: "examine",
    ing: "examining",
    tail: "that cart",
    ja: "あの荷車を調べてくれる？",
    act: 2,
    scene: "kitchen",
    context:
      "厨房の隅に荷車が置き去りだ。青い外套の男のものだろうか。エレナに見てもらおう。",
    line: "That cart must belong to the man in blue.",
    lineJa: "あの荷車、青い外套の男が使ったものかしら。",
    result: "木箱の破片に王立動物飼育所の紋章があるわ。中にいたのは、たぶん動物ね。",
    action: "cart",
    clue: "王立動物飼育所の紋章",
  },
  {
    person: "aldric",
    verb: "show",
    ing: "showing",
    tail: "me today’s delivery list",
    ja: "今日の納品記録を見せていただけますか。",
    act: 2,
    scene: "kitchen",
    context:
      "王宮に動物が届けられたはずだ。伯爵に今日の納品記録を確認していただこう。",
    line: "Every royal delivery is recorded.",
    lineJa: "王室への届け物はすべて記録されている。",
    result: "王女殿下から新国王への特別な贈り物、とある。届けたのは飼育係のジュリアンだ。",
    action: "list",
    clue: "王女の贈り物／飼育係ジュリアン",
  },
  {
    person: "thomas",
    verb: "find",
    ing: "finding",
    tail: "Julian",
    ja: "ジュリアンを探して。",
    act: 2,
    scene: "kitchen",
    context: "贈り物を運んだジュリアン本人に話を聞こう。トーマスなら城内をすぐ探せる。",
    line: "I can search the castle for you.",
    lineJa: "私が城内を探しましょう。",
    result: "ジュリアンを連れてきました！ 青い外套の彼が、逃げた動物を捕まえて地下倉庫の木箱へ戻したそうです。",
    action: "julian",
    clue: "動物は逃げたあと地下倉庫へ",
  },
  {
    person: "elena",
    verb: "ask",
    ing: "asking",
    tail: "the guard when the crate arrived",
    ja: "木箱がいつ届いたか、警備兵に聞いてくれる？",
    act: 3,
    scene: "storeroom",
    context: "地下倉庫まで来た。王女の木箱が運び込まれた時刻を警備兵に確認したい。",
    line: "The guard may know when the crate arrived.",
    lineJa: "木箱が届いた時刻なら、警備兵が知っていそうね。",
    result: "警備兵に聞いたわ。木箱が着いたのは11時38分。王冠が消えた時間と一致する。",
    action: "guard",
    clue: "木箱の到着は11時38分",
  },
  {
    person: "aldric",
    verb: "open",
    ing: "opening",
    tail: "the royal storeroom",
    ja: "王室倉庫を開けていただけますか。",
    act: 3,
    scene: "storeroom",
    context: "倉庫の重い扉には鍵がかかっている。鍵を持つ伯爵に開けていただこう。",
    line: "Only my key can open this storeroom.",
    lineJa: "この倉庫を開けられるのは、私の鍵だけだ。",
    result: "開いたぞ。中は暗く、大小の木箱が積まれている。足元に気をつけなさい。",
    action: "unlock",
  },
  {
    person: "thomas",
    verb: "move",
    ing: "moving",
    tail: "those boxes",
    ja: "あの木箱を動かして。",
    act: 3,
    scene: "storeroom",
    context: "木箱が積み上がって奥が見えない。力のあるトーマスに道を作ってもらおう。",
    line: "These boxes are blocking the way.",
    lineJa: "この木箱が邪魔で、奥に進めません。",
    result: "木箱を動かしました！ ……待ってください。奥から、何かが木を引っかく音がします。",
    action: "boxes",
  },
  {
    person: "elena",
    verb: "check",
    ing: "checking",
    tail: "that noise",
    ja: "あの音を調べてくれる？",
    act: 3,
    scene: "storeroom",
    context: "カリッ、カリッ……奇妙な音が倉庫に響く。エレナに音の出どころを見てもらおう。",
    line: "Listen. Something is scratching inside.",
    lineJa: "聞いて。中で何かが引っかいているわ。",
    result: "この大きな木箱の中に何かいるわ。見て、蓋には王女殿下の封印がある。",
    action: "noise",
    clue: "王女の封印がある木箱",
  },
  {
    person: "aldric",
    verb: "let",
    ing: "letting",
    tail: "us open this crate",
    ja: "この木箱を開ける許可をいただけますか。",
    act: 3,
    scene: "storeroom",
    context: "王女の封印を勝手には破れない。伯爵に木箱を開ける許可をいただこう。",
    line: "That is the princess’s seal. Be careful.",
    lineJa: "それは王女殿下の封印だ。慎重にな。",
    result: "開けてよい。……何だ、王冠を抱いた赤いドラゴンだと!? あっ、飛び出したぞ！",
    action: "dragon",
    clue: "犯人は王女の小さなドラゴン",
  },
  {
    person: "thomas",
    verb: "close",
    ing: "closing",
    tail: "the doors",
    ja: "扉を閉めて！",
    act: 4,
    scene: "hall",
    context:
      "ドラゴンが大広間へ逃げ込んだ。王冠を持ったままだ。まず扉をふさがなければ！",
    line: "The dragon is heading for the doors!",
    lineJa: "ドラゴンが扉の方へ向かっています！",
    result: "扉を閉めました！ ……ドラゴンが窓へ向かって飛んでいきます！",
    action: "doors",
  },
  {
    person: "elena",
    verb: "shut",
    ing: "shutting",
    tail: "the windows",
    ja: "窓を閉めてくれる？",
    act: 4,
    scene: "hall",
    context: "窓から外へ逃げられたら王冠を取り戻せない。エレナ、間に合ってくれ！",
    line: "It is flying toward the windows!",
    lineJa: "窓の方に飛んでいくわ！",
    result: "窓は閉めたわ！ ドラゴンはシャンデリアの上。王冠もまだ持っている。式まであと2分よ！",
    action: "windows",
  },
  {
    person: "aldric",
    verb: "delay",
    ing: "delaying",
    tail: "the ceremony for a few minutes",
    ja: "式を数分遅らせていただけますか。",
    act: 4,
    scene: "hall",
    context: "このままでは戴冠式が始まってしまう。伯爵に少しだけ時間を稼いでいただこう。",
    line: "The ceremony is about to begin.",
    lineJa: "まもなく戴冠式が始まってしまう。",
    result: "国王の入場を遅らせた。ジュリアンによれば、あのドラゴンは甘いものと光るものが大好きらしい。急ぎたまえ。",
    action: "delay",
    clue: "甘いものと光るものが大好物",
  },
  {
    person: "aldric",
    verb: "lend",
    ing: "lending",
    tail: "me your golden brooch",
    ja: "金のブローチを貸していただけますか。",
    act: 5,
    scene: "hall",
    context:
      "光るものでドラゴンをおびき寄せよう。伯爵の胸の金のブローチをお借りできれば……。",
    line: "My golden brooch? Do you have a plan?",
    lineJa: "私の金のブローチかね？ 何か考えがあるのだな？",
    result: "これを使いたまえ。必ず王冠を取り戻すのだぞ。",
    action: "brooch",
  },
  {
    person: "thomas",
    verb: "bring",
    ing: "bringing",
    tail: "me the honey cakes",
    ja: "蜂蜜菓子を持ってきて！",
    act: 5,
    scene: "hall",
    context: "次は甘い匂いだ。厨房の蜂蜜菓子ならドラゴンも気づくはず。トーマスに頼もう。",
    line: "There are honey cakes in the kitchen!",
    lineJa: "厨房に蜂蜜菓子がありました！",
    result: "蜂蜜菓子を持ってきました！ 甘い香りに気づいて、ドラゴンがこちらを見ています！",
    action: "cakes",
  },
  {
    person: "elena",
    verb: "hold",
    ing: "holding",
    tail: "this basket",
    ja: "この籠を持ってくれる？",
    act: 5,
    scene: "hall",
    context: "籠に金のブローチと蜂蜜菓子を入れた。エレナと息を合わせて捕まえよう。",
    line: "The basket is ready. Let’s catch our little thief.",
    lineJa: "籠の準備はできたわ。小さな泥棒を捕まえましょう。",
    result: "今よ！ ……捕まえたわ！ トーマスも王冠を回収した。やった、王冠を取り戻したわ！",
    action: "basket",
    clue: "王冠を取り戻した！",
  },
];
export const tutorial: Step[] = [
  {
    ...steps[0],
    verb: "open",
    ing: "opening",
    tail: "the door",
    ja: "扉を開けて。",
    context: "あっ、トーマスだ。彼は私の従者。少し慌て者だが、頼りになる。まずは扉を開けてもらおう。",
    line: "Good morning! How can I help?",
    lineJa: "おはようございます！ ご用は何でしょう？",
    result: "はい、扉を開けました！ ほかにもご命令をどうぞ。",
    action: "unlock",
  },
  {
    ...steps[2],
    verb: "carry",
    ing: "carrying",
    tail: "this bag",
    ja: "この鞄を運んでくれる？",
    context: "エレナは同僚の騎士で、何度も任務を共にした友人だ。重い鞄を運ぶのを手伝ってもらおう。",
    line: "That bag looks heavy.",
    lineJa: "その鞄、重そうね。",
    result: "もちろん。半分持つわ。任せて。",
    action: "cart",
  },
  {
    ...steps[1],
    verb: "show",
    ing: "showing",
    tail: "me the garden",
    ja: "庭を案内していただけますか。",
    context: "アルドリック伯爵は城の警備を預かる上級貴族。敬意をこめて庭の案内をお願いしよう。",
    line: "The garden is lovely this morning.",
    lineJa: "今朝の庭は実に美しい。",
    result: "よろしい、案内しよう。こちらへ来たまえ。",
    action: "log",
  },
];
export function correctPrefix(step: Step) {
  const rank = people[step.person].rank;
  return rank === "higher"
    ? `Would you mind ${step.ing}`
    : rank === "equal"
      ? `Can you ${step.verb}`
      : step.verb[0].toUpperCase() + step.verb.slice(1);
}
export function sentence(step: Step) {
  return `${correctPrefix(step)} ${step.tail}${people[step.person].rank === "lower" ? "." : "?"}`;
}
export const ending = {
  en: "Well, that was quite a surprise.",
  ja: "いやはや、これは驚いた。",
  text: "戴冠式は数分遅れで無事に始まった。新国王が王冠をかぶると、大広間は拍手に包まれる。王女から贈られたドラゴンを抱き上げた国王。ところが小さなくしゃみで炎が出て、髪が少し焦げてしまった。静まり返る大広間。国王は髪に触れ、そして大笑いした。",
};
