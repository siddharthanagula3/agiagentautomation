import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Checking GitHub Repository Status...\n');

async function checkDeployment() {
  try {
    // Check git status
    console.log('📊 Git Status:');
    const { stdout: gitStatus } = await execAsync('git status --porcelain');
    if (gitStatus.trim()) {
      console.log('⚠️  Uncommitted changes:', gitStatus);
    } else {
      console.log('✅ Working tree clean');
    }

    // Check current branch
    const { stdout: currentBranch } = await execAsync('git branch --show-current');
    console.log(`📍 Current branch: ${currentBranch.trim()}`);

    // Check last commit
    const { stdout: lastCommit } = await execAsync('git log -1 --oneline');
    console.log(`📝 Last commit: ${lastCommit.trim()}`);

    // Check remote status
    console.log('\n🌐 Remote Status:');
    const { stdout: remoteStatus } = await execAsync('git remote -v');
    console.log(remoteStatus);

    // Check if we're ahead/behind
    try {
      const { stdout: aheadBehind } = await execAsync('git status -sb');
      console.log('📈 Branch status:', aheadBehind.trim());
    } catch (error) {
      console.log('📈 Branch status: Up to date');
    }

    console.log('\n✅ Repository Status Summary:');
    console.log('🔗 GitHub Repository: https://github.com/siddharthanagula3/agiagentautomation');
    console.log('🚀 CI/CD Pipeline: .github/workflows/simple-deploy.yml');
    console.log('🌐 Netlify Deployment: Should trigger automatically');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Check GitHub Actions tab for deployment status');
    console.log('2. Verify Netlify deployment');
    console.log('3. Test the live site login functionality');
    console.log('4. Ensure environment variables are set in Netlify');

  } catch (error) {
    console.error('❌ Error checking deployment:', error.message);
  }
}

checkDeployment();
