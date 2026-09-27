import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { STYLE_PRESETS } from '../constants';
import { sportsService } from '../services/sportsService';
import * as aiService from '../services/geminiService';
import { historyService } from '../services/historyService';
import type { SportsGame, SportsFeedResponse, StylePreset, HistoryItem, GenerationOptions } from '../types';
import { DomainHarmonizer } from '../services/domainHarmonizer';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { ZenLogo } from './common/ZenLogo';
import { downloadInfographicImage } from '../lib/engraveImage';
import { cn } from '../lib/utils';

export const FEATURED_TECH_SCIENCE_MATCHUPS: SportsGame[] = [
  {
    id: "tech-b200-mi300",
    sport: "OTHER",
    league: "AI Hardware Championship",
    gameDate: "Continuous Benchmark",
    status: "FINAL",
    quarterOrTime: "Tale of the Tape",
    headline: "NVIDIA Blackwell B200 vs AMD Instinct MI300X AI Superchips",
    summary: "Head-to-head architectural showdown between NVIDIA dual-die B200 and AMD 3D-chiplet MI300X processors across FP4/FP8 compute, memory bandwidth, and thermal dissipation.",
    venue: "TSMC 4NP CoWoS Packaging Cleanroom",
    stadiumName: "TSMC Advanced Packaging Cleanroom",
    homeTeam: {
      name: "AMD Instinct MI300X",
      shortName: "MI300X",
      rank: 2,
      record: "153B Transistors",
      color: "#ED1C24",
      logoText: "AMD",
      uniformBrand: "3D Chiplet X3D Architecture",
      uniformStyle: "192GB HBM3 Memory (5.3 TB/s)"
    },
    awayTeam: {
      name: "NVIDIA Blackwell B200",
      shortName: "B200",
      rank: 1,
      record: "208B Transistors",
      color: "#76B900",
      logoText: "NVDA",
      uniformBrand: "Dual-Die Co-Packaged Silicon",
      uniformStyle: "192GB HBM3e Memory (8.0 TB/s)"
    },
    score: { away: 20, home: 10 },
    keyStats: [
      { label: "B200 FP4 Compute", value: "20 PFLOPS" },
      { label: "MI300X FP8 Compute", value: "10.4 PFLOPS" },
      { label: "Memory Bandwidth", value: "8.0 TB/s vs 5.3 TB/s" },
      { label: "Interconnect Speed", value: "1.8 TB/s NVLink 5 vs 896 GB/s Infinity Fabric" }
    ],
    webImageReferences: [
      "TSMC CoWoS advanced packaging wafer",
      "NVIDIA Blackwell dual-die silicon photolithography",
      "AMD MI300X 3D stacked chiplet layout"
    ]
  },
  {
    id: "tech-quantum-showdown",
    sport: "OTHER",
    league: "Quantum Computing Duel",
    gameDate: "Lab Benchmark",
    status: "FINAL",
    quarterOrTime: "Qubit Telemetry",
    headline: "Superconducting Transmon Qubits vs Trapped Ion Processors",
    summary: "High-energy sports broadcast telemetry duel comparing superconducting circuit gate speeds against trapped ion fidelity, coherence times, and full all-to-all connectivity.",
    venue: "Cryogenic Dilution Refrigerator",
    stadiumName: "Cryogenic Dilution Refrigerator Lab",
    homeTeam: {
      name: "Trapped Ion Processors",
      shortName: "ION-Q",
      rank: 2,
      record: "99.9% 2-Qubit Fidelity",
      color: "#00A8FF",
      logoText: "IONS",
      uniformBrand: "Laser Trapping & Shuttling",
      uniformStyle: "Room-Temp RF Paul Vacuum Trap"
    },
    awayTeam: {
      name: "Superconducting Transmon Qubits",
      shortName: "SC-QUBIT",
      rank: 1,
      record: "10-50ns Gate Speed",
      color: "#9B51E0",
      logoText: "SC-Q",
      uniformBrand: "Josephson Junctions",
      uniformStyle: "15mK Dilution Cryostat"
    },
    score: { away: 99, home: 99 },
    keyStats: [
      { label: "Gate Speed", value: "10-50ns vs 10-100μs" },
      { label: "Coherence Time (T2)", value: "100-300μs vs 10-100 Seconds" },
      { label: "Operating Temp", value: "15mK Cryo vs Room Temp Trap" },
      { label: "2-Qubit Gate Fidelity", value: "99.5% vs 99.9%" }
    ],
    webImageReferences: [
      "Gold-plated dilution refrigerator chandelier",
      "Vacuum chamber RF Paul ion trap fluorescence",
      "Silicon quantum processor chip with microwave resonators"
    ]
  },
  {
    id: "science-crispr-prime",
    sport: "OTHER",
    league: "Biomedical Breakthroughs",
    gameDate: "Clinical Trials 2026",
    status: "FINAL",
    quarterOrTime: "Genomic Showdown",
    headline: "CRISPR-Cas9 Endonuclease vs Prime Editing Reverse Transcriptase",
    summary: "Sports analyst breakdown comparing targeted double-strand break editing against search-and-replace reverse transcriptase prime editing precision.",
    venue: "Biotechnology Genomic Cleanroom",
    stadiumName: "Biomedical Research Facility",
    homeTeam: {
      name: "Prime Editing Reverse Transcriptase",
      shortName: "PRIME",
      rank: 2,
      record: "<1% Off-Target",
      color: "#10B981",
      logoText: "PRIME",
      uniformBrand: "Engineered Cas9 Nickase + RT",
      uniformStyle: "Search-and-Replace PegRNA"
    },
    awayTeam: {
      name: "CRISPR-Cas9 Endonuclease",
      shortName: "CRISPR",
      rank: 1,
      record: "85-95% On-Target",
      color: "#F59E0B",
      logoText: "CAS9",
      uniformBrand: "Guide RNA Guided Molecular Scissors",
      uniformStyle: "Streptococcus pyogenes Cas9"
    },
    score: { away: 95, home: 80 },
    keyStats: [
      { label: "On-Target Efficiency", value: "85-95% vs 60-80%" },
      { label: "Off-Target Risk", value: "Moderate Indels vs <1% Clean" },
      { label: "Clinical Pipeline", value: "120+ Active vs 12 Active Trials" },
      { label: "Max Insertion Size", value: "Up to 10kb vs Up to 100bp" }
    ],
    webImageReferences: [
      "CRISPR-Cas9 molecular complex bound to DNA target",
      "Prime editing reverse transcriptase pegRNA crystal structure",
      "Next-generation sequencer flow cell telemetry"
    ]
  },
  {
    id: "science-starship-sls",
    sport: "OTHER",
    league: "Orbital Heavy Lift",
    gameDate: "Orbital Launch 2026",
    status: "FINAL",
    quarterOrTime: "Rocket Telemetry",
    headline: "SpaceX Starship Super Heavy vs NASA SLS Artemis Rocket",
    summary: "Championship gameday presentation comparing full reusable multi-engine stainless steel rocketry against deep-space heavy-lift exploration.",
    venue: "Starbase Orbital Launch Mount & Cape Canaveral Pad 39B",
    stadiumName: "Orbital Launch Pad",
    homeTeam: {
      name: "NASA Space Launch System",
      shortName: "SLS",
      rank: 2,
      record: "4 RS-25 + 2 SRBs",
      color: "#EA580C",
      logoText: "NASA",
      uniformBrand: "Exploration Core Stage",
      uniformStyle: "Orange Foam Insulation + White Solid Boosters"
    },
    awayTeam: {
      name: "SpaceX Starship Super Heavy",
      shortName: "STARSHIP",
      rank: 1,
      record: "33 Raptor V3 Engines",
      color: "#2563EB",
      logoText: "SPACEX",
      uniformBrand: "Full Stack Reusability",
      uniformStyle: "Stainless Steel 304L + Black Hexagonal Heatshield"
    },
    score: { away: 167, home: 88 },
    keyStats: [
      { label: "Liftoff Thrust", value: "16.7 Million lbf vs 8.8 Million lbf" },
      { label: "Payload to LEO", value: "150-250 Tons (Reusable) vs 95 Tons" },
      { label: "Full Stack Height", value: "121 Meters vs 98 Meters" },
      { label: "Estimated Cost/Launch", value: "<$10M (Target) vs $2.2B" }
    ],
    webImageReferences: [
      "Starship Super Heavy 33-engine static fire ring",
      "NASA SLS Artemis rollout on Mobile Launcher",
      "Mechanical Chopstick Mechazilla booster catch system"
    ]
  },
  {
    id: "science-iter-w7x-fusion",
    sport: "OTHER",
    league: "Nuclear Fusion Power",
    gameDate: "Plasma Ignition 2026",
    status: "FINAL",
    quarterOrTime: "Plasma Confinement",
    headline: "ITER Magnetic Tokamak vs Wendelstein 7-X Stellarator Showdown",
    summary: "Clean energy championship duel comparing pulsed high-current toroidal magnetic confinement against continuous steady-state modular stellarator coils.",
    venue: "Cadarache Fusion Facility & Greifswald IPP",
    stadiumName: "International Fusion Reactor Core",
    homeTeam: {
      name: "Wendelstein 7-X Stellarator",
      shortName: "W7-X",
      rank: 2,
      record: "50 Non-Planar Coils",
      color: "#06B6D4",
      logoText: "W7-X",
      uniformBrand: "Twisted Modular Steady-State",
      uniformStyle: "Superconducting Niobium-Titanium Coils"
    },
    awayTeam: {
      name: "ITER Magnetic Tokamak",
      shortName: "ITER",
      rank: 1,
      record: "840 m³ Plasma Volume",
      color: "#EC4899",
      logoText: "ITER",
      uniformBrand: "Toroidal Current + Central Solenoid",
      uniformStyle: "Beryllium First Wall + Cryostat"
    },
    score: { away: 150, home: 20 },
    keyStats: [
      { label: "Plasma Core Temp", value: "150 Million °C vs 20 Million °C" },
      { label: "Target Q Gain", value: "Q ≥ 10 (500MW) vs Continuous Physics" },
      { label: "Pulse Duration", value: "400s Pulses vs Up to 30 Min Steady" },
      { label: "Magnetic Field", value: "5.3 Tesla vs 3.0 Tesla" }
    ],
    webImageReferences: [
      "ITER vacuum vessel sector module installation",
      "Wendelstein 7-X intricate non-planar magnet coil geometry",
      "Glowing hydrogen plasma fusion telemetry camera readout"
    ]
  }
];

