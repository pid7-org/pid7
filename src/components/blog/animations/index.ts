import { Animation001 } from './001-animation';
import { Animation002 } from './002-animation';
import { Animation003 } from './003-animation';

export interface AnimationWidget {
  id: string;
  render(desc: string): string;
  init(wrapper: Element): void;
}

// NOTE: Global animation registry mapping animation IDs (001, 002, 003...) to reusable widget implementations
const animationRegistry: Record<string, AnimationWidget> = {
  // Animation 001 (Scalar byte scan)
  '001': Animation001,
  '001-animation': Animation001,
  'ANIM1': Animation001,

  // Animation 002 (SWAR 64-bit scan)
  '002': Animation002,
  '002-animation': Animation002,
  'ANIM2': Animation002,

  // Animation 003 (AVX-512BW SIMD scan)
  '003': Animation003,
  '003-animation': Animation003,
  'ANIM3': Animation003,
};

export function getAnimationWidget(id: string): AnimationWidget | undefined {
  return animationRegistry[id];
}
