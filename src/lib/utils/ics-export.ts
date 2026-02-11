import type { Game } from '$lib/supabase/types';

interface ICSEvent {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  location: string;
  description: string;
}

/**
 * Generate ICS calendar content for exported games
 */
export function generateICS(games: Game[], playerName: string): string {
  const events: ICSEvent[] = games.map((game) => {
    const gameDate = new Date(game.game_date);
    const [hours, minutes] = game.game_time.split(':').map(Number);
    gameDate.setHours(hours, minutes, 0, 0);
    
    // Game duration: 2.5 hours
    const endDate = new Date(gameDate.getTime() + 2.5 * 60 * 60 * 1000);
    
    return {
      uid: `${game.id}@tempodraft.app`,
      start: gameDate,
      end: endDate,
      title: `Toronto Tempo vs ${game.opponent}`,
      location: game.venue,
      description: `Drafted via Tempo Draft V2`
    };
  });

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tempo Draft//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Toronto Tempo Games',
    'X-WR-TIMEZONE:America/Toronto'
  ];

  events.forEach((event) => {
    icsContent = icsContent.concat([
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `LOCATION:${escapeICS(event.location)}`,
      `DESCRIPTION:${escapeICS(event.description)}`,
      'END:VEVENT'
    ]);
  });

  icsContent.push('END:VCALENDAR');
  
  return icsContent.join('\r\n');
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Download ICS file
 */
export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
