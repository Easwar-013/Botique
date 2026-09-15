const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  'http://localhost:5000';

export const getImageUrl = (
  imagePath: string
): string => {
  if (!imagePath) {
    return '';
  }

  // Already an absolute URL
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  // Local backend image such as:
  // /uploads/products/shirt.webp
  return `${SERVER_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};