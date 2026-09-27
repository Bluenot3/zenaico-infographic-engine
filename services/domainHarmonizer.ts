import type { StylePreset, GenerationOptions, InfographicContent, SportsGame } from '../types';

export type ContentDomain = 'technology' | 'scientific' | 'sports' | 'finance' | 'general';
export type StyleArchetype = 'sports_broadcast' | 'technical_schematic' | 'financial_terminal' | 'renaissance_master' | 'cyber_hud' | 'general_aesthetic';

export interface DomainHarmonizationResult {
  contentDomain: ContentDomain;
  styleArchetype: StyleArchetype;
  isIntertwined: boolean;
  fusionHeadline: string;
  fusionDescription: string;
  harmonizedStylePrompt: string;
  adaptedPositivePrompt: string;
  strictNegativePrompt: string;
  suggestedConceptTitles: string[];
  antiMorphingDirectives: string;
}

/**
 * Intelligent Domain & Style Harmonizer.
 * Intertwines Sports, Scientific, Technological, and Financial domains so that
 * any visual aesthetic can be applied to any subject matter with zero morphing,
 * zero mix-ups, and maximum publication-grade fidelity.
 */
export class DomainHarmonizer {
  /**
   * Detect content domain from topic title, text, or data entries.
   */
  public static detectDomain(topic: string = '', textContent: string = ''): ContentDomain {
    const combined = `${topic} ${textContent}`.toLowerCase();

    // 1. Sports detection
    const sportsKeywords = [
      'quarterback', 'touchdown', 'nfl', 'ncaa', 'football', 'basketball', 'nba', 
      'baseball', 'mlb', 'soccer', 'fifa', 'gameday', 'playmaker', 'bulldogs', 
      'seminoles', 'nittany lions', 'badgers', 'chiefs', 'falcons', 'cowboys', 
      'ravens', '49ers', 'rams', 'bills', 'jaguars', 'scorebug', 'stadium',
      'heisman', 'sec football', 'big ten', 'acc football', 'super bowl',
      'yard line', 'pass yards', 'rush yards', 'interception', 'field goal',
      'box score', 'touchdowns', 'quarterback rating', 'scrimmage', 'offensive line'
    ];
    if (sportsKeywords.some(kw => combined.includes(kw))) {
      return 'sports';
    }

    // 2. Technology & Hardware detection
    const techKeywords = [
      'gpu', 'cpu', 'semiconductor', 'nvidia', 'blackwell', 'b200', 'amd', 'mi300', 
      'intel', 'tpu', 'transistor', 'quantum computing', 'qubit', 'microchip', 
      'silicon', 'wafer', 'nanometer', 'neural network', 'large language model', 
      'transformer architecture', 'artificial intelligence', 'machine learning', 
      'robotics', 'cybersecurity', 'blockchain', 'firmware', 'software', 
      'bci', 'brain-computer interface', 'neuralink', 'lithography', 'asml', 'tflops', 'pflops',
      'supercomputer', 'exascale', 'fpga', 'asic', 'hbm3', 'hbm3e', 'pcie', 'nvlink',
      'cloud computing', 'datacenter', 'compiler', 'autonomous vehicle', 'lidar',
      'solid state battery', 'photonics', 'optics', 'cryogenic', 'server architecture'
    ];
    if (techKeywords.some(kw => combined.includes(kw))) {
      return 'technology';
    }

    // 3. Scientific & Medical & Aerospace detection
    const scienceKeywords = [
      'crispr', 'cas9', 'gene editing', 'genomics', 'dna', 'rna', 'mrna',
      'telescope', 'james webb', 'jwst', 'hubble', 'astronomy', 'astrophysics',
      'falcon heavy', 'starship', 'spacex', 'nasa', 'rocket', 'orbital mechanics',
      'fusion reactor', 'iter', 'tokamak', 'stellarator', 'wendelstein',
      'quantum mechanics', 'neuroscience', 'synapse', 'cell biology', 'photosynthesis', 
      'vaccine', 'antibody', 'exoplanet', 'black hole', 'gravitational wave', 
      'particle physics', 'cern', 'lhc', 'hadron collider', 'biomedical', 'clinical trial',
      'virology', 'biochemistry', 'neurobiology', 'condensed matter', 'thermodynamics'
    ];
    if (scienceKeywords.some(kw => combined.includes(kw))) {
      return 'scientific';
    }

    // 4. Financial & Market detection
    const financeKeywords = [
      'stock market', 'nasdaq', 's&p 500', 'wall street', 'bloomberg', 'equity',
      'venture capital', 'ipo', 'market cap', 'cryptocurrency', 'bitcoin', 'ethereum',
      'interest rates', 'inflation', 'gdp', 'treasury', 'yield curve', 'hedge fund'
    ];
    if (financeKeywords.some(kw => combined.includes(kw))) {
      return 'finance';
    }

    return 'general';
  }

