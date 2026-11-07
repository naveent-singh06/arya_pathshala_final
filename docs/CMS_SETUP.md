# Arya Pathshala — Study Hub & Admin Content Portal setup

Everything here is free-tier: YouTube hosts video, Google Drive hosts PDFs, Firestore stores only titles, links and order.
No PDF or video is ever stored on Vercel or in Firestore.

## 1. One-time Firebase steps (you do these, nothing is pasted into chat)
1. Firebase Console → Firestore Database → Rules → paste the contents of `firestore.rules` → **Publish**.
   (The new rules extend the old ones; the AI Tutor chat rules are unchanged.)
2. Make yourself admin. On your own computer, in this repo folder:
   - Firebase Console → Project settings → Service accounts → *Generate new private key*. Save the file **outside** the repo.
   - `npm install` then `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/set-admin-claim.js you@example.com`
   - Sign out and sign in again on the website. `/admin/content` now opens.
   - To remove admin later add `--revoke`. Delete the key file when done.
3. Vercel env vars `REACT_APP_FIREBASE_*` must be set (see `.env.example`), and the Preview/Production hostname added to Firebase → Authentication → Authorized domains.

## 2. How admin access is enforced
Admin = Firebase Auth custom claim `admin: true`, part of the signed ID token. Firestore rules check
`request.auth.token.admin == true`; the portal also checks the same token before showing anything.
It cannot be changed from the browser, localStorage or a profile field. Students can read only `published`
items and cannot write content. Unpublished/draft items are readable only by admins. The old email-based
flag in the existing dashboard is not used for the portal.

## 3. Adding content (`/admin/content`)
Order: Subjects → Chapters → Topics → Lectures / Notes & PDFs / Practice Questions. Everything has Draft / Published / Unpublished.
- **YouTube lecture**: paste `watch?v=`, `youtu.be/`, `youtube.com/live/`, `/shorts/` or `/embed/` links (or an 11-character ID). The ID is extracted and previewed; invalid links are rejected.
  Videos whose owner disabled embedding show an "Open on YouTube" fallback to students.
- **Notes / PDF**: paste a Google Drive link. Set sharing to **"Anyone with the link — Viewer"**, otherwise students will see "access denied".
- **Practice questions**: 4-option MCQs with explanation, per topic. The existing interactive quizzes are untouched.
- **Social Links & Contact**: add Instagram, Telegram, YouTube, WhatsApp, email or support URL. Only active links with valid URLs appear in the footer and Contact page. No URLs are pre-filled.

## 4. Student side
`/hub` → class → subject → collapsible chapters → topic page (lecture, notes, practice, personal notes, bookmark, completed).
Progress and personal notes are saved per student in `users/{uid}/hubProgress` and `hubNotes` (own access only).
Without Firebase configured, the Study Hub says so honestly and the sample courses keep working.

## 5. Free tier (Spark) limits
Firestore: 50k reads, 20k writes, 20k deletes per day, 1 GiB storage. A page view reads each published list once; small schools stay well inside this.
Firebase Storage is deliberately not used.

## 6. Not verified here
Firestore rules were reviewed by hand, not run against the emulator or your live project. After publishing, test: student cannot write, draft is invisible to students, admin can save.
