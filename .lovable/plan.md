# Premium homepage motion and featured products

## Goal
Add quiet, accessible motion to homepage category cards and the sticky header, plus a six-item featured-products section sourced from real available catalogue data.

## Changes
- Refine only homepage category-card interactions: contained image scale, subtle overlay, lifted label, growing underline, pressed/focus states, and reduced-motion handling.
- Add a homepage-only featured product card and one-time viewport reveal helper; do not modify the catalogue ProductCard or its responsive grid.
- Select six published, available products, prioritizing products already marked featured and filling from the existing product order when needed.
- Show real image, category, name, price, pack quantity when present, and stock status; keep the whole card as the only link/focus stop.
- Add a responsive 1/2/3/4-column featured grid using the catalogue container and preserve the compact mobile category layout.
- Refine the existing sticky header with a lightweight passive scroll state, fixed logo size, slight height reduction, translucent background, blur, border, and reduced-motion support.

## Technical details
- Use CSS transforms, opacity, semantic color tokens, and Intersection Observer; no animation dependency.
- Stop observing product cards after first reveal and show them immediately when reduced motion is preferred.
- Keep all current URLs, product/database values, cart behavior, and catalogue/category/product-page presentation unchanged.

## Validation
- Check 375×812, 390×844, 768×1024, 1366×768, 1440×900, 1920×1080, and 2560×1440.
- Confirm six available products, database-matched information, one-time reveal, stable header transition, keyboard focus, preserved mobile category columns, and no horizontal overflow.
