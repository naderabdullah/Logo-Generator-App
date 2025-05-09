'use client';

import { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Create a variable to store the installation event
    let installPrompt: any = null;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      installPrompt = e;
      // Show the banner
      setShowBanner(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      // Hide the banner when the app is installed
      setShowBanner(false);
      // Clear the saved prompt
      installPrompt = null;
      // Log the installation
      console.log('PWA was installed');
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if the app is already installed or running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle the install button click
  const handleInstall = () => {
    // Get the install prompt from window
    const promptEvent = (window as any).deferredPrompt;
    
    if (!promptEvent) {
      console.log('No install prompt available');
      return;
    }

    // Show the install prompt
    promptEvent.prompt();

    // Wait for the user to respond to the prompt
    promptEvent.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt
      (window as any).deferredPrompt = null;
      // Hide the banner
      setShowBanner(false);
    });
  };

  // Close the banner without installing
  const closeBanner = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="install-banner">
      <div>
        <strong>Install AI Logo Generator</strong>
        <p className="text-sm mt-1">Get it on your home screen for easy access</p>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={closeBanner}
          className="px-3 py-1 bg-indigo-600 bg-opacity-20 rounded text-white"
        >
          Not now
        </button>
        <button 
          id="install-button"
          onClick={handleInstall}
          className="px-3 py-1 bg-white text-indigo-600 font-medium rounded shadow-sm"
        >
          Install
        </button>
      </div>
    </div>
  );
}