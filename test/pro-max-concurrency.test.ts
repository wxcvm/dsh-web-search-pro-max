import assert from 'node:assert/strict'
import test from 'node:test'
import { mapConcurrent, SEARCH_CONCURRENCY } from '../src/search-concurrency.ts'

test('provider fan-out is bounded and retains input ordering', async () => {
  let active = 0, peak = 0
  const items = Array.from({ length: 12 }, (_, i) => i)
  const out = await mapConcurrent(items, SEARCH_CONCURRENCY, async i => {
    peak = Math.max(peak, ++active)
    await new Promise<void>(resolve => setTimeout(resolve, 2 + (i % 3)))
    active--
    return i * 2
  })
  assert.equal(peak, SEARCH_CONCURRENCY)
  assert.deepEqual(out, items.map(i => i * 2))
  assert.deepEqual(await mapConcurrent([], 4, async x => x), [])
})
