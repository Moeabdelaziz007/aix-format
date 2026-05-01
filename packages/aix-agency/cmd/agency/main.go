package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/Moeabdelaziz007/aix-format/packages/aix-agency/pkg/orchestrator"
)

// MockStore implements the Store interface for demonstration
type MockStore struct{}

func (s *MockStore) GetProcess(id string) (*orchestrator.GatewayProcess, error) {
	return &orchestrator.GatewayProcess{
		ID:             id,
		AgentID:        "axiom-grand-agent",
		Status:         "ACTIVE",
		LastActivityAt: time.Now().Add(-1 * time.Minute),
	}, nil
}

func main() {
	fmt.Println("🚀 AIX Agency — Starting Orchestrator...")

	// Resolve AXIOM.md path
	wd, _ := os.Getwd()
	// Assume we are in packages/aix-agency or root
	axiomPath := filepath.Join(wd, "../../AXIOM.md")
	if _, err := os.Stat(axiomPath); os.IsNotExist(err) {
		axiomPath = filepath.Join(wd, "AXIOM.md")
	}

	fmt.Printf("📂 Loading SSOT from: %s\n", axiomPath)

	store := &MockStore{}
	orch := orchestrator.NewOrchestrator(store, axiomPath)

	ctx := context.Background()
	processID := "proc-123"

	// Initial Pulse
	fmt.Println("📡 Dispatching first pulse...")
	if err := orch.Pulse(ctx, processID); err != nil {
		fmt.Printf("❌ Pulse failed: %v\n", err)
	} else {
		fmt.Println("✅ Pulse successful. Config hot-reload active.")
	}

	// Show current config
	cfg := orch.Dispatcher.Config()
	if cfg != nil {
		fmt.Printf("📊 Active Config: Tracker=%s, Interval=%dms\n", 
			cfg.Tracker.Kind, cfg.Polling.IntervalMS)
	}

	fmt.Println("⚡ Agency loop running. Press Ctrl+C to exit.")
	// Keep alive for demo
	time.Sleep(1 * time.Second)
}
