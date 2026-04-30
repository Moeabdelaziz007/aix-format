# AIX Studio Design System

The AIX Studio Design System is a set of UI primitives and tokens built on top of **Vanilla CSS**, **Framer Motion**, and **Tailwind CSS**. It is designed to provide a high-fidelity, "Sovereign AI" aesthetic (vibrant colors, glassmorphism, and smooth animations).

## Core Tokens

Located in `src/design-system/tokens.ts`.

- **Colors**:
  - `primary`: Vibrant blue (#3b82f6)
  - `purple-mcp`: Deep purple (#8b5cf6)
  - `danger`: Red (#ef4444)
  - `success`: Emerald (#10b981)
  - `warning`: Amber (#f59e0b)
  - `background`: Dark indigo-black (#060812)
  - `surface-1`: #0a0c1a
  - `surface-2`: #121426
  - `surface-3`: #1a1c33

## Primitives

Located in `src/design-system/components.tsx`.

### Typography

Use the `Typography` component for all text elements to ensure consistent hierarchy and font scaling.

```tsx
import { Typography } from "@/design-system/components";

<Typography variant="h1" gradient>Sovereign AI</Typography>
<Typography variant="h2">The Future is Here</Typography>
<Typography variant="body">Trust infrastructure for agents.</Typography>
<Typography variant="caption">v1.2.0-STABLE</Typography>
```

- **Variants**: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `body`, `caption`, `code`.
- **Props**:
  - `gradient`: Boolean. Applies the AIX primary-to-purple gradient.
  - `weight`: `regular`, `medium`, `semibold`, `bold`.

### Buttons

Animated button primitives with built-in hover/tap effects.

```tsx
import { Button } from "@/design-system/components";

<Button variant="primary">Connect Wallet</Button>
<Button variant="secondary">Learn More</Button>
<Button variant="purple" size="lg">Deploy Agent</Button>
```

- **Variants**: `primary`, `secondary`, `ghost`, `danger`, `purple`.
- **Sizes**: `sm`, `md`, `lg`.
- **Props**:
  - `isAnimated`: Boolean (default `true`). Enables Framer Motion hover/tap animations.

### Layout

Standardized layout containers for sections and pages.

```tsx
import { Section, Container, SectionHeader } from "@/design-system/components";

<Section background="dark" padding="lg">
  <Container>
    <SectionHeader 
      title="How It Works" 
      subtitle="The trust layer for machine-to-machine interactions."
      alignment="center" 
    />
    {/* Content */}
  </Container>
</Section>
```

- **Section**:
  - `background`: `dark`, `surface-1`, `surface-2`.
  - `padding`: `none`, `sm`, `md`, `lg`.

### Cards

Glassmorphic card containers with elevation levels.

```tsx
import { Card } from "@/design-system/components";

<Card elevation={2}>
  <Typography variant="h4">Agent Identity</Typography>
</Card>
```

- **Elevation**: `1`, `2`, `3`. (Determines background color and border opacity).

### Badges

Semantic status indicators.

```tsx
import { Badge } from "@/design-system/components";

<Badge variant="success">Verified</Badge>
<Badge variant="outline">v1.2.0</Badge>
```

- **Variants**: `default`, `success`, `warning`, `danger`, `outline`.

## Usage Guidelines

1. **Avoid Hardcoded Colors**: Always use Tailwind classes that map to our tokens (e.g., `bg-surface-1`, `text-primary`).
2. **Animation**: Most primitives have built-in `framer-motion` support. Prefer these over raw `motion.div` for standard UI elements.
3. **Typography**: Do not use raw `<span>` or `<p>` tags for UI text. Use `Typography` to maintain the "Sovereign" font scale.
