// src/shared/utils/env-validation.ts
// Environment variable validation utility

interface EnvConfig {
  name: string;
  required: boolean;
  description: string;
  isSecret?: boolean; // Should not be logged
}

const ENV_VARIABLES: EnvConfig[] = [
  // ===== CRITICAL REQUIRED VARIABLES =====
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key (client-side)',
  },
  {
    name: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key (client-side)',
  },

  // ===== OPTIONAL BUT RECOMMENDED =====
  {
    name: 'VITE_OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for GPT models',
    isSecret: true,
  },
  {
    name: 'VITE_ANTHROPIC_API_KEY',
    required: false,
    description: 'Anthropic API key for Claude models',
    isSecret: true,
  },
  {
    name: 'VITE_GOOGLE_API_KEY',
    required: false,
    description: 'Google API key for Gemini models',
    isSecret: true,
  },
  {
    name: 'VITE_PERPLEXITY_API_KEY',
    required: false,
    description: 'Perplexity API key',
    isSecret: true,
  },

  // ===== OPTIONAL FEATURES =====
  {
    name: 'VITE_APP_ENV',
    required: false,
    description: 'Application environment (development/staging/production)',
  },
  {
    name: 'VITE_ENABLE_ANALYTICS',
    required: false,
    description: 'Enable analytics tracking',
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingOptional: string[];
}

/**
 * Validates all environment variables
 * @returns Validation result with errors and warnings
 */
export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const config of ENV_VARIABLES) {
    const value = import.meta.env[config.name];

    if (!value || value.trim() === '') {
      if (config.required) {
        missingRequired.push(config.name);
        errors.push(
          `❌ REQUIRED: ${config.name} - ${config.description}`
        );
      } else {
        missingOptional.push(config.name);
        warnings.push(
          `⚠️  OPTIONAL: ${config.name} - ${config.description}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    missingOptional,
  };
}

/**
 * Validates and logs results (call on app startup)
 * @param throwOnError - If true, throws error when validation fails
 */
export function validateAndLogEnvironment(throwOnError = true): void {
  const result = validateEnvironmentVariables();

  // Always log environment status
  console.log('🔍 Environment Variable Validation');
  console.log('═'.repeat(50));

  if (result.valid) {
    console.log('✅ All required environment variables are set!');
  } else {
    console.error('❌ Environment validation FAILED!');
    console.error('\nMissing Required Variables:');
    result.errors.forEach((err) => console.error(`  ${err}`));
  }

  // Log warnings for optional variables
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Missing Optional Variables:');
    result.warnings.forEach((warn) => console.warn(`  ${warn}`));
    console.warn('\nNote: Some features may be unavailable without these.');
  }

  // Check for at least one AI provider
  const hasAIProvider =
    import.meta.env.VITE_OPENAI_API_KEY ||
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    import.meta.env.VITE_GOOGLE_API_KEY ||
    import.meta.env.VITE_PERPLEXITY_API_KEY;

  if (!hasAIProvider) {
    console.warn(
      '\n⚠️  WARNING: No AI provider API keys configured!'
    );
    console.warn(
      '   Chat functionality will require at least one provider.'
    );
  }

  console.log('═'.repeat(50));

  // Log helpful setup instructions
  if (!result.valid) {
    console.error('\n📖 Setup Instructions:');
    console.error('1. Copy .env.example to .env');
    console.error('2. Fill in the required values');
    console.error('3. Restart the development server');
    console.error('\nSee .env.example for more details.');
  }

  // Throw error if validation failed and throwOnError is true
  if (!result.valid && throwOnError) {
    throw new Error(
      `Environment validation failed. Missing required variables: ${result.missingRequired.join(', ')}`
    );
  }
}

/**
 * Gets a required environment variable or throws an error
 * @param key - Environment variable key
 * @returns The environment variable value
 */
export function getRequiredEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `Required environment variable ${key} is not set. Please check your .env file.`
    );
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns The environment variable value or default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  const value = import.meta.env[key];
  return value && value.trim() !== '' ? value : defaultValue;
}

/**
 * Checks if we're running in production
 */
export function isProduction(): boolean {
  return (
    import.meta.env.MODE === 'production' ||
    import.meta.env.VITE_APP_ENV === 'production'
  );
}

/**
 * Checks if we're running in development
 */
export function isDevelopment(): boolean {
  return (
    import.meta.env.MODE === 'development' ||
    import.meta.env.VITE_APP_ENV === 'development' ||
    import.meta.env.DEV === true
  );
}

/**
 * Gets the current environment name
 */
export function getEnvironment(): 'development' | 'staging' | 'production' {
  const env = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
}

/**
 * Safely logs environment configuration (hides secrets)
 */
export function logEnvironmentConfig(): void {
  console.log('🔧 Environment Configuration:');
  console.log(`   Environment: ${getEnvironment()}`);
  console.log(`   Mode: ${import.meta.env.MODE}`);
  console.log(`   Dev: ${isDevelopment()}`);
  console.log(`   Prod: ${isProduction()}`);

  // Log which providers are configured (without exposing keys)
  const providers = {
    OpenAI: !!import.meta.env.VITE_OPENAI_API_KEY,
    Anthropic: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
    Google: !!import.meta.env.VITE_GOOGLE_API_KEY,
    Perplexity: !!import.meta.env.VITE_PERPLEXITY_API_KEY,
  };

  console.log('   AI Providers:');
  Object.entries(providers).forEach(([name, configured]) => {
    console.log(`     ${name}: ${configured ? '✅' : '❌'}`);
  });
}
