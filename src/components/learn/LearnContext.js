import { createContext, useContext } from 'react';

// Shared by every page inside LearnLayout: the signed-in user plus the learner's local progress.
export const LearnContext = createContext({ user: null, state: null, actions: null });
export const useLearn = () => useContext(LearnContext);
