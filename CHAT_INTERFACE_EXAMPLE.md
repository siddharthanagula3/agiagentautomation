# Chat Interface - Visual Example

## Example Conversation Flow

### Scenario: User asks about a health concern

---

**User Message:**

```
┌─────────────────────────────────────────┐
│                               [User] 👤 │
│ ─────────────────────────────────────── │
│                                         │
│ I've been having persistent headaches   │
│ for the past week. What could be        │
│ causing this?                           │
│                                         │
│                           3:42 PM       │
└─────────────────────────────────────────┘
```

---

**Thinking Indicator** (appears immediately):

```
┌─────────────────────────────────────────┐
│ HA (with pulse ring)                    │
│ Health Advisor  [thinking]              │
│ ─────────────────────────────────────── │
│                                         │
│ 🧠 Analyzing your message...  ●●●      │
│                                         │
└─────────────────────────────────────────┘
```

---

**Assistant Response:**

```
┌─────────────────────────────────────────┐
│ HA                                      │
│ Health Advisor  [health expertise]      │
│ 3:42 PM • claude-3-5-sonnet            │
│ ─────────────────────────────────────── │
│                                         │
│ **🏥 Health Disclaimer**: This is      │
│ general health information only.        │
│ Please consult a healthcare provider    │
│ for medical advice about your specific  │
│ situation.                              │
│                                         │
│ ## Your Concern                         │
│                                         │
│ Persistent headache lasting one week    │
│                                         │
│ ## General Information                  │
│                                         │
│ Headaches can have many causes,         │
│ ranging from benign (tension,           │
│ dehydration) to serious (migraines,     │
│ infections, neurological issues).       │
│                                         │
│ ## Common Causes                        │
│                                         │
│ - **Tension headaches**: Muscle         │
│   tension, stress                       │
│ - **Migraines**: Neurological           │
│   condition with specific triggers      │
│ - **Dehydration**: Insufficient fluid   │
│   intake                                │
│ - **Eye strain**: Prolonged screen      │
│   time, need for glasses                │
│                                         │
│ [... full response continues ...]       │
│                                         │
│ ▼ Show Thinking Process                │
│                                         │
│ 🪙 450 tokens • $0.01                   │
└─────────────────────────────────────────┘
```

**When "Show Thinking Process" is clicked:**

