import { useCallback, useEffect, useState } from 'react';
import { getIdTokenResult } from 'firebase/auth';
import useAuthUser from '../components/Login/useAuthUser';
import { auth } from '../components/Login/firebase';
import { loadContent, loadSocialLinks, describeError, hasBackend } from './store';
import { visibleData } from './model';

const EMPTY = { courses: [], batches: [], teachers: [], dpps: [], subjects: [], chapters: [], topics: [], lectures: [], resources: [], questions: [], socialLinks: [] };

/**
 * Admin status comes from the signed Firebase ID token (custom claim `admin`), never from
 * local storage, the URL or a profile field. Firestore rules check the same claim on every write.
 */
export function useAdminStatus() {
  const user = useAuthUser();
  const [state, setState] = useState({ status: auth ? 'loading' : 'unconfigured' });
  useEffect(() => {
    if (!auth) return undefined;
    let live = true;
    if (!user) {
      setState({ status: 'signedout' });
      return undefined;
    }
    setState({ status: 'loading' });
    getIdTokenResult(user, true)
      .then((r) => live && setState({ status: r.claims.admin === true ? 'admin' : 'denied', user }))
      .catch(() => live && setState({ status: 'denied', user }));
    return () => {
      live = false;
    };
  }, [user]);
  return state;
}

/** Content for the admin portal (all documents) or the student side (published only). */
export function useContent({ admin = false } = {}) {
  const [state, setState] = useState({ status: hasBackend() ? 'loading' : 'unconfigured', data: EMPTY, error: '' });
  const [tick, setTick] = useState(0);
  const user = useAuthUser();
  useEffect(() => {
    if (!hasBackend()) return undefined;
    let live = true;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    loadContent({ admin })
      .then((raw) => live && setState({ status: 'ready', data: admin ? raw : visibleData(raw), error: '' }))
      .catch((e) => live && setState({ status: 'error', data: EMPTY, error: describeError(e), code: e && e.code }));
    return () => {
      live = false;
    };
  }, [admin, tick, user]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

let socialCache = null;
export function useSocialLinks() {
  const [links, setLinks] = useState(socialCache || []);
  useEffect(() => {
    if (!hasBackend() || socialCache) return undefined;
    let live = true;
    loadSocialLinks({ admin: false })
      .then((l) => {
        socialCache = l;
        if (live) setLinks(l);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return links;
}
export const clearSocialCache = () => {
  socialCache = null;
};
