# Verified company and contact information

## Build
- Store the verified company identity, two telephone numbers, schedule, and seller-enquiry copy in the existing single company content record; expose one reusable reader for every public view.
- Replace the footer contact area and add a restrained legal-company strip that stacks cleanly on mobile.
- Build the complete Romanian Contact page with schedule, clickable telephone details, company identity, and seller-enquiry call buttons; do not add an unconnected form.
- Add the same compact legal identity to Terms, Privacy, Delivery, Returns, checkout, and order confirmation without altering their existing policies or commerce behavior.
- Publish Organization structured data from the same centralized company source, with only the verified name, legal name, address, country, and telephone numbers.
- Keep the company record editable in the existing content administration area, with no invented email, postal code, social profile, or opening exceptions.

## Verification
- Check exact wording and telephone targets across the footer, Contact, legal pages, checkout, and confirmation.
- Verify Contact has no placeholder text and no invented email.
- Test desktop and mobile widths for readable wrapping, 44px call targets, and no horizontal scrolling.
- Confirm existing navigation, product browsing, cart, and checkout interactions remain intact.

## Technical details
- Reuse the existing `site_content` company row rather than duplicating literals across components.
- Render JSON-LD through a shared component fed by the same company record.
- Preserve current route structure and design tokens.
