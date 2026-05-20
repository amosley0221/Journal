/* global window, React */
// ─── Main JournalApp shell — generalized section tree ─────────────
(() => {
const { useState, useMemo, useEffect } = React;

// ─── Section icon library ─────────────────────────────────────────
// Each entry pairs a glyph (emoji renders cleanly at small sizes on every
// platform) with keywords that trigger auto-suggestion as the user types a
// section name. Users can override the suggestion with the picker.
const ICON_LIBRARY = [
  { glyph: '🎓', keys: ['school','college','university','class','study','grad','gtcc','academic','edu','semester','course'] },
  { glyph: '📚', keys: ['book','read','library','literature','novel'] },
  { glyph: '💼', keys: ['work','job','office','career','business','company'] },
  { glyph: '✈️', keys: ['travel','trip','vacation','journey','flight','airport'] },
  { glyph: '❤️', keys: ['life','personal','daily','love','heart'] },
  { glyph: '🌙', keys: ['dream','sleep','night','moon'] },
  { glyph: '🏃', keys: ['fitness','run','gym','workout','exercise','sport','training'] },
  { glyph: '🍳', keys: ['food','cook','recipe','meal','kitchen','baking'] },
  { glyph: '🎵', keys: ['music','song','audio','playlist','band'] },
  { glyph: '🎨', keys: ['art','draw','paint','design','sketch'] },
  { glyph: '💸', keys: ['finance','money','budget','expense','spending','bills'] },
  { glyph: '🐾', keys: ['pet','dog','cat','animal'] },
  { glyph: '🎯', keys: ['goal','target','plan','okr'] },
  { glyph: '📷', keys: ['photo','picture','image','camera','shoot'] },
  { glyph: '🎬', keys: ['movie','film','video','tv','show','cinema'] },
  { glyph: '🎮', keys: ['game','gaming','play','console'] },
  { glyph: '🧠', keys: ['idea','brainstorm','think','thought','mind'] },
  { glyph: '🌍', keys: ['nature','outdoor','earth','world','environment'] },
  { glyph: '🏠', keys: ['home','house','household'] },
  { glyph: '🩺', keys: ['health','doctor','medical','wellness','clinic'] },
  { glyph: '💭', keys: ['journal','note','memory','reflect','diary'] },
  { glyph: '🌱', keys: ['growth','progress','habit','sprout','plant'] },
  { glyph: '📅', keys: ['calendar','schedule','date','event','planner'] },
  { glyph: '⭐', keys: ['favorite','star','best','top'] },
  { glyph: '☕', keys: ['coffee','cafe','tea','drink'] },
  { glyph: '🛠️', keys: ['project','build','diy','hack'] },
  { glyph: '🧘', keys: ['meditation','mindful','calm','yoga'] },
  { glyph: '✦', keys: [] },
  { glyph: '◆', keys: [] },
  { glyph: '◉', keys: [] },
  { glyph: '☾', keys: [] },
];

function suggestIcon(name) {
  const n = (name || '').toLowerCase().trim();
  if (!n) return '✦';
  for (const { glyph, keys } of ICON_LIBRARY) {
    if (keys.some((k) => n.includes(k))) return glyph;
  }
  return n.charAt(0).toUpperCase();
}

// Popover icon picker — anchors to whatever the caller passes via `anchor` prop.
function IconPicker({ value, onPick, onClose }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return (
    <div ref={ref} className="icon-picker">
      <div className="icon-picker-label">Pick an icon</div>
      <div className="icon-picker-grid">
        {ICON_LIBRARY.map((it) => (
          <button
            key={it.glyph}
            type="button"
            className={`icon-picker-chip ${value === it.glyph ? 'is-active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); onPick(it.glyph); }}
            title={it.keys[0] || ''}
          >
            <span>{it.glyph}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Walk the section tree to find a path matching `pathIds` (array of ids)
// going from root to leaf. Returns { node, parents } or null.
function findPath(sections, pathIds) {
  if (!pathIds || pathIds.length === 0) return null;
  let layer = sections, parents = [], node = null;
  for (const id of pathIds) {
    const found = layer.find((n) => n.id === id);
    if (!found) return null;
    if (node) parents.push(node);
    node = found;
    layer = node.children || [];
  }
  return { node, parents, leafLayer: layer };
}

// Find the section that contains a path
function rootSection(sections, sectionId) {
  return sections.find((s) => s.id === sectionId) || null;
}

// Get the deepest "leaf-with-entries" along a path, picking the first child
// at each ambiguous level. Used when entering a section to pre-select.
function defaultPath(section) {
  const path = [section.id];
  let cur = section;
  while (cur.children && cur.children.length > 0) {
    cur = cur.children[0];
    path.push(cur.id);
  }
  return path;
}

// Flatten all entries across the entire tree with breadcrumb context
function allEntries(sections) {
  const out = [];
  const walk = (nodes, trail) => {
    for (const n of nodes) {
      const t = [...trail, n];
      if (n.children && n.children.length) walk(n.children, t);
      if (n.entries) {
        n.entries.forEach((e) => out.push({
          entry: e,
          path: t.map((x) => x.id),
          breadcrumb: t.map((x) => x.name),
          section: trail[0] || n, // top-most section (the one in the slider)
          // First trail node is the section; we lose it when trail is empty (top-level entries)
          journalSection: t[0],
        }));
      }
    }
  };
  walk(nodes(sections), []);
  function nodes(s) { return s; }
  return out;
}

function JournalApp({ skin, layout = 'mobile', session }) {
  // Synced state — comes from Supabase via useSyncedJournal. Each setter mirrors
  // useState's API so the rest of the component is unchanged.
  const sync = window.useSyncedJournal(session);
  const sections = sync.data.sections;
  const setSections = sync.setSections;
  const appTheme = sync.data.appTheme;
  const setAppTheme = sync.setAppTheme;
  const accentOverride = sync.data.accentOverride;
  const setAccentOverride = sync.setAccentOverride;
  const photoState = sync.data.photoState;
  const setPhotoState = sync.setPhotoState;
  const stickyState = sync.data.stickyState;
  const setStickyState = sync.setStickyState;
  const themeState = sync.data.themeState;
  const setThemeState = sync.setThemeState;
  const displayName = sync.data.displayName || '';
  const setDisplayName = sync.setDisplayName;

  // Local-only UI state (intentionally per-device, not synced)
  const [path, setPath] = useState(['home']);  // ['home'] or [sectionId, childId?, ...]
  const [entryId, setEntryId] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [unlocked, setUnlocked] = useState({});
  const [phoneShow, setPhoneShow] = useState('rail');

  const accent = (accentOverride && accentOverride.accent) || skin.accent;
  const accentSoft = (accentOverride && accentOverride.accentSoft) || skin.accentSoft;

  // Auto-select the first available entry when path changes
  useEffect(() => {
    if (path[0] === 'home') return;
    const root = sections.find((s) => s.id === path[0]);
    if (!root) { setPath(['home']); return; }
    const expanded = defaultPath(root);
    // If user has only partially navigated, extend; if user navigated deeper than tree,
    // truncate to the actual leaf.
    let chosen = expanded;
    if (path.length > 1) {
      // user is intentionally at a deeper level — honor that path if it's valid
      const sub = findPath(sections, path);
      if (sub) chosen = path; else chosen = expanded;
    }
    if (chosen.join('/') !== path.join('/')) setPath(chosen);
    // Select the first entry in the leaf
    const lp = findPath(sections, chosen);
    const leafEntries = (lp && lp.node && lp.node.entries) || [];
    if (leafEntries[0]) setEntryId(leafEntries[0].id);
    else setEntryId(null);
    // eslint-disable-next-line
  }, [path[0], sections]);

  // Currently-resolved leaf node + entries
  const { entries, entry, currentPath } = useMemo(() => {
    if (path[0] === 'home') return { entries: [], entry: null, currentPath: null };
    const lp = findPath(sections, path);
    if (!lp) return { entries: [], entry: null, currentPath: null };
    const leafEntries = lp.node.entries || [];
    const e = leafEntries.find((x) => x.id === entryId) || leafEntries[0] || null;
    return { entries: leafEntries, entry: e, currentPath: lp };
  }, [sections, path, entryId]);

  const entryKey = path.join('/') + ':' + (entry ? entry.id : '');
  const entryWithEdits = useMemo(() => {
    if (!entry) return null;
    return {
      ...entry,
      photos: photoState[entryKey] || entry.photos,
      stickies: stickyState[entryKey] || entry.stickies,
      theme: themeState[entryKey] || entry.theme || 'dark',
    };
  }, [entry, photoState, stickyState, themeState, entryKey]);

  const onChangePhotos = (next) => setPhotoState((s) => ({ ...s, [entryKey]: next }));
  const onChangeStickies = (next) => setStickyState((s) => ({ ...s, [entryKey]: next }));
  const onChangeTheme = (themeId) => setThemeState((s) => ({ ...s, [entryKey]: themeId }));

  const selectSection = (id) => {
    setPhoneShow('rail');
    if (id === 'home') { setPath(['home']); setEntryId(null); return; }
    const root = sections.find((s) => s.id === id);
    if (!root) return;
    setPath(defaultPath(root));
  };

  // Drill into a child node at index in the tree.
  // `childPath` = full path from root (e.g. ['school', 'sp26', 'cis110']).
  const drillTo = (newPath) => {
    setPath(newPath);
    const lp = findPath(sections, newPath);
    const first = lp && lp.node && lp.node.entries && lp.node.entries[0];
    setEntryId(first ? first.id : null);
    setPhoneShow('rail');
  };

  // Step up the path one level. Returns to root section view at depth 1.
  const stepUp = () => {
    if (path.length <= 1) return;
    setPath(path.slice(0, -1));
  };

  const selectEntry = (e) => {
    if (e.locked && !unlocked[e.id]) {
      setOverlay({ type: 'lock', entry: e, mode: 'keypad' });
      return;
    }
    setEntryId(e.id);
    if (layout === 'phone') setPhoneShow('detail');
  };

  // Swipe between top-level sections
  const swipeStart = React.useRef(null);
  const swipeHandlers = {
    onPointerDown: (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      swipeStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    },
    onPointerUp: (e) => {
      if (!swipeStart.current) return;
      const dx = e.clientX - swipeStart.current.x;
      const dy = e.clientY - swipeStart.current.y;
      const dt = Date.now() - swipeStart.current.t;
      swipeStart.current = null;
      if (Math.abs(dx) > 90 && Math.abs(dy) < 60 && dt < 700) {
        const order = ['home', ...sections.map((s) => s.id)];
        const i = order.indexOf(path[0]);
        const next = dx < 0 ? order[Math.min(i + 1, order.length - 1)] : order[Math.max(i - 1, 0)];
        if (next && next !== path[0]) selectSection(next);
      }
    },
  };

  if (!sync.loaded) {
    return (
      <div
        className={`app skin-${skin.id} app-${appTheme} layout-${layout}`}
        style={{
          position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
          color: '#e9e6df',
          '--accent': accent, '--accent-soft': accentSoft,
          fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
          display: 'grid', placeItems: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {React.createElement(skin.background, { theme: appTheme })}
        </div>
        <div style={{ position: 'relative', zIndex: 1, opacity: 0.7, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Syncing…
        </div>
      </div>
    );
  }

  const body = (
    <BodyRouter
      path={path} sections={sections} drillTo={drillTo} stepUp={stepUp}
      entries={entries} entry={entryWithEdits} entryId={entryId} selectEntry={selectEntry}
      onChangePhotos={onChangePhotos} onChangeStickies={onChangeStickies} onChangeTheme={onChangeTheme}
      accent={accent} skin={skin} appTheme={appTheme} layout={layout}
      phoneShow={phoneShow} setPhoneShow={setPhoneShow}
      openCompose={() => setOverlay('compose')}
      onSelectSection={selectSection}
      displayName={displayName}
    />
  );

  return (
    <div
      className={`app skin-${skin.id} app-${appTheme} layout-${layout}`}
      style={{
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
        color: appTheme === 'dark' ? '#e9e6df' : '#1a1a1c',
        '--accent': accent, '--accent-soft': accentSoft,
        fontFamily: '"Inter Tight", "Inter", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {React.createElement(skin.background, { theme: appTheme })}
      </div>

      {layout === 'desktop' ? (
        <DesktopShell
          path={path} setSection={selectSection} sections={sections}
          openSettings={() => setOverlay('settings')}
          openCompose={() => setOverlay('compose')}
          openMap={() => setOverlay('map')}
          accent={accent} appTheme={appTheme} setAppTheme={setAppTheme}
          body={body}
        />
      ) : (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="statusbar">
            <span className="statusbar-time">9:41</span>
            <div className="statusbar-pill" />
            <span className="statusbar-right">
              <span style={{ letterSpacing: '0.06em' }}>5G</span>
              <Battery />
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 22px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wordmark accent={accent} />
              <span className="wordmark-text">Journal<span style={{ color: accent }}>+</span></span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="icon-btn glass"><window.Icon name="search" size={16} /></button>
              <button className="icon-btn glass" onClick={() => setOverlay('map')} title="Journal map">
                <window.Icon name="map" size={16} />
              </button>
              <button className="icon-btn glass" onClick={() => setOverlay('settings')}>
                <window.Icon name="settings" size={16} />
              </button>
            </div>
          </div>
          <Slider currentId={path[0]} setSection={selectSection} sections={sections} />
          <div
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
            {...swipeHandlers}
          >
            {body}
          </div>
          <button
            className="compose-fab"
            style={{ background: accent }}
            onClick={() => setOverlay('compose')}
            aria-label="New entry"
          >
            <window.Icon name="plus" size={22} />
          </button>
        </div>
      )}

      {/* Overlays */}
      {overlay === 'settings' && (
        <SettingsOverlay
          close={() => setOverlay(null)} accent={accent} skin={skin}
          appTheme={appTheme} setAppTheme={setAppTheme}
          sections={sections} setSections={setSections}
          accentOverride={accentOverride} setAccentOverride={setAccentOverride}
          session={session} syncStatus={sync.syncStatus}
          displayName={displayName} setDisplayName={setDisplayName}
        />
      )}
      {overlay === 'compose' && (
        <FullCompose
          close={() => setOverlay(null)}
          accent={accent} skin={skin} appTheme={appTheme}
          sections={sections} setSections={setSections}
          currentPath={path[0] === 'home' ? null : path}
          layout={layout}
        />
      )}
      {overlay === 'map' && (
        <window.MapOverlay
          close={() => setOverlay(null)} accent={accent}
          sections={sections}
          openEntry={({ path: p, entryId: eid }) => {
            setPath(p); setEntryId(eid); setOverlay(null);
            if (layout === 'phone') setPhoneShow('detail');
          }}
        />
      )}
      {overlay && overlay.type === 'lock' && (
        <LockOverlay
          entry={overlay.entry} mode={overlay.mode}
          setMode={(mode) => setOverlay({ ...overlay, mode })}
          close={() => setOverlay(null)}
          onUnlock={() => { setUnlocked((u) => ({ ...u, [overlay.entry.id]: true })); setEntryId(overlay.entry.id); setOverlay(null); if (layout === 'phone') setPhoneShow('detail'); }}
          accent={accent} skin={skin}
        />
      )}
    </div>
  );
}

function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

// ─── Slider (Apple-glass capsule, no add/edit buttons) ──────────────
function Slider({ currentId, setSection, sections }) {
  const items = [{ id: 'home', name: 'Home', glyph: '⌂' }, ...sections];
  return (
    <div className="slider-wrap">
      <div className="slider">
        {items.map((s) => {
          const active = s.id === currentId;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`slider-item ${active ? 'slider-item-active' : ''}`}>
              <span className="slider-glyph">{s.glyph}</span>
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Wordmark({ accent }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <rect x="2.5" y="2.5" width="17" height="17" rx="4.5" fill="none" stroke={accent} strokeWidth="1.6" />
      <path d="M6 11h10M6 7h7M6 15h6" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Battery() {
  return (
    <svg width="22" height="11" viewBox="0 0 26 12">
      <rect x="0.5" y="0.5" width="22" height="11" rx="2.6" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
      <rect x="2" y="2" width="16" height="8" rx="1.4" fill="currentColor" />
      <rect x="23.4" y="3.6" width="2" height="4.8" rx="0.6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// ─── Body router: home, depth-1 (section), depth-2 (child), depth-3 (grand) ─
function BodyRouter(p) {
  if (p.path[0] === 'home') {
    return <HomeBody accent={p.accent} sections={p.sections} onSelectSection={p.onSelectSection}
      openEntry={({ path: pp, entryId: eid }) => { p.drillTo(pp); setTimeout(() => p.selectEntry({ id: eid }), 0); }}
      onCompose={p.openCompose} layout={p.layout} displayName={p.displayName} />;
  }
  const root = p.sections.find((s) => s.id === p.path[0]);
  if (!root) return null;
  return (
    <SectionView
      root={root} path={p.path}
      drillTo={p.drillTo} stepUp={p.stepUp}
      entries={p.entries} entry={p.entry} entryId={p.entryId} selectEntry={p.selectEntry}
      onChangePhotos={p.onChangePhotos} onChangeStickies={p.onChangeStickies} onChangeTheme={p.onChangeTheme}
      accent={p.accent} skin={p.skin} appTheme={p.appTheme} layout={p.layout}
      phoneShow={p.phoneShow} setPhoneShow={p.setPhoneShow}
    />
  );
}

// SectionView handles arbitrary tree depth.
// - depth 1: section, may have direct entries OR children
// - depth N: drilled into a child; same rules apply
function SectionView({ root, path, drillTo, stepUp, entries, entry, entryId, selectEntry,
  onChangePhotos, onChangeStickies, onChangeTheme, accent, skin, appTheme, layout, phoneShow, setPhoneShow }) {

  // Walk down the path to identify current node + its parent chain
  let cur = root, chain = [root];
  for (let i = 1; i < path.length; i++) {
    const next = (cur.children || []).find((c) => c.id === path[i]);
    if (!next) break;
    cur = next; chain.push(next);
  }

  // Children layer at the current depth (the things selectable at this level).
  // We render a pill row of children if `cur.children` exists; if a child is
  // selected, its further children render as a grid below. Entries render
  // in the split view when no further children exist on the selected child.

  // Two-level structure for the demo: a section may have children (level A
  // pills) → and each child may have children (level B cards) → leaves have
  // entries. If a section has only entries, just show the split view.

  // Determine the "level A" (subsection) and "level B" (group) nodes
  const subA = root.children || null;
  const selectedA = path.length > 1 ? chain[1] : (subA && subA[0]);
  const subB = selectedA && selectedA.children;
  const selectedB = path.length > 2 ? chain[2] : null;
  // The leaf-with-entries node:
  const leaf = selectedB || (selectedA && !subB ? selectedA : (subA ? null : root));

  return (
    <>
      {subA && (
        <div className="sub-row">
          <div className="sub-pills">
            {subA.map((s) => (
              <button key={s.id}
                onClick={() => drillTo([root.id, s.id])}
                className={`sub-pill ${selectedA && s.id === selectedA.id ? 'sub-pill-active' : ''}`}>
                {s.name}
                {s.meta && <span style={{ opacity: 0.55, fontSize: 11, marginLeft: 6, fontFamily: 'ui-monospace, Menlo, monospace' }}>{s.meta}</span>}
              </button>
            ))}
          </div>
          {selectedB && (
            <button className="crumb-back" onClick={() => drillTo([root.id, selectedA.id])}>
              <window.Icon name="back" size={13} />
              <span>All {selectedA.name.toLowerCase()} items</span>
            </button>
          )}
        </div>
      )}

      {subB && !selectedB ? (
        <ChildGrid items={subB} onPick={(c) => drillTo([root.id, selectedA.id, c.id])} accent={accent} />
      ) : (
        leaf && (
          <SplitView
            entries={leaf.entries || []}
            entry={entry}
            entryId={entryId}
            selectEntry={selectEntry}
            accent={accent} skin={skin} appTheme={appTheme} layout={layout}
            phoneShow={phoneShow} setPhoneShow={setPhoneShow}
            onChangePhotos={onChangePhotos} onChangeStickies={onChangeStickies} onChangeTheme={onChangeTheme}
          />
        )
      )}
    </>
  );
}

function ChildGrid({ items, onPick, accent }) {
  return (
    <div style={{ padding: '4px 22px 14px', overflow: 'auto', flex: 1 }}>
      <div style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
        opacity: 0.55, padding: '8px 4px',
      }}>{items.length} items</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {items.map((c, i) => (
          <button key={c.id} onClick={() => onPick(c)} className="course-card"
            style={{ '--course-hue': c.color || (i * 47) % 360 }}>
            <div className="course-card-spine" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              {c.code && <div className="course-card-code">{c.code}</div>}
              <div className="course-card-name">{c.name}</div>
              {c.meta && <div className="course-card-meta">{c.meta}</div>}
            </div>
            <div className="course-card-count">{(c.entries || []).length}<span>entries</span></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── HomeBody (greeting, continue, recent, stats) ──────────────────
function HomeBody({ accent, sections, onSelectSection, openEntry, layout, displayName }) {
  const all = useMemo(() => {
    const out = [];
    const walk = (nodes, trail, rootSection) => {
      for (const n of nodes) {
        const r = rootSection || n;
        if (n.entries) n.entries.forEach((e) => out.push({
          entry: e,
          path: [...trail, n.id],
          section: r,
          breadcrumb: trail.length === 0 ? r.name : [...trail.slice(1).map(() => null), n.name].filter(Boolean).slice(-2).join(' · ') || r.name,
        }));
        if (n.children) walk(n.children, [...trail, n.id], r);
      }
    };
    walk(sections, [], null);
    out.sort((a, b) => b.entry.date.localeCompare(a.entry.date) || (b.entry.time || '').localeCompare(a.entry.time || ''));
    return out;
  }, [sections]);

  const featured = all[0];
  const recent = all.slice(1, layout === 'desktop' ? 7 : 5);

  const weekCount = all.filter(({ entry: e }) => {
    const d = new Date(e.date + 'T00:00:00');
    const today = new Date('2026-05-20T00:00:00');
    return (today - d) < 7 * 24 * 3600 * 1000;
  }).length;
  const totalPhotos = all.reduce((s, { entry: e }) => s + (e.photos ? e.photos.length : 0), 0);
  const totalVoice = all.reduce((s, { entry: e }) => s + (e.voice ? e.voice.length : 0), 0);
  const totalLocked = all.filter(({ entry: e }) => e.locked).length;

  // Subtitle for a card: section name + child name if drilled
  const subTitle = (item) => {
    const s = item.section;
    if (item.path.length <= 1) return s.name;
    // Walk to find parent's name
    let cur = s, parts = [s.name];
    for (let i = 1; i < item.path.length; i++) {
      cur = (cur.children || []).find((c) => c.id === item.path[i]);
      if (!cur) break;
      parts.push(cur.name);
    }
    return parts.slice(-2).join(' · ');
  };

  return (
    <div className="home-body">
      <div className="home-greet">
        <div className="home-dateline">Tuesday · May 20 · 2026</div>
        <h1 className="home-hello">Good morning, <span style={{ color: accent }}>{(displayName && displayName.trim()) || 'writer'}</span>.</h1>
        <div className="home-sub">You wrote {weekCount} entries this week.</div>
      </div>

      {featured && (
        <>
          <div className="home-section-label">Continue writing</div>
          <button className="home-featured"
            onClick={() => openEntry({ path: featured.path, entryId: featured.entry.id })}>
            <div className="home-featured-meta">
              <span className="home-featured-journal" style={{ '--course-hue': featured.section.hue }}>
                <span>{featured.section.glyph}</span>
                {subTitle(featured)}
              </span>
              <span className="home-featured-time">{window.relDate(featured.entry.date)} · {featured.entry.time}</span>
            </div>
            <div className="home-featured-title">{featured.entry.title}</div>
            <div className="home-featured-preview">{featured.entry.preview}</div>
            <div className="home-featured-chips">
              {featured.entry.mood && <span className="chip"><window.Icon name="smile" size={12} />{featured.entry.mood}</span>}
              {featured.entry.weather && <span className="chip"><window.Icon name="cloud" size={12} />{featured.entry.weather}</span>}
              {featured.entry.location && <span className="chip"><window.Icon name="map" size={12} />{featured.entry.location.name}</span>}
            </div>
          </button>
        </>
      )}

      <div className="home-section-label">Recent across sections</div>
      <div className={`home-recent home-recent-${layout}`}>
        {recent.map((r) => (
          <button key={r.path.join('/') + r.entry.id} className="home-recent-card"
            style={{ '--course-hue': r.section.hue }}
            onClick={() => openEntry({ path: r.path, entryId: r.entry.id })}>
            <span className="home-recent-tag">
              <span>{r.section.glyph}</span>
              {subTitle(r)}
            </span>
            <div className="home-recent-title">{r.entry.title}</div>
            <div className="home-recent-time">{window.relDate(r.entry.date)}{r.entry.locked ? ' · 🔒' : ''}</div>
          </button>
        ))}
      </div>

      <div className="home-section-label">This week</div>
      <div className="home-stats">
        <Stat n={weekCount} label="entries" />
        <Stat n={totalPhotos} label="photos" />
        <Stat n={totalVoice} label="voice memos" />
        <Stat n={totalLocked} label="locked" />
      </div>
      <div style={{ height: 12 }} />
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div className="stat">
      <div className="stat-n">{n}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ─── Desktop shell ────────────────────────────────────────────────
function DesktopShell({ path, setSection, sections, openSettings, openCompose, openMap, accent, appTheme, setAppTheme, body }) {
  return (
    <div className="desktop-shell">
      <header className="desktop-top">
        <div className="desktop-top-brand">
          <Wordmark accent={accent} />
          <span className="wordmark-text">Journal<span style={{ color: accent }}>+</span></span>
        </div>
        <div className="desktop-top-slider">
          <Slider currentId={path[0]} setSection={setSection} sections={sections} />
        </div>
        <div className="desktop-top-right">
          <button className="icon-btn glass"><window.Icon name="search" size={15} /></button>
          <button className="icon-btn glass" onClick={openMap} title="Journal map">
            <window.Icon name="map" size={15} />
          </button>
          <button className="icon-btn glass"
            onClick={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme">
            <window.Icon name={appTheme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
          <button className="icon-btn glass" onClick={openSettings}>
            <window.Icon name="settings" size={15} />
          </button>
          <button className="desktop-compose" onClick={openCompose} style={{ background: accent }}>
            <window.Icon name="plus" size={14} />New entry
          </button>
        </div>
      </header>
      <main className="desktop-main">
        <div className="desktop-body">{body}</div>
      </main>
    </div>
  );
}

// ─── Split view ─── (same as before but accepts onChangeTheme)
function SplitView({ entries, entry, entryId, selectEntry, accent, skin, appTheme,
  onChangePhotos, onChangeStickies, onChangeTheme, layout, phoneShow, setPhoneShow }) {
  const isPhone = layout === 'phone';
  const showRail = !isPhone || phoneShow === 'rail';
  const showDetail = !isPhone || phoneShow === 'detail';
  return (
    <div className={`split ${isPhone ? 'split-phone' : ''}`}>
      {showRail && (
      <div className="split-rail">
        <div className="rail-header">
          <span className="rail-header-label">Entries</span>
          <span className="rail-header-count">{entries.length}</span>
        </div>
        <div className="rail-list">
          {entries.length === 0 && (
            <div className="empty">
              <div style={{ fontSize: 13, opacity: 0.6 }}>No entries yet.</div>
              <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4, fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.08em' }}>Tap + to write the first.</div>
            </div>
          )}
          {entries.map((e) => (
            <button key={e.id} onClick={() => selectEntry(e)}
              className={`rail-card ${entryId === e.id && !isPhone ? 'rail-card-active' : ''}`}>
              <div className="rail-card-date">
                <span className="rail-card-day">{e.dow}</span>
                <span className="rail-card-num">{e.date.slice(-2)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="rail-card-title">{e.title}</span>
                  {e.locked && <window.Icon name="lock" size={11} />}
                </div>
                <div className="rail-card-preview">{e.preview}</div>
                <div className="rail-card-row">
                  <span className="rail-card-time">{window.relDate(e.date)} · {e.time}</span>
                  <div className="rail-card-tags">
                    {e.photos && e.photos.length > 0 && <span className="rail-card-tag"><window.Icon name="image" size={10} />{e.photos.length}</span>}
                    {e.stickies && e.stickies.length > 0 && <span className="rail-card-tag"><window.Icon name="sticky" size={10} />{e.stickies.length}</span>}
                    {e.voice && e.voice.length > 0 && <span className="rail-card-tag"><window.Icon name="mic" size={10} />{e.voice.length}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}
      {showDetail && (
      <div className="split-content">
        {entry ? (
          <window.EntryView
            entry={entry} accent={accent} dark={appTheme === 'dark'}
            onChangePhotos={onChangePhotos} onChangeStickies={onChangeStickies} onChangeTheme={onChangeTheme}
            onClose={() => { if (isPhone) setPhoneShow('rail'); }}
            showBack={isPhone}
          />
        ) : (
          <div className="empty" style={{ height: '100%' }}>
            <div style={{ opacity: 0.45 }}>Select an entry on the left.</div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// ─── Reusable overlay shell ────────────────────────────────────────
function Overlay({ title, children, close, accent, skin, wide }) {
  return (
    <div className="overlay-back" onClick={close}>
      <div className={`overlay-sheet ${wide ? 'overlay-sheet-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>{title}</div>
          <button className="overlay-close" onClick={close} aria-label="Close">
            <window.Icon name="x" size={18} />
          </button>
        </div>
        <div className="overlay-body">{children}</div>
      </div>
    </div>
  );
}

function SettingsSection({ title, subtitle, children, action }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 4 }}>{title}</div>
        {action}
      </div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 12 }}>{subtitle}</div>}
      {!subtitle && <div style={{ height: 8 }} />}
      {children}
    </div>
  );
}

// ─── Sections manager — recursive tree editor ─────────────────────
function SectionsManager({ sections, setSections, accent }) {
  const [addingTo, setAddingTo] = React.useState(null); // path to parent (or 'root')
  const [renaming, setRenaming] = React.useState(null);
  const [draft, setDraft] = React.useState('');

  const updateAt = (path, fn) => {
    setSections((s) => {
      const next = JSON.parse(JSON.stringify(s));
      if (path.length === 0) return fn(next);
      let layer = next;
      for (let i = 0; i < path.length - 1; i++) {
        const idx = layer.findIndex((n) => n.id === path[i]);
        layer = layer[idx].children;
      }
      const lastIdx = layer.findIndex((n) => n.id === path[path.length - 1]);
      const node = layer[lastIdx];
      const updated = fn(node);
      if (updated === null) layer.splice(lastIdx, 1);
      else layer[lastIdx] = updated;
      return next;
    });
  };

  const addAt = (parentPath, name, glyph) => {
    const id = 'usr-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 999);
    setSections((s) => {
      const next = JSON.parse(JSON.stringify(s));
      const newNode = parentPath.length === 0
        ? { id, name, glyph: glyph || suggestIcon(name), hue: Math.floor(Math.random() * 360), entries: [] }
        : { id, name, entries: [] };
      if (parentPath.length === 0) {
        next.push(newNode);
        return next;
      }
      let layer = next;
      for (let i = 0; i < parentPath.length - 1; i++) {
        const idx = layer.findIndex((n) => n.id === parentPath[i]);
        layer = layer[idx].children;
      }
      const parentIdx = layer.findIndex((n) => n.id === parentPath[parentPath.length - 1]);
      const parent = layer[parentIdx];
      // If parent has entries[] (was a leaf), preserve them under a default child? No — promote it: clear entries, move them under the new node? Simpler: just allow both. Schema permits both, but for clarity we move entries beneath this new child if parent had entries.
      if (parent.entries && parent.entries.length > 0 && !parent.children) {
        // First-time becoming a parent: move existing entries into a default "General" child? No — entries are kept; child is added in parallel. That mixes contexts. Cleanest: keep parent.entries AND allow children. The reader honors children first.
      }
      parent.children = parent.children || [];
      parent.children.push(newNode);
      return next;
    });
  };

  const renameNode = (path, name) => updateAt(path, (n) => ({ ...n, name }));
  const setIcon    = (path, glyph) => updateAt(path, (n) => ({ ...n, glyph }));
  const deleteNode = (path) => updateAt(path, () => null);

  // Reorder a node within its parent. dir = -1 (up) | +1 (down). No-ops at the
  // boundary so it's safe to call from a disabled-when-edge button.
  const moveNode = (path, dir) => {
    setSections((s) => {
      const next = JSON.parse(JSON.stringify(s));
      let layer = next;
      for (let i = 0; i < path.length - 1; i++) {
        const idx = layer.findIndex((n) => n.id === path[i]);
        layer = layer[idx].children;
      }
      const i = layer.findIndex((n) => n.id === path[path.length - 1]);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= layer.length) return s; // no change
      [layer[i], layer[j]] = [layer[j], layer[i]];
      return next;
    });
  };

  return (
    <div className="sections-mgr">
      <div className="sections-mgr-list">
        {sections.map((s, i) => (
          <SectionRow key={s.id} node={s} path={[s.id]} depth={0}
            index={i} siblingCount={sections.length}
            renaming={renaming} setRenaming={setRenaming} draft={draft} setDraft={setDraft}
            addingTo={addingTo} setAddingTo={setAddingTo}
            addAt={addAt} renameNode={renameNode} deleteNode={deleteNode}
            moveNode={moveNode} setIcon={setIcon}
            accent={accent}
          />
        ))}
      </div>
      {addingTo === 'root' ? (
        <AddRow draft={draft} setDraft={setDraft} showIcon
          onCommit={(glyph) => { if (draft.trim()) addAt([], draft.trim(), glyph); setAddingTo(null); setDraft(''); }}
          onCancel={() => { setAddingTo(null); setDraft(''); }}
          placeholder="New section (e.g. Recipes, Workouts…)"
          accent={accent}
        />
      ) : (
        <button className="sections-add" onClick={() => { setAddingTo('root'); setDraft(''); }}>
          <window.Icon name="plus" size={14} />Add section
        </button>
      )}
    </div>
  );
}

