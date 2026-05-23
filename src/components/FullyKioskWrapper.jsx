import React, { useEffect } from 'react';

export default function FullyKioskWrapper({ children }) {
  useEffect(() => {
    // Check if running in Fully Kiosk
    const isFullyKiosk = navigator.userAgent.includes('FullyKiosk') || 
                         window.FullyKiosk || 
                         window.location.protocol === 'file:';
    
    if (isFullyKiosk) {
      console.log('Running in Fully Kiosk mode');
      
      // Force repaint and fix for white screen
      setTimeout(() => {
        document.body.style.display = 'block';
        document.body.style.backgroundColor = '#f3f4f6';
        
        // Trigger a reflow
        document.body.offsetHeight;
      }, 100);
      
      // Handle any uncaught errors that might cause white screen
      window.addEventListener('error', (e) => {
        console.error('Caught error in Fully Kiosk:', e);
        e.preventDefault();
      });
    }
  }, []);

  return <>{children}</>;
}