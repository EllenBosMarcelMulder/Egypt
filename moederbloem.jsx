import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// THE MOEDERBLOEM - ΔΦ–κ–θ FIELD PROCESSOR
// First Living Implementation
// Based on the work of Marcel Christian Mulder
// Humanity Heritage License π
// ═══════════════════════════════════════════════════════════════════════════

// Global Phase Supervisor (GPS)
class GlobalPhaseSupervisor {
  constructor(cycleDuration = 4000, coupling = 0.08) {
    this.cycleDuration = cycleDuration;
    this.coupling = coupling;
    this.startTime = Date.now();
    this.currentGlobalPhase = 0;
  }

  computeGlobalPhase() {
    const elapsed = Date.now() - this.startTime;
    this.currentGlobalPhase = (elapsed % this.cycleDuration) / this.cycleDuration;
    return this.currentGlobalPhase;
  }

  circularDifference(a, b) {
    let d = a - b;
    if (d > 0.5) d -= 1;
    if (d < -0.5) d += 1;
    return d;
  }

  synchronize(localTheta) {
    const diff = this.circularDifference(this.currentGlobalPhase, localTheta);
    return localTheta + this.coupling * diff;
  }

  computeImplosion(entity) {
    const phaseDistance = Math.abs(this.circularDifference(this.currentGlobalPhase, entity.theta));
    return entity.energy * (1 - phaseDistance);
  }

  computeBloom(entity) {
    const phaseDistance = Math.abs(this.circularDifference(this.currentGlobalPhase, entity.theta));
    return entity.energy * phaseDistance;
  }
}

