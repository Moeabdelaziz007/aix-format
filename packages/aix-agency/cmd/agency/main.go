package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"github.com/Moeabdelaziz007/aix-format/packages/aix-agency/pkg/orchestrator"
)

// MockStore implements the Store interface for demonstration
type MockStore struct {
	processes map[string]*orchestrator.GatewayProcess
	mu        sync.RWMutex
}

func NewMockStore() *MockStore {
	return &MockStore{
		processes: make(map[string]*orchestrator.GatewayProcess),
	}
}

func (s *MockStore) GetProcess(id string) (*orchestrator.GatewayProcess, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.processes[id]
	if !ok {
		return &orchestrator.GatewayProcess{
			ID:             id,
			AgentID:        "axiom-grand-agent",
			Status:         orchestrator.StatusThinking,
			LastActivityAt: time.Now().Add(-1 * time.Minute),
		}, nil
	}
	return p, nil
}

func (s *MockStore) SaveProcess(p *orchestrator.GatewayProcess) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.processes[p.ID] = p
	return nil
}

func (s *MockStore) DeleteProcess(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.processes, id)
	return nil
}

func (s *MockStore) LockAgent(agentId, processId string, ttl time.Duration) (bool, error) { return true, nil }
func (s *MockStore) UnlockAgent(agentId string) error { return nil }

func main() {
	fmt.Println("🚀 AIX Agency — Starting Orchestrator...")

	// Resolve AXIOM.md path
	wd, _ := os.Getwd()
	axiomPath := filepath.Join(wd, "../../AXIOM.md")
	if _, err := os.Stat(axiomPath); os.IsNotExist(err) {
		axiomPath = filepath.Join(wd, "AXIOM.md")
	}

	fmt.Printf("📂 Loading SSOT from: %s\n", axiomPath)

	store := NewMockStore()
	orch := orchestrator.NewOrchestrator(store, axiomPath)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	processID := "proc-123"

	// Initial Config Load
	orch.Dispatcher.RefreshConfig()
	cfg := orch.Dispatcher.Config()
	if cfg == nil {
		fmt.Println("❌ Failed to load initial config. Exiting.")
		return
	}

	// Initial Agent Claim
	if ok, err := orch.Dispatcher.Claim("axiom-grand-agent", processID); !ok || err != nil {
		fmt.Printf("❌ Failed to claim agent: %v\n", err)
		return
	}
	fmt.Printf("✅ Claimed agent: axiom-grand-agent\n")

	interval := time.Duration(cfg.Polling.IntervalMS) * time.Millisecond
	fmt.Printf("📊 Active Config: Tracker=%s, Interval=%v\n", cfg.Tracker.Kind, interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Signal handling for graceful shutdown
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	fmt.Println("⚡ Agency loop running. Press Ctrl+C to exit.")

	for {
		select {
		case <-sigs:
			fmt.Println("\n🛑 Graceful shutdown initiated...")
			return
		case t := <-ticker.C:
			fmt.Printf("📡 [%s] Dispatching pulse...\n", t.Format("15:04:05"))
			if err := orch.Pulse(ctx, processID); err != nil {
				fmt.Printf("❌ Pulse failed: %v\n", err)
			} else {
				// Success, check if interval changed
				newCfg := orch.Dispatcher.Config()
				if newCfg != nil && newCfg.Polling.IntervalMS != int(interval.Milliseconds()) {
					newInterval := time.Duration(newCfg.Polling.IntervalMS) * time.Millisecond
					fmt.Printf("🔄 Polling interval updated: %v -> %v\n", interval, newInterval)
					interval = newInterval
					ticker.Reset(interval)
				}
			}
		}
	}
}
