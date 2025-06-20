export async function convertToWebP(file: File, quality = 80): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
            });
            resolve(newFile);
          },
          'image/webp',
          quality / 100
        );
      };
      img.onerror = () => reject(new Error('Image loading error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

export async function resizeImage(file: File, width: number, height: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const newFile = new File([blob], file.name, {
              type: file.type,
            });
            resolve(newFile);
          },
          file.type,
          0.9
        );
      };
      img.onerror = () => reject(new Error('Image loading error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

export async function optimizeImage(
  file: File,
  options: {
    format: 'webp' | 'jpeg' | 'png' | 'original';
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<File> {
  try {
    let processedFile = file;

    // Resize if dimensions are specified
    if (options.maxWidth && options.maxHeight) {
      processedFile = await resizeImage(processedFile, options.maxWidth, options.maxHeight);
    }

    // Convert format if requested (and not original)
    if (options.format !== 'original') {
      if (options.format === 'webp') {
        processedFile = await convertToWebP(processedFile, options.quality);
      } else if (options.format === 'jpeg') {
        processedFile = await convertToJPEG(processedFile, options.quality);
      } else if (options.format === 'png') {
        processedFile = await convertToPNG(processedFile, options.quality);
      }
    }

    return processedFile;
  } catch (error) {
    console.error('Optimization error:', error);
    throw error;
  }
}

export async function generateFavicon(
  file: File,
  options: {
    sizes: number[];
    outputFormat: 'ico' | 'png';
  }
): Promise<File> {
  try {
    // Create canvas for each size
    const canvases = await Promise.all(
      options.sizes.map(async (size) => {
        const resized = await resizeImage(file, size, size);
        return await createCanvasFromFile(resized);
      })
    );

    if (options.outputFormat === 'ico') {
      // Generate ICO file
      return await generateIcoFile(canvases);
    } else {
      // For PNG, we'll just return the largest size
      const largestSize = Math.max(...options.sizes);
      const largestIndex = options.sizes.indexOf(largestSize);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvases[largestIndex].toBlob(resolve, 'image/png')
      );
      
      if (!blob) throw new Error('Failed to create PNG blob');
      
      return new File([blob], `favicon-${largestSize}x${largestSize}.png`, {
        type: 'image/png',
      });
    }
  } catch (error) {
    console.error('Favicon generation error:', error);
    throw error;
  }
}

export async function generatePWAIcons(
  file: File,
  options: {
    iconSizes: number[];
    splashSizes: { width: number; height: number }[];
    backgroundColor: string;
  }
): Promise<File> {
  try {
    // Generate icons
    const iconCanvases = await Promise.all(
      options.iconSizes.map(async (size) => {
        const resized = await resizeImage(file, size, size);
        return await createCanvasFromFile(resized);
      })
    );

    // Generate splash screens
    const splashCanvases = await Promise.all(
      options.splashSizes.map(async ({ width, height }) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        // Fill background
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Calculate centered image dimensions (80% of smallest dimension)
        const imageSize = Math.min(width, height) * 0.8;
        const x = (width - imageSize) / 2;
        const y = (height - imageSize) / 2;

        // Draw centered image
        const img = await createImageFromFile(file);
        ctx.drawImage(img, x, y, imageSize, imageSize);

        return canvas;
      })
    );

    // Create zip file containing all assets
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add icons to zip
    await Promise.all(
      iconCanvases.map(async (canvas, i) => {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        if (blob) {
          zip.file(`icon-${options.iconSizes[i]}x${options.iconSizes[i]}.png`, blob);
        }
      })
    );

    // Add splash screens to zip
    await Promise.all(
      splashCanvases.map(async (canvas, i) => {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        if (blob) {
          zip.file(
            `splash-${options.splashSizes[i].width}x${options.splashSizes[i].height}.png`,
            blob
          );
        }
      })
    );

    // Generate manifest.json
    const manifest = {
      name: 'My PWA',
      short_name: 'PWA',
      icons: options.iconSizes.map((size) => ({
        src: `icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
      background_color: options.backgroundColor,
      theme_color: options.backgroundColor,
      display: 'standalone',
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: 'blob' });
    return new File([zipContent], 'pwa-assets.zip', { type: 'application/zip' });
  } catch (error) {
    console.error('PWA assets generation error:', error);
    throw error;
  }
}

// Helper functions
async function createCanvasFromFile(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('Image loading error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

async function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image loading error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

async function generateIcoFile(canvases: HTMLCanvasElement[]): Promise<File> {
  // Note: In a real implementation, you would use a proper ICO encoder library
  // This is a simplified version that just uses the largest PNG
  
  // Find largest canvas
  const largestCanvas = canvases.reduce((prev, current) => 
    (current.width > prev.width) ? current : prev
  );
  
  const blob = await new Promise<Blob | null>((resolve) =>
    largestCanvas.toBlob(resolve, 'image/png')
  );
  
  if (!blob) throw new Error('Failed to create ICO blob');
  
  return new File([blob], 'favicon.ico', {
    type: 'image/x-icon',
  });
}

async function convertToJPEG(file: File, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        ctx.fillStyle = '#ffffff'; // White background for JPEG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
            });
            resolve(newFile);
          },
          'image/jpeg',
          quality / 100
        );
      };
      img.onerror = () => reject(new Error('Image loading error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

async function convertToPNG(file: File, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.png', {
              type: 'image/png',
            });
            resolve(newFile);
          },
          'image/png',
          quality / 100
        );
      };
      img.onerror = () => reject(new Error('Image loading error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}