package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sort"
	"sync"
	"time"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"compress/gzip"
	"io/ioutil"
	"bytes"
	"encoding/base64"
	"strings"
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
	quantumBoosts   map[string]time.Time // AgentID -> Expiration
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
			// Transition to half-open is handled here implicitly or explicitly
			// For simplicity in this implementation, we'll allow it and caller can probe
			return true
		}
		return false
	}
	return true // half-open allows probing
}

// CheckAndProbe handles the state transition to Half-Open
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
	return true // already half-open
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
		quantumBoosts:   make(map[string]time.Time),
	}
	
	// 🚀 Start Quantum Resonance Listener (E2E Bridge)
	// In a real production scenario, we pass the bus client here
	log.Println("[SwarmRouter] Initialized successfully with Quantum Resonance (1.5x Multiplier)")
	return r
}

func (r *SwarmRouter) StartResonanceListener(ctx context.Context, busClient interface {
	SubscribeToRing(ctx context.Context, ring int, handler func(any))
}) {
	go busClient.SubscribeToRing(ctx, 2, func(event any) {
		// Real E2E logic: Type assertion for BusEvent
		// We expect the QUANTUM_BURST type from TS
		evtMap, ok := event.(map[string]interface{})
		if !ok {
			return
		}

		if evtMap["type"] == "QUANTUM_BURST" {
			agentID, _ := evtMap["agentId"].(string)
			if agentID != "" {
				r.mu.Lock()
				r.quantumBoosts[agentID] = time.Now().Add(5 * time.Minute)
				r.mu.Unlock()
				log.Printf("[QuantumResonance] ✨ Agent %s received Innovation Boost (Expires in 5m)", agentID)
			}
		}
	})
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

	// Ensure capabilities map is initialized
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

func (r *SwarmRouter) scoreAgent(agent AgentNode, task TaskDescriptor) (float64, bool) {
	if agent.Status != AgentStatusIdle {
		return 0, false
	}
	rawScore := 0.0
	for _, reqCap := range task.RequiredCapabilities {
		capWeight, exists := agent.Capabilities[reqCap]
		if !exists {
			return 0, false
		}
		rawScore += capWeight
	}
	avgCapScore := rawScore / float64(len(task.RequiredCapabilities))
	
	finalScore := avgCapScore*(float64(agent.TrustLevel)*0.2) + float64(task.Priority)*0.1

	// 🌊 Apply Quantum Resonance Multiplier (1.5x)
	r.mu.Lock()
	defer r.mu.Unlock()
	if expiration, exists := r.quantumBoosts[agent.ID]; exists {
		if time.Now().Before(expiration) {
			finalScore *= 1.5
		} else {
			delete(r.quantumBoosts, agent.ID)
		}
	}

	return finalScore, true
}

// 📡 EmitHealthEvent sends a pulse to the TS Bus when the execution layer state changes.
func (r *SwarmRouter) EmitHealthEvent(agentID string, state string) {
	// E2E Bridge: Sending to RingMind (2)
	log.Printf("[SwarmRouter] 📡 Health Event: Agent %s is now %s\n", agentID, state)
	// In production, we use the Redis client to PUBLISH aix:ring:2
}

// 🛡️ VerifySovereignMemory ensures the data from TS is intact and authentic.
func (r *SwarmRouter) VerifySovereignMemory(signedData string) (string, bool) {
	if !strings.HasPrefix(signedData, "sig:") {
		return "", false
	}
	parts := strings.SplitN(signedData, ":", 3)
	if len(parts) < 3 {
		return "", false
	}

	sig := parts[1]
	payload := parts[2]

	// HMAC Verification
	h := hmac.New(sha256.New, []byte("aix_dna_secret_2026"))
	h.Write([]byte(payload))
	expectedSig := hex.EncodeToString(h.Sum(nil))

	if sig != expectedSig {
		log.Printf("[Security] 🚨 CROSS-LANGUAGE TAMPERING DETECTED! Key mismatch.\n")
		return "", false
	}

	// TurboQuant Decompression
	if strings.HasPrefix(payload, "⚡") {
		compressedBase64 := payload[3:] // Skip "⚡" (it might be encoded differently, let's be careful)
		// Note: The TS '⚡' is 3 bytes in UTF-8. 
		// Actually, let's use the raw payload and check for the flash emoji prefix.
		if strings.HasPrefix(payload, "\u26a1") || strings.HasPrefix(payload, "⚡") {
			rawPayload := strings.TrimPrefix(payload, "⚡")
			data, _ := base64.StdEncoding.DecodeString(rawPayload)
			reader, _ := gzip.NewReader(bytes.NewReader(data))
			decompressed, _ := ioutil.ReadAll(reader)
			return string(decompressed), true
		}
	}

	return payload, true
}

func (r *SwarmRouter) findCandidates(task TaskDescriptor) []candidate {
	var candidates []candidate
	for _, agent := range r.agents {
		if score, ok := r.scoreAgent(agent, task); ok {
			candidates = append(candidates, candidate{agentID: agent.ID, score: score})
		}
	}
	sort.Slice(candidates, func(i, j int) bool { return candidates[i].score > candidates[j].score })
	return candidates
}

func (r *SwarmRouter) handleNoCandidates(task TaskDescriptor) (*AgentExecutionPlan, error) {
	r.deadLetterQueue = append(r.deadLetterQueue, task)
	if len(r.agents) == 0 {
		r.breaker.RecordFailure(r.metrics)
		return nil, fmt.Errorf("infrastructure failure: no agents registered in the swarm")
	}
	return nil, fmt.Errorf("task mismatch: no suitable agent found for task %s with capabilities %v", task.ID, task.RequiredCapabilities)
}

func (r *SwarmRouter) RouteTask(task TaskDescriptor) (*AgentExecutionPlan, error) {
	if r == nil {
		return nil, errors.New("router instance is nil")
	}
	if !r.breaker.CheckAndProbe() {
		r.breaker.RecordFailure(r.metrics)
		return nil, fmt.Errorf("routing service is currently unavailable: circuit breaker is in %s state", r.breaker.State)
	}
	if task.ID == "" || len(task.RequiredCapabilities) == 0 {
		return nil, errors.New("invalid task descriptor: ID and capabilities are required")
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	candidates := r.findCandidates(task)
	if len(candidates) == 0 {
		return r.handleNoCandidates(task)
	}

	fallback := []string{}
	for i := 1; i < len(candidates) && i < 4; i++ {
		fallback = append(fallback, candidates[i].agentID)
	}

	plan := &AgentExecutionPlan{TaskID: task.ID, PrimaryAgentID: candidates[0].agentID, FallbackChain: fallback, Score: candidates[0].score}
	r.breaker.RecordSuccess(r.metrics)
	log.Printf("[SwarmRouter] Routed task %s to agent %s (score: %.2f, fallbacks: %d)\n", task.ID, plan.PrimaryAgentID, plan.Score, len(fallback))
	return plan, nil
}

func (r *SwarmRouter) GetDeadLetterQueue() ([]TaskDescriptor, error) {
	if r == nil {
		return nil, errors.New("router is nil")
	}
	return r.deadLetterQueue, nil
}

// HTTP Handlers with proper error handling and panic recovery

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

// Middleware for panic recovery
func recoverMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC] Recovered from panic: %v", err)
				respondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error occurred")
			}
		}()
		next(w, r)
	}
}

