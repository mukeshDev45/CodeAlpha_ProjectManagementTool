// ProjectFlow Master Quality Assurance Test Runner
const { execSync } = require('child_process');

const suites = [
  { name: 'SaaS Platform 12-Feature Verification', file: 'saas-platform-verification.js' },
  { name: 'Core Functionality & Identity Audit v2', file: 'comprehensive-audit-v2.js' },
  { name: 'Profile, Navigation & Kanban Audit', file: 'profile-and-features-audit.js' },
  { name: 'Full-Stack Integration Suite', file: 'test-suite.js' },
  { name: 'Deep Security & RBAC Verification', file: 'deep-verification.js' },
  { name: 'Advanced Sockets & CSV Export Audit', file: 'advanced-verification.js' },
  { name: 'QA Master Audit', file: 'qa-master-audit.js' },
];

console.log('========================================================================');
console.log('      PROJECTFLOW FINAL MASTER QUALITY ASSURANCE TEST SUITE            ');
console.log('========================================================================\n');

let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;

for (const suite of suites) {
  totalSuites++;
  process.stdout.write(`Executing Suite [${totalSuites}/${suites.length}]: ${suite.name} ... `);
  try {
    const output = execSync(`node ${suite.file}`, {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Count [PASS] or [PASS]:
    const passMatches = output.match(/\[PASS\]/gi) || [];
    console.log(`PASSED (${passMatches.length} tests passed)`);
    passedSuites++;
  } catch (err) {
    console.log(`FAILED!`);
    console.error(err.stdout || err.stderr || err.message);
    failedSuites++;
  }
}

console.log('\n========================================================================');
console.log(` SUMMARY: ${passedSuites} / ${totalSuites} Suites Passed (${failedSuites} Failed)`);
console.log('========================================================================');

if (failedSuites === 0) {
  console.log('\n🏆 ALL TEST SUITES PASSED WITH 100% SUCCESS RATE. ZERO FAILURES!');
  process.exit(0);
} else {
  console.error(`\n❌ ${failedSuites} SUITE(S) FAILED!`);
  process.exit(1);
}
