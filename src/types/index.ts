export interface ConvertedFile {
  id: string;
  originalFile: File;
  originalUrl: string;
  svgContent: string;
  svgUrl: string;
  fileName: string;
}

export interface ConversionError {
  message: string;
  file?: File;
}