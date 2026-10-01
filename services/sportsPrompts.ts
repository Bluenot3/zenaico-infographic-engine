import type { SportsGame } from '../types';
import { DomainHarmonizer } from './domainHarmonizer';

/** Broadcast composition shared by SportsHub and the plugin, grounded in caller-supplied game data. */
export function buildBalancedSportsPrompt(game: SportsGame, styleName: string, stylePrompt: string, variationIndex = 0): string {
  const performers = game.boxScore?.topPerformers || [];
  const homePlayer = performers.find(p => p.includes(game.homeTeam.shortName) || p.includes(game.homeTeam.name));
  const awayPlayer = performers.find(p => p.includes(game.awayTeam.shortName) || p.includes(game.awayTeam.name));
  const awayColor = game.awayTeam.color || 'official away-team colors';
  const homeColor = game.homeTeam.color || 'official home-team colors';
  const stadium = game.stadiumName || game.venue || 'No venue supplied; use a neutral broadcast backdrop';
  const harmony = DomainHarmonizer.harmonize({
    topic: `${game.awayTeam.name} vs ${game.homeTeam.name}`,
    stylePreset: { id: 'sports-sel', name: styleName, promptSuffix: stylePrompt, category: 'Sports & Gameday' },
  });
  const score = game.score ? `${game.awayTeam.shortName} ${game.score.away} — ${game.score.home} ${game.homeTeam.shortName}` : `${game.awayTeam.shortName} VS ${game.homeTeam.shortName}`;
  const angles = ['Head-to-head showdown', 'Comparative box-score telemetry', 'Turning point and momentum', 'Primetime matchup radar'];
  return `Ultra-high-resolution, award-winning sports broadcast infographic for ${game.awayTeam.name} vs ${game.homeTeam.name}.
EDITORIAL COMPOSITION: ${angles[variationIndex % angles.length]}.
LEFT HALF (50%): ${game.awayTeam.name}, colors ${awayColor}${awayPlayer ? `, prominent player card for ${awayPlayer}` : ', team-focused composition; no invented player names or jersey numbers'}.
RIGHT HALF (50%): ${game.homeTeam.name}, colors ${homeColor}${homePlayer ? `, prominent player card for ${homePlayer}` : ', team-focused composition; no invented player names or jersey numbers'}.
UNIFORMS: ${game.awayTeam.uniformBrand || 'No sponsor supplied; omit apparel logos'} / ${game.homeTeam.uniformBrand || 'No sponsor supplied; omit apparel logos'}.
VENUE: ${stadium}${game.stadiumLocation ? `, ${game.stadiumLocation}` : ''}.
CENTER SCOREBUG: "${score}", status "${game.status}", time "${game.quarterOrTime}", date "${game.gameDate}".
HEADLINE: ${game.headline}
SUMMARY: ${game.summary}
EXACT VERIFIED STATS:
${game.keyStats.map(s => `* ${s.label}: ${s.value}`).join('\n')}
${game.turningPoint ? `TURNING POINT: ${game.turningPoint}` : ''}
VISUAL STYLE: ${styleName}. ${harmony.isIntertwined ? harmony.harmonizedStylePrompt : stylePrompt}
${harmony.isIntertwined ? harmony.antiMorphingDirectives : ''}
LIGHTING: Stadium floodlights, volumetric atmosphere, glossy glassmorphic telemetry cards, 3D broadcast finish,
razor-sharp detail. Both teams receive equal space and clear, readable comparative stat bars.
SOURCE FIDELITY: Use only supplied scores, dates, statistics, rosters and apparel details. Do not replace players
with a hardcoded roster, invent missing performance data, or depict an upcoming game's score as a final result.`;
}
