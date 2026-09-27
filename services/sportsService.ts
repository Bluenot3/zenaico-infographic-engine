import type { SportsGame, SportsFeedResponse, InfographicContent, StylePreset, GenerationOptions } from '../types';

export const sportsService = {
  async getFeed(params: {
    sport?: 'all' | 'cfb' | 'nfl' | 'fsu';
    query?: string;
    forceRefresh?: boolean;
  }): Promise<SportsFeedResponse> {
    try {
      const response = await fetch('/api/sports/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sports feed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Falling back to local baseline sports feed', error);
      // Fallback response if network fails
      return {
        games: [],
        source: 'Local Cache',
        lastUpdated: new Date().toLocaleTimeString(),
        headline: 'Sports Feed Offline'
      };
    }
  },

  async synthesizePlan(params: {
    game: SportsGame;
    styleName?: string;
    stylePrompt?: string;
    aspectRatio?: string;
    layout?: string;
    customAngle?: string;
    count?: number;
  }): Promise<InfographicContent> {
    const data = await this.synthesizePlans({ ...params, count: params.count || 1 });
    return data;
  },

  async synthesizePlans(params: {
    game: SportsGame;
    styleName?: string;
    stylePrompt?: string;
    aspectRatio?: string;
    layout?: string;
    customAngle?: string;
    count?: number;
  }): Promise<{ plans: InfographicContent[] } & InfographicContent> {
    const response = await fetch('/api/sports/synthesize-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to synthesize sports infographic plan');
    }

    const data = await response.json();
    return {
      plans: data.plans || [data],
      title: data.title || '',
      points: data.points || [],
      imagePrompt: data.imagePrompt || ''
    };
  }
};
