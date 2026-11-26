import assert from 'node:assert/strict'
import test from 'node:test'
import { createSearchCacheKey } from '../src/cache-key.ts'

test('native provider searches never share cache identity with host-seam searches', () => {
  const input = { query: 'example', engines: ['seam', 'ddg'], count: 8, multi: false }
  assert.equal(createSearchCacheKey(input), createSearchCacheKey({ ...input, skipSeam: false }))
  assert.notEqual(createSearchCacheKey(input), createSearchCacheKey({ ...input, skipSeam: true }))
  assert.equal(createSearchCacheKey({ ...input, skipSeam: true }), createSearchCacheKey({ ...input, count: 3, skipSeam: true }))
})
