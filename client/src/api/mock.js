// no types, just plain JS objects
const demoUser = {
  id: 'demo-user',
  name: 'Nova',
  topArtists: ['Fred again..', 'Travis Scott', 'Billie Eilish'],
  genres: ['electropop', 'rap', 'alt-pop'],
};

const demoMatches = [
  { id: 'm1', userId: 'u2', score: 92, sharedArtists: ['Fred again..', 'Billie Eilish'] },
  { id: 'm2', userId: 'u3', score: 84, sharedArtists: ['Travis Scott'] },
];

const demoEvents = [
  {
    id: 'e1',
    title: 'Fred again.. Live',
    date: '2025-11-12',
    city: 'Wien',
    lat: 48.2082,
    lng: 16.3738,
    artists: ['Fred again..'],
  },
  {
    id: 'e2',
    title: 'Nova Indie Night',
    date: '2025-11-20',
    city: 'Wien',
    lat: 48.21,
    lng: 16.37,
    artists: ['Local Indie'],
  },
];

export const demoAPI = {
  async getMe() {
    return JSON.parse(JSON.stringify(demoUser));
  },
  async getMatches() {
    return JSON.parse(JSON.stringify(demoMatches));
  },
  async getEventsNearby() {
    return JSON.parse(JSON.stringify(demoEvents));
  },
  async likeMatch(/* id */) {
    /* no-op for demo */
  },
};
