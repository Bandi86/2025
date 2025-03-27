export type GeneratedImage = {
  id: string;
  url: string;
};

export const imageAPIs = {
  picsum: (size: number = 200) => `https://picsum.photos/${size}/${size}`,
  unsplash: (size: number = 200) => `https://source.unsplash.com/random/${size}x${size}`,
  robohash: (seed: string, size: number = 200) => `https://robohash.org/${seed}?size=${size}x${size}`,
};

export async function generateUniqueImages(
  count: number,
  size: number = 200,
  api: keyof typeof imageAPIs = 'robohash'
): Promise<GeneratedImage[]> {
  try {
    const images: GeneratedImage[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
      const seed = `memory-${timestamp}-${i}`;
      const apiFunction = imageAPIs[api];
      const url = (imageAPIs[api] as (param: string | number) => string)(
        api === 'robohash' ? seed : size
      );
      
      // For Picsum and Unsplash, we need to make the URLs unique to prevent caching
      const uniqueUrl = api !== 'robohash' 
        ? `${url}?random=${seed}`
        : url;

      images.push({
        id: seed,
        url: uniqueUrl,
      });
    }

    return images;
  } catch (error) {
    console.error('Error generating images:', error);
    throw new Error('Failed to generate images');
  }
}

