/* global window, React */
// ─── Three visual skin configs + background components ─────────────

(() => {

// 1. Restrained: solid deep black + barely-there noise
function RestrainedBg({ theme }) {
  const dark = theme === 'dark';
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: dark ? '#08080a' : '#f6f4ee',
      }}/>
      <div style={{
        position: 'absolute', inset: 0, opacity: dark ? 0.25 : 0.18,
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.08 0\'/></filter><rect width=\'140\' height=\'140\' filter=\'url(%23n)\'/></svg>")',
        mixBlendMode: dark ? 'screen' : 'multiply',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: dark
          ? 'radial-gradient(ellipse at 50% -10%, rgba(255,255,255,0.04), transparent 60%)'
          : 'radial-gradient(ellipse at 50% -10%, rgba(0,0,0,0.04), transparent 60%)',
      }}/>
    </div>
  );
}

// 2. Moderate: ambient orbs floating behind blur
function ModerateBg({ theme }) {
  const dark = theme === 'dark';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: dark
          ? 'linear-gradient(180deg, #0a0a0d 0%, #0c0e10 100%)'
          : 'linear-gradient(180deg, #f7f5ee 0%, #f0eee5 100%)',
      }}/>
      <Orb top="-18%" left="-12%" hue={145} dark={dark} size={620} delay={0} />
      <Orb top="10%"  left="62%" hue={200} dark={dark} size={520} delay={4} />
      <Orb top="58%"  left="-8%" hue={280} dark={dark} size={460} delay={8} />
      <Orb top="68%"  left="58%" hue={50}  dark={dark} size={520} delay={12} />
      <div style={{
        position: 'absolute', inset: 0,
        backdropFilter: 'blur(100px) saturate(140%)',
        WebkitBackdropFilter: 'blur(100px) saturate(140%)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.10 0\'/></filter><rect width=\'140\' height=\'140\' filter=\'url(%23n)\'/></svg>")',
        mixBlendMode: dark ? 'screen' : 'multiply',
      }}/>
    </div>
  );
}

function Orb({ top, left, hue, dark, size, delay }) {
  return (
    <div style={{
      position: 'absolute', top, left, width: size, height: size, borderRadius: '50%',
      background: dark
        ? `radial-gradient(circle at 40% 40%, oklch(0.65 0.20 ${hue} / 0.55), oklch(0.55 0.18 ${hue} / 0) 70%)`
        : `radial-gradient(circle at 40% 40%, oklch(0.78 0.18 ${hue} / 0.55), oklch(0.85 0.10 ${hue} / 0) 70%)`,
      filter: 'blur(8px)',
      animation: `orbFloat 22s ease-in-out ${delay}s infinite`,
    }}/>
  );
}

// 3. Bold: animated aurora mesh
function BoldBg({ theme }) {
  const dark = theme === 'dark';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: dark ? '#06060a' : '#f1efe7',
      }}/>
      {/* Three layered animated radial gradients */}
      <div className="aurora-layer aurora-1" style={{
        background: dark
          ? 'radial-gradient(closest-side at 20% 30%, oklch(0.75 0.20 145 / 0.65), transparent 70%)'
          : 'radial-gradient(closest-side at 20% 30%, oklch(0.85 0.16 145 / 0.55), transparent 70%)',
      }}/>
      <div className="aurora-layer aurora-2" style={{
        background: dark
          ? 'radial-gradient(closest-side at 80% 60%, oklch(0.65 0.22 280 / 0.55), transparent 70%)'
          : 'radial-gradient(closest-side at 80% 60%, oklch(0.78 0.18 280 / 0.45), transparent 70%)',
      }}/>
      <div className="aurora-layer aurora-3" style={{
        background: dark
          ? 'radial-gradient(closest-side at 50% 90%, oklch(0.70 0.20 30 / 0.45), transparent 70%)'
          : 'radial-gradient(closest-side at 50% 90%, oklch(0.82 0.16 30 / 0.40), transparent 70%)',
      }}/>
      <div className="aurora-layer aurora-4" style={{
        background: dark
          ? 'radial-gradient(closest-side at 60% 15%, oklch(0.72 0.22 200 / 0.50), transparent 70%)'
          : 'radial-gradient(closest-side at 60% 15%, oklch(0.82 0.16 200 / 0.45), transparent 70%)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        backdropFilter: 'blur(80px) saturate(160%)',
        WebkitBackdropFilter: 'blur(80px) saturate(160%)',
      }}/>
      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.18,
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.12 0\'/></filter><rect width=\'140\' height=\'140\' filter=\'url(%23n)\'/></svg>")',
        mixBlendMode: dark ? 'screen' : 'multiply',
      }}/>
      {/* Diagonal sheen overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        background: 'linear-gradient(115deg, transparent 40%, white 50%, transparent 60%)',
      }}/>
    </div>
  );
}

// Skin configs
const SKINS = {
  restrained: {
    id: 'restrained',
    name: 'Restrained',
    accent: 'oklch(0.78 0.16 145)',
    accentSoft: 'oklch(0.78 0.16 145 / 0.18)',
    background: RestrainedBg,
  },
  moderate: {
    id: 'moderate',
    name: 'Moderate',
    accent: 'oklch(0.80 0.16 145)',
    accentSoft: 'oklch(0.80 0.16 145 / 0.22)',
    background: ModerateBg,
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    accent: 'oklch(0.82 0.18 145)',
    accentSoft: 'oklch(0.82 0.18 145 / 0.28)',
    background: BoldBg,
  },
};

Object.assign(window, { SKINS });
})();
