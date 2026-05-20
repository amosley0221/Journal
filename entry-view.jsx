/* global window, React */
// ─── Entry detail view (used inside the split layout) ──────────────

(() => {
const { useState: useStateE } = React;

function EntryView({ entry, accent, dark, onChangePhotos, onChangeStickies, onChangeTheme, onClose }) {
  const [pencilMode, setPencilMode] = useStateE(false);
  const [selected, setSelected] = useStateE(null);
  const [themeOpen, setThemeOpen] = useStateE(false);
  const scrollRef = React.useRef(null);

  const theme = entry.theme || 'dark';
  const isLight = ['parchment', 'cream'].includes(theme);
  const themeBg = themeBackground(theme);
  const themeFg = isLight ? '#22201b' : '#e9e6df';
  const themeBodyFont = ['notebook', 'handwritten'].includes(theme)
    ? '"Caveat", "Segoe Script", cursive' : 'inherit';
  const bodySize = ['notebook', 'handwritten'].includes(theme) ? 22 : 16;
  const bodyLh = ['notebook', 'handwritten'].includes(theme) ? 1.45 : 1.7;

  // Chip
  const Chip = ({ icon, children, tone = 'neutral' }) => (
    <span className={`chip chip-${tone}`}>
      {icon && <window.Icon name={icon} size={13} />}
      <span>{children}</span>
    </span>
  );

  return (
    <div className="entry-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 10px' }}>
        <button className="icon-btn ghost" onClick={onClose} aria-label="Close">
          <window.Icon name="back" size={18} />
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="icon-btn ghost"
            onClick={() => setPencilMode(!pencilMode)}
            title={pencilMode ? 'Switch to type' : 'Switch to handwriting'}
            style={pencilMode ? { background: accent, color: '#0a0a0c' } : {}}
          >
            <window.Icon name="pen" size={16} />
          </button>
          <button className="icon-btn ghost"><window.Icon name="image" size={16} /></button>
          <button className="icon-btn ghost"><window.Icon name="sticky" size={16} /></button>
          <button className="icon-btn ghost"><window.Icon name="mic" size={16} /></button>
          <button className="icon-btn ghost"><window.Icon name="more" size={16} /></button>
        </div>
      </div>

      {/* Title block */}
      <div style={{ padding: '6px 26px 14px' }}>
        <div className="entry-dateline">
          {window.fmtDate(entry.date)} · {entry.dow} · {entry.time}
        </div>
        <h1 className="entry-title">{entry.title}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12, position: 'relative' }}>
          {entry.mood && <Chip icon="smile">{entry.mood}</Chip>}
          {entry.weather && <Chip icon="cloud">{entry.weather}</Chip>}
          {entry.location && <Chip icon="map">{entry.location.name}</Chip>}
          <div className="theme-picker">
            <button
              className="chip chip-accent theme-picker-btn"
              onClick={(e) => { e.stopPropagation(); setThemeOpen(!themeOpen); }}
            >
              <window.Icon name="layers" size={13} />
              <span>{themeName(theme)}</span>
              <window.Icon name="chevron" size={11} style={{ opacity: 0.7, transform: themeOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }} />
            </button>
            {themeOpen && (
              <div className="theme-picker-pop" onClick={(e) => e.stopPropagation()}>
                <div className="theme-picker-label">Paper theme</div>
                {window.THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { onChangeTheme && onChangeTheme(t.id); setThemeOpen(false); }}
                    className={`theme-picker-item ${t.id === theme ? 'theme-picker-item-active' : ''}`}
                  >
                    <ThemeSwatch theme={t.id} />
                    <span>{t.name}</span>
                    {t.id === theme && <window.Icon name="check" size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Paper area */}
      <div
        className={`paper paper-${theme}`}
        onPointerDown={() => setSelected(null)}
        style={{
          position: 'relative',
          flex: 1, margin: '4px 22px 14px', borderRadius: 18,
          overflow: 'hidden',
          background: themeBg.bg,
          color: themeFg,
          border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.25)',
        }}
      >
        {pencilMode ? (
          <window.InkCanvas accent={accent} dark={!isLight} />
        ) : (
          <div
            ref={scrollRef}
            style={{
              position: 'absolute', inset: 0,
              padding: theme === 'notebook' ? '38px 56px 38px 78px' : '36px 44px',
              overflow: 'auto',
              // Background lives ON the scrolling element so it travels with the text.
              backgroundImage: themeBg.image,
              backgroundSize: themeBg.size,
              backgroundPosition: themeBg.position || '0 0',
              backgroundAttachment: 'local',
              backgroundRepeat: themeBg.repeat || 'repeat',
              fontFamily: themeBodyFont,
              fontSize: bodySize,
              lineHeight: bodyLh,
            }}
          >
            {/* Inner positioning wrapper — floatboxes use absolute positioning
                within this so they scroll with the page content. */}
            <div style={{ position: 'relative', minHeight: '100%' }}>
            {entry.body && entry.body.map((b, i) => {
              if (b.type === 'h') return <h3 key={i} style={{
                fontFamily: 'inherit',
                fontSize: bodySize * 1.18, margin: '18px 0 10px',
                fontWeight: 600, letterSpacing: '-0.01em',
                color: isLight ? '#22201b' : '#fff',
              }}>{b.text}</h3>;
              if (b.type === 'code') return (
                <pre key={i} style={{
                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: 14, margin: '8px 0',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 13, lineHeight: 1.55,
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}>{b.text}</pre>
              );
              return <p key={i} style={{ margin: '0 0 12px' }}>{b.text}</p>;
            })}
            {/* Voice memo bubble */}
            {entry.voice && entry.voice.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                {entry.voice.map((v) => (
                  <div key={v.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 999,
                    background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.10)',
                    width: 'fit-content', maxWidth: '100%',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 999, background: accent,
                      color: '#0a0a0c', display: 'grid', placeItems: 'center',
                    }}>
                      <window.Icon name="mic" size={14} />
                    </div>
                    <Waveform count={28} accent={accent} dark={!isLight} />
                    <span style={{ fontSize: 12, opacity: 0.7, fontFamily: 'ui-monospace, Menlo, monospace' }}>{v.dur}</span>
                    <span style={{ fontSize: 13, opacity: 0.85 }}>{v.label}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Backlinks */}
            {entry.backlinks && entry.backlinks.length > 0 && (
              <div style={{ marginTop: 28, paddingTop: 14, borderTop: isLight ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(255,255,255,0.10)' }}>
                <div style={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                  opacity: 0.55, marginBottom: 8,
                }}>Linked entries</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {entry.backlinks.map((b) => (
                    <span key={b} className="chip chip-neutral" style={{ fontFamily: 'inherit', fontSize: 12 }}>
                      <window.Icon name="link" size={12} />{b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Floating photos — anchored inside the scroll content */}
            {(entry.photos || []).map((p) => (
              <window.FloatBox
                key={p.id} item={p} area={scrollRef}
                selected={selected === p.id}
                onSelect={setSelected} accent={accent}
                onChange={(np) => onChangePhotos(entry.photos.map((x) => x.id === np.id ? np : x))}
                onDelete={(id) => onChangePhotos(entry.photos.filter((x) => x.id !== id))}
              >
                <window.PhotoSlot photo={p} />
              </window.FloatBox>
            ))}

            {/* Floating stickies */}
            {(entry.stickies || []).map((s) => (
              <window.FloatBox
                key={s.id} item={s} area={scrollRef}
                selected={selected === s.id}
                onSelect={setSelected} accent={accent}
                onChange={(ns) => onChangeStickies(entry.stickies.map((x) => x.id === ns.id ? ns : x))}
                onDelete={(id) => onChangeStickies(entry.stickies.filter((x) => x.id !== id))}
              >
                <window.StickySlot sticky={s} />
              </window.FloatBox>
            ))}
            {entry.strokes && entry.strokes.length > 0 && (
              <StrokesLayer strokes={entry.strokes} />
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Read-only canvas that re-renders saved ink strokes ────────────
// Strokes are stored with the canvas dimensions they were drawn on (`w`,`h`).
// We scale uniformly to fit the current paper width, preserving aspect.
function StrokesLayer({ strokes }) {
  const wrapRef   = React.useRef(null);
  const canvasRef = React.useRef(null);

  // Compute the natural height needed at the current width so strokes don't
  // get clipped on narrow viewports.
  const target = (() => {
    const recW = Math.max(...strokes.map((s) => s.w || 800), 800);
    const recH = Math.max(...strokes.map((s) => s.h || 600), 200);
    return { recW, recH };
  })();

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const c    = canvasRef.current;
    if (!wrap || !c) return;
    function paint() {
      const r = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width  = Math.max(1, Math.floor(r.width * dpr));
      c.height = Math.max(1, Math.floor(r.height * dpr));
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      strokes.forEach((s) => {
        const sw    = s.w || target.recW;
        const scale = r.width / sw;
        const baseSize = s.size === 's' ? 1.6 : s.size === 'l' ? 5.0 : 2.8;
        let lw, alpha, op, col;
        switch (s.tool) {
          case 'marker': lw = baseSize * 2.2; alpha = 0.95; op = 'source-over'; col = s.color; break;
          case 'pencil': lw = Math.max(1, baseSize * 0.7); alpha = 0.75; op = 'source-over'; col = s.color; break;
          case 'hi':     lw = baseSize * 6;   alpha = 0.35; op = 'source-over'; col = s.color; break;
          case 'erase':  lw = baseSize * 6;   alpha = 1;    op = 'destination-out'; col = '#000'; break;
          default:       lw = baseSize;       alpha = 1;    op = 'source-over'; col = s.color;
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = op;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw * scale;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        s.pts.forEach((p, i) => {
          const x = p[0] * scale, y = p[1] * scale;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      });
    }
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  // Aspect-correct height for the wrapper, computed from recorded dims.
  const aspect = target.recH / target.recW;

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute', left: 0, right: 0, top: 0,
        // Reserve space sized to recorded aspect so strokes never overflow.
        paddingBottom: `${aspect * 100}%`,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}

function themeName(t) {
  return ({
    dark: 'Blank', notebook: 'Notebook', dotted: 'Dot grid', grid: 'Square grid',
    handwritten: 'Handwritten', parchment: 'Parchment', cream: 'Cream',
  })[t] || t;
}

// Small swatch — visual preview of a paper theme, used in the picker dropdown.
function ThemeSwatch({ theme }) {
  const bg = themeBackground(theme);
  return (
    <span style={{
      display: 'inline-block', width: 26, height: 18, borderRadius: 4,
      background: bg.bg,
      backgroundImage: bg.image,
      backgroundSize: bg.size,
      backgroundPosition: bg.position || '0 0',
      backgroundRepeat: bg.repeat || 'repeat',
      border: '1px solid rgba(255,255,255,0.10)',
      flexShrink: 0,
    }} />
  );
}

function themeBackground(theme) {
  switch (theme) {
    case 'notebook':
      return {
        bg: 'oklch(0.18 0.012 250)',
        // Margin rule (red, vertical) + horizontal rules every 32px (matches body line-height).
        image: 'linear-gradient(to right, rgba(255,90,90,0.30) 0 1px, transparent 1px), repeating-linear-gradient(0deg, transparent 0 31px, rgba(160,200,255,0.22) 31px 32px)',
        size: '100% 100%, 100% 32px',
        // Y-offset for the second layer is tuned so each rule sits right under
        // a text baseline (padding-top 38 + Caveat baseline ≈ 60 from top).
        position: '60px 0, 0 29px',
        repeat: 'no-repeat, repeat',
      };
    case 'dotted':
      return {
        bg: 'oklch(0.16 0.010 250)',
        image: 'radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.4px)',
        size: '18px 18px',
        repeat: 'repeat',
      };
    case 'grid':
      return {
        bg: 'oklch(0.16 0.010 250)',
        image: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
        size: '24px 24px',
        repeat: 'repeat',
      };
    case 'handwritten':
      return {
        bg: 'oklch(0.18 0.012 250)',
        image: 'radial-gradient(circle at 90% 92%, rgba(255,255,255,0.05), transparent 22%), radial-gradient(circle at 8% 12%, rgba(255,255,255,0.04), transparent 18%)',
        size: '100% 100%',
        repeat: 'no-repeat',
      };
    case 'parchment':
      return {
        bg: 'oklch(0.92 0.04 78)',
        image: 'radial-gradient(circle at 50% 50%, rgba(120,85,40,0.04) 0%, rgba(80,55,20,0.18) 100%)',
        size: '100% 100%',
        repeat: 'no-repeat',
      };
    case 'cream':
      return {
        bg: 'oklch(0.96 0.012 78)',
        image: 'none',
        size: '100% 100%',
      };
    default:
      return {
        bg: 'oklch(0.16 0.010 250)',
        image: 'none',
        size: '100% 100%',
      };
  }
}

function Waveform({ count = 24, accent, dark }) {
  const bars = Array.from({ length: count }, (_, i) =>
    0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6))
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 18 }}>
      {bars.map((b, i) => (
        <div key={i} style={{
          width: 2.4, height: `${Math.round(b * 100)}%`,
          borderRadius: 2,
          background: i < count * 0.4 ? accent : (dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
        }} />
      ))}
    </div>
  );
}

function MiniMap({ loc, accent, dark }) {
  return (
    <div style={{
      position: 'absolute', right: 18, bottom: 18,
      width: 152, height: 100, borderRadius: 12, overflow: 'hidden',
      border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
      boxShadow: '0 10px 28px -8px rgba(0,0,0,0.5)',
      background: dark
        ? 'linear-gradient(135deg, oklch(0.22 0.04 250), oklch(0.14 0.02 250))'
        : 'linear-gradient(135deg, oklch(0.88 0.04 250), oklch(0.78 0.04 250))',
    }}>
      {/* Map grid lines */}
      <svg viewBox="0 0 152 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="mm" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke={dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'} strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="152" height="100" fill="url(#mm)"/>
        {/* Stylized road */}
        <path d={`M0 ${20 + loc.lng * 30} Q ${76} ${10 + loc.lng * 50}, 152 ${30 + loc.lat * 40}`}
          stroke={dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d={`M${30 + loc.lng * 80} 0 Q ${40 + loc.lng * 60} 50, ${50 + loc.lat * 80} 100`}
          stroke={dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'} strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* Pin */}
        <circle cx={loc.lng * 152} cy={loc.lat * 100} r="5" fill={accent} />
        <circle cx={loc.lng * 152} cy={loc.lat * 100} r="11" fill={accent} opacity="0.25" />
      </svg>
      <div style={{
        position: 'absolute', left: 8, bottom: 6, right: 8,
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>◉ {loc.name}</div>
    </div>
  );
}

Object.assign(window, { EntryView });
})();
