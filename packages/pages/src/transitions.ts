export type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom';

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // milliseconds
  easing: string; // CSS easing function
}

export const DEFAULT_TRANSITION: TransitionConfig = {
  type: 'fade',
  duration: 300,
  easing: 'ease-in-out',
};

export function getTransitionStyles(
  transition: TransitionConfig,
  direction: 'enter' | 'exit'
): {
  from: Record<string, string>;
  to: Record<string, string>;
  transition: string;
} {
  const { type, duration, easing } = transition;
  const transitionProp = `all ${duration}ms ${easing}`;

  switch (type) {
    case 'fade':
      return {
        from: { opacity: direction === 'enter' ? '0' : '1' },
        to: { opacity: direction === 'enter' ? '1' : '0' },
        transition: transitionProp,
      };

    case 'slide-left':
      return {
        from: { transform: direction === 'enter' ? 'translateX(100%)' : 'translateX(0)' },
        to: { transform: direction === 'enter' ? 'translateX(0)' : 'translateX(-100%)' },
        transition: transitionProp,
      };

    case 'slide-right':
      return {
        from: { transform: direction === 'enter' ? 'translateX(-100%)' : 'translateX(0)' },
        to: { transform: direction === 'enter' ? 'translateX(0)' : 'translateX(100%)' },
        transition: transitionProp,
      };

    case 'slide-up':
      return {
        from: { transform: direction === 'enter' ? 'translateY(100%)' : 'translateY(0)' },
        to: { transform: direction === 'enter' ? 'translateY(0)' : 'translateY(-100%)' },
        transition: transitionProp,
      };

    case 'slide-down':
      return {
        from: { transform: direction === 'enter' ? 'translateY(-100%)' : 'translateY(0)' },
        to: { transform: direction === 'enter' ? 'translateY(0)' : 'translateY(100%)' },
        transition: transitionProp,
      };

    case 'zoom':
      return {
        from: {
          transform: direction === 'enter' ? 'scale(0.5)' : 'scale(1)',
          opacity: direction === 'enter' ? '0' : '1',
        },
        to: {
          transform: direction === 'enter' ? 'scale(1)' : 'scale(1.5)',
          opacity: direction === 'enter' ? '1' : '0',
        },
        transition: transitionProp,
      };

    case 'none':
    default:
      return {
        from: {},
        to: {},
        transition: 'none',
      };
  }
}
