import { Link } from "@tanstack/react-router";
import heroBackground from "@/assets/lumea-pungilor-b2b-header-1920x800.png.asset.json";
import { useContent, text } from "@/lib/content";

export function StoreHero({ welcome = false }: { welcome?: boolean }) {
  const { data: content } = useContent();
  const home = content?.["home"];
  const heroTitle = text(home, "hero_title") ?? "Ambalaje pentru magazine, restaurante și ateliere";
  const heroSubtitle =
    text(home, "hero_text") ??
    text(home, "hero_subtitle") ??
    "Pungi cu mâner, pungi fără mâner, fețe de masă și folie cu bule, disponibile pentru comenzi de la persoane fizice și firme.";

  return (
    <section className="overflow-hidden border-b border-border bg-[linear-gradient(90deg,#e9e1d6_0%,#f8f4ee_16%,#f8f4ee_84%,#e9e1d6_100%)]">
      <div className="relative mx-auto w-full max-w-[1920px] bg-hero">
        <div className="relative z-10 px-5 py-5 xl:absolute xl:inset-0 xl:flex xl:items-center xl:px-[clamp(28px,4vw,56px)] xl:py-0">
          <div className="max-w-[500px] text-left xl:w-[30%] xl:max-w-[390px]">
            <h1 className="display text-3xl leading-[1.08] xl:text-[clamp(28px,2.7vw,40px)]">
              {heroTitle}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-[1.5] text-foreground/80 xl:mt-4 xl:text-[clamp(14px,1.35vw,17px)]">
              {heroSubtitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 xl:mt-6 xl:gap-3">
              <Link
                to={welcome ? "/magazin" : "/produse"}
                className="micro inline-flex min-h-11 w-fit max-w-full items-center border border-foreground bg-foreground px-4 py-3 text-background transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground xl:px-6"
              >
                {welcome ? "Intră în magazin" : "Vezi catalogul"}
              </Link>
              {!welcome ? (
                <Link
                  to="/contact"
                  className="micro inline-flex min-h-11 w-fit max-w-full items-center border border-foreground px-4 py-3 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground xl:px-6"
                >
                  Contactează-ne
                </Link>
              ) : null}
            </div>
          </div>
        </div>
        <img
          src={heroBackground.url}
          alt="Colecție de pungi din plastic pentru comenzi en-gros Lumea Pungilor."
          width="1920"
          height="800"
          fetchPriority="high"
          className="pointer-events-none relative block h-auto w-full xl:h-[min(41.6667vw,600px)] xl:object-cover"
        />
      </div>
    </section>
  );
}

