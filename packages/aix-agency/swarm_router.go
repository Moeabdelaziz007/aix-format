package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"sync"
	"time"
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
	ID                   string   `json:"id"`
	Type                 TaskType `json:"type"`
	Priority             int      `json:"priority"`
	RequiredCapabilities []string `json:"required_capabilities"`
}

type AgentNode struct {
	ID           string             `json:"id"`
	Role         string             `json:"role"`
	TrustLevel   int                `json:"trust_level"`
	Status       AgentStatus        `json:"status"`
	Capabilities map[string]float64 `json:"capabilities"`
}

type AgentExecutionPlan struct {
	TaskID         string   `json:"task_id"`
	PrimaryAgentID string   `json:"primary_agent_id"`
	FallbackChain  []string `json:"fallback_chain"`
	Score          float64  `json:"score"`
}

type SwarmRouter struct {
	mu              sync.RWMutex
	agents          map[string]AgentNode
	deadLetterQueue []TaskDescriptor
	breaker         *CircuitBreaker
	metrics         *RouterMetrics
}

type RouterMetrics struct {
	mu           sync.RWMutex
	TasksRouted  int64 `json:"tasks_routed"`
	TasksFailed  int64 `json:"tasks_failed"`
	BreakerTrips int64 `json:"breaker_trips"`
	Recoveries   int64 `json:"recoveries"`
	ActiveAgents int   `json:"active_agents"`
}

type CircuitState string

const (
	StateClosed   CircuitState = "closed"
	StateOpen     CircuitState = "open"
	StateHalfOpen CircuitState = "half-open"
)

type CircuitBreaker struct {
	mu               sync.RWMutex
	FailureThreshold int
	SuccessThreshold int
	FailureCount     int
	SuccessCount     int
	LastFailure      time.Time
	OpenDuration     time.Duration
	State            CircuitState
}

func NewCircuitBreaker(failureThreshold int, successThreshold int, duration time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		FailureThreshold: failureThreshold,
		SuccessThreshold: successThreshold,
		OpenDuration:     duration,
		State:            StateClosed,
	}
}

func (cb *CircuitBreaker) RecordFailure(metrics *RouterMetrics) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.FailureCount++
	cb.SuccessCount = 0

	if metrics != nil {
		metrics.mu.Lock()
		metrics.TasksFailed++
		metrics.mu.Unlock()
	}

	if cb.State == StateHalfOpen || cb.FailureCount >= cb.FailureThreshold {
		prevState := cb.State
		cb.State = StateOpen
		cb.LastFailure = time.Now()

		if metrics != nil {
			metrics.mu.Lock()
			metrics.BreakerTrips++
			metrics.mu.Unlock()
		}

		log.Printf("[CircuitBreaker] %s -> OPEN (Failures: %d, Total Trips: %d)\n",
			prevState, cb.FailureCount, metrics.BreakerTrips)
	}
}

func (cb *CircuitBreaker) RecordSuccess(metrics *RouterMetrics) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if metrics != nil {
		metrics.mu.Lock()
		metrics.TasksRouted++
		metrics.mu.Unlock()
	}

	if cb.State == StateHalfOpen {
		cb.SuccessCount++
		if cb.SuccessCount >= cb.SuccessThreshold {
			cb.State = StateClosed
			cb.FailureCount = 0
			cb.SuccessCount = 0

			if metrics != nil {
				metrics.mu.Lock()
				metrics.Recoveries++
				metrics.mu.Unlock()
			}

			log.Println("[CircuitBreaker] HALF-OPEN -> CLOSED (System Recovered)")
		}
	} else if cb.State == StateClosed {
		cb.FailureCount = 0
	}
}

func (cb *CircuitBreaker) IsAllowed() bool {
	cb.mu.RLock()
	defer cb.mu.RUnlock()

	if cb.State == StateClosed {
		return true
	}
	if cb.State == StateOpen {
		if time.Since(cb.LastFailure) > cb.OpenDuration {
			return true
		}
		return false
	}
	return true
}

func (cb *CircuitBreaker) CheckAndProbe() bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if cb.State == StateClosed {
		return true
	}
	if cb.State == StateOpen {
		if time.Since(cb.LastFailure) > cb.OpenDuration {
			cb.State = StateHalfOpen
			log.Println("[CircuitBreaker] State transitioned to HALF-OPEN (Probing)")
			return true
		}
		return false
	}
	return true
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	Uptime  string `json:"uptime"`
}

var startTime = time.Now()

func NewSwarmRouter() *SwarmRouter {
	r := &SwarmRouter{
		agents:          make(map[string]AgentNode),
		deadLetterQueue: make([]TaskDescriptor, 0),
		breaker:         NewCircuitBreaker(5, 3, 30*time.Second),
		metrics:         &RouterMetrics{},
	}
	log.Println("[SwarmRouter] Initialized successfully with Adaptive Circuit Breaker and Metrics")
	return r
}

