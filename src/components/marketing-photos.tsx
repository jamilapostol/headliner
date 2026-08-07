import Image from "next/image";

type Band = {
  src: string;
  alt: string;
  /** CSS object-position, tuned per photo so the subject isn't cropped out on ultra-wide bands. */
  position: string;
  priority?: boolean;
};

const HEIGHT = "relative h-[42vh] max-h-[480px] min-h-[240px] w-full overflow-hidden";

export function PhotoBleedHero({ src, alt, position, priority }: Band) {
  return (
    <div className={`${HEIGHT} mt-2`}>
      <Image src={src} alt={alt} fill sizes="100vw" priority={priority} className="object-cover brightness-[.9] saturate-[1.05]" style={{ objectPosition: position }} />
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-b from-transparent to-canvas" />
    </div>
  );
}

export function PhotoBleedBand({ src, alt, position }: Band) {
  return (
    <div className={HEIGHT}>
      <Image src={src} alt={alt} fill sizes="100vw" className="object-cover brightness-[.87] saturate-[1.05]" style={{ objectPosition: position }} />
      <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-t from-transparent to-canvas" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-canvas" />
    </div>
  );
}

const ROAD_PHOTOS: Band[] = [
  { src: "/landing-bus.jpg", alt: "Tour bus on the road", position: "60% 50%" },
  { src: "/landing-backstage.jpg", alt: "Flight cases backstage before load-in", position: "40% 50%" },
  { src: "/landing-stagegear.jpg", alt: "Stage gear silhouetted before a show", position: "50% 45%" },
];

export function RoadPhotoStrip() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {ROAD_PHOTOS.map((p) => (
        <div key={p.src} className="relative aspect-[4/5] overflow-hidden rounded-tile border border-border">
          <Image src={p.src} alt={p.alt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover brightness-[.92] saturate-[1.05]" style={{ objectPosition: p.position }} />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(180deg, transparent 55%, rgba(13,17,14,.55))" }} />
        </div>
      ))}
    </div>
  );
}

export const HERO_PHOTO: Band = { src: "/landing-hero.jpg", alt: "Fireworks over the stage at a HEADLINE. artist's show", position: "50% 38%", priority: true };
export const SOUNDCHECK_PHOTO: Band = { src: "/landing-soundcheck.jpg", alt: "Mic stand at soundcheck, crowd in the distance", position: "72% 38%" };
export const CROWD_PHOTO: Band = { src: "/landing-crowd.jpg", alt: "Confetti over the crowd at a show", position: "50% 68%" };