function SectionRow({ node, path, depth, index, siblingCount, renaming, setRenaming, draft, setDraft, addingTo, setAddingTo, addAt, renameNode, deleteNode, moveNode, setIcon, accent }) {
  const [iconPickerOpen, setIconPickerOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;
  const isRenaming = renaming && renaming.join('/') === path.join('/');
  const isAddingHere = addingTo && Array.isArray(addingTo) && addingTo.join('/') === path.join('/');

  const entryCount = countEntries(node);

  return (
    <div className="sec-row-wrap">
      <div className="sec-row" style={{ paddingLeft: 8 + depth * 18 }}>
        <button
          className="sec-row-toggle"
          onClick={() => setExpanded(!expanded)}
          style={{ visibility: (hasChildren || depth < 2) ? 'visible' : 'hidden' }}
        >
          <window.Icon name="chevron" size={11} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s', opacity: hasChildren ? 0.8 : 0.3 }} />
        </button>
        {depth === 0 && (
          <span className="sec-row-glyph-wrap">
            <button
              type="button"
              className="sec-row-glyph sec-row-glyph-btn"
              onClick={() => setIconPickerOpen((o) => !o)}
              title="Change icon"
            >
              {node.glyph}
            </button>
            {iconPickerOpen && (
              <IconPicker
                value={node.glyph}
                onPick={(g) => { setIcon(path, g); setIconPickerOpen(false); }}
                onClose={() => setIconPickerOpen(false)}
              />
            )}
          </span>
        )}
        {isRenaming ? (
          <input
            className="sec-row-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onBlur={() => { if (draft.trim()) renameNode(path, draft.trim()); setRenaming(null); setDraft(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { if (draft.trim()) renameNode(path, draft.trim()); setRenaming(null); setDraft(''); }
              if (e.key === 'Escape') { setRenaming(null); setDraft(''); }
            }}
          />
        ) : (
          <button className="sec-row-name" onClick={() => setExpanded(!expanded)}>
            <span>{node.name}</span>
            {node.code && <span className="sec-row-code">{node.code}</span>}
            {node.meta && <span className="sec-row-meta">{node.meta}</span>}
          </button>
        )}
        <span className="sec-row-count">{entryCount} entries</span>
        <div className="sec-row-actions">
          <button
            className="sec-row-act"
            title="Move up"
            disabled={index === 0}
            onClick={() => moveNode(path, -1)}
          >
            <window.Icon name="chevron" size={12} style={{ transform: 'rotate(-90deg)' }} />
          </button>
          <button
            className="sec-row-act"
            title="Move down"
            disabled={index >= siblingCount - 1}
            onClick={() => moveNode(path, +1)}
          >
            <window.Icon name="chevron" size={12} style={{ transform: 'rotate(90deg)' }} />
          </button>
          {depth < 2 && (
            <button className="sec-row-act" title="Add inside"
              onClick={() => { setAddingTo(path); setDraft(''); }}>
              <window.Icon name="plus" size={13} />
            </button>
          )}
          <button className="sec-row-act" title="Rename"
            onClick={() => { setRenaming(path); setDraft(node.name); }}>
            <window.Icon name="pen" size={12} />
          </button>
          <button className="sec-row-act sec-row-act-danger" title="Delete"
            onClick={() => {
              if (confirm(`Delete "${node.name}"${hasChildren ? ' and everything inside?' : '?'}`)) deleteNode(path);
            }}>
            <window.Icon name="x" size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div>
          {hasChildren && node.children.map((c, ci) => (
            <SectionRow key={c.id} node={c} path={[...path, c.id]} depth={depth + 1}
              index={ci} siblingCount={node.children.length}
              renaming={renaming} setRenaming={setRenaming} draft={draft} setDraft={setDraft}
              addingTo={addingTo} setAddingTo={setAddingTo}
              addAt={addAt} renameNode={renameNode} deleteNode={deleteNode}
              moveNode={moveNode} setIcon={setIcon}
              accent={accent}
            />
          ))}
          {isAddingHere && (
            <div style={{ paddingLeft: 8 + (depth + 1) * 18 }}>
              <AddRow draft={draft} setDraft={setDraft}
                onCommit={(glyph) => { if (draft.trim()) addAt(path, draft.trim(), glyph); setAddingTo(null); setDraft(''); }}
                onCancel={() => { setAddingTo(null); setDraft(''); }}
                placeholder={depth === 0 ? 'New (e.g. Spring 2026, Q3 sprint…)' : 'New (e.g. CIS 110, Onboarding…)'}
                accent={accent}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddRow({ draft, setDraft, onCommit, onCancel, placeholder, accent, showIcon }) {
  // Local icon state: tracks whether the user has manually picked one.
  // If not, the displayed icon auto-suggests from the current draft.
  const [pickedGlyph, setPickedGlyph] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const effectiveGlyph = pickedGlyph || (showIcon ? suggestIcon(draft) : null);

  function commit() {
    onCommit(showIcon ? effectiveGlyph : undefined);
  }

  return (
    <form className="sec-add-row" onSubmit={(e) => { e.preventDefault(); commit(); }}>
      {showIcon ? (
        <span className="sec-add-icon-wrap">
          <button
            type="button"
            className="sec-add-icon"
            onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
            title="Pick an icon"
          >
            {effectiveGlyph}
          </button>
          {open && (
            <IconPicker
              value={effectiveGlyph}
              onPick={(g) => { setPickedGlyph(g); setOpen(false); }}
              onClose={() => setOpen(false)}
            />
          )}
        </span>
      ) : (
        <window.Icon name="plus" size={13} style={{ opacity: 0.5 }} />
      )}
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder}
      />
      <button type="button" className="sec-add-cancel" onMouseDown={(e) => { e.preventDefault(); onCancel(); }}>
        Cancel
      </button>
      <button type="submit" className="sec-add-ok" style={{ background: accent }}>
        Add
      </button>
    </form>
  );
}

function countEntries(node) {
  let n = (node.entries && node.entries.length) || 0;
  if (node.children) node.children.forEach((c) => { n += countEntries(c); });
  return n;
}

// Display-name field for the Account tab. Writes go through the synced setter,
// which is already debounced 600ms before it hits Supabase.
function DisplayNameField({ value, onChange, accent }) {
  const shown = (value && value.trim()) || 'writer';
  return (
    <div style={{
      padding: '14px 14px', marginBottom: 8,
      background: 'var(--panel)', border: 'var(--panel-border)', borderRadius: 14,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <label style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
        opacity: 0.55,
      }}>
        Your name
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What should we call you?"
        maxLength={48}
        autoComplete="given-name"
        style={{
          width: '100%',
          padding: '10px 14px', borderRadius: 999,
          background: 'var(--ink-soft)',
          border: '1px solid var(--hairline)',
          color: 'inherit', font: 'inherit', fontSize: 14, letterSpacing: '-0.005em',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = accent; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--hairline)'; }}
      />
      <div style={{ fontSize: 11.5, opacity: 0.55, lineHeight: 1.5 }}>
        Shown on the home screen — “Good morning, <span style={{ color: accent }}>{shown}</span>.”
      </div>
    </div>
  );
}

// ─── Settings overlay ──────────────────────────────────────────────
function SettingsOverlay({ close, appTheme, setAppTheme, accent, skin, sections, setSections, accentOverride, setAccentOverride, session, syncStatus, displayName, setDisplayName }) {
  const [pwTab, setPwTab] = React.useState('keypad');
  const [tab, setTab] = React.useState('sections');
  return (
    <Overlay close={close} title="Settings" accent={accent} skin={skin} wide>
      {/* Tabs */}
      <div className="seg" style={{ marginBottom: 22 }}>
        {[
          { id: 'sections', label: 'Sections', icon: 'layers' },
          { id: 'appearance', label: 'Appearance', icon: 'sun' },
          { id: 'security', label: 'Security', icon: 'lock' },
          { id: 'pencil', label: 'Pencil', icon: 'pen' },
          { id: 'account', label: 'Account', icon: 'cloud' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`seg-btn ${tab === t.id ? 'seg-btn-active' : ''}`}>
            <window.Icon name={t.icon} size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'sections' && (
        <SettingsSection
          title="Manage sections"
          subtitle="Add a new section at the top; tap + on a section to nest items inside (e.g. semesters under School, then courses inside each semester). Use whatever names make sense."
        >
          <SectionsManager sections={sections} setSections={setSections} accent={accent} />
        </SettingsSection>
      )}

      {tab === 'appearance' && (
        <>
          <SettingsSection title="App theme">
            <div style={{ display: 'flex', gap: 10 }}>
              <ThemeMode active={appTheme === 'dark'} icon="moon" label="Dark" onClick={() => setAppTheme('dark')} />
              <ThemeMode active={appTheme === 'light'} icon="sun" label="Light" onClick={() => setAppTheme('light')} />
              <ThemeMode icon="layers" label="System" />
            </div>
          </SettingsSection>
          <SettingsSection title="Accent color" subtitle="Used for buttons, focus rings, the FAB, and the live sheen on the slider.">
            <AccentPicker accent={accent} accentOverride={accentOverride} setAccentOverride={setAccentOverride} skin={skin} />
          </SettingsSection>
          <SettingsSection title="Default paper for new entries" subtitle="You can change paper per entry while editing.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {window.THEMES.map((t, i) => (
                <button key={t.id} className={`theme-chip ${i === 0 ? 'theme-chip-active' : ''}`}>
                  <span className="theme-chip-glyph">{t.glyph}</span>
                  {t.name}
                </button>
              ))}
            </div>
          </SettingsSection>
        </>
      )}

      {tab === 'security' && (
        <SettingsSection title="Lock entries" subtitle="Pick the unlock method shown for protected entries.">
          <div className="seg">
            {[
              { id: 'keypad', label: 'Passcode', icon: 'keypad' },
              { id: 'pattern', label: 'Pattern', icon: 'pattern' },
              { id: 'pass', label: 'Passphrase', icon: 'lock' },
              { id: 'bio', label: 'Biometric', icon: 'face' },
            ].map((o) => (
              <button key={o.id} onClick={() => setPwTab(o.id)} className={`seg-btn ${pwTab === o.id ? 'seg-btn-active' : ''}`}>
                <window.Icon name={o.icon} size={14} />{o.label}
              </button>
            ))}
          </div>
          <div className="security-panel">
            {pwTab === 'keypad' && <KeypadPreview accent={accent} />}
            {pwTab === 'pattern' && <PatternPreview accent={accent} />}
            {pwTab === 'pass' && <PassphrasePreview accent={accent} />}
            {pwTab === 'bio' && <BiometricPreview accent={accent} />}
          </div>
        </SettingsSection>
      )}

      {tab === 'account' && (
        <SettingsSection title="Account" subtitle="Your entries sync to every device you sign in on.">
          <DisplayNameField value={displayName || ''} onChange={setDisplayName} accent={accent} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', background: 'var(--panel)', border: 'var(--panel-border)', borderRadius: 14, marginTop: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: accent, display: 'grid', placeItems: 'center', color: '#0a0a0c', flexShrink: 0 }}>
              <window.Icon name="cloud" size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session && session.user ? session.user.email : 'Signed out'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.65, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', marginTop: 2 }}>
                {syncStatus === 'idle' && 'Synced'}
                {syncStatus === 'saving' && 'Saving…'}
                {syncStatus === 'loading' && 'Loading…'}
                {syncStatus === 'error' && 'Sync error'}
                {syncStatus === 'offline' && 'Offline'}
              </div>
            </div>
            <button
              onClick={() => window.signOut()}
              style={{
                padding: '8px 14px', borderRadius: 999,
                background: 'transparent', border: '1px solid var(--hairline)',
                color: 'inherit', fontSize: 12.5, cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </SettingsSection>
      )}

      {tab === 'pencil' && (
        <SettingsSection title="Apple Pencil" subtitle="Connected — try it on any entry by tapping the pen icon.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--panel)', border: 'var(--panel-border)', borderRadius: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: accent, display: 'grid', placeItems: 'center', color: '#0a0a0c' }}>
              <window.Icon name="pen" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Apple Pencil (2nd gen)</div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>Battery 78% · double-tap toggles eraser</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: accent, boxShadow: `0 0 12px ${accent}` }} />
          </div>
        </SettingsSection>
      )}
    </Overlay>
  );
}

function ThemeMode({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`theme-mode-chip ${active ? 'theme-mode-chip-active' : ''}`}>
      <window.Icon name={icon} size={16} />{label}
    </button>
  );
}

