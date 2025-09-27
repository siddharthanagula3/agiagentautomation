#!/bin/bash

# AGI Agent Automation - Deployment Script
# This script automates the deployment process for different environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
BUILD_ONLY=false
SKIP_TESTS=false
VERBOSE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_help() {
    cat << EOF
AGI Agent Automation Deployment Script

Usage: $0 [OPTIONS] [ENVIRONMENT]

ENVIRONMENTS:
    development    Deploy to development environment (default)
    staging        Deploy to staging environment
    production     Deploy to production environment

OPTIONS:
    -b, --build-only     Only build the application, don't deploy
    -s, --skip-tests     Skip running tests before deployment
    -v, --verbose        Enable verbose output
    -h, --help           Show this help message

EXAMPLES:
    $0                          # Deploy to development
    $0 production               # Deploy to production
    $0 -b staging              # Build for staging without deploying
    $0 --skip-tests production # Deploy to production without running tests

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi

    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "git is not installed."
        exit 1
    fi

    print_success "All prerequisites are met"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    if [ "$VERBOSE" = true ]; then
        npm ci
    else
        npm ci --silent
    fi

    print_success "Dependencies installed"
}

# Function to run linting
run_lint() {
    print_status "Running linting..."

    if npm run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests as requested"
        return
    fi

    print_status "Running tests..."

    if npm run test:run; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Function to build the application
build_app() {
    print_status "Building application for $ENVIRONMENT..."

    # Set environment variables based on deployment target
    export NODE_ENV=$ENVIRONMENT

    case $ENVIRONMENT in
        development)
            if npm run build:dev; then
                print_success "Development build completed"
            else
                print_error "Development build failed"
                exit 1
            fi
            ;;
        staging)
            export VITE_API_URL="${STAGING_API_URL:-https://api-staging.agiautomation.com}"
            if npm run build; then
                print_success "Staging build completed"
            else
                print_error "Staging build failed"
                exit 1
            fi
            ;;
        production)
            export VITE_API_URL="${PRODUCTION_API_URL:-https://api.agiautomation.com}"
            if npm run build; then
                print_success "Production build completed"
            else
                print_error "Production build failed"
                exit 1
            fi
            ;;
    esac
}

# Function to deploy to Vercel
deploy_vercel() {
    if [ "$BUILD_ONLY" = true ]; then
        print_warning "Build-only mode enabled, skipping deployment"
        return
    fi

    print_status "Deploying to Vercel ($ENVIRONMENT)..."

    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi

    case $ENVIRONMENT in
        development)
            vercel --prod=false
            ;;
        staging)
            vercel --prod=false --alias=staging-agi-automation.vercel.app
            ;;
        production)
            vercel --prod
            ;;
    esac

    print_success "Deployment to Vercel completed"
}

# Function to deploy using Docker
deploy_docker() {
    if [ "$BUILD_ONLY" = true ]; then
        print_warning "Build-only mode enabled, skipping deployment"
        return
    fi

    print_status "Building Docker image for $ENVIRONMENT..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed."
        exit 1
    fi

    # Build Docker image
    docker build -t agi-automation:$ENVIRONMENT .

    # Run the container
    case $ENVIRONMENT in
        development)
            docker run -d -p 3000:80 --name agi-automation-dev agi-automation:$ENVIRONMENT
            ;;
        staging)
            docker run -d -p 3001:80 --name agi-automation-staging agi-automation:$ENVIRONMENT
            ;;
        production)
            docker run -d -p 80:80 --name agi-automation-prod agi-automation:$ENVIRONMENT
            ;;
    esac

    print_success "Docker deployment completed"
}

# Function to run post-deployment checks
post_deployment_checks() {
    if [ "$BUILD_ONLY" = true ]; then
        return
    fi

    print_status "Running post-deployment checks..."

    # Add health check logic here
    # Example: curl health endpoint and verify response

    print_success "Post-deployment checks completed"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."

    # Remove temporary files if any
    # Example: rm -rf temp/

    print_success "Cleanup completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        development|staging|production)
            ENVIRONMENT=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "Starting deployment process for $ENVIRONMENT environment"

    # Check prerequisites
    check_prerequisites

    # Install dependencies
    install_dependencies

    # Run linting
    run_lint

    # Run tests
    run_tests

    # Build application
    build_app

    # Deploy (choose deployment method based on preference)
    # deploy_vercel  # Uncomment for Vercel deployment
    # deploy_docker  # Uncomment for Docker deployment

    # Post-deployment checks
    post_deployment_checks

    # Cleanup
    cleanup

    print_success "Deployment process completed successfully!"

    if [ "$BUILD_ONLY" != true ]; then
        print_status "Application is now available at:"
        case $ENVIRONMENT in
            development)
                echo "  Local: http://localhost:3000"
                ;;
            staging)
                echo "  Staging: https://staging-agi-automation.vercel.app"
                ;;
            production)
                echo "  Production: https://agi-automation.vercel.app"
                ;;
        esac
    fi
}

# Run main function
main "$@"