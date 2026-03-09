import { useEffect, useMemo, useRef, useState } from "react";

type PromoImage = {
  src: string;
  alt: string;
};

function usePromoImages(): PromoImage[] {
  return useMemo(() => {
    const modules = import.meta.glob("/src/assets/promotions/*.{png,jpg,jpeg,JPG,JPEG,webp,svg}", {
      eager: true,
      import: "default",
      query: "?url",
    });

    return Object.entries(modules)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, value]) => {
        const filename = path.split("/").pop() ?? "promotion";
        const label = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();

        return {
          src: String(value),
          alt: label.length > 0 ? `Hinh quang ba ${label}` : "Hinh quang ba Criclo",
        };
      });
  }, []);
}

const PromoImageRail = () => {
  const promoImages = usePromoImages();
  const loopImages = promoImages.length > 0 ? [...promoImages, ...promoImages] : [];
  const railRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = railRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={railRef} className="relative overflow-hidden border-t border-primary/10 bg-[linear-gradient(180deg,rgba(4,27,45,0.05),rgba(66,140,212,0.07),rgba(255,156,218,0.08),rgba(255,255,255,0.92))] pt-0 pb-20">
      <div className="container mx-auto px-6">
        {promoImages.length > 0 ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-white/55 bg-white/45 px-0 py-6 shadow-[0_22px_60px_rgba(4,27,45,0.1)] backdrop-blur-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-[linear-gradient(90deg,rgba(247,250,255,0.96),rgba(247,250,255,0))]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-[linear-gradient(270deg,rgba(247,250,255,0.96),rgba(247,250,255,0))]" />

            <div
              className="flex min-w-max gap-5 px-6 promo-rail-track hover:[animation-play-state:paused]"
              style={{ animationPlayState: isVisible ? "running" : "paused" }}
            >
              {loopImages.map((image, index) => (
                <article
                  key={`${image.src}-${index}`}
                  className="group relative h-[240px] w-[320px] shrink-0 overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_18px_40px_rgba(4,27,45,0.12)]"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    decoding="async"
                    sizes="320px"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(4,27,45,0.04),rgba(4,27,45,0.14))] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-dashed border-primary/20 bg-white/55 px-8 py-12 text-center shadow-[0_18px_48px_rgba(4,27,45,0.08)] backdrop-blur-sm">
            <div className="mx-auto max-w-2xl">
              <p className="text-lg font-semibold tracking-[0.12em] text-primary">San sang nhan anh quang ba</p>
              <p className="mt-3 text-sm leading-7 text-primary/72">
                Ban chi can them cac file anh vao thu muc src/assets/promotions. Phan cuoi trang se tu dong bien thanh mot dai anh chay lien tuc de quang ba cho website.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PromoImageRail;