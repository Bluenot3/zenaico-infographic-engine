
import type { StylePreset } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  // --- MASTERPIECE COLLECTION (High-End/Ultra-Technical) ---
  { 
    id: 'luxury_deco', 
    name: 'The Gatsby (Art Deco)', 
    promptSuffix: 'luxury art deco style, black marble background with intricate gold foil geometric borders, great gatsby aesthetic, 1920s typography, serif fonts, cinematic lighting, high contrast, elegant, expensive, sharp vector lines, award winning graphic design.', 
    category: 'Masterpiece' 
  },
  { 
    id: 'scifi_hud', 
    name: 'Nexus HUD (Ultra-Technical)', 
    promptSuffix: 'futuristic FUI interface, dark slate gray background, glowing neon teal and orange data lines, iron man hud style, technical schematics, cybernetic aesthetics, data visualization, clean sans-serif typography, 8k resolution, screen graphics, complex data modules.', 
    category: 'Masterpiece' 
  },
  { 
    id: 'cognitive_3d', 
    name: 'Cognitive 3D (Surreal)', 
    promptSuffix: 'surreal 3D render, octane render, unreal engine 5, floating gold geometric shapes, glass textures, dramatic studio lighting, dark void background, mystical and technological fusion, hyper-realistic materials, 8k, masterpiece.', 
    category: 'Masterpiece' 
  },
  { 
    id: 'governance_iso', 
    name: 'Governance (Isometric)', 
    promptSuffix: 'technological isometric 3D, glowing holograms, gold and brushed metal textures, dark cinematic atmosphere, complex machinery, digital twin aesthetic, sharp focus, raytracing, professional business intelligence.', 
    category: 'Masterpiece' 
  },
  { 
    id: 'glassmorphism', 
    name: 'Glassmorphism 2.0', 
    promptSuffix: 'frosted glass UI elements, blurred background transparency, vibrant gradients, soft shadows, modern iOS aesthetic, clean white text, floating cards, premium app interface design.', 
    category: 'Masterpiece' 
  },

  // --- PROFESSIONAL / CORPORATE ---
  { id: 'corporate_blue', name: 'Fortune 500 Blue', promptSuffix: 'trustworthy deep blue corporate palette, clean grid layout, helvetica font, flat design, business professional, annual report style, vector icons.', category: 'Professional' },
  { id: 'swiss_design', name: 'Swiss International', promptSuffix: 'international typographic style, asymmetric layout, strong grid, sans-serif typography, bold red and black, minimalist, structured, objective photography.', category: 'Professional' },
  { id: 'tech_white', name: 'Silicon Valley White', promptSuffix: 'clean white background, apple aesthetics, minimalist grey text, subtle drop shadows, rounded corners, modern tech startup pitch deck style.', category: 'Professional' },
  { id: 'dark_mode_saas', name: 'SaaS Dark Mode', promptSuffix: 'dark grey interface, vibrant purple and blue gradients, dashboard analytics style, modern software UI, clean data charts, glowing accents.', category: 'Professional' },
  { id: 'financial_times', name: 'Financial Pink', promptSuffix: 'salmon pink background, serif typography, black ink illustrations, financial data chart style, economist aesthetic, newspaper quality.', category: 'Professional' },
  { id: 'consulting', name: 'Management Consulting', promptSuffix: 'mckinsey style, clean slide design, chevron processes, muted professional colors, structured frameworks, executive summary aesthetic.', category: 'Professional' },

  // --- SCIENTIFIC & TECHNICAL ---
  { id: 'blueprint_classic', name: 'Engineering Blueprint', promptSuffix: 'cyanotype blue background, white technical lines, architectural drafting font, grid paper texture, measured dimensions, schematic aesthetic.', category: 'Technical' },
  { id: 'medical_journal', name: 'Medical Journal', promptSuffix: 'clean white background, anatomical detail, realistic medical illustration, soft blue and red palette, scientific accuracy, textbook quality.', category: 'Technical' },
  { id: 'cyber_security', name: 'Cyber Security', promptSuffix: 'matrix green code rain, digital shield motifs, padlock icons, network topology nodes, dark hacker aesthetic, binary data streams.', category: 'Technical' },
  { id: 'space_exploration', name: 'NASA Manual', promptSuffix: 'space age design, retro nasa manual style, helvetica, stark black and white with red accents, orbital mechanics diagrams, technical labeling.', category: 'Technical' },
  { id: 'eco_science', name: 'Botanical Science', promptSuffix: 'vintage botanical illustration style, parchment texture, detailed line art, natural green and earth tones, biological labeling, cross-section views.', category: 'Technical' },

  // --- ARTISTIC & ILLUSTRATIVE ---
  { id: 'watercolor_soft', name: 'Soft Watercolor', promptSuffix: 'hand-painted watercolor, wet-on-wet technique, pastel bleed, textured paper, artistic and organic, gentle flow, soft edges.', category: 'Artistic' },
  { id: 'oil_painting', name: 'Oil Impasto', promptSuffix: 'thick oil paint texture, brush strokes, vibrant colors, expressive art style, museum quality, painterly infographic.', category: 'Artistic' },
  { id: 'pop_art', name: 'Pop Art Comic', promptSuffix: 'roy lichtenstein style, ben-day dots, bold black outlines, primary colors, comic book panels, speech bubbles, dynamic action.', category: 'Artistic' },
  { id: 'collage_mixed', name: 'Mixed Media Collage', promptSuffix: 'cutout paper texture, ripped edges, vintage photos mixed with vector art, punk zine aesthetic, chaotic but organized, avant-garde.', category: 'Artistic' },
  { id: 'neon_noir', name: 'Neon Noir', promptSuffix: 'rain-slicked streets background, pink and blue neon signs, dramatic shadows, cyberpunk detective vibe, high contrast, moody.', category: 'Artistic' },
  { id: 'paper_craft', name: 'Paper Cutout', promptSuffix: 'digital paper craft, layered paper shadows, depth of field, vibrant construction paper colors, crafty and tactile feel, 3d effect.', category: 'Artistic' },
  { id: 'pixel_art', name: '8-Bit Retro', promptSuffix: 'pixel art style, 8-bit video game aesthetic, limited color palette, blocky text, arcade interface, retro gaming nostalgia.', category: 'Artistic' },
  { id: 'graffiti', name: 'Street Art', promptSuffix: 'graffiti spray paint style, urban concrete texture, bold tags, vibrant street culture colors, stencil art elements, rebellious tone.', category: 'Artistic' },

  // --- MINIMALIST ---
  { id: 'bauhaus', name: 'Bauhaus', promptSuffix: 'bauhaus design movement, geometric shapes, primary colors (red blue yellow), minimalism, form follows function, clean lines, modernist.', category: 'Minimalist' },
  { id: 'japandi', name: 'Japandi', promptSuffix: 'japanese scandinavian fusion, neutral earth tones, bamboo textures, minimalism, nature-inspired, calm and balanced, zen aesthetic.', category: 'Minimalist' },
  { id: 'monochrome_black', name: 'Monochrome Noir', promptSuffix: 'black and white photography, high contrast, noir film style, dramatic lighting, timeless elegance, sophisticated.', category: 'Minimalist' },
  { id: 'line_art', name: 'Continuous Line', promptSuffix: 'single continuous line drawing, minimalist vector, white background, black ink, fluid motion, abstract simplicity.', category: 'Minimalist' },

  // --- EDITORIAL ---
  { id: 'vintage_news', name: 'Vintage Newspaper', promptSuffix: 'old newsprint texture, serif headlines, grayscale photos, column layout, victorian advertising style, retro journalism.', category: 'Editorial' },
  { id: 'fashion_mag', name: 'Vogue Editorial', promptSuffix: 'high fashion photography, serif titles, ample negative space, elegant layout, luxury brand aesthetic, stylish and chic.', category: 'Editorial' },
  { id: 'nat_geo', name: 'Nature Magazine', promptSuffix: 'national geographic style, yellow border, stunning nature photography, educational diagrams, bold cartography, explorer aesthetic.', category: 'Editorial' },
  { id: 'wired_tech', name: 'Wired Magazine', promptSuffix: 'fluorescent colors, glitch art, tech-forward, edgy layout, digital distortion, modern cyber culture.', category: 'Editorial' },

  // --- ABSTRACT ---
  { id: 'fluid_acrylic', name: 'Fluid Acrylic', promptSuffix: 'liquid acrylic pour, swirling marble patterns, psychedelic colors, abstract flow, organic shapes, mesmerizing texture.', category: 'Abstract' },
  { id: 'geometric_pattern', name: 'Sacred Geometry', promptSuffix: 'sacred geometry patterns, mandala, golden ratio, fibonacci spiral, mystical mathematical, thin gold lines, cosmic background.', category: 'Abstract' },
  { id: 'low_poly', name: 'Low Poly', promptSuffix: 'low poly 3d mesh, triangular facets, gradient shading, digital origami, sharp edges, modern geometric abstract.', category: 'Abstract' },
  { id: 'vaporwave', name: 'Vaporwave', promptSuffix: 'vaporwave aesthetic, purple and teal gradients, roman statues, glitch effects, 90s internet nostalgia, palm trees, surreal.', category: 'Abstract' },
];
