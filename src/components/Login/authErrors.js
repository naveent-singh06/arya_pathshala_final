/** Plain-language messages for Firebase Auth errors (the raw codes mean nothing to students). */
const MESSAGES = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/missing-password': 'Please enter your password.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account was found for that email. Check the address or sign up.',
  'auth/wrong-password': 'The password is not correct.',
  'auth/invalid-credential': 'The email or password is not correct. If you normally sign in with Google, use the Google button instead.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Could not reach the sign-in service. Check your internet connection.',
  'auth/popup-closed-by-user': 'The Google window was closed before sign-in finished. Please try again.',
  'auth/cancelled-popup-request': 'Another sign-in window was already open. Please try again.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
  'auth/unauthorized-domain': 'This website address is not authorised for sign-in yet. The site owner must add it in Firebase: Authentication > Settings > Authorized domains.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method. Try the other method.',
  'auth/invalid-api-key': 'This website is not connected to Firebase correctly (invalid API key).',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'This website is not connected to Firebase correctly (invalid API key).',
  'auth/internal-error': 'The sign-in service had a problem. Please try again.',
};

export function authErrorMessage(error) {
  const code = error && error.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return `Sign-in failed${code ? ` (${code})` : ''}. Please try again.`;
}
