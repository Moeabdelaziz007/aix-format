package orchestrator

import (
	"context"
	"fmt"
	"time"

	"github.com/Moeabdelaziz007/aix-format/packages/aix-agency/pkg/patterns"
)

type Orchestrator struct {
	Store      Store
	Dispatcher *Dispatcher
	Retries    *patterns.RetryManager
}

func NewOrchestrator(store Store, axiomPath string) *Orchestrator {
	return &Orchestrator{
		Store:      store,
		Dispatcher: NewDispatcher(axiomPath),
		Retries:    patterns.NewRetryManager(),
	}
}

// Pulse represents the "Heartbeat" or "Tick" of a persistent process.
func (o *Orchestrator) Pulse(ctx context.Context, processId string) error {
	// 1. Re-evaluate Config (Gem #7)
	o.Dispatcher.RefreshConfig()

	// 2. Fetch Process
	process, err := o.Store.GetProcess(processId)
	if err != nil {
		return err
	}

	// 3. Stall Detection (Gem #4)
	stallTimeout := 5 * time.Minute
	if cfg := o.Dispatcher.Config(); cfg != nil {
		stallTimeout = cfg.GetStallTimeout()
	}

	if patterns.IsStalled(process.LastActivityAt, stallTimeout) {
		return o.handleStall(ctx, process)
	}

	// 4. Two-Phase Dispatch: Phase 2 - Revalidate
	if !o.Dispatcher.Revalidate(process.AgentID, process.ID) {
		return fmt.Errorf("process %s lost its claim over agent %s", processId, process.AgentID)
	}

	// Logic for transition goes here...
	return nil
}

func (o *Orchestrator) handleStall(ctx context.Context, p *GatewayProcess) error {
	fmt.Printf("[Orchestrator] Process %s stalled. Initiating recovery...\n", p.ID)
	
	// Use Exponential Backoff for retry delay
	token := o.Retries.ScheduleRetry(p.ID)
	delay := patterns.ExponentialBackoff(1, time.Second, 1*time.Minute)
	
	time.AfterFunc(delay, func() {
		// Verify token hasn't changed (Anti-Collision Gem #1)
		if o.Retries.ValidateToken(p.ID, token) {
			o.resumeProcess(p.ID)
		}
	})
	
	return nil
}

func (o *Orchestrator) resumeProcess(id string) {
	// Implementation for resuming a process...
}
