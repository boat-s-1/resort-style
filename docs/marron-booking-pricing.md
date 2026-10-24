# MarroN booking calculation

MarroN only: desktop form uses the requested five rows of three columns, with a spacer after the fourth row's cast-back adjustment. Small screens stack fields in the same reading order. The treatment duration is read-only derived output before the memo. Payment / cast back / store share appear below the memo.

Eight course options: new70 11500/6000, new90 14000/8000, 60 12000/6000, 80 14500/8000, 100 17000/10000, 120 19500/12000, 150 24500/15000, 180 29500/18000 (price/cast back, yen). Extension none/20/40/60 adds 0/4000/8000/12000 to price and 0/3000/6000/9000 to payout. Nomination none/P500/P1000/R1000/R2000 adds customer fee 0/500/1000/1000/2000 and cast back 0/0/0/1000/2000.

Payment = course + extension + nomination + option + signed price adjustment. Positive price adjustment is surcharge; negative is discount. Cast back = course back + extension back + R nomination back + signed payout adjustment. Option fee adds to payment; any cast share is entered in the payout adjustment. Store share = payment - cast back, which may be negative if deliberately adjusted that way. Payment and cast back must be nonnegative integers.

The selected course, nomination code, extension minutes and three adjustments are persisted. pricing_version=1 activates a SECURITY INVOKER DB trigger for MarroN rows. The database recalculates duration and all money fields, so persisted sums match the UI. Existing unversioned records are not mass-repriced. Resort-style uses its existing form/calculation. Script applied as marron_booking_automatic_pricing.

Validation: 16 Node tests passed: all tariff options, extension matrix, nomination rules, combined adjustments, invalid values, field order, actual save payload, and existing regression checks. Database transaction verified insert overrides tampered totals, course/extension/nomination edits, option/discount/back adjustments and stable recalculation on notes-only update. Synthetic records rolled back. Production build passed. Live signed-in visual inspection remains pending.
