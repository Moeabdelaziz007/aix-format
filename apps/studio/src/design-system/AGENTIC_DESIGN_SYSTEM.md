# Agentic Design System

## Overview
The Agentic Design System emphasizes conversational interactions, clear outcomes, and minimal controls, allowing users to delegate tasks to AI instead of manually managing complex workflows.

**License**: MIT  
**Author**: typeui.sh  
**Style**: Modern, bold

---

## Design Foundations

### Visual Style
- **Aesthetic**: Modern, bold
- **Approach**: Conversational AI-first interface
- **Philosophy**: Minimal controls, maximum clarity

### Typography

#### Font Families
- **Primary**: Playfair Display (serif)
- **Display**: Playfair Display (serif)
- **Mono**: JetBrains Mono (monospace)
- **Body Fallback**: system-ui, -apple-system, sans-serif

#### Type Scale
```
14px - Small text, captions
16px - Body text
18px - Emphasized body
24px - H4, large text
32px - H3
40px - H2, H1
```

#### Font Weights
Available weights: 100, 200, 300, 400, 500, 600, 700, 800, 900

### Color Palette

#### Brand Colors
- **Primary**: `#FF5701` - Main brand color, CTAs
- **Secondary**: `#F6F6F1` - Subtle backgrounds

#### Status Colors
- **Success**: `#16A34A` - Positive actions, confirmations
- **Warning**: `#D97706` - Cautions, alerts
- **Danger**: `#DC2626` - Errors, destructive actions

#### Surface Colors
- **Base**: `#FFFFFF` - Primary surface
- **Subtle**: `#F6F6F1` - Secondary surface
- **Muted**: `#E5E5E0` - Tertiary surface
- **Emphasis**: `#FF5701` - Highlighted surface

#### Text Colors
- **Primary**: `#111827` - Main text
- **Secondary**: `#6B7280` - Supporting text
- **Tertiary**: `#9CA3AF` - Disabled/placeholder text
- **Inverse**: `#FFFFFF` - Text on dark backgrounds
- **Accent**: `#FF5701` - Highlighted text

### Spacing
**Baseline Grid**: 8pt

```
0  = 0px
1  = 8px   (1 unit)
2  = 16px  (2 units)
3  = 24px  (3 units)
4  = 32px  (4 units)
5  = 40px  (5 units)
6  = 48px  (6 units)
8  = 64px  (8 units)
10 = 80px  (10 units)
12 = 96px  (12 units)
16 = 128px (16 units)
```

---

## Accessibility Standards

### WCAG 2.2 AA Compliance
- ✅ Keyboard-first interactions
- ✅ Visible focus states (2px ring, primary color)
- ✅ Semantic HTML before ARIA
- ✅ Screen-reader tested labels
- ✅ Reduced-motion support
- ✅ 44px+ touch targets
- ✅ High-contrast support

