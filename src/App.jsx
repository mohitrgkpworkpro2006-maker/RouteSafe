import { useState } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import ReportIssue from './components/ReportIssue.jsx';
import TravelScreen from './components/TravelScreen.jsx';

export default function App() {
  const [screen, setScreen] = useState('home');
  const home = () => setScreen('home');
  if (screen === 'report') return <ReportIssue onBack={home} />;
  if (screen === 'travel') return <TravelScreen onBack={home} />;
  return <HomeScreen onSelect={setScreen} />;
}
