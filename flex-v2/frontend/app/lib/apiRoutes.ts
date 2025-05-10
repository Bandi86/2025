/**
 * Az összes API végpont központi helye
 */

export const API_ROUTES = {
  USER: {
    ME: '/user/me',
    LOGIN: '/user/login',
    LOGOUT: '/user/logout',
    REGISTER: '/user/register',
  },
  MEDIA: {
    DIRS: '/dirs',
    FILES: '/files',
    ITEMS: '/media',
    SEARCH: '/search',
    MOVIES: '/media/movies',
    SERIES: '/media/series',
  },
  PLAYER: {
    STATE: '/player/state',
    CONTROL: '/player/control',
  },
  LIBRARY: {
    MOVIES: '/library/movies',
    SERIES: '/library/series',
  },

};