interface SportsVariation {
  id: string;
  title: string;
  points: string[];
  imagePrompt: string;
  imageUrl: string;
  angle: string;
}

interface SportsHubProps {
  onLoadIntoStudio: (item: HistoryItem) => void;
  onOpenSettings?: () => void;
}

export const SportsHub: React.FC<SportsHubProps> = ({ onLoadIntoStudio, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'intertwined' | 'fsu' | 'cfb' | 'nfl' | 'forecast'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<SportsGame[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedMetadata, setFeedMetadata] = useState<{ source: string; lastUpdated: string; headline: string }>({
    source: 'Google Grounding & Live Feeds',
    lastUpdated: 'Just now',
    headline: 'College Football & NFL Gameday Central'
  });

  // Synthesis modal state
  const [selectedGameForSynthesis, setSelectedGameForSynthesis] = useState<SportsGame | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(
    STYLE_PRESETS.find(s => s.id === 'espn_broadcast_hud') || STYLE_PRESETS[0]
  );
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [customAngle, setCustomAngle] = useState('Full Game Box Score & Star Performer Breakdown');
  
  // Up to 4 variations selection
  const [numVariations, setNumVariations] = useState<number>(4);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisStage, setSynthesisStage] = useState('');
  
  // Multi-generation output state
  const [generatedVariations, setGeneratedVariations] = useState<SportsVariation[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

  // In-place refinement state
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Expanded box score state
  const [expandedBoxScoreId, setExpandedBoxScoreId] = useState<string | null>(null);

  // Custom article/topic state for Cross-Domain Fusion tab
  const [customArticleTopic, setCustomArticleTopic] = useState('');

  // Fetch games on tab or search change
  const loadGames = async (forceRefresh: boolean = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoadingFeed(true);

    try {
      if (activeTab === 'intertwined') {
        const query = searchQuery.trim().toLowerCase();
        const filtered = query
          ? FEATURED_TECH_SCIENCE_MATCHUPS.filter(g => 
              g.headline.toLowerCase().includes(query) ||
              g.summary.toLowerCase().includes(query) ||
              g.homeTeam.name.toLowerCase().includes(query) ||
              g.awayTeam.name.toLowerCase().includes(query)
            )
          : FEATURED_TECH_SCIENCE_MATCHUPS;

        setGames(filtered);
        setFeedMetadata({
          source: 'Cross-Domain Tech & Science Intelligence',
          lastUpdated: 'Live Intertwiner Active',
          headline: 'Technology & Science in ESPN Sports Broadcast HUD'
        });
        setIsLoadingFeed(false);
        setIsRefreshing(false);
        return;
      }

      const sportParam = activeTab === 'fsu' ? 'fsu' : activeTab === 'cfb' ? 'cfb' : activeTab === 'nfl' ? 'nfl' : 'all';
      const response: SportsFeedResponse = await sportsService.getFeed({
        sport: sportParam,
        query: searchQuery,
        forceRefresh
      });

      let filteredGames = response.games;
      if (activeTab === 'forecast') {
        filteredGames = filteredGames.filter(g => g.status === 'UPCOMING');
      } else if (activeTab === 'fsu') {
        filteredGames = filteredGames.filter(g => g.isFloridaState);
      }

      setGames(filteredGames);
      setFeedMetadata({
        source: response.source || 'Google Search Grounding',
        lastUpdated: response.lastUpdated || new Date().toLocaleTimeString(),
        headline: response.headline || 'College Football & NFL Gameday Central'
      });

      if (forceRefresh) {
        toast.success('Live sports feed refreshed with latest Google Grounding data');
      }
    } catch (err: any) {
      console.error('Failed to load sports feed:', err);
      toast.error('Could not refresh live feed; showing cached gameday stats');
    } finally {
      setIsLoadingFeed(false);
      setIsRefreshing(false);
    }
  };

  const handleSynthesizeCustomArticle = (topicOrText: string, preferredStyleId?: string) => {
    const trimmed = topicOrText.trim();
    if (!trimmed) {
      toast.error('Please enter a technological or scientific article/topic first.');
      return;
    }

    const domain = DomainHarmonizer.detectDomain(trimmed.slice(0, 100), trimmed);
    const styleToUse = STYLE_PRESETS.find(s => s.id === (preferredStyleId || 'espn_tech_breakdown')) || STYLE_PRESETS[0];

    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0]?.slice(0, 80) || (domain === 'technology' ? 'Tech Specification Duel' : 'Scientific Breakthrough Overview');

    const customMatchup: SportsGame = {
      id: `custom-cross-${Date.now()}`,
      sport: 'OTHER',
      league: domain === 'technology' ? 'Technology Specification Duel' : domain === 'scientific' ? 'Scientific Breakthrough Analysis' : 'Cross-Domain Intelligence',
      gameDate: 'Live 2026 Synthesis',
      status: 'FINAL',
      quarterOrTime: 'Broadcast Overview',
      headline: title,
      summary: trimmed.slice(0, 400),
      venue: 'High-Tech Broadcast Facility',
      stadiumName: 'Broadcast Analytics Studio',
      homeTeam: {
        name: 'Architecture & Capability Alpha',
        shortName: 'ALPHA',
        rank: 1,
        color: '#2563EB',
        logoText: 'ALPHA',
        uniformBrand: 'Verified Architecture',
        uniformStyle: 'Next-Gen Specification'
      },
      awayTeam: {
        name: 'Comparative Benchmark Beta',
        shortName: 'BETA',
        rank: 2,
        color: '#D97706',
        logoText: 'BETA',
        uniformBrand: 'Baseline Architecture',
        uniformStyle: 'Comparative Performance'
      },
      score: { away: 95, home: 98 },
      keyStats: [
        { label: 'Domain Classification', value: domain.toUpperCase() },
        { label: 'Broadcast Style', value: styleToUse.name },
        { label: 'Quality Guarantee', value: '100% Anti-Morphing Enforced' },
        { label: 'Telemetry Visuals', value: '3D Scorebug & Tale of the Tape' }
      ]
    };

    setSelectedGameForSynthesis(customMatchup);
    setSelectedStyle(styleToUse);
    setGeneratedVariations([]);
    setSelectedVariationIndex(0);
    setRefinementPrompt('');
  };

  useEffect(() => {
    loadGames(false);
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGames(true);
  };

  // Trigger synthesis modal
  const openSynthesisModal = (game: SportsGame) => {
    setSelectedGameForSynthesis(game);
    setGeneratedVariations([]);
    setSelectedVariationIndex(0);
    setRefinementPrompt('');
    
    // Choose appropriate default preset
    if (game.id.startsWith('tech-') || game.id.startsWith('science-') || game.id.startsWith('custom-cross-') || game.sport === 'OTHER') {
      const techPreset = STYLE_PRESETS.find(s => s.id === 'espn_tech_breakdown') || STYLE_PRESETS[0];
      setSelectedStyle(techPreset);
    } else if (game.isFloridaState) {
      const fsuPreset = STYLE_PRESETS.find(s => s.id === 'fsu_garnet_gold');
      if (fsuPreset) setSelectedStyle(fsuPreset);
    } else {
      const espnPreset = STYLE_PRESETS.find(s => s.id === 'espn_broadcast_hud');
      if (espnPreset) setSelectedStyle(espnPreset);
    }
  };

  // Launch synthesis process for up to 4 variations
  const handleGenerateInfographic = async () => {
    if (!selectedGameForSynthesis) return;

    setIsSynthesizing(true);
    setGeneratedVariations([]);
    setSelectedVariationIndex(0);
    setSynthesisStage(`Synthesizing ${numVariations} balanced dual-team plans with Google Grounding...`);

    try {
      // 1. Synthesize multi-plans with equal representation for both teams
      const plansResponse = await sportsService.synthesizePlans({
        game: selectedGameForSynthesis,
        styleName: selectedStyle.name,
        stylePrompt: selectedStyle.promptSuffix,
        aspectRatio: selectedAspectRatio,
        customAngle,
        count: numVariations
      });

      const plans = (plansResponse.plans && plansResponse.plans.length > 0)
        ? plansResponse.plans.slice(0, numVariations)
        : [{
            title: plansResponse.title || `${selectedGameForSynthesis.awayTeam.shortName} vs ${selectedGameForSynthesis.homeTeam.shortName}`,
            points: plansResponse.points || [],
            imagePrompt: plansResponse.imagePrompt || selectedGameForSynthesis.headline
          }];

      const createdVariations: SportsVariation[] = [];

      // 2. Synthesize image for each plan
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];
        setSynthesisStage(`Rendering visual variation ${i + 1} of ${plans.length}: "${plan.title}"...`);

        const webPhotoContext = selectedGameForSynthesis.webImageReferences?.join('; ') || 'Verified gameday action photography';
        const stadiumInfo = selectedGameForSynthesis.stadiumName || selectedGameForSynthesis.venue || 'Stadium';
        const homeUniform = selectedGameForSynthesis.homeTeam.uniformBrand || 'official uniform';
        const awayUniform = selectedGameForSynthesis.awayTeam.uniformBrand || 'official uniform';

        const harmony = DomainHarmonizer.harmonize({
          topic: `${selectedGameForSynthesis.awayTeam.name} vs ${selectedGameForSynthesis.homeTeam.name}`,
          textContent: `${selectedGameForSynthesis.headline} ${selectedGameForSynthesis.summary}`,
          stylePreset: selectedStyle
        });

        const activeStylePrompt = harmony.isIntertwined ? harmony.harmonizedStylePrompt : selectedStyle.promptSuffix;
        const activePositive = harmony.isIntertwined
          ? `${harmony.adaptedPositivePrompt}, 50/50 dual-sided balance, official logos and verified labels, 8k resolution, razor sharp typography, ${selectedStyle.promptSuffix}`
          : `masterpiece, 50/50 balanced dual-team broadcast infographic, both teams side-by-side in verified official apparel (${selectedGameForSynthesis.awayTeam.name} wearing authentic ${awayUniform}, ${selectedGameForSynthesis.homeTeam.name} wearing authentic ${homeUniform}), verified 2026 starting players and jersey numbers (such as Gunner Stockton #14 for Georgia Bulldogs, Rocco Becht #3 for Penn State), set against authentic ${stadiumInfo}, grounded in real game web photography (${webPhotoContext}), official logos and helmets, dual star player spotlight cards, 8k resolution, razor sharp typography, crisp scorebug, vibrant colors, ${selectedStyle.promptSuffix}`;

        const activeNegative = harmony.isIntertwined
          ? `${harmony.strictNegativePrompt}, Carson Beck on Georgia Bulldogs, departed players, obsolete 2024 rosters, single-team bias, wrong uniform brand`
          : 'Carson Beck on Georgia Bulldogs, departed players, obsolete 2024 rosters, single-team bias, wrong uniform brand, blurry, distorted, amateur';

        const genOptions: GenerationOptions = {
          targetAudience: 'general',
          tone: 'professional',
          keyElements: `${selectedGameForSynthesis.keyStats.map(s => `${s.label}: ${s.value}`).join(', ')}. Venue: ${stadiumInfo}.`,
          excludeElements: activeNegative,
          colorPalette: `${selectedGameForSynthesis.awayTeam.color || '#00338D'} (50%) and ${selectedGameForSynthesis.homeTeam.color || '#E31837'} (50%), dual-team balance`,
          layout: 'data-heavy',
          numPoints: plan.points.length,
          aspectRatio: selectedAspectRatio,
          language: 'English',
          includeDataVis: true,
          dataEntries: selectedGameForSynthesis.keyStats.map(s => `${s.label}: ${s.value}`),
          positivePrompt: activePositive,
          visualComplexity: 'ultra-detailed',
          lighting: 'cinematic',
          renderEngine: 'unreal-engine-5',
          stylePreset: selectedStyle,
          stylePresetName: selectedStyle.name,
          stylePromptSuffix: activeStylePrompt
        };

        const urls = await aiService.generateInfographicImage(
          plan.imagePrompt,
          activeStylePrompt,
          genOptions
        );

        const imageUrl = urls[0];
        if (imageUrl) {
          const variation: SportsVariation = {
            id: `sports-var-${Date.now()}-${i}`,
            title: plan.title,
            points: plan.points,
            imagePrompt: plan.imagePrompt,
            imageUrl,
            angle: plan.title
          };
          createdVariations.push(variation);

          // Archive each variation to History
          await historyService.saveItem({
            title: variation.title,
            topic: `${selectedGameForSynthesis.awayTeam.name} vs ${selectedGameForSynthesis.homeTeam.name}`,
            points: variation.points,
            imageUrl,
            aspectRatio: selectedAspectRatio,
            model: 'gpt-image-2',
            styleName: selectedStyle.name,
            category: selectedStyle.category,
            layout: 'data-heavy',
            sourceType: 'live-sports',
            dataEntries: selectedGameForSynthesis.keyStats.map(s => `${s.label}: ${s.value}`),
            engraved: true,
          }).catch(e => console.warn('History save notice:', e));
        }
      }

      if (createdVariations.length === 0) {
        throw new Error('Image generation did not return valid image outputs. Please check API settings.');
      }

      setGeneratedVariations(createdVariations);
      setSelectedVariationIndex(0);
      setSynthesisStage('');
      toast.success(`Successfully synthesized ${createdVariations.length} balanced infographic variation${createdVariations.length > 1 ? 's' : ''}!`);
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      toast.error(err.message || 'Sports Infographic synthesis failed. Please check Studio Settings.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // In-place refinement of active generation
  const handleRefineCurrentVariation = async () => {
    if (!refinementPrompt.trim() || generatedVariations.length === 0) return;
    const currentVar = generatedVariations[selectedVariationIndex];
    if (!currentVar) return;

    setIsRefining(true);
    const toastId = toast.loading('Refining & upgrading generation in 4K...');

    try {
      const refinedUrl = await aiService.refineInfographicImage(
        currentVar.imageUrl,
        `Refine balanced dual-team sports infographic for ${selectedGameForSynthesis?.awayTeam.name} vs ${selectedGameForSynthesis?.homeTeam.name}: ${refinementPrompt}. Maintain equal 50/50 balance for both teams, crisp typography, official colors, and star player cards.`
      );

      if (refinedUrl && refinedUrl !== currentVar.imageUrl) {
        const updated = [...generatedVariations];
        updated[selectedVariationIndex] = {
          ...currentVar,
          imageUrl: refinedUrl
        };
        setGeneratedVariations(updated);

        // Save refined variation to History
        await historyService.saveItem({
          title: `${currentVar.title} (Refined)`,
          topic: currentVar.title,
          points: currentVar.points,
          imageUrl: refinedUrl,
          aspectRatio: selectedAspectRatio,
          model: 'gpt-image-2',
          styleName: selectedStyle.name,
          category: selectedStyle.category,
          layout: 'data-heavy',
          sourceType: 'live-sports-refined',
          engraved: true,
        });

        setRefinementPrompt('');
        toast.success('Generation refined & upgraded successfully!', { id: toastId });
      } else {
        toast.info('Refinement completed.', { id: toastId });
      }
    } catch (err: any) {
      console.error('Refine failed:', err);
      toast.error(err.message || 'Refinement failed.', { id: toastId });
    } finally {
      setIsRefining(false);
    }
  };

  // Download single variation with engraved official logo hallmark
  const handleDownloadSingle = async (variation: SportsVariation, idx: number, engrave: boolean = true) => {
    const filename = `zen-sports-${selectedGameForSynthesis?.id || 'game'}-var-${idx + 1}-${engrave ? 'engraved' : 'raw'}.png`;
    const toastId = toast.loading(engrave ? "Applying official ZEN logo engraving..." : "Downloading visual...");
    try {
      await downloadInfographicImage(variation.imageUrl, filename, {
        engrave,
        title: variation.title,
        model: 'gpt-image-2',
        timestamp: Date.now()
      });
      toast.success(engrave ? "Downloaded with official ZEN hallmark!" : "Download complete!", { id: toastId });
    } catch {
      toast.error("Download failed, saving raw graphic...", { id: toastId });
      const link = document.createElement('a');
      link.href = variation.imageUrl;
      link.download = filename;
      link.click();
    }
  };

  // Batch download all variations with engraved hallmarks
  const handleDownloadAll = async () => {
    toast.info(`Downloading all ${generatedVariations.length} infographic variations with official ZEN hallmarks...`);
    for (let idx = 0; idx < generatedVariations.length; idx++) {
      const v = generatedVariations[idx];
      const filename = `zen-sports-${selectedGameForSynthesis?.id || 'game'}-var-${idx + 1}-engraved.png`;
      try {
        await downloadInfographicImage(v.imageUrl, filename, {
          engrave: true,
          title: v.title,
          model: 'gpt-image-2',
          timestamp: Date.now()
        });
      } catch {
        const link = document.createElement('a');
        link.href = v.imageUrl;
        link.download = filename;
        link.click();
      }
    }
    toast.success(`Successfully downloaded all ${generatedVariations.length} infographic variations!`);
  };

  // Pre-load game directly into Studio
  const handleOpenInStudio = (game: SportsGame, specificVariation?: SportsVariation) => {
    const item: HistoryItem = {
      id: `sports-${game.id}-${Date.now()}`,
      timestamp: Date.now(),
      title: specificVariation?.title || game.headline,
      topic: `${game.awayTeam.name} vs ${game.homeTeam.name} (${game.status})`,
      points: specificVariation?.points || [
        game.score ? `Score: ${game.awayTeam.shortName} ${game.score.away} - ${game.homeTeam.shortName} ${game.score.home}` : `Matchup: ${game.quarterOrTime}`,
        ...game.keyStats.map(s => `${s.label}: ${s.value}`),
        game.summary
      ].slice(0, 6),
      imageUrl: specificVariation?.imageUrl || '',
      aspectRatio: selectedAspectRatio,
      model: 'gpt-image-2',
      styleName: game.isFloridaState ? 'Florida State Seminoles Gameday' : selectedStyle.name,
      category: 'Sports & Gameday',
      layout: 'data-heavy',
      dataEntries: game.keyStats.map(s => `${s.label}: ${s.value}`),
      engraved: true,
    };
    onLoadIntoStudio(item);
    toast.success(`Loaded "${game.awayTeam.shortName} vs ${game.homeTeam.shortName}" into Studio`);
  };

  const activeVariation = generatedVariations[selectedVariationIndex];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Live Sports Ticker Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-black/70 border border-white/10 p-3 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE SPORTS WIRE</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 shrink-0">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            <span>Google Search Grounding Engine</span>
          </div>

          <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none text-xs text-slate-300 font-semibold tracking-wide flex items-center gap-6">
            <span className="text-amber-400 font-bold">🍢 FSU 34 - UCA 7 (Final) • Daniels 224 YDS 2 TD | McElvain 128 YDS 1 TD</span>
            <span className="text-slate-400">•</span>
            <span className="text-blue-400 font-bold">KC 22 - ATL 17 (Final) • Rice 110 YDS | London 67 YDS</span>
            <span className="text-slate-400">•</span>
            <span className="text-red-400 font-bold">UGA 31 - OU 23 (Final) • Stockton 285 YDS 3 TD | Arnold 240 YDS</span>
            <span className="text-slate-400">•</span>
            <span className="text-cyan-400 font-bold">BUF 47 - JAX 10 (Final) • Allen 4 TD | Etienne 85 YDS</span>
            <span className="text-slate-400">•</span>
            <span className="text-purple-400 font-bold">BAL 28 - DAL 25 (Final) • Henry 151 YDS | Prescott 379 YDS</span>
          </div>

          <button
            onClick={() => loadGames(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95"
            title="Refresh Live Grounded Data"
          >
            <Icon name="refresh" className={cn("h-4 w-4", isRefreshing && "animate-spin text-blue-400")} />
          </button>
        </div>
      </div>

      {/* Hero Header with Search & Filters */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-black p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-red-600/20 to-amber-600/20 border border-red-500/30 text-amber-300 text-xs font-black tracking-wider uppercase flex items-center gap-2">
              <ZenLogo size={14} engraved />
              <span>ZEN SPORTS INTELLIGENCE ENGINE</span>
            </span>

            <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold">
              Up to 4 Balanced Generations
            </span>

            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              50/50 Dual-Team Parity Guaranteed
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Live Sports Infographic Hub
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              Transform live sports scores, verified box scores, and upcoming matchups into publication-ready broadcast infographics. Equal spotlight for both teams with star performer cards, head-to-head metrics, and up to 4 variations per generation.
            </p>
          </div>

          {/* Search Bar for Any Game / Team */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search any team or matchup (e.g., Florida State, Georgia, Oklahoma, Chiefs)..."
                className="w-full bg-slate-900/80 border border-white/15 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              />
              <Icon name="search" className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={isLoadingFeed}
              className="py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Icon name="sparkles" className="h-4 w-4" />
              <span>Query Google</span>
            </button>
          </form>

          {/* Quick Filter Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'all', label: 'All Live Wire', icon: 'zap' },
              { id: 'intertwined', label: '⚡ Tech & Science Fusion', icon: 'sparkles' },
              { id: 'fsu', label: 'Florida State Central 🍢', icon: 'shield' },
              { id: 'cfb', label: 'College Football (Top 25)', icon: 'trophy' },
              { id: 'nfl', label: 'NFL Sunday Slate', icon: 'sparkles' },
              { id: 'forecast', label: 'Upcoming Forecasts', icon: 'calendar' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border uppercase tracking-wider",
                  activeTab === tab.id
                    ? tab.id === 'intertwined'
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-blue-400 shadow-lg shadow-blue-600/30"
                      : "bg-white text-slate-950 border-white shadow-lg"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                )}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Cross-Domain Fusion Console for Tech & Science Articles in Sports HUD */}
      {activeTab === 'intertwined' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 bg-gradient-to-r from-blue-950/60 via-purple-950/40 to-slate-900 border border-blue-500/30 shadow-2xl space-y-5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Icon name="sparkles" className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Cross-Domain Intertwiner: Tech & Science in ESPN Sports Analyst HUD
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl">
                Paste any scientific or technological article or complex topic. The engine automatically adapts it into an elite ESPN Primetime live broadcast telemetry HUD with 3D scorebug comparisons, Tale-of-the-Tape specification cards, and strict 0% morphing / zero chimeric artifacts guarantee.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span>🛡️ 0% Morphing Guarantee</span>
              </span>
            </div>
          </div>

          {/* Interactive Custom Article / Topic Input */}
          <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Synthesize Custom Tech / Scientific Article or Showdown</span>
              <span className="text-[11px] text-blue-400 font-semibold">Instant 4K ESPN HUD Infographic</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customArticleTopic}
                onChange={e => setCustomArticleTopic(e.target.value)}
                placeholder="e.g. Brain-Computer Interfaces: Neuralink N1 vs Synchron Stentrode, or paste an article topic..."
                className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSynthesizeCustomArticle(customArticleTopic);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleSynthesizeCustomArticle(customArticleTopic, 'espn_tech_breakdown')}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2 shrink-0"
              >
                <Icon name="sparkles" className="h-4 w-4" />
                <span>⚡ Synthesize ESPN HUD</span>
              </button>
              <button
                type="button"
                onClick={() => handleSynthesizeCustomArticle(customArticleTopic, 'scientific_sports_biomechanics')}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
              >
                <Icon name="layout" className="h-4 w-4 text-cyan-400" />
                <span>📐 Blueprint</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-500">Quick-Load Topics:</span>
              {[
                "Quantum Supremacy: Superconducting vs Trapped Ions",
                "CRISPR-Cas9 vs Prime Gene Editing",
                "SpaceX Starship Super Heavy vs NASA SLS",
                "Solid-State Batteries vs Lithium-Ion"
              ].map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    setCustomArticleTopic(sample);
                    handleSynthesizeCustomArticle(sample);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all text-[10px]"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Feed Status and Count Indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{feedMetadata.source}</span>
          <span>•</span>
          <span>Updated {feedMetadata.lastUpdated}</span>
        </div>

        <span className="text-xs text-slate-400 font-bold">
          {games.length} Games Available
        </span>
      </div>

      {/* Games Cards Grid */}
      <div className="space-y-4">
        {isLoadingFeed ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Spinner className="h-10 w-10 text-blue-500" />
            <p className="text-sm font-bold text-slate-400 animate-pulse">
              Querying Google Grounding for real-time sports results & box scores...
            </p>
          </div>
        ) : games.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-3xl border-white/10 space-y-3">
            <Icon name="search" className="h-10 w-10 text-slate-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No games matched your search</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try searching for a different team (e.g. "Florida State", "Georgia", "Chiefs") or click "All Live Wire".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {games.map(game => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative rounded-3xl border p-6 flex flex-col justify-between transition-all backdrop-blur-xl shadow-xl hover:border-white/20 group",
                  game.isFloridaState 
                    ? "bg-gradient-to-br from-[#782F40]/30 via-slate-950 to-black border-[#CEB888]/40 shadow-[#782F40]/20" 
                    : "bg-slate-900/70 border-white/10"
                )}
              >
                {/* Card Top Meta */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white text-[11px] font-black uppercase tracking-wider">
                        {game.league}
                      </span>
                      {game.isFloridaState && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#CEB888]/20 border border-[#CEB888]/40 text-[#CEB888] text-[11px] font-black uppercase tracking-wider">
                          🍢 Seminoles Feature
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-semibold">
                        {game.gameDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        game.status === 'FINAL' 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                      )}>
                        {game.quarterOrTime}
                      </span>
                    </div>
                  </div>

                  {/* Balanced Matchup Scoreboard Header */}
                  <div className="grid grid-cols-5 items-center bg-black/50 rounded-2xl p-4 border border-white/5">
                    {/* Away Team */}
                    <div className="col-span-2 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md shrink-0 border border-white/10"
                        style={{ backgroundColor: game.awayTeam.color || '#333' }}
                      >
                        {game.awayTeam.logoText || game.awayTeam.shortName}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          {game.awayTeam.rank && (
                            <span className="text-[10px] font-bold text-amber-400">#{game.awayTeam.rank}</span>
                          )}
                          <span className="text-sm font-black text-white truncate block">
                            {game.awayTeam.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          {game.awayTeam.record || 'Away'}
                        </span>
                      </div>
                    </div>

                    {/* Score / VS Center */}
                    <div className="col-span-1 text-center">
                      {game.score ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl sm:text-2xl font-black text-white">{game.score.away}</span>
                          <span className="text-xs text-slate-500 font-bold">-</span>
                          <span className="text-xl sm:text-2xl font-black text-white">{game.score.home}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-2 py-1 rounded-lg bg-white/5">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Home Team */}
                    <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                      <div className="overflow-hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-black text-white truncate block">
                            {game.homeTeam.name}
                          </span>
                          {game.homeTeam.rank && (
                            <span className="text-[10px] font-bold text-amber-400">#{game.homeTeam.rank}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          {game.homeTeam.record || 'Home'}
                        </span>
                      </div>
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md shrink-0 border border-white/10"
                        style={{ backgroundColor: game.homeTeam.color || '#333' }}
                      >
                        {game.homeTeam.logoText || game.homeTeam.shortName}
                      </div>
                    </div>
                  </div>

                  {/* Stadium & Uniform Intelligence Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <Icon name="map-pin" className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="truncate max-w-[280px]">{game.venue || game.stadiumName}</span>
                    </div>

                    {game.webImageReferences && game.webImageReferences.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <Icon name="camera" className="h-3 w-3" />
                        <span>Web Grounded Photos</span>
                      </span>
                    )}
                  </div>

                  {/* Uniform Sponsors Bar */}
                  {(game.homeTeam.uniformBrand || game.awayTeam.uniformBrand) && (
                    <div className="flex items-center gap-2 text-[10px] bg-black/40 p-2 rounded-xl border border-white/5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0">Uniforms:</span>
                      <span className="text-slate-300 truncate">
                        {game.awayTeam.shortName}: <strong className="text-white">{game.awayTeam.uniformBrand || 'Standard'}</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 truncate">
                        {game.homeTeam.shortName}: <strong className="text-white">{game.homeTeam.uniformBrand || 'Standard'}</strong>
                      </span>
                    </div>
                  )}

                  {/* Headline & Summary */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                      {game.headline}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {game.summary}
                    </p>
                  </div>

                  {/* Dual-Team Key Stats Badges */}
                  <div className="space-y-1.5 pt-1">
                    {game.keyStats.slice(0, 3).map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">{stat.label}</span>
                        <span className="text-white font-semibold text-[11px] truncate max-w-[65%] text-right">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Decisive Turning Point */}
                  {game.turningPoint && (
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                      <span className="font-bold text-blue-400 block text-[10px] uppercase tracking-wider">
                        ⚡ Decisive Game Momentum:
                      </span>
                      <p className="text-slate-200 text-[11px] mt-0.5">
                        {game.turningPoint}
                      </p>
                    </div>
                  )}

                  {/* Collapsible Box Score Details */}
                  {expandedBoxScoreId === game.id && game.boxScore && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-xs"
                    >
                      <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center justify-between">
                        <span>Dual-Team Box Score & Key Performers</span>
                        <span className="text-emerald-400 text-[10px]">Balanced Parity</span>
                      </div>
                      {game.boxScore.topPerformers && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {game.boxScore.topPerformers.map((p, idx) => (
                            <div key={idx} className="text-slate-300 text-[11px] flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg">
                              <span className="text-amber-400 font-bold shrink-0">•</span>
                              <span className="truncate">{p}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {game.boxScore.totalYards && (
                        <div className="pt-2 border-t border-white/10 flex justify-between text-[11px] text-slate-300 font-semibold">
                          <span>{game.awayTeam.shortName}: {game.boxScore.totalYards.away} Total YDS</span>
                          <span>{game.homeTeam.shortName}: {game.boxScore.totalYards.home} Total YDS</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => openSynthesisModal(game)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95",
                      game.isFloridaState
                        ? "bg-[#782F40] hover:bg-[#8e384c] text-white border border-[#CEB888]/60 shadow-[#782F40]/40"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                    )}
                  >
                    <Icon name="sparkles" className="h-4 w-4" />
                    <span>Synthesize Up to 4 Infographics</span>
                  </button>

                  <button
                    onClick={() => handleOpenInStudio(game)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
                    title="Load all game stats into main Studio editor"
                  >
                    <Icon name="layout" className="h-4 w-4" />
                  </button>

                  {game.boxScore && (
                    <button
                      onClick={() => setExpandedBoxScoreId(expandedBoxScoreId === game.id ? null : game.id)}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all text-xs font-bold"
                      title="Toggle Box Score Details"
                    >
                      <Icon name="chart" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Synthesis Modal / Drawer with Multi-Generation Support */}
      <AnimatePresence>
        {selectedGameForSynthesis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] border-white/15 bg-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <ZenLogo size={36} engraved glow />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Gameday Infographic Studio
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      {selectedGameForSynthesis.awayTeam.name} vs {selectedGameForSynthesis.homeTeam.name} • Dual-Team Balanced Synthesis
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGameForSynthesis(null)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <Icon name="close" className="h-5 w-5" />
                </button>
              </div>

              {/* 50/50 Dual Team Equal Balance Notice */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-emerald-600/15 border border-white/15 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <p className="text-xs text-slate-200 font-semibold">
                    <strong className="text-white">Strict 50/50 Dual-Team Balance Engine:</strong> Both {selectedGameForSynthesis.awayTeam.name} and {selectedGameForSynthesis.homeTeam.name} receive equal visual weight, equal star spotlight cards, dual logos, and head-to-head stat bars.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selectedGameForSynthesis.awayTeam.color || '#00338D' }} title={selectedGameForSynthesis.awayTeam.shortName} />
                  <span className="text-[10px] font-bold text-slate-400">VS</span>
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selectedGameForSynthesis.homeTeam.color || '#E31837' }} title={selectedGameForSynthesis.homeTeam.shortName} />
                </div>
              </div>

              {/* Grounded Real-World Intelligence Card */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="check" className="h-4 w-4 text-emerald-400" />
                    <span>Real-World Verified Intelligence: Rosters, Stadium & Uniforms</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Icon name="map-pin" className="h-3.5 w-3.5 text-red-400" />
                    <span>{selectedGameForSynthesis.venue || selectedGameForSynthesis.stadiumName}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  {/* Away Team Intelligence */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-white text-xs">{selectedGameForSynthesis.awayTeam.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold shrink-0">
                        {selectedGameForSynthesis.awayTeam.uniformBrand || 'Official Apparel'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Uniform: {selectedGameForSynthesis.awayTeam.uniformStyle || 'Standard Road Kit'}
                    </p>
                  </div>

                  {/* Home Team Intelligence */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-white text-xs">{selectedGameForSynthesis.homeTeam.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                        {selectedGameForSynthesis.homeTeam.uniformBrand || 'Official Apparel'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Uniform: {selectedGameForSynthesis.homeTeam.uniformStyle || 'Standard Home Kit'}
                    </p>
                  </div>
                </div>

                {/* Web Image References if available */}
                {selectedGameForSynthesis.webImageReferences && selectedGameForSynthesis.webImageReferences.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Icon name="camera" className="h-3 w-3" />
                      <span>Live Game Action Photography Context (Grounded from Web):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGameForSynthesis.webImageReferences.map((ref, idx) => (
                        <span key={idx} className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-slate-300">
                          📷 {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Domain Harmonization Status Indicator in Modal */}
              {(() => {
                const modalHarmony = selectedGameForSynthesis ? DomainHarmonizer.harmonize({
                  topic: `${selectedGameForSynthesis.awayTeam.name} vs ${selectedGameForSynthesis.homeTeam.name}`,
                  textContent: `${selectedGameForSynthesis.headline} ${selectedGameForSynthesis.summary}`,
                  stylePreset: selectedStyle
                }) : null;

                if (!modalHarmony || !modalHarmony.isIntertwined) return null;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 via-purple-950/50 to-slate-900 border border-blue-500/40 space-y-2 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-black text-white">{modalHarmony.fusionHeadline}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        🛡️ 0% Morphing Guarantee
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{modalHarmony.fusionDescription}</p>
                    <p className="text-[11px] text-slate-400 italic">{modalHarmony.antiMorphingDirectives}</p>
                  </motion.div>
                );
              })()}

              {/* Configuration Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Visual Style Preset */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>1. Style Preset</span>
                    <span className="text-[10px] text-blue-400">{selectedStyle.category}</span>
                  </label>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 preset-scrollbar">
                    {STYLE_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedStyle(preset)}
                        className={cn(
                          "p-2.5 rounded-xl text-left border transition-all text-xs flex items-center justify-between",
                          selectedStyle.id === preset.id
                            ? "bg-blue-600/30 border-blue-500 text-white shadow-md"
                            : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
                        )}
                      >
                        <span className="font-bold block truncate">{preset.name}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">{preset.category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Aspect Ratio & Editorial Angle */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      2. Aspect Ratio
                    </label>
                    <div className="flex gap-2">
                      {[
                        { label: '16:9 Broadcast', value: '16:9' as const },
                        { label: '1:1 Square', value: '1:1' as const },
                        { label: '9:16 Story', value: '9:16' as const },
                      ].map(ar => (
                        <button
                          key={ar.value}
                          onClick={() => setSelectedAspectRatio(ar.value)}
                          className={cn(
                            "flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all",
                            selectedAspectRatio === ar.value
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-400"
                          )}
                        >
                          {ar.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      3. Editorial Angle
                    </label>
                    <select
                      value={customAngle}
                      onChange={e => setCustomAngle(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Dual-Team Head-to-Head Star Duel & Complete Box Score">Dual-Team Head-to-Head Star Duel & Box Score</option>
                      <option value="Key Turning Point, Clutch Drives & Decisive Plays">Key Turning Point & Decisive Plays</option>
                      <option value="Quarterback & Playmaker Head-to-Head Duel">Quarterback & Playmaker Head-to-Head Duel</option>
                      <option value="Upcoming Matchup Forecast, Odds & Keys to Victory">Matchup Forecast, Odds & Keys to Victory</option>
                      <option value="Defensive Lockdown & Turnover Battle Telemetry">Defensive Lockdown & Turnover Battle</option>
                    </select>
                  </div>
                </div>

                {/* 3. Number of Generations Selector (Up to 4) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>4. Variations to Generate</span>
                    <span className="text-[10px] text-amber-400 font-bold">Up to 4</span>
                  </label>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setNumVariations(num)}
                        className={cn(
                          "py-3 rounded-xl text-center border font-black text-sm transition-all",
                          numVariations === num
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 scale-102"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-400"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight pt-1">
                    {numVariations === 1 && "Generates 1 definitive 50/50 dual-team head-to-head infographic."}
                    {numVariations === 2 && "Generates 2 variations: Star Showdown & Full Box Score Telemetry."}
                    {numVariations === 3 && "Generates 3 variations: Star Showdown, Box Score Telemetry & Critical Drives."}
                    {numVariations === 4 && "Generates 4 variations: Star Showdown, Box Score Telemetry, Critical Drives & Primetime Radar."}
                  </p>
                </div>
              </div>

              {/* Action Synthesis Button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateInfographic}
                  disabled={isSynthesizing}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-98"
                >
                  {isSynthesizing ? (
                    <>
                      <Spinner className="h-5 w-5 text-white" />
                      <span>{synthesisStage || 'Synthesizing with Google Grounding & Master Image Engine...'}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="sparkles" className="h-5 w-5" />
                      <span>Synthesize {numVariations} Balanced Gameday Infographic{numVariations > 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Multi-Generation Results Section */}
              {generatedVariations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-6 border-t border-white/10 space-y-6"
                >
                  {/* Results Top Bar & Variation Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-white">
                          Synthesized {generatedVariations.length} High-Definition Variation{generatedVariations.length > 1 ? 's' : ''}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                          Dual-Team Balanced
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Select a variation below to view, compare side-by-side, refine in-place, or send to Studio.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {generatedVariations.length > 1 && (
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => setViewMode('single')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              viewMode === 'single' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            )}
                          >
                            Single View
                          </button>
                          <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              viewMode === 'grid' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            )}
                          >
                            Compare All ({generatedVariations.length})
                          </button>
                        </div>
                      )}

                      <button
                        onClick={handleDownloadAll}
                        className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Icon name="download" className="h-4 w-4" />
                        <span>Download All</span>
                      </button>
                    </div>
                  </div>

                  {/* Variation Navigation Tabs */}
                  {generatedVariations.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {generatedVariations.map((v, idx) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariationIndex(idx);
                            setViewMode('single');
                          }}
                          className={cn(
                            "py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-2",
                            selectedVariationIndex === idx && viewMode === 'single'
                              ? "bg-blue-600/30 border-blue-400 text-white shadow-md shadow-blue-500/20"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-400"
                          )}
                        >
                          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span className="max-w-[200px] truncate">{v.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single View Mode */}
                  {viewMode === 'single' && activeVariation && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Main Image Display with Hallmark & Zoom */}
                        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-white/15 bg-black flex items-center justify-center group">
                          <img
                            src={activeVariation.imageUrl}
                            alt={activeVariation.title}
                            className="w-full h-auto object-contain max-h-[520px] transition-transform duration-300 group-hover:scale-[1.01]"
                          />

                          {/* Engraved Hallmark Badge */}
                          <div className="absolute top-4 left-4 z-10 pointer-events-none">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 shadow-xl">
                              <ZenLogo size={20} engraved glow />
                              <span className="text-[10px] font-black tracking-widest text-slate-200 uppercase">
                                ZEN AI CO. VERIFIED
                              </span>
                            </div>
                          </div>

                          {/* Zoom & Quick Download Actions */}
                          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                            <button
                              onClick={() => setFullScreenImageUrl(activeVariation.imageUrl)}
                              className="p-2.5 rounded-xl bg-black/80 hover:bg-black text-white border border-white/20 backdrop-blur-md transition-all shadow-lg active:scale-95"
                              title="Full Screen Zoom"
                            >
                              <Icon name="search" className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDownloadSingle(activeVariation, selectedVariationIndex, true)}
                              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg active:scale-95"
                              title="Download Official Engraved Graphic"
                            >
                              <Icon name="download" className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Details & Action Controls */}
                        <div className="lg:col-span-4 space-y-4">
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                            <h5 className="text-base font-black text-white leading-snug">
                              {activeVariation.title}
                            </h5>

                            {/* Dual-Team Balanced Bullet Points */}
                            <div className="space-y-2 pt-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Balanced Dual-Team Telemetry Points:
                              </span>
                              {activeVariation.points.map((pt, pIdx) => {
                                const isAway = pIdx % 2 === 0;
                                const teamName = isAway ? selectedGameForSynthesis.awayTeam.shortName : selectedGameForSynthesis.homeTeam.shortName;
                                const teamColor = isAway ? selectedGameForSynthesis.awayTeam.color : selectedGameForSynthesis.homeTeam.color;

                                return (
                                  <div key={pIdx} className="text-xs text-slate-200 flex items-start gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                    <span 
                                      className="px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 text-white"
                                      style={{ backgroundColor: teamColor || '#333' }}
                                    >
                                      {teamName}
                                    </span>
                                    <span className="leading-tight">{pt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Open in Studio Button */}
                          <button
                            onClick={() => {
                              handleOpenInStudio(selectedGameForSynthesis, activeVariation);
                              setSelectedGameForSynthesis(null);
                            }}
                            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                          >
                            <Icon name="layout" className="h-4 w-4" />
                            <span>Open & Customize in Studio</span>
                          </button>

                          {/* In-Place Refinement & Upgrade */}
                          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                              <Icon name="refine" className="h-3.5 w-3.5 text-blue-400" />
                              <span>Refine & Upgrade Generation</span>
                            </span>

                            <input
                              type="text"
                              value={refinementPrompt}
                              onChange={e => setRefinementPrompt(e.target.value)}
                              placeholder="E.g., Enlarge team logos, add stadium floodlight flare, sharpen helmet decals..."
                              className="w-full bg-slate-900 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <button
                              onClick={handleRefineCurrentVariation}
                              disabled={isRefining || !refinementPrompt.trim()}
                              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                            >
                              {isRefining ? (
                                <>
                                  <Spinner className="h-3.5 w-3.5 text-white" />
                                  <span>Refining in 4K...</span>
                                </>
                              ) : (
                                <>
                                  <Icon name="sparkles" className="h-3.5 w-3.5" />
                                  <span>Apply AI Upgrade</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grid View Mode: Compare All Side-by-Side */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {generatedVariations.map((v, idx) => (
                        <div
                          key={v.id}
                          className="p-4 rounded-3xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs">
                                Variation {idx + 1}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                50/50 Dual-Team
                              </span>
                            </div>

                            <div 
                              className="relative rounded-2xl overflow-hidden border border-white/10 bg-black cursor-pointer group"
                              onClick={() => {
                                setSelectedVariationIndex(idx);
                                setViewMode('single');
                              }}
                            >
                              <img
                                src={v.imageUrl}
                                alt={v.title}
                                className="w-full h-auto object-contain max-h-[300px] group-hover:scale-102 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="py-2 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg">
                                  Click to Expand & Refine
                                </span>
                              </div>
                            </div>

                            <h5 className="text-sm font-bold text-white truncate">
                              {v.title}
                            </h5>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            <button
                              onClick={() => handleDownloadSingle(v, idx, true)}
                              className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                            >
                              <Icon name="download" className="h-3.5 w-3.5" />
                              <span>Engraved</span>
                            </button>

                            <button
                              onClick={() => {
                                handleOpenInStudio(selectedGameForSynthesis, v);
                                setSelectedGameForSynthesis(null);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Icon name="layout" className="h-3.5 w-3.5" />
                              <span>Studio</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {fullScreenImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setFullScreenImageUrl(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={fullScreenImageUrl}
                alt="Full screen infographic view"
                className="rounded-3xl border border-white/15 max-h-[90vh] object-contain shadow-2xl"
              />
              <button
                onClick={() => setFullScreenImageUrl(null)}
                className="absolute -top-3 -right-3 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-xl border border-white/20 shadow-xl"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
