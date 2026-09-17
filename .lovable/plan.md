# Catalogue grid and card refinement

## Goal
Refine only the shared catalogue and product-card presentation used by product, category, and filtered search results, while preserving all existing data and behaviour.

## Changes
- Use a catalogue-specific centred container capped at 1560px with 24px, 32px, and 48px responsive side padding.
- Set the grid to 1 column on very narrow screens, 2 on larger mobile/tablet, 3 on 1024–1599px laptops, and 4 from 1600px, with 24px column gaps and 40–48px row gaps.
- Standardise cards as equal-height vertical links with 4:5 image fields, contained imagery, subtle reduced-motion-safe hover scaling, visible keyboard focus, and two-line product-name clamping.
- Show dynamic pack quantity only when available, keep pricing anchored at the bottom, and add stock badges derived from existing inventory values.
- Replace the loading message with stable skeleton cards, hide counts until loading completes, and add a Romanian retry action for request failures.

## Validation
- Check 375px, 768px, 1366×768, 1440×900, 1920×1080, and 2560×1440.
- Confirm column counts, equal image areas, aligned details and prices, two-line titles, filter/grid alignment, no overlap or overflow, and working product links and filters.

## Technical details
- Changes remain limited to the shared catalogue, product card, and catalogue-specific styling.
- No product records, images, prices, stock values, categories, database, cart, header, homepage, or product-detail code will change.
- “Stoc redus” will only use genuinely tracked positive stock; a restrained threshold derived from actual stock will be used without changing inventory.
