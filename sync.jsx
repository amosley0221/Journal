/* global window, React */
// ─── Supabase client + cross-device sync ───────────────────────────
//
// Persists the entire app state (sections tree, theme prefs, etc.) as a single
// JSONB row per user, then keeps it in sync via Supabase Realtime. This matches
// the in-memory shape exactly, which keeps the design code untouched.

(() => {
  const cfg = window.JOURNAL_CONFIG || {};
  const url = cfg.SUPABASE_URL;
  const key = cfg.SUPABASE_ANON_KEY;

  const configured = !!(url && key && window.supabase && window.supabase.createClient);
  const client = configured
    ? window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;

  window.JOURNAL_SYNC_CONFIGURED = configured;
  window.JOURNAL_SUPABASE = client;

  // ─── React auth hook ────────────────────────────────────────────
  function useAuth() {
    const [session, setSession] = React.useState(null);
    const [ready, setReady] = React.useState(!configured); // if unconfigured, skip auth check

    React.useEffect(() => {
      if (!client) return;
      let cancelled = false;
      client.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        setSession(data.session || null);
        setReady(true);
      });
      const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
        setSession(s || null);
      });
      return () => { cancelled = true; sub.subscription.unsubscribe(); };
    }, []);

    return { session, ready, configured, client };
  }

  // ─── Synced state hook ──────────────────────────────────────────
  // Owns the canonical app state. Loads the user's row on mount, debounces
  // writes back to the row, and subscribes to realtime updates from other
  // devices.
  //
  // Shape stored in DB (jsonb column "data"):
  //   { sections, appTheme, accentOverride, photoState, stickyState, themeState }
  function useSyncedJournal(session) {
    const initial = React.useMemo(() => ({
      sections: [],
      appTheme: 'dark',
      accentOverride: null,
      photoState: {},
      stickyState: {},
      themeState: {},
    }), []);

    const [data, setData] = React.useState(initial);
    const [loaded, setLoaded] = React.useState(false);
    const [syncStatus, setSyncStatus] = React.useState('idle'); // idle | loading | saving | error | offline

    const userId = session && session.user && session.user.id;
    const localRev = React.useRef(0);     // last write we issued
    const remoteRev = React.useRef(0);    // last write we observed from realtime
    const saveTimer = React.useRef(null);
    const lastSaved = React.useRef(null); // JSON string of last persisted payload

    // Initial load
    React.useEffect(() => {
      if (!client || !userId) { setLoaded(true); return; }
      setSyncStatus('loading');
      let cancelled = false;
      (async () => {
        const { data: row, error } = await client
          .from('user_data')
          .select('data')
          .eq('user_id', userId)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error('[sync] load failed', error);
          setSyncStatus('error');
          setLoaded(true);
          return;
        }
        if (row && row.data) {
          const merged = { ...initial, ...row.data };
          setData(merged);
          lastSaved.current = JSON.stringify(merged);
        } else {
          // First sign-in: create the row.
          const payload = { user_id: userId, data: initial };
          await client.from('user_data').upsert(payload);
          lastSaved.current = JSON.stringify(initial);
        }
        setSyncStatus('idle');
        setLoaded(true);
      })();
      return () => { cancelled = true; };
    }, [userId, initial]);

    // Debounced save on change
    React.useEffect(() => {
      if (!client || !userId || !loaded) return;
      const payload = JSON.stringify(data);
      if (payload === lastSaved.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSyncStatus('saving');
      saveTimer.current = setTimeout(async () => {
        localRev.current += 1;
        const myRev = localRev.current;
        const { error } = await client
          .from('user_data')
          .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
        if (myRev !== localRev.current) return; // a newer save started
        if (error) {
          console.error('[sync] save failed', error);
          setSyncStatus('error');
        } else {
          lastSaved.current = payload;
          setSyncStatus('idle');
        }
      }, 600);
      return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [data, userId, loaded]);

    // Realtime subscription — pull updates from other devices.
    React.useEffect(() => {
      if (!client || !userId) return;
      const channel = client.channel(`user_data:${userId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'user_data',
          filter: `user_id=eq.${userId}`,
        }, (payload) => {
          const next = payload.new && payload.new.data;
          if (!next) return;
          const asString = JSON.stringify(next);
          if (asString === lastSaved.current) return; // it's our own write echoed back
          remoteRev.current += 1;
          lastSaved.current = asString;
          setData({ ...initial, ...next });
        })
        .subscribe();
      return () => { client.removeChannel(channel); };
    }, [userId, initial]);

    // Field setters — shaped like useState setters so app.jsx stays simple.
    const makeSetter = React.useCallback((key) => (updater) => {
      setData((prev) => {
        const cur = prev[key];
        const next = typeof updater === 'function' ? updater(cur) : updater;
        if (next === cur) return prev;
        return { ...prev, [key]: next };
      });
    }, []);

    return {
      loaded,
      syncStatus,
      data,
      setSections: makeSetter('sections'),
      setAppTheme: makeSetter('appTheme'),
      setAccentOverride: makeSetter('accentOverride'),
      setPhotoState: makeSetter('photoState'),
      setStickyState: makeSetter('stickyState'),
      setThemeState: makeSetter('themeState'),
    };
  }

  async function signIn(email, password) {
    if (!client) throw new Error('Supabase not configured');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signUp(email, password) {
    if (!client) throw new Error('Supabase not configured');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
  }
  async function sendPasswordReset(email) {
    if (!client) throw new Error('Supabase not configured');
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  Object.assign(window, {
    useAuth, useSyncedJournal, signIn, signUp, signOut, sendPasswordReset,
  });
})();
