/**
 * Simple class name concatenation utility
 * (Replaces clsx/tailwind-merge since we're using StyleSheet)
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
