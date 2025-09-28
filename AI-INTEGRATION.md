# AI Tools Integration Guide

## Overview
This project is now configured with Claude Code and Gemini CLI for enhanced development workflow.

## Available Commands

### Analysis Commands
```bash
# Run comprehensive project analysis
npm run ai:analyze

# Manual Gemini CLI analysis
gemini analyze --full-context .
```

### Code Generation Commands
```bash
# Start Claude Code session
npm run ai:generate

# Manual Claude Code usage
claude start
```

### Setup Commands
```bash
# Re-run setup
npm run ai:setup
```

## File Protection
The following files are protected and should never be deleted:
- claude.md
- gemini.md
- setup-ai-tools.js
- scripts/analyze.js
- scripts/generate.js

## Integration with Cursor
1. Install the Claude Code extension in Cursor
2. Configure Gemini CLI for analysis
3. Use the provided scripts for enhanced workflow
4. Leverage the 1M context window for comprehensive analysis

## Best Practices
- Use Gemini CLI for large-scale analysis and planning
- Use Claude Code for code generation and implementation
- Maintain conversation history for context
- Use visual context for UI/UX analysis
- Leverage the full context window for comprehensive understanding

## Troubleshooting
- Ensure both CLI tools are installed and accessible
- Check authentication credentials
- Verify VS Code/Cursor extension installation
- Use the setup script to reconfigure if needed
