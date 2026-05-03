# 🎨 AIX Code Visualizer

A VS Code extension that provides visual color coding for AIX framework components, making it easy to identify Meta Engine patterns, Pet Skills, Trust Chain operations, and architectural density at a glance.

## Features

🧬 **Meta Engine Detection** (Green) - Identifies recursive meta-cognitive patterns  
🐾 **Pet Skills Highlighting** (Pink) - Spots autonomous mini-app behaviors  
🔗 **Trust Chain Markers** (Gold) - Shows cryptographic verification code  
🌐 **Gateway Routing** (Cyan) - Highlights constrained routing logic  
🔥 **Multi-Function Lines** (Red Underline) - Detects lines with 2+ operations  
📊 **Real-time Density Metrics** - Shows code density in status bar  

![AIX Code Visualizer Demo](https://via.placeholder.com/800x400?text=AIX+Code+Visualizer)

## How It Works

The extension analyzes your TypeScript/JavaScript files and intelligently detects AIX patterns:

### 🧬 Meta Engine Patterns
- `meta()` function calls
- ReAct loop implementations (observe → decide → act → reflect)
- UCB1 selection algorithms
- Entropy control mechanisms
- Phase chains and recursive patterns

### 🐾 Pet Skills Patterns
- Pet skill classes: `ChronoSkill`, `VoltSkill`, `ShadeSkill`, `BullSkill`, `DropSkill`
- `PET_WATCH_RING` circular observation
- `setupPetObservation()` initialization
- Mood-based speed control (`getMoodSpeed`)
- Pet learning and observation methods

### 🔗 Trust Chain Patterns
- DNA verification
- Signature operations
- Trust chain references
- On-chain mutations
- Cryptographic verification

### 🌐 Gateway Patterns
- Gateway and router implementations
- Constrained routing logic
- Quality threshold (τ) checks
- Latency and cost constraints

### 🔥 Multi-Function Detection
Automatically detects lines performing 2+ operations:
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Short-circuit operators (`&&`, `||`)
- Array methods (`map`, `filter`, `reduce`)
- Arrow functions
- Destructuring and spread operators

## Usage

1. Install the extension
2. Open any `.ts`, `.tsx`, `.js`, or `.jsx` file with AIX code
3. Code is automatically color-coded based on patterns
4. View density metrics in the status bar
5. Click status bar for detailed density report

## Commands

- **Toggle AIX Code Highlighting** - Enable/disable highlighting
- **Analyze AIX Code Density** - Show detailed density report

## Configuration

Customize colors in your VS Code settings:

```json
{
  "aixCodeVisualizer.enable": true,
  "aixCodeVisualizer.metaEngine.textColor": "#00ff88",
  "aixCodeVisualizer.metaEngine.backgroundColor": "",
  "aixCodeVisualizer.petSkill.textColor": "#ff719b",
  "aixCodeVisualizer.petSkill.backgroundColor": "",
  "aixCodeVisualizer.trustChain.textColor": "#ffd700",
  "aixCodeVisualizer.trustChain.backgroundColor": "",
  "aixCodeVisualizer.gateway.textColor": "#4ec9b0",
  "aixCodeVisualizer.gateway.backgroundColor": "",
  "aixCodeVisualizer.multiFunction.textColor": "#ff6b6b",
  "aixCodeVisualizer.multiFunction.underlineColor": "#ff6b6b",
  "aixCodeVisualizer.showDensityMetrics": true,
  "aixCodeVisualizer.highlightEmergentPatterns": true
}
```

## Available Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `aixCodeVisualizer.enable` | Enable/disable the extension | `true` |
| `aixCodeVisualizer.metaEngine.textColor` | Color for Meta Engine patterns | `#00ff88` |
| `aixCodeVisualizer.petSkill.textColor` | Color for Pet Skills | `#ff719b` |
| `aixCodeVisualizer.trustChain.textColor` | Color for Trust Chain | `#ffd700` |
| `aixCodeVisualizer.gateway.textColor` | Color for Gateway code | `#4ec9b0` |
| `aixCodeVisualizer.multiFunction.textColor` | Color for multi-function lines | `#ff6b6b` |
| `aixCodeVisualizer.showDensityMetrics` | Show metrics in status bar | `true` |

Set any color to `""` to disable that particular styling.

## Density Report

Click the status bar item to see a detailed report:

```
🔬 AIX Code Density Report

📊 Metrics
- Total Lines: 567
- Code Lines: 400
- Multi-Function Lines: 120 (30%)

🎯 Pattern Detection
- 🧬 Meta Engine: 45 patterns
- 🐾 Pet Skills: 35 patterns
- 🔗 Trust Chain: 18 patterns

📈 Density Analysis
- Feature Density: 24.5%
- Estimated Traditional Lines: 4,000
- Reduction Factor: 10.0x

✅ Verdict
Excellent architectural density!
```

## Supported File Types

- `.ts` - TypeScript
- `.tsx` - TypeScript with JSX
- `.js` - JavaScript
- `.jsx` - JavaScript with JSX

## Examples

### Meta Engine Code
```typescript
// 🧬 Highlighted in green
export async function meta(
  agent: Agent,
  input: unknown,
  phase: Phase = 'observe',
  depth = 0
): Promise<unknown> {
  if (depth > 10) return agent.state.lastResult;
  const result = await agent.skills[phase](input);
  return meta(agent, result, PHASE_CHAIN[phase], depth + 1);
}
```

### Pet Skills Code
```typescript
// 🐾 Highlighted in pink
export const PET_WATCH_RING: Record<string, string> = {
  'bull': 'volt',
  'volt': 'shade',
  'shade': 'drop',
  'drop': 'chrono',
  'chrono': 'bull'
};

setupPetObservation(pets, bus);
```

### Multi-Function Line
```typescript
// 🔥 Red underline - 4 operations in one line
const pet = pets.get(watcher)?.learn(event) ?? defaultBehavior();
```

## Performance

- Intelligent pattern matching for fast analysis
- Minimal performance impact on VS Code
- Real-time updates as you type
- Efficient decoration management

## Requirements

- VS Code 1.100.0 or higher
- Works best with AIX framework projects

## Known Issues

- External package imports are not analyzed
- Some complex patterns may not be detected

## Inspiration

Inspired by [react-component-colors](https://github.com/SupremeDeity/react-component-colors) - we extend our gratitude for the innovative concept of visual code differentiation.

## Contributing

Found a bug or want to contribute? Visit our [GitHub repository](https://github.com/aix-framework/aix-code-visualizer).

## Release Notes

### 1.0.0

- Initial release
- Meta Engine pattern detection
- Pet Skills highlighting
- Trust Chain markers
- Gateway routing detection
- Multi-function line detection
- Real-time density metrics
- Detailed density reports

---

**Enjoy coding with better visual AIX component identification! 🚀**

Made with 🎨 by AIX Team