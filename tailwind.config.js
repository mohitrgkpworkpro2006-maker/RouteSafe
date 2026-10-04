export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        navy: '#16324F', teal: '#177E89', amber: '#E0A11A', paper: '#F7F8F6',
        ink: '#14212B', muted: '#64717D', danger: '#B5473A', line: '#DCE2E6',
        tint: '#EEF3F6', warn: '#FBF3DC', warnink: '#5E4207', dangertint: '#FBF1EF'
      },
      boxShadow: { sm: '0 2px 8px rgba(20,33,43,0.08)' }
    }
  }
};
