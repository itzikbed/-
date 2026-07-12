#!/usr/bin/env node
/**
 * check-conventions.mjs — mechanical convention gate for "בית לחתול".
 * Runs with zero dependencies: `node scripts/checks/check-conventions.mjs`
 *
 * ⚠ READ-ONLY FOR AGENTS. This file is owned by the project architect.
 * Canonical copy: C:\Users\itzik\.gemini\antigravity\project-docs\scripts\checks\
 * Any modification here is detected by an out-of-repo integrity check and
 * fails the phase. If a rule seems wrong, report it — do not edit it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'public', 'content',
  'prompts', 'skills', 'docs', '.local-emails', 'supabase',
  'dev']) // app/dev = temporary playground, deleted in Phase 5
const violations = []

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) yield* walk(full)
    } else {
      yield full
    }
  }
}

const rel = (f) => relative(ROOT, f).split(sep).join('/')
const flag = (file, line, rule, text) =>
  violations.push({ file: rel(file), line, rule, text: text.trim().slice(0, 90) })

const isCode = (f) => /\.(ts|tsx)$/.test(f) && !/\.d\.ts$/.test(f)
const isCss = (f) => /\.css$/.test(f)
const isGenerated = (f) => /database\.types\.ts$/.test(rel(f))

// filename-level: parallel versions
const PARALLEL = /([-_.](new|old|copy|backup|final|v\d+)|V\d+|Copy)\.(ts|tsx|css)$/i

// line-level rules for .ts/.tsx
const BANNED_PHYSICAL = [
  /(?<![-\w])(ml|mr|pl|pr)-(\d|\[|px)/,
  /(?<![-\w])text-(left|right)(?![-\w])/,
  /(?<![-\w])(left|right)-(?!1\/2)(\d|\[|full|auto|px)/,
  /\bflex-row-reverse\b/,
  /(?<![-\w])(border|rounded)-[lr]-/,          // physical border/rounded — use -s/-e
  /\binset-inline(-start|-end)?-/,             // NOT a Tailwind utility — use start-*/end-*
]
const isComment = (l) => /^\s*(\/\/|\/?\*)/.test(l)

for (const file of walk(ROOT)) {
  const r = rel(file)

  if (PARALLEL.test(file) && /\.(ts|tsx|css)$/.test(file)) {
    flag(file, 0, 'parallel-file', 'parallel/duplicate version filename — edit the original in place')
    continue
  }
  if (!isCode(file) && !isCss(file)) continue
  if (isGenerated(file)) continue

  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')

  // file length (blank/comment lines excluded) — backstop for eslint max-lines
  if (isCode(file)) {
    const effective = lines.filter((l) => l.trim() && !isComment(l)).length
    if (effective > 220) flag(file, 0, 'max-lines', `${effective} effective lines > 220 — split by responsibility`)
  }

  // 'use client' on route files
  if (/(^|\/)app\/.*\/(page|layout)\.tsx$/.test(r) || /^app\/(page|layout)\.tsx$/.test(r)) {
    if (/^\s*['"]use client['"]/m.test(src))
      flag(file, 1, 'use-client-on-route', "route file is a client component — extract a leaf client component instead")
  }

  // service key confinement
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(src) && !/^lib\/supabase\/server\.ts$/.test(r) && !/^scripts\//.test(r))
    flag(file, 0, 'service-key-leak', 'SUPABASE_SERVICE_ROLE_KEY referenced outside lib/supabase/server.ts')

  lines.forEach((line, i) => {
    const n = i + 1
    if (isCode(file)) {
      for (const re of BANNED_PHYSICAL)
        if (re.test(line)) flag(file, n, 'physical-direction-class', line)
      if (/\bas any\b|:\s*any\b|<any[,>]|@ts-ignore/.test(line) && !isComment(line))
        flag(file, n, 'no-any', line)
      if (/@ts-ignore/.test(line)) flag(file, n, 'no-ts-ignore', line)
      if (/@ts-expect-error\s*$/.test(line)) flag(file, n, 'ts-expect-error-needs-reason', line)
      if (/\bconsole\.log\(/.test(line) && !/^scripts\//.test(r))
        flag(file, n, 'no-console-log', line)
      if (/\b(TODO|FIXME|XXX)\b/.test(line) && !/TODO\(phase\d+\)/.test(line))
        flag(file, n, 'no-todo', 'open questions go to ARCHITECTURE.md §10, not comments')
      // Hebrew literal rule applies to .tsx (UI) only — zod schema messages in .ts are allowed
      if (/\.tsx$/.test(file) && /[֐-׿]/.test(line) && !isComment(line))
        flag(file, n, 'hebrew-literal-in-tsx', 'Hebrew belongs in content/he/ui.json, not in .tsx files')
      if (/\bbg-opacity-|\bring-opacity-|\btext-opacity-/.test(line))
        flag(file, n, 'tailwind-v3-removed-utility', line)
    }
    if (isCss(file)) {
      if (/(margin|padding)-(left|right)\s*:/.test(line) || /text-align\s*:\s*(left|right)/.test(line))
        flag(file, n, 'physical-direction-css', line)
    }
  })
}

if (violations.length) {
  console.error(`\n✗ ${violations.length} convention violation(s):\n`)
  for (const v of violations)
    console.error(`  ${v.file}${v.line ? ':' + v.line : ''}  [${v.rule}]  ${v.text}`)
  console.error('\nFix the code — never this script. See skills/code-quality/SKILL.md.\n')
  process.exit(1)
}
console.log('✓ conventions clean')
