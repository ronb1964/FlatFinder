import React, { useEffect, useState } from 'react';
import {
  YStack,
  XStack,
  Text,
  Button,
  H2,
  Card,
  ScrollView,
  Input,
  Label,
  RadioGroup,
  Sheet,
  useTheme,
} from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Check, Car, Truck, Home } from '@tamagui/lucide-icons';
import { useAppStore, VehicleProfile } from '../../src/state/appStore';

export default function ProfilesScreen() {
  const theme = useTheme();
  const {
    profiles,
    activeProfileId,
    loadProfiles,
    addProfile,
    deleteProfile,
    setActiveProfile,
  } = useAppStore();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    type: 'trailer' as 'trailer' | 'motorhome' | 'van',
    wheelbaseInches: 240,
    trackWidthInches: 96,
    hitchOffset: 0,
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleAddProfile = () => {
    if (!newProfile.name.trim()) return;

    addProfile({
      ...newProfile,
      calibration: { pitch: 0, roll: 0 },
    });

    setNewProfile({
      name: '',
      type: 'trailer',
      wheelbaseInches: 240,
      trackWidthInches: 96,
      hitchOffset: 0,
    });
    setShowAddSheet(false);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'trailer':
        return <Truck size={20} />;
      case 'motorhome':
        return <Home size={20} />;
      case 'van':
        return <Car size={20} />;
      default:
        return <Car size={20} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val || '#000' }}>
      <YStack flex={1} padding="$4" space="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <H2>Vehicle Profiles</H2>
          <Button
            size="$4"
            backgroundColor="$blue9"
            icon={Plus}
            onPress={() => setShowAddSheet(true)}
          >
            Add
          </Button>
        </XStack>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack space="$3">
            {profiles.length === 0 ? (
              <Card padding="$6" backgroundColor="$gray2">
                <YStack alignItems="center" space="$3">
                  <Car size={48} color={theme.gray10?.val || '#666'} />
                  <Text color="$colorPress" textAlign="center">
                    No profiles yet. Add your first vehicle profile to get started.
                  </Text>
                </YStack>
              </Card>
            ) : (
              profiles.map((profile) => (
                <Card
                  key={profile.id}
                  padding="$4"
                  backgroundColor={
                    activeProfileId === profile.id ? '$green2' : '$background'
                  }
                  borderColor={
                    activeProfileId === profile.id ? '$green9' : '$borderColor'
                  }
                  borderWidth={activeProfileId === profile.id ? 2 : 1}
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => setActiveProfile(profile.id)}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack space="$3" alignItems="center" flex={1}>
                      {getVehicleIcon(profile.type)}
                      <YStack flex={1}>
                        <XStack alignItems="center" space="$2">
                          <Text fontSize="$5" fontWeight="bold">
                            {profile.name}
                          </Text>
                          {activeProfileId === profile.id && (
                            <Check size={16} color={theme.green10?.val || '#0f0'} />
                          )}
                        </XStack>
                        <Text color="$colorPress" fontSize="$2">
                          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} •
                          Wheelbase: {profile.wheelbaseInches}" • Track: {profile.trackWidthInches}"
                        </Text>
                      </YStack>
                    </XStack>
                    <Button
                      size="$3"
                      backgroundColor="transparent"
                      icon={Trash2}
                      color="$red9"
                      onPress={() => deleteProfile(profile.id)}
                    />
                  </XStack>
                </Card>
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>

      {/* Add Profile Sheet */}
      <Sheet
        modal
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        snapPoints={[60]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack space="$4">
            <H2>New Vehicle Profile</H2>

            <YStack space="$2">
              <Label htmlFor="name">Profile Name</Label>
              <Input
                id="name"
                placeholder="e.g., My RV"
                value={newProfile.name}
                onChangeText={(text: string) =>
                  setNewProfile({ ...newProfile, name: text })
                }
              />
            </YStack>

            <YStack space="$2">
              <Label>Vehicle Type</Label>
              <RadioGroup
                value={newProfile.type}
                onValueChange={(value: string) =>
                  setNewProfile({
                    ...newProfile,
                    type: value as 'trailer' | 'motorhome' | 'van',
                  })
                }
              >
                <XStack space="$3">
                  <XStack alignItems="center" space="$2">
                    <RadioGroup.Item value="trailer" id="trailer">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="trailer">Trailer</Label>
                  </XStack>
                  <XStack alignItems="center" space="$2">
                    <RadioGroup.Item value="motorhome" id="motorhome">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="motorhome">Motorhome</Label>
                  </XStack>
                  <XStack alignItems="center" space="$2">
                    <RadioGroup.Item value="van" id="van">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="van">Van</Label>
                  </XStack>
                </XStack>
              </RadioGroup>
            </YStack>

            <XStack space="$3">
              <YStack flex={1} space="$2">
                <Label htmlFor="wheelbase">Wheelbase (inches)</Label>
                <Input
                  id="wheelbase"
                  keyboardType="numeric"
                  value={newProfile.wheelbaseInches.toString()}
                  onChangeText={(text: string) =>
                    setNewProfile({
                      ...newProfile,
                      wheelbaseInches: parseInt(text) || 0,
                    })
                  }
                />
              </YStack>
              <YStack flex={1} space="$2">
                <Label htmlFor="track">Track Width (inches)</Label>
                <Input
                  id="track"
                  keyboardType="numeric"
                  value={newProfile.trackWidthInches.toString()}
                  onChangeText={(text: string) =>
                    setNewProfile({
                      ...newProfile,
                      trackWidthInches: parseInt(text) || 0,
                    })
                  }
                />
              </YStack>
            </XStack>

            {newProfile.type === 'trailer' && (
              <YStack space="$2">
                <Label htmlFor="hitch">Hitch Offset (inches)</Label>
                <Input
                  id="hitch"
                  keyboardType="numeric"
                  value={newProfile.hitchOffset?.toString() || '0'}
                  onChangeText={(text: string) =>
                    setNewProfile({
                      ...newProfile,
                      hitchOffset: parseInt(text) || 0,
                    })
                  }
                />
              </YStack>
            )}

            <XStack space="$3">
              <Button
                flex={1}
                size="$4"
                backgroundColor="$gray5"
                onPress={() => setShowAddSheet(false)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                size="$4"
                backgroundColor="$blue9"
                onPress={handleAddProfile}
                disabled={!newProfile.name.trim()}
              >
                Add Profile
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </SafeAreaView>
  );
}