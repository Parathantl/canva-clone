// Curated Google Fonts list with categories
export interface FontDefinition {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  weights: number[];
  url?: string;
}

export const DEFAULT_FONTS: FontDefinition[] = [
  { family: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700] },
  { family: 'Roboto', category: 'sans-serif', weights: [300, 400, 500, 700] },
  { family: 'Open Sans', category: 'sans-serif', weights: [300, 400, 600, 700] },
  { family: 'Lato', category: 'sans-serif', weights: [300, 400, 700] },
  { family: 'Montserrat', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Poppins', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Nunito', category: 'sans-serif', weights: [300, 400, 600, 700] },
  { family: 'Raleway', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Work Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700] },
  { family: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700] },
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'Merriweather', category: 'serif', weights: [300, 400, 700] },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'PT Serif', category: 'serif', weights: [400, 700] },
  { family: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Crimson Text', category: 'serif', weights: [400, 600, 700] },
  { family: 'Bebas Neue', category: 'display', weights: [400] },
  { family: 'Pacifico', category: 'handwriting', weights: [400] },
  { family: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Caveat', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Satisfy', category: 'handwriting', weights: [400] },
  { family: 'Great Vibes', category: 'handwriting', weights: [400] },
  { family: 'Permanent Marker', category: 'handwriting', weights: [400] },
  { family: 'Lobster', category: 'display', weights: [400] },
  { family: 'Abril Fatface', category: 'display', weights: [400] },
  { family: 'Righteous', category: 'display', weights: [400] },
  { family: 'Russo One', category: 'display', weights: [400] },
  { family: 'Fira Code', category: 'monospace', weights: [300, 400, 500, 600, 700] },
  { family: 'JetBrains Mono', category: 'monospace', weights: [400, 500, 700] },
  { family: 'Source Code Pro', category: 'monospace', weights: [300, 400, 500, 600, 700] },
  { family: 'Space Mono', category: 'monospace', weights: [400, 700] },
];

export class FontManager {
  private loadedFonts: Set<string> = new Set();
  private customFonts: FontDefinition[] = [];

  async loadFont(family: string, weight = 400): Promise<void> {
    const key = `${family}-${weight}`;
    if (this.loadedFonts.has(key)) return;

    try {
      const fontFace = new FontFace(
        family,
        `local("${family}")`,
        { weight: String(weight) }
      );

      // Try local font first, then Google Fonts
      try {
        await fontFace.load();
      } catch {
        // Fallback to Google Fonts URL
        const url = this.getGoogleFontUrl(family, [weight]);
        await this.loadFontFromUrl(family, url, weight);
      }

      this.loadedFonts.add(key);
    } catch (error) {
      console.warn(`Failed to load font "${family}" weight ${weight}:`, error);
    }
  }

  async loadFontFromUrl(family: string, url: string, weight = 400): Promise<void> {
    const key = `${family}-${weight}`;
    if (this.loadedFonts.has(key)) return;

    const fontFace = new FontFace(family, `url(${url})`, {
      weight: String(weight),
    });

    const loaded = await fontFace.load();
    document.fonts.add(loaded);
    this.loadedFonts.add(key);
  }

  registerFont(definition: FontDefinition): void {
    this.customFonts.push(definition);
  }

  getAllFonts(): FontDefinition[] {
    return [...DEFAULT_FONTS, ...this.customFonts];
  }

  getFontsByCategory(category: string): FontDefinition[] {
    return this.getAllFonts().filter((f) => f.category === category);
  }

  isFontLoaded(family: string, weight = 400): boolean {
    return this.loadedFonts.has(`${family}-${weight}`);
  }

  private getGoogleFontUrl(family: string, weights: number[]): string {
    const weightsStr = weights.join(';');
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weightsStr}&display=swap`;
  }
}