func (r *SwarmRouter) RegisterAgent(agent AgentNode) error {
	if r == nil {
		return errors.New("router instance is nil")
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.agents == nil {
		return errors.New("agents map is not initialized")
	}
	if agent.ID == "" {
		return errors.New("agent ID cannot be empty")
	}
	if _, exists := r.agents[agent.ID]; exists {
		return fmt.Errorf("agent registration failed: ID %s already exists", agent.ID)
	}

	if agent.Capabilities == nil {
		agent.Capabilities = make(map[string]float64)
	}

	r.agents[agent.ID] = agent

	r.metrics.mu.Lock()
	r.metrics.ActiveAgents = len(r.agents)
	r.metrics.mu.Unlock()

	log.Printf("[SwarmRouter] Registered agent: %s (role: %s, trust: %d)\n", agent.ID, agent.Role, agent.TrustLevel)
	return nil
}

type candidate struct {
	agentID string
	score   float64
}

// scoreCandidates evaluates eligible agents against task requirements.
// Extracted from RouteTask to keep each function ≤ 30 lines (CODE_LAW).
func (r *SwarmRouter) scoreCandidates(task TaskDescriptor) []candidate {
	var candidates []candidate
	for _, agent := range r.agents {
		if agent.Status != AgentStatusIdle {
			continue
		}
		rawScore := 0.0
		hasAll := true
		for _, reqCap := range task.RequiredCapabilities {
			w, ok := agent.Capabilities[reqCap]
			if !ok {
				hasAll = false
				break
			}
			rawScore += w
		}
		if !hasAll {
			continue
		}
		avg := rawScore / float64(len(task.RequiredCapabilities))
		score := avg*(float64(agent.TrustLevel)*0.2) + float64(task.Priority)*0.1
		candidates = append(candidates, candidate{agentID: agent.ID, score: score})
	}
	sort.Slice(candidates, func(i, j int) bool { return candidates[i].score > candidates[j].score })
	return candidates
}

func (r *SwarmRouter) RouteTask(task TaskDescriptor) (*AgentExecutionPlan, error) {
	if r == nil {
		return nil, errors.New("router instance is nil")
	}
	if !r.breaker.CheckAndProbe() {
		r.breaker.RecordFailure(r.metrics)
		return nil, fmt.Errorf("routing unavailable: circuit breaker is %s", r.breaker.State)
	}
	if task.ID == "" {
		return nil, errors.New("task ID cannot be empty")
	}
	if len(task.RequiredCapabilities) == 0 {
		return nil, errors.New("task must have at least one required capability")
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	candidates := r.scoreCandidates(task)

	if len(candidates) == 0 {
		r.deadLetterQueue = append(r.deadLetterQueue, task)
		if len(r.agents) == 0 {
			r.breaker.RecordFailure(r.metrics)
			return nil, errors.New("infrastructure failure: no agents registered")
		}
		return nil, fmt.Errorf("task mismatch: no suitable agent for %s %v", task.ID, task.RequiredCapabilities)
	}

	fallback := make([]string, 0, 3)
	for i := 1; i < len(candidates) && i < 4; i++ {
		fallback = append(fallback, candidates[i].agentID)
	}

	plan := &AgentExecutionPlan{
		TaskID:         task.ID,
		PrimaryAgentID: candidates[0].agentID,
		FallbackChain:  fallback,
		Score:          candidates[0].score,
	}

	r.breaker.RecordSuccess(r.metrics)
	log.Printf("[SwarmRouter] Routed task %s → agent %s (score: %.2f, fallbacks: %d)\n",
		task.ID, plan.PrimaryAgentID, plan.Score, len(fallback))
	return plan, nil
}

func (r *SwarmRouter) GetDeadLetterQueue() ([]TaskDescriptor, error) {
	if r == nil {
		return nil, errors.New("router is nil")
	}
	return r.deadLetterQueue, nil
}

// ── HTTP HELPERS ────────────────────────────────────────────────────────────

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("[ERROR] Failed to encode JSON response: %v", err)
	}
}

func respondError(w http.ResponseWriter, status int, code, message string) {
	respondJSON(w, status, ErrorResponse{
		Error:   http.StatusText(status),
		Code:    code,
		Message: message,
	})
}

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────

// recoverMiddleware catches panics and returns 500 instead of crashing.
func recoverMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC] Recovered: %v", err)
				respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error")
			}
		}()
		next(w, r)
	}
}

// apiKeyMiddleware enforces X-AIX-API-Key header against AIX_API_KEY env var.
// Set AIX_API_KEY in your environment / Vercel secrets — never hardcode.
func apiKeyMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		secret := os.Getenv("AIX_API_KEY")
		if secret == "" {
			log.Println("[WARN] AIX_API_KEY not set — mutation endpoint is unprotected!")
			respondError(w, http.StatusServiceUnavailable, "CONFIG_ERROR", "API key not configured on server")
			return
		}
		if r.Header.Get("X-AIX-API-Key") != secret {
			respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or missing X-AIX-API-Key header")
			return
		}
		next(w, r)
	}
}

