import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Card, Input } from 'tamagui';
import { useAppStore } from '../state/appStore';
import { createCalibration } from '../lib/levelingMath';
import { StandardBlockSets } from '../lib/rvLevelingMath';

export function ProfileCreationTest() {
  const { addProfile, profiles, activeProfile } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreateProfile = () => {
    try {
      console.log('Creating test profile...');
      addProfile({
        name: name || 'Test Profile',
        type: 'trailer',
        wheelbaseInches: 240,
        trackWidthInches: 96,
        hitchOffsetInches: 120,
        blockInventory: StandardBlockSets.basic(),
        calibration: createCalibration(),
      });
      console.log('Profile created successfully');
      setShowForm(false);
      setName('');
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return (
    <YStack space="$4" padding="$4">
      <Text fontSize="$6" fontWeight="bold">Profile Creation Test</Text>
      
      <Card padding="$3" backgroundColor="$blue2">
        <Text>Current profiles: {profiles.length}</Text>
        <Text>Active profile: {activeProfile?.name || 'None'}</Text>
      </Card>

      {showForm ? (
        <YStack space="$3">
          <Input
            placeholder="Profile name"
            value={name}
            onChangeText={setName}
          />
          <XStack space="$2">
            <Button flex={1} onPress={handleCreateProfile}>
              Create Profile
            </Button>
            <Button flex={1} backgroundColor="$gray9" onPress={() => setShowForm(false)}>
              Cancel
            </Button>
          </XStack>
        </YStack>
      ) : (
        <Button onPress={() => setShowForm(true)}>
          Add Test Profile
        </Button>
      )}

      <YStack space="$2">
        <Text fontWeight="bold">Existing Profiles:</Text>
        {profiles.map((profile) => (
          <Card key={profile.id} padding="$2">
            <Text>{profile.name} ({profile.type})</Text>
          </Card>
        ))}
      </YStack>
    </YStack>
  );
}