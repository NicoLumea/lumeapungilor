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
      <div
        className={`relative mx-auto w-full max-w-[1920px] bg-hero ${welcome ? "" : "xl:grid xl:grid-cols-[42%_58%]"}`}
      >
        <div
          className={
            welcome
              ? "relative z-10 px-5 py-5 xl:absolute xl:inset-0 xl:flex xl:items-center xl:px-[clamp(28px,4vw,56px)] xl:py-0"
              : "holiday-hero-panel"
          }
        >
          <div
            className={
              welcome
                ? "max-w-[500px] text-left xl:w-[30%] xl:max-w-[390px]"
                : "relative z-10 max-w-[30rem]"
            }
          >
            <h1
              className={`display ${welcome ? "" : "text-[#fff5dd]"} text-3xl leading-[1.08] xl:text-[clamp(28px,2.7vw,40px)]`}
            >
              {heroTitle}
            </h1>
            <p
              className={`mt-3 max-w-md text-sm leading-[1.5] xl:mt-4 xl:text-[clamp(14px,1.35vw,17px)] ${welcome ? "text-foreground/80" : "text-[#f4e9d5]"}`}
            >
              {heroSubtitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 xl:mt-6 xl:gap-3">
              <Link
                to={welcome ? "/" : "/produse"}
                className={`micro inline-flex min-h-11 items-center border px-4 py-3 hover:opacity-85 xl:px-6 ${welcome ? "border-foreground bg-foreground text-background" : "border-[#e4c188] bg-[#f5e6c8] text-[#18362c]"}`}
              >
                {welcome ? "Intră în magazin" : "Vezi catalogul"}
              </Link>
              {!welcome ? (
                <Link
                  to="/categorie/$slug"
                  params={{ slug: "pungi-cadou-craciun" }}
                  className="micro inline-flex min-h-11 w-fit max-w-full items-center border border-[#e4c188] bg-[#143429]/80 px-4 py-3 text-[#fff5dd] transition-colors hover:bg-[#254b3d] xl:px-6"
                >
                  Vezi pungile de Crăciun
                </Link>
              ) : null}
            </div>
          </div>
        </div>
        <img
          src={welcome ? heroBackground.url : "/images/studio/store-bags-1280.webp"}
          srcSet={
            welcome
              ? undefined
              : "/images/studio/store-bags-640.webp 640w, /images/studio/store-bags-1280.webp 1280w"
          }
          sizes={welcome ? undefined : "(min-width: 1280px) 58vw, 100vw"}
          alt="Colecție de pungi din plastic pentru comenzi en-gros Lumea Pungilor."
          width={welcome ? 1920 : 1363}
          height="800"
          fetchPriority="high"
          className={`pointer-events-none relative block h-auto w-full xl:object-cover ${welcome ? "xl:h-[min(41.6667vw,600px)]" : "xl:h-full xl:min-h-0 xl:object-right"}`}
        />
      </div>
    </section>
  );
}
