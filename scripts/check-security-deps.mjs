import { execSync } from 'child_process'

console.log('--- STARTING SECURITY DEPENDENCY AUDIT ---')
try {
  console.log('Running npm audit...')
  const output = execSync('npm audit --json', { encoding: 'utf8' })
  const result = JSON.parse(output)
  const vulnerabilities = result.metadata?.vulnerabilities || {}
  const total = (vulnerabilities.info || 0) + (vulnerabilities.low || 0) + (vulnerabilities.moderate || 0) + (vulnerabilities.high || 0) + (vulnerabilities.critical || 0)
  
  console.log('Audit Summary:')
  console.log(`- Info: ${vulnerabilities.info || 0}`)
  console.log(`- Low: ${vulnerabilities.low || 0}`)
  console.log(`- Moderate: ${vulnerabilities.moderate || 0}`)
  console.log(`- High: ${vulnerabilities.high || 0}`)
  console.log(`- Critical: ${vulnerabilities.critical || 0}`)

  if (total > 0) {
    if ((vulnerabilities.high || 0) > 0 || (vulnerabilities.critical || 0) > 0) {
      console.error('CRITICAL ERROR: High/Critical security vulnerabilities found in dependencies!')
      process.exit(1)
    } else {
      console.log('Vulnerability check passed (only low/moderate/info advisories present).')
    }
  } else {
    console.log('Success: No vulnerabilities found in dependencies.')
  }
} catch (err) {
  // npm audit exits with 1 if vulnerabilities are found
  if (err.stdout) {
    try {
      const result = JSON.parse(err.stdout)
      const vulnerabilities = result.metadata?.vulnerabilities || {}
      console.log('Audit Summary (from non-zero exit):')
      console.log(`- Info: ${vulnerabilities.info || 0}`)
      console.log(`- Low: ${vulnerabilities.low || 0}`)
      console.log(`- Moderate: ${vulnerabilities.moderate || 0}`)
      console.log(`- High: ${vulnerabilities.high || 0}`)
      console.log(`- Critical: ${vulnerabilities.critical || 0}`)

      if ((vulnerabilities.high || 0) > 0 || (vulnerabilities.critical || 0) > 0) {
        console.error('CRITICAL ERROR: High/Critical security vulnerabilities found in dependencies!')
        process.exit(1)
      } else {
        console.log('Vulnerability check passed (only low/moderate/info advisories present).')
      }
    } catch {
      console.error('Failed to parse npm audit output JSON:', err.message)
      process.exit(1)
    }
  } else {
    console.error('Failed to execute npm audit:', err.message)
    process.exit(1)
  }
}
console.log('--- SECURITY DEPENDENCY AUDIT COMPLETED ---')