### Focus Management
- **Focus Ring Width**: 2px
- **Focus Ring Offset**: 2px
- **Focus Ring Color**: Primary (#FF5701)
- **Keyboard Navigation**: Tab order follows visual hierarchy

### Touch Targets
- **Minimum Size**: 44px × 44px
- **Recommended**: 48px × 48px for primary actions

---

## Component Guidelines

### Button

#### Anatomy
```
[Icon?] Label [Icon?]
```

#### States
- **Default**: Base appearance
- **Hover**: Slight color shift
- **Focus-visible**: 2px ring, primary color
- **Active**: Pressed state
- **Disabled**: 50% opacity, no pointer events
- **Loading**: Spinner replaces icon, cursor-wait

#### Variants
1. **Primary**: `bg-primary`, white text
2. **Secondary**: `bg-secondary`, dark text
3. **Ghost**: Transparent background, hover shows subtle bg
4. **Danger**: `bg-danger`, white text

#### Sizes
- **Small**: 36px min-height, 12px padding
- **Medium**: 44px min-height, 16px padding (default)
- **Large**: 52px min-height, 24px padding

#### Usage
```tsx
<Button variant="primary" size="md">
  Submit
</Button>

<Button variant="secondary" loading>
  Processing...
</Button>

<Button variant="danger" leftIcon={<TrashIcon />}>
  Delete
</Button>
```

#### Accessibility
- Must have accessible label
- Disabled state uses `aria-disabled`
- Loading state uses `aria-busy`
- Focus ring must be visible

---

### Input

#### Anatomy
```
[Label]
[Helper Text?]
Input Field
[Error Message?]
```

#### States
- **Default**: Border subtle gray
- **Focus**: 2px ring, primary color
- **Error**: Border danger color, error message below
- **Disabled**: 50% opacity, no interaction

#### Accessibility
- Label must be associated with input (htmlFor/id)
- Error messages linked via `aria-describedby`
- Invalid state uses `aria-invalid`
- Helper text uses `aria-describedby`

#### Usage
```tsx
<Input
  label="Email"
  type="email"
  helperText="We'll never share your email"
  placeholder="you@example.com"
/>

<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

---

### Card

#### Anatomy
```
[Header?]
Content
[Footer?]
```

#### Variants
- **Default**: Plain white background
- **Elevated**: Shadow for depth
- **Outlined**: Border instead of shadow

#### Usage
```tsx
<Card variant="elevated" header={<h3>Title</h3>}>
  Card content goes here
</Card>
```

---

### Badge

#### Variants
- **Default**: Subtle gray
- **Success**: Green
- **Warning**: Orange
- **Danger**: Red

#### Sizes
- **Small**: 24px height
- **Medium**: 32px height

#### Accessibility
- Sufficient color contrast (4.5:1 minimum)
- Semantic meaning not conveyed by color alone

---

### Alert

#### Variants
- **Info**: Blue tones
- **Success**: Green tones
- **Warning**: Yellow/orange tones
- **Danger**: Red tones

#### Anatomy
```
[Icon] [Title?] Message [Close Button?]
```

#### Accessibility
- Uses `role="alert"` for important messages
- Icon + text for clarity (not color alone)
- Close button has `aria-label`

---

## Writing Tone

### Voice Characteristics
- **Concise**: Get to the point quickly
- **Confident**: Assertive without being aggressive
- **Helpful**: Guide users to success
- **Clear**: No ambiguity
- **Friendly**: Warm but professional
- **Professional**: Maintain credibility
- **Action-oriented**: Focus on what users can do
- **Low-jargon**: Accessible to all skill levels

### Examples

#### ✅ Do
- "Save changes"
- "Delete this item"
- "Your profile was updated"
- "Choose a compression profile"

#### ❌ Don't
- "Persist modifications to storage"
- "Remove the aforementioned entity"
- "The system has successfully processed your request"
- "Please select from the available compression methodologies"

---

## Design Rules

### Do
- ✅ Prefer semantic tokens over raw values
- ✅ Preserve visual hierarchy
- ✅ Keep interaction states explicit
- ✅ Design for empty/loading/error states
- ✅ Ensure responsive behavior by default
- ✅ Document accessibility rationale

### Don't
- ❌ Avoid low contrast text (< 4.5:1)
- ❌ Avoid inconsistent spacing rhythm
- ❌ Avoid decorative motion without purpose
- ❌ Avoid ambiguous labels
- ❌ Avoid mixing multiple visual metaphors
- ❌ Avoid inaccessible hit areas (< 44px)

---

## Implementation Guidelines

### Component States
Every interactive component must define:
1. **Default**: Base appearance
2. **Hover**: Pointer interaction feedback
3. **Focus-visible**: Keyboard navigation indicator
4. **Active**: Pressed/selected state
5. **Disabled**: Non-interactive state
6. **Loading**: Async operation in progress (if applicable)
7. **Error**: Invalid/error state (if applicable)

### Responsive Behavior
- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch targets minimum 44px on mobile
- Readable line lengths (45-75 characters)

### Motion & Animation
- **Duration**: 150ms (fast), 250ms (normal), 350ms (slow)
- **Easing**: cubic-bezier(0, 0, 0.2, 1) for exits
- **Reduced Motion**: Respect `prefers-reduced-motion`
- **Purpose**: Motion should have clear purpose (feedback, attention, relationship)

---

## Quality Checklist

### Before Shipping
- [ ] All interactive elements have visible focus states
- [ ] Touch targets are minimum 44px
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Component works with keyboard only
- [ ] Screen reader announces all important information
- [ ] Loading states are indicated
- [ ] Error states are clear and actionable
- [ ] Empty states provide guidance
- [ ] Responsive on mobile, tablet, desktop
- [ ] Respects prefers-reduced-motion
- [ ] No console errors or warnings

---

## Migration Guide

### From Previous Design System
1. Update color tokens to new palette
2. Replace font families (Inter → Playfair Display)
3. Update spacing to 8pt grid
4. Add focus rings to all interactive elements
5. Ensure 44px minimum touch targets
6. Add loading states to async actions
7. Implement error states with clear messaging

---

## Resources

### Design Tokens
See: `tokens.ts`

### Components
See: `agentic-components.tsx`

### Examples
See: `examples/` directory

---

**Last Updated**: 2026-05-02  
**Version**: 1.0.0  
**Maintainer**: Design System Team