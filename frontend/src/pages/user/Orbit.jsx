import React, { useEffect, useState } from 'react';
import ClassicOrbit from './ClassicOrbit';
import BentoOrbit from './BentoOrbit';

export default function Orbit() {
  const [viewMode, setViewMode] = useState('classic');

  useEffect(() => {
    // Check local storage for preference, default to 'classic' as requested
    const savedMode = localStorage.getItem('orbit_view_mode') || 'classic';
    setViewMode(savedMode);

    // Listen for storage events (if changed in another tab or settings)
    const handleStorageChange = () => {
      const newMode = localStorage.getItem('orbit_view_mode') || 'classic';
      setViewMode(newMode);
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event listener for immediate update within the same window
    window.addEventListener('orbit-view-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orbit-view-change', handleStorageChange);
    };
  }, []);

  return (
    <>
      {viewMode === 'bento' ? <BentoOrbit /> : <ClassicOrbit />}
    </>
  );
}