import React from 'react';
import { View, Text } from 'react-native';

export interface StepCardProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}

/**
 * StepCard component for displaying numbered steps in the leveling process
 * Ported from original Flutter implementation with modern React Native styling
 */
export function StepCard({ stepNumber, title, subtitle, icon, color, children }: StepCardProps) {
  return (
    <View
      className="bg-white/[0.03] border border-white/10 rounded-2xl p-5"
      style={{
        borderLeftColor: color,
        borderLeftWidth: 4,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      }}
    >
      <View className="gap-4">
        {/* Step Header */}
        <View className="flex-row gap-4 items-center">
          <View
            className="rounded-xl w-10 h-10 justify-center items-center"
            style={{ backgroundColor: color }}
          >
            <Text className="text-white font-extrabold text-lg">{stepNumber}</Text>
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold" style={{ color }}>
              {title}
            </Text>
            <Text className="text-base text-[#94a3b8]">{subtitle}</Text>
          </View>

          <View
            className="rounded-lg p-2"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </View>
        </View>

        {/* Step Content */}
        {children}
      </View>
    </View>
  );
}
