package orchestrator

import (
	"fmt"
	"sync"

	"github.com/Moeabdelaziz007/aix-format/packages/aix-agency/pkg/config"
)

type Dispatcher struct {
	mu           sync.RWMutex
	config       *config.AxiomConfig
	configPath   string
	activeClaims map[string]string // agentId -> processId
}

func NewDispatcher(axiomPath string) *Dispatcher {
	d := &Dispatcher{
		activeClaims: make(map[string]string),
		configPath:   axiomPath,
	}
	d.RefreshConfig()
	return d
}

// RefreshConfig reloads config from AXIOM.md (Gem #7)
func (d *Dispatcher) RefreshConfig() {
	d.mu.Lock()
	defer d.mu.Unlock()
	
	newCfg, err := config.LoadFromAxiomMD(d.configPath)
	if err != nil {
		fmt.Printf("[Dispatcher] Failed to reload config: %v\n", err)
		return
	}
	d.config = newCfg
}

func (d *Dispatcher) Config() *config.AxiomConfig {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.config
}

// Two-Phase Dispatch: Phase 1 — Claim
// Atomic lock with a short TTL (simulated here with activeClaims).
func (d *Dispatcher) Claim(agentId, processId string) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if existing, ok := d.activeClaims[agentId]; ok {
		if existing != processId {
			return false, fmt.Errorf("agent %s already claimed by process %s", agentId, existing)
		}
	}

	d.activeClaims[agentId] = processId
	return true, nil
}

// Two-Phase Dispatch: Phase 2 — Revalidate
// Verify we still own the claim before committing to an action.
func (d *Dispatcher) Revalidate(agentId, processId string) bool {
	d.mu.RLock()
	defer d.mu.RUnlock()

	current, ok := d.activeClaims[agentId]
	return ok && current == processId
}

func (d *Dispatcher) Release(agentId string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	delete(d.activeClaims, agentId)
}
