import { Link } from "@tanstack/react-router";
import heroBackground from "@/assets/lumea-pungilor-b2b-header-1920x800.png.asset.json";
import { text } from "@/lib/content";

export function StoreHero({
  home,
  welcome = false,
}: {
  home: Record<string, unknown>;
  welcome?: boolean;
}) {
  const heroTitle =
    text(home, "hero_title") ??
    "Pungi plastic, pungi curierat, mușama și folie cu bule pentru magazine și comercianți";
  const heroSubtitle =
    text(home, "hero_text") ??
    text(home, "hero_subtitle") ??
    "Pungute mici, pungi cadou din plastic și pungi curierat, pentru magazine, standuri comerciale și firme care expediază produse.";

  return (
    <section className="overflow-hidden border-b border-border bg-[linear-gradient(90deg,#e9e1d6_0%,#f8f4ee_16%,#f8f4ee_84%,#e9e1d6_100%)]">
      <div className="relative mx-auto w-full max-w-[1920px] bg-hero">
        <div className="relative z-10 px-5 py-5 xl:absolute xl:inset-0 xl:flex xl:items-center xl:px-[clamp(28px,4vw,56px)] xl:py-0">
          {!welcome && (
            <svg
              aria-hidden="true"
              viewBox="0 0 100 70"
              className="pointer-events-none absolute right-1 top-0 w-14 sm:w-20 xl:w-24"
              fill="none"
            >
              <g stroke="#365a46" strokeWidth="2" strokeLinecap="round">
                <path d="M99 0Q64 24 16 50 M86 8L65 7 M81 12L62 13 M74 16L54 15 M68 20L48 20 M59 25L39 25 M50 30L32 30 M42 35L26 36 M34 40L20 42 M84 10L78 28 M77 14L71 32 M69 19L62 37 M61 24L55 41 M53 29L46 45 M45 34L39 49 M36 39L31 52" />
              </g>
              <g fill="#a53537">
                <circle cx="66" cy="19" r="4" />
                <circle cx="72" cy="20" r="3.5" />
                <circle cx="68" cy="25" r="3.5" />
              </g>
            </svg>
          )}
          <div className="max-w-[500px] text-left xl:w-[30%] xl:max-w-[390px]">
            <h1
              className={`display ${welcome ? "" : "pr-9 text-[#203f32] sm:pr-0"} text-3xl leading-[1.08] xl:text-[clamp(28px,2.7vw,40px)]`}
            >
              {heroTitle}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-[1.5] text-foreground/80 xl:mt-4 xl:text-[clamp(14px,1.35vw,17px)]">
              {heroSubtitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 xl:mt-6 xl:gap-3">
              <Link
                to={welcome ? "/" : "/produse"}
                className="micro inline-flex min-h-11 w-fit max-w-full items-center border border-foreground bg-foreground px-4 py-3 text-background transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground xl:px-6"
              >
                {welcome ? "Intră în magazin" : "Vezi catalogul"}
              </Link>
              {!welcome ? (
                <Link
                  to="/categorie/$slug"
                  params={{ slug: "pungi-cadou-craciun" }}
                  className="micro inline-flex min-h-11 w-fit max-w-full items-center border border-foreground px-4 py-3 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground xl:px-6"
                >
                  Vezi pungile de Crăciun
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
