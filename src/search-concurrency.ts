/** Bound simultaneous provider calls without changing result ordering. */
export const SEARCH_CONCURRENCY = 4

export async function mapConcurrent<T, R>(items: readonly T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(items.length, Math.max(1, Math.floor(limit))) }, async () => {
    while (next < items.length) {
      const index = next++
      out[index] = await worker(items[index]!, index)
    }
  }))
  return out
}
