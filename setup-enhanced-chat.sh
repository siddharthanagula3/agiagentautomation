#!/bin/bash

# Enhanced Chat Setup Script
# Automates the installation and configuration of the enhanced chat interface

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   AGI Agent Automation - Enhanced Chat Setup         ║"
echo "║   Installing dependencies and configuring features    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install required dependencies
echo "📦 Installing required dependencies..."
echo ""

npm install react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter

npm install dompurify
npm install --save-dev @types/dompurify

echo ""
echo "✅ Core dependencies installed"
echo ""

# Optional dependencies
echo "📦 Installing optional dependencies..."
echo ""

# Ask user if they want optional features
read -p "Install Mermaid diagram support? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install mermaid
    npm install --save-dev @types/mermaid
    echo "✅ Mermaid installed"
fi

read -p "Install Marked (enhanced Markdown parser)? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install marked
    npm install --save-dev @types/marked
    echo "✅ Marked installed"
fi

read -p "Install Chart.js (data visualization)? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install chart.js react-chartjs-2
    echo "✅ Chart.js installed"
fi

echo ""
echo "✅ All dependencies installed successfully!"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "❌ No .env.example file found. Please create .env manually."
    fi
else
    echo "✅ .env file exists"
fi

echo ""

# Check if required environment variables are set
echo "🔍 Checking environment variables..."
echo ""

if grep -q "VITE_OPENAI_API_KEY=sk-" .env 2>/dev/null; then
    echo "✅ OpenAI API key configured"
else
    echo "⚠️  OpenAI API key not configured (add VITE_OPENAI_API_KEY to .env)"
fi

if grep -q "VITE_ANTHROPIC_API_KEY=sk-" .env 2>/dev/null; then
    echo "✅ Anthropic API key configured"
else
    echo "⚠️  Anthropic API key not configured (add VITE_ANTHROPIC_API_KEY to .env)"
fi

if grep -q "VITE_GOOGLE_API_KEY=AIza" .env 2>/dev/null; then
    echo "✅ Google API key configured"
else
    echo "⚠️  Google API key not configured (add VITE_GOOGLE_API_KEY to .env)"
fi

if grep -q "VITE_PERPLEXITY_API_KEY=pplx-" .env 2>/dev/null; then
    echo "✅ Perplexity API key configured"
else
    echo "⚠️  Perplexity API key not configured (add VITE_PERPLEXITY_API_KEY to .env)"
fi

echo ""

# Run type check
echo "🔍 Running TypeScript type check..."
echo ""

if npm run type-check; then
    echo ""
    echo "✅ No TypeScript errors"
else
    echo ""
    echo "⚠️  TypeScript errors found. Please fix before deploying."
fi

echo ""

# Build the project
echo "🏗️  Building project..."
echo ""

if npm run build; then
    echo ""
    echo "✅ Build successful!"
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              🎉 Setup Complete! 🎉                    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure API keys in .env file:"
echo "   - VITE_OPENAI_API_KEY"
echo "   - VITE_ANTHROPIC_API_KEY"
echo "   - VITE_GOOGLE_API_KEY"
echo "   - VITE_PERPLEXITY_API_KEY"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:5173/chat"
echo ""
echo "4. Test enhanced features:"
echo "   - Streaming responses"
echo "   - Tool execution"
echo "   - Artifact creation"
echo "   - Web search"
echo ""
echo "📚 Documentation:"
echo "   - CHAT_ENHANCEMENT_COMPLETE.md"
echo "   - QUICK_START_ENHANCED_CHAT.md"
echo ""
echo "Happy coding! 🚀"
echo ""
