/* global window, React */
// ─── 3D-tilted location map ────────────────────────────────────────
// Aggregates every entry across journals by location.name, shows pins
// with counts on a tilted grid floor. Pure CSS perspective + SVG.
(() => {

function MapOverlay({ close, accent, openEntry, sections }) {
  const [hoverPin, setHoverPin] = React.useState(null);

  // Collect & cluster locations across the section tree
  const pins = React.useMemo(() => {
    const byName = new Map();
    const walk = (nodes, trail, rootSection) => {
      for (const n of nodes) {
        const root = rootSection || n;
        if (n.entries) {
          n.entries.forEach((e) => {
            if (!e.location) return;
            const k = e.location.name;
            const cluster = byName.get(k) || { name: e.location.name, lat: e.location.lat, lng: e.location.lng, entries: [] };
            // Build a label "Section · Child" if drilled
            let parts = [root.name];
            for (let i = 1; i < trail.length; i++) parts.push(trail[i].name);
            parts.push(n === root ? null : n.name);
            const sub = parts.filter(Boolean).slice(-2).join(' · ');
            cluster.entries.push({
              entry: e, path: [...trail.map((x) => x.id), n.id],
              sub, hue: root.hue,
            });
            byName.set(k, cluster);
          });
        }
        if (n.children) walk(n.children, [...trail, n], root);
      }
    };
    walk(sections, [], null);
    return Array.from(byName.values());
  }, [sections]);

  return (
    <div className="map-overlay" onClick={close}>
      <button className="overlay-close map-close" onClick={close} aria-label="Close map">
        <window.Icon name="x" size={18} />
      </button>

      <div className="map-header">
        <div className="map-title">Journal Map</div>
        <div className="map-sub">{pins.length} locations · {pins.reduce((s, p) => s + p.entries.length, 0)} entries</div>
      </div>

      <div className="map-scene" onClick={(e) => e.stopPropagation()}>
        {/* Tilted floor (3D perspective) */}
        <div className="map-floor">
          <div className="map-grid" />
          {/* Terrain-ish roads, drawn on the floor SVG */}
          <svg className="map-roads" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <linearGradient id="roadGrad" x1="0" x2="1">
                <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="0.5" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="1" stopColor="rgba(255,255,255,0.10)" />
              </linearGradient>
            </defs>
            <path d="M 0 380 Q 280 320, 520 440 T 1000 480" stroke="url(#roadGrad)" strokeWidth="3" fill="none" />
            <path d="M 0 620 Q 320 700, 560 600 T 1000 660" stroke="url(#roadGrad)" strokeWidth="2.5" fill="none" />
            <path d="M 240 0 Q 320 240, 280 520 T 220 1000" stroke="url(#roadGrad)" strokeWidth="2" fill="none" />
            <path d="M 720 0 Q 660 260, 740 540 T 700 1000" stroke="url(#roadGrad)" strokeWidth="2" fill="none" />
            {/* Subtle building footprints */}
            {Array.from({ length: 18 }, (_, i) => {
              const x = (i * 113) % 920 + 30;
              const y = (i * 271) % 920 + 30;
              const w = 35 + (i * 13) % 50;
              const h = 35 + (i * 17) % 50;
              return <rect key={i} x={x} y={y} width={w} height={h} rx="3"
                fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" />;
            })}
          </svg>
        </div>

        {/* Pins float above the floor */}
        <div className="map-pins">
          {pins.map((p) => (
            <Pin key={p.name} pin={p} accent={accent} hover={hoverPin === p.name}
              onHover={(h) => setHoverPin(h ? p.name : null)}
              openEntry={openEntry} />
          ))}
        </div>

        {/* Compass + scale */}
        <div className="map-compass">
          <svg width="46" height="46" viewBox="0 0 46 46">
            <circle cx="23" cy="23" r="20" fill="rgba(15,15,18,0.65)" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
            <path d="M 23 6 L 27 23 L 23 21 L 19 23 Z" fill={accent} />
            <path d="M 23 40 L 19 23 L 23 25 L 27 23 Z" fill="rgba(255,255,255,0.45)" />
            <text x="23" y="13" textAnchor="middle" fill="#fff" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="600">N</text>
          </svg>
        </div>
        <div className="map-scale">
          <div className="map-scale-bar" />
          <div className="map-scale-label">~ 500 m</div>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend" onClick={(e) => e.stopPropagation()}>
        <div className="map-legend-label">Pins by section</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {sections.map((j) => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: `oklch(0.78 0.16 ${j.hue})` }} />
              {j.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual 3D pin
function Pin({ pin, accent, hover, onHover, openEntry }) {
  // Aggregate dominant journal for color
  const journalHue = pin.entries[0].hue;
  // Mix: if multi-journal, use accent
  const allSame = pin.entries.every((e) => e.hue === journalHue);
  const color = allSame ? `oklch(0.78 0.16 ${journalHue})` : accent;
  const count = pin.entries.length;
  // Translate lat/lng (0..1) into floor coords. Add a little pseudo-z for stacking.
  const left = `${pin.lng * 100}%`;
  const top = `${pin.lat * 100}%`;

  return (
    <div
      className={`pin-stack ${hover ? 'pin-hover' : ''}`}
      style={{ left, top }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Shadow on floor */}
      <div className="pin-shadow" />
      {/* Stem */}
      <div className="pin-stem" style={{ background: `linear-gradient(180deg, ${color}, transparent)` }} />
      {/* Head */}
      <div className="pin-head" style={{ background: color, boxShadow: `0 0 18px ${color}, 0 4px 12px rgba(0,0,0,0.55)` }}>
        <span>{count}</span>
      </div>
      {/* Hover card */}
      {hover && (
        <div className="pin-card">
          <div className="pin-card-name"><window.Icon name="map" size={12} />{pin.name}</div>
          <div className="pin-card-count">{count} {count === 1 ? 'entry' : 'entries'}</div>
          <div className="pin-card-list">
            {pin.entries.slice(0, 5).map(({ entry, sub, path, hue }) => (
              <button key={entry.id} className="pin-card-row"
                onClick={(e) => { e.stopPropagation(); openEntry({ path, entryId: entry.id }); }}>
                <span className="pin-card-tag" style={{ '--course-hue': hue }}>{sub}</span>
                <span className="pin-card-title">{entry.title}</span>
                <span className="pin-card-date">{window.relDate(entry.date)}</span>
              </button>
            ))}
            {pin.entries.length > 5 && <div className="pin-card-more">+{pin.entries.length - 5} more</div>}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MapOverlay });
})();