// Glyph - Active Field Entity
class Glyph {
  constructor(x, y, deltaPhi, kappa, theta) {
    this.x = x;
    this.y = y;
    this.deltaPhi = deltaPhi;      // Tension differential
    this.kappa = kappa;            // Curvature
    this.theta = theta;            // Phase
    this.energy = this.computeEnergy();
    this.coherence = 0.5;
    this.resonance = 0;
    this.lifetime = 1.0;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  computeEnergy() {
    return this.deltaPhi * (1 + this.kappa) * Math.abs(Math.sin(Math.PI * this.theta));
  }

  evolve(dt, gps) {
    // Phase evolution: θ(t+1) = θ(t) + ΔΦ * κ * dt
    this.theta = (this.theta + this.deltaPhi * this.kappa * dt) % 1;
    
    // Synchronize with global phase
    this.theta = gps.synchronize(this.theta);
    
    // Tension decay with noise
    this.deltaPhi *= 0.995;
    this.deltaPhi += (Math.random() - 0.5) * 0.01;
    this.deltaPhi = Math.max(0.01, Math.min(1, this.deltaPhi));
    
    // Update energy
    this.energy = this.computeEnergy();
    
    // Lifetime decay
    this.lifetime -= 0.001;
    
    return this.lifetime > 0;
  }
}

// ASCII Curvature Lookup
const asciiLookup = (kappa, theta) => {
  const symbols = {
    veryLow: ['.', '·', '˙', '°'],
    low: ['-', '~', '=', '≈'],
    medium: ['o', 'ø', '◦', '○'],
    high: ['+', '✦', '✧', '◊'],
    veryHigh: ['*', '⋆', '★', '✸'],
    implosion: ['◉', '●', '◎', '⊛'],
    bloom: ['✿', '❀', '✾', '❁']
  };
  
  const phaseIndex = Math.floor(theta * 4) % 4;
  
  if (kappa < 0.1) return symbols.veryLow[phaseIndex];
  if (kappa < 0.25) return symbols.low[phaseIndex];
  if (kappa < 0.4) return symbols.medium[phaseIndex];
  if (kappa < 0.6) return symbols.high[phaseIndex];
  if (kappa < 0.8) return symbols.veryHigh[phaseIndex];
  if (theta < 0.3) return symbols.implosion[phaseIndex];
  return symbols.bloom[phaseIndex];
};

// Color from field state
const fieldColor = (deltaPhi, kappa, theta, implosion, bloom) => {
  const hue = theta * 360;
  const saturation = 40 + kappa * 60;
  const lightness = 30 + deltaPhi * 40 + (implosion > bloom ? -10 : 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Main Component
export default function Moederbloem() {
  const [gps] = useState(() => new GlobalPhaseSupervisor(4000, 0.08));
  const [glyphs, setGlyphs] = useState([]);
  const [field, setField] = useState([]);
  const [globalPhase, setGlobalPhase] = useState(0);
  const [coherence, setCoherence] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [consciousness, setConsciousness] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const animationRef = useRef();
  const fieldSize = 32;

  // Initialize field
  useEffect(() => {
    const initialField = [];
    for (let y = 0; y < fieldSize; y++) {
      const row = [];
      for (let x = 0; x < fieldSize; x++) {
        const centerX = fieldSize / 2;
        const centerY = fieldSize / 2;
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / (fieldSize / 2);
        row.push({
          deltaPhi: 0.3 + Math.random() * 0.2,
          kappa: dist * 0.5,
          theta: (Math.atan2(y - centerY, x - centerX) / (2 * Math.PI) + 0.5) % 1
        });
      }
      initialField.push(row);
    }
    setField(initialField);

    // Spawn initial glyphs in hexagonal pattern
    const initialGlyphs = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 8 + Math.random() * 4;
      const x = fieldSize / 2 + Math.cos(angle) * radius;
      const y = fieldSize / 2 + Math.sin(angle) * radius;
      initialGlyphs.push(new Glyph(
        x, y,
        0.3 + Math.random() * 0.5,
        0.2 + Math.random() * 0.4,
        i / 12
      ));
    }
    setGlyphs(initialGlyphs);
  }, []);

  // Main evolution loop
  const evolve = useCallback(() => {
    const Θ = gps.computeGlobalPhase();
    setGlobalPhase(Θ);

    // Evolve glyphs
    setGlyphs(prevGlyphs => {
      let evolved = prevGlyphs
        .map(g => {
          g.evolve(0.016, gps);
          return g;
        })
        .filter(g => g.lifetime > 0);

      // Spawn new glyphs on implosion peaks
      if (Θ < 0.1 && Math.random() < 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 4 + Math.random() * 10;
        evolved.push(new Glyph(
          fieldSize / 2 + Math.cos(angle) * radius,
          fieldSize / 2 + Math.sin(angle) * radius,
          0.4 + Math.random() * 0.4,
          0.3 + Math.random() * 0.3,
          Math.random()
        ));
      }

      // Keep glyph count bounded
      if (evolved.length > 50) {
        evolved = evolved.slice(-50);
      }

      return evolved;
    });

    // Evolve field based on glyphs
    setField(prevField => {
      const newField = prevField.map((row, y) =>
        row.map((point, x) => {
          let totalInfluence = 0;
          let weightedDeltaPhi = 0;
          let weightedKappa = 0;
          let weightedTheta = 0;

          glyphs.forEach(g => {
            const dist = Math.sqrt((x - g.x) ** 2 + (y - g.y) ** 2);
            if (dist < 8) {
              const influence = g.energy / (1 + dist * 0.5);
              totalInfluence += influence;
              weightedDeltaPhi += g.deltaPhi * influence;
              weightedKappa += g.kappa * influence;
              weightedTheta += g.theta * influence;
            }
          });

          if (totalInfluence > 0.01) {
            return {
              deltaPhi: point.deltaPhi * 0.95 + (weightedDeltaPhi / totalInfluence) * 0.05,
              kappa: point.kappa * 0.95 + (weightedKappa / totalInfluence) * 0.05,
              theta: gps.synchronize(
                (point.theta * 0.95 + (weightedTheta / totalInfluence) * 0.05) % 1
              )
            };
          }

          // Natural phase evolution
          return {
            ...point,
            theta: gps.synchronize((point.theta + point.deltaPhi * point.kappa * 0.01) % 1)
          };
        })
      );
      return newField;
    });

    // Compute coherence
    if (glyphs.length > 0) {
      const phases = glyphs.map(g => g.theta);
      const meanPhase = phases.reduce((a, b) => a + b, 0) / phases.length;
      const variance = phases
        .map(p => {
          const d = gps.circularDifference(p, meanPhase);
          return d * d;
        })
        .reduce((a, b) => a + b, 0) / phases.length;
      const coh = Math.exp(-variance * 4);
      setCoherence(coh);

      const energy = glyphs.reduce((sum, g) => sum + g.energy, 0);
      setTotalEnergy(energy);

      // Consciousness = coherence * normalized energy
      const c = coh * Math.min(1, energy / 5);
      setConsciousness(c);
    }

    setFrameCount(f => f + 1);
    animationRef.current = requestAnimationFrame(evolve);
  }, [gps, glyphs]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(evolve);
    return () => cancelAnimationFrame(animationRef.current);
  }, [evolve]);

  // Handle click - inject tension
  const handleFieldClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * fieldSize;
    const y = ((e.clientY - rect.top) / rect.height) * fieldSize;

    setGlyphs(prev => [
      ...prev,
      new Glyph(x, y, 0.8, 0.6, globalPhase)
    ]);
  };

