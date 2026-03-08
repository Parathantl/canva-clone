export interface PagePreset {
  name: string;
  displayName: string;
  width: number;
  height: number;
  category: string;
}

export const PAGE_PRESETS: PagePreset[] = [
  // Print sizes
  { name: 'a4-portrait', displayName: 'A4 Portrait', width: 2480, height: 3508, category: 'print' },
  { name: 'a4-landscape', displayName: 'A4 Landscape', width: 3508, height: 2480, category: 'print' },
  { name: 'letter-portrait', displayName: 'US Letter Portrait', width: 2550, height: 3300, category: 'print' },
  { name: 'letter-landscape', displayName: 'US Letter Landscape', width: 3300, height: 2550, category: 'print' },
  { name: 'a3-portrait', displayName: 'A3 Portrait', width: 3508, height: 4961, category: 'print' },
  { name: 'a5-portrait', displayName: 'A5 Portrait', width: 1748, height: 2480, category: 'print' },

  // Presentation sizes
  { name: '16:9', displayName: 'Widescreen (16:9)', width: 1920, height: 1080, category: 'presentation' },
  { name: '4:3', displayName: 'Standard (4:3)', width: 1440, height: 1080, category: 'presentation' },

  // Social media
  { name: 'instagram-post', displayName: 'Instagram Post', width: 1080, height: 1080, category: 'social' },
  { name: 'instagram-story', displayName: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { name: 'facebook-post', displayName: 'Facebook Post', width: 1200, height: 630, category: 'social' },
  { name: 'facebook-cover', displayName: 'Facebook Cover', width: 1640, height: 624, category: 'social' },
  { name: 'twitter-post', displayName: 'Twitter Post', width: 1200, height: 675, category: 'social' },
  { name: 'twitter-header', displayName: 'Twitter Header', width: 1500, height: 500, category: 'social' },
  { name: 'linkedin-post', displayName: 'LinkedIn Post', width: 1200, height: 627, category: 'social' },
  { name: 'youtube-thumbnail', displayName: 'YouTube Thumbnail', width: 1280, height: 720, category: 'social' },
  { name: 'tiktok-video', displayName: 'TikTok Video', width: 1080, height: 1920, category: 'social' },
  { name: 'pinterest-pin', displayName: 'Pinterest Pin', width: 1000, height: 1500, category: 'social' },

  // Custom common sizes
  { name: 'square', displayName: 'Square (1:1)', width: 1080, height: 1080, category: 'common' },
  { name: '9:16', displayName: 'Vertical (9:16)', width: 1080, height: 1920, category: 'common' },
  { name: 'hd', displayName: 'HD (1280x720)', width: 1280, height: 720, category: 'common' },
  { name: '4k', displayName: '4K (3840x2160)', width: 3840, height: 2160, category: 'common' },
  { name: 'banner', displayName: 'Web Banner', width: 1200, height: 300, category: 'common' },
  { name: 'business-card', displayName: 'Business Card', width: 1050, height: 600, category: 'print' },
  { name: 'poster', displayName: 'Poster', width: 2400, height: 3600, category: 'print' },
  { name: 'flyer', displayName: 'Flyer', width: 1275, height: 1650, category: 'print' },
];

export function getPresetsByCategory(category: string): PagePreset[] {
  return PAGE_PRESETS.filter((p) => p.category === category);
}

export function getPresetCategories(): string[] {
  return [...new Set(PAGE_PRESETS.map((p) => p.category))];
}
