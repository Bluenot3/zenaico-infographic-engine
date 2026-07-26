import { suggestDataPoints } from './services/geminiService.js';

suggestDataPoints('artificial intelligence')
  .then(res => console.log('SUCCESS:', res))
  .catch(err => console.error('ERROR:', err));
