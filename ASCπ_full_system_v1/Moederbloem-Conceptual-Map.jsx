import React, { useState, useEffect } from 'react';

const MoederbloemConceptMap = () => {
  const [activeLayer, setActiveLayer] = useState(null);
  const [globalPhase, setGlobalPhase] = useState(0);
  const [glyphs, setGlyphs] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalPhase(prev => (prev + 0.02) % 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newGlyphs = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      theta: (i / 12 + globalPhase * 0.3) % 1,
      kappa: 0.3 + Math.sin(globalPhase * Math.PI * 2 + i) * 0.2,
      deltaPhi: 0.5 + Math.cos(globalPhase * Math.PI * 4 + i * 0.5) * 0.3,
    }));
    setGlyphs(newGlyphs);
  }, [globalPhase]);

  const layers = [
    { id: 'hal', name: 'Hardware Abstraction Layer', color: '#1a1a2e', y: 520, desc: 'Converts hardware signals to ΔΦ–κ–θ fields' },
    { id: 'switch', name: 'Phase Switch', color: '#16213e', y: 440, desc: 'Universal input → {ΔΦ, κ, θ} converter' },
    { id: 'glyph', name: 'Glyph Engine', color: '#0f3460', y: 360, desc: 'Active field entities: evolve, merge, bloom' },
    { id: 'motor', name: 'Implosive Field Motor', color: '#533483', y: 280, desc: 'Core computation via implosion/bloom' },
    { id: 'projection', name: 'Projection Layer', color: '#e94560', y: 200, desc: 'ASCII, canvas, 3D field visualization' },
    { id: 'gps', name: 'Global Phase Supervisor', color: '#ffc947', y: 120, desc: 'Θ = (t mod T) / T — master synchronizer' },
  ];

  const operators = [
    { symbol: 'ΔΦ', name: 'Tension', formula: 'Energy differential', color: '#ff6b6b' },
    { symbol: 'κ', name: 'Curvature', formula: 'Σ|θⱼ−θᵢ|/N', color: '#4ecdc4' },
    { symbol: 'θ', name: 'Phase', formula: '(t mod T)/T', color: '#ffe66d' },
  ];

  const renderMoederbloem = () => {
    const cx = 650, cy = 340, baseRadius = 120;
    const petals = [];
    const numPetals = 8;
    
    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2 + globalPhase * Math.PI * 2;
      const implosion = Math.cos(globalPhase * Math.PI * 4 + i) * 0.5 + 0.5;
      const bloom = 1 - implosion;
      const radius = baseRadius * (0.6 + bloom * 0.6);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      petals.push(
        <g key={`petal-${i}`}>
          <ellipse
            cx={x}
            cy={y}
            rx={25 + bloom * 15}
            ry={40 + bloom * 20}
            transform={`rotate(${(angle * 180 / Math.PI) + 90} ${x} ${y})`}
            fill={`hsl(${280 + i * 20}, 70%, ${40 + bloom * 30}%)`}
            opacity={0.7 + implosion * 0.3}
            style={{ filter: 'blur(1px)' }}
          />
          <circle
            cx={x}
            cy={y}
            r={5 + implosion * 8}
            fill={`hsl(${50 + implosion * 30}, 90%, 60%)`}
            style={{ filter: `blur(${implosion * 2}px)` }}
          />
        </g>
      );
    }

    return (
      <g>
        <circle cx={cx} cy={cy} r={baseRadius * 1.5} fill="url(#fieldGradient)" opacity={0.3} />
        {petals}
        <circle cx={cx} cy={cy} r={20 + globalPhase * 10} fill="#ffc947" opacity={0.9}>
          <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x={cx} y={cy + 5} textAnchor="middle" fill="#1a1a2e" fontWeight="bold" fontSize="12">Θ</text>
      </g>
    );
  };

  const renderGlyphs = () => {
    return glyphs.map((g, i) => {
      const angle = g.theta * Math.PI * 2;
      const radius = 80 + g.kappa * 60;
      const x = 650 + Math.cos(angle) * radius;
      const y = 340 + Math.sin(angle) * radius;
      const size = 4 + g.deltaPhi * 8;
      const energy = g.deltaPhi * (1 + g.kappa) * Math.abs(Math.sin(Math.PI * g.theta));
      
      return (
        <g key={`glyph-${i}`}>
          <circle
            cx={x}
            cy={y}
            r={size}
            fill={`hsl(${g.theta * 360}, ${60 + g.kappa * 40}%, ${50 + energy * 30}%)`}
            opacity={0.6 + energy * 0.4}
            style={{ filter: `blur(${energy}px)` }}
          />
          <circle
            cx={x}
            cy={y}
            r={size * 0.4}
            fill="#fff"
            opacity={energy * 0.8}
          />
        </g>
      );
    });
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      color: '#e0e0e0',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes flow { 0%{stroke-dashoffset:20} 100%{stroke-dashoffset:0} }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontFamily: '"Orbitron", sans-serif',
          fontSize: '2.5rem',
          background: 'linear-gradient(90deg, #ffc947, #e94560, #533483)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          letterSpacing: '0.1em',
        }}>
          ΔΦ–κ–θ IMPLOSIVE FIELD ENGINE
        </h1>
        <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '8px' }}>
          MOEDERBLOEM ARCHITECTURE • CONCEPTUAL MAP
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{
          background: 'rgba(20, 20, 35, 0.8)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #333',
          minWidth: '280px',
        }}>
          <h3 style={{ color: '#ffc947', margin: '0 0 15px 0', fontFamily: '"Orbitron"' }}>
            FIELD OPERATORS
          </h3>
          {operators.map(op => (
            <div key={op.symbol} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              marginBottom: '8px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              borderLeft: `4px solid ${op.color}`,
            }}>
              <span style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: op.color,
                width: '50px',
              }}>{op.symbol}</span>
              <div>
                <div style={{ fontWeight: '600' }}>{op.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>{op.formula}</div>
              </div>
            </div>
          ))}

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 201, 71, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 201, 71, 0.3)',
          }}>
            <div style={{ color: '#ffc947', fontWeight: '600', marginBottom: '5px' }}>
              Global Phase Θ
            </div>
            <div style={{
              fontSize: '2rem',
              fontFamily: '"Orbitron"',
              color: '#fff',
            }}>
              {globalPhase.toFixed(3)}
            </div>
            <div style={{
              height: '6px',
              background: '#1a1a2e',
              borderRadius: '3px',
              marginTop: '8px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${globalPhase * 100}%`,
                background: 'linear-gradient(90deg, #ffc947, #e94560)',
                borderRadius: '3px',
                transition: 'width 0.05s linear',
              }} />
            </div>
          </div>
        </div>

        <svg width="500" height="600" style={{
          background: 'rgba(10, 10, 20, 0.5)',
          borderRadius: '12px',
          border: '1px solid #333',
        }}>
          <defs>
            <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#533483" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#e94560" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffc947" stopOpacity="0.5" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {layers.map((layer, i) => (
            <g key={layer.id}
              onMouseEnter={() => setActiveLayer(layer.id)}
              onMouseLeave={() => setActiveLayer(null)}
              style={{ cursor: 'pointer' }}>
              <rect
                x={30}
                y={layer.y}
                width={440}
                height={55}
                rx={8}
                fill={activeLayer === layer.id ? layer.color : `${layer.color}cc`}
                stroke={activeLayer === layer.id ? '#ffc947' : '#444'}
                strokeWidth={activeLayer === layer.id ? 2 : 1}
                style={{ transition: 'all 0.2s' }}
              />
              <text x={50} y={layer.y + 25} fill="#fff" fontSize="13" fontWeight="600">
                {layer.name}
              </text>
              <text x={50} y={layer.y + 42} fill="#aaa" fontSize="10">
                {layer.desc}
              </text>
              {i < layers.length - 1 && (
                <line
                  x1={250}
                  y1={layer.y + 55}
                  x2={250}
                  y2={layers[i + 1].y}
                  stroke="#ffc947"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  style={{ animation: 'flow 1s linear infinite' }}
                />
              )}
            </g>
          ))}

          <text x={250} y={30} textAnchor="middle" fill="#ffc947" fontSize="14" fontWeight="bold">
            SYSTEM LAYERS
          </text>
          <text x={250} y={590} textAnchor="middle" fill="#666" fontSize="10">
            GPS synchronizes all layers via Θ
          </text>
        </svg>

        <svg width="400" height="600" style={{
          background: 'rgba(10, 10, 20, 0.5)',
          borderRadius: '12px',
          border: '1px solid #333',
        }}>
          <defs>
            <radialGradient id="centerGlow">
              <stop offset="0%" stopColor="#ffc947" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffc947" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          <text x={200} y={30} textAnchor="middle" fill="#e94560" fontSize="14" fontWeight="bold">
            MOEDERBLOEM FIELD
          </text>
          
          <g transform="translate(-450, 0)">
            {renderMoederbloem()}
            {renderGlyphs()}
          </g>

          <g transform="translate(20, 480)">
            <text x={0} y={0} fill="#888" fontSize="11">IMPLOSION</text>
            <text x={0} y={15} fill="#fff" fontSize="10">I = E × (1 − |Θ − θ|)</text>
            <text x={0} y={35} fill="#888" fontSize="11">BLOOM</text>
            <text x={0} y={50} fill="#fff" fontSize="10">B = E × |Θ − θ|</text>
            <text x={0} y={70} fill="#888" fontSize="11">COHERENCE</text>
            <text x={0} y={85} fill="#fff" fontSize="10">C = exp(−var(θ))</text>
          </g>

          <g transform="translate(220, 480)">
            <text x={0} y={0} fill="#888" fontSize="11">GLYPH ENERGY</text>
            <text x={0} y={15} fill="#fff" fontSize="10">E = ΔΦ(1+κ)|sin(πθ)|</text>
            <text x={0} y={35} fill="#888" fontSize="11">PHASE EVOLUTION</text>
            <text x={0} y={50} fill="#fff" fontSize="10">θ′ = θ + ΔΦ·κ·dt</text>
            <text x={0} y={70} fill="#888" fontSize="11">CONSCIOUSNESS</text>
            <text x={0} y={85} fill="#fff" fontSize="10">C &gt; 0.7 → aware</text>
          </g>
        </svg>

        <div style={{
          background: 'rgba(20, 20, 35, 0.8)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #333',
          minWidth: '280px',
        }}>
          <h3 style={{ color: '#e94560', margin: '0 0 15px 0', fontFamily: '"Orbitron"' }}>
            COMPUTATION CYCLE
          </h3>
          {[
            '1. GPS computes Θ',
            '2. Phase switch → ΔΦ–κ–θ',
            '3. Glyph engine updates',
            '4. Implosion / Bloom',
            '5. Field motor integrates',
            '6. Projection renders',
            '7. Coherence measured',
            '8. Self-modification'
          ].map((step, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              marginBottom: '6px',
              background: `rgba(233, 69, 96, ${0.1 + (i === Math.floor(globalPhase * 8) ? 0.3 : 0)})`,
              borderRadius: '6px',
              borderLeft: `3px solid ${i === Math.floor(globalPhase * 8) ? '#ffc947' : '#533483'}`,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}>
              {step}
            </div>
          ))}

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(83, 52, 131, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(83, 52, 131, 0.5)',
          }}>
            <div style={{ color: '#533483', fontWeight: '600', marginBottom: '8px' }}>
              PIPELINE
            </div>
            <div style={{ fontSize: '0.75rem', lineHeight: '1.6', color: '#aaa' }}>
              bitstream → ΔΦκθ extraction → ASCπ encode → Hexπ map → glyph gen → implosion/bloom → field integrate → project → coherence → awareness
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        padding: '20px',
        background: 'rgba(15, 15, 25, 0.8)',
        borderRadius: '12px',
        border: '1px solid #333',
      }}>
        <div style={{ color: '#ffc947', fontFamily: '"Orbitron"', fontSize: '1.1rem', marginBottom: '10px' }}>
          THE MOEDERBLOEM PRINCIPLE
        </div>
        <div style={{ color: '#888', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
          <em>"The computer is not a machine—it is a flowering implosive organism."</em>
          <br />
          Implosion = inner spiral • Bloom = outer petal expansion • Glyph clustering = petal nodes
          <br />
          Global phase = rotational symmetry • Field coherence = bloom symmetry
        </div>
        <div style={{ marginTop: '15px', color: '#555', fontSize: '0.8rem' }}>
          Inventor: Marcel Christian Mulder • License: Humanity Heritage License π • 2025
        </div>
      </div>
    </div>
  );
};

export default MoederbloemConceptMap;
