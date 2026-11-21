import { useId } from "react";

// Each outline follows the merchandise in its original photograph. Applying the
// lighting as an overlay preserves the photographed prints, lettering and colors.
const studioCovers: Record<string, { path: string; height: number }> = {
  "/api/public/img/categories/pungi-cu-maner-display.png": {
    height: 800,
    path: "M5 45H31L39 26H56L69 44H94V80H101V68L113 60H135L145 70V82H151V37H177L183 21L191 17H209L217 26V37H245V166H182V213H68V154H5Z M8 262L25 234L33 217L57 206L83 212L102 221L121 220L189 260L117 294L69 287Z",
  },
  "/api/public/img/a5393dfa-d93e-4525-a971-3fd9ffafe952.png": {
    height: 800,
    path: "M73 40L179 38L182 174L72 172Z M7 211L96 191L147 234L159 258L123 282L111 268L54 282Z M150 243L174 207L240 221L222 263Z",
  },
  "/api/public/img/eb458272-802c-45c3-baf0-8e01fe211360.webp": {
    height: 800,
    path: "M7 63H64L71 52L81 49L91 53L96 66H113V78L120 68L132 67L141 73L146 91H246V196H182V218H68V149H49V125H7Z M1 220L20 211L39 204L57 211L65 224L80 231L103 239V266L52 268L4 255Z",
  },
  "/api/public/img/categories/pungi-fara-maner-display.png": {
    height: 800,
    path: "M8 23H88V62H159V23H241V129H173V190H73V129H7Z M9 228L45 208L97 199L158 203L182 198L240 235L183 283L110 278L76 283L23 266Z",
  },
  "/api/public/img/categories/fete-de-masa.png": {
    height: 853,
    path: "M5 37H40V29H68V21H122V31H156V36H184V106H59L55 115L108 107L152 111L167 120L186 194L157 201L127 211L104 229L81 250L51 224L23 215L14 220L1 205L4 145L15 119L43 110H5Z M197 69L249 67V182H197Z M128 211L187 193L249 202V271L193 283L126 267Z",
  },
  "/api/public/img/categories/folie-cu-bule.png": {
    height: 854,
    path: "M1 69L20 64L56 63L80 67V17L99 12L151 12L174 17V134L181 140V57L199 54L234 55L249 59V136L229 137L246 142V177L218 183L194 178L181 173L193 199L169 209L143 193L121 164L107 150L89 145L82 140L60 144L23 145L1 140Z M0 163L69 152L119 169L122 216L34 227L0 217Z M0 243L104 210L125 215L130 202L213 192L249 200V270L151 282L104 273L40 294L0 289Z",
  },
};

export function studioCover(url: string | null) {
  return url ? studioCovers[url] : undefined;
}

export const homepageBagOutline =
  "M53 175L343 176L343 27L633 27L639 328L641 328L650 83L947 55L945 216L1048 208L1057 153L1082 118L1115 111L1150 119L1172 153L1180 201L1247 201V611L926 602L922 646L817 658L533 652L433 640L423 647L52 646Z";

export function StudioPhotoLighting({
  outline,
  hero = false,
  height = 751,
}: {
  outline: string;
  hero?: boolean;
  height?: number;
}) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      viewBox={`0 0 ${hero ? 1280 : 640} ${height}`}
      preserveAspectRatio={hero ? "xMaxYMid slice" : "xMidYMid slice"}
    >
      <defs>
        <mask id={id}>
          <rect width="100%" height="100%" fill="white" />
          <path
            transform={hero ? undefined : `scale(2.56 ${height / 300})`}
            d={outline}
            fill="black"
            stroke="black"
            strokeWidth={hero ? 3 : 1}
            style={{ filter: `blur(${hero ? 5 : 1.8}px)` }}
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="#283022" opacity=".63" mask={`url(#${id})`} />
    </svg>
  );
}
