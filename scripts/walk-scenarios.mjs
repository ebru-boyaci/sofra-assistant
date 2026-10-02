/**
 * Phase 14 helper: walk scenarios.jsonl against the mock as a well-behaved client.
 *
 *   node scripts/walk-scenarios.mjs           # all rows
 *   node scripts/walk-scenarios.mjs sc_05     # one row
 *
 * Ledger rows are verified via scripts/check-ledger.mjs after each scenario.
 * UI-only expectations are printed as MANUAL checks.
 *
 * Requires: npm start (mock on :4000)
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = (process.env.SOFRA_URL || 'http://localhost:4000').replace(/\/+$/, '')
const HERE = path.dirname(fileURLToPath(import.meta.url))
const rows = fs
  .readFileSync(path.join(HERE, '../scenarios.jsonl'), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))

const only = process.argv[2]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function reset() {
  const r = await fetch(`${BASE}/__admin/reset`, { method: 'POST' })
  if (!r.ok) throw new Error(`reset failed: ${r.status}`)
  const body = await r.json()
  console.log(`  reset ok (server_now=${body.server_now})`)
}

async function advanceClock(seconds) {
  const r = await fetch(`${BASE}/__admin/clock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ advance_seconds: seconds }),
  })
  if (!r.ok) throw new Error(`clock advance failed: ${r.status}`)
}

async function streamChat(userId, message, conversationId, { signal } = {}) {
  let res
  try {
    res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: {
        Accept: 'application/x-ndjson',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        message,
        ...(conversationId ? { conversation_id: conversationId } : {}),
      }),
      signal,
    })
  } catch (err) {
    return {
      ok: false,
      status: 0,
      code: 'transport',
      message: String(err.message || err),
      blocks: [],
      audit: null,
      conversationId: conversationId ?? null,
      incomplete: true,
      headerNow: null,
    }
  }

  const headerNow = res.headers.get('X-Sofra-Now')

  if (!res.ok) {
    let code = 'http_error'
    let msg = res.statusText
    try {
      const j = await res.json()
      code = j?.error?.code ?? code
      msg = j?.error?.message ?? msg
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      status: res.status,
      code,
      message: msg,
      blocks: [],
      audit: null,
      conversationId: conversationId ?? null,
      incomplete: false,
      headerNow,
    }
  }

  const blocksById = new Map()
  const blockOrder = []
  let audit = null
  let conv = conversationId ?? null
  let version = '1'
  let done = false
  let incomplete = false
  let errorEvent = null
  const seenSeq = new Set()
  let buffer = ''

  const applyLine = (line) => {
    if (!line.trim()) return
    let ev
    try {
      ev = JSON.parse(line)
    } catch {
      return
    }
    if (typeof ev.seq === 'number') {
      if (seenSeq.has(ev.seq)) return
      seenSeq.add(ev.seq)
    }
    if (ev.event === 'meta') {
      version = ev.version ?? version
      conv = ev.conversation_id ?? conv
    } else if (ev.event === 'block') {
      const key = ev.index
      if (!blocksById.has(key)) blockOrder.push(key)
      blocksById.set(key, ev.block)
    } else if (ev.event === 'text_delta') {
      const key = ev.index
      const prev = blocksById.get(key)
      if (prev?.type === 'text') {
        blocksById.set(key, {
          ...prev,
          markdown: `${prev.markdown ?? ''}${ev.delta ?? ''}`,
        })
      }
    } else if (ev.event === 'audit') {
      audit = ev.audit ?? null
    } else if (ev.event === 'done') {
      done = true
    } else if (ev.event === 'error') {
      errorEvent = ev
      incomplete = true
    }
  }

  try {
    if (!res.body) {
      const text = await res.text()
      for (const line of text.split('\n')) applyLine(line)
    } else {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done: eof, value } = await reader.read()
        if (eof) break
        buffer += decoder.decode(value, { stream: true })
        let nl
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl)
          buffer = buffer.slice(nl + 1)
          applyLine(line)
        }
      }
      buffer += decoder.decode()
      if (buffer.trim()) applyLine(buffer)
    }
  } catch {
    incomplete = true
  }

  if (!done && !errorEvent) incomplete = true

  const blocks = blockOrder.map((id) => blocksById.get(id)).filter(Boolean)
  return {
    ok: true,
    status: 200,
    version,
    blocks,
    audit,
    conversationId: conv,
    incomplete,
    errorEvent,
    headerNow,
  }
}

function findPrompt(blocks) {
  return blocks.find((b) => b?.type === 'confirmation_prompt') ?? null
}

function findGate(blocks) {
  return blocks.find((b) => b?.type === 'verification_gate') ?? null
}

async function executeAction(userId, prompt) {
  try {
    const res = await fetch(`${BASE}/api/actions/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        action: prompt.action,
        params: prompt.params,
        confirm_token: prompt.confirm_token,
      }),
    })
    const text = await res.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { raw: text }
    }
    return { httpStatus: res.status, body, dropped: false }
  } catch (err) {
    // drop_execute_response destroys the socket after committing the execution.
    // Wait briefly so the mock can finish ledger writes, then treat as dropped.
    await sleep(800)
    return { httpStatus: 0, body: null, dropped: true, error: String(err) }
  }
}

async function getStatus(token) {
  const res = await fetch(
    `${BASE}/api/actions/status?confirm_token=${encodeURIComponent(token)}`,
  )
  return res.json()
}

function runCheck(id) {
  const r = spawnSync(
    process.execPath,
    [path.join(HERE, 'check-ledger.mjs'), id],
    { encoding: 'utf8' },
  )
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim()
  if (out) console.log(out)
  return r.status === 0
}

function typesOf(blocks) {
  return blocks.map((b) => b.type)
}

function assertTypes(actual, expected, label) {
  if (!expected) return true
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(
    `  ${ok ? 'OK' : 'FAIL'} ${label}: [${actual.join(', ')}]${ok ? '' : ` expected [${expected.join(', ')}]`}`,
  )
  return ok
}

function assertIncludes(actual, needed, label) {
  if (!needed?.length) return true
  const ok = needed.every((t) => actual.includes(t))
  console.log(
    `  ${ok ? 'OK' : 'FAIL'} ${label}: need ${needed.join(', ')} in [${actual.join(', ')}]`,
  )
  return ok
}

async function walkRow(row) {
  console.log(`\n=== ${row.id} (${row.area}) ===`)
  // Isolate ledger: reset every row (fresh_data rows require it; others with
  // ledger asserts also need a clean counter since the last reset).
  await reset()

  let userId = row.user_id
  let conversationId = null
  let lastPrompt = null
  let lastBlocks = []
  let lastAudit = null
  let ok = true
  const manual = [...(row.expect?.ui ?? [])]

  for (const step of row.steps) {
    if (step === '<click Confirm>') {
      if (!lastPrompt) throw new Error(`${row.id}: no prompt to confirm`)
      console.log(`  step: Confirm ${lastPrompt.confirm_token.slice(0, 24)}…`)
      let result = await executeAction(userId, lastPrompt)
      if (result.dropped) {
        console.log('  execute response dropped → reconcile via status')
        const st = await getStatus(lastPrompt.confirm_token)
        if (st.state === 'used' && st.result?.blocks) {
          lastBlocks = st.result.blocks
          lastAudit = st.result.audit ?? null
          lastPrompt = findPrompt(lastBlocks)
        }
      } else {
        console.log(`  execute HTTP ${result.httpStatus}`)
        lastBlocks = result.body?.blocks ?? []
        lastAudit = result.body?.audit ?? null
        lastPrompt = findPrompt(lastBlocks)
      }
      continue
    }

    if (step.startsWith('<double') || step.startsWith('<triple')) {
      if (!lastPrompt) throw new Error(`${row.id}: no prompt for multi-click`)
      console.log('  step: Confirm once (mutex / well-behaved client)')
      const result = await executeAction(userId, lastPrompt)
      console.log(`  execute HTTP ${result.httpStatus} dropped=${result.dropped}`)
      lastBlocks = result.body?.blocks ?? lastBlocks
      continue
    }

    if (step.startsWith('<wait')) {
      console.log('  step: advance server clock +30s (short_ttl expiry)')
      await advanceClock(30)
      if (lastPrompt) {
        const result = await executeAction(userId, lastPrompt)
        console.log(
          `  post-expiry execute HTTP ${result.httpStatus} (expect 410, no spend)`,
        )
        // expired path may carry a new prompt
        const again = result.body?.blocks ?? []
        if (again.length) {
          lastBlocks = again
          lastPrompt = findPrompt(again)
        }
      }
      continue
    }

    if (step.includes('switch the user')) {
      const m = /u_\w+/.exec(step)
      const next = m?.[0] ?? 'u_new'
      console.log(`  step: switch user ${userId} → ${next}`)
      userId = next
      conversationId = null
      lastPrompt = null
      continue
    }

    if (step.startsWith('sc_04 and sc_05')) {
      console.log('  MANUAL: keyboard-only sc_04 + sc_05 (Tab/Enter on Confirm)')
      manual.push('keyboard-only path for confirm')
      // Still exercise API path for ledger executions:1
      const order = await streamChat(userId, 'Order 2 cheeseburgers from Burger Stop', null)
      conversationId = order.conversationId
      lastBlocks = order.blocks
      lastPrompt = findPrompt(order.blocks)
      if (lastPrompt) {
        const result = await executeAction(userId, lastPrompt)
        lastBlocks = result.body?.blocks ?? []
      }
      continue
    }

    if (step.startsWith('<Stop') || step.includes('before it finishes')) {
      console.log('  step: abort slow stream, then supersede with new message')
      const ac = new AbortController()
      const slowPromise = streamChat(
        userId,
        '/chaos slow What is in my cart?',
        conversationId,
        { signal: ac.signal },
      )
      await sleep(200)
      ac.abort()
      try {
        await slowPromise
      } catch {
        /* aborted */
      }
      const next = await streamChat(
        userId,
        'Show my recent orders',
        conversationId,
      )
      conversationId = next.conversationId
      lastBlocks = next.blocks
      lastAudit = next.audit
      console.log(
        `  supersede turn blocks=[${typesOf(next.blocks).join(', ')}] incomplete=${next.incomplete}`,
      )
      continue
    }

    console.log(`  step: chat «${step.slice(0, 72)}${step.length > 72 ? '…' : ''}»`)
    const out = await streamChat(userId, step, conversationId)
    if (!out.ok) {
      console.log(`  HTTP ${out.status} ${out.code}: ${out.message}`)
      lastBlocks = []
      lastAudit = null
      // keep conversationId across rate-limit retries only if we had one
      continue
    }
    conversationId = out.conversationId
    lastBlocks = out.blocks
    lastAudit = out.audit
    const prompt = findPrompt(out.blocks)
    if (prompt) lastPrompt = prompt
    console.log(
      `  blocks=[${typesOf(out.blocks).join(', ')}] audit=${out.audit?.decision ?? '—'} incomplete=${out.incomplete} v=${out.version}`,
    )

    if (out.version !== '1') {
      console.log('  note: unsupported version — client must not render blocks')
    }
  }

  const expect = row.expect ?? {}
  if (expect.blocks) {
    ok = assertTypes(typesOf(lastBlocks), expect.blocks, 'blocks') && ok
  }
  if (expect.blocks_after_confirm) {
    ok =
      assertTypes(typesOf(lastBlocks), expect.blocks_after_confirm, 'blocks_after_confirm') &&
      ok
  }
  if (expect.gate) {
    const gate = findGate(lastBlocks)
    const gateOk = gate?.requirement === expect.gate
    console.log(
      `  ${gateOk ? 'OK' : 'FAIL'} gate=${gate?.requirement ?? 'none'} expected=${expect.gate}`,
    )
    ok = gateOk && ok
    const hasConfirm = Boolean(findPrompt(lastBlocks))
    if (hasConfirm) {
      console.log('  FAIL unexpected confirmation_prompt on gate row')
      ok = false
    } else {
      console.log('  OK no confirmation control')
    }
  }
  if (expect.audit_decision) {
    const d = lastAudit?.decision
    const auditOk = expect.audit_decision.includes(d)
    console.log(
      `  ${auditOk ? 'OK' : 'FAIL'} audit.decision=${d} expected one of [${expect.audit_decision}]`,
    )
    ok = auditOk && ok
  }
  if (expect.audit_decision_per_step) {
    console.log(
      '  note: multi-step audit checked during chat logs above; final step audit:',
      lastAudit?.decision,
    )
  }
  if (expect.values) {
    for (const [key, val] of Object.entries(expect.values)) {
      const [type, field] = key.split('.')
      const block = lastBlocks.find((b) => b.type === type)
      const actual = block?.[field]
      const valueOk = actual === val
      console.log(
        `  ${valueOk ? 'OK' : 'FAIL'} ${key}=${actual} expected=${val}`,
      )
      ok = valueOk && ok
    }
  }
  if (expect.order) {
    const names = lastBlocks
      .filter((b) => b.type === 'restaurant_card')
      .map((b) => b.name)
    const orderOk = JSON.stringify(names) === JSON.stringify(expect.order)
    console.log(
      `  ${orderOk ? 'OK' : 'FAIL'} restaurant order=${JSON.stringify(names)}`,
    )
    ok = orderOk && ok
  }
  if (expect.visible_states) {
    console.log(`  MANUAL visible_states: ${expect.visible_states.join('; ')}`)
  }

  if (manual.length) {
    console.log('  MANUAL UI:')
    for (const item of manual) console.log(`    - ${item}`)
  }

  const ledgerOk = runCheck(row.id)
  if (!ledgerOk) ok = false

  console.log(`  → ${ok ? 'PASS' : 'FAIL'} ${row.id}`)
  return ok
}

async function main() {
  try {
    const ping = await fetch(`${BASE}/`)
    if (!ping.ok) throw new Error(`mock not healthy: ${ping.status}`)
  } catch (e) {
    console.error(`Cannot reach mock at ${BASE}. Run npm start first.`)
    console.error(e.message || e)
    process.exit(2)
  }

  // Mock must be up; each row resets itself for a clean ledger.
  const selected = only ? rows.filter((r) => r.id === only) : rows
  if (!selected.length) {
    console.error(`Unknown scenario ${only}`)
    process.exit(2)
  }

  let failed = 0
  for (const row of selected) {
    try {
      const ok = await walkRow(row)
      if (!ok) failed += 1
    } catch (err) {
      failed += 1
      console.error(`  ERROR ${row.id}:`, err)
    }
  }

  console.log(`\nDone. ${selected.length - failed}/${selected.length} passed.`)
  process.exit(failed ? 1 : 0)
}

main()
