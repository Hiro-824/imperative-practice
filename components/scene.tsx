import Image from "next/image";
import {
  locations,
  type BubbleKind,
  type CharacterId,
  type Step,
} from "@/lib/story";

const characterArt: Record<CharacterId, { src: string; label: string }> = {
  playerMale: { src: "/art-new/cutouts/player-male.webp", label: "男性の王国騎士" },
  playerFemale: { src: "/art-new/cutouts/player-female.webp", label: "女性の王国騎士" },
  thomas: { src: "/art-new/cutouts/thomas.webp", label: "トーマス" },
  elena: { src: "/art-new/cutouts/elena.webp", label: "エレナ" },
  aldric: { src: "/art-new/cutouts/aldric.webp", label: "アルドリック伯爵" },
  cook: { src: "/art-new/cutouts/cook.webp", label: "料理人" },
  king: { src: "/art-new/cutouts/king.webp", label: "新国王" },
};

export function Character({ id, className = "" }: { id: CharacterId; className?: string }) {
  const art = characterArt[id];
  return (
    <div className={`character ${id === "king" ? "king-character" : ""} ${className}`} role="img" aria-label={art.label}>
      <Image src={art.src} alt="" fill sizes="(max-width: 760px) 58vw, 360px" unoptimized priority />
    </div>
  );
}

export function PlayerKnight({ gender, className = "" }: { gender: "male" | "female"; className?: string }) {
  return <Character id={gender === "female" ? "playerFemale" : "playerMale"} className={className} />;
}

const bubbleArt: Record<BubbleKind, { src: string; label: string }> = {
  bag: { src: "/art-new/cutouts/bag.webp", label: "鞄" },
  tracks: { src: "/art-new/cutouts/tracks.webp", label: "ドラゴンの足跡" },
  cloakedMan: { src: "/art-new/cutouts/cloaked-man.webp", label: "外套の男" },
  menagerieCrest: { src: "/art-new/cutouts/menagerie-crest.webp", label: "王立動物飼育所の紋章がある木箱の破片" },
  record: { src: "/art-new/cutouts/record.webp", label: "アルドリック伯爵の記録" },
  princessSeal: { src: "/art-new/cutouts/princess-seal.webp", label: "王女殿下の封印" },
  brooch: { src: "/art-new/cutouts/brooch.webp", label: "伯爵の金のブローチ" },
  honeyCakes: { src: "/art-new/cutouts/honey-cakes.webp", label: "蜂蜜菓子" },
  basket: { src: "/art-new/cutouts/basket.webp", label: "ドラゴンを捕まえる籠" },
  crown: { src: "/art-new/cutouts/crown.webp", label: "王冠" },
};

export function BubbleArt({ kind }: { kind: BubbleKind }) {
  const art = bubbleArt[kind];
  return (
    <div className="bubble-art" role="img" aria-label={art.label}>
      <Image src={art.src} alt="" fill sizes="(max-width: 760px) 145px, 245px" unoptimized priority />
    </div>
  );
}

export function Stage({
  background,
  location,
  character,
  bubble,
  dragon = false,
  children,
}: {
  background: string;
  location: string;
  character?: CharacterId;
  bubble?: BubbleKind;
  dragon?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="story-stage" style={{ backgroundImage: `url(${background})` }} aria-label={location}>
      <div className="stage-shade" />
      <span className="location-tag">{location}</span>
      {character && <Character id={character} className="stage-character" />}
      {bubble && <BubbleArt kind={bubble} />}
      {dragon && (
        <div className="crown-dragon" role="img" aria-label="王冠をくわえた赤ちゃんドラゴン">
          <Image src="/art-new/cutouts/crown-dragon-display.webp" alt="" fill sizes="(max-width: 760px) 76vw, 650px" unoptimized priority />
        </div>
      )}
      {children}
    </div>
  );
}

export function Scene({
  step,
  acted,
  index,
  tutorial = false,
  character,
}: {
  step: Step;
  acted: boolean;
  index: number;
  tutorial?: boolean;
  character?: CharacterId;
}) {
  let background = "/art-new/castle-entry-closed.webp";
  if (tutorial) {
    background = index > 0 || acted ? "/art-new/castle-entry-open.webp" : "/art-new/castle-entry-closed.webp";
  } else if (step.scene === "kitchen") {
    background = "/art-new/castle-storehouse-open.webp";
  } else if (step.scene === "storeroom") {
    const open = index > 8 || (index === 8 && acted);
    background = open ? "/art-new/castle-storehouse-open.webp" : "/art-new/castle-storehouse-closed.webp";
  } else if (step.scene === "hall") {
    const closed = index > 12 || (index === 12 && acted);
    background = closed ? "/art-new/throne-room-closed.webp" : "/art-new/throne-room-open.webp";
  }
  const dragon = !tutorial && ((index === 11 && acted) || (index >= 12 && index <= 15));
  return (
    <Stage
      background={background}
      location={tutorial ? "エルドリア城内" : locations[step.scene]}
      character={character || step.person}
      bubble={step.bubbleAfterAct && !acted ? undefined : step.bubble}
      dragon={dragon}
    />
  );
}
