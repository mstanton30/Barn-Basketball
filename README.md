# Barn Basketball

A private-use, phone-friendly organizer for weekend basketball at the barn. Hosted as a **static website** on GitHub Pages. No backend or sign-in required.

## Live app setup
- Mike, Drake, and Christopher begin as regular, preconfirmed players.
- New installs start with those three regulars only; add other players from Contacts or manually. Existing installs retain all saved players.
- Default game is the next Saturday at 10:00 AM, six total spots.
- Edit players, phone numbers, priority, date, time, roster size, and invitation template.
- Tapping an SMS link immediately records the invitation as Pending to reserve a spot; a pending invite counts against six. The app cannot detect whether Messages actually sent it.
- Twelve-hour overdue status is shown on opening the app; it does not auto-withdraw or text people.
- SMS links open a draft in Messages. You send each text and record the reply yourself.
- Stats show Yes, No, No-show, and Played. A confirmed Yes becomes Played automatically 3 hours after game start unless marked No-show; corrections are allowed at any time.
- Players can be added from iPhone contact AutoFill in Safari, through native Contact Picker on supporting browsers, or by importing a contact card (.vcf). Safari on iPhone does not support the native Contact Picker API.
- Data stays in the browser via localStorage. Backups can be exported/imported in Settings.

## Live website
The public website is deployed from the `main` branch at `https://mstanton30.github.io/Barn-Basketball/`. Updates to code do not sync browser-local player data.

## Privacy
The repository contains starter first names but no real phone numbers. Anything entered in the app is kept in that device/browser, not committed to the public GitHub repository. On a shared device, anyone with that browser profile can see the data. Export a backup before clearing browser storage.

## Adding an iPhone contact

In Players, tap **From Contacts**. On iPhone, tap the **Name** field; Safari can offer **AutoFill Contact → Other Contact**, allowing you to choose a saved contact. Check the name and phone number before saving. Because the website cannot directly open the iOS Contacts picker, the form also supports importing a .vcf file you share/export from Contacts into Files. Safari AutoFill availability can differ when launched as a Home Screen app; if absent, use the .vcf import.

## Automatic attendance

The app uses the game's local date and time on the device. From 3 hours after game start, all **Yes** (including regulars) count as Played unless marked No-show. **No** and Pending never count. No-show corrections are allowed afterward. The calculation happens on viewing the app, without a background service.

## One-tap invitations

1. Tap **Invite** beside a player with a saved phone number. The app opens their individual Messages draft immediately.
2. Press the blue **Send** arrow in Messages. You do **not** need to return to the app to confirm sending.
3. Tapping Invite automatically logs that player as **Pending**, since iPhone does not give a website confirmation that you actually pressed Send. **If you canceled the draft**, tap **Not sent** beside that player to clear Pending so they can be invited again.

**Invite Open Spots** uses priority order and reserves no more than the available slots (confirmed plus pending never exceed six). The first text opens on the first tap. When you return from Messages, tap **Next: [name]** for the next individually addressed draft. You send each message yourself; no group thread and no extra confirmation prompts.

Because the app cannot know whether a text was sent, the **Not sent** correction is essential. Clicking an invite or reminder draft does not actually send SMS automatically.

## Night-before reminders (no SMS service)

When **all roster spots are confirmed**, Game displays **Send reminders** and **Add iPhone Calendar alert**.

- Set the alert time (default 7:00 PM the night before) and editable reminder wording in Settings.
- **Send reminders** opens the first confirmed player’s individual SMS draft immediately. After pressing Send in Messages, return and tap **Next: [name]** for each remaining player. No in-app confirmations. A reminder is marked prepared when you tap its link, not delivery-verified.
- **Add iPhone Calendar alert** downloads an `.ics` event for the evening before your game, containing a notification at the event's start. Open it from your iPhone Downloads or Files and **add** it to Calendar. Verify the event's Alert is enabled and iPhone Calendar notifications are permitted.
- Importing the calendar event is a required manual step: GitHub Pages cannot create an unattended iPhone notification while the app is closed. Once added, Calendar handles the alert without leaving Barn Basketball open.
- If a saved game time or date changes, update/replace the Calendar event manually. Don't import multiple copies for one game.
- An `.ics` event contains only the game date/time and a link to the app, **no phone numbers**.

There are no SMS-service fees.

## Approved dashboard redesign

The app now uses the navy, white and orange design chosen from the user's mockup:

- Upright two-line **BARN / BASKETBALL** wordmark and orange basketball art.
- Faint court-line watermark in the navy background throughout the app.
- Dark Next Game card with the same hoop photo crop featured in the approved mockup, dynamic date/time and an orange confirmed-players progress bar.
- Solid orange one-tap invite button, white player status snapshot with **no priority subtitles**, and four-icon bottom navigation.
- Players, Stats and Settings share the dark background, white cards and orange highlight styling.
- Full invitation controls remain available by opening **Manage all invitations** beneath the snapshot; editing, SMS, historical games, reminders, settings and local storage retain their existing behavior.

This is a visual update; the local browser storage key and saved data model have not changed.

## Production launch: response reset and history preservation
- On the first opening of this version, only the **current game's** previous invitation/response statuses are cleared. Active regular players remain confirmed. The date/time, names, phone numbers, priority order, and earlier games stay unchanged.
- The cleanup runs **once** per device's stored data. Reopening the app does not clear new invitations.
- **Declined** shows only when that game's record includes an actual invitation (invitedAt) followed by No. An old No without an invitation shows **Not invited**.
- Settings includes **Clear current game invitations** to intentionally start over without erasing contacts or older games.
- Imported backups are excluded from the one-time cleanup, to avoid silently discarding their recorded responses.
- Data is stored only in this browser, not synced. The app does not verify whether iPhone Messages actually sent a text. Export a backup before deleting browser data or moving devices.
