# ARYA PATHSHALA

ARYA PATHSHALA is an AI-powered learning platform for students of Class 9-12 and NEET / JEE preparation.

- **AI Tutor** - step-by-step help in English, Hindi and Hinglish, with saved chat history.
- **Student and admin dashboards** - sign-in with Google (Firebase Authentication).
- **Face-recognition attendance**, grading assistant and study planner (Flask backend in `backend/`).

## Setup and deployment

See [`docs/PHASE1_SETUP.md`](docs/PHASE1_SETUP.md) for the Firebase, AI provider and Vercel configuration,
and [`.env.example`](.env.example) for the list of environment variable names (never commit real values).

The website and `/api/tutor` deploy on Vercel. The Python backend in `backend/` (install with
`pip install -r backend/requirements.txt`) is deployed separately; see the architecture section in that guide.

## Commands

```
npm install        # install dependencies (Node 22)
npm start          # website only (use `npx vercel dev` to also run /api/tutor)
npm run build      # production build
npm run test:api   # server API tests
CI=true npm test   # React tests
```

## Study Hub & Admin content portal
See [docs/CMS_SETUP.md](docs/CMS_SETUP.md) for admin setup, adding lectures/PDFs/questions and Firestore rules.
