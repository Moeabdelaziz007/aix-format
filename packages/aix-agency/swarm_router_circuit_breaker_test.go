package main

import (
	"testing"
	"time"
)

func TestCircuitBreaker(t *testing.T) {
	cb := NewCircuitBreaker(3, 2, 100*time.Millisecond)

	// Test Initial State
	if cb.State != StateClosed {
		t.Errorf("Expected initial state Closed, got %s", cb.State)
	}

	metrics := &RouterMetrics{}
	// Record Failures
	cb.RecordFailure(metrics)
	cb.RecordFailure(metrics)
	cb.RecordFailure(metrics)

	if cb.State != StateOpen {
		t.Errorf("Expected state Open after 3 failures, got %s", cb.State)
	}

	// Test state transition from Open to Half-Open
	time.Sleep(150 * time.Millisecond)
	if !cb.CheckAndProbe() {
		t.Error("Expected CheckAndProbe to return true after timeout")
	}
	if cb.State != StateHalfOpen {
		t.Errorf("Expected state Half-Open after CheckAndProbe, got %s", cb.State)
	}

	// Test state transition from Half-Open to Closed
	cb.RecordSuccess(metrics)
	cb.RecordSuccess(metrics)
	if cb.State != StateClosed {
		t.Errorf("Expected state Closed after 2 successes, got %s", cb.State)
	}
}

func TestSwarmRouter_RegisterAgent(t *testing.T) {
	sr := NewSwarmRouter()

	agent := AgentNode{
		ID:   "agent-1",
		Role: "worker",
	}

	err := sr.RegisterAgent(agent)
	if err != nil {
		t.Errorf("RegisterAgent failed: %v", err)
	}

	if len(sr.agents) != 1 {
		t.Errorf("Expected 1 agent, got %d", len(sr.agents))
	}
}
