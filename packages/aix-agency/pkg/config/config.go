package config

import (
	"fmt"
	"os"
	"strings"
	"time"
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
	Skills []Skill `yaml:"skills"`
	Topology struct {
		Mode  string `yaml:"mode"`
		Nodes []Node `yaml:"nodes"`
		Edges []Edge `yaml:"edges"`
	} `yaml:"topology"`
}

type Skill struct {
	ID     string `yaml:"id"`
	Kind   string `yaml:"kind"`
	Source string `yaml:"source"`
}

type Node struct {
	ID    string `yaml:"id"`
	Role  string `yaml:"role"`
	Trust int    `yaml:"trust"`
}

type Edge struct {
	From    string `yaml:"from"`
	To      string `yaml:"to"`
	Trigger string `yaml:"trigger"`
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
	cfg := &AxiomConfig{}
	
	lines := strings.Split(yamlPart, "\n")
	var currentSection string
	
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		
		// Section detection
		if strings.HasSuffix(trimmed, ":") {
			currentSection = strings.TrimSuffix(trimmed, ":")
			continue
		}
		
		// List item detection
		if strings.HasPrefix(trimmed, "-") {
			val := strings.TrimSpace(strings.TrimPrefix(trimmed, "-"))
			switch currentSection {
			case "active_states":
				cfg.Tracker.ActiveStates = append(cfg.Tracker.ActiveStates, val)
			case "skills":
				if strings.Contains(val, "id:") {
					id := extractValue(val, "id:")
					cfg.Skills = append(cfg.Skills, Skill{ID: id})
				}
			case "nodes":
				if strings.Contains(val, "id:") {
					id := extractValue(val, "id:")
					cfg.Topology.Nodes = append(cfg.Topology.Nodes, Node{ID: id})
				}
			case "edges":
				if strings.Contains(val, "from:") {
					from := extractValue(val, "from:")
					cfg.Topology.Edges = append(cfg.Topology.Edges, Edge{From: from})
				}
			}
			continue
		}

		// Key-Value detection
		kv := strings.SplitN(trimmed, ":", 2)
		if len(kv) != 2 {
			// Handle indented key-values inside list items or sub-sections
			if currentSection == "edges" && len(cfg.Topology.Edges) > 0 {
				if strings.Contains(trimmed, "to:") {
					cfg.Topology.Edges[len(cfg.Topology.Edges)-1].To = extractValue(trimmed, "to:")
				} else if strings.Contains(trimmed, "trigger:") {
					cfg.Topology.Edges[len(cfg.Topology.Edges)-1].Trigger = extractValue(trimmed, "trigger:")
				}
			} else if currentSection == "nodes" && len(cfg.Topology.Nodes) > 0 {
				if strings.Contains(trimmed, "role:") {
					cfg.Topology.Nodes[len(cfg.Topology.Nodes)-1].Role = extractValue(trimmed, "role:")
				} else if strings.Contains(trimmed, "trust:") {
					fmt.Sscanf(extractValue(trimmed, "trust:"), "%d", &cfg.Topology.Nodes[len(cfg.Topology.Nodes)-1].Trust)
				}
			}
			continue
		}
		
		key := strings.TrimSpace(kv[0])
		val := strings.TrimSpace(kv[1])
		val = strings.Trim(val, "\"")
		
		switch currentSection {
		case "tracker":
			if key == "kind" { cfg.Tracker.Kind = val }
			if key == "repo" { cfg.Tracker.Repo = val }
		case "polling":
			if key == "interval_ms" { fmt.Sscanf(val, "%d", &cfg.Polling.IntervalMS) }
			if key == "stall_timeout_ms" { fmt.Sscanf(val, "%d", &cfg.Polling.StallTimeoutMS) }
		case "agent":
			if key == "max_concurrent_agents" { fmt.Sscanf(val, "%d", &cfg.Agent.MaxConcurrentAgents) }
			if key == "max_turns" { fmt.Sscanf(val, "%d", &cfg.Agent.MaxTurns) }
		case "topology":
			if key == "mode" { cfg.Topology.Mode = val }
		case "nodes":
			if len(cfg.Topology.Nodes) > 0 {
				if key == "role" { cfg.Topology.Nodes[len(cfg.Topology.Nodes)-1].Role = val }
				if key == "trust" { fmt.Sscanf(val, "%d", &cfg.Topology.Nodes[len(cfg.Topology.Nodes)-1].Trust) }
			}
		case "edges":
			if len(cfg.Topology.Edges) > 0 {
				if key == "to" { cfg.Topology.Edges[len(cfg.Topology.Edges)-1].To = val }
				if key == "trigger" { cfg.Topology.Edges[len(cfg.Topology.Edges)-1].Trigger = val }
			}
		}
	}

	return cfg, nil
}

func extractValue(line, key string) string {
	parts := strings.SplitN(line, key, 2)
	if len(parts) < 2 { return "" }
	val := strings.TrimSpace(parts[1])
	val = strings.TrimPrefix(val, "\"")
	val = strings.TrimSuffix(val, "\"")
	val = strings.SplitN(val, " ", 2)[0] // Remove comments
	return strings.TrimSpace(val)
}

func (c *AxiomConfig) GetPollingInterval() time.Duration {
	return time.Duration(c.Polling.IntervalMS) * time.Millisecond
}

func (c *AxiomConfig) GetStallTimeout() time.Duration {
	return time.Duration(c.Polling.StallTimeoutMS) * time.Millisecond
}