// ─── Accent color picker ──────────────────────────────────────────
const ACCENT_PRESETS = [
  { id: 'mint',   name: 'Mint',   accent: 'oklch(0.78 0.16 145)', accentSoft: 'oklch(0.78 0.16 145 / 0.18)' },
  { id: 'sky',    name: 'Sky',    accent: 'oklch(0.78 0.16 235)', accentSoft: 'oklch(0.78 0.16 235 / 0.18)' },
  { id: 'iris',   name: 'Iris',   accent: 'oklch(0.74 0.18 295)', accentSoft: 'oklch(0.74 0.18 295 / 0.20)' },
  { id: 'rose',   name: 'Rose',   accent: 'oklch(0.74 0.18 0)',   accentSoft: 'oklch(0.74 0.18 0   / 0.20)' },
  { id: 'amber',  name: 'Amber',  accent: 'oklch(0.82 0.16 75)',  accentSoft: 'oklch(0.82 0.16 75  / 0.20)' },
  { id: 'coral',  name: 'Coral',  accent: 'oklch(0.76 0.17 30)',  accentSoft: 'oklch(0.76 0.17 30  / 0.20)' },
  { id: 'teal',   name: 'Teal',   accent: 'oklch(0.78 0.13 195)', accentSoft: 'oklch(0.78 0.13 195 / 0.18)' },
  { id: 'cream',  name: 'Bone',   accent: 'oklch(0.92 0.02 90)',  accentSoft: 'oklch(0.92 0.02 90  / 0.20)' },
];

