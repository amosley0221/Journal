/* global window, React */
// ─── Sign-in / sign-up screen ──────────────────────────────────────
// Matches the Journal+ skin (aurora background, glass panel, glossy pill
// buttons). Lives outside JournalApp so it can render before there's a session.

(() => {
  // ─── Password policy ──────────────────────────────────────────────
  // Same rules the UI advertises. Used both for live feedback on sign-up and
  // as a hard gate before we hit Supabase.
  const PASSWORD_RULES = [
    { id: 'len',  label: '8+ characters',     test: (s) => s.length >= 8 },
    { id: 'cap',  label: 'An uppercase letter', test: (s) => /[A-Z]/.test(s) },
    { id: 'num',  label: 'A number',          test: (s) => /\d/.test(s) },
    { id: 'sym',  label: 'A special character', test: (s) => /[^A-Za-z0-9]/.test(s) },
  ];
  function passwordIssues(pw) {
    return PASSWORD_RULES.filter((r) => !r.test(pw)).map((r) => r.id);
  }

  // ─── Tiny inline icons (just the ones the auth screen needs) ─────
  const EyeIcon = ({ open, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17.6 17.6 0 0 1-3.3 3.7" />
          <path d="M6.1 7.1A17.7 17.7 0 0 0 2 12s4 6 10 6a9.6 9.6 0 0 0 4-.9" />
          <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
        </>
      )}
    </svg>
  );
  const CheckIcon = ({ size = 11 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );

  // ─── Shared background (same skin the app uses, for visual continuity) ──
  function AuthBackground() {
    const skin = window.SKINS && window.SKINS.restrained;
    if (!skin) return null;
    return (
      <div className="auth-bg" aria-hidden="true">
        {React.createElement(skin.background, { theme: 'dark' })}
      </div>
    );
  }

  function Wordmark({ accent }) {
    return (
      <svg width="24" height="24" viewBox="0 0 22 22" aria-hidden="true">
        <rect x="2.5" y="2.5" width="17" height="17" rx="4.5" fill="none" stroke={accent} strokeWidth="1.6" />
        <path d="M6 11h10M6 7h7M6 15h6" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  function ConfigMissingScreen() {
    return (
      <div className="auth-root">
        <AuthBackground />
        <div className="auth-card">
          <div className="auth-brand">
            <Wordmark accent="var(--accent)" />
            <span className="auth-wordmark">Journal<span style={{ color: 'var(--accent)' }}>+</span></span>
          </div>
          <h1 className="auth-title">Not configured yet</h1>
          <p className="auth-sub">
            Add your Supabase credentials to <code className="auth-code">config.js</code> and redeploy.
            See <code className="auth-code">README.md</code> for setup steps.
          </p>
        </div>
      </div>
    );
  }

  // ─── Toggle switch (glass pill) ──────────────────────────────────
  function Switch({ checked, onChange, label }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`auth-switch-row ${checked ? 'is-on' : ''}`}
      >
        <span className="auth-switch-pill">
          <span className="auth-switch-knob" />
        </span>
        <span className="auth-switch-label">{label}</span>
      </button>
    );
  }

  // ─── Password field with show/hide toggle ────────────────────────
  function PasswordField({ value, onChange, autoComplete, placeholder = '••••••••' }) {
    const [show, setShow] = React.useState(false);
    return (
      <div className="auth-input-wrap">
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="auth-input"
        />
        <button
          type="button"
          className="auth-eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          title={show ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    );
  }

  // ─── Live password checklist (sign-up only) ──────────────────────
  function PasswordChecklist({ value }) {
    return (
      <ul className="auth-checklist">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(value);
          return (
            <li key={r.id} className={ok ? 'is-met' : ''}>
              <span className="auth-check-dot" aria-hidden="true">
                {ok ? <CheckIcon /> : <span className="auth-check-empty" />}
              </span>
              {r.label}
            </li>
          );
        })}
      </ul>
    );
  }

  function AuthScreen() {
    const [mode, setMode] = React.useState('signin'); // signin | signup | forgot
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [stay, setStay] = React.useState(() => window.getPersist ? window.getPersist() : true);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [notice, setNotice] = React.useState(null);

    if (!window.JOURNAL_SYNC_CONFIGURED) return <ConfigMissingScreen />;

    const isForgot = mode === 'forgot';
    const isSignup = mode === 'signup';
    const pwIssues = isSignup ? passwordIssues(password) : [];
    const canSubmit = !busy && email.trim() &&
      (isForgot || password.length > 0) &&
      (!isSignup || pwIssues.length === 0);

    function switchMode(next) {
      setMode(next); setError(null); setNotice(null);
    }

    async function submit(e) {
      e.preventDefault();
      if (!canSubmit) return;
      setBusy(true); setError(null); setNotice(null);
      try {
        // Apply "Stay signed in" before the auth call so the resulting
        // session lands in the right storage.
        if (window.setPersistSession) window.setPersistSession(stay);

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

    const ctaLabel =
      mode === 'signin' ? 'Sign in' :
      mode === 'signup' ? 'Create account' :
      'Send reset link';

    return (
      <div className="auth-root">
        <AuthBackground />

        <div className="auth-card">
          <div className="auth-tag">Journal+ · sync</div>

          <div className="auth-brand">
            <Wordmark accent="var(--accent)" />
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

          <form onSubmit={submit} className="auth-form" noValidate>
            <label className="auth-field">
              <span>Email</span>
              <div className="auth-input-wrap">
                <input
                  type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                />
              </div>
            </label>

            {!isForgot && (
              <label className="auth-field">
                <span>Password</span>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                {isSignup && <PasswordChecklist value={password} />}
              </label>
            )}

            {!isForgot && (
              <Switch
                checked={stay}
                onChange={setStay}
                label="Stay signed in on this device"
              />
            )}

            {error && <div className="auth-error">{error}</div>}
            {notice && <div className="auth-notice">{notice}</div>}

            <button type="submit" className="auth-submit" disabled={!canSubmit}>
              {busy ? <span className="auth-spinner" /> : ctaLabel}
            </button>
          </form>

          <div className="auth-switch-links">
            {mode === 'signin' && (
              <>
                <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                  Create an account
                </button>
                <span className="auth-dot">·</span>
                <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </>
            )}
            {mode !== 'signin' && (
              <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { AuthScreen });
})();
