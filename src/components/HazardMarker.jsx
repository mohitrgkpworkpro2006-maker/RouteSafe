import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { TriangleAlert, MapPinned } from 'lucide-react';

const svg = (Icon) => renderToStaticMarkup(<Icon size={16} strokeWidth={2} />);
const pill = (icon, text, bg, fg) =>
  `<div style="transform:translate(-50%,-110%);display:flex;align-items:center;gap:6px;background:${bg};color:${fg};font:500 13px 'IBM Plex Sans',sans-serif;padding:5px 10px;border-radius:8px;white-space:nowrap;box-shadow:0 2px 8px rgba(20,33,43,.25)">${icon}${text}</div>`;
const mk = (html) => L.divIcon({ className: 'rs-pin', iconSize: [0, 0], html });

export const hazardIcon = mk(pill(svg(TriangleAlert), 'Hazard', '#E0A11A', '#14212B'));
export const destinationIcon = mk(pill(svg(MapPinned), 'Destination', '#16324F', '#fff'));
export const youIcon = L.divIcon({ className: 'rs-pin', iconSize: [22, 22], iconAnchor: [11, 11],
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#16324F;border:3px solid #fff;box-shadow:0 0 0 5px rgba(23,126,137,.35)"></div>' });
