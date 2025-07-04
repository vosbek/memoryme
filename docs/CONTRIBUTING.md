# Contributing to DevMemory

Thank you for your interest in contributing to DevMemory! This document provides guidelines and information for contributors.

## 🎯 Project Overview

DevMemory is an enterprise developer memory assistant that combines:
- Local vector database for semantic search
- LLM integration via AWS Bedrock
- VSCode integration for context capture
- Knowledge graph visualization
- Team collaboration features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+ (for Chroma vector database)
- Git
- AWS account with Bedrock access (for LLM features)
- Visual Studio Build Tools (Windows) or Xcode (macOS)

### Development Setup
1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Configure AWS credentials
4. Start development server: `npm run dev`

### Project Structure
```
src/
├── main/           # Electron main process
├── renderer/       # React frontend
└── shared/         # Shared utilities and types
```

## 🔄 Development Workflow

### Branching Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Critical production fixes

### Commit Convention
Use conventional commits format:
```
type(scope): description

feat(search): add semantic search with embeddings
fix(ui): resolve memory editor save button issue
docs(readme): update installation instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🧪 Testing Guidelines

### Test Structure
```
src/
├── __tests__/           # Test files
├── __mocks__/           # Mock files
└── test-utils/          # Testing utilities
```

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Test Requirements
- Unit tests for all business logic
- Integration tests for database operations
- E2E tests for critical user workflows
- Minimum 80% code coverage

## 🎨 Code Style

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use enums for constants
- Prefer functional programming patterns

### React Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns
- Use TypeScript for prop validation

### Styling Guidelines
- Use Tailwind CSS for styling
- Follow responsive design principles
- Maintain consistent spacing and typography
- Use semantic HTML elements

## 📋 Pull Request Process

### Before Submitting
1. **Code Quality**
   - [ ] All tests pass
   - [ ] Code follows style guidelines
   - [ ] No ESLint/TypeScript errors
   - [ ] Documentation updated

2. **Functionality**
   - [ ] Feature works as expected
   - [ ] Edge cases handled
   - [ ] Error handling implemented
   - [ ] Performance considerations addressed

3. **Security**
   - [ ] No hardcoded secrets
   - [ ] Input validation implemented
   - [ ] Security best practices followed
   - [ ] No new vulnerabilities introduced

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

### Review Process
1. Automated checks must pass
2. At least one code review required
3. Security review for sensitive changes
4. Maintainer approval required for merge

## 🚀 Release Process

### Versioning
Follow Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Tests pass
- [ ] Security scan completed
- [ ] Release notes prepared

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g., Windows 10]
- DevMemory Version: [e.g., 1.0.0]
- Node.js Version: [e.g., 18.0.0]

**Additional context**
Any other context about the problem
```

### Severity Levels
- **Critical**: Application crashes, data loss
- **High**: Major functionality broken
- **Medium**: Minor functionality issues
- **Low**: Cosmetic issues, minor inconveniences

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions considered

**Additional context**
Mockups, examples, or additional context
```

### Feature Development Process
1. Discussion in GitHub Issues
2. Design document creation
3. Implementation plan approval
4. Development and testing
5. Documentation update
6. Release planning

## 🎯 Areas for Contribution

### High Priority
- [ ] Vector database optimization
- [ ] Advanced search features
- [ ] Knowledge graph visualization
- [ ] Performance improvements
- [ ] Security enhancements

### Medium Priority
- [ ] UI/UX improvements
- [ ] Additional integrations
- [ ] Mobile companion app
- [ ] Analytics dashboard
- [ ] Export/import features

### Good First Issues
- [ ] Documentation improvements
- [ ] Code cleanup
- [ ] Test coverage improvements
- [ ] Accessibility enhancements
- [ ] Internationalization

## 🔒 Security Guidelines

### Reporting Security Issues
- **DO NOT** create public GitHub issues for security vulnerabilities
- Email security concerns to: security@devmemory.com
- Include detailed reproduction steps
- Allow 90 days for responsible disclosure

### Security Best Practices
- Never commit secrets or credentials
- Validate all user inputs
- Use prepared statements for database queries
- Implement proper authentication and authorization
- Follow OWASP security guidelines

## 📚 Documentation

### Documentation Types
- **README**: Project overview and quick start
- **API Documentation**: Code documentation
- **User Guide**: End-user documentation
- **Developer Guide**: Technical documentation

### Documentation Standards
- Use clear, concise language
- Include code examples
- Maintain up-to-date screenshots
- Follow markdown formatting standards

## 🤝 Community Guidelines

### Code of Conduct
We are committed to providing a welcoming and inclusive environment:
- Be respectful and professional
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Report inappropriate behavior

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time community chat
- **Email**: security@devmemory.com for security issues

### Recognition
Contributors will be recognized in:
- Project README
- Release notes
- Annual contributor report
- Conference presentations

## 📈 Roadmap

### Short Term (3 months)
- Enhanced search capabilities
- Performance optimizations
- Security improvements
- Bug fixes and stability

### Medium Term (6 months)
- Team collaboration features
- Advanced analytics
- Mobile application
- Plugin ecosystem

### Long Term (12 months)
- AI-powered insights
- Enterprise security features
- Cloud synchronization
- Advanced integrations

## 🏆 Contributor Levels

### Contributor
- Submit pull requests
- Report issues
- Participate in discussions

### Regular Contributor
- 5+ merged PRs
- Active community participation
- Invitation to contributor Discord

### Maintainer
- 20+ merged PRs
- Consistent high-quality contributions
- Write access to repository
- Vote on project decisions

### Core Team
- Significant project contributions
- Leadership in project direction
- Release management responsibilities
- Mentoring other contributors

## 📞 Getting Help

### Resources
- [Project Documentation](./README.md)
- [API Documentation](./docs/api.md)
- [Security Guidelines](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Support Channels
1. Check existing GitHub issues
2. Search documentation
3. Ask in GitHub Discussions
4. Join Discord community
5. Contact maintainers directly

Thank you for contributing to DevMemory! 🚀