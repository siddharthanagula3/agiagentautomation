# Agent SDK Deployment Plan

## Overview

This document outlines the deployment plan for the Agent SDK ChatUI integration, including rollout strategy, monitoring, and rollback procedures.

## Deployment Strategy

### Phase 1: Staging Deployment (Week 1)
- Deploy to staging environment
- Run comprehensive E2E tests
- Performance testing with simulated load
- Security audit of web content fetching
- User acceptance testing with internal team

### Phase 2: Feature Flag Rollout (Week 2)
- Deploy to production with feature flag disabled
- Enable for 5% of users
- Monitor error rates and performance metrics
- Gradually increase to 25%, 50%, 100%

### Phase 3: Full Rollout (Week 3)
- Remove feature flag
- Monitor for 48 hours
- Document lessons learned

## Pre-Deployment Checklist

### Code Quality
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance benchmarks met

### Infrastructure
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] API keys rotated and secured
- [ ] Monitoring and alerting configured
- [ ] Backup procedures verified

### Documentation
- [ ] API documentation updated
- [ ] User guide created
- [ ] Troubleshooting guide written
- [ ] Runbook documented

## Deployment Commands

### 1. Database Migrations
```bash
# Connect to Supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Verify migrations
supabase db diff
```

### 2. Environment Variables
```bash
# Set in Netlify dashboard or via CLI
netlify env:set OPENAI_API_KEY "your-key-here"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-key-here"
netlify env:set AGENT_SDK_WEBHOOK_SECRET "your-secret-here"
```

### 3. Deploy to Staging
```bash
# Build and deploy
npm run build
netlify deploy --dir=dist --site=staging-site-id
```

### 4. Deploy to Production
```bash
# Build and deploy
npm run build
netlify deploy --dir=dist --site=production-site-id --prod
```

## Feature Flag Configuration

### Environment Variables
```env
# Feature flag for Agent SDK
FEATURE_AGENT_SDK=true
FEATURE_AGENT_SDK_PERCENTAGE=100
FEATURE_AGENT_SDK_USER_IDS=user1,user2,user3
```

### Implementation
```typescript
// Feature flag check
const isAgentSDKEnabled = (userId: string): boolean => {
  const featureEnabled = process.env.FEATURE_AGENT_SDK === 'true';
  const percentage = parseInt(process.env.FEATURE_AGENT_SDK_PERCENTAGE || '0');
  const allowedUsers = process.env.FEATURE_AGENT_SDK_USER_IDS?.split(',') || [];
  
  // Check if user is in allowed list
  if (allowedUsers.includes(userId)) {
    return true;
  }
  
  // Check percentage rollout
  if (featureEnabled && percentage > 0) {
    const userHash = hashUserId(userId);
    return userHash % 100 < percentage;
  }
  
  return false;
};
```

## Monitoring and Alerting

### Key Metrics
- **Response Time**: < 2 seconds for 95th percentile
- **Error Rate**: < 1% for all endpoints
- **Tool Execution Success**: > 95%
- **Web Fetch Success**: > 90%
- **Database Connection**: 100% uptime

### Alerts
- High error rate (> 5%)
- Slow response times (> 5 seconds)
- Database connection failures
- OpenAI API rate limit exceeded
- Web fetch failures

### Monitoring Setup
```typescript
// Example monitoring code
const monitorAgentSDK = {
  trackMessage: (sessionId: string, userId: string, success: boolean) => {
    // Send to analytics service
    analytics.track('agent_sdk_message', {
      sessionId,
      userId,
      success,
      timestamp: new Date().toISOString()
    });
  },
  
  trackToolExecution: (toolName: string, success: boolean, duration: number) => {
    analytics.track('agent_sdk_tool_execution', {
      toolName,
      success,
      duration,
      timestamp: new Date().toISOString()
    });
  },
  
  trackWebFetch: (url: string, success: boolean, robotsAllowed: boolean) => {
    analytics.track('agent_sdk_web_fetch', {
      url: url.replace(/\/\/.*@/, '//***@'), // Sanitize URL
      success,
      robotsAllowed,
      timestamp: new Date().toISOString()
    });
  }
};
```

## Rollback Procedures

### Automatic Rollback Triggers
- Error rate > 10% for 5 minutes
- Response time > 10 seconds for 5 minutes
- Database connection failures
- Critical security issues

### Manual Rollback Steps

#### 1. Immediate Rollback (Feature Flag)
```bash
# Disable feature flag
netlify env:set FEATURE_AGENT_SDK "false"
```

