package orchestrator

import (
	"time"
)

type Status string

const (
	StatusIdle      Status = "IDLE"
	StatusThinking  Status = "THINKING"
	StatusActing    Status = "ACTING"
	StatusWaiting   Status = "WAITING"
	StatusCompleted Status = "COMPLETED"
	StatusFailed    Status = "FAILED"
)

type HistoryEntry struct {
	Role      string `json:"role"`
	Content   string `json:"content"`
	Timestamp int64  `json:"timestamp"`
}

type GatewayProcess struct {
	ID             string                 `json:"id"`
	AgentID        string                 `json:"agentId"`
	Status         Status                 `json:"status"`
	History        []HistoryEntry         `json:"history"`
	CurrentTask    string                 `json:"currentTask"`
	Observations   map[string]interface{} `json:"observations"`
	Metadata       map[string]interface{} `json:"metadata"`
	LastActivityAt time.Time              `json:"lastActivityAt"`
	CreatedAt      time.Time              `json:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt"`
	ReportedTokens int                    `json:"reportedTokens"` // Gem #5: Last reported cumulative tokens
}

// Store interface for persistence (Upstash/Redis/Memory)
type Store interface {
	GetProcess(id string) (*GatewayProcess, error)
	SaveProcess(p *GatewayProcess) error
	DeleteProcess(id string) error
	LockAgent(agentId, processId string, ttl time.Duration) (bool, error)
	UnlockAgent(agentId string) error
}
