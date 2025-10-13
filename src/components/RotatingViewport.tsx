import React from 'react';
import { View, YStack, YStackProps } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface RotatingViewportProps extends Omit<YStackProps, 'children'> {
  /** Rotation angle in degrees. Must be 0, 90, 180, or 270 */
  angleDeg: 0 | 90 | 180 | 270;
  /** Content to be rotated */
  children?: React.ReactNode;
}

/**
 * RotatingViewport - Counter-rotates content to keep text upright
 *
 * Used in calibration wizard to rotate the UI while keeping instructions readable.
 * Centers content with flex, adds safe-area padding, and constrains max width.
 *
 * @example
 * <RotatingViewport angleDeg={90}>
 *   <Text>This text stays upright</Text>
 * </RotatingViewport>
 */
export function RotatingViewport({
  angleDeg,
  children,
  ...props
}: RotatingViewportProps) {
  const insets = useSafeAreaInsets();

  // Calculate rotation transform
  // We counter-rotate by negating the angle so content stays upright
  const rotationDeg = -angleDeg;

  // When rotated 90° or 270°, dimensions swap - account for this
  const isLandscape = angleDeg === 90 || angleDeg === 270;

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingLeft={insets.left}
      paddingRight={insets.right}
      {...props}
    >
      <View
        width={isLandscape ? '90vh' : '100%'}
        height={isLandscape ? '90vw' : '100%'}
        maxWidth={isLandscape ? undefined : 500}
        maxHeight={isLandscape ? 500 : undefined}
        style={{
          transform: [{ rotate: `${rotationDeg}deg` }],
        }}
      >
        {children}
      </View>
    </YStack>
  );
}
