# Responsive refinement for Lumea Pungilor

## Goal
Make the existing storefront feel intentionally composed around 1440 × 900, remain balanced at 1366 × 768, and scale cleanly from 360px mobile to 2560px desktop without changing content, imagery, routes, or behaviour.

## Changes
- Add one shared centred storefront container: `min(100% - 48px, 1440px)`, switching to about 20px side margins below 768px.
- Apply that container consistently to the public header, footer, home sections, catalogue, product detail, cart, checkout, order confirmation, and content pages; leave admin untouched.
- Keep the header at its current height and behaviour, tighten desktop navigation with controlled fluid gaps, prevent wrapping, and switch to the existing mobile menu before links become crowded.
- Rebuild only the home banner layout around its natural 12:5 canvas: full-width warm beige band, centred banner capped at 1920px, uncropped `object-contain` image, and a text layer constrained to the clear left 38%.
- Keep the desktop banner composition through normal laptop widths, then use the existing stacked text + complete image treatment below 768px so no product artwork is cropped.
- Use capped, responsive grids for home categories and catalogue products, with controlled gaps and card widths across mobile, tablet, average desktop, and large desktop.
- Replace scattered 1600px layout caps and inconsistent side padding in public presentation files with the shared 1440px container while preserving narrower reading widths where appropriate.

## Breakpoints and scaling
- `< 768px`: existing mobile navigation; 20px page margins; stacked banner; mobile-friendly grids and controls.
- `768–1023px`: compact/tablet composition; desktop banner only while text remains clear; reduced spacing.
- `1024–1599px`: primary laptop/desktop composition, tuned especially for 1366–1440px.
- `1600–1920px`: same composition with additional outer breathing room; capped typography and gaps.
- `1921–2560px`: 1440px content cap and 1920px banner cap centred inside the matching beige band.

## Validation
- Check 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1366×768, 1440×900, 1536×864, 1920×1080, and 2560×1440.
- Verify header/mobile menu, navigation wrapping, banner integrity and aspect ratio, CTA clickability, text/product separation, card stability, and horizontal overflow.
- Confirm public links and interactions remain unchanged and report files changed, active breakpoints, and whether any fixed positioning was replaced.

## Technical details
- Tailwind v4 utilities remain in JSX; shared semantic layout utilities/tokens go in the existing global stylesheet.
- Absolute positioning remains only for layered imagery and banner text where it is relative to a stable aspect-ratio container; no browser-relative coordinates, negative margins, or viewport transforms are introduced.
- No backend, admin, data, image asset, route, or dependency changes.
