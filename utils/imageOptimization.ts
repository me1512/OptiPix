// imageOptimization.ts

import { toast } from 'sonner';


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
        if (!ctx) return reject(new Error('Could not create canvas context'));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
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

export async function convertToAVIF(file: File, quality = 80): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not create canvas context'));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.avif', {
              type: 'image/avif',
            });
            resolve(newFile);
          },
          'image/avif',
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

export async function convertToJPEG(file: File, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not create canvas context'));
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
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

export async function convertToPNG(file: File, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not create canvas context'));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
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
        if (!ctx) return reject(new Error('Could not create canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob conversion failed'));
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

import heic2any from 'heic2any';

export async function convertFromHEIC(file: File, targetFormat: 'jpeg' | 'png' = 'jpeg', quality = 0.8): Promise<File> {
  try {
    const outputType = targetFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await heic2any({
      blob: file,
      toType: outputType,
      quality: quality,
    });
    const ext = targetFormat === 'jpeg' ? '.jpg' : '.png';
    return new File([blob as Blob], file.name.replace(/\.[^/.]+$/, '') + ext, { type: outputType });
  } catch (error) {
    toast.error('Failed to convert HEIC image.');
    throw error;
  }
}

export async function optimizeImage(
  file: File,
  options: {
    format: 'webp' | 'jpeg' | 'png' | 'avif' | 'original' | 'heic';
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<File> {
  try {
    let processedFile = file;

    // Detect HEIC input and convert to JPEG or PNG for browser compatibility
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      toast.info('Converting HEIC image to JPEG for browser compatibility.');
      processedFile = await convertFromHEIC(processedFile, 'jpeg', options.quality / 100);
    }

    if (options.maxWidth && options.maxHeight) {
      processedFile = await resizeImage(processedFile, options.maxWidth, options.maxHeight);
    }

    if (options.format !== 'original' && options.format !== 'heic') {
      switch (options.format) {
        case 'webp':
          processedFile = await convertToWebP(processedFile, options.quality);
          break;
        case 'jpeg':
          processedFile = await convertToJPEG(processedFile, options.quality);
          break;
        case 'png':
          toast.warning('PNG quality parameter has no effect; size might increase.');
          processedFile = await convertToPNG(processedFile, options.quality);
          break;
        case 'avif':
          processedFile = await convertToAVIF(processedFile, options.quality);
          break;
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
  const canvases = await Promise.all(
    options.sizes.map(async (size) => {
      const resized = await resizeImage(file, size, size);
      return await createCanvasFromFile(resized);
    })
  );

  if (options.outputFormat === 'ico') {
    return await generateIcoFile(canvases);
  } else {
    const largestSize = Math.max(...options.sizes);
    const index = options.sizes.indexOf(largestSize);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvases[index].toBlob(resolve, 'image/png')
    );
    if (!blob) throw new Error('Failed to create PNG blob');
    return new File([blob], `favicon-${largestSize}x${largestSize}.png`, {
      type: 'image/png',
    });
  }
}

export async function generatePWAIcons(
  file: File,
  options: {
    iconSizes: number[];
    splashSizes: { width: number; height: number }[];
    backgroundColor: string;
  }
): Promise<{
  zip: File;
  previews: { name: string; url: string; type: 'icon' | 'splash' }[];
}> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const previews: { name: string; url: string; type: 'icon' | 'splash' }[] = [];

  for (const size of options.iconSizes) {
    const canvas = await createCanvasFromFile(await resizeImage(file, size, size));
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const name = `icon-${size}x${size}.png`;
      zip.file(name, blob);
      previews.push({ name, type: 'icon', url: URL.createObjectURL(blob) });
    }
  }

  for (const { width, height } of options.splashSizes) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const img = await createImageFromFile(file);
    const imageSize = Math.min(width, height) * 0.8;
    const x = (width - imageSize) / 2;
    const y = (height - imageSize) / 2;
    ctx.drawImage(img, x, y, imageSize, imageSize);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const name = `splash-${width}x${height}.png`;
      zip.file(name, blob);
      previews.push({ name, type: 'splash', url: URL.createObjectURL(blob) });
    }
  }

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
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
      },
      null,
      2
    )
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return {
    zip: new File([zipBlob], 'pwa-assets.zip', { type: 'application/zip' }),
    previews,
  };
}

// Helpers
async function createCanvasFromFile(file: File): Promise<HTMLCanvasElement> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not create canvas context'));
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
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
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
  const largestCanvas = canvases.reduce((a, b) => (a.width > b.width ? a : b));
  const blob = await new Promise<Blob | null>((resolve) =>
    largestCanvas.toBlob(resolve, 'image/png')
  );
  if (!blob) throw new Error('Failed to create ICO blob');
  return new File([blob], 'favicon.ico', { type: 'image/x-icon' });
}