#### 2. Code Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Redeploy
npm run build
netlify deploy --dir=dist --prod
```

#### 3. Database Rollback
```bash
# Rollback migrations (if needed)
supabase db reset --db-url YOUR_DB_URL
```

### Rollback Checklist
- [ ] Feature flag disabled
- [ ] Previous version deployed
- [ ] Database state verified
- [ ] Monitoring shows normal metrics
- [ ] Users notified of rollback
- [ ] Post-mortem scheduled

## Testing Procedures

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Load Testing
```bash
# Using Artillery
artillery run load-test-config.yml

# Using k6
k6 run load-test.js
```

### Security Testing
```bash
# OWASP ZAP scan
zap-baseline.py -t https://your-staging-site.com

# Dependency audit
npm audit
```

## Post-Deployment Verification

### Functional Testing
- [ ] Agent SDK ChatUI loads correctly
- [ ] Messages send and receive properly
- [ ] Tool execution works
- [ ] Web content fetching works
- [ ] Database persistence works
- [ ] Error handling works

### Performance Testing
- [ ] Response times within limits
- [ ] Memory usage stable
- [ ] Database queries optimized
- [ ] API rate limits respected

### Security Testing
- [ ] No sensitive data exposed
- [ ] Web content sanitized
- [ ] Robots.txt respected
- [ ] Rate limiting working
- [ ] Authentication enforced

## Communication Plan

### Internal Team
- Slack notification on deployment start
- Status updates every 30 minutes
- Final success/failure notification

### Users
- In-app notification for new features
- Email notification for major updates
- Documentation updates

### Stakeholders
- Weekly status reports during rollout
- Final deployment report
- Performance metrics summary

## Risk Mitigation

### High-Risk Areas
1. **OpenAI API Rate Limits**
   - Mitigation: Implement exponential backoff
   - Monitoring: Track API usage and errors

2. **Web Content Fetching**
   - Mitigation: Respect robots.txt, rate limiting
   - Monitoring: Track fetch success rates

3. **Database Performance**
   - Mitigation: Optimize queries, add indexes
   - Monitoring: Track query performance

4. **Security Vulnerabilities**
   - Mitigation: Input sanitization, access controls
   - Monitoring: Security scanning, audit logs

### Contingency Plans
- **API Outage**: Fallback to cached responses
- **Database Issues**: Read-only mode, cached data
- **High Load**: Auto-scaling, rate limiting
- **Security Breach**: Immediate rollback, investigation

## Success Criteria

### Technical Metrics
- [ ] 99.9% uptime
- [ ] < 2 second response time
- [ ] < 1% error rate
- [ ] 100% test coverage for critical paths

### Business Metrics
- [ ] User adoption > 80%
- [ ] User satisfaction > 4.5/5
- [ ] Support tickets < 5% increase
- [ ] Feature usage > 60%

### Security Metrics
- [ ] Zero security incidents
- [ ] 100% robots.txt compliance
- [ ] No sensitive data exposure
- [ ] All security tests passing

## Post-Deployment Activities

### Week 1
- Monitor metrics closely
- Address any issues
- Collect user feedback
- Document lessons learned

### Week 2
- Performance optimization
- Feature enhancements
- User training materials
- Documentation updates

### Week 3
- Full rollout completion
- Final performance review
- Success metrics analysis
- Next phase planning

## Contact Information

### Deployment Team
- **Lead Developer**: [Name] - [Email]
- **DevOps Engineer**: [Name] - [Email]
- **QA Engineer**: [Name] - [Email]
- **Product Manager**: [Name] - [Email]

### Escalation Contacts
- **Engineering Manager**: [Name] - [Phone]
- **CTO**: [Name] - [Phone]
- **On-call Engineer**: [Phone]

## Appendix

### A. Environment Variables Reference
```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key

# Optional
AGENT_SDK_WEBHOOK_SECRET=your-webhook-secret
FEATURE_AGENT_SDK=true
FEATURE_AGENT_SDK_PERCENTAGE=100
```

### B. Database Schema
```sql
-- Agent Sessions
CREATE TABLE agent_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  config JSONB NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Analytics
CREATE TABLE agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  employee_id TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web Fetch Logs
CREATE TABLE web_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  content_length INTEGER,
  word_count INTEGER,
  language TEXT,
  title TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### C. API Endpoints
- `POST /.netlify/functions/agent-session` - Create/retrieve agent session
- `POST /.netlify/functions/agent-send` - Send message to agent
- `POST /.netlify/functions/fetch-page` - Fetch web content
- `POST /.netlify/functions/agent-sdk-webhook` - Handle webhook events

### D. Monitoring Dashboard
- **Grafana Dashboard**: [URL]
- **Logs**: [URL]
- **Metrics**: [URL]
- **Alerts**: [URL]
