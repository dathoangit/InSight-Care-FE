/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'modal-backdrop-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'modal-sheet-in': {
          from: { transform: 'translate3d(0, 100%, 0)', opacity: '0' },
          to: { transform: 'translate3d(0, 0, 0)', opacity: '1' },
        },
        'modal-dialog-in': {
          from: {
            transform: 'translate3d(0, 8px, 0) scale(0.985)',
            opacity: '0',
          },
          to: { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '1' },
        },
        'modal-backdrop-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'modal-sheet-out': {
          from: { transform: 'translate3d(0, 0, 0)' },
          to: { transform: 'translate3d(0, 100%, 0)' },
        },
        'modal-dialog-out': {
          from: { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '1' },
          to: { transform: 'translate3d(0, 16px, 0) scale(0.97)', opacity: '0' },
        },
      },
      animation: {
        'modal-backdrop-in':
          'modal-backdrop-in 0.2s ease-out forwards',
        'modal-sheet-in':
          'modal-sheet-in 0.34s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'modal-dialog-in':
          'modal-dialog-in 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-backdrop-out':
          'modal-backdrop-out 0.18s ease-in forwards',
        'modal-sheet-out':
          'modal-sheet-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'modal-dialog-out':
          'modal-dialog-out 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
    },
  },
  plugins: [],
};
