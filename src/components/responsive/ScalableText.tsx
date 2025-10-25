import React from 'react';
import { Text, TextProps, H1, H2, H3, H1Props, H2Props, H3Props } from 'tamagui';

export interface ScalableTextProps extends TextProps {
  /**
   * Base font size (mobile)
   */
  base?: string | number;

  /**
   * Font size for small screens (optional)
   */
  sm?: string | number;

  /**
   * Font size for medium screens (tablets)
   */
  md?: string | number;

  /**
   * Font size for large screens (desktop)
   */
  lg?: string | number;

  /**
   * Font size for extra large screens
   */
  xl?: string | number;

  children?: React.ReactNode;
}

/**
 * ScalableText - Text that scales based on screen size
 *
 * Features:
 * - Responsive font sizing
 * - Mobile-first approach
 * - Works with all Tamagui text props
 *
 * Usage:
 * ```tsx
 * <ScalableText base="$4" md="$5" lg="$6">
 *   This text scales up on larger screens
 * </ScalableText>
 * ```
 */
export function ScalableText({
  base = '$4',
  sm,
  md,
  lg,
  xl,
  children,
  ...props
}: ScalableTextProps) {
  return (
    <Text
      fontSize={base}
      $sm={sm ? { fontSize: sm } : undefined}
      $md={md ? { fontSize: md } : undefined}
      $lg={lg ? { fontSize: lg } : undefined}
      $xl={xl ? { fontSize: xl } : undefined}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * ScalableH1 - Responsive H1 heading
 */
export function ScalableH1({
  base = '$9',
  sm,
  md = '$10',
  lg = '$11',
  xl,
  children,
  ...props
}: ScalableTextProps & H1Props) {
  return (
    <H1
      fontSize={base}
      $sm={sm ? { fontSize: sm } : undefined}
      $md={md ? { fontSize: md } : undefined}
      $lg={lg ? { fontSize: lg } : undefined}
      $xl={xl ? { fontSize: xl } : undefined}
      {...props}
    >
      {children}
    </H1>
  );
}

/**
 * ScalableH2 - Responsive H2 heading
 */
export function ScalableH2({
  base = '$7',
  sm,
  md = '$8',
  lg = '$9',
  xl,
  children,
  ...props
}: ScalableTextProps & H2Props) {
  return (
    <H2
      fontSize={base}
      $sm={sm ? { fontSize: sm } : undefined}
      $md={md ? { fontSize: md } : undefined}
      $lg={lg ? { fontSize: lg } : undefined}
      $xl={xl ? { fontSize: xl } : undefined}
      {...props}
    >
      {children}
    </H2>
  );
}

/**
 * ScalableH3 - Responsive H3 heading
 */
export function ScalableH3({
  base = '$5',
  sm,
  md = '$6',
  lg = '$7',
  xl,
  children,
  ...props
}: ScalableTextProps & H3Props) {
  return (
    <H3
      fontSize={base}
      $sm={sm ? { fontSize: sm } : undefined}
      $md={md ? { fontSize: md } : undefined}
      $lg={lg ? { fontSize: lg } : undefined}
      $xl={xl ? { fontSize: xl } : undefined}
      {...props}
    >
      {children}
    </H3>
  );
}
