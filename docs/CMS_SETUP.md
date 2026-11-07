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

## 2b. Optional demo content (safe, admin-only)
`node scripts/seed-demo-content.js` is a dry run that shows what it would add. To write it, set `GOOGLE_APPLICATION_CREDENTIALS` to your service-account file (kept outside the repo) and run it again with `--confirm-project=<your project id>`. It adds a clearly labelled "(Demo)" Foundation Batch for Class 9, Class 10 and NEET, with subjects, chapters, topics (Class 10 Mathematics → Number Systems is the fuller example) and a few questions. It never overwrites existing documents, invents no YouTube/Drive links, and `--remove` deletes only demo documents. It does not run automatically and nothing is written to any database unless you run it.

## 2c. If the Study Hub shows "could not load"
The screen shows a "Technical detail" code: `permission-denied` = publish the latest `firestore.rules` (and log in); `unavailable` or `timeout` = Firestore is not created for the project or the network blocks it; `not-found` = create the Firestore database in the Firebase console.

## 3. Adding content (`/admin/content`)
Student path: All courses → Course (Class 9 / Class 10 / NEET / your own) → Batch → Batch dashboard → Subject → Chapter → Topic.
Order for the admin: (Courses, optional) → Teachers → Subjects → **Batches** (tick the subjects and teachers the batch uses) → Chapters → Topics (use "Add many topics" to paste a list) → Lectures / Notes & PDFs / DPP / Practice Questions.
A subject that is in no batch is not shown to students (the Overview warns about this). One subject can be in several batches and then shares its chapters; to give a batch different content, make a separate subject for it.
 Everything has Draft / Published / Unpublished.
- **YouTube lecture**: paste `watch?v=`, `youtu.be/`, `youtube.com/live/`, `/shorts/` or `/embed/` links (or an 11-character ID). The ID is extracted and previewed; invalid links are rejected.
  Videos whose owner disabled embedding show an "Open on YouTube" fallback to students.
- **Notes / PDF**: paste a Google Drive link. Set sharing to **"Anyone with the link — Viewer"**, otherwise students will see "access denied".
- **DPP**: a Drive PDF or an external https practice link for a chapter (or one topic), with instructions and an optional due date. Question-based DPPs: add questions and set "Where it appears" to DPP.
- **Practice questions**: 4-option MCQs with explanation, per topic. The existing interactive quizzes are untouched.
- **Social Links & Contact**: add Instagram, Telegram, YouTube, WhatsApp, email or support URL. Only active links with valid URLs appear in the footer and Contact page. No URLs are pre-filled.

## 4. Student side
`/hub` (all courses) → batches → batch dashboard → subject → collapsible chapters with Expand/Collapse all → topic page (lecture, notes, DPP, practice one question at a time with explanation and retry of wrong answers, personal notes, bookmark, completed). Enrolling saves `users/{uid}/enrollments/{batchId}`.
Progress and personal notes are saved per student in `users/{uid}/hubProgress` and `hubNotes` (own access only).
Without Firebase configured, the Study Hub says so honestly and the sample courses keep working.

## 5. Free tier (Spark) limits
Firestore: 50k reads, 20k writes, 20k deletes per day, 1 GiB storage. A page view reads each published list once; small schools stay well inside this.
Firebase Storage is deliberately not used.

## 6. Not supported
Uploading PDFs or images: Firebase Storage is not enabled (it needs a billing plan), so notes use Google Drive links and pictures use https links. Courses beyond the built-in three can be added, but their cover/description are text only.

## 7. Not verified here
Firestore rules were reviewed by hand, not run against the emulator or your live project. After publishing, test: student cannot write, draft is invisible to students, admin can save.
