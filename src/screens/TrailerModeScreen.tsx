import React, { useState } from 'react'
import { YStack, XStack, Text, Button, Card, H1, H2, View, ScrollView } from 'tamagui'
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  RectangleHorizontal, 
  RotateCcw,
  AlertTriangle,
  Settings
} from '@tamagui/lucide-icons'
import { BubbleLevel } from '../components/BubbleLevel'
import { StepCard } from '../components/StepCard'
import { useDeviceAttitude } from '../hooks/useDeviceAttitude'
import { useAppStore } from '../state/appStore'
import { 
  computeSideShim, 
  computeHitchLift, 
  planBlocks, 
  isSlopePossiblyUnsafe,
  getSideToRaise,
  getHitchDirection,
  STANDARD_BLOCK_SIZES
} from '../lib/levelingMath'
import { applyCalibration, getLevelStatus } from '../lib/calibration'

interface TrailerModeScreenProps {
  onBack: () => void
  onNavigateToCalibration: () => void
}

export function TrailerModeScreen({ onBack, onNavigateToCalibration }: TrailerModeScreenProps) {
  const [bypassSensors, setBypassSensors] = useState(false);
  const [nativeSensorData, setNativeSensorData] = useState({ pitch: 0, roll: 0, isReliable: false });
  
  // Get real sensor data
  const { pitchDeg, rollDeg, isAvailable, isReliable, permissionStatus, errorMessage } = useDeviceAttitude()
  const { activeProfile, settings, calibrateActiveProfile } = useAppStore()
  
  // Check environment for iOS-specific handling
  const isIOSSafari = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isHTTPS = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  
  // Use native sensor data when in bypass mode, otherwise use Expo data
  const currentPitch = bypassSensors && nativeSensorData.isReliable ? nativeSensorData.pitch : pitchDeg;
  const currentRoll = bypassSensors && nativeSensorData.isReliable ? nativeSensorData.roll : rollDeg;
  const currentReliable = bypassSensors && nativeSensorData.isReliable ? nativeSensorData.isReliable : isReliable;
  
  // Apply calibration to raw sensor readings
  const calibratedValues = applyCalibration(
    { pitch: currentPitch, roll: currentRoll },
    activeProfile?.calibration || { pitch: 0, roll: 0 }
  )
  
  const pitch = calibratedValues.pitch
  const roll = calibratedValues.roll
  
  // Debug logging for calibration
  if (activeProfile?.calibration && (activeProfile.calibration.pitch !== 0 || activeProfile.calibration.roll !== 0)) {
    console.log('=== CALIBRATION APPLICATION ===');
    console.log('Raw sensor values:', { pitch: currentPitch, roll: currentRoll });
    console.log('Calibration offsets:', activeProfile.calibration);
    console.log('Calibrated values:', { pitch, roll });
    console.log('Max angle:', Math.max(Math.abs(pitch), Math.abs(roll)));
  }
  
  // Get level status
  const levelStatus = getLevelStatus(calibratedValues)
  
  // Default trailer dimensions (will be replaced with real profile data)
  const trackWidth = 72.0 // 6 feet - common trailer width
  const axleToHitch = 144.0 // 12 feet - typical axle to hitch distance
  
  // Calculate leveling requirements
  const sideShimHeight = computeSideShim({ trackWidthInches: trackWidth, rollDegrees: roll })
  const hitchLiftHeight = computeHitchLift({ axleToHitchInches: axleToHitch, pitchDegrees: pitch })
  
  // Plan block combinations
  const sideShimBlocks = planBlocks({ 
    heightInches: sideShimHeight, 
    blockHeightsInches: STANDARD_BLOCK_SIZES 
  })
  const hitchLiftBlocks = planBlocks({ 
    heightInches: hitchLiftHeight, 
    blockHeightsInches: STANDARD_BLOCK_SIZES 
  })
  
  // Safety check
  const isUnsafe = isSlopePossiblyUnsafe({ pitchDegrees: pitch, rollDegrees: roll })
  
  // Get adjustment directions
  const sideToRaise = getSideToRaise(roll)
  const hitchDirection = getHitchDirection(pitch)
  
  // Handle calibration - navigate to calibration wizard
  const handleCalibrate = () => {
    onNavigateToCalibration()
  }
  
  // Handle manual permission request for iOS
  const handleRequestPermission = async () => {
    if (isIOSSafari && typeof (window as any).DeviceOrientationEvent !== 'undefined') {
      try {
        if (typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
          const permission = await (window as any).DeviceOrientationEvent.requestPermission();
          console.log('Manual permission request result:', permission);
          if (permission === 'granted') {
            alert('Permission granted! The app will now reload to activate sensors.');
            window.location.reload();
          } else {
            alert('Permission denied. Please enable motion sensors in Settings > Privacy & Security > Motion & Fitness');
          }
        }
      } catch (error) {
        console.log('Manual permission request failed:', error);
        alert('Permission request failed. Please check iOS settings.');
      }
    }
  }
  
  // Handle bypassing permission check for testing
  const handleBypassPermission = async () => {
    console.log('Bypassing permission check - forcing sensor availability to true');
    setBypassSensors(true);
    
    // Try to use native browser APIs directly
    if (isIOSSafari && typeof (window as any).DeviceOrientationEvent !== 'undefined') {
      try {
        // Request permission if available
        if (typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
          const permission = await (window as any).DeviceOrientationEvent.requestPermission();
          console.log('Native DeviceOrientation permission:', permission);
          
          if (permission === 'granted') {
            console.log('Setting up native device orientation listener');
            
            const handleOrientation = (event: any) => {
              // Convert from device orientation to our coordinate system
              const alpha = event.alpha || 0; // compass heading (not used)
              const beta = event.beta || 0;   // pitch (front/back tilt)
              const gamma = event.gamma || 0; // roll (left/right tilt)
              
              console.log('Native orientation:', { alpha, beta, gamma });
              
              setNativeSensorData({
                pitch: beta,
                roll: gamma,
                isReliable: true
              });
            };
            
            window.addEventListener('deviceorientation', handleOrientation);
            
            // Cleanup function would go here in a real useEffect
          }
        }
      } catch (error) {
        console.log('Native API setup failed:', error);
      }
    }
  }
  
  // Debug info
  console.log('TrailerModeScreen - isAvailable:', isAvailable, 'bypassSensors:', bypassSensors, 'permissionStatus:', permissionStatus, 'errorMessage:', errorMessage);

  // Handle sensor unavailable state - only block if definitely unavailable and not bypassed
  if (isAvailable === false && !bypassSensors && !(isIOSSafari && !isHTTPS)) {
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator?.userAgent || '');
    const isHTTPS = typeof window !== 'undefined' && window.location?.protocol === 'https:';
    
    return (
      <YStack 
        flex={1} 
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
        }}
        justifyContent="center"
        alignItems="center"
        padding="$6"
        space="$4"
      >
        <AlertTriangle size={64} color="#ef4444" />
        <H1 color="#ffffff" textAlign="center">
          Sensors Not Available
        </H1>
        
        {errorMessage ? (
          <Text color="#94a3b8" textAlign="center" fontSize="$4" maxWidth={320}>
            {errorMessage}
          </Text>
        ) : (
          <Text color="#94a3b8" textAlign="center" fontSize="$4">
            This device doesn't support motion sensors required for leveling.
          </Text>
        )}
        
        {isIOSSafari && !isHTTPS && (
          <YStack space="$3" alignItems="center" backgroundColor="rgba(249, 115, 22, 0.1)" padding="$4" borderRadius="$4" borderWidth={1} borderColor="rgba(249, 115, 22, 0.3)">
            <Text color="#f97316" fontWeight="600" fontSize="$4" textAlign="center">
              HTTPS Recommended for iOS
            </Text>
            <Text color="#ffffff" fontSize="$3" textAlign="center" maxWidth={280}>
              iOS Safari prefers HTTPS for motion sensors, but let's try anyway.
            </Text>
            <Button 
              backgroundColor="rgba(249, 115, 22, 0.2)" 
              borderColor="#f97316" 
              borderWidth={1}
              onPress={() => {
                // Try to bypass and test anyway - just reload
                window.location.reload();
              }}
            >
              <Text color="#f97316" fontWeight="600">Try Anyway</Text>
            </Button>
          </YStack>
        )}
        
        {isIOSSafari && (
          <YStack space="$3" alignItems="center" backgroundColor="rgba(59, 130, 246, 0.1)" padding="$4" borderRadius="$4" borderWidth={1} borderColor="rgba(59, 130, 246, 0.3)">
            <Text color="#3b82f6" fontWeight="600" fontSize="$4" textAlign="center">
              iOS Sensor Access Required
            </Text>
            <Text color="#ffffff" fontSize="$3" textAlign="center" maxWidth={280}>
              1. Go to Settings → Privacy & Security → Motion & Fitness
            </Text>
            <Text color="#ffffff" fontSize="$3" textAlign="center" maxWidth={280}>
              2. Enable "Fitness Tracking"
            </Text>
            <Text color="#ffffff" fontSize="$3" textAlign="center" maxWidth={280}>
              3. Return to this app and tap the button below
            </Text>
            <Button 
              backgroundColor="rgba(59, 130, 246, 0.2)" 
              borderColor="#3b82f6" 
              borderWidth={1}
              onPress={() => {
                // Force reload to trigger permission request
                window.location.reload();
              }}
            >
              <Text color="#3b82f6" fontWeight="600">Enable Sensors</Text>
            </Button>
          </YStack>
        )}
        
        <Text color="#64748b" fontSize="$3" textAlign="center" maxWidth={300}>
          Debug: available={String(isAvailable)}, permission={permissionStatus}, iOS={String(isIOSSafari)}, HTTPS={String(isHTTPS)}
        </Text>
        
        <Button onPress={onBack} backgroundColor="rgba(255, 255, 255, 0.1)" borderColor="rgba(255, 255, 255, 0.2)" borderWidth={1}>
          <Text color="#ffffff">Go Back</Text>
        </Button>
      </YStack>
    )
  }

  return (
    <YStack 
      flex={1} 
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
      }}
      position="relative"
    >
      {/* Safety Warning - Floating overlay */}
      {isUnsafe && (
        <View
          position="absolute"
          top="$16"
          left="$4"
          right="$4"
          zIndex={9999}
          pointerEvents="box-none"
        >
          <Card
            backgroundColor="rgba(249, 115, 22, 0.95)"
            borderColor="rgba(249, 115, 22, 0.8)"
            borderWidth={2}
            borderRadius="$6"
            padding="$4"
            shadowColor="rgba(0, 0, 0, 0.5)"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.3}
            shadowRadius={8}
            pressStyle={{ scale: 0.98 }}
            onPress={() => {
              // Dismiss the warning temporarily (for demonstration)
              console.log('Safety warning tapped - you can dismiss this by finding a more level spot');
            }}
          >
            <XStack space="$3" alignItems="center">
              <AlertTriangle size={24} color="#ffffff" />
              <YStack flex={1}>
                <Text color="#ffffff" fontWeight="700" fontSize="$5">
                  ⚠️ Safety Warning
                </Text>
                <Text color="#ffffff" fontSize="$4">
                  Slope may be unsafe for leveling. Consider finding a flatter spot.
                </Text>
                <Text color="rgba(255, 255, 255, 0.8)" fontSize="$3" marginTop="$1">
                  Tap to acknowledge
                </Text>
              </YStack>
            </XStack>
          </Card>
        </View>
      )}

      <ScrollView flex={1}>
        <YStack padding="$4" space="$4">
          {/* Header with back button */}
          <XStack justifyContent="space-between" alignItems="center" paddingTop="$2">
            <Button
              backgroundColor="rgba(255, 255, 255, 0.05)"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderWidth={1}
              borderRadius="$5"
              padding="$3"
              onPress={onBack}
              pressStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <XStack space="$2" alignItems="center">
                <ArrowLeft size={18} color="#ffffff" />
                <Text color="#ffffff" fontWeight="600">Back</Text>
              </XStack>
            </Button>
            
            <H1 color="#ffffff" fontSize="$8" fontWeight="700">
              Trailer Mode
            </H1>
            
            <Button
              backgroundColor="rgba(255, 255, 255, 0.05)"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderWidth={1}
              borderRadius="$5"
              padding="$3"
              onPress={handleCalibrate}
              pressStyle={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <RotateCcw size={18} color="#ffffff" />
            </Button>
          </XStack>
          
          {/* Bypass Mode Indicator */}
          {bypassSensors && (
            <Card
              backgroundColor="rgba(34, 197, 94, 0.1)"
              borderColor="rgba(34, 197, 94, 0.3)"
              borderWidth={1}
              borderRadius="$6"
              padding="$4"
            >
              <YStack space="$3">
                <XStack space="$3" alignItems="center">
                  <Target size={20} color="#22c55e" />
                  <YStack flex={1}>
                    <Text color="#22c55e" fontWeight="600" fontSize="$4">
                      Bypass Mode Active
                    </Text>
                    <Text color="#ffffff" fontSize="$3">
                      Native sensor data: pitch={nativeSensorData.pitch.toFixed(1)}°, roll={nativeSensorData.roll.toFixed(1)}°
                    </Text>
                    <Text color="#ffffff" fontSize="$3">
                      Reliable: {String(nativeSensorData.isReliable)}
                    </Text>
                  </YStack>
                </XStack>
                <XStack space="$2">
                  <Button 
                    flex={1}
                    backgroundColor="rgba(34, 197, 94, 0.2)" 
                    borderColor="#22c55e" 
                    borderWidth={1}
                    onPress={handleBypassPermission}
                  >
                    <Text color="#22c55e" fontWeight="600">Retry Native API</Text>
                  </Button>
                  <Button 
                    flex={1}
                    backgroundColor="rgba(168, 85, 247, 0.2)" 
                    borderColor="#a855f7" 
                    borderWidth={1}
                    onPress={() => {
                      // Test basic device capabilities
                      console.log('Testing device capabilities...');
                      console.log('window.DeviceOrientationEvent:', typeof (window as any).DeviceOrientationEvent);
                      console.log('requestPermission function:', typeof (window as any).DeviceOrientationEvent?.requestPermission);
                      console.log('User agent:', navigator.userAgent);
                      console.log('Protocol:', window.location.protocol);
                      alert(`DeviceOrientationEvent: ${typeof (window as any).DeviceOrientationEvent}\nrequestPermission: ${typeof (window as any).DeviceOrientationEvent?.requestPermission}\nProtocol: ${window.location.protocol}`);
                    }}
                  >
                    <Text color="#a855f7" fontWeight="600">Test Device</Text>
                  </Button>
                </XStack>
              </YStack>
            </Card>
          )}

          {/* HTTPS Warning for iOS */}
          {isIOSSafari && !isHTTPS && !bypassSensors && (
            <Card
              backgroundColor="rgba(249, 115, 22, 0.1)"
              borderColor="rgba(249, 115, 22, 0.3)"
              borderWidth={1}
              borderRadius="$6"
              padding="$4"
            >
              <YStack space="$3">
                <XStack space="$3" alignItems="center">
                  <AlertTriangle size={20} color="#f97316" />
                  <YStack flex={1}>
                    <Text color="#f97316" fontWeight="600" fontSize="$4">
                      HTTP Warning
                    </Text>
                    <Text color="#ffffff" fontSize="$3">
                      Sensors may not work properly over HTTP on iOS. Let's try to enable them anyway.
                    </Text>
                  </YStack>
                </XStack>
                <XStack space="$2">
                  <Button 
                    flex={1}
                    backgroundColor="rgba(249, 115, 22, 0.2)" 
                    borderColor="#f97316" 
                    borderWidth={1}
                    onPress={handleRequestPermission}
                  >
                    <Text color="#f97316" fontWeight="600">Request Permission</Text>
                  </Button>
                  <Button 
                    flex={1}
                    backgroundColor="rgba(59, 130, 246, 0.2)" 
                    borderColor="#3b82f6" 
                    borderWidth={1}
                    onPress={handleBypassPermission}
                  >
                    <Text color="#3b82f6" fontWeight="600">Try Anyway</Text>
                  </Button>
                </XStack>
              </YStack>
            </Card>
          )}

          {/* Status Indicator */}
          <Card
            backgroundColor={levelStatus.isLevel ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            borderColor={levelStatus.isLevel ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}
            borderWidth={1}
            borderRadius="$6"
            padding="$4"
          >
            <XStack space="$3" alignItems="center" justifyContent="center">
              <Target size={24} color={levelStatus.color} />
              <Text 
                fontSize="$6" 
                fontWeight="700" 
                color={levelStatus.color}
              >
                {levelStatus.description}
              </Text>
              {!currentReliable && (
                <Text fontSize="$3" color="#f59e0b">
                  (Unreliable)
                </Text>
              )}
              {bypassSensors && nativeSensorData.isReliable && (
                <Text fontSize="$3" color="#22c55e">
                  (Native API)
                </Text>
              )}
            </XStack>
          </Card>
          
          
          {/* Current Level Display */}
          <Card
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderWidth={1}
            borderRadius="$6"
            padding="$5"
            shadowColor="rgba(0, 0, 0, 0.5)"
            shadowOffset={{ width: 0, height: 8 }}
            shadowOpacity={0.3}
            shadowRadius={16}
          >
            <YStack space="$4">
              <H2 textAlign="center" color="#ffffff" fontSize="$7" fontWeight="600">
                Current Level
              </H2>
              
              {/* Pitch and Roll Values */}
              <XStack space="$4">
                <Card
                  flex={1}
                  backgroundColor="rgba(59, 130, 246, 0.1)"
                  borderColor="rgba(59, 130, 246, 0.2)"
                  borderWidth={1}
                  borderRadius="$5"
                  padding="$4"
                >
                  <YStack space="$2" alignItems="center">
                    <XStack space="$2" alignItems="center">
                      {pitch > 0 ? (
                        <TrendingUp size={20} color="#3b82f6" />
                      ) : (
                        <TrendingDown size={20} color="#3b82f6" />
                      )}
                      <Text color="#3b82f6" fontWeight="600" fontSize="$4">
                        PITCH
                      </Text>
                    </XStack>
                    <Text color="#ffffff" fontSize="$7" fontWeight="800">
                      {pitch.toFixed(1)}°
                    </Text>
                    <Text color="#94a3b8" fontSize="$3">
                      {pitch > 0 ? 'Nose Up' : 'Nose Down'}
                    </Text>
                  </YStack>
                </Card>

                <Card
                  flex={1}
                  backgroundColor="rgba(168, 85, 247, 0.1)"
                  borderColor="rgba(168, 85, 247, 0.2)"
                  borderWidth={1}
                  borderRadius="$5"
                  padding="$4"
                >
                  <YStack space="$2" alignItems="center">
                    <XStack space="$2" alignItems="center">
                      {roll > 0 ? (
                        <TrendingUp size={20} color="#a855f7" />
                      ) : (
                        <TrendingDown size={20} color="#a855f7" />
                      )}
                      <Text color="#a855f7" fontWeight="600" fontSize="$4">
                        ROLL
                      </Text>
                    </XStack>
                    <Text color="#ffffff" fontSize="$7" fontWeight="800">
                      {roll.toFixed(1)}°
                    </Text>
                    <Text color="#94a3b8" fontSize="$3">
                      {roll > 0 ? 'Left Up' : 'Right Up'}
                    </Text>
                  </YStack>
                </Card>
              </XStack>
              
              <BubbleLevel pitch={pitch} roll={roll} isLevel={levelStatus.isLevel} color={levelStatus.color} />
            </YStack>
          </Card>

          {/* Step 1: Side-to-Side Leveling */}
          <StepCard
            stepNumber={1}
            title="Level Side-to-Side"
            subtitle="Raise the low side wheels"
            icon={<RectangleHorizontal size={24} color="#3b82f6" />}
            color="#3b82f6"
          >
            <YStack space="$3">
              <Text color="#ffffff" fontSize="$5" fontWeight="600">
                Required Lift: {sideShimHeight.toFixed(2)} inches
              </Text>
              <Text color="#94a3b8" fontSize="$4">
                Recommended Blocks: {sideShimBlocks.blocks.join(' + ')} = {sideShimBlocks.total.toFixed(2)} inches
              </Text>
              
              <Card
                backgroundColor="rgba(59, 130, 246, 0.15)"
                borderColor="rgba(59, 130, 246, 0.3)"
                borderWidth={1}
                borderRadius="$4"
                padding="$4"
              >
                <XStack space="$3" alignItems="center">
                  {roll > 0 ? (
                    <TrendingUp size={20} color="#3b82f6" />
                  ) : (
                    <TrendingDown size={20} color="#3b82f6" />
                  )}
                  <Text color="#ffffff" fontWeight="600" fontSize="$5">
                    Raise {sideToRaise} side wheels by {sideShimHeight.toFixed(2)} inches
                  </Text>
                </XStack>
              </Card>
            </YStack>
          </StepCard>

          {/* Step 2: Fore-Aft Leveling */}
          <StepCard
            stepNumber={2}
            title="Level Fore-Aft"
            subtitle="Adjust the hitch jack"
            icon={<RotateCcw size={24} color="#a855f7" />}
            color="#a855f7"
          >
            <YStack space="$3">
              <Text color="#ffffff" fontSize="$5" fontWeight="600">
                Required Hitch Movement: {hitchLiftHeight.toFixed(2)} inches
              </Text>
              <Text color="#94a3b8" fontSize="$4">
                Recommended Blocks: {hitchLiftBlocks.blocks.join(' + ')} = {hitchLiftBlocks.total.toFixed(2)} inches
              </Text>
              
              <Card
                backgroundColor="rgba(168, 85, 247, 0.15)"
                borderColor="rgba(168, 85, 247, 0.3)"
                borderWidth={1}
                borderRadius="$4"
                padding="$4"
              >
                <XStack space="$3" alignItems="center">
                  {pitch > 0 ? (
                    <TrendingUp size={20} color="#a855f7" />
                  ) : (
                    <TrendingDown size={20} color="#a855f7" />
                  )}
                  <Text color="#ffffff" fontWeight="600" fontSize="$5">
                    Crank hitch jack {hitchDirection} by {hitchLiftHeight.toFixed(2)} inches
                  </Text>
                </XStack>
              </Card>
            </YStack>
          </StepCard>

          {/* Trailer Profile Info */}
          <Card
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderWidth={1}
            borderRadius="$6"
            padding="$4"
          >
            <YStack space="$3">
              <XStack space="$2" alignItems="center">
                <Settings size={20} color="#22c55e" />
                <Text color="#22c55e" fontWeight="600" fontSize="$5">
                  Trailer Profile
                </Text>
              </XStack>
              
              <XStack justifyContent="space-between">
                <Text color="#94a3b8" fontSize="$4">Track Width:</Text>
                <Text color="#ffffff" fontSize="$4" fontWeight="600">
                  {trackWidth.toFixed(1)} inches
                </Text>
              </XStack>
              
              <XStack justifyContent="space-between">
                <Text color="#94a3b8" fontSize="$4">Axle to Hitch:</Text>
                <Text color="#ffffff" fontSize="$4" fontWeight="600">
                  {axleToHitch.toFixed(1)} inches
                </Text>
              </XStack>
              
              <Text color="#64748b" fontSize="$3" textAlign="center">
                Tap calibrate button (↻) to open calibration wizard
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
