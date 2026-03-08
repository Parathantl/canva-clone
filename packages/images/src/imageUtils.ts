export interface ImageDimensions {
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function calculateFitDimensions(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
  mode: 'cover' | 'contain' | 'stretch'
): { x: number; y: number; width: number; height: number } {
  if (mode === 'stretch') {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const imageRatio = imageWidth / imageHeight;
  const containerRatio = containerWidth / containerHeight;

  let width: number;
  let height: number;

  if (mode === 'cover') {
    if (imageRatio > containerRatio) {
      height = containerHeight;
      width = height * imageRatio;
    } else {
      width = containerWidth;
      height = width / imageRatio;
    }
  } else {
    // contain
    if (imageRatio > containerRatio) {
      width = containerWidth;
      height = width / imageRatio;
    } else {
      height = containerHeight;
      width = height * imageRatio;
    }
  }

  const x = (containerWidth - width) / 2;
  const y = (containerHeight - height) / 2;

  return { x, y, width, height };
}

export function isImageFile(file: File): boolean {
  return /^image\/(jpeg|png|webp|svg\+xml|gif)$/.test(file.type);
}

export function getImageDimensions(src: string): Promise<ImageDimensions> {
  return loadImage(src).then((img) => ({
    width: img.naturalWidth,
    height: img.naturalHeight,
  }));
}
