const reactionBatchSize = 100

export async function fetchReactionBatches<T>(
  messageIds: readonly string[],
  fetchBatch: (messageIds: readonly string[]) => Promise<readonly T[]>,
) {
  const batches: string[][] = []
  for (let index = 0; index < messageIds.length; index += reactionBatchSize) {
    batches.push(messageIds.slice(index, index + reactionBatchSize))
  }
  const results = await Promise.all(batches.map(fetchBatch))
  return results.flat()
}
