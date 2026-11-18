---
name: Verified sales notifications
description: User-approved truthfulness and country-selection scope for purchase popups.
---

The user chose “Build with an empty database” for US and Canadian container and genset sales popups.
Do not generate fictitious purchases, recycle earlier test inquiries as sales, or treat quote
submissions as completed purchases. Add genuine completed sales only after verification.

**Why:** The user explicitly approved an empty database after being told that fictional
purchases would not be shown as real.

**How to apply:** Leave notifications hidden until approved sales exist. Country matching uses
the website's US/Canada market selection; do not describe it as accurate visitor geolocation.
Keep contact details and street addresses out of the public notifications.

Sales administration is owner-only, not a customer account feature. Never grant sales
management privileges to the first person who signs up.

**Why:** The user explicitly requested a secure admin page and designated its administrator.
Public quote and email submission must stay available without a visitor account.

**How to apply:** Keep owner identity in private configuration, require verified ownership
on the server, and configure development and Vercel production independently. Do not let
missing administrator authentication settings disable the public site or inquiry emails.
