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
	Workflow   *Workflow
}

func NewOrchestrator(store Store, axiomPath string) *Orchestrator {
	d := NewDispatcher(axiomPath)
	return &Orchestrator{
		Store:      store,
		Dispatcher: d,
		Retries:    patterns.NewRetryManager(),
		Workflow:   NewWorkflow(d.Config()),
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

	// 5. Logic for transition (Gem #3: State Persistence)
	fmt.Printf("[Orchestrator] Pulse active for %s (Status: %s, Node: %s)\n", processId, process.Status, process.CurrentNode)
	
	if process.CurrentNode == "" {
		process.CurrentNode = "planner" // Entry point from AXIOM.md
	}

	switch process.Status {
	case StatusThinking:
		o.executeThinking(ctx, process)
	case StatusActing:
		o.executeActing(ctx, process)
	case StatusWaiting:
		o.executeWaiting(ctx, process)
	case StatusRecovering:
		fmt.Printf("🛡️ [%s] Recovery Phase: Restoring process integrity...\n", processId)
		process.Status = StatusThinking
	case StatusFailed:
		fmt.Printf("⚠️ [%s] Failed State: Awaiting manual intervention or auto-recovery.\n", processId)
	}
	
	process.LastActivityAt = time.Now()
	return o.Store.SaveProcess(process)
}

func (o *Orchestrator) executeThinking(ctx context.Context, p *GatewayProcess) {
	fmt.Printf("🧠 [%s] Thinking Phase: Analyzing task for node '%s'...\n", p.ID, p.CurrentNode)
	role := o.Workflow.GetRole(p.CurrentNode)
	
	if p.NodeContext == nil {
		p.NodeContext = make(map[string]interface{})
	}

	// Logic based on role (Gem #318: Quantum Topology)
	switch role {
	case "decompose_issue":
		p.NodeContext["plan"] = fmt.Sprintf("Automated plan for issue decomposition on node %s", p.CurrentNode)
		p.NodeContext["approved"] = false
	case "implement_and_validate":
		p.NodeContext["strategy"] = "Implement using standard patterns"
	case "pr_feedback_sweep":
		p.NodeContext["feedback_status"] = "awaiting_comments"
	case "compress_and_archive":
		p.NodeContext["memory_status"] = "ready_for_compression"
	}

	p.History = append(p.History, HistoryEntry{
		Role:      "system",
		Content:   fmt.Sprintf("Node %s (%s) initialized.", p.CurrentNode, role),
		Timestamp: time.Now().Unix(),
	})
	
	p.Status = StatusActing
}

func (o *Orchestrator) executeActing(ctx context.Context, p *GatewayProcess) {
	role := o.Workflow.GetRole(p.CurrentNode)
	fmt.Printf("🛠️ [%s] Acting Phase: Executing role '%s'...\n", p.ID, role)
	
	// Simulate actual work based on role
	var actionContent string
	switch role {
	case "decompose_issue":
		actionContent = "Generated implementation plan. Waiting for approval."
		p.NodeContext["approved"] = true // Auto-approve for now
	case "implement_and_validate":
		actionContent = "Code changes applied and verified via tests."
	case "pr_feedback_sweep":
		actionContent = "All feedback addressed. PR is clean."
	case "compress_and_archive":
		actionContent = "openmemory.md compressed to 1.8KB."
	}

	p.History = append(p.History, HistoryEntry{
		Role:      "agent",
		Content:   actionContent,
		Timestamp: time.Now().Unix(),
	})
	
	p.Status = StatusWaiting
}

func (o *Orchestrator) executeWaiting(ctx context.Context, p *GatewayProcess) {
	fmt.Printf("⏳ [%s] Waiting Phase: Validating results for node '%s'...\n", p.ID, p.CurrentNode)
	
	// Determine trigger based on node results
	trigger := ""
	switch p.CurrentNode {
	case "planner":
		if approved, ok := p.NodeContext["approved"].(bool); ok && approved {
			trigger = "plan_approved"
		}
	case "executor":
		// Check if we should transition to reviewer or memory_keeper
		// For now, simulate transition to reviewer after execution
		trigger = "pr_opened"
	case "reviewer":
		trigger = "approved"
	case "memory_keeper":
		trigger = "session_end"
	}
	
	if trigger == "" {
		fmt.Printf("🏁 [%s] Waiting for external trigger or approval for node '%s'...\n", p.ID, p.CurrentNode)
		return
	}

	nextNode, err := o.Workflow.NextNode(p.CurrentNode, trigger)
	if err == nil {
		fmt.Printf("✅ [%s] Transitioning: %s -> %s (Trigger: %s)\n", p.ID, p.CurrentNode, nextNode, trigger)
		p.CurrentNode = nextNode
		p.Status = StatusThinking
		// Clear node context for new node
		p.NodeContext = make(map[string]interface{})
	} else {
		fmt.Printf("🏁 [%s] Final state reached (Node: %s).\n", p.ID, p.CurrentNode)
		p.Status = StatusCompleted
	}
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
	fmt.Printf("[Orchestrator] Resuming process %s after recovery delay.\n", id)
	process, err := o.Store.GetProcess(id)
	if err != nil {
		fmt.Printf("❌ Failed to fetch process for recovery: %v\n", err)
		return
	}
	
	process.Status = StatusRecovering
	process.LastActivityAt = time.Now()
	o.Store.SaveProcess(process)
}
