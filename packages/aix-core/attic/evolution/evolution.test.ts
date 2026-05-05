import { describe, it, expect, beforeEach } from 'vitest'
import { recordLesson, incrementLoop, updateTrustDelta, getEvolution, clearEvolution } from './tracker'
import { trustChain } from '../trust-chain/index'

describe('EvolutionTracker', () => {
  const agentDid = 'did:axiom:test-agent'

  beforeEach(() => {
    clearEvolution()
    trustChain.clear()
  })

  it('should record lessons and cap at 100', () => {
    for (let i = 0; i < 110; i++) {
      recordLesson(agentDid, `Lesson ${i}`)
    }
    const evolution = getEvolution(agentDid)
    expect(evolution?.lessons).toHaveLength(100)
    expect(evolution?.lessons[0]).toBe('Lesson 0')
    expect(evolution?.lessons[99]).toBe('Lesson 99')
  })

  it('should increment loops completed', () => {
    incrementLoop(agentDid)
    incrementLoop(agentDid)
    const evolution = getEvolution(agentDid)
    expect(evolution?.loops_completed).toBe(2)
  })

  it('should update trust delta and clamp to [-10, 10]', () => {
    updateTrustDelta(agentDid, 5)
    expect(getEvolution(agentDid)?.trust_delta).toBe(5)
    
    updateTrustDelta(agentDid, 10) // should be 15 but clamped to 10
    expect(getEvolution(agentDid)?.trust_delta).toBe(10)
    
    updateTrustDelta(agentDid, -30) // should be -20 but clamped to -10
    expect(getEvolution(agentDid)?.trust_delta).toBe(-10)
  })

  it('should record every update in TrustChain', () => {
    const initialChainLength = trustChain.getChain().length
    
    recordLesson(agentDid, 'Trust check lesson')
    incrementLoop(agentDid)
    updateTrustDelta(agentDid, 1)
    
    const chain = trustChain.getChain()
    expect(chain.length).toBe(initialChainLength + 3)
    
    expect(chain.at(-3)?.action).toBe('evolution.lesson_recorded')
    expect(chain.at(-2)?.action).toBe('evolution.loop_incremented')
    expect(chain.at(-1)?.action).toBe('evolution.trust_delta_updated')
  })
})
