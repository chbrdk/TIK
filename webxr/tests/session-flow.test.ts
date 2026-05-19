import { describe, expect, it, vi } from 'vitest'
import { SessionFlow } from '@/runtime/SessionFlow'

describe('SessionFlow', () => {
  it('first act is 1', () => {
    expect(SessionFlow.firstAct()).toBe(1)
  })

  it('advances through acts 1 to 5', () => {
    expect(SessionFlow.nextAct(1)).toBe(2)
    expect(SessionFlow.nextAct(4)).toBe(5)
    expect(SessionFlow.nextAct(5)).toBeNull()
  })

  it('calls onAdvance on act_complete event', () => {
    const onAdvance = vi.fn()
    const flow = new SessionFlow(onAdvance, () => 1, () => {})
    flow.listener({ type: 'act_complete' })
    expect(onAdvance).toHaveBeenCalledWith(2)
  })

  it('calls onSessionComplete on session_complete event', () => {
    const onComplete = vi.fn()
    const flow = new SessionFlow(() => {}, () => 5, onComplete)
    flow.listener({ type: 'session_complete' })
    expect(onComplete).toHaveBeenCalled()
  })
})
