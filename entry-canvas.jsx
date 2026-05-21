/* global window, React */
// ─── Movable / resizable photos + stickies + ink draw canvas ───────
// Coords stored as percentages so the page survives any scale.
(() => {
const { useState, useRef, useEffect, useCallback } = React;

// Generic draggable + resizable box. Returns wrapper with controls
// shown only when `selected`.
function FloatBox({ item, area, onChange, onSelect, selected, accent, children, onDelete }) {
  const ref = useRef(null);

  const startDrag = (e) => {
    e.stopPropagation();
    onSelect && onSelect(item.id);
    const el = area.current;
    // Measure against the scrollable content's full dimensions, not just the
    // visible viewport — so percentages anchor the item to the page, not the
    // scroll position.
    const W = el.clientWidth;
    const H = el.scrollHeight;
    const rect = el.getBoundingClientRect();
    const pxPerUnitX = W / 100;
    const pxPerUnitY = H / 100;
    const start = { x: e.clientX, y: e.clientY, ix: item.x, iy: item.y };
    const move = (ev) => {
      const dx = (ev.clientX - start.x) / pxPerUnitX;
      const dy = (ev.clientY - start.y) / pxPerUnitY;
      onChange({ ...item,
        x: Math.max(0, Math.min(100 - item.w, start.ix + dx)),
        y: Math.max(0, Math.min(100 - item.h, start.iy + dy)),
      });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResize = (e) => {
    e.stopPropagation();
    const el = area.current;
    const W = el.clientWidth;
    const H = el.scrollHeight;
    const pxPerUnitX = W / 100;
    const pxPerUnitY = H / 100;
    const start = { x: e.clientX, y: e.clientY, iw: item.w, ih: item.h };
    const move = (ev) => {
      const dx = (ev.clientX - start.x) / pxPerUnitX;
      const dy = (ev.clientY - start.y) / pxPerUnitY;
      onChange({ ...item,
        w: Math.max(10, Math.min(100 - item.x, start.iw + dx)),
        h: Math.max(3,  Math.min(100 - item.y, start.ih + dy)),
      });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      ref={ref}
      onPointerDown={startDrag}
      className={`floatbox ${selected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${item.x}%`, top: `${item.y}%`,
        width: `${item.w}%`, height: `${item.h}%`,
        touchAction: 'none',
        outline: selected ? `1.5px solid ${accent}` : 'none',
        outlineOffset: '3px',
        cursor: 'grab',
      }}
    >
      {children}
      {selected && (
        <>
          <button
            className="floatbox-delete"
            onPointerDown={(e) => { e.stopPropagation(); onDelete && onDelete(item.id); }}
            style={{
              position: 'absolute', top: -10, right: -10, width: 22, height: 22,
              borderRadius: 999, background: 'rgba(15,15,18,0.92)',
              border: `1px solid ${accent}`, color: '#fff', display: 'grid',
              placeItems: 'center', cursor: 'pointer', padding: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
          <div
            onPointerDown={startResize}
            style={{
              position: 'absolute', right: -8, bottom: -8, width: 16, height: 16,
              borderRadius: 4, background: accent, cursor: 'nwse-resize',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          />
        </>
      )}
    </div>
  );
}

// Photo placeholder — diagonal-stripe block w/ caption
function PhotoSlot({ photo }) {
  const hue = photo.hue || 200;
  // Real photo: data URL or remote URL via photo.src — render <img>.
  // Falls back to the design's striped placeholder when no src is set.
  if (photo.src) {
    return (
      <div style={{
        width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 12px 30px -10px rgba(0,0,0,0.6)',
        position: 'relative',
        background: '#000',
      }}>
        <img
          src={photo.src}
          alt={photo.label || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
          draggable={false}
        />
        {photo.label && (
          <div style={{
            position: 'absolute', left: 10, bottom: 10,
            fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.92)',
            padding: '4px 8px', borderRadius: 6,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            maxWidth: 'calc(100% - 20px)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {photo.label}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden',
      background: `repeating-linear-gradient(45deg, oklch(0.32 0.06 ${hue} / 0.55) 0 10px, oklch(0.24 0.05 ${hue} / 0.55) 10px 20px)`,
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 12px 30px -10px rgba(0,0,0,0.6)',
      position: 'relative',
      display: 'flex', alignItems: 'flex-end', padding: 10,
    }}>
      <div style={{
        fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.85)',
        padding: '4px 8px', borderRadius: 6,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
      }}>
        ▢ {photo.label}
      </div>
    </div>
  );
}

function StickySlot({ sticky }) {
  const h = sticky.hue;
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `oklch(0.80 0.14 ${h})`,
      color: `oklch(0.22 0.08 ${h})`,
      padding: '12px 14px',
      fontFamily: '"Caveat", "Segoe Script", cursive',
      fontSize: 17, lineHeight: 1.2,
      boxShadow: '0 14px 32px -12px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.4) inset',
      transform: `rotate(${(sticky.id.charCodeAt(0) % 6 - 3) * 0.6}deg)`,
      borderRadius: 4,
    }}>
      {sticky.text}
    </div>
  );
}

// ─── Ink draw canvas (pen / highlight / erase) ─────────────────────
function InkCanvas({ accent, paused, dark = true }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState(dark ? '#e9e6df' : '#202024');
  const [size, setSize] = useState(2.2);
  const [strokes, setStrokes] = useState(() => seedStrokes());
  const drawing = useRef(null);

  function seedStrokes() {
    // Pre-drawn handwritten sample showing off the page
    const base = dark ? '#e9e6df' : '#222';
    const hi   = `oklch(0.78 0.16 50 / 0.4)`;
    return [
      { tool: 'pen',  color: base, size: 2.6, pts: [[40,40],[55,38],[72,45],[88,40],[105,46],[125,38],[150,42]] },
      { tool: 'pen',  color: base, size: 2.2, pts: [[40,80],[58,76],[80,82],[100,78],[125,84],[145,80],[170,86],[195,82]] },
      { tool: 'pen',  color: base, size: 2.2, pts: [[40,120],[60,115],[82,120],[100,118],[122,124],[140,120]] },
      { tool: 'hi',   color: hi,   size: 14,  pts: [[38,118],[145,122]] },
      { tool: 'pen',  color: base, size: 2.2, pts: [[40,165],[60,160],[80,168],[100,165],[120,170]] },
    ];
  }

  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const { width, height } = c;
    ctx.clearRect(0, 0, width, height);
    strokes.forEach((s) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = s.tool === 'erase' ? 'destination-out' : 'source-over';
      ctx.beginPath();
      s.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width * window.devicePixelRatio;
      c.height = r.height * window.devicePixelRatio;
      c.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
      c.width = r.width; c.height = r.height;
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => ro.disconnect();
  }, [draw]);

  const start = (e) => {
    if (paused) return;
    const r = canvasRef.current.getBoundingClientRect();
    const pt = [e.clientX - r.left, e.clientY - r.top];
    const next = {
      tool,
      color: tool === 'hi' ? `${color === '#202024' ? '#1a1a1a' : color}33` : color,
      size: tool === 'hi' ? 14 : tool === 'erase' ? 18 : size,
      pts: [pt],
    };
    drawing.current = next;
    setStrokes((s) => [...s, next]);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    drawing.current.pts.push([e.clientX - r.left, e.clientY - r.top]);
    setStrokes((s) => s.slice());
  };
  const end = () => { drawing.current = null; };

  const tools = [
    { id: 'pen', icon: 'pen', label: 'Pen' },
    { id: 'hi',  icon: 'highlight', label: 'Highlight' },
    { id: 'erase', icon: 'eraser', label: 'Erase' },
  ];
  const colors = dark
    ? ['#e9e6df', '#9be4b3', '#9fcfff', '#ffd479', '#ff9fb5']
    : ['#202024', '#1f7a4a', '#1f5fa8', '#a76a16', '#a8326b'];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
        style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
      />
      {/* Floating ink toolbar */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)',
        display: 'flex', gap: 6, padding: 6,
        borderRadius: 999,
        background: dark ? 'rgba(18,18,22,0.78)' : 'rgba(255,253,247,0.85)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
        boxShadow: '0 10px 30px -8px rgba(0,0,0,0.5)',
      }}>
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={t.label}
            style={{
              width: 34, height: 34, borderRadius: 999, border: 'none', padding: 0,
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              background: tool === t.id ? accent : 'transparent',
              color: tool === t.id ? '#0a0a0c' : (dark ? '#e9e6df' : '#202024'),
            }}
          >
            <window.Icon name={t.icon} size={16} />
          </button>
        ))}
        <div style={{ width: 1, alignSelf: 'stretch', background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)', margin: '4px 4px' }} />
        {colors.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={c}
            style={{
              width: 26, height: 26, borderRadius: 999, border: color === c ? `2px solid ${accent}` : `1px solid ${dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`,
              background: c, padding: 0, cursor: 'pointer',
            }}
          />
        ))}
        <div style={{ width: 1, alignSelf: 'stretch', background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)', margin: '4px 4px' }} />
        <button onClick={() => setStrokes([])}
          style={{
            height: 34, padding: '0 12px', borderRadius: 999, border: 'none',
            fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase',
            background: 'transparent', color: dark ? '#e9e6df' : '#202024', cursor: 'pointer',
          }}>Clear</button>
      </div>
    </div>
  );
}

Object.assign(window, { FloatBox, PhotoSlot, StickySlot, InkCanvas });
})();
