/**
 * Toronto Tempo 2026 Home Games Schedule
 * 15 games at Coca-Cola Coliseum + 3 games at Scotiabank Arena
 */
export interface SeasonGame {
  opponent: string;
  venue: 'Coca-Cola Coliseum' | 'Scotiabank Arena';
  gameDate: string; // YYYY-MM-DD
  gameTime: string; // HH:MM
  isMarquee: boolean;
}

// Marquee opponents (rivals/star players)
const marqueeOpponents = [
  'Las Vegas Aces',
  'New York Liberty',
  'Seattle Storm',
  'Phoenix Mercury',
  'Connecticut Sun'
];

export const seasonGames: SeasonGame[] = [
  // Coca-Cola Coliseum games (15)
  { opponent: 'Las Vegas Aces', venue: 'Coca-Cola Coliseum', gameDate: '2026-05-15', gameTime: '19:00', isMarquee: true },
  { opponent: 'Seattle Storm', venue: 'Coca-Cola Coliseum', gameDate: '2026-05-22', gameTime: '19:00', isMarquee: true },
  { opponent: 'Indiana Fever', venue: 'Coca-Cola Coliseum', gameDate: '2026-05-29', gameTime: '15:00', isMarquee: false },
  { opponent: 'Chicago Sky', venue: 'Coca-Cola Coliseum', gameDate: '2026-06-05', gameTime: '19:00', isMarquee: false },
  { opponent: 'New York Liberty', venue: 'Coca-Cola Coliseum', gameDate: '2026-06-12', gameTime: '19:00', isMarquee: true },
  { opponent: 'Atlanta Dream', venue: 'Coca-Cola Coliseum', gameDate: '2026-06-19', gameTime: '15:00', isMarquee: false },
  { opponent: 'Washington Mystics', venue: 'Coca-Cola Coliseum', gameDate: '2026-06-26', gameTime: '19:00', isMarquee: false },
  { opponent: 'Phoenix Mercury', venue: 'Coca-Cola Coliseum', gameDate: '2026-07-03', gameTime: '19:00', isMarquee: true },
  { opponent: 'Dallas Wings', venue: 'Coca-Cola Coliseum', gameDate: '2026-07-10', gameTime: '15:00', isMarquee: false },
  { opponent: 'Connecticut Sun', venue: 'Coca-Cola Coliseum', gameDate: '2026-07-17', gameTime: '19:00', isMarquee: true },
  { opponent: 'Minnesota Lynx', venue: 'Coca-Cola Coliseum', gameDate: '2026-07-24', gameTime: '19:00', isMarquee: false },
  { opponent: 'Los Angeles Sparks', venue: 'Coca-Cola Coliseum', gameDate: '2026-07-31', gameTime: '15:00', isMarquee: false },
  { opponent: 'Golden State Valkyries', venue: 'Coca-Cola Coliseum', gameDate: '2026-08-07', gameTime: '19:00', isMarquee: false },
  { opponent: 'Las Vegas Aces', venue: 'Coca-Cola Coliseum', gameDate: '2026-08-14', gameTime: '19:00', isMarquee: true },
  { opponent: 'Chicago Sky', venue: 'Coca-Cola Coliseum', gameDate: '2026-08-21', gameTime: '15:00', isMarquee: false },
  
  // Scotiabank Arena games (3)
  { opponent: 'New York Liberty', venue: 'Scotiabank Arena', gameDate: '2026-06-28', gameTime: '19:00', isMarquee: true },
  { opponent: 'Seattle Storm', venue: 'Scotiabank Arena', gameDate: '2026-08-02', gameTime: '15:00', isMarquee: true },
  { opponent: 'Connecticut Sun', venue: 'Scotiabank Arena', gameDate: '2026-08-28', gameTime: '19:00', isMarquee: true },
];

/**
 * Check if a game is family-friendly (before 6 PM local time)
 */
export function isFamilyFriendly(gameTime: string): boolean {
  const [hours] = gameTime.split(':').map(Number);
  return hours < 18;
}
