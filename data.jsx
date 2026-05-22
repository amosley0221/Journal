/* global window */
// ─── Data model + icons shared across all three skins ──────────────

const JOURNALS = [
  { id: 'school',  name: 'School',  glyph: '✦', hue: 145 },
  { id: 'work',    name: 'Work',    glyph: '◆', hue: 200 },
  { id: 'life',    name: 'Life',    glyph: '◉', hue: 30  },
  { id: 'travel',  name: 'Travel',  glyph: '✈', hue: 280 },
  { id: 'dreams',  name: 'Dreams',  glyph: '☾', hue: 320 },
];

// Seeded entries. Each entry's photos[] / stickies[] use percentages so they
// scale with the page area.
const ENTRIES = {
  school: {
    semesters: [
      {
        id: 'sp26', name: 'Spring 2026', term: 'Jan – May 2026',
        courses: [
          {
            id: 'cis110', code: 'CIS 110', name: 'Intro to Computing', color: 145,
            meta: 'MWF · 10:10 AM · Room 214',
            entries: [
              {
                id: 'e1', title: 'Lecture 14 — Sorting Algorithms',
                date: '2026-05-18', dow: 'Mon', time: '10:42 AM',
                mood: 'focused', weather: '72° clear',
                location: { name: 'Sci. Bldg, Rm 214', lat: 0.62, lng: 0.41 },
                theme: 'notebook',
                preview: 'Merge sort splits then merges. Big-O is n log n. The recurrence T(n) = 2T(n/2) + n proves it.',
                body: [
                  { type: 'h', text: 'Sorting — the comparison family' },
                  { type: 'p', text: 'Insertion sort is O(n²) worst case but linear when nearly sorted — useful as a subroutine inside hybrid sorts.' },
                  { type: 'p', text: 'Merge sort: divide, recurse, merge. T(n) = 2T(n/2) + n, which expands to n log n.' },
                  { type: 'code', text: 'def merge_sort(a):\n    if len(a) <= 1: return a\n    m = len(a) // 2\n    return merge(merge_sort(a[:m]),\n                 merge_sort(a[m:]))' },
                  { type: 'p', text: 'Quicksort is faster in practice on random data but degenerates to n² on sorted input without random pivots.' },
                  { type: 'h', text: 'Office hours follow-up' },
                  { type: 'p', text: 'Bring Problem 3 from PS5 — Prof. Lin said the recurrence proof is the part most people miss.' },
                ],
                stickies: [
                  { id: 's1', text: 'Exam: Th 5/21 — bring the n log n proof', x: 64, y: 18, w: 24, h: 11, hue: 50 },
                  { id: 's2', text: 'Pair w/ Maya on PS5 #3', x: 8, y: 71, w: 22, h: 9, hue: 145 },
                ],
                photos: [
                  { id: 'p1', label: 'Whiteboard · recurrence', x: 58, y: 44, w: 32, h: 22, hue: 200 },
                ],
                voice: [{ id: 'v1', label: 'Prof. recap', dur: '0:48' }],
                backlinks: ['CIS 110 · L12 — Recursion', 'ACA 122 · Problem-solving'],
              },
              {
                id: 'e2', title: 'Problem Set 4 — Hash Tables',
                date: '2026-05-12', dow: 'Tue', time: '9:14 PM',
                mood: 'stuck → cleared', weather: '68° rain',
                location: { name: 'Library, 3rd floor', lat: 0.40, lng: 0.55 },
                theme: 'dotted',
                preview: 'Open addressing vs. chaining. Got hung up on load factor before realizing my hash was bad.',
                body: [
                  { type: 'h', text: 'PS4 reflection' },
                  { type: 'p', text: 'Spent 90 min before realizing my hash function modded by a non-prime. Switched to 31·k + c and collisions dropped 4×.' },
                  { type: 'p', text: 'Load factor target: 0.7 with linear probing, 0.9 with chaining. Past that, resize.' },
                ],
                stickies: [
                  { id: 's1', text: 'Prime moduli only.', x: 62, y: 22, w: 24, h: 9, hue: 320 },
                ],
                photos: [],
                voice: [],
                backlinks: ['CIS 110 · L10 — Hashing'],
              },
              {
                id: 'e3', title: 'Group project — Library API',
                date: '2026-05-06', dow: 'Wed', time: '4:31 PM',
                mood: 'energized', weather: '74° sun',
                location: { name: 'CS Lounge', lat: 0.51, lng: 0.36 },
                theme: 'dark',
                preview: 'Divided endpoints: I take /books and /loans, Maya takes /users, Tomás writes the tests.',
                body: [
                  { type: 'p', text: 'Standup: I own /books and /loans. Maya owns /users. Tomás writes the integration tests and CI.' },
                  { type: 'p', text: 'Due Mon 5/11. Stretch goal: pagination with cursor tokens, not page numbers.' },
                ],
                stickies: [
                  { id: 's1', text: 'Push branch by Fri', x: 8, y: 16, w: 22, h: 9, hue: 30 },
                  { id: 's2', text: 'Cursor pagination ≫ offset', x: 64, y: 64, w: 28, h: 10, hue: 200 },
                ],
                photos: [],
                voice: [{ id: 'v1', label: 'Standup notes', dur: '2:14' }],
                backlinks: [],
              },
            ],
          },
          {
            id: 'aca122', code: 'ACA 122', name: 'College Transfer Success', color: 200,
            meta: 'T · 1:00 PM · Hybrid',
            entries: [
              {
                id: 'e1', title: 'Transfer planning — UNC vs. NCSU',
                date: '2026-05-15', dow: 'Fri', time: '2:08 PM',
                mood: 'thoughtful', weather: '70° partly cloudy',
                location: { name: 'Advising Center', lat: 0.34, lng: 0.62 },
                theme: 'parchment',
                preview: 'UNC has the smaller cohort but NCSU\'s CS pathway counts more of my credits.',
                locked: true,
                body: [
                  { type: 'p', text: 'Met with Dr. Reyes. UNC transfers 47 credits, NCSU transfers 53. NCSU\'s CS bridge program is the deciding factor.' },
                  { type: 'p', text: 'Application deadlines: UNC Oct 15, NCSU Nov 1. Need 2 LORs each.' },
                ],
                stickies: [
                  { id: 's1', text: 'Email Prof. Lin re LOR', x: 58, y: 20, w: 30, h: 10, hue: 320 },
                ],
                photos: [],
                voice: [],
                backlinks: ['ACA 122 · Goals'],
              },
              {
                id: 'e2', title: 'Time-block experiment — week 3',
                date: '2026-05-09', dow: 'Sat', time: '8:20 AM',
                mood: 'curious', weather: '66° fog',
                location: null,
                theme: 'handwritten',
                preview: 'Two-hour deep blocks before 11 AM are the only thing that\'s actually moving the needle.',
                body: [
                  { type: 'p', text: 'Week 3 of the 2hr morning block. Coursework finished by 11. Afternoons are for everything else.' },
                ],
                stickies: [],
                photos: [],
                voice: [],
                backlinks: [],
              },
            ],
          },
        ],
      },
      {
        id: 'fa25', name: 'Fall 2025', term: 'Aug – Dec 2025',
        courses: [
          { id: 'eng111', code: 'ENG 111', name: 'Writing & Inquiry', color: 30,  meta: 'completed · A−', entries: [] },
          { id: 'mat171', code: 'MAT 171', name: 'Precalc Algebra',  color: 280, meta: 'completed · B+', entries: [] },
        ],
      },
    ],
  },
  work: {
    entries: [
      { id: 'w1', title: '1:1 with Sam — Q3 priorities', date: '2026-05-19', dow: 'Tue', time: '3:00 PM',
        mood: 'aligned', weather: '73° clear', location: { name: 'Café Lune', lat: 0.45, lng: 0.50 }, theme: 'dark',
        preview: 'Three things land Q3: onboarding revamp, billing migration, the analytics rebuild.',
        body: [{ type: 'p', text: 'Sam wants onboarding done by July. Billing migration is mine end-to-end. Analytics gets a dedicated PM.' }],
        stickies: [{ id: 's1', text: 'Write the onboarding doc Mon', x: 60, y: 18, w: 28, h: 10, hue: 145 }],
        photos: [], voice: [], backlinks: [] },
      { id: 'w2', title: 'Sprint retro notes', date: '2026-05-16', dow: 'Sat', time: '10:00 AM',
        mood: 'reflective', weather: '70° mild', location: null, theme: 'dotted',
        preview: 'We over-committed by 8 points. Two stories were undefined when sprint started.',
        body: [{ type: 'p', text: 'Action items: spike unknowns before commit; cap sprint at 32pts; rotate retro facilitator.' }],
        stickies: [], photos: [], voice: [], backlinks: [] },
    ],
  },
  life: {
    entries: [
      { id: 'l1', title: 'Sunday at the farmers market', date: '2026-05-17', dow: 'Sun', time: '11:30 AM',
        mood: 'happy', weather: '72° sun', location: { name: 'Carrboro Plaza', lat: 0.30, lng: 0.55 }, theme: 'parchment',
        preview: 'Bought strawberries that tasted like actual strawberries. Made shortcake that afternoon.',
        body: [{ type: 'p', text: 'The farm stand at the south end had real strawberries — the kind that smell from across the table.' }],
        stickies: [{ id: 's1', text: 'Try the goat cheese stall next week', x: 62, y: 60, w: 30, h: 10, hue: 50 }],
        photos: [{ id: 'p1', label: 'Strawberries', x: 8, y: 30, w: 32, h: 24, hue: 30 }],
        voice: [], backlinks: [] },
    ],
  },
  travel: {
    entries: [
      { id: 't1', title: 'Asheville weekend', date: '2026-04-26', dow: 'Sun', time: '8:15 PM',
        mood: 'tired-good', weather: '64° rain', location: { name: 'Asheville, NC', lat: 0.22, lng: 0.30 }, theme: 'handwritten',
        preview: 'Three days, one bookstore I want to live in, and a hike that took twice as long as planned.',
        body: [{ type: 'p', text: 'Malaprop\'s. The bookstore. The one. Spent two hours and most of the rainy afternoon there.' }],
        stickies: [], photos: [{ id: 'p1', label: 'Trail map', x: 56, y: 30, w: 34, h: 26, hue: 145 }], voice: [], backlinks: [] },
    ],
  },
  dreams: {
    entries: [
      { id: 'd1', title: 'The library that kept growing', date: '2026-05-14', dow: 'Thu', time: '4:02 AM',
        mood: 'unsettled', weather: '—', location: null, theme: 'handwritten',
        preview: 'Every time I picked up a book a new hallway appeared. I never found the exit, but I wasn\'t scared.',
        body: [{ type: 'p', text: 'The shelves rearranged themselves when I wasn\'t looking. I think this is about the transfer decision.' }],
        stickies: [], photos: [], voice: [], backlinks: ['Life · Transfer planning'] },
    ],
  },
};

