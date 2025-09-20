import '@testing-library/jest-dom';

// Mock File and FileReader for testing
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  private _bits: BlobPart[];
  
  constructor(bits: BlobPart[], filename: string, options: FilePropertyBag = {}) {
    this.name = filename;
    this._bits = bits;
    this.size = bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.byteLength || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob(this._bits, { type: contentType });
  }

  stream(): ReadableStream {
    return new ReadableStream();
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    if (this._bits.length > 0 && this._bits[0] instanceof Uint8Array) {
      return Promise.resolve((this._bits[0] as Uint8Array).buffer);
    }
    return Promise.resolve(new ArrayBuffer(0));
  }
} as any;

global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: number = 0;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsDataURL(file: Blob): void {
    setTimeout(() => {
      this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      this.readyState = 2;
      if (this.onload) {
        this.onload({ target: this } as any);
      }
    }, 0);
  }

  readAsArrayBuffer(file: Blob): void {
    setTimeout(async () => {
      try {
        // Get the actual blob data
        const arrayBuffer = await file.arrayBuffer();
        this.result = arrayBuffer;
      } catch (error) {
        this.error = new DOMException('Failed to read file');
        if (this.onerror) {
          this.onerror({ target: this } as any);
        }
        return;
      }
      this.readyState = 2;
      if (this.onload) {
        this.onload({ target: this } as any);
      }
    }, 0);
  }

  readAsText(file: Blob): void {
    setTimeout(() => {
      this.result = '';
      this.readyState = 2;
      if (this.onload) {
        this.onload({ target: this } as any);
      }
    }, 0);
  }

  abort(): void {
    this.readyState = 2;
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
} as any;

// Mock ImageData for canvas-related tests
global.ImageData = class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
    if (typeof dataOrWidth === 'number') {
      // ImageData(width, height)
      this.width = dataOrWidth;
      this.height = widthOrHeight!;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      // ImageData(data, width, height?)
      this.data = dataOrWidth;
      this.width = widthOrHeight!;
      this.height = height || (dataOrWidth.length / (4 * widthOrHeight!));
    }
  }
} as any;