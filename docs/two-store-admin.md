# Two-store administration
Top-level MarroN / Resort-style tabs scope bookings, sales, rooms, schedules, profiles and account issuance. Existing Toyohashi/Anjo/Nagoya locations remain Resort-style. A non-public MarroN operational location is added without an invented address.

Customer identity is shared with independent uses_marron / uses_resort_style flags. Both may be checked; at least one is required. Lists and booking choices show the selected brand. Visits/totals count only that brand's bookings. Unchecking hides the customer without deleting history. Booking inserts/updates atomically mark the matching brand via a security-invoker trigger.

Profiles may belong to both brands. Public Resort-style pages filter by brand; restrictive anonymous SELECT policies exclude MarroN-only data. No public MarroN site integration is included.

Validation: production build passed, 6 Node tests passed (password recovery plus both-brand list visibility, checkbox defaults, saved flags, booking choices). Transactional SQL test verified automatic brand flags and cross-brand therapist rejection; anonymous reads returned 0 MarroN / 1 Resort-style synthetic profile; test rolled back. Security advisors identify existing account/session/RPC/password configuration findings, with none identifying the new invoker function or missing policies.

Database script db/two-brands.sql was applied as two_store_admin_customer_flags. Code can roll back to previous deployment while retaining additive columns. Do not drop columns/delete locations after real data is entered.

Existing constraint permits one schedule row per therapist/day. Split-day shifts at both brands require a future scheduling change.
