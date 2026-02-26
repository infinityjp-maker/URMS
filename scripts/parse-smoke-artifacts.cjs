const fs = require('fs')
const path = require('path')

function safeReadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p,'utf8')) } catch(e) { return null }
}

const outDir = '.github/actions-runs'
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'smoke-summary.txt')
let lines = []

const logPath = '.github/actions-runs/last-smoke.log'
if (fs.existsSync(logPath)) {
  const log = fs.readFileSync(logPath,'utf8')
  const markMatches = [...log.matchAll(/MARK[:\s].*/g)]
  const lastMark = markMatches.length ? markMatches[markMatches.length-1][0] : null
  lines.push(`Last MARK: ${lastMark || 'none'}`)

  const errorKeywords = ['ERR_CONNECTION_REFUSED','GOTO_ATTEMPT_FAILED','ux-ping fetch failed','internalErrors','ERROR']
  let foundErrors = []
  for (const k of errorKeywords) {
    const re = new RegExp(k,'g')
    if (re.test(log)) foundErrors.push(k)
  }
  lines.push(`Log error keywords: ${foundErrors.length?foundErrors.join(', '):'none'}`)
} else {
  lines.push('last-smoke.log: missing')
}

const smokeJsonPath = 'builds/diagnostics/smoke-result.full.json'
const smoke = safeReadJSON(smokeJsonPath)
if (smoke) {
  lines.push(`pingOk: ${smoke.pingOk === undefined ? 'n/a' : smoke.pingOk}`)
  const ints = smoke.internalErrors || smoke.internalErrorsFull || smoke.internal_errors || []
  lines.push(`internalErrors: ${Array.isArray(ints) ? ints.length : 'n/a'}`)
  if (Array.isArray(ints) && ints.length) {
    const counts = {}
    for (const e of ints) { const key = (typeof e==='string')? e : JSON.stringify(e); counts[key] = (counts[key]||0)+1 }
    lines.push('internalErrors breakdown:')
    for (const k of Object.keys(counts).slice(0,20)) lines.push(` - ${counts[k]} x ${k}`)
  }
} else {
  lines.push('smoke-result.full.json: missing or invalid')
}

const readinessPath = 'builds/diagnostics/readiness-key-html.json'
const readiness = safeReadJSON(readinessPath)
if (readiness) {
  const keys = Object.keys(readiness)
  const nulls = keys.filter(k=> readiness[k]==null).length
  lines.push(`readiness keys: ${keys.length}, nulls: ${nulls}`)
} else {
  lines.push('readiness-key-html.json: missing or invalid')
}

const respDir = 'builds/diagnostics/response-bodies'
if (fs.existsSync(respDir)) {
  const files = fs.readdirSync(respDir)
  lines.push(`response-bodies: ${files.length} files`)
  if (files.length) lines.push(` sample: ${files.slice(0,5).join(', ')}`)
} else {
  lines.push('response-bodies: none')
}

const ssDir = 'screenshots'
if (fs.existsSync(ssDir)) {
  const files = fs.readdirSync(ssDir)
  lines.push(`screenshots: ${files.length} files`)
  if (files.length) lines.push(` sample: ${files.slice(0,5).join(', ')}`)
} else {
  lines.push('screenshots: none')
}

fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8')
console.log('wrote', outPath)
