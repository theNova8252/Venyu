import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/me', () =>
    HttpResponse.json({
      id: 'demo-user',
      name: 'Nova',
      topArtists: ['Fred again..'],
      genres: ['electropop'],
    }),
  ),
  http.get('/api/matches', () =>
    HttpResponse.json([{ id: 'm1', userId: 'u2', score: 92, sharedArtists: ['Fred again..'] }]),
  ),
  http.get('/api/events', () =>
    HttpResponse.json([
      {
        id: 'e1',
        title: 'Fred again.. Live',
        date: '2025-11-12',
        city: 'Wien',
        lat: 48.2082,
        lng: 16.3738,
        artists: ['Fred again..'],
      },
    ]),
  ),
  http.post('/api/matches/:id/like', () => new HttpResponse(null, { status: 204 })),
];
