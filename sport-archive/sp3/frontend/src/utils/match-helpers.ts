import { DateTime } from 'luxon';
import { Match, MatchStatus, Competition } from '@/types/match';

// Helper to get team logo (placeholder for now)
export function getTeamLogo(): string {
  // In a real app, you would map team.id or team.name to a logo file
  // For now, always return the placeholder
  return `/team-logos/placeholder.svg`;
}

export function formatCompetitionName(name: string): string {
  // Remove extra characters and clean up competition names
  return name.replace(/[^\w\s\-áéíóöőúüű]/gi, '').trim();
}

export function formatDate(dateString: string, timeZone: string = 'Europe/Budapest'): string {
  let dt: DateTime;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Only date, no time: parse as local date in given timeZone
    dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: timeZone });
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateString)) {
    dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd\'T\'HH:mm:ss', { zone: timeZone });
  } else {
    dt = DateTime.fromISO(dateString, { zone: timeZone });
    if (!dt.isValid) {
      dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm:ss', { zone: timeZone });
    }
  }
  if (!dt.isValid) return 'Invalid date';
  return dt.setZone(timeZone).toFormat('yyyy.MM.dd.');
}

export function formatTime(dateString: string, timeZone: string): string {
  console.log(`Debug: formatTime called with dateString=${dateString}, timeZone=${timeZone}`);
  // Convert UTC time to the provided local time zone
  let dt = DateTime.fromISO(dateString, { zone: 'utc' });
  if (!dt.isValid) {
    dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
  }
  if (!dt.isValid) {
    console.error(`Invalid dateString provided: ${dateString}`);
    return 'Invalid time';
  }
  try {
    return dt.setZone(timeZone).toFormat('HH:mm');
  } catch (error: any) {
    console.error(`Error converting time zone: ${error.message}`);
    return 'Invalid time';
  }
}