function AccentPicker({ accent, accentOverride, setAccentOverride, skin }) {
  const activeId = accentOverride ? accentOverride.id : 'default';
  return (
    <div className="accent-picker">
      {/* Default chip — restores the skin's own accent */}
      <button
        onClick={() => setAccentOverride(null)}
        className={`accent-chip ${activeId === 'default' ? 'accent-chip-active' : ''}`}
        title="Default"
      >
        <span className="accent-chip-swatch" style={{ background: skin.accent, boxShadow: `0 0 12px ${skin.accent}` }}>
          {activeId === 'default' && <window.Icon name="check" size={11} />}
        </span>
        <span>Default</span>
      </button>
      {ACCENT_PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => setAccentOverride(p)}
          className={`accent-chip ${activeId === p.id ? 'accent-chip-active' : ''}`}
          title={p.name}
        >
          <span className="accent-chip-swatch" style={{ background: p.accent, boxShadow: `0 0 12px ${p.accent}` }}>
            {activeId === p.id && <window.Icon name="check" size={11} />}
          </span>
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Paper backgrounds (full sheet) ────────────────────────────────
// Mirrors the renderer in entry-view.jsx so the compose surface and the
// detail view show the same paper. Returns CSS values we apply directly.
function paperBackground(theme) {
  switch (theme) {
    case 'notebook':
      return {
        bg: 'oklch(0.18 0.012 250)',
        image: 'linear-gradient(to right, rgba(255,90,90,0.30) 0 1px, transparent 1px), repeating-linear-gradient(0deg, transparent 0 31px, rgba(160,200,255,0.22) 31px 32px)',
        size: '100% 100%, 100% 32px',
        position: '60px 0, 0 29px',
        repeat: 'no-repeat, repeat',
        fg: '#e9e6df', light: false,
      };
    case 'dotted':
      return {
        bg: 'oklch(0.16 0.010 250)',
        image: 'radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.4px)',
        size: '18px 18px', repeat: 'repeat',
        fg: '#e9e6df', light: false,
      };
    case 'grid':
      return {
        bg: 'oklch(0.16 0.010 250)',
        image: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
        size: '24px 24px', repeat: 'repeat',
        fg: '#e9e6df', light: false,
      };
    case 'handwritten':
      return {
        bg: 'oklch(0.18 0.012 250)',
        image: 'radial-gradient(circle at 90% 92%, rgba(255,255,255,0.05), transparent 22%), radial-gradient(circle at 8% 12%, rgba(255,255,255,0.04), transparent 18%)',
        size: '100% 100%', repeat: 'no-repeat',
        fg: '#e9e6df', light: false,
      };
    case 'parchment':
      return {
        bg: 'oklch(0.92 0.04 78)',
        image: 'radial-gradient(circle at 50% 50%, rgba(120,85,40,0.04) 0%, rgba(80,55,20,0.18) 100%)',
        size: '100% 100%', repeat: 'no-repeat',
        fg: '#2a2521', light: true,
      };
    case 'cream':
      return { bg: 'oklch(0.96 0.012 78)', image: 'none', size: '100% 100%',
               fg: '#2a2521', light: true };
    default:
      return { bg: 'oklch(0.16 0.010 250)', image: 'none', size: '100% 100%',
               fg: '#e9e6df', light: false };
  }
}

// Pick a sensible leaf to drop a new entry into for a given section.
function findDefaultLeaf(section) {
  let cur = section;
  while (cur.children && cur.children.length > 0) cur = cur.children[0];
  return cur;
}

// ─── InkSurface — handwriting canvas with full pen palette ────────
// Pens: pen, marker, pencil, highlight, eraser. 9 colors. 3 sizes.
// Strokes are stored relative to a recorded canvas size so they reproduce
// faithfully on viewing — see entry-view's StrokesLayer.
function InkSurface({ strokes, setStrokes, accent, dark }) {
  const canvasRef = React.useRef(null);
  const wrapRef   = React.useRef(null);
  const [tool, setTool]   = React.useState('pen');
  const [color, setColor] = React.useState(dark ? '#e9e6df' : '#1a1a1c');
  const [size, setSize]   = React.useState('m');
  const drawing = React.useRef(null);

  // Tool definitions — width baseline + visual modifier.
  function strokeStyle(t, c, s) {
    const baseSize = s === 's' ? 1.6 : s === 'l' ? 5.0 : 2.8;
    switch (t) {
      case 'marker':   return { color: c, lineWidth: baseSize * 2.2, alpha: 0.95, op: 'source-over' };
      case 'pencil':   return { color: c, lineWidth: Math.max(1, baseSize * 0.7), alpha: 0.75, op: 'source-over' };
      case 'hi':       return { color: c, lineWidth: baseSize * 6, alpha: 0.35, op: 'source-over' };
      case 'erase':    return { color: '#000', lineWidth: baseSize * 6, alpha: 1, op: 'destination-out' };
      case 'pen':
      default:         return { color: c, lineWidth: baseSize, alpha: 1, op: 'source-over' };
    }
  }

  const redraw = React.useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    const all = strokes.slice();
    if (drawing.current) all.push(drawing.current);
    all.forEach((s) => {
      const st = strokeStyle(s.tool, s.color, s.size);
      ctx.save();
      ctx.globalAlpha = st.alpha;
      ctx.globalCompositeOperation = st.op;
      ctx.strokeStyle = st.color;
      ctx.lineWidth = st.lineWidth;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      s.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
      ctx.stroke();
      ctx.restore();
    });
  }, [strokes]);

  React.useEffect(() => { redraw(); }, [redraw]);
  React.useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const fit = () => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width  = Math.max(1, Math.floor(r.width * dpr));
      c.height = Math.max(1, Math.floor(r.height * dpr));
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [redraw]);

  const ptFromEvent = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const start = (e) => {
    e.preventDefault();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const pt = ptFromEvent(e);
    drawing.current = { tool, color, size, pts: [pt] };
    try { canvasRef.current.setPointerCapture(e.pointerId); } catch {}
    redraw();
  };
  const move = (e) => {
    if (!drawing.current) return;
    drawing.current.pts.push(ptFromEvent(e));
    redraw();
  };
  const end = (e) => {
    if (!drawing.current) return;
    // Skip 1-point taps to avoid stray dots.
    if (drawing.current.pts.length > 1) {
      const r = canvasRef.current.getBoundingClientRect();
      const recorded = { ...drawing.current, w: r.width, h: r.height };
      setStrokes((arr) => [...arr, recorded]);
    }
    drawing.current = null;
    try { canvasRef.current.releasePointerCapture(e.pointerId); } catch {}
  };

  const undo = () => setStrokes((arr) => arr.slice(0, -1));
  const clear = () => { if (strokes.length && confirm('Clear all ink?')) setStrokes([]); };

  // Color palette — readable on both paper tones.
  const palette = dark
    ? ['#e9e6df', '#ff7878', '#ffb058', '#ffd479', '#7be39c', '#7adfd9', '#8ec5ff', '#c7a3ff', '#ff9fd6']
    : ['#1a1a1c', '#c8302a', '#b8651a', '#a17a14', '#1f7a44', '#1c7a78', '#244a96', '#5a3aa8', '#a83368'];

  const tools = [
    { id: 'pen',    icon: 'pen',       label: 'Pen' },
    { id: 'marker', icon: 'pen',       label: 'Marker' },
    { id: 'pencil', icon: 'pen',       label: 'Pencil' },
    { id: 'hi',     icon: 'highlight', label: 'Highlight' },
    { id: 'erase',  icon: 'eraser',    label: 'Erase' },
  ];
  const sizes = [
    { id: 's', label: 'Fine',   dot: 4 },
    { id: 'm', label: 'Medium', dot: 7 },
    { id: 'l', label: 'Bold',   dot: 11 },
  ];

  return (
    <div ref={wrapRef} className="ink-surface">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
      />
      <div className={`ink-bar ${dark ? '' : 'ink-bar-light'}`}>
        {tools.map((t) => (
          <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
            className={`ink-tool ${tool === t.id ? 'is-active' : ''}`}
            style={tool === t.id ? { background: accent, color: '#0a0a0c' } : undefined}>
            <window.Icon name={t.icon} size={15} />
            <span className="ink-tool-label">{t.label.charAt(0)}</span>
          </button>
        ))}
        <span className="ink-bar-sep" />
        {sizes.map((sz) => (
          <button key={sz.id} onClick={() => setSize(sz.id)} title={sz.label}
            className={`ink-size ${size === sz.id ? 'is-active' : ''}`}>
            <span className="ink-size-dot" style={{ width: sz.dot, height: sz.dot, background: tool === 'erase' ? 'currentColor' : color }} />
          </button>
        ))}
        <span className="ink-bar-sep" />
        <span className="ink-colors">
          {palette.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={c}
              className={`ink-color ${color === c ? 'is-active' : ''}`}
              style={{ background: c, borderColor: color === c ? accent : undefined }}
            />
          ))}
        </span>
        <span className="ink-bar-sep" />
        <button onClick={undo} disabled={!strokes.length} className="ink-action">Undo</button>
        <button onClick={clear} disabled={!strokes.length} className="ink-action">Clear</button>
      </div>
    </div>
  );
}

