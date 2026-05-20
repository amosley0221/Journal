/* global window, React */
// ─── Sign-in / sign-up screen ──────────────────────────────────────
// Matches the Journal+ glass-dark aesthetic. Rendered when there's no Supabase
// session.

(() => {
  const { Icon } = window;

  function ConfigMissingScreen() {
    return (
      <div className="auth-root">
        <BG />
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-wordmark">Journal<span style={{ color: 'var(--accent)' }}>+</span></span>
          </div>
          <h1 className="auth-title">Not configured yet</h1>
          <p className="auth-sub">
            Add your Supabase credentials to <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 6 }}>config.js</code> and redeploy.
            See <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 6 }}>README.md</code> for setup steps.
          </p>
        </div>
      </div>
    );
  }

  function BG() {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div className="aurora-layer aurora-1" style={{ background: 'radial-gradient(circle at 25% 30%, oklch(0.55 0.18 30 / 0.35), transparent 55%)' }} />
        <div className="aurora-layer aurora-2" style={{ background: 'radial-gradient(circle at 75% 70%, oklch(0.55 0.18 280 / 0.30), transparent 55%)' }} />
        <div className="aurora-layer aurora-3" style={{ background: 'radial-gradient(circle at 50% 90%, oklch(0.55 0.18 145 / 0.25), transparent 60%)' }} />
      </div>
    );
  }

  function AuthScreen() {
    const [mode, setMode] = React.useState('signin'); // signin | signup | forgot
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [notice, setNotice] = React.useState(null);

    if (!window.JOURNAL_SYNC_CONFIGURED) return <ConfigMissingScreen />;

    async function submit(e) {
      e.preventDefault();
      if (busy) return;
      setBusy(true); setError(null); setNotice(null);
      try {
        if (mode === 'signin') {
          await window.signIn(email.trim(), password);
        } else if (mode === 'signup') {
          await window.signUp(email.trim(), password);
          setNotice('Check your email to confirm your account, then sign in.');
          setMode('signin');
        } else if (mode === 'forgot') {
          await window.sendPasswordReset(email.trim());
          setNotice('Password reset link sent. Check your email.');
          setMode('signin');
        }
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setBusy(false);
      }
    }

    const isForgot = mode === 'forgot';
    const ctaLabel =
      mode === 'signin' ? 'Sign in' :
      mode === 'signup' ? 'Create account' :
      'Send reset link';

    return (
      <div className="auth-root">
        <BG />
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-wordmark">Journal<span style={{ color: 'var(--accent)' }}>+</span></span>
          </div>
          <h1 className="auth-title">
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your journal'}
            {mode === 'forgot' && 'Reset your password'}
          </h1>
          <p className="auth-sub">
            {mode === 'signin' && 'Sign in to sync your entries across devices.'}
            {mode === 'signup' && 'Your entries will sync to every device you sign in on.'}
            {mode === 'forgot' && 'Enter your email and we’ll send a reset link.'}
          </p>

          <form onSubmit={submit} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            {!isForgot && (
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required minLength={6}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            )}

            {error && <div className="auth-error">{error}</div>}
            {notice && <div className="auth-notice">{notice}</div>}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? '…' : ctaLabel}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'signin' && (
              <>
                <button type="button" className="auth-link" onClick={() => { setMode('signup'); setError(null); setNotice(null); }}>
                  Create an account
                </button>
                <span className="auth-dot">·</span>
                <button type="button" className="auth-link" onClick={() => { setMode('forgot'); setError(null); setNotice(null); }}>
                  Forgot password?
                </button>
              </>
            )}
            {mode !== 'signin' && (
              <button type="button" className="auth-link" onClick={() => { setMode('signin'); setError(null); setNotice(null); }}>
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { AuthScreen });
})();
