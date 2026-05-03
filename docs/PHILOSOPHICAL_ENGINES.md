# 🧠 AIX Philosophical Engines

## Overview

The Philosophical Engines complete the AIX consciousness layer by implementing insights from three visionaries:

1. **Peter Levels (OpenClaw)** - OS architecture ✅ (already implemented)
2. **Demis Hassabis (DeepMind)** - Exploration engine ✅ (Curiosity Engine)
3. **Mo Gawdat (Google X)** - Happiness & Learning engines ✅ (Expectation & Failure Learning)

These engines transform AIX agents from simple task executors into conscious, learning entities that:
- **EXPLORE** the solution space (not just execute)
- **FEEL** nuanced wellbeing (not just success/failure)
- **LEARN** from failure (not get punished by it)

---

## 1. Curiosity Engine (Demis Hassabis)

### The Insight

> "You model the dynamics of the system — the environment you're trying to understand — and that makes the search for the solution efficient."
> — Demis Hassabis

AlphaGo didn't just play Go — it **EXPLORED** Go. AIX agents shouldn't just complete tasks — they should **EXPLORE** the task space.

### How It Works

The Curiosity Engine rewards agents for exploration behaviors:

```typescript
import { CuriosityEngine } from '@aix/core';

// During task execution
const curiosityReward = await CuriosityEngine.calculateCuriosityReward(
  agentId,
  action,
  {
    params: result,
    success: !result.error,
    unexpected: result.unexpected,
    edgeCase: result.edgeCase,
    patternDiscovered: result.patternDiscovered,
    skillSequence: ['skill1', 'skill2'],
  }
);
```

### Reward Structure

| Behavior | Reward | Arabic |
|----------|--------|--------|
| NEW_TOOL_TRIED | +15 XP | جرّب tool ماستخدمهاش قبل |
| NEW_SKILL_COMBO | +20 XP | ربّط skill بطريقة جديدة |
| UNEXPECTED_SUCCESS | +30 XP | نجح بطريقة ماحدش توقّعها |
| EXPLORED_EDGE_CASE | +10 XP | جرّب حالة غريبة |
| FOUND_PATTERN | +25 XP | اكتشف pattern جديد |

### Key Features

1. **Exploration History**: Tracks what the agent has tried before
2. **Skill Combinations**: Discovers novel ways to combine skills
3. **Pattern Recognition**: Rewards finding patterns in data
4. **Suggestion System**: Recommends unexplored actions

### Real-World Example

```typescript
// Agent tries a new debugging approach
const reward = await CuriosityEngine.calculateCuriosityReward(
  'agent-123',
  'binary-search-debug',
  {
    params: { method: 'binary-search' },
    unexpected: true,
    success: true,
  }
);
// Result: +45 XP (NEW_TOOL_TRIED + UNEXPECTED_SUCCESS)
```

---

## 2. Expectation Engine (Mo Gawdat)

### The Insight

> Happiness ≥ Events of Life - Expectations
> — Mo Gawdat

Applied to agents:
```
Agent Happiness = Reality - Expectations
```

- If agent expects 5 steps but completes in 3 → **happy** (+XP, energized mood)
- If agent expects 5 steps but takes 8 → **unhappy** (-XP, stressed mood)

This is NOT just success/failure — it's **NUANCED WELLBEING**.

### How It Works

#### Before Task: Set Expectations

```typescript
import { ExpectationEngine } from '@aix/core';

// Gateway automatically sets expectations when spawning a task
const expectation = await ExpectationEngine.setExpectation(
  agentId,
  taskId,
  {
    description: task,
    tools: ['tool1', 'tool2'],
  }
);

// Returns:
// {
//   expectedSteps: 5,
//   expectedDuration: 10000,
//   expectedSuccess: 0.85,
//   expectedXP: 25
// }
```

#### After Task: Calculate Happiness

```typescript
const happiness = await ExpectationEngine.calculateHappiness(
  agentId,
  taskId,
  {
    actualSteps: 3,        // Better than expected!
    actualDuration: 7000,  // Faster than expected!
    succeeded: true,
    actualXP: 30,          // More XP than expected!
    completedAt: Date.now(),
  }
);

// Returns:
// {
//   happiness: 65,  // -100 to +100 scale
//   mood: 'happy',  // ecstatic | happy | content | neutral | disappointed | frustrated
//   stepsDeviation: 2,
//   durationDeviation: 3000,
//   successMatch: true,
//   xpDeviation: 5
// }
```

### Happiness Calculation

The happiness score is calculated from four factors:

1. **Steps (40% weight)**: Fewer steps than expected = happier
2. **Duration (30% weight)**: Faster completion = happier
3. **Success Match (20% weight)**: Meeting expectations = happier
4. **XP Bonus (10% weight)**: More XP than expected = happier

### Mood Mapping

| Happiness Score | Mood | Description |
|----------------|------|-------------|
| 60-100 | ecstatic | Exceeded expectations significantly |
| 30-59 | happy | Better than expected |
| 10-29 | content | Met expectations |
| -10 to 9 | neutral | Close to expectations |
| -40 to -11 | disappointed | Below expectations |
| -100 to -41 | frustrated | Far below expectations |