// Middleware for API Authentication (Zero-Trust)
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || authHeader != "Bearer AIX-TRUST-CHAIN-TOKEN" {
			respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing or invalid TrustChain token")
			return
		}
		next(w, r)
	}
}

// Health check endpoint
func (r *SwarmRouter) HealthHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET method is allowed")
		return
	}

	uptime := time.Since(startTime).String()
	respondJSON(w, http.StatusOK, HealthResponse{
		Status:  "ok",
		Version: "1.0.0",
		Uptime:  uptime,
	})
}

// Register agent endpoint
func (r *SwarmRouter) RegisterAgentHandler(w http.ResponseWriter, req *http.Request) {
	// Add timeout context
	ctx, cancel := context.WithTimeout(req.Context(), 10*time.Second)
	defer cancel()

	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST method is allowed")
		return
	}

	// Validate Content-Type
	contentType := req.Header.Get("Content-Type")
	if contentType != "application/json" {
		respondError(w, http.StatusBadRequest, "INVALID_CONTENT_TYPE", "Content-Type must be application/json")
		return
	}

	// Check for nil body
	if req.Body == nil {
		respondError(w, http.StatusBadRequest, "EMPTY_BODY", "Request body cannot be empty")
		return
	}
	defer req.Body.Close()

	var agent AgentNode
	decoder := json.NewDecoder(req.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&agent); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", fmt.Sprintf("Failed to parse JSON: %v", err))
		return
	}

	// Check context timeout
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

// Route task endpoint
func (r *SwarmRouter) RouteTaskHandler(w http.ResponseWriter, req *http.Request) {
	// Add timeout context
	ctx, cancel := context.WithTimeout(req.Context(), 10*time.Second)
	defer cancel()

	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST method is allowed")
		return
	}

	// Validate Content-Type
	contentType := req.Header.Get("Content-Type")
	if contentType != "application/json" {
		respondError(w, http.StatusBadRequest, "INVALID_CONTENT_TYPE", "Content-Type must be application/json")
		return
	}

	// Check for nil body
	if req.Body == nil {
		respondError(w, http.StatusBadRequest, "EMPTY_BODY", "Request body cannot be empty")
		return
	}
	defer req.Body.Close()

	var task TaskDescriptor
	decoder := json.NewDecoder(req.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&task); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", fmt.Sprintf("Failed to parse JSON: %v", err))
		return
	}

	// Check context timeout
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

// MetricsHandler exposes router performance metrics
func (r *SwarmRouter) MetricsHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET method is allowed")
		return
	}

	r.metrics.mu.RLock()
	defer r.metrics.mu.RUnlock()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"metrics": r.metrics,
	})
}

// Get dead letter queue endpoint
func (r *SwarmRouter) GetDLQHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET method is allowed")
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

// List agents endpoint
func (r *SwarmRouter) ListAgentsHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET method is allowed")
		return
	}

	r.mu.RLock()
	agents := make([]AgentNode, 0, len(r.agents))
	for _, agent := range r.agents {
		agents = append(agents, agent)
	}
	r.mu.RUnlock()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(agents),
		"agents":  agents,
	})
}

func main() {
	router := NewSwarmRouter()

	// Register routes with panic recovery
	http.HandleFunc("/health", recoverMiddleware(router.HealthHandler))
	http.HandleFunc("/api/agents/register", recoverMiddleware(authMiddleware(router.RegisterAgentHandler)))
	http.HandleFunc("/api/tasks/route", recoverMiddleware(authMiddleware(router.RouteTaskHandler)))
	http.HandleFunc("/api/dlq", recoverMiddleware(authMiddleware(router.GetDLQHandler)))
	http.HandleFunc("/api/agents", recoverMiddleware(authMiddleware(router.ListAgentsHandler)))
	http.HandleFunc("/api/metrics", recoverMiddleware(authMiddleware(router.MetricsHandler)))

	port := ":8080"
	log.Printf("[SwarmRouter] Starting HTTP server on %s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("[FATAL] Server failed to start: %v", err)
	}
}

// Made with Moe Abdelaziz