  /**
   * Detect visual style archetype from style preset name, id, or prompt suffix.
   */
  public static detectStyleArchetype(styleName: string = '', promptSuffix: string = ''): StyleArchetype {
    const combined = `${styleName} ${promptSuffix}`.toLowerCase();

    if (
      combined.includes('espn') || 
      combined.includes('sports hud') || 
      combined.includes('gameday') || 
      combined.includes('court vision') || 
      combined.includes('championship gold') || 
      combined.includes('super bowl') ||
      combined.includes('scorebug') ||
      combined.includes('sports broadcast') ||
      combined.includes('quantum tech championship')
    ) {
      return 'sports_broadcast';
    }

    if (
      combined.includes('blueprint') || 
      combined.includes('nasa manual') || 
      combined.includes('schematic') || 
      combined.includes('botanical science') || 
      combined.includes('medical journal') ||
      combined.includes('sports biomechanics')
    ) {
      return 'technical_schematic';
    }

    if (
      combined.includes('bloomberg') || 
      combined.includes('financial times') || 
      combined.includes('terminal') ||
      combined.includes('sports analytics terminal')
    ) {
      return 'financial_terminal';
    }

    if (
      combined.includes('da vinci') || 
      combined.includes('codex') || 
      combined.includes('renaissance') ||
      combined.includes('vitruvian')
    ) {
      return 'renaissance_master';
    }

    if (
      combined.includes('nexus hud') || 
      combined.includes('cyberpunk') || 
      combined.includes('hologram') ||
      combined.includes('cyber_security')
    ) {
      return 'cyber_hud';
    }

    return 'general_aesthetic';
  }

