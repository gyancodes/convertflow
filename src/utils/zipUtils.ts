import { ConversionJob } from '../types/converter';

/**
 * Utility functions for ZIP file generation
 */

/**
 * Generate a ZIP file containing all converted SVG files
 */
export const generateZipFile = async (completedJobs: ConversionJob[]): Promise<Blob> => {
  // Use JSZip library for ZIP generation
  const JSZip = await import('jszip');
  const zip = new JSZip.default();

  // Filter jobs that have valid results
  const validJobs = completedJobs.filter(job => job.result?.svgContent);

  // Add each SVG file to the ZIP
  validJobs.forEach((job, index) => {
    // Generate filename from original PNG filename
    const originalName = job.file.name;
    let svgFilename: string;
    
    if (originalName.toLowerCase().endsWith('.png')) {
      svgFilename = originalName.replace(/\.png$/i, '.svg');
    } else {
      svgFilename = `converted_${index + 1}.svg`;
    }
    
    zip.file(svgFilename, job.result!.svgContent);
  });

  // Add a summary file with conversion details (only for valid jobs)
  const summaryContent = generateSummaryFile(validJobs);
  zip.file('conversion_summary.txt', summaryContent);

  // Generate the ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
};

/**
 * Generate a summary file with conversion statistics
 */
const generateSummaryFile = (completedJobs: ConversionJob[]): string => {
  const totalFiles = completedJobs.length;
  const totalOriginalSize = completedJobs.reduce((sum, job) => sum + (job.result?.originalSize || 0), 0);
  const totalVectorSize = completedJobs.reduce((sum, job) => sum + (job.result?.vectorSize || 0), 0);
  const totalProcessingTime = completedJobs.reduce((sum, job) => sum + (job.result?.processingTime || 0), 0);
  const averageProcessingTime = totalProcessingTime / totalFiles;

  const summary = `PNG to SVG Batch Conversion Summary
=====================================

Conversion Date: ${new Date().toISOString()}
Total Files Processed: ${totalFiles}

Size Statistics:
- Total Original Size: ${formatBytes(totalOriginalSize)}
- Total Vector Size: ${formatBytes(totalVectorSize)}
- Size Reduction: ${((1 - totalVectorSize / totalOriginalSize) * 100).toFixed(1)}%

Processing Statistics:
- Total Processing Time: ${formatTime(totalProcessingTime)}
- Average Processing Time: ${formatTime(averageProcessingTime)}

Individual File Details:
${completedJobs.map((job, index) => {
  const result = job.result!;
  const originalName = job.file.name;
  let svgName: string;
  
  if (originalName.toLowerCase().endsWith('.png')) {
    svgName = originalName.replace(/\.png$/i, '.svg');
  } else {
    svgName = `converted_${index + 1}.svg`;
  }
  
  return `${index + 1}. ${originalName} -> ${svgName}
   - Original Size: ${formatBytes(result.originalSize)}
   - Vector Size: ${formatBytes(result.vectorSize)}
   - Processing Time: ${formatTime(result.processingTime)}
   - Colors: ${result.colorCount}
   - Paths: ${result.pathCount}`;
}).join('\n\n')}

Configuration Used:
- Color Count: ${completedJobs[0]?.config.colorCount || 'N/A'}
- Smoothing Level: ${completedJobs[0]?.config.smoothingLevel || 'N/A'}
- Path Simplification: ${completedJobs[0]?.config.pathSimplification || 'N/A'}
- Algorithm: ${completedJobs[0]?.config.algorithm || 'N/A'}
- Preserve Transparency: ${completedJobs[0]?.config.preserveTransparency ? 'Yes' : 'No'}
`;

  return summary;
};

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format time in milliseconds to human-readable string
 */
const formatTime = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * Create and trigger download of a ZIP file
 */
export const downloadZipFile = (zipBlob: Blob, filename: string = 'converted_svgs.zip'): void => {
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validate ZIP file generation requirements
 */
export const validateZipGeneration = (jobs: ConversionJob[]): { valid: boolean; error?: string } => {
  if (jobs.length === 0) {
    return { valid: false, error: 'No completed jobs to include in ZIP' };
  }

  const invalidJobs = jobs.filter(job => !job.result?.svgContent);
  if (invalidJobs.length > 0) {
    return { 
      valid: false, 
      error: `${invalidJobs.length} jobs missing SVG content` 
    };
  }

  return { valid: true };
};

export default {
  generateZipFile,
  downloadZipFile,
  validateZipGeneration
};