import { useEffect, useState, useRef } from 'react';

interface AttitudeData {
  pitchDeg: number;
  rollDeg: number;
  raw: {
    pitch: number;
    roll: number;
    yaw: number;
  };
  isReliable: boolean;
}

const LOW_PASS_FILTER_ALPHA = 0.8; // Smoothing factor

export function useDeviceAttitude() {
  const [attitude, setAttitude] = useState<AttitudeData>({
    pitchDeg: 0,
    rollDeg: 0,
    raw: { pitch: 0, roll: 0, yaw: 0 },
    isReliable: false,
  });

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const prevValues = useRef<{ pitch: number; roll: number }>({ pitch: 0, roll: 0 });
  const listenerActive = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const setupNativeSensors = async () => {
      try {
        console.log('Setting up native browser sensors...');
        
        // Check if DeviceOrientationEvent is available
        if (typeof (window as any).DeviceOrientationEvent === 'undefined') {
          console.log('DeviceOrientationEvent not available');
          setIsAvailable(false);
          setErrorMessage('Device orientation sensors not supported in this browser');
          return;
        }

        // Check if we're on iOS and need permission
        const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isHTTPS = window.location.protocol === 'https:';
        
        console.log('Device info:', { isIOSSafari, isHTTPS });
        
        if (isIOSSafari) {
          // iOS requires permission request
          if (typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
            try {
              console.log('Requesting iOS DeviceOrientation permission...');
              const permission = await (window as any).DeviceOrientationEvent.requestPermission();
              console.log('iOS permission result:', permission);
              setPermissionStatus(permission);
              
              if (permission !== 'granted') {
                setIsAvailable(false);
                setErrorMessage(`Device orientation permission ${permission}. Please grant permission to access motion sensors.`);
                return;
              }
            } catch (error) {
              console.log('iOS permission request failed:', error);
              setIsAvailable(false);
              setErrorMessage('Failed to request device orientation permission');
              return;
            }
          }
        }

        // Set up the orientation event listener
        const handleOrientation = (event: DeviceOrientationEvent) => {
          if (!mounted || listenerActive.current === false) return;

          const alpha = event.alpha || 0; // compass heading (not used)
          const beta = event.beta || 0;   // pitch (front/back tilt) -180 to 180
          const gamma = event.gamma || 0; // roll (left/right tilt) -90 to 90
          
          // Apply low-pass filter for smoothing
          const filteredPitch = LOW_PASS_FILTER_ALPHA * beta + 
                               (1 - LOW_PASS_FILTER_ALPHA) * prevValues.current.pitch;
          const filteredRoll = LOW_PASS_FILTER_ALPHA * gamma + 
                              (1 - LOW_PASS_FILTER_ALPHA) * prevValues.current.roll;

          prevValues.current = { pitch: filteredPitch, roll: filteredRoll };

          setAttitude({
            pitchDeg: filteredPitch,
            rollDeg: filteredRoll,
            raw: { pitch: beta, roll: gamma, yaw: alpha },
            isReliable: true,
          });
        };

        // Add the event listener
        window.addEventListener('deviceorientation', handleOrientation);
        listenerActive.current = true;
        
        console.log('Native orientation listener added');
        setIsAvailable(true);
        setErrorMessage('');
        
        // Test if we're getting events after a short delay
        setTimeout(() => {
          if (mounted && attitude.pitchDeg === 0 && attitude.rollDeg === 0) {
            console.log('No orientation data received after 2 seconds');
            setErrorMessage('Device orientation events not firing. Try moving your device.');
          }
        }, 2000);

      } catch (error) {
        console.log('Error setting up native sensors:', error);
        if (mounted) {
          setIsAvailable(false);
          setErrorMessage(`Native sensor setup failed: ${error}`);
        }
      }
    };

    setupNativeSensors();

    return () => {
      mounted = false;
      listenerActive.current = false;
      // Remove event listener
      if (typeof window !== 'undefined') {
        const handleOrientation = () => {}; // Dummy function for removal
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  return {
    ...attitude,
    isAvailable,
    permissionStatus,
    errorMessage,
  };
}