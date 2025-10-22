import { config } from '@tamagui/config/v2'
import { createTamagui } from 'tamagui'
import { createAnimations } from '@tamagui/animations-css'

const animations = createAnimations({
  bouncy: 'ease-in-out 0.4s',
  lazy: 'ease-in 0.6s',
  quick: 'ease-out 0.2s',
})

const tamaguiConfig = createTamagui({
  ...config,
  animations,
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