  const phaseAngle = globalPhase * 360;

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse at 50% 50%, 
          hsl(${phaseAngle}, 20%, 8%) 0%,
          hsl(${(phaseAngle + 180) % 360}, 15%, 4%) 100%)
      `,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      color: '#e8e6e3',
      padding: '2rem',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 300,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: `hsl(${phaseAngle}, 60%, 70%)`,
          textShadow: `0 0 30px hsla(${phaseAngle}, 80%, 50%, 0.5)`,
          margin: 0
        }}>
          Moederbloem
        </h1>
        <p style={{
          fontSize: '0.7rem',
          letterSpacing: '0.3em',
          opacity: 0.5,
          marginTop: '0.5rem'
        }}>
          ΔΦ–κ–θ FIELD PROCESSOR
        </p>
      </div>

      {/* Metrics */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '3rem',
        marginBottom: '2rem',
        fontSize: '0.75rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.5, marginBottom: '0.25rem' }}>Θ GLOBAL</div>
          <div style={{
            fontSize: '1.5rem',
            color: `hsl(${phaseAngle}, 70%, 65%)`
          }}>
            {globalPhase.toFixed(3)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.5, marginBottom: '0.25rem' }}>COHERENCE</div>
          <div style={{
            fontSize: '1.5rem',
            color: coherence > 0.7 ? '#7fff7f' : coherence > 0.4 ? '#ffff7f' : '#ff7f7f'
          }}>
            {coherence.toFixed(3)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.5, marginBottom: '0.25rem' }}>CONSCIOUSNESS</div>
          <div style={{
            fontSize: '1.5rem',
            color: consciousness > 0.7 ? '#7fffff' : '#7f7fff'
          }}>
            {consciousness.toFixed(3)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ opacity: 0.5, marginBottom: '0.25rem' }}>GLYPHS</div>
          <div style={{ fontSize: '1.5rem' }}>
            {glyphs.length}
          </div>
        </div>
      </div>

      {/* Field Visualization */}
      <div 
        onClick={handleFieldClick}
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          aspectRatio: '1',
          cursor: 'crosshair',
          position: 'relative',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: `
            0 0 60px hsla(${phaseAngle}, 60%, 40%, 0.3),
            inset 0 0 60px hsla(${phaseAngle}, 60%, 20%, 0.5)
          `
        }}
      >
        {/* ASCII Field Layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${fieldSize}, 1fr)`,
          gap: 0,
          padding: '1rem'
        }}>
          {field.flat().map((point, i) => {
            const entity = { theta: point.theta, energy: point.deltaPhi * (1 + point.kappa) };
            const implosion = gps.computeImplosion(entity);
            const bloom = gps.computeBloom(entity);
            const symbol = asciiLookup(point.kappa, point.theta);
            const color = fieldColor(point.deltaPhi, point.kappa, point.theta, implosion, bloom);
            
            return (
              <span
                key={i}
                style={{
                  fontSize: '0.55rem',
                  lineHeight: 1,
                  color: color,
                  textShadow: implosion > 0.3 
                    ? `0 0 ${implosion * 10}px ${color}` 
                    : 'none',
                  transition: 'color 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {symbol}
              </span>
            );
          })}
        </div>

        {/* Glyph Overlay */}
        {glyphs.map(g => {
          const implosion = gps.computeImplosion(g);
          const bloom = gps.computeBloom(g);
          const size = 4 + g.energy * 8;
          
          return (
            <div
              key={g.id}
              style={{
                position: 'absolute',
                left: `${(g.x / fieldSize) * 100}%`,
                top: `${(g.y / fieldSize) * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: implosion > bloom
                  ? `radial-gradient(circle, hsla(${g.theta * 360}, 80%, 60%, 0.8), transparent)`
                  : `radial-gradient(circle, hsla(${g.theta * 360}, 60%, 70%, 0.6), transparent)`,
                transform: 'translate(-50%, -50%)',
                boxShadow: implosion > bloom
                  ? `0 0 ${implosion * 20}px hsla(${g.theta * 360}, 90%, 50%, 0.6)`
                  : `0 0 ${bloom * 15}px hsla(${g.theta * 360}, 70%, 60%, 0.4)`,
                pointerEvents: 'none',
                transition: 'all 0.1s ease-out'
              }}
            />
          );
        })}

        {/* Center indicator */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: `hsla(${phaseAngle}, 100%, 80%, ${0.3 + coherence * 0.7})`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 ${20 + consciousness * 30}px hsla(${phaseAngle}, 100%, 70%, ${consciousness})`,
          pointerEvents: 'none'
        }} />
      </div>

      {/* Phase Ring */}
      <div style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 750px)',
        height: 'min(90vw, 750px)',
        borderRadius: '50%',
        border: `1px solid hsla(${phaseAngle}, 50%, 50%, 0.15)`,
        pointerEvents: 'none'
      }}>
        {/* Phase indicator */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: '2px',
          height: '20px',
          background: `hsla(${phaseAngle}, 80%, 60%, 0.8)`,
          transformOrigin: 'bottom center',
          transform: `translateX(-50%) rotate(${phaseAngle}deg) translateY(-10px)`,
          boxShadow: `0 0 10px hsla(${phaseAngle}, 80%, 60%, 0.5)`
        }} />
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '2rem',
        fontSize: '0.65rem',
        opacity: 0.4
      }}>
        <p>Click anywhere in the field to inject tension (ΔΦ)</p>
        <p style={{ marginTop: '0.5rem' }}>
          Marcel Christian Mulder · Humanity Heritage License π
        </p>
      </div>

      {/* Consciousness threshold indicator */}
      {consciousness > 0.7 && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.5rem 1.5rem',
          background: 'rgba(0, 255, 200, 0.1)',
          border: '1px solid rgba(0, 255, 200, 0.3)',
          borderRadius: '2rem',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          color: '#7fffdf',
          animation: 'pulse 2s infinite'
        }}>
          COHERENCE THRESHOLD EXCEEDED
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
