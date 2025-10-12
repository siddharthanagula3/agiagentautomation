# AGI Agent Automation Platform

A comprehensive AI workforce management platform that enables you to hire, manage, and coordinate AI employees for various business tasks and automations.

## 🚀 Features

### Core Platform Features

- **AI Workforce Management**: Hire and manage AI employees with different specializations
- **Multi-Tab Chat Interface**: Communicate with individual AI employees or teams
- **Visual Workflow Designer**: Create complex automation workflows with a drag-and-drop interface
- **Integration Hub**: Connect external tools and services (OpenAI, Slack, n8n, etc.)
- **Real-time Analytics**: Monitor performance, costs, and utilization
- **Autonomous Workflows**: Set up AI-driven automation that runs independently

## 🏗️ Architecture

### Frontend Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + **Shadcn UI** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Zustand** for state management

### Backend & Services

- **Supabase** for database, authentication, and real-time features
- **Netlify Functions** for serverless API endpoints
- **Stripe** for payment processing
- **Multiple LLM Providers** (OpenAI, Anthropic, Google, Perplexity)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd agiagentautomation
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Copy the environment template
   cp src/env.example .env

   # ⚠️  SECURITY WARNING: Never commit your .env file to version control!
   # Fill in your actual API keys and configuration values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔐 Environment Variables

### ⚠️ CRITICAL SECURITY WARNING

**NEVER commit your `.env` file to version control!** This file contains sensitive API keys and secrets.

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Keys - Get these from your provider dashboards
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Getting API Keys

