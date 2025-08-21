import React, { useState, useEffect } from 'react'
import { TamaguiProvider } from 'tamagui'
import config from './tamagui.config'
import { HomeScreen } from './src/screens/HomeScreen'
import { TrailerModeScreen } from './src/screens/TrailerModeScreen'
import { CalibrationScreen } from './src/screens/CalibrationScreen'
import { useAppStore } from './src/state/appStore'

type Screen = 'home' | 'trailer' | 'van' | 'calibration'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const { loadProfiles, loadSettings, profiles, addProfile, setActiveProfile } = useAppStore()

  useEffect(() => {
    const initializeApp = async () => {
      // Load existing profiles and settings
      await Promise.all([loadProfiles(), loadSettings()])
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        const currentState = useAppStore.getState()
        
        // If no profiles exist, create a default one
        if (currentState.profiles.length === 0) {
          addProfile({
            name: 'Default Trailer',
            type: 'trailer',
            wheelbaseInches: 144, // 12 feet
            trackWidthInches: 72,  // 6 feet
            hitchOffset: 0,
            calibration: { pitch: 0, roll: 0 }
          })
          
          // After adding profile, set it as active
          setTimeout(() => {
            const newState = useAppStore.getState()
            if (newState.profiles.length > 0 && !newState.activeProfile) {
              setActiveProfile(newState.profiles[0].id)
            }
          }, 100)
        } else if (!currentState.activeProfile && currentState.profiles.length > 0) {
          // If profiles exist but no active profile, set the first one as active
          setActiveProfile(currentState.profiles[0].id)
        }
      }, 100)
    }
    
    initializeApp()
  }, []) // Empty dependency array to run only once

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'trailer':
        return <TrailerModeScreen onBack={() => navigateTo('home')} onNavigateToCalibration={() => navigateTo('calibration')} />
      case 'van':
        return <div>Van Mode - Coming Soon!</div>
      case 'calibration':
        return <CalibrationScreen onNavigateBack={() => navigateTo('trailer')} />
      default:
        return <HomeScreen onNavigate={navigateTo} />
    }
  }

  return (
    <TamaguiProvider config={config}>
      {renderScreen()}
    </TamaguiProvider>
  )
}
