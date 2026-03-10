import type {
  Fill,
  SolidFill,
  LinearGradientFill,
  RadialGradientFill,
} from '../types/document';

export function isSolidFill(fill: Fill): fill is SolidFill {
  return fill.type === 'solid';
}

export function isLinearGradient(fill: Fill): fill is LinearGradientFill {
  return fill.type === 'linear-gradient';
}

export function isRadialGradient(fill: Fill): fill is RadialGradientFill {
  return fill.type === 'radial-gradient';
}

export function isGradientFill(
  fill: Fill,
): fill is LinearGradientFill | RadialGradientFill {
  return fill.type === 'linear-gradient' || fill.type === 'radial-gradient';
}
