const { execSync } = require('child_process');
const path = require('path');

// Run the TypeScript analysis script
try {
  execSync('npx ts-node scripts/analyze-excel.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (error) {
  console.error('Error running analysis:', error.message);
  process.exit(1);
}