  /**
   * Harmonize visual prompts and guidelines when intertwining domains.
   * Guarantees ZERO morphing, zero visual mix-ups, and top-tier aesthetic translation.
   */
  public static harmonize(params: {
    topic: string;
    stylePreset: StylePreset;
    textContent?: string;
    options?: GenerationOptions;
  }): DomainHarmonizationResult {
    const { topic, stylePreset, textContent = '', options } = params;
    const contentDomain = this.detectDomain(topic, textContent);
    const styleArchetype = this.detectStyleArchetype(stylePreset.name, stylePreset.promptSuffix);

    const isIntertwined = 
      (styleArchetype === 'sports_broadcast' && (contentDomain === 'technology' || contentDomain === 'scientific' || contentDomain === 'finance')) ||
      (contentDomain === 'sports' && (styleArchetype === 'technical_schematic' || styleArchetype === 'financial_terminal' || styleArchetype === 'renaissance_master' || styleArchetype === 'cyber_hud'));

    let fusionHeadline = `${stylePreset.name} Standard`;
    let fusionDescription = `Rendering authentic ${contentDomain} content in high-fidelity ${stylePreset.name} style.`;
    let harmonizedStylePrompt = stylePreset.promptSuffix;
    let adaptedPositivePrompt = options?.positivePrompt || 'masterpiece, 8k resolution, razor-sharp focus, professional graphic design';
    let strictNegativePrompt = options?.negativePrompt || 'blurry, distorted, amateur, low quality';
    let antiMorphingDirectives = 'Ensure pure aesthetic translation without hybrid distortion.';
    let suggestedConceptTitles: string[] = [
      'Comparative Technical Breakdown',
      'High-Resolution Telemetry Analysis',
      'Performance Benchmark Radar',
      'System Architecture Specification'
    ];

    // SCENARIO 1: Sports Broadcast Style (ESPN HUD / Sports Analyst) applied to TECHNOLOGY or SCIENCE
    if (styleArchetype === 'sports_broadcast' && (contentDomain === 'technology' || contentDomain === 'scientific' || contentDomain === 'finance')) {
      const subjectName = contentDomain === 'technology' ? 'technological hardware & computing architecture' : contentDomain === 'scientific' ? 'scientific discovery & mechanisms' : 'market financial intelligence';
      
      fusionHeadline = `⚡ Cross-Domain Fusion: ${contentDomain === 'technology' ? 'Tech Spec Showdown' : 'Scientific Breakthrough'} in ESPN Sports Analyst HUD`;
      fusionDescription = `Adapts ESPN Sunday Night Football and SportsCenter broadcast telemetry to ${subjectName}. Features head-to-head Tale of the Tape cards, benchmark scorebug comparisons, and 3D illuminated stat ribbons with ZERO football or stadium turf artifacts.`;

      harmonizedStylePrompt = `
        Premium ESPN Primetime live broadcast telemetry graphics package adapted specifically for ${subjectName}.
        COMPOSITION & VISUAL ARCHITECTURE:
        - Sleek dark obsidian carbon-fiber and etched silicon wafer substrate (ZERO grass turf, ZERO sports field, ZERO athletic gear).
        - High-contrast broadcast scorebug telemetry banner displaying comparative benchmark numbers, clock speed, compute throughput (TFLOPS/PFLOPS), bandwidth, efficiency ratings, or molecular affinity metrics.
        - Symmetrical head-to-head "Tale of the Tape" specification cards framing authentic high-resolution microchips, quantum dilution refrigerators, molecular structures, or aerospace propulsion hardware.
        - Dynamic 3D illuminated telemetry ribbons, comparative horizontal stat bars, and glossy glassmorphic HUD data readouts with glowing neon cyan, amber, and gold accents.
        - Cinematic broadcast studio floodlight flare, volumetric rim lighting, crisp high-contrast athletic sans-serif typography applied to engineering terminology.
        - Masterpiece 8k resolution, award-winning technical data visualization graphic.
      `.trim();

      adaptedPositivePrompt = `
        award-winning high-tech broadcast infographic, ESPN sports analyst breakdown presentation applied to ${topic}, authentic ${subjectName} components, crisp silicon architecture, cleanroom microchip dies, molecular precision, 3D broadcast telemetry HUD, illuminated comparative stat bars, razor-sharp modern typography, volumetric studio lighting, 8k resolution, masterpiece graphic design
      `.trim();

      strictNegativePrompt = `
        football, basketball, soccer ball, baseball, helmet, sports pads, football jersey, cleats, grass turf, football field, yard lines, goalposts, stadium crowd, human athlete, running player, sports match, chimeric hybrid object, morphed half-chip half-player, melted components, blurry, distorted text, low resolution, amateur
      `.trim();

      antiMorphingDirectives = `
        ANTI-MORPHING GUARANTEE: The technological/scientific subject is rendered with authentic industrial precision (e.g. cleanroom silicon, cryo-chambers, molecular bonds). Broadcast aesthetics (scorebug, Tale of the Tape, 3D telemetry bars) are overlaid as graphical HUD elements. Athletic sports gear (balls, helmets, turf) is strictly forbidden.
      `.trim();

      suggestedConceptTitles = [
        'Head-to-Head Specification Duel: Tale of the Tape & Benchmark Scorebug',
        'Architecture & Throughput Telemetry: Compute Efficiency Showdown',
        'Performance Heatmap & Execution Latency Breakdown',
        'Next-Gen System Telemetry: Prime Time Analyst Overview'
      ];
    }

    // SCENARIO 2: Scientific/Technical Schematic (Blueprint / NASA Manual) applied to SPORTS
    else if (contentDomain === 'sports' && styleArchetype === 'technical_schematic') {
      fusionHeadline = `📐 Cross-Domain Fusion: Gameday Matchup in Technical Blueprint & NASA Aerospace Schematics`;
      fusionDescription = `Transforms live athletic gameday action into an ultra-precise aerospace kinematics blueprint. Features measured throwing vectors, trajectory arcs, and stadium schematics while keeping human athletes authentic in verified 2026 uniforms.`;

      harmonizedStylePrompt = `
        Ultra-precise technical engineering schematic and aerospace kinematics analysis of the sports matchup.
        COMPOSITION & LAYOUT:
        - Cyanotype blueprint or retro NASA technical manual background with measured drafting grid paper.
        - Measured ballistic throwing vectors, player sprint velocity telemetry (in m/s), passing arc trajectory geometry, route trees, and pocket protection diagrams.
        - Architectural cross-section schematics of the host stadium bowl, floodlight pylons, and field dimensions.
        - Precise technical callouts for starting quarterbacks and key playmakers in authentic verified uniforms with accurate numbers.
        - Crisp white drafting line art, technical dimension callout arrows, modular instrument checklists, high-contrast monospace and DIN drafting typography.
        - Preserves authentic team logos, official colors, and verified gameday telemetry without robotic or cartoon caricature distortion.
      `.trim();

      adaptedPositivePrompt = `
        masterpiece engineering blueprint sports infographic, authentic collegiate/NFL teams, measured gridiron vectors, trajectory arcs, architectural stadium schematics, technical telemetry callouts, crisp drafting line art, razor-sharp typography, authentic team colors and logos, 8k resolution, museum quality
      `.trim();

      strictNegativePrompt = `
        robotic cyborg athletes, cartoon caricature, melted faces, deformed anatomy, fantasy sci-fi armor, blurry lines, unreadable scribbles, distorted logos, wrong jersey numbers, departed players, amateur
      `.trim();

      antiMorphingDirectives = `
        ANTI-MORPHING GUARANTEE: Athletes remain 100% human in verified 2026 collegiate or pro uniforms. They are NOT cyborgs or robots. Technical drafting lines, measured vectors, and stadium architectural schematics frame the genuine action.
      `.trim();

      suggestedConceptTitles = [
        'Ballistic Trajectory & Passing Vector Schematic',
        'Architectural Stadium & Ground Telemetry Blueprint',
        'Biomechanical Speed & Ground Force Telemetry',
        'Complete Tactical Drive & Defensive Formation Blueprint'
      ];
    }

    // SCENARIO 3: Financial Terminal (Bloomberg Terminal) applied to SPORTS
    else if (contentDomain === 'sports' && styleArchetype === 'financial_terminal') {
      fusionHeadline = `📈 Cross-Domain Fusion: Sports Matchup in Wall Street Bloomberg Terminal Pro`;
      fusionDescription = `Applies institutional financial terminal intelligence to sports matchups with candlestick scoring volatility, drive momentum indicators, and player value matrices.`;

      harmonizedStylePrompt = `
        Institutional Bloomberg Terminal Pro sports intelligence telemetry.
        COMPOSITION & LAYOUT:
        - Dark obsidian screen with amber, phosphor orange, and neon cyan data telemetry monitors.
        - Symmetrical head-to-head financial and athletic metric matrices: Player Value Index, EPA per play, Win Probability volatility candles, Cap Allocation heatmaps.
        - Crisp monospace terminal typography, dense data tables, candlestick momentum charts tracking 4 quarters of scoring swings.
        - Authentic verified team logos and official colors integrated into sleek institutional Wall Street glass modules.
      `.trim();

      adaptedPositivePrompt = `
        Bloomberg financial terminal sports analytics, dense institutional telemetry, authentic teams, candlestick drive momentum, player efficiency rating heatmaps, crisp amber monospace readouts, 8k resolution, Wall Street executive presentation
      `.trim();

      strictNegativePrompt = `
        blurry, cartoon, generic graphs, chaotic clutter, morphed players, distorted logos, wrong colors
      `.trim();

      antiMorphingDirectives = `
        ANTI-MORPHING GUARANTEE: Preserves official team marks and colors within a high-density financial terminal layout. Candlestick charts track point differentials and drive momentum without cartoon distortions.
      `.trim();

      suggestedConceptTitles = [
        'Institutional Win Probability & Drive Volatility Telemetry',
        'Player Value Index & Scrimmage Efficiency Matrix',
        'Quarter-by-Quarter Scoring Momentum & Yardage Telemetry',
        'Executive Gameday Summary & Head-to-Head Telemetry Feed'
      ];
    }

    // SCENARIO 4: Renaissance Master Codex (Da Vinci) applied to SPORTS or TECHNOLOGY
    else if (styleArchetype === 'renaissance_master') {
      fusionHeadline = `📜 Cross-Domain Fusion: ${contentDomain === 'sports' ? 'Athletic Biomechanics' : 'Modern Technology'} in Leonardo Da Vinci Codex`;
      fusionDescription = `Transposes modern athletic kinematics or computing hardware into antique Leonardo Da Vinci archival parchment with Vitruvian geometry and sepia ink crosshatching.`;

      harmonizedStylePrompt = `
        Authentic Renaissance master inventor notebook in the style of Leonardo Da Vinci Codex.
        COMPOSITION & LAYOUT:
        - Aged antique sepia parchment background with watermarks, subtle deckled edges, and hand-inked sepia/bistre ink crosshatching.
        - Anatomically precise hand-drawn sketches of biomechanical motion, throwing mechanics, muscle tension, or intricate mechanical gears and silicon micro-schematics.
        - Mirror-written Italian cursive calligraphy marginalia, golden ratio vitruvian proportions, and geometric compass construction arcs.
        - Subtle antique pigment accents highlighting key elements without breaking the timeless Renaissance archival aesthetic.
      `.trim();

      antiMorphingDirectives = `
        ANTI-MORPHING GUARANTEE: Hand-drawn archival Renaissance illustration. Preserves anatomical proportions and mechanical logic with vintage crosshatching rather than modern photo-mashup artifacts.
      `.trim();

      suggestedConceptTitles = [
        'Anatomical Biomechanics & Parabolic Motion Studies',
        'Archival Proportions & Geometric Mechanics Codex',
        'Mechanical Dynamics & Force Vector Sketches',
        'The Master Treatise: Form, Motion & Equilibrium'
      ];
    }

    return {
      contentDomain,
      styleArchetype,
      isIntertwined,
      fusionHeadline,
      fusionDescription,
      harmonizedStylePrompt,
      adaptedPositivePrompt,
      strictNegativePrompt,
      suggestedConceptTitles,
      antiMorphingDirectives
    };
  }

