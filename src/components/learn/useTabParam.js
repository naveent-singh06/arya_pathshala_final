import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Keeps the selected tab in the URL (?tab=...) so tabs can be linked to and survive refresh. */
export default function useTabParam(ids, fallback = ids[0]) {
  const [params, setParams] = useSearchParams();
  const asked = params.get('tab');
  const active = ids.includes(asked) ? asked : fallback;
  const setActive = useCallback(
    (id) => {
      const next = new URLSearchParams(params);
      next.set('tab', id);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );
  return [active, setActive];
}
