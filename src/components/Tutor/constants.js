import options from "./tutorOptions.json";

// tutorOptions.json is shared with the API (api/_lib/validate.js) so the
// browser and the server always agree on what is allowed.
export const SUBJECTS = options.subjects;
export const LEVELS = options.levels;
export const LANGUAGES = options.languages;
export const LIMITS = options.limits;

export const DEFAULT_SETTINGS = {
  subject: "general",
  classLevel: "auto",
  language: "auto",
};

// Starter questions. Each one is sent to the real AI Tutor when clicked.
export const SUGGESTIONS = {
  general: [
    "Explain Newton's three laws of motion with everyday examples",
    "Photosynthesis ko simple Hinglish mein samjhao",
    "Solve step by step: 2x² − 5x + 2 = 0",
    "इलेक्ट्रॉन और प्रोटॉन में क्या अंतर है?",
  ],
  mathematics: [
    "Solve step by step: 2x² − 5x + 2 = 0",
    "Explain the chain rule in differentiation with two examples",
    "Probability of getting at least one head in 3 coin tosses?",
    "Quadratic equation ka discriminant kya batata hai?",
  ],
  physics: [
    "Explain Newton's three laws of motion with everyday examples",
    "A ball is thrown up at 20 m/s. Find the maximum height (g = 10 m/s²)",
    "Ohm's law ko Hinglish mein samjhao",
    "What is the difference between speed and velocity?",
  ],
  chemistry: [
    "Explain how to balance a chemical equation step by step",
    "What is the difference between ionic and covalent bonds?",
    "Mole concept ko easy tarike se samjhao",
    "pH scale क्या है और यह कैसे काम करता है?",
  ],
  biology: [
    "Explain the structure of DNA and how replication works",
    "Mitochondria aur chloroplast mein kya difference hai?",
    "What are the stages of mitosis? Give a short NEET-style summary",
    "एटीपी (ATP) क्या है? आसान भाषा में समझाइए",
  ],
  english: [
    "Explain the difference between active and passive voice with examples",
    "Help me write a formal letter to my principal",
    "What is the difference between 'affect' and 'effect'?",
    "Tenses ko Hinglish mein samjhao with examples",
  ],
  "computer-science": [
    "Explain what a loop is in programming with a Python example",
    "What is the difference between a stack and a queue?",
    "Binary search ko step by step samjhao",
    "Explain how the internet works in simple words",
  ],
};

export const CONTINUE_PROMPT = "Please continue from where you stopped.";
