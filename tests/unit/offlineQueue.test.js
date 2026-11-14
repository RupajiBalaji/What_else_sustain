import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { OfflineQueueManager } from '../../src/utils/offlineQueue.js'

describe('Offline Telemetry Queue (P3-03)', () => {
  let queueManager

  beforeEach(() => {
    queueManager = new OfflineQueueManager({ storageKey: 'test_wes_queue' })
    queueManager.clearQueue()
  })

  it('enqueues events when offline or network fails without blocking gameplay', async () => {
    assert.strictEqual(queueManager.getQueueLength(), 0)

    // Send event with a failing mock endpoint
    const result = await queueManager.sendEvent('sess_123', 'choice_made', { choice: 'burn' })
    assert.strictEqual(result.status, 'queued')
    assert.strictEqual(queueManager.getQueueLength(), 1)

    const items = queueManager.getQueue()
    assert.strictEqual(items[0].sessionId, 'sess_123')
    assert.strictEqual(items[0].eventType, 'choice_made')
    assert.strictEqual(items[0].payload.choice, 'burn')
  })

  it('flushes pending queue when connection restores', async () => {
    queueManager.enqueue({
      endpoint: '/api/sessions/sess_123/events',
      body: { event_type: 'rewind_triggered' }
    })
    queueManager.enqueue({
      endpoint: '/api/sessions/sess_123/events',
      body: { event_type: 'choice_made', payload: { choice: 'happy_seeder' } }
    })

    assert.strictEqual(queueManager.getQueueLength(), 2)

    // Mock successful fetch
    const mockSuccessFetch = async () => ({
      ok: true,
      json: async () => ({ status: 'recorded' })
    })

    const sent = await queueManager.flushQueue(mockSuccessFetch)
    assert.strictEqual(sent, 2)
    assert.strictEqual(queueManager.getQueueLength(), 0, 'Queue should be empty after successful flush')
  })

  it('retains failed items in queue if flush encounters errors', async () => {
    queueManager.enqueue({
      endpoint: '/api/sessions/sess_123/events',
      body: { event_type: 'test_event' }
    })

    // Mock failing fetch
    const mockFailFetch = async () => {
      throw new Error('Network offline')
    }

    const sent = await queueManager.flushQueue(mockFailFetch)
    assert.strictEqual(sent, 0)
    assert.strictEqual(queueManager.getQueueLength(), 1, 'Failed items must remain in queue')
  })
})
