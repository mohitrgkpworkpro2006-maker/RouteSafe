// "Dog Pack" and "3-5" appear in the contract. The other values are NOT specified there:
// confirm them with the backend team and edit here.
export const ISSUE_TYPES = [
  { id: 'dog', label: 'Aggressive dog or dog pack', reason: 'Dog Pack' },
  { id: 'light', label: 'Poor lighting', reason: 'Dimly Lit Route' },
  { id: 'other', label: 'Other hazard', reason: 'Other Hazard' }
];
export const PACK_SIZES = ['1-2', '3-5', '6+'];

// Demo mode pins the app to one Nalanchira scenario so a presentation needs no GPS
// permission and no typing. Set VITE_DEMO_MODE=false for the real product.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Mar Aprem Hostel, behind Mar Baselios College -> Nalanchira Main Gate.
export const DEMO_ORIGIN = [8.5493890, 76.9381227];
export const DEMO_DESTINATION = [8.5425158, 76.9416851];
export const DEMO_ORIGIN_LABEL = 'Mar Aprem Hostel';
export const DEMO_DESTINATION_LABEL = 'Nalanchira Main Gate';
