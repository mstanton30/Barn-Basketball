# Barn Basketball

A private-use, phone-friendly organizer for weekend basketball at the barn. Hosted as a **static website** on GitHub Pages. No backend or sign-in required.

## Test setup
- Mike, Drake, and Christopher begin as regular, preconfirmed players.
- John, Dave, and Steve are sample invitees (no real phone numbers).
- Default game is the next Saturday at 10:00 AM, six total spots.
- Edit players, phone numbers, priority, date, time, roster size, and invitation template.
- Invites reserve spots when marked sent; a pending invite counts against six.
- Twelve-hour overdue status is shown on opening the app; it does not auto-withdraw or text people.
- SMS links open a draft in Messages. You send each text and record the reply yourself.
- Stats show Yes, No, No-show, and Played. A confirmed Yes becomes Played automatically 3 hours after game start unless marked No-show; corrections are allowed at any time.
- Players can be added from iPhone contact AutoFill in Safari, through native Contact Picker on supporting browsers, or by importing a contact card (.vcf). Safari on iPhone does not support the native Contact Picker API.
- Data stays in the browser via localStorage. Backups can be exported/imported in Settings.

## Publishing
On GitHub select **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**. Once deployment completes, visit `https://mstanton30.github.io/Barn-Basketball/`.

## Privacy
The repository contains sample names only and no real phone numbers. Anything entered in the app is kept in that device/browser, not committed to the public GitHub repository. On a shared device, anyone with that browser profile can see the data. Export a backup before clearing browser storage.

## Adding an iPhone contact

In Players, tap **From Contacts**. On iPhone, tap the **Name** field; Safari can offer **AutoFill Contact → Other Contact**, allowing you to choose a saved contact. Check the name and phone number before saving. Because the website cannot directly open the iOS Contacts picker, the form also supports importing a .vcf file you share/export from Contacts into Files. Safari AutoFill availability can differ when launched as a Home Screen app; if absent, use the .vcf import.

## Automatic attendance

The app uses the game's local date and time on the device. From 3 hours after game start, all **Yes** (including regulars) count as Played unless marked No-show. **No** and Pending never count. No-show corrections are allowed afterward. The calculation happens on viewing the app, without a background service.

## Sending an invitation safely

1. Tap Invite for someone with a saved phone number.
2. Tap **Open Messages**, review the recipient and invitation text, and press the **blue Send arrow** in Messages. The app uses a direct `sms:` link. iOS may not always prefill message text; if so, use **Copy invitation** and **Open Messages without text**, then paste and send manually.
3. Return to Barn Basketball and tap **I tapped Send in Messages** to record the pending invitation. This button is disabled until you try to open Messages or copy the invitation. The app **cannot automatically verify** that the SMS was sent.
4. If you accidentally marked one pending without really sending it, tap **Not sent** next to the player to release the spot and try again. An unconfirmed draft is preserved on this device so you can resume it if the web app restarts.

No text message can be sent directly by this app without manually pressing Send in Messages.
