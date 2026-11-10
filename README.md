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
- History distinguishes invitation responses and attendance (games played).
- Data stays in the browser via localStorage. Backups can be exported/imported in Settings.

## Publishing
On GitHub select **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**. Once deployment completes, visit `https://mstanton30.github.io/Barn-Basketball/`.

## Privacy
The repository contains sample names only and no real phone numbers. Anything entered in the app is kept in that device/browser, not committed to the public GitHub repository. On a shared device, anyone with that browser profile can see the data. Export a backup before clearing browser storage.