export function capitalizeTeamName(name: string): string {
  return name.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

export function getMatchStatus(match: Match): MatchStatus {
  const now = new Date();
  const matchDate = new Date(match.date);
  const diffMinutes = (matchDate.getTime() - now.getTime()) / (1000 * 60);

  if (match.status === 'LIVE' || match.status === 'IN_PLAY') {
    return { type: 'live', label: 'ÉLŐ' };
  } else if (diffMinutes > 15) {
    return { type: 'upcoming', label: 'Közelgő' };
  } else if (diffMinutes > -120 && diffMinutes <= 15) {
    return { type: 'soon', label: 'Hamarosan' };
  } else if (match.homeScore !== undefined && match.awayScore !== undefined) {
    return { type: 'finished', label: 'Véget ért' };
  } else {
    return { type: 'upcoming', label: 'Jövőbeli' };
  }
}

export function getDateNavigation(selectedDate: string, timeZone: string = 'Europe/Budapest') {
  // Use Luxon for robust date math
  let dt = DateTime.fromFormat(selectedDate, 'yyyy-MM-dd', { zone: timeZone });
  if (!dt.isValid) dt = DateTime.fromISO(selectedDate, { zone: timeZone });
  if (!dt.isValid) return { prev: '', next: '', current: 'Invalid date' };
  const prev = dt.minus({ days: 1 }).toFormat('yyyy-MM-dd');
  const next = dt.plus({ days: 1 }).toFormat('yyyy-MM-dd');
  // current is also ISO string for consistency
  const current = dt.toFormat('yyyy-MM-dd');
  return { prev, next, current };
}

export function getMatchCardBg(matchStatus: MatchStatus): string {
  switch (matchStatus.type) {
    case 'live':
      return 'bg-red-900/10 border-l-4 border-red-500/50 hover:bg-red-900/20';
    case 'soon':
      return 'bg-orange-900/10 border-l-4 border-orange-500/50 hover:bg-orange-900/20';
    case 'finished':
      return 'bg-slate-700/20 border-l-4 border-slate-500/30 hover:bg-slate-700/30';
    default:
      return 'hover:bg-slate-700/15';
  }
}

export function getMatchCardBorder(matchStatus: MatchStatus): string {
  switch (matchStatus.type) {
    case 'live':
      return 'border-red-500/30 shadow-red-500/10 shadow-lg';
    case 'soon':
      return 'border-orange-500/30 shadow-orange-500/10 shadow-md';
    case 'finished':
      return 'border-slate-500/20';
    default:
      return 'border-slate-700/30 hover:border-slate-600/50';
  }
}

// Group competitions by country/region for better organization
export function groupCompetitionsByCountry(competitions: Competition[]) {
  const groups: Record<string, Competition[]> = {};

  competitions.forEach(competition => {
    const name = competition.name.toLowerCase();
    let country = 'Egyéb';

    // Map competition names to countries/regions
    if (name.includes('argentin')) country = 'Argentína';
    else if (name.includes('brazil')) country = 'Brazília';
    else if (name.includes('chilei')) country = 'Chile';
    else if (name.includes('kolumbiai')) country = 'Kolumbia';
    else if (name.includes('perui')) country = 'Peru';
    else if (name.includes('uruguayi')) country = 'Uruguay';
    else if (name.includes('ecuadori')) country = 'Ecuador';
    else if (name.includes('bolíviai')) country = 'Bolívia';
    else if (name.includes('venezuelai')) country = 'Venezuela';
    else if (name.includes('paraguayi')) country = 'Paraguay';
    else if (name.includes('japán')) country = 'Japán';
    else if (name.includes('dél-koreai')) country = 'Dél-Korea';
    else if (name.includes('kínai')) country = 'Kína';
    else if (name.includes('svéd')) country = 'Svédország';
    else if (name.includes('norvég')) country = 'Norvégország';
    else if (name.includes('finn')) country = 'Finnország';
    else if (name.includes('izlandi')) country = 'Izland';
    else if (name.includes('dán')) country = 'Dánia';
    else if (name.includes('ír')) country = 'Írország';
    else if (name.includes('feröer')) country = 'Feröer-szigetek';
    else if (name.includes('algériai')) country = 'Algéria';
    else if (name.includes('spanyol')) country = 'Spanyolország';
    else if (name.includes('olasz')) country = 'Olaszország';
    else if (name.includes('mls') || name.includes('usl') || name.includes('usa')) country = 'USA';
    else if (name.includes('nwsl')) country = 'USA (női)';
    else if (name.includes('válogatott') || name.includes('vb-selejtező') || name.includes('eb')) country = 'Válogatott';
    else if (name.includes('u21') || name.includes('u19') || name.includes('touloni')) country = 'Ifjúsági';
    else if (name.includes('klubcsapat vb')) country = 'Klubcsapat VB';
    else if (name.includes('gold cup') || name.includes('concacaf')) country = 'CONCACAF';
    else if (name.includes('ázsia') || name.includes('cosafa')) country = 'Nemzetközi kupák';

    // Debug: log unmatched competitions
    if (country === 'Egyéb') {
      console.log(`🔍 Unmatched competition: "${competition.name}" -> country: "${competition.country}"`);
    }

    if (!groups[country]) groups[country] = [];
    groups[country].push(competition);
  });

  // Sort groups by name and competitions within groups
  const sortedGroups: Record<string, Competition[]> = {};
  Object.keys(groups).sort((a, b) => {
    // Put common countries first
    const priority = ['Válogatott', 'Klubcsapat VB', 'CONCACAF', 'Ifjúsági', 'USA', 'Brazília', 'Argentína'];
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b, 'hu');
  }).forEach(country => {
    sortedGroups[country] = groups[country].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  });

  return sortedGroups;
}

export function formatDayName(dateString: string, timeZone: string = 'Europe/Budapest'): string {
  // Mindig ISO (yyyy-MM-dd) stringet várunk!
  const dt = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: timeZone, locale: 'hu' });
  if (!dt.isValid) return 'Invalid date';
  // Mindig kisbetűs magyar napnév
  return dt.setLocale('hu').toFormat('cccc').toLowerCase();
}

// Egyszerű teszt: 2025-07-08 (kedd), 2025-07-07 (hétfő)
if (process.env.NODE_ENV === 'development') {
  console.log('2025-07-08:', formatDate('2025-07-08'), formatDayName('2025-07-08'));
  console.log('2025-07-07:', formatDate('2025-07-07'), formatDayName('2025-07-07'));
}

// Egyszerű, bombabiztos napnév és dátum logika React/Next komponenshez:
//
// import { DateTime } from 'luxon';
//
// const today = DateTime.now().setZone('Europe/Budapest').toFormat('yyyy-MM-dd');
// const [selectedDate, setSelectedDate] = useState(today);
//
// function handlePrev() {
//   setSelectedDate(DateTime.fromISO(selectedDate).minus({ days: 1 }).toFormat('yyyy-MM-dd'));
// }
// function handleNext() {
//   setSelectedDate(DateTime.fromISO(selectedDate).plus({ days: 1 }).toFormat('yyyy-MM-dd'));
// }
//
// const dayName = DateTime.fromISO(selectedDate).setLocale('hu').toFormat('cccc').toLowerCase();
// const dateStr = DateTime.fromISO(selectedDate).toFormat('yyyy.MM.dd.');
//
// // JSX-ben:
// // <button onClick={handlePrev}>Balra</button>
// // <span>{dateStr} {dayName}</span>
// // <button onClick={handleNext}>Jobbra</button>