// chain composes middleware right-to-left: chain(recover, auth, handler)
func chain(middlewares ...func(http.HandlerFunc) http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler := middlewares[len(middlewares)-1](func(http.ResponseWriter, *http.Request) {})
		for i := len(middlewares) - 2; i >= 0; i-- {
			handler = middlewares[i](handler)
		}
		handler(w, r)
	}
}

// ── HANDLERS ────────────────────────────────────────────────────────────────

func (r *SwarmRouter) HealthHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET allowed")
		return
	}
	respondJSON(w, http.StatusOK, HealthResponse{
		Status:  "ok",
		Version: "1.0.0",
		Uptime:  time.Since(startTime).String(),
	})
}

func (r *SwarmRouter) RegisterAgentHandler(w http.ResponseWriter, req *http.Request) {
	ctx, cancel := context.WithTimeout(req.Context(), 10*time.Second)
	defer cancel()

	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST allowed")
		return
	}
	if req.Header.Get("Content-Type") != "application/json" {
		respondError(w, http.StatusBadRequest, "INVALID_CONTENT_TYPE", "Content-Type must be application/json")
		return
	}
	if req.Body == nil {
		respondError(w, http.StatusBadRequest, "EMPTY_BODY", "Request body cannot be empty")
		return
	}
	defer req.Body.Close()

	var agent AgentNode
	dec := json.NewDecoder(req.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&agent); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", fmt.Sprintf("Failed to parse JSON: %v", err))
		return
	}

	select {
	case <-ctx.Done():
		respondError(w, http.StatusRequestTimeout, "TIMEOUT", "Request timeout")
		return
	default:
	}

	if err := r.RegisterAgent(agent); err != nil {
		respondError(w, http.StatusBadRequest, "REGISTRATION_FAILED", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Agent %s registered successfully", agent.ID),
		"agent":   agent,
	})
}

func (r *SwarmRouter) RouteTaskHandler(w http.ResponseWriter, req *http.Request) {
	ctx, cancel := context.WithTimeout(req.Context(), 10*time.Second)
	defer cancel()

	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST allowed")
		return
	}
	if req.Header.Get("Content-Type") != "application/json" {
		respondError(w, http.StatusBadRequest, "INVALID_CONTENT_TYPE", "Content-Type must be application/json")
		return
	}
	if req.Body == nil {
		respondError(w, http.StatusBadRequest, "EMPTY_BODY", "Request body cannot be empty")
		return
	}
	defer req.Body.Close()

	var task TaskDescriptor
	dec := json.NewDecoder(req.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&task); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", fmt.Sprintf("Failed to parse JSON: %v", err))
		return
	}

	select {
	case <-ctx.Done():
		respondError(w, http.StatusRequestTimeout, "TIMEOUT", "Request timeout")
		return
	default:
	}

	plan, err := r.RouteTask(task)
	if err != nil {
		respondError(w, http.StatusNotFound, "NO_AGENT_FOUND", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"plan":    plan,
	})
}

func (r *SwarmRouter) MetricsHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET allowed")
		return
	}
	r.metrics.mu.RLock()
	defer r.metrics.mu.RUnlock()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"metrics": r.metrics,
	})
}

func (r *SwarmRouter) GetDLQHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET allowed")
		return
	}
	dlq, err := r.GetDeadLetterQueue()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "DLQ_ERROR", err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(dlq),
		"tasks":   dlq,
	})
}

func (r *SwarmRouter) ListAgentsHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET allowed")
		return
	}
	r.mu.RLock()
	agents := make([]AgentNode, 0, len(r.agents))
	for _, a := range r.agents {
		agents = append(agents, a)
	}
	r.mu.RUnlock()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(agents),
		"agents":  agents,
	})
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

func main() {
	router := NewSwarmRouter()

	// Public endpoints — no auth required (observability only)
	http.HandleFunc("/health", recoverMiddleware(router.HealthHandler))
	http.HandleFunc("/api/metrics", recoverMiddleware(router.MetricsHandler))

	// Protected endpoints — require X-AIX-API-Key header (set AIX_API_KEY env var)
	http.HandleFunc("/api/agents/register", recoverMiddleware(apiKeyMiddleware(router.RegisterAgentHandler)))
	http.HandleFunc("/api/tasks/route", recoverMiddleware(apiKeyMiddleware(router.RouteTaskHandler)))
	http.HandleFunc("/api/dlq", recoverMiddleware(apiKeyMiddleware(router.GetDLQHandler)))
	http.HandleFunc("/api/agents", recoverMiddleware(apiKeyMiddleware(router.ListAgentsHandler)))

	port := ":8080"
	log.Printf("[SwarmRouter] Starting HTTP server on %s", port)
	log.Printf("[SwarmRouter] Protected routes require X-AIX-API-Key header")
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("[FATAL] Server failed to start: %v", err)
	}
}

// Made with Moe Abdelaziz
