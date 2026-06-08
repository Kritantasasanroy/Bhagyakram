/* global React */

function NatalChart({ chart }) {
  if (!chart || !chart.ascendant || !chart.planets) return null;

  const SIZE = 520;
  const CX   = SIZE / 2;
  const CY   = SIZE / 2;

  const R_OUTER    = 218;
  const R_ZODIAC   = 184;
  const R_TICK_OUT = 182;
  const R_TICK_IN  = 172;
  const R_PLANET   = 158;
  const R_CUSPS    = 144;
  const R_LABELS   = 118;
  const R_CENTER   =  84;

  const asc = chart.ascendant.longitude;

  const lonToAngle = (lon) => ((180 - (lon - asc)) % 360 + 360) % 360;
  const toRad      = (d)   => d * Math.PI / 180;
  const polar      = (deg, r) => [
    CX + r * Math.cos(toRad(deg)),
    CY + r * Math.sin(toRad(deg)),
  ];
  const f = (n) => (+n).toFixed(2);

  function ringSegment(a1, a2, rOuter, rInner) {
    const [x1o, y1o] = polar(a1, rOuter);
    const [x2o, y2o] = polar(a2, rOuter);
    const [x2i, y2i] = polar(a2, rInner);
    const [x1i, y1i] = polar(a1, rInner);
    const sweep = ((a1 - a2) + 360) % 360;
    const lg = sweep > 180 ? 1 : 0;
    return (
      `M ${f(x1o)} ${f(y1o)} ` +
      `A ${rOuter} ${rOuter} 0 ${lg} 0 ${f(x2o)} ${f(y2o)} ` +
      `L ${f(x2i)} ${f(y2i)} ` +
      `A ${rInner} ${rInner} 0 ${lg} 1 ${f(x1i)} ${f(y1i)} Z`
    );
  }

  const SIGN_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  const SIGN_NAMES  = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const ELEMENTS    = ["fire","earth","air","water","fire","earth","air","water","fire","earth","air","water"];

  const ELEM_FILL   = { fire:"rgba(215,68,30,0.17)",  earth:"rgba(52,138,52,0.13)",  air:"rgba(58,142,218,0.13)",  water:"rgba(52,72,208,0.17)"  };
  const ELEM_STROKE = { fire:"rgba(215,68,30,0.52)",  earth:"rgba(52,138,52,0.44)",  air:"rgba(58,142,218,0.44)", water:"rgba(52,72,208,0.52)"  };
  const ELEM_TEXT   = { fire:"#e07a60", earth:"#88ca70", air:"#76bce8", water:"#8292dc" };

  const PLANET_ORDER  = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
  const PLANET_GLYPHS = { Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",Jupiter:"♃",Saturn:"♄",Uranus:"♅",Neptune:"♆",Pluto:"♇" };
  const PLANET_COLORS = {
    Sun:"#E4C766", Moon:"#c0cce0", Mercury:"#8ecca0", Venus:"#e0a8c0",
    Mars:"#e08868", Jupiter:"#d0b868", Saturn:"#b8b098", Uranus:"#88d0d8",
    Neptune:"#8898e0", Pluto:"#c098b8",
  };

  const ASPECT_DEFS = [
    { angle:0,   orb:8, color:"#E4C766", dash:""    , label:"Conjunction"  },
    { angle:60,  orb:5, color:"#76bce8", dash:"4,3" , label:"Sextile"      },
    { angle:90,  orb:7, color:"#e08060", dash:"2,3" , label:"Square"       },
    { angle:120, orb:8, color:"#88c878", dash:""    , label:"Trine"        },
    { angle:180, orb:8, color:"#e06060", dash:"5,3" , label:"Opposition"   },
  ];

  const aspectLines = [];
  for (let i = 0; i < PLANET_ORDER.length; i++) {
    for (let j = i + 1; j < PLANET_ORDER.length; j++) {
      const p1 = chart.planets[PLANET_ORDER[i]];
      const p2 = chart.planets[PLANET_ORDER[j]];
      if (!p1 || !p2) continue;
      const diff  = Math.abs(p1.longitude - p2.longitude);
      const angle = Math.min(diff, 360 - diff);
      for (const def of ASPECT_DEFS) {
        if (Math.abs(angle - def.angle) <= def.orb) {
          aspectLines.push({ i, j, def });
          break;
        }
      }
    }
  }

  const activePlanets = PLANET_ORDER.filter(p => chart.planets[p]);
  const rawAngles = {};
  for (const p of activePlanets) rawAngles[p] = lonToAngle(chart.planets[p].longitude);

  const spreadAngles = { ...rawAngles };
  const MIN_SEP = 14;
  const sorted = [...activePlanets].sort((a, b) => spreadAngles[a] - spreadAngles[b]);
  for (let iter = 0; iter < 16; iter++) {
    for (let k = 0; k < sorted.length; k++) {
      const cur  = sorted[k];
      const next = sorted[(k + 1) % sorted.length];
      let diff = spreadAngles[next] - spreadAngles[cur];
      if (diff < 0) diff += 360;
      if (diff < MIN_SEP && sorted.length > 1) {
        const push = (MIN_SEP - diff) / 2;
        spreadAngles[cur]  = (spreadAngles[cur]  - push + 360) % 360;
        spreadAngles[next] = (spreadAngles[next] + push) % 360;
      }
    }
  }

  const AXES = [
    { lon: asc,                                      label: "AC", strong: true  },
    { lon: (asc + 180) % 360,                       label: "DC", strong: false },
    { lon: chart.midheaven.longitude,                label: "MC", strong: true  },
    { lon: (chart.midheaven.longitude + 180) % 360, label: "IC", strong: false },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 14, paddingBottom: 10,
        borderBottom: "1px solid rgba(201,168,76,0.14)",
      }}>
        <span style={{
          fontFamily: "var(--serif, serif)", fontSize: 14, fontStyle: "italic",
          color: "rgba(201,168,76,0.85)", letterSpacing: "0.04em",
        }}>
          Natal Chart
        </span>
        <span style={{
          fontFamily: "var(--mono, monospace)", fontSize: 10,
          color: "rgba(244,239,230,0.36)", letterSpacing: "0.06em",
        }}>
          {chart.ascendant.sign} Rising&ensp;·&ensp;{chart.computed_for && chart.computed_for.date}
        </span>
      </div>

      {/* SVG wheel */}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", maxWidth: "100%", height: "auto" }}>
        <defs>
          <radialGradient id="ncBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#0e1530" />
            <stop offset="100%" stopColor="#060912" />
          </radialGradient>
          <radialGradient id="ncCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#0c1224" />
            <stop offset="100%" stopColor="#06080f" />
          </radialGradient>
        </defs>

        {/* Background disc */}
        <circle cx={CX} cy={CY} r={R_OUTER + 6} fill="url(#ncBg)" />

        {/* Outer glow halo */}
        <circle cx={CX} cy={CY} r={R_OUTER + 3}
          fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth={5} />
        {/* Crisp outer border */}
        <circle cx={CX} cy={CY} r={R_OUTER}
          fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth={1.2} />

        {/* Zodiac segments */}
        {SIGN_GLYPHS.map((glyph, i) => {
          const a1 = lonToAngle(i * 30);
          const a2 = lonToAngle((i + 1) * 30);
          const la = lonToAngle(i * 30 + 15);
          const [lx, ly] = polar(la, (R_OUTER + R_ZODIAC) / 2);
          return (
            <g key={i}>
              <path d={ringSegment(a1, a2, R_OUTER, R_ZODIAC)}
                fill={ELEM_FILL[ELEMENTS[i]]}
                stroke={ELEM_STROKE[ELEMENTS[i]]} strokeWidth={0.6} />
              <text x={f(lx)} y={f(ly)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: 15, fontFamily: "serif", fill: ELEM_TEXT[ELEMENTS[i]], opacity: 0.92 }}>
                {glyph}
              </text>
            </g>
          );
        })}

        {/* Sign boundary lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = lonToAngle(i * 30);
          const [x1, y1] = polar(a, R_ZODIAC);
          const [x2, y2] = polar(a, R_OUTER);
          return <line key={i} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)}
            stroke="rgba(201,168,76,0.42)" strokeWidth={0.8} />;
        })}

        {/* Zodiac inner border */}
        <circle cx={CX} cy={CY} r={R_ZODIAC}
          fill="none" stroke="rgba(201,168,76,0.38)" strokeWidth={0.9} />

        {/* House ring */}
        <circle cx={CX} cy={CY} r={R_CUSPS}
          fill="none" stroke="rgba(130,130,195,0.18)" strokeWidth={0.5} />

        {/* House cusp lines */}
        {Object.entries(chart.houses).map(([hKey, hVal]) => {
          const hNum     = parseInt(hKey.split("_")[1]);
          const a        = lonToAngle(hVal.longitude);
          const [x1, y1] = polar(a, R_CENTER);
          const [x2, y2] = polar(a, R_ZODIAC - 1);
          const angular  = [1, 4, 7, 10].includes(hNum);
          return (
            <line key={hKey} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)}
              stroke={angular ? "rgba(201,168,76,0.62)" : "rgba(155,155,210,0.19)"}
              strokeWidth={angular ? 1.2 : 0.55}
              strokeDasharray={angular ? "" : "3,5"} />
          );
        })}

        {/* House number labels */}
        {Array.from({ length: 12 }, (_, i) => {
          const hNum     = i + 1;
          const nextHNum = (hNum % 12) + 1;
          const lon1  = chart.houses[`house_${hNum}`].longitude;
          const lon2  = chart.houses[`house_${nextHNum}`].longitude;
          const diff  = ((lon2 - lon1) + 360) % 360;
          const midLon = (lon1 + diff / 2 + 360) % 360;
          const a = lonToAngle(midLon);
          const [x, y] = polar(a, R_LABELS);
          return (
            <text key={hNum} x={f(x)} y={f(y)} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 9.5, fontFamily: "var(--mono, monospace)", fill: "rgba(158,162,215,0.48)" }}>
              {hNum}
            </text>
          );
        })}

        {/* Center disc */}
        <circle cx={CX} cy={CY} r={R_CENTER}
          fill="url(#ncCenter)" stroke="rgba(120,120,185,0.26)" strokeWidth={0.9} />
        <circle cx={CX} cy={CY} r={R_CENTER - 7}
          fill="none" stroke="rgba(100,100,160,0.1)" strokeWidth={0.5} />

        {/* Aspect lines */}
        {aspectLines.map(({ i, j, def }, idx) => {
          const a1 = rawAngles[PLANET_ORDER[i]];
          const a2 = rawAngles[PLANET_ORDER[j]];
          const r  = R_CENTER * 0.87;
          const [x1, y1] = polar(a1, r);
          const [x2, y2] = polar(a2, r);
          return (
            <line key={idx} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)}
              stroke={def.color} strokeWidth={0.85} opacity={0.48}
              strokeDasharray={def.dash} />
          );
        })}

        {/* AC highlight in zodiac band */}
        {(() => {
          const a = lonToAngle(asc);
          const [x1, y1] = polar(a, R_ZODIAC - 1);
          const [x2, y2] = polar(a, R_OUTER + 1);
          return <line x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)}
            stroke="rgba(228,199,102,0.92)" strokeWidth={2.2} />;
        })()}

        {/* Axis labels */}
        {AXES.map(({ lon, label, strong }) => {
          const a = lonToAngle(lon);
          const [x, y] = polar(a, R_OUTER + 17);
          return (
            <text key={label} x={f(x)} y={f(y)} textAnchor="middle" dominantBaseline="middle"
              style={{
                fontSize: strong ? 9.5 : 8.5,
                fontFamily: "var(--mono, monospace)",
                fill: strong ? "#E4C766" : "rgba(201,168,76,0.42)",
                fontWeight: strong ? 700 : 400,
                letterSpacing: "0.07em",
              }}>
              {label}
            </text>
          );
        })}

        {/* Planet tick marks at true ecliptic position */}
        {activePlanets.map(p => {
          const a = rawAngles[p];
          const [x1, y1] = polar(a, R_TICK_OUT);
          const [x2, y2] = polar(a, R_TICK_IN);
          return <line key={"tk_" + p} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)}
            stroke={PLANET_COLORS[p]} strokeWidth={1.6} opacity={0.88} />;
        })}

        {/* Planet glyphs (collision-spread positions) */}
        {activePlanets.map(p => {
          const planet = chart.planets[p];
          const angle  = spreadAngles[p];
          const rawA   = rawAngles[p];
          const [px, py] = polar(angle, R_PLANET);
          const separated = Math.abs(((angle - rawA + 180 + 360) % 360) - 180) > 5;
          const [tkx, tky] = polar(rawA, R_TICK_IN - 1);
          return (
            <g key={p}>
              {separated && (
                <line x1={f(tkx)} y1={f(tky)} x2={f(px)} y2={f(py)}
                  stroke={PLANET_COLORS[p]} strokeWidth={0.5} opacity={0.28} />
              )}
              <text x={f(px)} y={f(py)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: 14, fontFamily: "serif", fill: PLANET_COLORS[p] }}>
                {PLANET_GLYPHS[p]}{planet.retrograde ? "℞" : ""}
              </text>
              <text x={f(px)} y={f(py + 11)} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: 6.5, fontFamily: "var(--mono, monospace)", fill: PLANET_COLORS[p], opacity: 0.58 }}>
                {Math.floor(planet.degree)}°
              </text>
            </g>
          );
        })}

        {/* Center jewel */}
        <circle cx={CX} cy={CY} r={5.5} fill="rgba(201,168,76,0.18)" stroke="rgba(201,168,76,0.5)" strokeWidth={0.9} />
        <circle cx={CX} cy={CY} r={2.2} fill="rgba(201,168,76,0.65)" />

      </svg>

      {/* Aspect legend */}
      <div style={{
        display: "flex", gap: "6px 14px", flexWrap: "wrap",
        margin: "10px 0 8px",
        padding: "8px 14px",
        background: "rgba(8,11,22,0.5)",
        borderRadius: 10,
        border: "1px solid rgba(201,168,76,0.08)",
      }}>
        {ASPECT_DEFS.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="22" height="10" style={{ flexShrink: 0 }}>
              <line x1="1" y1="5" x2="21" y2="5"
                stroke={d.color} strokeWidth="1.6" strokeDasharray={d.dash} opacity="0.72" />
            </svg>
            <span style={{
              fontFamily: "var(--mono, monospace)", fontSize: 9.5,
              color: "rgba(244,239,230,0.36)", letterSpacing: "0.04em",
            }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      {/* Planet legend */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
        gap: "5px 14px",
        paddingTop: 10,
        borderTop: "1px solid rgba(201,168,76,0.1)",
      }}>
        {activePlanets.map(p => {
          const planet = chart.planets[p];
          return (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontFamily: "serif", color: PLANET_COLORS[p], flexShrink: 0 }}>
                {PLANET_GLYPHS[p]}
              </span>
              <span style={{ fontSize: 10, fontFamily: "var(--mono, monospace)", color: "rgba(244,239,230,0.48)" }}>
                {p}
              </span>
              <span style={{
                fontSize: 10, fontFamily: "var(--mono, monospace)",
                color: "rgba(244,239,230,0.28)", marginLeft: "auto", whiteSpace: "nowrap",
              }}>
                {planet.sign} {Math.floor(planet.degree)}°{planet.retrograde ? " ℞" : ""}
              </span>
            </div>
          );
        })}
        {[
          { key: "AC", label: "Ascendant", sign: chart.ascendant.sign, degree: chart.ascendant.degree },
          { key: "MC", label: "Midheaven",  sign: chart.midheaven.sign,  degree: chart.midheaven.degree  },
        ].map(({ key, label, sign, degree }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              fontSize: 10, fontFamily: "var(--mono, monospace)",
              color: "#E4C766", fontWeight: 700, flexShrink: 0, minWidth: 13,
            }}>{key}</span>
            <span style={{ fontSize: 10, fontFamily: "var(--mono, monospace)", color: "rgba(244,239,230,0.48)" }}>
              {label}
            </span>
            <span style={{
              fontSize: 10, fontFamily: "var(--mono, monospace)",
              color: "rgba(244,239,230,0.28)", marginLeft: "auto", whiteSpace: "nowrap",
            }}>
              {sign} {Math.floor(degree)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.NatalChart = NatalChart;
