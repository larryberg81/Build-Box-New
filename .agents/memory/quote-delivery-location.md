---
name: Quote delivery location
description: Required delivery-location details for U.S. and Canadian quote requests.
---

Every quote request must include a delivery city and the market-specific code: ZIP Code in the United States, Postal Code in Canada. Collect the city for both markets; do not rely on a limited city dropdown.

**Why:** Sales needs a usable delivery location to prepare accurate container delivery quotes.

**How to apply:** Keep these fields required in all quote submission paths and reject incomplete quote requests at the API boundary. Preserve the country-specific label and input behavior.