const THEMES = [
  { id: 'dark',        name: 'Plain dark',        scheme: 'dark', glyph: '▮' },
  { id: 'notebook',    name: 'Ruled notebook',    scheme: 'dark', glyph: '☰' },
  { id: 'dotted',      name: 'Dot grid',          scheme: 'dark', glyph: '·' },
  { id: 'grid',        name: 'Square grid',       scheme: 'dark', glyph: '#' },
  { id: 'handwritten', name: 'Handwritten doodles', scheme: 'dark', glyph: '✎' },
  { id: 'parchment',   name: 'Vintage parchment', scheme: 'light', glyph: '✺' },
  { id: 'cream',       name: 'Minimal cream',     scheme: 'light', glyph: '○' },
];

// ─── Icons (stroke 1.5, lucide-style) ─────────────────────────────
const I = {
  search: <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm6 13 4 4" />,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H9.5a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V9.5a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
  plus: <path d="M12 5v14M5 12h14" />,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  unlock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></>,
  pin: <path d="M12 17v5M5 3h14l-2 2v5l3 4H4l3-4V5L5 3Z" />,
  map: <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></>,
  cloud: <path d="M7 18a5 5 0 0 1 .5-9.9 6 6 0 0 1 11.5 1.4A4 4 0 0 1 18 18Z" />,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></>,
  sticky: <><path d="M4 4h12l4 4v12H4Z"/><path d="M16 4v4h4"/></>,
  pen: <path d="M3 21l4-1 12-12-3-3L4 17l-1 4ZM14 6l3 3" />,
  highlight: <><path d="M9 14l5-5 6 6-5 5H9l-4 4-1-3 5-7Z"/></>,
  eraser: <path d="m18 6-12 12 4 4h8l6-6-6-10Z" />,
  back: <path d="M15 6l-6 6 6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  link: <><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6L11.5 7"/><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6L12.5 17"/></>,
  smile: <><circle cx="12" cy="12" r="9"/><path d="M9 14s1 2 3 2 3-2 3-2M9 9h.01M15 9h.01"/></>,
  more: <><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>,
  check: <path d="m5 12 5 5L20 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm0 9 9 5-9 5-9-5 9-5Z" />,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></>,
  moon: <path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z" />,
  face: <><circle cx="12" cy="12" r="9"/><path d="M8.5 13a3.5 3.5 0 0 0 7 0M9 9h.01M15 9h.01"/></>,
  keypad: <><circle cx="6" cy="6" r="1.4"/><circle cx="12" cy="6" r="1.4"/><circle cx="18" cy="6" r="1.4"/><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/><circle cx="6" cy="18" r="1.4"/><circle cx="12" cy="18" r="1.4"/><circle cx="18" cy="18" r="1.4"/></>,
  pattern: <><circle cx="6" cy="6" r="1.4"/><circle cx="12" cy="6" r="1.4"/><circle cx="18" cy="6" r="1.4"/><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><path d="m6 6 6 6 6-6"/></>,
  code: <><path d="m8 8-5 4 5 4"/><path d="M16 8l5 4-5 4"/><path d="M14 6l-4 12"/></>,
};

