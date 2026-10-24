# Brand-specific media accounts

Management-only media directory under the existing MarroN / Resort-style tabs. Name, HTTP(S) address, login ID and optional password can be added/edited. Blank password on edit preserves the saved value. Credential-bearing URLs are rejected by the UI; links use noopener/noreferrer.

Metadata is stored in non-exposed resort_private.media_accounts. Passwords are stored in Supabase Vault using authenticated encryption; only the Vault reference is in the metadata table. No service-role key is placed in frontend code. Public RPC wrappers are SECURITY INVOKER, with EXECUTE granted only to authenticated. Their private SECURITY DEFINER implementations check auth.uid() against resort_admins before every operation, validate brand and bind lookup/update to both brand and row ID. An admin intentionally has access to both stores. Non-admin authenticated users and anonymous users cannot list, save or reveal data. Private tables have RLS enabled with no direct client grants/policies (intentional default-deny).

List responses contain only has_password, never the password or Vault ID. Reveal fetches one credential explicitly, auto-hides after 30 seconds and clears on tab visibility loss/store/component change. Password edits are never prefilled from the saved value. No secret is written to browser storage, logs or exported CSV by this feature.

Validation: production build passed; 9 Node tests passed. DB transaction verified per-brand lists, correct decryption, blank-edit preservation, cross-brand reveal/update rejection, non-admin rejection and lack of anon/direct-table grants. All synthetic credentials rolled back. Security advisor's media finding is INFO about intentionally default-deny RLS on the private table; existing findings remain outside scope. Real user credentials were not read or entered.

Database migration encrypted_brand_media_accounts (db/media-accounts.sql) applied. No actual media accounts have been seeded. Keep Vault data and its metadata mapping together in backups; never place real credentials in source control. This feature records credentials; it does not change passwords at external services.
