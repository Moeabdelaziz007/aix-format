package patterns

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

// RetryHandle represents a unique handle for a retry attempt.
// Inspired by Elixir's make_ref() for anti-collision.
type RetryHandle struct {
	IssueID string
	Token   string
}

// GenerateRetryToken creates a unique token for a retry attempt.
func GenerateRetryToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// ExponentialBackoff calculates the delay for a given attempt.
// Uses Bitwise Shift (1 << attempt) as per AIX Gem #2.
func ExponentialBackoff(attempt uint, baseDelay time.Duration, maxDelay time.Duration) time.Duration {
	// Cap the exponent to prevent overflow (1 << 31 is safe for int32/int64 duration)
	if attempt > 31 {
		attempt = 31
	}
	
	// AIX Gem: base * (1 << attempt)
	delay := baseDelay * time.Duration(1<<attempt)
	
	if delay > maxDelay {
		return maxDelay
	}
	return delay
}

// Gem #4 — Stall Detection without Heartbeat
// Instead of a separate heartbeat, we use the last activity timestamp.
func IsStalled(lastActivity time.Time, timeout time.Duration) bool {
	if lastActivity.IsZero() {
		return false
	}
	return time.Since(lastActivity) > timeout
}

// RetryManager handles the anti-collision logic.
type RetryManager struct {
	activeRetries map[string]string // issueID -> currentToken
}

func NewRetryManager() *RetryManager {
	return &RetryManager{
		activeRetries: make(map[string]string),
	}
}

// ScheduleRetry registers a new retry and returns the token.
// Any previous retry for the same issueID will be implicitly invalidated.
func (m *RetryManager) ScheduleRetry(issueID string) string {
	token := GenerateRetryToken()
	m.activeRetries[issueID] = token
	return token
}

// ValidateToken checks if the provided token is still the active one for the issue.
func (m *RetryManager) ValidateToken(issueID, token string) bool {
	activeToken, ok := m.activeRetries[issueID]
	if !ok {
		return false
	}
	return activeToken == token
}

// ClearToken removes the retry registration.
func (m *RetryManager) ClearToken(issueID string) {
	delete(m.activeRetries, issueID)
}