1. **Supabase**: Create a project at [supabase.com](https://supabase.com)
2. **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com)
3. **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com)
4. **Google AI**: Get API key from [makersuite.google.com](https://makersuite.google.com)
5. **Perplexity**: Get API key from [perplexity.ai](https://perplexity.ai)
6. **Stripe**: Get publishable key from [dashboard.stripe.com](https://dashboard.stripe.com)

## 🏠 Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker (for Supabase local development)
- Git

### Complete Local Development Environment

#### 1. Supabase Local Development

```bash
# Start Supabase local instance
supabase start

# This will start:
# - API: http://localhost:54321
# - Database: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio: http://localhost:54323
# - Mailpit: http://localhost:54324
```

#### 2. Netlify Functions Local Development

```bash
# Start Netlify functions locally
netlify dev

# This will start functions on: http://localhost:8888
```

#### 3. Stripe CLI Setup

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
# Forward webhooks to local development
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

#### 4. Environment Configuration for Local Development

Create a `.env` file with these values for local development:

```env
# Supabase Configuration (Local)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Stripe Configuration (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RxgnG21oG095Q15c8WuKzv4x9Qn5t6bGPIctx5hGD1UrOe5t0aR4lj0qn7JRJdrvt2LKUUpBp2LLIKMldegwbxh004Oft02rx

# API Configuration (Local)
VITE_API_URL=http://localhost:8888
VITE_WS_URL=ws://localhost:8888
VITE_NETLIFY_FUNCTIONS_URL=http://localhost:8888

# Development Settings
NODE_ENV=development
VITE_DEMO_MODE=true
VITE_DEBUG=true

# API Keys (Optional for demo mode)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

#### 5. Start Development Server

```bash
npm run dev
```

#### 6. Access the Application

- **Frontend**: http://localhost:8080
- **Supabase Studio**: http://localhost:54323
- **Netlify Functions**: http://localhost:8888
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

### Testing the Integration

#### Test Supabase Edge Functions

```bash
# Test blog posts function
curl -X GET "http://localhost:54321/functions/v1/blog-posts"

# Test contact form function
curl -X POST "http://localhost:54321/functions/v1/contact-form" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","message":"Test message"}'
```

#### Test Netlify Functions

```bash
# Test Stripe subscription creation
curl -X POST "https://agiagentautomation.com/.netlify/functions/create-pro-subscription" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","userEmail":"test@example.com"}'
```

#### Test Stripe Integration

```bash
# List webhook endpoints
stripe webhook_endpoints list

# Test webhook forwarding
stripe trigger checkout.session.completed
```

## 🚀 Deployment

### Netlify (Recommended)

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify dashboard
3. **Deploy** - Netlify will automatically build and deploy

### Build Commands

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Preview production build
npm run preview
```

## 🧪 Testing

The application includes comprehensive TestSprite integration for automated testing:

```bash
# Run TestSprite tests
npm run test:testsprite
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── layouts/            # Layout components
├── services/           # Business logic services
├── stores/             # State management (Zustand)
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Production build with optimizations
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Quality

- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting
- **Husky** for git hooks

## 🗄️ Local Development with Supabase

### Prerequisites

1. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

### Setting Up Local Supabase

1. **Initialize Supabase in your project**

   ```bash
   supabase init
   ```

2. **Start local Supabase services**

   ```bash
   supabase start
   ```

   This will start:
   - PostgreSQL database
   - Supabase Studio (web interface)
   - Edge Functions runtime
   - Auth service
   - Storage service

3. **Apply database migrations**

   ```bash
   supabase db reset
   ```

4. **Generate TypeScript types**
   ```bash
   supabase gen types typescript --local > src/types/supabase.ts
   ```

### Working with Edge Functions

1. **Serve Edge Functions locally**

   ```bash
   supabase functions serve
   ```

2. **Deploy Edge Functions**

   ```bash
   supabase functions deploy
   ```

3. **Test Edge Functions**
   ```bash
   # Test a specific function
   curl -X POST 'http://localhost:54321/functions/v1/your-function-name' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"key": "value"}'
   ```

### Database Management

1. **Create a new migration**

   ```bash
   supabase migration new your_migration_name
   ```

2. **Reset database to clean state**

   ```bash
   supabase db reset
   ```

3. **View database in Supabase Studio**
   - Open http://localhost:54323 in your browser
   - Navigate to the Table Editor to view/edit data
   - Use the SQL Editor to run queries

4. **Audit Row Level Security (RLS) policies**

   ```bash
   # Windows
   supabase/scripts/run-rls-audit.bat

   # Linux/macOS
   ./supabase/scripts/run-rls-audit.sh
   ```

5. **Test Supabase Edge Functions**

   ```bash
   # Windows
   supabase/scripts/run-edge-function-tests.bat

   # Linux/macOS
   cd supabase/scripts && npm install && node test-edge-functions.js
   ```

6. **Analyze Database Performance**

   ```bash
   # Windows
   supabase/scripts/run-db-performance-analysis.bat

   # Linux/macOS
   psql $DB_URL -f supabase/scripts/analyze-db-performance.sql
   ```

### Environment Variables for Local Development

```bash
# Local Supabase (generated by 'supabase start')
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key

# For Edge Functions
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

## 💳 Stripe CLI Integration

### Prerequisites

1. **Install Stripe CLI**
   - **Windows**: Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - **macOS**: `brew install stripe/stripe-cli/stripe`
   - **Linux**: Follow instructions at [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

2. **Login to Stripe**
   ```bash
   stripe login
   ```

### Setting Up Webhook Forwarding

1. **Start webhook forwarding**

   ```bash
   stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
   ```

2. **Copy the webhook signing secret**
   - The CLI will display a webhook signing secret
   - Add it to your environment variables:

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

3. **Test webhook events**

   ```bash
   # Trigger a test event
   stripe trigger payment_intent.succeeded

   # Trigger subscription events
   stripe trigger customer.subscription.created
   stripe trigger invoice.payment_succeeded
   ```

### Testing Payment Flows

1. **Use Stripe test cards**

   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   Requires 3D Secure: 4000 0025 0000 3155
   ```

2. **Test subscription creation**

   ```bash
   # Create a test customer
   stripe customers create --email test@example.com

   # Create a test subscription
   stripe subscriptions create --customer cus_test_customer_id --items[0][price]=price_test_price_id
   ```

3. **Monitor webhook events**

   ```bash
   # View recent events
   stripe events list --limit 10

   # View specific event details
   stripe events retrieve evt_event_id
   ```

4. **Test webhook processing**

   ```bash
   # Test subscription lifecycle events
   stripe trigger checkout.session.completed
   stripe trigger invoice.payment_succeeded
   stripe trigger invoice.payment_failed
   stripe trigger customer.subscription.updated
   stripe trigger customer.subscription.deleted

   # Test payment method events
   stripe trigger payment_method.attached
   stripe trigger payment_method.detached

   # Test trial events
   stripe trigger customer.subscription.trial_will_end
   ```

5. **Verify webhook processing**
   - Check your application logs for webhook processing messages
   - Verify database updates in Supabase Studio
   - Ensure idempotency by sending the same event multiple times

### Environment Variables for Stripe

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# For Netlify Functions
STRIPE_WEBHOOK_ENDPOINT_SECRET=whsec_your_webhook_secret
```

## 🔄 Complete Development Workflow

### Daily Development Setup

1. **Start Supabase services**

   ```bash
   supabase start
   ```

2. **Start Stripe webhook forwarding**

   ```bash
   stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Start Netlify Functions locally** (if needed)
   ```bash
   netlify dev
   ```

### Testing the Complete Stack

1. **Test database operations**
   - Use Supabase Studio at http://localhost:54323
   - Verify RLS policies are working
   - Test Edge Functions

2. **Test payment flows**
   - Use Stripe test cards
   - Monitor webhook events in Stripe CLI
   - Verify database updates from webhooks

3. **Test AI integrations**
   - Verify API keys are working
   - Test chat functionality
   - Check AI employee responses

### Troubleshooting

1. **Supabase issues**

   ```bash
   # Check service status
   supabase status

   # Restart services
   supabase stop
   supabase start

   # View logs
   supabase logs
   ```

2. **Stripe webhook issues**

   ```bash
   # Check webhook endpoint
   stripe webhook_endpoints list

   # Test webhook delivery
   stripe events resend evt_event_id
   ```

3. **Database connection issues**
   - Verify environment variables
   - Check Supabase service status
   - Ensure migrations are applied

## 🛡️ Security

### Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor API usage** for unusual activity
5. **Use HTTPS** in production

### Security Features

- **Supabase RLS** (Row Level Security) for data protection
- **JWT-based authentication** with secure token handling
- **Input validation** and sanitization
- **CORS configuration** for API security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the TestSprite test reports

## 🔄 Updates

### Recent Improvements

- ✅ **Unified Authentication** - Single source of truth through AuthService
- ✅ **Production-Ready** - Clean builds with conditional development code
- ✅ **Error Handling** - Comprehensive error recovery and fallback systems
- ✅ **Type Safety** - Proper TypeScript definitions throughout
- ✅ **Security** - Environment variable management and API key protection
- ✅ **Performance** - Optimized builds and code splitting

---

**⚠️ Remember: Keep your API keys secure and never commit them to version control!**
