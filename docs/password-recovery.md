# Password recovery deployment

Routes: /forgot-password and /reset-password. Existing Supabase implicit browser flow is retained; no service-role keys, schema or access policy changes.

Before production use:
1. Confirm Vercel production NEXT_PUBLIC_SUPABASE_URL points to the Supabase project containing the confirmed admin account. Repository fallback points to rzosrbkyniyedolhkgxo, while a separate project named resort style exists; do not change either based only on its name.
2. In that project's Authentication URL Configuration, add exactly https://www.resort-style.net/reset-password to Redirect URLs. Keep existing entries. Do not add a wildcard or change Site URL blindly.
3. Confirm recovery email template uses ConfirmationURL, preserving redirect_to; custom templates may need review.
4. Merge/deploy after review, then send a NEW email from /forgot-password. Previously sent links may be expired or point elsewhere.
5. The account owner opens the latest link and enters the new password themselves. Verify login and administrator authorization afterwards. Do not share recovery URLs or credentials in issues/logs.

Validation: npm run build passed; node --test tests/password-recovery.cjs passed 4 tests (unauthenticated/invalid session, mismatch/success/signout, Auth rejection, redirect/repeated send).

Not yet verified: live email delivery, Supabase redirect allowlist/template configuration, real password update and subsequent admin login. Tests mock Auth and do not change a real password. Password update requires a server-validated session; no admin authorization is granted by this page. Existing resort_admins authorization is retained.
