import React, { useState } from 'react';
import { ArrowLeft, Book, Code, Zap, HelpCircle, Users, Settings } from 'lucide-react';

interface DocumentationProps {
  onBack: () => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">Getting Started with ConvertFlow</h2>
            <p className="text-xl text-gray-600 mb-8">
              Learn how to convert your PNG images to scalable SVG vectors in minutes.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">What is ConvertFlow?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                ConvertFlow is a powerful, browser-based PNG to SVG converter that uses advanced vectorization 
                algorithms to convert raster images into scalable vector graphics. Unlike simple embedding 
                converters, ConvertFlow creates true vector paths from your images.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Why Convert PNG to SVG?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Benefits of SVG</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Infinite scalability without quality loss</li>
                    <li>• Often smaller file sizes than PNG</li>
                    <li>• Editable with code or design tools</li>
                    <li>• SEO friendly and accessible</li>
                    <li>• CSS styleable and animation ready</li>
                  </ul>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Best Use Cases</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Logos and brand marks</li>
                    <li>• UI icons and navigation elements</li>
                    <li>• Simple illustrations</li>
                    <li>• Line art and technical diagrams</li>
                    <li>• Web graphics that need to scale</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Your First Conversion</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-2">Configure Settings</h4>
                    <p className="text-gray-700">
                      Choose your conversion algorithm (Auto recommended), adjust color count, 
                      and set smoothing preferences.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-2">Upload Your PNG</h4>
                    <p className="text-gray-700">
                      Drag and drop your PNG file or click to browse. Supports up to 20 files 
                      at once, maximum 10MB each.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-2">Start Conversion</h4>
                    <p className="text-gray-700">
                      Click "Start Conversion" and watch the progress through preprocessing, 
                      color quantization, vectorization, and SVG generation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-2">Download Your SVG</h4>
                    <p className="text-gray-700">
                      Preview the results, compare with the original, and download your 
                      scalable SVG file.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'user-guide',
      title: 'User Guide',
      icon: Settings,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">Complete User Guide</h2>
            <p className="text-xl text-gray-600 mb-8">
              Master all features and get the best results from ConvertFlow.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Algorithm Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Auto (Recommended)</h4>
                  <p className="text-gray-700 mb-3">
                    Automatically detects the best algorithm for your image by analyzing 
                    characteristics like edge sharpness, color distribution, and complexity.
                  </p>
                  <p className="text-sm text-gray-600">Best for: Most users and mixed content</p>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Shapes</h4>
                  <p className="text-gray-700 mb-3">
                    Optimized for logos, icons, and geometric graphics with clean lines 
                    and solid colors. Produces simplified vector paths.
                  </p>
                  <p className="text-sm text-gray-600">Best for: Logos, icons, simple graphics</p>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Photo</h4>
                  <p className="text-gray-700 mb-3">
                    Designed for photographic content with advanced color quantization 
                    and gradient preservation for complex images.
                  </p>
                  <p className="text-sm text-gray-600">Best for: Photographs, complex artwork</p>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">LineArt</h4>
                  <p className="text-gray-700 mb-3">
                    Specialized for line drawings and sketches with emphasis on 
                    edge detection and minimal color processing.
                  </p>
                  <p className="text-sm text-gray-600">Best for: Drawings, sketches, diagrams</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Configuration Options</h3>
              <div className="space-y-6">
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Color Count (2-256)</h4>
                  <p className="text-gray-700 mb-3">
                    Controls how many colors are used in the final SVG. Lower values create 
                    simpler graphics, higher values preserve more detail.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Low (2-8): Simple graphics, logos</p>
                    <p>• Medium (16-32): Balanced detail and simplicity</p>
                    <p>• High (64-256): Complex images, photographs</p>
                  </div>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Path Simplification</h4>
                  <p className="text-gray-700 mb-3">
                    Controls how much paths are simplified. Higher values create fewer 
                    path points and smaller files, but may lose detail.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Low (0.1-1.0): Maximum detail, larger files</p>
                    <p>• Medium (1.0-3.0): Balanced detail and size</p>
                    <p>• High (3.0-10.0): Simplified paths, smaller files</p>
                  </div>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Smoothing Level</h4>
                  <p className="text-gray-700 mb-3">
                    Controls how smooth the vector paths are. Higher smoothing creates 
                    more organic curves but may lose sharp details.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Low: Preserves sharp edges, more accurate</p>
                    <p>• Medium: Balanced approach (recommended)</p>
                    <p>• High: Very smooth curves, smaller files</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'algorithms',
      title: 'Algorithms',
      icon: Code,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">Vectorization Algorithms</h2>
            <p className="text-xl text-gray-600 mb-8">
              Understanding how ConvertFlow transforms your images into vectors.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Processing Pipeline</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-semibold text-black">Image Preprocessing</h4>
                    <p className="text-gray-600 text-sm">Loading and preparing the image data</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-semibold text-black">Color Quantization</h4>
                    <p className="text-gray-600 text-sm">Reducing colors using K-means clustering</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-semibold text-black">Edge Detection</h4>
                    <p className="text-gray-600 text-sm">Finding boundaries using Sobel or Canny algorithms</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                  <div>
                    <h4 className="font-semibold text-black">Path Generation</h4>
                    <p className="text-gray-600 text-sm">Converting edges to vector paths</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                  <div>
                    <h4 className="font-semibold text-black">SVG Generation</h4>
                    <p className="text-gray-600 text-sm">Creating optimized SVG markup</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Algorithm Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-black">Feature</th>
                      <th className="text-left py-3 px-4 font-semibold text-black">Shapes</th>
                      <th className="text-left py-3 px-4 font-semibold text-black">Photo</th>
                      <th className="text-left py-3 px-4 font-semibold text-black">LineArt</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">Best For</td>
                      <td className="py-3 px-4 text-gray-700">Logos, Icons</td>
                      <td className="py-3 px-4 text-gray-700">Photos, Complex Images</td>
                      <td className="py-3 px-4 text-gray-700">Drawings, Sketches</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">Edge Detection</td>
                      <td className="py-3 px-4 text-gray-700">Sobel (High Threshold)</td>
                      <td className="py-3 px-4 text-gray-700">Canny (Adaptive)</td>
                      <td className="py-3 px-4 text-gray-700">High Contrast</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">Processing Speed</td>
                      <td className="py-3 px-4 text-gray-700">Fast</td>
                      <td className="py-3 px-4 text-gray-700">Slow</td>
                      <td className="py-3 px-4 text-gray-700">Medium</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">File Size</td>
                      <td className="py-3 px-4 text-gray-700">Small</td>
                      <td className="py-3 px-4 text-gray-700">Medium-Large</td>
                      <td className="py-3 px-4 text-gray-700">Small-Medium</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-900">Detail Level</td>
                      <td className="py-3 px-4 text-gray-700">Low-Medium</td>
                      <td className="py-3 px-4 text-gray-700">High</td>
                      <td className="py-3 px-4 text-gray-700">Medium</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: HelpCircle,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">Troubleshooting Guide</h2>
            <p className="text-xl text-gray-600 mb-8">
              Solutions to common issues and optimization tips.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Common Issues</h3>
              <div className="space-y-6">
                <div className="vercel-card p-6 border-l-4 border-red-400">
                  <h4 className="text-lg font-semibold text-black mb-3">SVG doesn't look like original</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Try different algorithms (Shapes/Photo/LineArt)</li>
                      <li>Increase color count to 32-64 for complex images</li>
                      <li>Lower path simplification (0.5-1.0)</li>
                      <li>Adjust smoothing level based on image type</li>
                    </ul>
                  </div>
                </div>
                <div className="vercel-card p-6 border-l-4 border-yellow-400">
                  <h4 className="text-lg font-semibold text-black mb-3">SVG file is too large</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Reduce color count to 8-16 for simple graphics</li>
                      <li>Increase path simplification (2.0-5.0)</li>
                      <li>Use "Shapes" algorithm for smaller files</li>
                      <li>Enable higher smoothing to reduce path points</li>
                    </ul>
                  </div>
                </div>
                <div className="vercel-card p-6 border-l-4 border-blue-400">
                  <h4 className="text-lg font-semibold text-black mb-3">Processing is slow or fails</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Reduce image size to 2048x2048 pixels or smaller</li>
                      <li>Process fewer files at once</li>
                      <li>Enable Web Workers in performance settings</li>
                      <li>Close other browser tabs to free memory</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Optimization Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">For Best Speed</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• Algorithm: Shapes</p>
                    <p>• Color Count: 8</p>
                    <p>• Path Simplification: 3.0</p>
                    <p>• Smoothing: High</p>
                    <p>• Web Workers: Enabled</p>
                  </div>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">For Best Quality</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• Algorithm: Auto or Photo</p>
                    <p>• Color Count: 32-64</p>
                    <p>• Path Simplification: 0.5-1.0</p>
                    <p>• Smoothing: Low or Medium</p>
                    <p>• Transparency: Enabled</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">System Requirements</h3>
              <div className="vercel-card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-3">Minimum Requirements</h4>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• Modern browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)</li>
                      <li>• 2GB RAM available to browser</li>
                      <li>• JavaScript enabled</li>
                      <li>• Canvas API support</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-3">Recommended</h4>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• Chrome 90+ or equivalent</li>
                      <li>• 4GB+ RAM available</li>
                      <li>• Desktop or laptop computer</li>
                      <li>• Fast internet connection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contributing',
      title: 'Contributing',
      icon: Users,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">Contributing to ConvertFlow</h2>
            <p className="text-xl text-gray-600 mb-8">
              Help make ConvertFlow better for everyone. We welcome all contributions!
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Ways to Contribute</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">For Everyone</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Report bugs and issues</li>
                    <li>• Suggest new features</li>
                    <li>• Improve documentation</li>
                    <li>• Share feedback and ideas</li>
                    <li>• Test beta features</li>
                  </ul>
                </div>
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">For Developers</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Fix bugs and issues</li>
                    <li>• Add new features</li>
                    <li>• Improve algorithms</li>
                    <li>• Optimize performance</li>
                    <li>• Write tests</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Getting Started</h3>
              <div className="space-y-4">
                <div className="vercel-card p-6">
                  <h4 className="text-lg font-semibold text-black mb-3">Development Setup</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
                    <div className="space-y-1">
                      <div># Clone the repository</div>
                      <div>git clone https://github.com/gyancodes/convertflow.git</div>
                      <div>cd convertflow</div>
                      <div></div>
                      <div># Install dependencies</div>
                      <div>npm install</div>
                      <div></div>
                      <div># Start development server</div>
                      <div>npm run dev</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Project Structure</h3>
              <div className="vercel-card p-6">
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
                  <div className="space-y-1 text-gray-800">
                    <div>src/</div>
                    <div>├── components/          # React components</div>
                    <div>│   ├── converter/       # Converter-specific components</div>
                    <div>│   └── __tests__/       # Component tests</div>
                    <div>├── services/            # Core processing services</div>
                    <div>├── types/               # TypeScript definitions</div>
                    <div>├── utils/               # Utility functions</div>
                    <div>└── workers/             # Web Worker scripts</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Contribution Areas</h3>
              <div className="space-y-4">
                <div className="vercel-card p-6 border-l-4 border-green-400">
                  <h4 className="text-lg font-semibold text-black mb-3">High Priority</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Algorithm improvements and optimizations</li>
                    <li>• Performance enhancements and memory optimization</li>
                    <li>• User experience improvements</li>
                    <li>• Better error handling and recovery</li>
                  </ul>
                </div>
                <div className="vercel-card p-6 border-l-4 border-blue-400">
                  <h4 className="text-lg font-semibold text-black mb-3">Medium Priority</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• New features and capabilities</li>
                    <li>• Test coverage improvements</li>
                    <li>• Documentation enhancements</li>
                    <li>• Browser compatibility testing</li>
                  </ul>
                </div>
                <div className="vercel-card p-6 border-l-4 border-gray-400">
                  <h4 className="text-lg font-semibold text-black mb-3">Good First Issues</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Fix typos in documentation</li>
                    <li>• Add missing TypeScript types</li>
                    <li>• Improve error messages</li>
                    <li>• Add unit tests for utilities</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-black mb-4">Get Involved</h3>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://github.com/gyancodes/convertflow" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
                >
                  <span>View on GitHub</span>
                </a>
                <a 
                  href="https://github.com/gyancodes/convertflow/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
                >
                  <span>Report Issues</span>
                </a>
                <a 
                  href="https://github.com/gyancodes/convertflow/discussions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
                >
                  <span>Join Discussions</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeContent = sections.find(section => section.id === activeSection);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to ConvertFlow</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-black">Documentation</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-4xl">
            {activeContent?.content}
          </div>
        </div>
      </div>
    </div>
  );
};