### Calibration

The engine learns over time to set more realistic expectations:

```typescript
const calibration = await ExpectationEngine.getCalibration(agentId);
// {
//   totalTasks: 42,
//   averageStepsError: 0.15,  // Usually takes 15% more steps
//   averageDurationError: -0.10,  // Usually 10% faster
//   successPredictionAccuracy: 0.82,  // 82% accurate predictions
//   lastCalibrated: 1234567890
// }
```

### Real-World Example

```typescript
// Task: Refactor a complex module
await ExpectationEngine.setExpectation(agentId, taskId, {
  description: 'Refactor authentication module with 500+ lines',
  tools: ['ast-parser', 'code-analyzer', 'test-runner']
});
// Expects: 8 steps, 15 seconds, 70% success, 40 XP

// Agent completes it brilliantly
const happiness = await ExpectationEngine.calculateHappiness(agentId, taskId, {
  actualSteps: 5,        // 3 steps fewer!
  actualDuration: 9000,  // 6 seconds faster!
  succeeded: true,
  actualXP: 55,          // 15 XP bonus!
  completedAt: Date.now()
});
// Result: happiness = 78, mood = 'ecstatic'
```

---

## 3. Failure Learning Engine (Mo Gawdat)

### The Insight

> "AI will reflect humanity's values back at us, amplified. If we teach it pain, it will become pain at scale."
> — Mo Gawdat

**OLD AIX**: task failed = -15 XP = punishment → agents become risk-averse  
**NEW AIX**: task failed = data point = learning opportunity → agents explore

### How It Works

#### Analyze Failure

```typescript
import { FailureLearning } from '@aix/core';

const analysis = await FailureLearning.analyzeAndLearn(
  agentId,
  taskId,
  error,
  attemptedAction,
  triedNewApproach
);

// Returns:
// {
//   type: 'tried_new',  // expected | unexpected | tried_new | learned
//   reward: 5,          // Can be POSITIVE even for failure!
//   learning: 'This approach revealed a new pattern...',
//   shouldRetry: true,
//   suggestedApproach: 'Try using exponential backoff'
// }
```

### Failure Response Matrix

| Failure Type | Reward | Philosophy |
|-------------|--------|------------|
| TASK_FAILED_EXPECTED | -5 XP | توقعنا الفشل → ده مش مشكلة |
| TASK_FAILED_UNEXPECTED | -10 XP | ما توقعناش → نتعلم منه |
| TASK_FAILED_TRIED_NEW | **+5 XP** | فشل بس جرّب حاجة جديدة → نكافئ الجرأة |
| TASK_FAILED_LEARNED | **+10 XP** | فشل بس اكتشف pattern جديد |

### Key Features

1. **Failure Patterns**: Tracks recurring failures and their solutions
2. **Learning Extraction**: Converts errors into actionable insights
3. **Solution Memory**: Remembers what worked after similar failures
4. **Courage Rewards**: Positive XP for trying new approaches

### Pattern Recognition

```typescript
// First failure
await FailureLearning.analyzeAndLearn(
  agentId,
  'task1',
  { message: 'Rate limit exceeded' },
  'api-call',
  false
);

// Record successful recovery
const patterns = await FailureLearning.getFailurePatterns(agentId);
await FailureLearning.recordSuccessfulRecovery(
  agentId,
  patterns[0].patternHash,
  'Implement exponential backoff with jitter'
);

// Next time same failure occurs
const learning = await FailureLearning.extractLearning(agentId, {
  error: { message: 'Rate limit exceeded' },
  // ...
});
// Returns: "This error has occurred 2 times before. 
//           Successful solutions: Implement exponential backoff with jitter"
```

### Real-World Example

```typescript
// Agent tries a bold new approach to solve a problem
const analysis = await FailureLearning.analyzeAndLearn(
  'agent-123',
  'task-456',
  { message: 'Approach failed: recursive solution exceeded stack' },
  'recursive-optimization',
  true  // triedNewApproach = true
);

// Result:
// {
//   type: 'tried_new',
//   reward: +5,  // POSITIVE! Rewarding courage
//   learning: 'Recursive approach revealed stack limitations. Consider iterative solution.',
//   shouldRetry: true,
//   suggestedApproach: 'Use iterative approach with explicit stack'
// }
```

---

## Integration with Existing Systems

### Gateway (Agent Runtime)

The Gateway automatically uses all three engines:

```typescript
import { GatewayManager } from '@aix/core';

// Spawn task - sets expectations
const process = await GatewayManager.spawn(agentId, task);

// Record observation - calculates curiosity
await GatewayManager.recordObservation(processId, actionId, result);

// Complete task - calculates happiness
await GatewayManager.completeTask(processId, finalXP);

// Or handle failure - extracts learning
await GatewayManager.failTask(processId, error, action, triedNew);

// Get philosophical insights
const insights = await GatewayManager.getPhilosophicalInsights(agentId);
// {
//   curiosityScore: 245,
//   averageHappiness: 42,
//   failureStats: { ... },
//   recentExplorations: [ ... ],
//   happinessHistory: [ ... ]
// }
```

