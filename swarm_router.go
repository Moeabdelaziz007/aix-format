package router

import (
	"errors"
	"sort"
)

type TaskType string

const (
	TaskTypePlanning  TaskType = "planning"
	TaskTypeExecution TaskType = "execution"
	TaskTypeReview    TaskType = "review"
	TaskTypeArchiving TaskType = "archiving"
	TaskTypeGeneral   TaskType = "general"
)

type AgentStatus string

const (
	AgentStatusIdle    AgentStatus = "idle"
	AgentStatusBusy    AgentStatus = "busy"
	AgentStatusOffline AgentStatus = "offline"
)

type TaskDescriptor struct {
	ID                   string
	Type                 TaskType
	Priority             int
	RequiredCapabilities []string
}

type AgentNode struct {
	ID           string
	Role         string
	TrustLevel   int
	Status       AgentStatus
	Capabilities map[string]float64
}

type AgentExecutionPlan struct {
	TaskID         string
	PrimaryAgentID string
	FallbackChain  []string
	Score          float64
}

type SwarmRouter struct {
	agents          map[string]AgentNode
	deadLetterQueue []TaskDescriptor
}

func NewSwarmRouter() *SwarmRouter {
	return &SwarmRouter{
		agents:          make(map[string]AgentNode),
		deadLetterQueue: make([]TaskDescriptor, 0),
	}
}

func (r *SwarmRouter) RegisterAgent(agent AgentNode) {
	r.agents[agent.ID] = agent
}

type candidate struct {
	agentID string
	score   float64
}

func (r *SwarmRouter) RouteTask(task TaskDescriptor) (*AgentExecutionPlan, error) {
	var candidates []candidate

	for _, agent := range r.agents {
		if agent.Status != AgentStatusIdle {
			continue
		}

		rawScore := 0.0
		hasAllRequired := true

		for _, reqCap := range task.RequiredCapabilities {
			capWeight, exists := agent.Capabilities[reqCap]
			if !exists {
				hasAllRequired = false
				break
			}
			rawScore += capWeight
		}

		if hasAllRequired {
			avgCapScore := rawScore / float64(len(task.RequiredCapabilities))
			finalScore := avgCapScore*(float64(agent.TrustLevel)*0.2) + float64(task.Priority)*0.1
			candidates = append(candidates, candidate{agentID: agent.ID, score: finalScore})
		}
	}

	if len(candidates) == 0 {
		r.deadLetterQueue = append(r.deadLetterQueue, task)
		return nil, errors.New("no suitable agent found, sent to DLQ")
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].score > candidates[j].score
	})

	fallback := []string{}
	for i := 1; i < len(candidates); i++ {
		fallback = append(fallback, candidates[i].agentID)
	}

	return &AgentExecutionPlan{
		TaskID:         task.ID,
		PrimaryAgentID: candidates[0].agentID,
		FallbackChain:  fallback,
		Score:          candidates[0].score,
	}, nil
}

func (r *SwarmRouter) GetDeadLetterQueue() []TaskDescriptor {
	return r.deadLetterQueue
}