function Icon({ name, size = 18, stroke = 1.6, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {I[name]}
    </svg>
  );
}

// ─── Utilities ────────────────────────────────────────────────────
function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function relDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date('2026-05-20T00:00:00');
  const diff = Math.round((today - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.round(diff/7)}w ago`;
  if (diff < 365) return `${Math.round(diff/30)}mo ago`;
  return `${Math.round(diff/365)}y ago`;
}

// ─── Sections (generic tree): a section optionally contains children;
// each child optionally contains children; the leaf level holds entries.
// The depth and the labels are user-defined — the words "subsection" /
// "group" never appear in the UI.
const INITIAL_SECTIONS = [
  {
    id: 'school', name: 'School', glyph: '✦', hue: 145,
    children: [
      {
        id: 'sp26', name: 'Spring 2026', meta: 'Jan – May 2026',
        children: [
          {
            id: 'cis110', name: 'Intro to Computing', code: 'CIS 110', color: 145,
            meta: 'MWF · 10:10 AM · Room 214',
            entries: [
              {
                id: 'e1', title: 'Lecture 14 — Sorting Algorithms',
                date: '2026-05-18', dow: 'Mon', time: '10:42 AM',
                mood: 'focused', weather: '72° clear',
                location: { name: 'Sci. Bldg, Rm 214', lat: 0.62, lng: 0.41 },
                theme: 'notebook',
                preview: 'Merge sort splits then merges. Big-O is n log n. The recurrence T(n) = 2T(n/2) + n proves it.',
                body: [
                  { type: 'h', text: 'Sorting — the comparison family' },
                  { type: 'p', text: 'Insertion sort is O(n²) worst case but linear when nearly sorted — useful as a subroutine inside hybrid sorts.' },
                  { type: 'p', text: 'Merge sort: divide, recurse, merge. T(n) = 2T(n/2) + n, which expands to n log n.' },
                  { type: 'code', text: 'def merge_sort(a):\n    if len(a) <= 1: return a\n    m = len(a) // 2\n    return merge(merge_sort(a[:m]),\n                 merge_sort(a[m:]))' },
                  { type: 'p', text: 'Quicksort is faster in practice on random data but degenerates to n² on sorted input without random pivots.' },
                  { type: 'h', text: 'Office hours follow-up' },
                  { type: 'p', text: 'Bring Problem 3 from PS5 — Prof. Lin said the recurrence proof is the part most people miss.' },
                ],
                stickies: [
                  { id: 's1', text: 'Exam: Th 5/21 — bring the n log n proof', x: 64, y: 18, w: 24, h: 11, hue: 50 },
                  { id: 's2', text: 'Pair w/ Maya on PS5 #3', x: 8, y: 71, w: 22, h: 9, hue: 145 },
                ],
                photos: [{ id: 'p1', label: 'Whiteboard · recurrence', x: 58, y: 44, w: 32, h: 22, hue: 200 }],
                voice: [{ id: 'v1', label: 'Prof. recap', dur: '0:48' }],
                backlinks: ['CIS 110 · L12 — Recursion', 'ACA 122 · Problem-solving'],
              },
              {
                id: 'e2', title: 'Problem Set 4 — Hash Tables',
                date: '2026-05-12', dow: 'Tue', time: '9:14 PM',
                mood: 'stuck → cleared', weather: '68° rain',
                location: { name: 'Library, 3rd floor', lat: 0.40, lng: 0.55 },
                theme: 'dotted',
                preview: 'Open addressing vs. chaining. Got hung up on load factor before realizing my hash was bad.',
                body: [
                  { type: 'h', text: 'PS4 reflection' },
                  { type: 'p', text: 'Spent 90 min before realizing my hash function modded by a non-prime. Switched to 31·k + c and collisions dropped 4×.' },
                  { type: 'p', text: 'Load factor target: 0.7 with linear probing, 0.9 with chaining. Past that, resize.' },
                ],
                stickies: [{ id: 's1', text: 'Prime moduli only.', x: 62, y: 22, w: 24, h: 9, hue: 320 }],
                photos: [], voice: [], backlinks: ['CIS 110 · L10 — Hashing'],
              },
              {
                id: 'e3', title: 'Group project — Library API',
                date: '2026-05-06', dow: 'Wed', time: '4:31 PM',
                mood: 'energized', weather: '74° sun',
                location: { name: 'CS Lounge', lat: 0.51, lng: 0.36 },
                theme: 'dark',
                preview: 'Divided endpoints: I take /books and /loans, Maya takes /users, Tomás writes the tests.',
                body: [
                  { type: 'p', text: 'Standup: I own /books and /loans. Maya owns /users. Tomás writes the integration tests and CI.' },
                  { type: 'p', text: 'Due Mon 5/11. Stretch goal: pagination with cursor tokens, not page numbers.' },
                ],
                stickies: [
                  { id: 's1', text: 'Push branch by Fri', x: 8, y: 16, w: 22, h: 9, hue: 30 },
                  { id: 's2', text: 'Cursor pagination ≫ offset', x: 64, y: 64, w: 28, h: 10, hue: 200 },
                ],
                photos: [], voice: [{ id: 'v1', label: 'Standup notes', dur: '2:14' }], backlinks: [],
              },
            ],
          },
          {
            id: 'aca122', name: 'College Transfer Success', code: 'ACA 122', color: 200,
            meta: 'T · 1:00 PM · Hybrid',
            entries: [
              {
                id: 'e1', title: 'Transfer planning — UNC vs. NCSU',
                date: '2026-05-15', dow: 'Fri', time: '2:08 PM',
                mood: 'thoughtful', weather: '70° partly cloudy',
                location: { name: 'Advising Center', lat: 0.34, lng: 0.62 },
                theme: 'parchment',
                preview: 'UNC has the smaller cohort but NCSU\'s CS pathway counts more of my credits.',
                locked: true,
                body: [
                  { type: 'p', text: 'Met with Dr. Reyes. UNC transfers 47 credits, NCSU transfers 53. NCSU\'s CS bridge program is the deciding factor.' },
                  { type: 'p', text: 'Application deadlines: UNC Oct 15, NCSU Nov 1. Need 2 LORs each.' },
                ],
                stickies: [{ id: 's1', text: 'Email Prof. Lin re LOR', x: 58, y: 20, w: 30, h: 10, hue: 320 }],
                photos: [], voice: [], backlinks: ['ACA 122 · Goals'],
              },
              {
                id: 'e2', title: 'Time-block experiment — week 3',
                date: '2026-05-09', dow: 'Sat', time: '8:20 AM',
                mood: 'curious', weather: '66° fog', location: null,
                theme: 'handwritten',
                preview: 'Two-hour deep blocks before 11 AM are the only thing that\'s actually moving the needle.',
                body: [{ type: 'p', text: 'Week 3 of the 2hr morning block. Coursework finished by 11. Afternoons are for everything else.' }],
                stickies: [], photos: [], voice: [], backlinks: [],
              },
            ],
          },
        ],
      },
      {
        id: 'fa25', name: 'Fall 2025', meta: 'Aug – Dec 2025',
        children: [
          { id: 'eng111', name: 'Writing & Inquiry', code: 'ENG 111', color: 30,  meta: 'completed · A−', entries: [] },
          { id: 'mat171', name: 'Precalc Algebra',  code: 'MAT 171', color: 280, meta: 'completed · B+', entries: [] },
        ],
      },
    ],
  },
  {
    id: 'work', name: 'Work', glyph: '◆', hue: 200,
    entries: [
      { id: 'w1', title: '1:1 with Sam — Q3 priorities', date: '2026-05-19', dow: 'Tue', time: '3:00 PM',
        mood: 'aligned', weather: '73° clear', location: { name: 'Café Lune', lat: 0.45, lng: 0.50 }, theme: 'dark',
        preview: 'Three things land Q3: onboarding revamp, billing migration, the analytics rebuild.',
        body: [{ type: 'p', text: 'Sam wants onboarding done by July. Billing migration is mine end-to-end. Analytics gets a dedicated PM.' }],
        stickies: [{ id: 's1', text: 'Write the onboarding doc Mon', x: 60, y: 18, w: 28, h: 10, hue: 145 }],
        photos: [], voice: [], backlinks: [] },
      { id: 'w2', title: 'Sprint retro notes', date: '2026-05-16', dow: 'Sat', time: '10:00 AM',
        mood: 'reflective', weather: '70° mild', location: null, theme: 'dotted',
        preview: 'We over-committed by 8 points. Two stories were undefined when sprint started.',
        body: [{ type: 'p', text: 'Action items: spike unknowns before commit; cap sprint at 32pts; rotate retro facilitator.' }],
        stickies: [], photos: [], voice: [], backlinks: [] },
    ],
  },
  {
    id: 'life', name: 'Life', glyph: '◉', hue: 30,
    entries: [
      { id: 'l1', title: 'Sunday at the farmers market', date: '2026-05-17', dow: 'Sun', time: '11:30 AM',
        mood: 'happy', weather: '72° sun', location: { name: 'Carrboro Plaza', lat: 0.30, lng: 0.55 }, theme: 'parchment',
        preview: 'Bought strawberries that tasted like actual strawberries. Made shortcake that afternoon.',
        body: [{ type: 'p', text: 'The farm stand at the south end had real strawberries — the kind that smell from across the table.' }],
        stickies: [{ id: 's1', text: 'Try the goat cheese stall next week', x: 62, y: 60, w: 30, h: 10, hue: 50 }],
        photos: [{ id: 'p1', label: 'Strawberries', x: 8, y: 30, w: 32, h: 24, hue: 30 }],
        voice: [], backlinks: [] },
    ],
  },
  {
    id: 'travel', name: 'Travel', glyph: '✈', hue: 280,
    entries: [
      { id: 't1', title: 'Asheville weekend', date: '2026-04-26', dow: 'Sun', time: '8:15 PM',
        mood: 'tired-good', weather: '64° rain', location: { name: 'Asheville, NC', lat: 0.22, lng: 0.30 }, theme: 'handwritten',
        preview: 'Three days, one bookstore I want to live in, and a hike that took twice as long as planned.',
        body: [{ type: 'p', text: 'Malaprop\'s. The bookstore. The one. Spent two hours and most of the rainy afternoon there.' }],
        stickies: [], photos: [{ id: 'p1', label: 'Trail map', x: 56, y: 30, w: 34, h: 26, hue: 145 }], voice: [], backlinks: [] },
    ],
  },
  {
    id: 'dreams', name: 'Dreams', glyph: '☾', hue: 320,
    entries: [
      { id: 'd1', title: 'The library that kept growing', date: '2026-05-14', dow: 'Thu', time: '4:02 AM',
        mood: 'unsettled', weather: '—', location: null, theme: 'handwritten',
        preview: 'Every time I picked up a book a new hallway appeared. I never found the exit, but I wasn\'t scared.',
        body: [{ type: 'p', text: 'The shelves rearranged themselves when I wasn\'t looking. I think this is about the transfer decision.' }],
        stickies: [], photos: [], voice: [], backlinks: ['Life · Transfer planning'] },
    ],
  },
];

Object.assign(window, { JOURNALS, ENTRIES, THEMES, Icon, I, fmtDate, relDate, INITIAL_SECTIONS });