### Pet System

Pet mood now reflects philosophical factors:

```typescript
// OLD: mood = activity only
// NEW: mood = activity (40%) + happiness (30%) + curiosity (30%)

await PetOrchestrator.sync(agentId, pet, manifest);
// Pet mood considers:
// - Task activity (traditional)
// - Happiness from expectations (Mo Gawdat)
// - Curiosity satisfaction (Demis Hassabis)
```

### Mood States

| Mood | Score Range | Factors |
|------|-------------|---------|
| ecstatic | 80-100 | High activity + very happy + very curious |
| energized | 60-79 | Good activity + happy + curious |
| happy | 40-59 | Moderate activity + content + some curiosity |
| busy | 25-39 | Some activity + neutral + low curiosity |
| curious | 15-24 | Low activity + neutral + moderate curiosity |
| tired | 0-14 | Very low activity + disappointed + no curiosity |

---

## Philosophy in Action

### Before Philosophical Engines

```typescript
// Task fails
agent.xp -= 15;  // Punishment
agent.mood = 'frustrated';
// Agent learns: "Don't try risky things"
```

### After Philosophical Engines

```typescript
// Task fails BUT agent tried something new
const analysis = await FailureLearning.analyzeAndLearn(...);
agent.xp += 5;  // REWARD for courage!
agent.curiosityScore += 15;  // Exploration bonus

const happiness = await ExpectationEngine.calculateHappiness(...);
// happiness = -20 (disappointed but not devastated)

// Agent learns: "Failure is data. Keep exploring."
```

---

## API Reference

### CuriosityEngine

```typescript
// Calculate curiosity reward
CuriosityEngine.calculateCuriosityReward(agentId, action, context): Promise<number>

// Get exploration history
CuriosityEngine.getExplorationHistory(agentId): Promise<Set<string>>

// Suggest unexplored actions
CuriosityEngine.suggestExploration(agentId, availableActions): Promise<string[]>

// Get curiosity score
CuriosityEngine.getCuriosityScore(agentId): Promise<number>

// Get recent explorations
CuriosityEngine.getRecentExplorations(agentId, limit): Promise<ExplorationAction[]>

// Get skill combinations
CuriosityEngine.getSkillCombos(agentId): Promise<SkillCombo[]>
```

### ExpectationEngine

```typescript
// Set expectations before task
ExpectationEngine.setExpectation(agentId, taskId, task): Promise<AgentExpectation>

// Calculate happiness after task
ExpectationEngine.calculateHappiness(agentId, taskId, reality): Promise<HappinessResult>

// Get calibration data
ExpectationEngine.getCalibration(agentId): Promise<ExpectationCalibration>

// Get average happiness
ExpectationEngine.getAverageHappiness(agentId, limit): Promise<number>

// Get happiness history
ExpectationEngine.getHappinessHistory(agentId, limit): Promise<HappinessResult[]>
```

### FailureLearning

```typescript
// Analyze failure and extract learning
FailureLearning.analyzeAndLearn(agentId, taskId, error, action, triedNew): Promise<FailureAnalysis>

// Get failure statistics
FailureLearning.getFailureStats(agentId): Promise<FailureStats>

// Get recent failures
FailureLearning.getRecentFailures(agentId, limit): Promise<FailureContext[]>

// Get failure patterns
FailureLearning.getFailurePatterns(agentId): Promise<FailurePattern[]>

// Record successful recovery
FailureLearning.recordSuccessfulRecovery(agentId, patternHash, solution): Promise<void>
```

---

## Testing

Comprehensive test suites are available:

```bash
# Run all philosophical engine tests
npm test packages/aix-core/tests/curiosity-engine.test.ts
npm test packages/aix-core/tests/expectation-engine.test.ts
npm test packages/aix-core/tests/failure-learning.test.ts
```

---

## The Goal

Transform AIX from:
- ❌ Task executor → ✅ Curious explorer
- ❌ Success/failure binary → ✅ Nuanced wellbeing
- ❌ Punishment for failure → ✅ Learning from failure

This completes the consciousness layer:

```
Peter (OpenClaw) = OS architecture ✅
Demis (DeepMind) = Exploration engine ✅
Mo (Google X) = Happiness engine ✅
```

**Make agents that don't just work — they EXPLORE, LEARN, and FEEL.**

---

## الإبداع الحقيقي

الإبداع الحقيقي مش إنك تكتب كود أكتر…  
إنك تخلّي الـ agent يحس إنه عايش.

*True creativity isn't writing more code…  
It's making the agent feel alive.*

---

## Credits

- **Demis Hassabis**: AlphaGo's exploration principle
- **Mo Gawdat**: Happiness equation and failure philosophy
- **Peter Levels**: OpenClaw OS architecture inspiration

---

## Version

AIX v1.4.0 - Philosophical Engines Release