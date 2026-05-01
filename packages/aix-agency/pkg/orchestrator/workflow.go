package orchestrator

import (
	"fmt"
	"github.com/Moeabdelaziz007/aix-format/packages/aix-agency/pkg/config"
)

type Workflow struct {
	Config *config.AxiomConfig
}

func NewWorkflow(cfg *config.AxiomConfig) *Workflow {
	return &Workflow{Config: cfg}
}

// NextNode determines the next node in the graph based on the current node and trigger.
func (w *Workflow) NextNode(currentNodeID, trigger string) (string, error) {
	if w.Config == nil {
		return "", fmt.Errorf("config not loaded")
	}

	for _, edge := range w.Config.Topology.Edges {
		if edge.From == currentNodeID && edge.Trigger == trigger {
			return edge.To, nil
		}
	}

	return "", fmt.Errorf("no transition found from %s with trigger %s", currentNodeID, trigger)
}

// GetRole returns the role assigned to a node.
func (w *Workflow) GetRole(nodeID string) string {
	for _, node := range w.Config.Topology.Nodes {
		if node.ID == nodeID {
			return node.Role
		}
	}
	return "unknown"
}
