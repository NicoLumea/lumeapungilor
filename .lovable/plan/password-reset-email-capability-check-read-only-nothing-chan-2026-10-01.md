# Password-reset email: capability check (read-only, nothing changed)

## What I checked directly
- No email domain is set up for this project, and email setup was never started.
- The project has no custom sign-in email templates. There is no template folder and no email webhook route, and `{{ .ConfirmationURL }}` / `{{ .Token }}` appear nowhere in the code.
- So password-reset emails currently use Lovable Cloud's built-in default template and sender.
- The reset link is built on the server as `PUBLIC_SITE_URL` + `/parola-noua`. If `PUBLIC_SITE_URL` is not set, it uses the address the request came from.

## What I cannot check (assumptions)
- I can't read the built-in default template. Lovable Cloud does not let me view or edit the hosted recovery template, the Site URL, or the redirect allow-list. Default templates send a link (the equivalent of `{{ .ConfirmationURL }}`), and the `/parola-noua` page expects that link. Neither is verified against the hosted setting.
- More → Cloud → Emails shows domain setup and delivery status. It does not offer a raw editor for the built-in templates.
- `docs/password-recovery-setup.md` mentions "Supabase dashboard" steps, but Lovable Cloud gives no access to that dashboard, so those steps can't be followed as written.

## The supported way to send only the reset email as a code
1. Connect a domain you own in Cloud → Emails ("Set up email domain").
2. Have me create the branded sign-in email templates. This adds all six email types.
3. Edit only the recovery template so it shows the one-time code (the `token` value) instead of the button link. A link back to `/parola-noua` without any token is optional.
4. Change `/parola-noua` so it asks for email + code and confirms it (type `recovery`). Without this change, a code-only email leaves users stuck.
5. Leave the other five templates unchanged. Emails go live once the domain's DNS is verified.

## Where the /parola-noua redirect can be checked
- In the code: `passwordRecoveryRedirect()` in `src/lib/auth-security.server.ts`, plus the `PUBLIC_SITE_URL` secret in Project Settings → Secrets (only whether it exists; the value stays hidden).
- I cannot read the hosted redirect allow-list. You can only confirm it works by sending a real reset email from a test account.
