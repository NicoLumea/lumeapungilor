# Google Analytics

Production measurement ID: `G-5C1GD5RB5W`.

## Required Google stream setting

In Google Analytics → Admin → Data streams → the lumeapungilor.ro web stream,
turn **Enhanced measurement OFF** before promoting this version to production.
The website sends its own `page_view` events on public route changes. Leaving
Google's automatic history measurement enabled produces duplicate page views
and can collect URLs from account/order screens. Do not paste the plain Google
snippet into another template or Cloudflare integration.

Official references:
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/tag-platform/security/concepts/consent-mode

## Behaviour

- The tag loads only after a saved analytics opt-in, on lumeapungilor.ro or www.lumeapungilor.ro.
- Preview, development, staff, authentication, account, cart, checkout and order pages are excluded.
- Explicit public page views omit query strings and fragments. External referrers contain only their origin.
- Advertising consent stays denied; Google Signals and ad personalization are disabled.
- Saving cookie settings updates tracking immediately. Withdrawing analytics consent sets Google's disable flag and deletes accessible `_ga` / `_ga_*` cookies. Changes in another tab are also observed.
- The root mounts the cookie banner and preferences, which previously existed but were not mounted.
- This integration measures visits and public pages. Ecommerce purchase/cart events are not included.

## Validation

Run `npm run test:analytics`, TypeScript checking and a production build.
After promotion, verify no Google request or `_ga` cookie on a fresh visit or
after choosing **Doar necesare**. Accept **Analiză**, navigate between two shop
pages, and verify one `page_view` per visit in GA DebugView/Realtime. Reject
analytics again and verify measurement stops. The initial tag installation test
may not detect a consent-gated tag until consent has been granted.
