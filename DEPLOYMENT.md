# AGI Agent Automation - Deployment Guide

This document provides comprehensive instructions for deploying the AGI Agent Automation platform across different environments.

## 📋 Prerequisites

Before deploying, ensure you have the following installed:

- **Node.js** 18 or higher
- **npm** 8 or higher
- **Git** for version control
- **Docker** (optional, for containerized deployments)
- **Vercel CLI** (optional, for Vercel deployments)

## 🚀 Quick Start

### Development Deployment

```bash
# Clone the repository
git clone <repository-url>
cd agi-agent-automation

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Production Deployment

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 🛠️ Deployment Methods

### 1. Automated Deployment Script

Use our automated deployment script for streamlined deployments:

```bash
# Deploy to development
./scripts/deploy.sh development

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production

# Build only (skip deployment)
./scripts/deploy.sh --build-only production

# Skip tests
./scripts/deploy.sh --skip-tests production
```

### 2. Vercel Deployment

#### Prerequisites
- Vercel account
- Vercel CLI installed: `npm install -g vercel`

#### Setup
1. Login to Vercel: `vercel login`
2. Configure project: `vercel`
3. Deploy: `vercel --prod`

#### Environment Variables
Set the following in your Vercel dashboard:
- `VITE_API_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN` (optional)

### 3. Docker Deployment

#### Build and Run Locally
```bash
# Build Docker image
docker build -t agi-automation .

# Run container
docker run -d -p 3000:80 agi-automation
```

#### Docker Compose
```bash
# Development environment
docker-compose --profile dev up

# Production environment
docker-compose --profile production up -d

# With backend services
docker-compose --profile backend --profile production up -d
```

### 4. Manual Deployment

#### Build Process
```bash
# Install dependencies
npm ci --only=production

# Run linting
npm run lint

# Run tests
npm run test:run

# Build application
NODE_ENV=production npm run build
```

#### Static File Hosting
After building, deploy the `dist/` folder to your preferred static hosting service:
- **Netlify**: Drag and drop `dist/` folder
- **AWS S3**: Upload to S3 bucket with static website hosting
- **GitHub Pages**: Use GitHub Actions workflow

## 🔧 Environment Configuration

### Environment Files

Create environment files for different deployment targets:

```bash
# .env.local (development)
VITE_API_URL=http://localhost:8000
VITE_DEBUG_MODE=true

# .env.staging (staging)
VITE_API_URL=https://api-staging.agiautomation.com
VITE_DEBUG_MODE=false

# .env.production (production)
VITE_API_URL=https://api.agiautomation.com
VITE_DEBUG_MODE=false
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Yes |
| `VITE_WS_URL` | WebSocket server URL | Yes |
| `VITE_SENTRY_DSN` | Error tracking | No |
| `VITE_GOOGLE_ANALYTICS_ID` | Analytics tracking | No |

## 🚢 CI/CD Pipeline

### GitHub Actions

Our CI/CD pipeline automatically:
1. **Code Quality**: Runs linting and type checking
2. **Security**: Performs vulnerability scanning
3. **Testing**: Executes unit and integration tests
4. **Build**: Creates optimized production builds
5. **Deploy**: Deploys to staging/production environments
6. **Monitor**: Runs performance and accessibility audits

### Pipeline Triggers
- **Push to `main`**: Deploys to production
- **Push to `develop`**: Deploys to staging
- **Pull Requests**: Runs tests and security checks

### Required Secrets

Set these secrets in your GitHub repository:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `SENTRY_DSN` | Error tracking DSN |
| `CODECOV_TOKEN` | Code coverage reporting |

## 📊 Monitoring and Health Checks

### Health Endpoints

- `/health` - Basic health check
- `/api/health` - API health check (if backend is deployed)

### Performance Monitoring

1. **Lighthouse CI**: Automated performance audits
2. **Sentry**: Error tracking and performance monitoring
3. **Vercel Analytics**: Built-in performance metrics

### Log Monitoring

Production logs are available through:
- Vercel Dashboard (for Vercel deployments)
- Docker logs (for containerized deployments)
- Application monitoring tools (Sentry, DataDog, etc.)

## 🔒 Security Considerations

### Build Security
- Dependencies are audited during build
- Security headers are configured
- CSP (Content Security Policy) is enforced
- HTTPS is required in production

### Environment Security
- Sensitive data is stored in environment variables
- API keys are masked in logs
- CORS is configured for known domains

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Environment Variables Not Loading
- Ensure `.env` files are in the project root
- Check variable names start with `VITE_`
- Restart development server after changes

### Debugging

#### Development Mode
```bash
# Enable debug logging
VITE_DEBUG_MODE=true npm run dev

# Run with verbose output
npm run dev -- --debug
```

#### Production Issues
1. Check browser console for errors
2. Verify all environment variables are set
3. Test API connectivity
4. Check network requests in DevTools

## 📈 Performance Optimization

### Build Optimization
- Code splitting is automatically configured
- Assets are compressed and cached
- Bundle analysis is available with build

### Runtime Optimization
- Service worker for offline support (if enabled)
- Image optimization and lazy loading
- Component lazy loading for large components

### Monitoring Performance
```bash
# Analyze bundle size
npm run build -- --analyze

# Run Lighthouse audit
npm run lighthouse
```

## 🆕 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Performance benchmarks met
- [ ] Accessibility requirements satisfied
- [ ] Error tracking configured
- [ ] Monitoring alerts set up
- [ ] Backup and rollback plan ready

## 🔄 Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Docker Rollback
```bash
# List running containers
docker ps

# Stop current container
docker stop agi-automation

# Start previous version
docker run -d --name agi-automation agi-automation:previous-tag
```

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check application logs
4. Contact the development team

## 🔗 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build:dev       # Build development version
npm run preview         # Preview production build

# Testing
npm run test           # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Generate coverage report

# Quality
npm run lint           # Lint code
npm run type-check     # TypeScript checking

# Deployment
./scripts/deploy.sh    # Run deployment script
vercel                 # Deploy to Vercel
docker build .         # Build Docker image
```