// ─── Full-screen compose ──────────────────────────────────────────
// Replaces the half-sheet. Fills the viewport, renders the chosen paper
// theme as the actual writing surface, and lets the user type OR
// hand-write/draw.
function FullCompose({ close, accent, skin, appTheme, sections, setSections, currentPath, layout }) {
  // Reasonable default: notebook ruled paper.
  const [paper, setPaper]   = React.useState('notebook');
  const [mode, setMode]     = React.useState('type'); // 'type' | 'write'
  const [title, setTitle]   = React.useState('');
  const [body, setBody]     = React.useState('');
  const [strokes, setStrokes] = React.useState([]);
  const [paperOpen, setPaperOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // Section picker: defaults to the section the user is currently inside, or
  // the first section. If none exist, save is blocked.
  const initialSectionId = (currentPath && currentPath[0]) || (sections[0] && sections[0].id) || null;
  const [sectionId, setSectionId] = React.useState(initialSectionId);
  const noSections = sections.length === 0;

  const bg = paperBackground(paper);
  const isLight = bg.light;
  const themeBodyFont = ['notebook', 'handwritten'].includes(paper)
    ? '"Caveat", "Inter Tight", sans-serif'
    : 'inherit';
  const bodySize = paper === 'notebook' ? 22 : paper === 'handwritten' ? 22 : 15;
  const bodyLh   = paper === 'notebook' ? '32px' : paper === 'handwritten' ? '32px' : 1.6;

  function save() {
    const hasContent = title.trim() || body.trim() || strokes.length > 0;
    if (!hasContent) { close(); return; }
    if (!sectionId) { close(); return; }

    const now = new Date();
    const id = 'e-' + now.getTime().toString(36);
    const date = now.toISOString().slice(0, 10);
    const dow  = now.toLocaleDateString('en-US', { weekday: 'short' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const preview = (body.trim() || title.trim() || (strokes.length ? '✎ Handwritten note' : '')).slice(0, 160);
    const newEntry = {
      id,
      title: title.trim() || 'Untitled',
      date, dow, time,
      mood: '', weather: '',
      location: null,
      theme: paper,
      preview,
      body: body.trim() ? [{ type: 'p', text: body.trim() }] : [],
      strokes: strokes.length ? strokes : undefined,
      stickies: [], photos: [], voice: [], backlinks: [],
    };

    setSections((s) => {
      const next = JSON.parse(JSON.stringify(s));
      const root = next.find((n) => n.id === sectionId);
      if (!root) return s;
      const leaf = findDefaultLeaf(root);
      leaf.entries = leaf.entries || [];
      leaf.entries.unshift(newEntry);
      return next;
    });
    close();
  }

  function discard() {
    const dirty = title.trim() || body.trim() || strokes.length > 0;
    if (dirty && !confirm('Discard this entry?')) return;
    close();
  }

  return (
    <div className={`compose-full ${isLight ? 'compose-full-light' : ''}`} role="dialog" aria-label="New entry">
      <div
        className="compose-paper"
        style={{
          background: bg.bg,
          backgroundImage: bg.image,
          backgroundSize: bg.size,
          backgroundPosition: bg.position || '0 0',
          backgroundRepeat: bg.repeat || 'repeat',
          color: bg.fg,
        }}
      >
        {/* Title — sits on the paper itself, no chrome */}
        <div className="compose-title-wrap" style={{ paddingLeft: paper === 'notebook' ? 78 : 44, paddingRight: 44 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title…"
            className="compose-title"
            style={{
              fontFamily: themeBodyFont !== 'inherit' ? themeBodyFont : 'inherit',
              color: bg.fg,
            }}
          />
        </div>

        {/* Body area — type OR handwrite/draw */}
        <div
          className="compose-body"
          style={{ paddingLeft: paper === 'notebook' ? 78 : 44, paddingRight: 44 }}
        >
          {mode === 'type' ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={paper === 'notebook' ? 'Write here on the lines…' : 'Start writing…'}
              className="compose-textarea"
              style={{
                fontFamily: themeBodyFont,
                fontSize: bodySize,
                lineHeight: bodyLh,
                color: bg.fg,
              }}
            />
          ) : (
            <InkSurface
              strokes={strokes}
              setStrokes={setStrokes}
              accent={accent}
              dark={!isLight}
            />
          )}
        </div>
      </div>

      {/* Top toolbar — minimal so the paper stays the focus */}
      <div className={`compose-bar ${isLight ? 'compose-bar-light' : ''}`}>
        <button onClick={discard} className="compose-bar-btn" title="Close" aria-label="Close">
          <window.Icon name="x" size={18} />
        </button>

        {sections.length > 0 && (
          <div className="compose-bar-section" style={{ position: 'relative' }}>
            <button onClick={() => setPickerOpen((o) => !o)} className="compose-pill" title="Section">
              <window.Icon name="layers" size={13} />
              <span>{(sections.find((s) => s.id === sectionId) || {}).name || 'Pick section'}</span>
              <window.Icon name="chevron" size={11} style={{ transform: 'rotate(90deg)', opacity: 0.65 }} />
            </button>
            {pickerOpen && (
              <div className="compose-dropdown">
                {sections.map((s) => (
                  <button key={s.id} onClick={() => { setSectionId(s.id); setPickerOpen(false); }}
                    className={`compose-dropdown-item ${sectionId === s.id ? 'is-active' : ''}`}>
                    <span style={{ width: 22, textAlign: 'center' }}>{s.glyph}</span>
                    <span style={{ flex: 1 }}>{s.name}</span>
                    {sectionId === s.id && <window.Icon name="check" size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Type ⇄ Write mode toggle */}
        <div className="compose-mode-seg" role="tablist">
          <button onClick={() => setMode('type')}
            className={`compose-mode-btn ${mode === 'type' ? 'is-active' : ''}`}
            style={mode === 'type' ? { background: accent, color: '#0a0a0c' } : undefined}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>Aa</span>
            <span className="compose-mode-label">Type</span>
          </button>
          <button onClick={() => setMode('write')}
            className={`compose-mode-btn ${mode === 'write' ? 'is-active' : ''}`}
            style={mode === 'write' ? { background: accent, color: '#0a0a0c' } : undefined}>
            <window.Icon name="pen" size={13} />
            <span className="compose-mode-label">Draw</span>
          </button>
        </div>

        {/* Paper picker dropdown */}
        <div className="compose-bar-section" style={{ position: 'relative' }}>
          <button onClick={() => setPaperOpen((o) => !o)} className="compose-pill" title="Paper">
            <span style={{
              width: 22, height: 16, borderRadius: 4, flexShrink: 0,
              background: themeSwatchBg(paper),
              backgroundImage: themeSwatchImg(paper),
              backgroundSize: themeSwatchSize(paper),
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'inline-block',
            }} />
            <span>Paper</span>
            <window.Icon name="chevron" size={11} style={{ transform: 'rotate(90deg)', opacity: 0.65 }} />
          </button>
          {paperOpen && (
            <div className="compose-dropdown compose-dropdown-right">
              {window.THEMES.map((t) => (
                <button key={t.id} onClick={() => { setPaper(t.id); setPaperOpen(false); }}
                  className={`compose-dropdown-item ${paper === t.id ? 'is-active' : ''}`}>
                  <span style={{
                    width: 28, height: 20, borderRadius: 4, flexShrink: 0,
                    background: themeSwatchBg(t.id),
                    backgroundImage: themeSwatchImg(t.id),
                    backgroundSize: themeSwatchSize(t.id),
                    border: '1px solid rgba(255,255,255,0.10)',
                  }} />
                  <span style={{ flex: 1 }}>{t.name}</span>
                  {paper === t.id && <window.Icon name="check" size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={noSections}
          className="compose-save"
          style={{ background: accent }}
          title={noSections ? 'Create a section first' : 'Save'}
        >
          <window.Icon name="check" size={15} />
          <span className="compose-mode-label">Save</span>
        </button>
      </div>

      {noSections && (
        <div className="compose-empty-hint">
          You don’t have any sections yet. Open Settings → Sections to add one, then come back to save.
        </div>
      )}
    </div>
  );
}

function themeSwatchBg(t) {
  return ({
    dark: 'oklch(0.18 0.012 250)',
    notebook: 'oklch(0.18 0.012 250)',
    dotted: 'oklch(0.16 0.010 250)',
    grid: 'oklch(0.16 0.010 250)',
    handwritten: 'oklch(0.18 0.012 250)',
    parchment: 'oklch(0.92 0.04 78)',
    cream: 'oklch(0.96 0.012 78)',
  })[t];
}
function themeSwatchImg(t) {
  return ({
    notebook: 'repeating-linear-gradient(0deg, transparent 0 5px, rgba(160,200,255,0.30) 5px 6px)',
    dotted: 'radial-gradient(circle, rgba(255,255,255,0.25) 0.6px, transparent 1px)',
    grid: 'linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
  })[t] || 'none';
}
function themeSwatchSize(t) {
  return ({ notebook: '100% 6px', dotted: '4px 4px', grid: '6px 6px' })[t] || '100% 100%';
}

// ─── Lock + auth previews ─────────────────────────────────────────
function LockOverlay({ entry, mode, setMode, close, onUnlock, accent, skin }) {
  return (
    <div className="lock-overlay">
      <button className="overlay-close" onClick={close} aria-label="Close">
        <window.Icon name="x" size={18} />
      </button>
      <div className="lock-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--panel)', border: 'var(--panel-border)', display: 'grid', placeItems: 'center', boxShadow: `0 0 30px ${accent}33` }}>
            <window.Icon name="lock" size={18} style={{ color: accent }} />
          </div>
          <div>
            <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.55 }}>Locked entry</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{entry.title}</div>
          </div>
        </div>
        <div className="seg" style={{ marginBottom: 18 }}>
          {[
            { id: 'keypad', label: 'Passcode', icon: 'keypad' },
            { id: 'pattern', label: 'Pattern', icon: 'pattern' },
            { id: 'pass', label: 'Passphrase', icon: 'lock' },
            { id: 'bio', label: 'Face', icon: 'face' },
          ].map((o) => (
            <button key={o.id} onClick={() => setMode(o.id)} className={`seg-btn ${mode === o.id ? 'seg-btn-active' : ''}`}>
              <window.Icon name={o.icon} size={13} />{o.label}
            </button>
          ))}
        </div>
        {mode === 'keypad' && <KeypadPreview accent={accent} />}
        {mode === 'pattern' && <PatternPreview accent={accent} />}
        {mode === 'pass' && <PassphrasePreview accent={accent} />}
        {mode === 'bio' && <BiometricPreview accent={accent} />}
        <button onClick={onUnlock} className="primary-btn" style={{ marginTop: 18, background: accent, width: '100%', justifyContent: 'center' }}>
          <window.Icon name="unlock" size={15} />Unlock entry
        </button>
      </div>
    </div>
  );
}

function KeypadPreview({ accent }) {
  const [code, setCode] = React.useState('');
  return (
    <div>
      <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.7, marginBottom: 14 }}>Enter your 6-digit passcode</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 999, background: i < code.length ? accent : 'transparent', border: `1.5px solid ${i < code.length ? accent : 'rgba(255,255,255,0.25)'}` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 10, justifyContent: 'center' }}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((n, i) => (
          n === '' ? <div key={i} /> :
          <button key={i} onClick={() => n === '⌫' ? setCode((c) => c.slice(0, -1)) : setCode((c) => (c + n).slice(0, 6))} className="keypad-key">{n}</button>
        ))}
      </div>
    </div>
  );
}

function PatternPreview({ accent }) {
  const [pts, setPts] = React.useState([0, 4, 8, 5]);
  return (
    <div>
      <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.7, marginBottom: 14 }}>Draw your unlock pattern</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26, maxWidth: 200, margin: '0 auto', position: 'relative' }}>
        <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {pts.slice(0, -1).map((p, i) => {
            const a = pts[i], b = pts[i+1];
            return <line key={i} x1={(a%3)*87+13} y1={Math.floor(a/3)*87+13} x2={(b%3)*87+13} y2={Math.floor(b/3)*87+13} stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>;
          })}
        </svg>
        {[0,1,2,3,4,5,6,7,8].map((i) => (
          <div key={i} onClick={() => setPts((p) => p.includes(i) ? p : [...p, i])} style={{ width: 26, height: 26, borderRadius: 999, justifySelf: 'center', background: pts.includes(i) ? accent : 'transparent', border: pts.includes(i) ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.22)', boxShadow: pts.includes(i) ? `0 0 16px ${accent}55` : 'none', cursor: 'pointer' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <button onClick={() => setPts([])} style={{ background: 'transparent', border: 'none', color: 'currentColor', opacity: 0.65, fontSize: 12, cursor: 'pointer' }}>Reset</button>
      </div>
    </div>
  );
}

function PassphrasePreview({ accent }) {
  const [v, setV] = React.useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', marginBottom: 6 }}>Passphrase to unlock journal entries</div>
      <input value={v} onChange={(e) => setV(e.target.value)} type="password" placeholder="••••••••••" style={{ background: 'var(--panel)', border: 'var(--panel-border)', borderRadius: 14, color: 'currentColor', fontSize: 15, padding: '14px 16px', outline: 'none', fontFamily: 'inherit' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, opacity: 0.6 }}>
        <span style={{ width: 4, height: 4, borderRadius: 999, background: accent }} />Tip: a sentence is stronger than a single word.
      </div>
    </div>
  );
}

function BiometricPreview({ accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 4px' }}>
      <div style={{ width: 84, height: 84, borderRadius: 24, background: 'var(--panel)', border: 'var(--panel-border)', display: 'grid', placeItems: 'center', boxShadow: `0 0 40px ${accent}33` }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2"/>
          <circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>
          <path d="M9 15c1 1 4 1 6 0"/>
        </svg>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>Look at the screen to unlock</div>
    </div>
  );
}

Object.assign(window, { JournalApp });
})();
