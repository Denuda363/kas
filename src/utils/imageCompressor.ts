/**
 * Utility to compress receipt images before storing in Firestore or localStorage.
 * Resizes max dimension to 900px and compresses as JPEG with quality 0.72,
 * keeping the payload small (~35KB-75KB) while preserving high legibility for text & numbers.
 */
export async function compressReceiptImage(file: File): Promise<{ dataUrl: string; fileSizeKb: number }> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung.'));
      img.onload = () => {
        const maxDimension = 900;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Tidak dapat memproses canvas gambar.'));
          return;
        }

        // Draw image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({ dataUrl, fileSizeKb: approxSizeKb });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
