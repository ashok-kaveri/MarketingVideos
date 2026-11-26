# Amazon Shipping sample — brief
Pipeline sample (QA store `mcsl-automation-amazon`, QA app — app name painted over). Not a release video.

## Support matrix (scope of this sample)
| Capability | In video? | Evidence |
|---|---|---|
| Generate labels (single + bulk) | ✅ | KB `amazon-shipping-guide-for-shopify.md` › "Print the Amazon Shipping Labels" (select orders → Generate Labels) |
| Mark as Fulfilled + tracking synced to Shopify + shipped email | ✅ | KB › "Mark Orders as Fulfilled and Automatically Send Amazon Shipping Tracking Details" |
| Tracking tab (live status of all shipments) | ✅ | KB › "Track your Amazon Shipping Orders" |
| Live Amazon Shipping rates at checkout | ✅ supported, ❌ not in this sample | KB › "Display Amazon Shipping rates on the Shopify checkout"; needs a storefront capture |
| Connect account (Country of Origin → Connect → Amazon sign-in → Authorize) | ✅ supported, ❌ not in this sample | KB › "Add your Amazon Shipping Account"; Amazon's own sign-in pages must be recorded by hand |
| Cross-border / international labels | ❌ never claim | KB note: "Amazon Shipping currently doesn't support cross-border shipments" |
| Pickup booking in the app | ❌ never claim | KB note: the pickup window is pre-scheduled in Amazon Shipping Shipper Central, not in the app |

Capability matrix: Amazon Shipping `C43`, local automation env + KB present.

## Open questions for product (before a release video)
- Which countries to name in the full video (KB lists US, UK, ES, IT, FR, IN services).
- Confirm the account-connect screens for the production app (OAuth via Amazon sign-in).
