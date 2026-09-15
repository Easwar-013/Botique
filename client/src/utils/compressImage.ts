const MAX_SIZE = 100 * 1024; // 100 KB
const TARGET_SIZE = 98 * 1024; // 98 KB safety margin

const MAX_ITERATIONS = 30;

const loadImage = (
  file: File
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const objectUrl =
      URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          `Unable to read image: ${file.name}`
        )
      );
    };

    image.src = objectUrl;
  });
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              'Unable to compress image.'
            )
          );

          return;
        }

        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
};

const createFile = (
  blob: Blob,
  originalName: string
): File => {
  const filename =
    originalName.replace(
      /\.[^/.]+$/,
      ''
    ) + '.webp';

  return new File(
    [blob],
    filename,
    {
      type: 'image/webp',
      lastModified: Date.now(),
    }
  );
};

export interface CompressionResult {
  file: File;
  originalSize: number;
  finalSize: number;
  compressed: boolean;
}

export const compressImageIfNeeded =
  async (
    file: File
  ): Promise<CompressionResult> => {
    const originalSize = file.size;

    /*
     * Already <=100 KB.
     * Do not modify the image at all.
     */
    if (
      originalSize <= MAX_SIZE
    ) {
      return {
        file,
        originalSize,
        finalSize: originalSize,
        compressed: false,
      };
    }

    const image =
      await loadImage(file);

    let width =
      image.naturalWidth;

    let height =
      image.naturalHeight;

    /*
     * Start with excellent quality.
     *
     * We will reduce quality only moderately.
     * The main compression mechanism is reducing
     * dimensions gradually.
     */
    let quality = 0.92;

    let lastBlob: Blob | null = null;

    for (
      let iteration = 0;
      iteration < MAX_ITERATIONS;
      iteration++
    ) {
      const canvas =
        document.createElement(
          'canvas'
        );

      canvas.width =
        Math.max(
          1,
          Math.round(width)
        );

      canvas.height =
        Math.max(
          1,
          Math.round(height)
        );

      const context =
        canvas.getContext('2d');

      if (!context) {
        throw new Error(
          'Unable to process image.'
        );
      }

      /*
       * High quality browser resampling.
       * This reduces jagged edges while resizing.
       */
      context.imageSmoothingEnabled =
        true;

      context.imageSmoothingQuality =
        'high';

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob =
        await canvasToBlob(
          canvas,
          quality
        );

      lastBlob = blob;

      /*
       * Success!
       */
      if (
        blob.size <= TARGET_SIZE
      ) {
        return {
          file: createFile(
            blob,
            file.name
          ),

          originalSize,

          finalSize: blob.size,

          compressed: true,
        };
      }

      /*
       * Calculate how much we need to reduce
       * the image based on the current size.
       *
       * Example:
       *
       * 140 KB → target 98 KB
       *
       * scale ≈ sqrt(98 / 140)
       */
      const ratio =
        Math.sqrt(
          TARGET_SIZE /
            blob.size
        );

      /*
       * Don't reduce too aggressively in one step.
       */
      const reduction =
        Math.min(
          0.92,
          Math.max(
            0.65,
            ratio * 0.95
          )
        );

      width *= reduction;
      height *= reduction;

      /*
       * Keep quality reasonably high.
       *
       * We don't intentionally push quality
       * extremely low because that introduces
       * visible compression artifacts.
       */
      if (
        blob.size > 2 * TARGET_SIZE
      ) {
        quality = Math.max(
          0.78,
          quality - 0.025
        );
      } else {
        quality = Math.max(
          0.72,
          quality - 0.015
        );
      }
    }

    /*
     * Extremely difficult image fallback.
     *
     * Keep reducing until we reach the target.
     */
    if (lastBlob) {
      let fallbackWidth =
        Math.max(
          320,
          Math.round(width)
        );

      let fallbackHeight =
        Math.max(
          320,
          Math.round(height)
        );

      for (
        let attempt = 0;
        attempt < 20;
        attempt++
      ) {
        const canvas =
          document.createElement(
            'canvas'
          );

        canvas.width =
          fallbackWidth;

        canvas.height =
          fallbackHeight;

        const context =
          canvas.getContext('2d');

        if (!context) {
          break;
        }

        context.imageSmoothingEnabled =
          true;

        context.imageSmoothingQuality =
          'high';

        context.drawImage(
          image,
          0,
          0,
          fallbackWidth,
          fallbackHeight
        );

        const blob =
          await canvasToBlob(
            canvas,
            0.72
          );

        if (
          blob.size <= MAX_SIZE
        ) {
          return {
            file: createFile(
              blob,
              file.name
            ),

            originalSize,

            finalSize: blob.size,

            compressed: true,
          };
        }

        /*
         * Reduce dimensions by 10% and try again.
         */
        fallbackWidth =
          Math.max(
            240,
            Math.round(
              fallbackWidth * 0.9
            )
          );

        fallbackHeight =
          Math.max(
            240,
            Math.round(
              fallbackHeight * 0.9
            )
          );
      }
    }

    throw new Error(
      `${file.name} could not be compressed below 100 KB.`
    );
  };

export const formatFileSize = (
  bytes: number
): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};