# Monthly expenses and profit

Sales dashboard adds a profit card immediately after net store sales. Desktop uses 4 columns; mobile uses 2. Profit = selected month's completed-booking revenue - cast payout - selected month's active expenses. The store summary table includes profit and expenses.

Expense entry uses purpose and integer yen amount. Month comes from the existing target-month selector. A single-location brand automatically uses its store; multi-location brands select a location to keep per-store profits exact. Data is scoped to the active brand's store IDs and selected month. Entries can be edited or removed from calculation via is_archived; no hard delete is exposed/granted. No anonymous access. An admin role is required by RLS for every read/write.

If expense loading fails, profit and expense totals show a dash rather than treating unknown expenses as zero. Target-month changes remount the expense form to prevent edits carrying into another month.

Validation: build passed, 18 Node tests passed including both-brand/month profit filtering and prior regressions. Transactional SQL test verified admin add/edit/archive, non-admin read/write denial, and absence of anon SELECT privileges; test rolled back. Security advisors report no expense-table findings. Database migration brand_monthly_expenses applied. Live signed-in visual verification remains pending.
