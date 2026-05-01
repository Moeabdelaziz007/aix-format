package patterns

import (
	"encoding/json"
	"strings"
)

// Gem #5 — Token Delta Anti-Duplication
// Codex sends cumulative totals, not deltas. 
// We track the last reported total to calculate the increment.
func ComputeTokenDelta(currentTotal int, lastReported int) int {
	if currentTotal >= lastReported {
		return currentTotal - lastReported
	}
	// If currentTotal is less than lastReported, something reset (or schema change)
	// We return 0 to be defensive.
	return 0
}

// Gem #6 — Polymorphic Token Extraction (Defensive Multi-Path)
// Searches multiple paths in the payload for token usage.
func ExtractTokenUsage(payload map[string]interface{}) map[string]int {
	// Possible keys where usage might hide
	paths := []string{"usage", "payload", "tokens"}
	
	usage := make(map[string]int)

	// Try the top level first
	if u := extractFromMap(payload); len(u) > 0 {
		return u
	}

	// Try common nested paths
	for _, path := range paths {
		if val, ok := payload[path]; ok {
			if nestedMap, ok := val.(map[string]interface{}); ok {
				if u := extractFromMap(nestedMap); len(u) > 0 {
					return u
				}
			}
		}
	}

	return usage
}

func extractFromMap(m map[string]interface{}) map[string]int {
	usage := make(map[string]int)
	
	// List of common keys for prompt/input and completion/output tokens
	inputKeys := []string{"input_tokens", "prompt_tokens", "inputTokens", "promptTokens"}
	outputKeys := []string{"output_tokens", "completion_tokens", "outputTokens", "completionTokens"}

	for k, v := range m {
		val := toInt(v)
		if val < 0 {
			continue
		}

		for _, ik := range inputKeys {
			if strings.EqualFold(k, ik) {
				usage["input"] = val
			}
		}
		for _, ok := range outputKeys {
			if strings.EqualFold(k, ok) {
				usage["output"] = val
			}
		}
	}
	
	return usage
}

func toInt(v interface{}) int {
	switch n := v.(type) {
	case int:
		return n
	case float64:
		return int(n)
	case json.Number:
		i, _ := n.Int64()
		return int(i)
	default:
		return -1
	}
}