  /**
   * Quick showcase examples that prove the power of cross-domain intertwining.
   */
  public static getShowcaseTopics(): {
    title: string;
    topic: string;
    styleId: string;
    category: string;
    tag: string;
    dataEntries: string[];
  }[] {
    return [
      {
        title: "NVIDIA B200 vs AMD MI300X",
        topic: "NVIDIA Blackwell B200 vs AMD Instinct MI300X AI Superchips",
        styleId: "espn_tech_breakdown",
        category: "Tech in Sports HUD",
        tag: "⚡ Tech × ESPN HUD",
        dataEntries: [
          "B200: 208 Billion Transistors (Dual Die)",
          "MI300X: 153 Billion Transistors (3D Chiplets)",
          "B200 FP4 Compute: 20 PFLOPS | MI300X: 10.4 PFLOPS",
          "Memory: B200 192GB HBM3e (8 TB/s) | MI300X 192GB HBM3 (5.3 TB/s)",
          "TDP Thermal Ceiling: B200 1000W | MI300X 750W",
          "Interconnect: NVLink 5 (1.8 TB/s) vs Infinity Fabric 4 (896 GB/s)"
        ]
      },
      {
        title: "Quantum Supremacy: Superconducting vs Ions",
        topic: "Quantum Architecture Duel: Superconducting Qubits vs Trapped Ion Processors",
        styleId: "espn_tech_breakdown",
        category: "Tech in Sports HUD",
        tag: "⚡ Quantum × ESPN HUD",
        dataEntries: [
          "Gate Fidelity: Trapped Ion 99.9% 2-Qubit | Superconducting 99.5%",
          "Coherence Time (T2): Trapped Ion 10-100s | Superconducting 100-300μs",
          "Gate Speed: Superconducting 10-50ns (Blazing) | Trapped Ion 10-100μs",
          "Operating Temp: Superconducting 15mK (Dilution) | Trapped Ion Room/Cryo",
          "Connectivity: Trapped Ion All-to-All | Superconducting Nearest Neighbor",
          "Qubit Count: Superconducting 1,121 (Condor) | Trapped Ion 64 (IonQ)"
        ]
      },
      {
        title: "CRISPR-Cas9 vs Prime Editing",
        topic: "Next-Gen Genomic Medicine: CRISPR-Cas9 vs Prime Editing Showdown",
        styleId: "espn_tech_breakdown",
        category: "Biotech in Sports HUD",
        tag: "🧬 Biotech × Sports Analyst",
        dataEntries: [
          "CRISPR-Cas9: Double-Strand DNA Breaks (Indels)",
          "Prime Editing: Search-and-Replace Reverse Transcriptase",
          "On-Target Efficiency: CRISPR 85-95% | Prime Editing 60-80%",
          "Off-Target Cutting Risk: CRISPR Moderate | Prime Editing <1%",
          "Insertions: CRISPR Up to 10kb | Prime Editing Up to 100bp",
          "Clinical Trials: CRISPR 120+ Active | Prime Editing 12 Active"
        ]
      },
      {
        title: "Falcon Heavy vs Starship",
        topic: "SpaceX Super Heavy Aerospace Showdown: Falcon Heavy vs Starship",
        styleId: "quantum_championship_hud",
        category: "Aerospace in Championship",
        tag: "🚀 Space × Championship HUD",
        dataEntries: [
          "Starship Height: 121m (Full Stack) | Falcon Heavy: 70m",
          "Liftoff Thrust: Starship 16.7 Million lbf (33 Raptors) | Falcon Heavy 5.1 Million lbf",
          "Payload to LEO: Starship 150-250 Tons (Reusable) | Falcon Heavy 64 Tons",
          "Propellant: Starship Methane/LOX (CH4) | Falcon Heavy RP-1 Kerosene/LOX",
          "Reusability: Starship 100% Full Stack | Falcon Heavy Boosters Only",
          "Target Cost per Launch: Starship <$10M | Falcon Heavy $97M"
        ]
      },
      {
        title: "ITER Tokamak vs Wendelstein 7-X",
        topic: "Nuclear Fusion Power: Tokamak Magnetic Confinement vs Stellarator Showdown",
        styleId: "espn_tech_breakdown",
        category: "Science in Sports HUD",
        tag: "⚛️ Fusion × ESPN HUD",
        dataEntries: [
          "Plasma Temperature: ITER 150 Million °C | W7-X 20 Million °C",
          "Confinement Strategy: ITER Pulsed Toroidal Current | W7-X Steady-State Modular",
          "Plasma Volume: ITER 840 m³ | W7-X 30 m³",
          "Target Q Energy Gain: ITER Q ≥ 10 (500MW) | W7-X Continuous Physics Proof",
          "Magnetic Field: ITER 5.3 Tesla (Central) | W7-X 3.0 Tesla Superconducting",
          "Run Duration: ITER ~400s Pulses | W7-X Up to 30 Minutes Continuous"
        ]
      },
      {
        title: "Georgia vs Oklahoma SEC Clash",
        topic: "Georgia Bulldogs vs Oklahoma Sooners 2026 Gameday Telemetry",
        styleId: "scientific_sports_biomechanics",
        category: "Sports in Blueprint",
        tag: "🏈 Sports × Tech Blueprint",
        dataEntries: [
          "Georgia QB Gunner Stockton #14: 285 Pass YDS, 42 Rush YDS, 3 TD",
          "Oklahoma QB Jackson Arnold: 240 Pass YDS, 2 TD, 1 INT",
          "Total Offense: Georgia 432 YDS | Oklahoma 348 YDS",
          "4th Qtr Goal-Line Stand: CJ Allen 10 Tackles, 1.5 TFL",
          "Venue: Sanford Stadium, Athens, GA (92,746 Capacity)",
          "Final Score: Georgia 31 - Oklahoma 23 (Sep 26, 2026)"
        ]
      },
      {
        title: "Penn State vs Wisconsin",
        topic: "Penn State Nittany Lions vs Wisconsin Badgers Gameday Analytics",
        styleId: "bloomberg_sports_intelligence",
        category: "Sports in Bloomberg Terminal",
        tag: "📊 Sports × Financial Terminal",
        dataEntries: [
          "Wisconsin QB Colton Joseph: 235 Pass YDS, 2 TD, 1 Rush TD",
          "Penn State QB Rocco Becht #3: 114 Pass YDS, 1 Rush TD (Adidas Uniform)",
          "4th Qtr Scoring Volatility: Badgers +17 Swing in Final 3:31",
          "Turnover Advantage: Penn State +2 (1 Turnover vs 3 Badgers)",
          "Total Yards: Wisconsin 355 YDS | Penn State 233 YDS",
          "Final Score: Wisconsin 24 - Penn State 20 (Beaver Stadium)"
        ]
      },
      {
        title: "Quarterback Biomechanics & Ballistics",
        topic: "Kinematics of the Deep Ball: Quarterback Throwing Biomechanics & Arm Dynamics",
        styleId: "davinci_biomechanics",
        category: "Sports in Da Vinci Codex",
        tag: "📜 Sports × Da Vinci Codex",
        dataEntries: [
          "Shoulder Internal Rotation: 2,500-3,000 deg/sec at Ball Release",
          "Ball Velocity: 55-60 MPH (Elite College / NFL Standard)",
          "Launch Angle: Optimal 34-38° for 50+ Yard Downfield Deep Route",
          "Ground Reaction Force: Lead Foot absorbs 2.5x Bodyweight",
          "Hip-to-Shoulder Separation: 40-45° Rotational Kinetic Chain",
          "Spin Rate: 600-650 RPM for Tight Gyroscopic Spiral Stabilization"
        ]
      }
    ];
  }
}
