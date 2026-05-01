package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// AxiomConfig represents the structure of AXIOM.md front matter
type AxiomConfig struct {
	Tracker struct {
		Kind         string   `yaml:"kind"`
		Repo         string   `yaml:"repo"`
		ActiveStates []string `yaml:"active_states"`
	} `yaml:"tracker"`
	Polling struct {
		IntervalMS     int `yaml:"interval_ms"`
		StallTimeoutMS int `yaml:"stall_timeout_ms"`
	} `yaml:"polling"`
	Agent struct {
		MaxConcurrentAgents int `yaml:"max_concurrent_agents"`
		MaxTurns           int `yaml:"max_turns"`
	} `yaml:"agent"`
}

// LoadFromAxiomMD parses the front matter of AXIOM.md
func LoadFromAxiomMD(path string) (*AxiomConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	content := string(data)
	if !strings.HasPrefix(content, "---") {
		return nil, fmt.Errorf("invalid AXIOM.md: missing front matter prefix")
	}

	parts := strings.SplitN(content, "---", 3)
	if len(parts) < 3 {
		return nil, fmt.Errorf("invalid AXIOM.md: front matter not closed")
	}

	yamlPart := parts[1]
	var cfg AxiomConfig
	// Note: We use yaml.v3. If not available, this will need a fallback or manual parsing.
	err = yaml.Unmarshal([]byte(yamlPart), &cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to parse YAML: %w", err)
	}

	return &cfg, nil
}

func (c *AxiomConfig) GetPollingInterval() time.Duration {
	return time.Duration(c.Polling.IntervalMS) * time.Millisecond
}

func (c *AxiomConfig) GetStallTimeout() time.Duration {
	return time.Duration(c.Polling.StallTimeoutMS) * time.Millisecond
}
