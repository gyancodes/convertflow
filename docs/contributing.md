# Contributing to ConvertFlow

Thank you for your interest in contributing to ConvertFlow! This guide will help you get started with contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Contributing Guidelines](#contributing-guidelines)
5. [Code Standards](#code-standards)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)
8. [Areas for Contribution](#areas-for-contribution)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Modern web browser for testing

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/convertflow.git
cd convertflow
```

3. Add the upstream remote:
```bash
git remote add upstream https://github.com/gyancodes/convertflow.git
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking
```

## Project Structure

```
convertflow/
├── src/
│   ├── components/          # React components
│   │   ├── converter/       # Converter-specific components
│   │   └── __tests__/       # Component tests
│   ├── services/            # Core processing services
│   │   ├── imageProcessor.ts
│   │   ├── colorQuantizer.ts
│   │   ├── edgeDetector.ts
│   │   ├── vectorizer.ts
│   │   ├── svgGenerator.ts
│   │   └── __tests__/       # Service tests
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── workers/             # Web Worker scripts
│   └── App.tsx              # Main application component
├── docs/                    # Documentation
├── public/                  # Static assets
├── tests/                   # Integration tests
└── package.json
```

### Key Directories

- **`src/components/`**: React components for the UI
- **`src/services/`**: Core image processing and vectorization logic
- **`src/types/`**: TypeScript interfaces and type definitions
- **`src/utils/`**: Helper functions and utilities
- **`src/workers/`**: Web Worker implementations for background processing

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues in existing functionality
- **Feature additions**: Add new features or capabilities
- **Performance improvements**: Optimize existing code
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **UI/UX improvements**: Enhance user interface and experience

### Before You Start

1. **Check existing issues**: Look for existing issues or feature requests
2. **Create an issue**: If none exists, create one to discuss your proposed changes
3. **Get feedback**: Wait for maintainer feedback before starting large changes
4. **Assign yourself**: Comment on the issue to let others know you're working on it

### Development Workflow

1. **Create a branch**: Create a feature branch from `main`
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes**: Implement your changes following the code standards
3. **Test thoroughly**: Ensure all tests pass and add new tests if needed
4. **Commit changes**: Use clear, descriptive commit messages
5. **Push and create PR**: Push your branch and create a pull request

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` types when possible
- Use interfaces for object shapes

```typescript
// Good
interface ProcessingOptions {
  colorCount: number;
  algorithm: 'shapes' | 'photo' | 'lineart';
}

function processImage(options: ProcessingOptions): Promise<Result> {
  // implementation
}

// Avoid
function processImage(options: any): any {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Implement proper prop types
- Use meaningful component and prop names
- Keep components focused and single-purpose

```typescript
// Good
interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  isProcessing,
  maxFiles = 20
}) => {
  // component implementation
};
```

### Styling

- Use Tailwind CSS for styling
- Follow the existing design system
- Ensure responsive design
- Maintain accessibility standards

```tsx
// Good
<button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors focus-ring">
  Convert
</button>
```

### Error Handling

- Use proper error types
- Provide meaningful error messages
- Implement graceful fallbacks
- Log errors appropriately

```typescript
// Good
try {
  const result = await processImage(imageData, config);
  return result;
} catch (error) {
  if (error instanceof ConversionError) {
    // Handle specific conversion errors
    throw error;
  } else {
    // Handle unexpected errors
    throw new ConversionError(
      'Unexpected processing error',
      'processing_error',
      false,
      { originalError: error }
    );
  }
}
```

### Performance

- Optimize for memory usage
- Use Web Workers for heavy processing
- Implement proper cleanup
- Monitor performance metrics

```typescript
// Good
useEffect(() => {
  const worker = new Worker('/workers/processing-worker.js');
  
  // Setup worker
  
  return () => {
    worker.terminate(); // Cleanup
  };
}, []);
```

## Testing

### Test Structure

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test component interactions
- **End-to-end tests**: Test complete user workflows

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '../FileUpload';

describe('FileUpload', () => {
  it('should call onFilesSelected when files are dropped', () => {
    const mockOnFilesSelected = jest.fn();
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />);
    
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const dropZone = screen.getByRole('button');
    
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    
    expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
  });
});
```

### Service Tests

```typescript
// Service test example
import { ColorQuantizer } from '../colorQuantizer';

describe('ColorQuantizer', () => {
  it('should reduce colors using k-means clustering', async () => {
    const quantizer = new ColorQuantizer();
    const imageData = createTestImageData(100, 100);
    
    const palette = await quantizer.quantizeKMeans(imageData, 8);
    
    expect(palette.colors).toHaveLength(8);
    expect(palette.colors[0]).toHaveProperty('r');
    expect(palette.colors[0]).toHaveProperty('g');
    expect(palette.colors[0]).toHaveProperty('b');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Submitting Changes

### Pull Request Process

1. **Update documentation**: Update relevant documentation
2. **Add tests**: Ensure new code is tested
3. **Update changelog**: Add entry to CHANGELOG.md if applicable
4. **Create PR**: Create a pull request with a clear description

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Other (please describe)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
```

### Code Review Process

1. **Automated checks**: Ensure all CI checks pass
2. **Peer review**: Wait for maintainer review
3. **Address feedback**: Make requested changes
4. **Final approval**: Wait for final approval before merge

## Areas for Contribution

### High Priority

1. **Algorithm Improvements**
   - Better edge detection algorithms
   - Improved color quantization
   - More efficient path generation

2. **Performance Optimization**
   - Memory usage optimization
   - Processing speed improvements
   - Better Web Worker utilization

3. **User Experience**
   - Better error messages
   - Improved progress indicators
   - Enhanced preview functionality

### Medium Priority

1. **New Features**
   - Additional export formats
   - Batch processing improvements
   - Advanced configuration options

2. **Testing**
   - Increase test coverage
   - Add performance benchmarks
   - Browser compatibility testing

3. **Documentation**
   - API documentation improvements
   - Tutorial content
   - Video guides

### Low Priority

1. **Code Quality**
   - Refactoring for better maintainability
   - Type safety improvements
   - Code organization

2. **Accessibility**
   - Screen reader improvements
   - Keyboard navigation
   - High contrast mode

## Specific Contribution Ideas

### For Beginners

- Fix typos in documentation
- Add missing TypeScript types
- Improve error messages
- Add unit tests for utility functions
- Update component prop documentation

### For Intermediate Contributors

- Implement new UI components
- Add integration tests
- Optimize existing algorithms
- Improve mobile responsiveness
- Add new configuration options

### For Advanced Contributors

- Implement new vectorization algorithms
- Add GPU acceleration support
- Create Web Worker optimizations
- Build performance monitoring tools
- Implement advanced SVG features

## Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Request Comments**: For code-specific discussions

### Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

### Mentorship

New contributors are welcome! If you're new to open source or need help getting started:

1. Look for issues labeled "good first issue"
2. Comment on issues asking for guidance
3. Join discussions to learn from other contributors
4. Don't hesitate to ask questions

## Recognition

Contributors are recognized in several ways:

- **Contributors list**: Added to README.md
- **Release notes**: Mentioned in release announcements
- **GitHub insights**: Visible in repository insights
- **Special thanks**: Called out for significant contributions

## Code of Conduct

Please note that this project follows a Code of Conduct. By participating, you agree to uphold this code:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences
- Show empathy towards other community members

## License

By contributing to ConvertFlow, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to ConvertFlow! Your efforts help make image conversion better for everyone.