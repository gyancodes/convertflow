export const convertPngToSvg = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const base64Data = e.target?.result as string;

        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
  <image width="${img.width}" height="${img.height}" xlink:href="${base64Data}"/>
</svg>`;
          resolve(svgContent);
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = base64Data;
      } catch (error) {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};

export const downloadSvg = (svgContent: string, fileName: string) => {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.replace(/\.[^/.]+$/, "") + ".svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateImageFile = (file: File): string | null => {
  const validTypes = ["image/png"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return "Please select a PNG file only.";
  }

  if (file.size > maxSize) {
    return "File size must be less than 10MB.";
  }

  return null;
};
