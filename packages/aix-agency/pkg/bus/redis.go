// Package bus provides Go-side emission to the AIX Nervous System.
// It writes BusEvents directly into the shared Redis pulse list
// (aix:pulse:global) that PulseEngine.ts reads from, making Go
// a first-class citizen of the 4-Ring Heartbeat Topology.
package bus

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	globalPulseKey = "aix:pulse:global"
	maxPulseEvents = 100

	// Ring constants mirror packages/aix-core/src/bus.ts
	RingGenesis = 0 // Rust DNA
	RingSoul    = 1 // Identity / Lifecycle
	RingMind    = 2 // Routing / Learning
	RingBody    = 3 // External I/O
)

// BusEvent mirrors the TypeScript BusEvent interface.
type BusEvent struct {
	ID        string                 `json:"id"`
	Timestamp int64                  `json:"timestamp"`
	Ring      int                    `json:"ring"`
	Type      string                 `json:"type"`
	AgentID   string                 `json:"agentId"`
	AgentName string                 `json:"agentName"`
	Message   string                 `json:"message"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// Client wraps a Redis connection for pulse emission.
type Client struct {
	rdb *redis.Client
}

// New creates a Bus Client from an existing Redis client.
func New(rdb *redis.Client) *Client {
	return &Client{rdb: rdb}
}

// EmitTaskRouted is called by swarm_router after a successful capability match.
// Ring 2 — MIND
func (c *Client) EmitTaskRouted(
	ctx context.Context,
	agentID string,
	capability string,
	score float64,
	taskID string,
) error {
	return c.emit(ctx, BusEvent{
		Ring:      RingMind,
		Type:      "TASK_ROUTED",
		AgentID:   agentID,
		AgentName: capability,
		Message:   fmt.Sprintf("🐹 Routed %s → %s (score: %.2f)", taskID, agentID, score),
		Metadata: map[string]interface{}{
			"score":      score,
			"taskId":     taskID,
			"capability": capability,
		},
	})
}

// EmitTaskFailed is called when all agents are unavailable / circuit open.
// Ring 2 — MIND
func (c *Client) EmitTaskFailed(
	ctx context.Context,
	taskID string,
	reason string,
) error {
	return c.emit(ctx, BusEvent{
		Ring:      RingMind,
		Type:      "TASK_FAILED",
		AgentID:   "swarm_router",
		AgentName: "SwarmRouter",
		Message:   fmt.Sprintf("❌ Task %s failed: %s", taskID, reason),
		Metadata:  map[string]interface{}{"taskId": taskID, "reason": reason},
	})
}

// EmitDNAVerified is the bridge for Rust → Go → Redis when aix-dna
// is invoked as a subprocess inside aix-agency.
// Ring 0 — GENESIS
func (c *Client) EmitDNAVerified(
	ctx context.Context,
	manifestID string,
	hash string,
	ok bool,
) error {
	eventType := "DNA_VERIFIED"
	msg := fmt.Sprintf("✅ genesis_hash verified: %s…", truncate(hash, 12))
	if !ok {
		eventType = "DNA_TAMPERED"
		msg = fmt.Sprintf("🚨 Tamper detected — hash mismatch: %s…", truncate(hash, 12))
	}
	return c.emit(ctx, BusEvent{
		Ring:      RingGenesis,
		Type:      eventType,
		AgentID:   manifestID,
		AgentName: "aix-dna",
		Message:   msg,
		Metadata:  map[string]interface{}{"hash": hash, "ok": ok},
	})
}

// EmitQuantumBurst is called when the Meta-Loop detects an Innovation Burst.
// Ring 2 — MIND
func (c *Client) EmitQuantumBurst(
	ctx context.Context,
	agentID string,
	energyLevel float64,
	insight string,
) error {
	return c.emit(ctx, BusEvent{
		Ring:      RingMind,
		Type:      "QUANTUM_BURST",
		AgentID:   agentID,
		AgentName: "MetaLoop",
		Message:   fmt.Sprintf("✨ Quantum Burst [%.2f]: %s", energyLevel, insight),
		Metadata:  map[string]interface{}{"energy": energyLevel, "insight": insight},
	})
}

// EmitEvolutionPath is called when an agent collapses its quantum state to a new path.
// Ring 1 — SOUL
func (c *Client) EmitEvolutionPath(
	ctx context.Context,
	agentID string,
	path string,
) error {
	return c.emit(ctx, BusEvent{
		Ring:      RingSoul,
		Type:      "EVOLUTION_PATH_CHANGED",
		AgentID:   agentID,
		AgentName: "QuantumOptimizer",
		Message:   fmt.Sprintf("🧬 Agent evolving via path: %s", path),
		Metadata:  map[string]interface{}{"path": path},
	})
}

// EmitTrustChainAudit logs an immutable action footprint with auditHash
// Ring 0 — GENESIS (RULE 3)
func (c *Client) EmitTrustChainAudit(
	ctx context.Context,
	agentID string,
	action string,
	auditHash string,
) error {
	return c.emit(ctx, BusEvent{
		Ring:      RingGenesis,
		Type:      "TRUST_CHAIN_APPEND",
		AgentID:   agentID,
		AgentName: "TrustChain",
		Message:   fmt.Sprintf("🔗 Action [%s] secured. Audit Hash: %s", action, auditHash),
		Metadata:  map[string]interface{}{"action": action, "auditHash": auditHash},
	})
}

// EmitAgentSelfReview feeds the CuriosityEngine after a run loop
// Ring 2 — MIND (RULE 4 & 7)
func (c *Client) EmitAgentSelfReview(
	ctx context.Context,
	agentID string,
	selfScore float64,
	insights string,
) error {
	return c.emit(ctx, BusEvent{
		Ring:      RingMind,
		Type:      "AGENT_SELF_REVIEW",
		AgentID:   agentID,
		AgentName: "CuriosityEngine",
		Message:   fmt.Sprintf("🧠 Agent %s completed self-review. Score: %.2f | Insight: %s", agentID, selfScore, insights),
		Metadata:  map[string]interface{}{"selfScore": selfScore, "insights": insights},
	})
}

// emit serialises a BusEvent and pushes it onto the global pulse list.
// It trims to the last 100 events to cap memory usage.
func (c *Client) emit(ctx context.Context, event BusEvent) error {
	// Fill in generated fields
	event.ID = fmt.Sprintf("%x", time.Now().UnixNano())
	event.Timestamp = time.Now().UnixMilli()

	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("bus: marshal event: %w", err)
	}

	pipe := c.rdb.TxPipeline()
	pipe.LPush(ctx, globalPulseKey, payload)
	pipe.LTrim(ctx, globalPulseKey, 0, maxPulseEvents-1)
	_, err = pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("bus: redis emit: %w", err)
	}
	return nil
}

// SubscribeToRing allows Go services (like SwarmRouter) to listen to the TS Meta-Loop.
// This closes the Quantum Topology loop!
func (c *Client) SubscribeToRing(ctx context.Context, ring int, handler func(BusEvent)) {
	pattern := fmt.Sprintf("aix:ring:%d:*", ring)
	pubsub := c.rdb.PSubscribe(ctx, pattern)
	defer pubsub.Close()

	log.Printf("[EventBus] Active Pattern Subscription on Ring %d Pulse Stream (%s)...\n", ring, pattern)

	ch := pubsub.Channel()
	for msg := range ch {
		var event BusEvent
		if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
			log.Printf("[EventBus] Error unmarshaling ring %d event: %v", ring, err)
			continue
		}
		handler(event)
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