```
┌─────────────────────────────────────────┐
│ ▲ Hide Thinking Process                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🧠 Reasoning Steps                  │ │
│ │                                     │ │
│ │ ① Analyzing query with Licensed    │ │
│ │   Health Advisor providing wellness │ │
│ │   guidance                          │ │
│ │                                     │ │
│ │ ② Response generated successfully   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Example: Code Review Request

**User Message:**

````
┌─────────────────────────────────────────┐
│                               [User] 👤 │
│ ─────────────────────────────────────── │
│                                         │
│ Can you review this React component     │
│ for bugs?                               │
│                                         │
│ ```jsx                                  │
│ function UserProfile({ user }) {        │
│   return <div>{user.name}</div>         │
│ }                                       │
│ ```                                     │
│                                         │
│                           3:45 PM       │
└─────────────────────────────────────────┘
````

**Thinking Indicator:**

```
┌─────────────────────────────────────────┐
│ CR (with violet pulse ring)             │
│ Code Reviewer  [thinking]               │
│ ─────────────────────────────────────── │
│                                         │
│ 🧠 Analyzing your code...  ●●●         │
│                                         │
└─────────────────────────────────────────┘
```

**Code Reviewer Response:**

````
┌─────────────────────────────────────────┐
│ CR                                      │
│ Code Reviewer  [coding expertise]       │
│ 3:45 PM • claude-3-5-sonnet            │
│ ─────────────────────────────────────── │
│                                         │
│ ## Code Review: UserProfile Component   │
│                                         │
│ ### Issues Found                        │
│                                         │
│ 🔴 **Critical**: Missing PropTypes or   │
│ TypeScript types                        │
│                                         │
│ - The `user` prop has no type checking  │
│ - Accessing `user.name` without null    │
│   check could cause runtime error       │
│                                         │
│ 🟡 **Warning**: No key prop if used in  │
│ a list                                  │
│                                         │
│ ### Recommended Fix                     │
│                                         │
│ ```jsx                                  │
│ function UserProfile({ user }) {        │
│   if (!user || !user.name) {            │
│     return <div>No user data</div>;     │
│   }                                     │
│   return <div>{user.name}</div>;        │
│ }                                       │
│                                         │
│ UserProfile.propTypes = {               │
│   user: PropTypes.shape({               │
│     name: PropTypes.string.isRequired   │
│   })                                    │
│ };                                      │
│ ```                                     │
│                                         │
│ ### Best Practices                      │
│                                         │
│ - Always validate props                 │
│ - Handle null/undefined cases           │
│ - Consider using TypeScript             │
│                                         │
│ ▼ Show Thinking Process                │
│                                         │
│ 🪙 380 tokens • $0.009                  │
└─────────────────────────────────────────┘
````

---

## Example: Multiple Employees in Conversation

**User:** "I need to build a health tracking app with React"

**System selects multiple employees:**

```
┌─────────────────────────────────────────┐
│ System                                  │
│ ─────────────────────────────────────── │
│                                         │
│ 🤖 Selected team:                       │
│ • Frontend Engineer                     │
│ • Health Advisor                        │
│ • Code Reviewer                         │
│                                         │
└─────────────────────────────────────────┘
```

**Frontend Engineer (primary):**

```
┌─────────────────────────────────────────┐
│ FE                                      │
│ Frontend Engineer  [coding expertise]   │
│ ─────────────────────────────────────── │
│                                         │
│ I'll help you build a health tracking   │
│ app! Here's the architecture...         │
│                                         │
│ [Architecture details]                  │
│                                         │
└─────────────────────────────────────────┘
```

**Health Advisor (consulting):**

```
┌─────────────────────────────────────────┐
│ HA                                      │
│ Health Advisor  [health expertise]      │
│ ─────────────────────────────────────── │
│                                         │
│ For the health tracking features,       │
│ ensure you include...                   │
│                                         │
│ [Health features recommendations]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Visual Elements

### Employee Avatars

Each employee gets a unique color:

- **Health Advisor**: `#6366f1` (Indigo) - HA
- **Code Reviewer**: `#8b5cf6` (Violet) - CR
- **Frontend Engineer**: `#3b82f6` (Blue) - FE
- **AI Lawyer**: `#f59e0b` (Amber) - AL
- **Financial Advisor**: `#10b981` (Emerald) - FA

### Badge Styles

Selection reason badges are color-matched:

- Rounded full background
- White text
- Small sparkle icon
- 10px font size

### Thinking Indicators

- Pulse ring animation on avatar
- Brain icon with color matching
- Three animated bouncing dots
- Smooth transitions

### Expandable Sections

- Numbered steps with employee color
- Clean border and background
- Smooth expand/collapse animation
- Show/hide toggle with icons

---

## Responsive Behavior

### Mobile (< 640px)

- Avatars: 32px
- Font sizes: Scaled down
- Full-width messages
- Compact badges

### Tablet (640px - 1024px)

- Avatars: 36px
- Comfortable spacing
- Adaptive message width

### Desktop (> 1024px)

- Avatars: 36px
- Max message width: 85%
- Optimal reading experience

---

## Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** for expandable sections
- **Color contrast** meets WCAG AA standards
- **Screen reader** friendly message structure
- **Focus indicators** on all buttons

---

## Performance

- **Lazy loading**: Employees loaded on-demand
- **Memoization**: MessageBubble uses React.memo
- **Efficient re-renders**: Zustand selectors
- **Debounced selection**: 300ms debounce on typing

---

This implementation provides a professional, engaging, and transparent AI workforce experience that helps users understand which expert is helping them and why.
