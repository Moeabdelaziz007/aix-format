import { describe, it, expect } from 'vitest'
import { trustChain } from './index'

describe('TrustChain', () => {
  it('should start with an empty chain', () => {
    expect(trustChain.getChain()).toHaveLength(0)
  })

  it('should use GENESIS for the first entry prev_hash', () => {
    const entry = trustChain.append('agent.start', 'did:axiom:123', { status: 'ready' })
    expect(entry.prev_hash).toBe('GENESIS')
  })

  it('should link the chain using prev_hash', () => {
    const firstEntry = trustChain.getChain()[0]
    const secondEntry = trustChain.append('agent.task', 'did:axiom:123', { task: 'hello' })
    
    expect(secondEntry.prev_hash).toBe(firstEntry.payload_hash)
  })

  it('should start with human_approved as false', () => {
    const entry = trustChain.append('agent.critical_action', 'did:axiom:123', { action: 'delete' })
    expect(entry.human_approved).toBe(false)
  })

  it('should update human_approved to true via approve()', () => {
    const chain = trustChain.getChain()
    const index = chain.length - 1
    trustChain.approve(index, 'did:human:admin')
    
    expect(trustChain.getChain()[index].human_approved).toBe(true)
    
    // Check if an approval entry was added
    const lastEntry = trustChain.getChain().at(-1)
    expect(lastEntry?.action).toBe('human.approval')
    expect(lastEntry?.actor_did).toBe('did:human:admin')
  })
})
