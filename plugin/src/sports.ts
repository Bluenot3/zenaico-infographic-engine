import type { SportsGame } from '../../types';
import { gameSchema } from './schemas';

const endpoints = {
  cfb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
};
export async function getSportsFeed(input: { sport?: 'all' | 'cfb' | 'nfl' | 'fsu'; query?: string; date?: string }, signal?: AbortSignal) {
  const sport = input.sport || 'all';
  const fetchedAt = new Date().toISOString();
  const date = input.date || fetchedAt.slice(0, 10).replaceAll('-', '');
  const leagues = sport === 'all' ? ['cfb', 'nfl'] as const : [sport === 'fsu' ? 'cfb' : sport] as const;
  const sources: string[] = [];
  const games: SportsGame[] = [];
  for (const league of leagues) {
    const url = new URL(endpoints[league]);
    url.searchParams.set('dates', date); url.searchParams.set('limit', '100');
    if (league === 'cfb') url.searchParams.set('groups', '80');
    sources.push(url.href);
    const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Sports scoreboard returned HTTP ${response.status}. No demo scores were substituted.`);
    const feed = await response.json();
    for (const event of feed.events || []) {
      const competition = event.competitions?.[0];
      const home = competition?.competitors?.find((c: { homeAway: string }) => c.homeAway === 'home');
      const away = competition?.competitors?.find((c: { homeAway: string }) => c.homeAway === 'away');
      if (!home || !away) continue;
      const team = (c: typeof home) => ({ name: c.team.displayName, shortName: c.team.abbreviation || c.team.displayName,
        color: c.team.color ? `#${c.team.color}` : undefined, record: c.records?.find((r: { type: string }) => r.type === 'total')?.summary });
      const category = competition.status?.type || event.status?.type;
      const status = category?.completed ? 'FINAL' : category?.state === 'in' ? 'LIVE' : 'UPCOMING';
      const scores = status !== 'UPCOMING' && home.score != null && away.score != null
        ? { home: Number(home.score), away: Number(away.score) } : undefined;
      const keyStats = [home, away].flatMap(c => (c.statistics || []).filter((s: { displayValue?: string }) => s.displayValue != null)
        .map((s: { label?: string; name: string; displayValue: string }) => ({ label: `${c.team.abbreviation}: ${s.label || s.name}`, value: s.displayValue })));
      const performers = [home, away].flatMap(c => (c.leaders || []).flatMap((l: { displayName?: string; leaders?: Array<{ athlete?: { displayName?: string }; displayValue?: string }> }) =>
        (l.leaders || []).filter(p => p.athlete?.displayName).map(p => `${p.athlete!.displayName} (${c.team.abbreviation}): ${l.displayName || 'Leader'} ${p.displayValue || ''}`)));
      const game = gameSchema.parse({
        id: String(event.id), sport: league === 'cfb' ? 'CFB' : 'NFL', league: league === 'cfb' ? 'NCAA College Football' : 'NFL',
        homeTeam: team(home), awayTeam: team(away), score: scores, status, gameDate: event.date,
        quarterOrTime: competition.status?.type?.shortDetail || event.status?.type?.shortDetail || status,
        headline: event.name || `${away.team.displayName} vs ${home.team.displayName}`,
        summary: competition.headlines?.map((h: { description: string }) => h.description).join(' ') || '',
        venue: competition.venue?.fullName, stadiumName: competition.venue?.fullName,
        stadiumLocation: [competition.venue?.address?.city, competition.venue?.address?.state].filter(Boolean).join(', '),
        keyStats, isFloridaState: [home, away].some(c => String(c.team.id) === '52'),
        boxScore: performers.length ? { topPerformers: performers } : undefined,
      });
      if (sport === 'fsu' && !game.isFloridaState) continue;
      if (input.query && !JSON.stringify(game).toLowerCase().includes(input.query.toLowerCase())) continue;
      games.push(game);
    }
  }
  return { games, source: 'ESPN public scoreboard', sourceURLs: sources, fetchedAt, date,
    note: 'Only fields returned by the scoreboard are included. Verify uniforms, rosters, and missing box-score details from additional sources before adding them.' };
}
