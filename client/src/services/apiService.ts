export interface ConversionRequest {
  engine: 'potrace' | 'imagetracer';
  options?: {
    threshold?: number;
    turdSize?: number;
    alphaMax?: number;
    optCurve?: boolean;
    optTolerance?: number;
    turnPolicy?: string;
    // ImageTracer options
    ltres?: number;
    qtres?: number;
    scale?: number;
    strokewidth?: number;
    numberofcolors?: number;
  };
}

export interface ConversionResponse {
  success: boolean;
  svgContent?: string;
  error?: string;
  originalSize?: number;
  convertedSize?: number;
  processingTime?: number;
}

export interface BatchConversionRequest {
  engine: 'potrace' | 'imagetracer';
  options?: ConversionRequest['options'];
}

export interface BatchConversionResponse {
  success: boolean;
  results?: Array<{
    filename: string;
    svgContent: string;
    originalSize: number;
    convertedSize: number;
  }>;
  error?: string;
  totalProcessingTime?: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Default to localhost:3001, can be configured via environment variables
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  async convertSingleImage(file: File, request: ConversionRequest): Promise<ConversionResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('engine', request.engine);
      
      if (request.options) {
        formData.append('options', JSON.stringify(request.options));
      }

      const response = await fetch(`${this.baseUrl}/api/convert/single`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API conversion error:', error);
      // Re-throw the error to preserve status information for retry logic
      throw error;
    }
  }

  async convertBatchImages(files: File[], request: BatchConversionRequest): Promise<BatchConversionResponse> {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      
      formData.append('engine', request.engine);
      
      if (request.options) {
        formData.append('options', JSON.stringify(request.options));
      }

      const response = await fetch(`${this.baseUrl}/api/convert/batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API batch conversion error:', error);
      // Re-throw the error to preserve status information for retry logic
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get available conversion engines and their capabilities
  async getEngineInfo(): Promise<{ engines: string[]; capabilities: any } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/engines`, {
        method: 'GET',
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get engine info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;