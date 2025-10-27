# P{number}: {UI Component/Feature Title}

**Created:** YYYY-MM-DD
**Priority:** High | Medium | Low
**Estimate:** {time estimate}
**Agent:** Codex (Web UI)
**Type:** UI Development | API Implementation

## Context

{UI/UX 요구사항 설명}

**Related Issues:**
- #{issue_number}

**Dependencies:**
- Backend API: `prompts/P{number-1}-claude-{description}-api.md`
- Design mockups: {link if available}
- API Documentation: {link}

**User Story:**
> As a {user type}, I want to {action}, so that {benefit}.

## Task

### 1. UI Components

**Component Structure:**
```
src/components/
  {ComponentName}/
    index.tsx
    {ComponentName}.tsx
    {ComponentName}.test.tsx
    {ComponentName}.module.css
    types.ts
```

**Components to Build:**
1. **{ComponentName}**
   - Purpose: {what it does}
   - Props:
     ```typescript
     interface {ComponentName}Props {
       prop1: string;
       prop2: number;
       onAction: () => void;
     }
     ```
   - State:
     - {state variables needed}
   - Behavior:
     - {user interactions}

2. **{SubComponent}** (if needed)
   - {description}

### 2. API Integration

**Endpoints to Use:**
```typescript
// GET /api/v1/resource
const fetchData = async () => {
  const response = await api.get('/api/v1/resource');
  return response.data;
};

// POST /api/v1/resource
const createData = async (data: CreateRequest) => {
  const response = await api.post('/api/v1/resource', data);
  return response.data;
};
```

**Error Handling:**
- Loading states
- Error messages
- Empty states
- Retry logic

### 3. Styling

**Requirements:**
- Responsive design (mobile, tablet, desktop)
- Dark mode support (if applicable)
- Accessibility (WCAG 2.1 AA)
- Browser compatibility (latest 2 versions)

**Design Tokens:**
```css
/* Use existing design system */
--primary-color: ...
--spacing-unit: ...
--border-radius: ...
```

### 4. Testing

**Unit Tests:**
```typescript
describe('{ComponentName}', () => {
  it('renders correctly', () => { ... });
  it('handles user interaction', () => { ... });
  it('displays error state', () => { ... });
  it('displays loading state', () => { ... });
});
```

**Integration Tests:**
- API mocking
- User flow testing

## Success Criteria

- [ ] All UI components implemented
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] API integration complete and tested
- [ ] Loading/error/empty states handled
- [ ] Unit tests written (>80% coverage)
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance optimized (< 100ms render time)
- [ ] Code follows React/TypeScript best practices
- [ ] No console errors or warnings
- [ ] Cross-browser tested

## Technical Specifications

### Component API

```typescript
// Props interface
export interface {ComponentName}Props {
  data: ResourceData[];
  onItemClick: (id: string) => void;
  loading?: boolean;
  error?: Error;
}

// Component
export const {ComponentName}: React.FC<{ComponentName}Props> = ({
  data,
  onItemClick,
  loading = false,
  error
}) => {
  // Implementation
};
```

### State Management

```typescript
// Using React Query (example)
const { data, isLoading, error } = useQuery({
  queryKey: ['resource'],
  queryFn: fetchResource
});

// Or useState for local state
const [isOpen, setIsOpen] = useState(false);
```

### Styling Approach

- CSS Modules ✅
- Styled Components ✅
- Tailwind CSS ✅
- Plain CSS ✅

(Pick one consistent with project)

## STOP Rules

**If any of these occur, STOP and document in PR:**

1. **API not ready**: Backend endpoints not available → Mock data and continue
2. **Design unclear**: UI/UX requirements ambiguous → Create mockup and request approval
3. **Performance issues**: Component too slow → Document and optimize
4. **Accessibility blockers**: Cannot meet WCAG standards → Document and request guidance
5. **Browser incompatibility**: Feature not supported → Document and propose polyfill

## Related

- Branch: `codex/ui-{component}` or `codex/api-{endpoint}`
- Base: `main` or `claude/feature-{description}`
- Backend Prompt: `prompts/P{number-1}-claude-{description}-api.md`
- API Docs: `/api-docs` or Swagger UI
- Design: {link to Figma/mockups}

---

## DONE (YYYY-MM-DD)

_(To be filled after completion)_

**Summary:** [Brief description of UI implementation]

**Changes:**
- Components: [list of components created]
- API Integration: [endpoints integrated]
- Styling: [CSS/styling approach used]
- Tests: [test files created, coverage achieved]

**Evidence:**
- Commit: [commit hash]
- Branch: `codex/ui-{component}`
- PR: #{PR_number}
- Screenshots:
  - Desktop: {link or inline}
  - Mobile: {link or inline}
  - Tablet: {link or inline}
- Test Results:
  ```
  Tests: 28 passed, 28 total
  Coverage: 82%
  ```
- Performance:
  - Initial render: < 50ms
  - Re-render: < 20ms
- Lighthouse Score:
  - Performance: 95+
  - Accessibility: 100
  - Best Practices: 95+

**Integration:**
- Merged with: `claude/feature-{description}` or `main`
- API endpoints tested: ✅
- Responsive design verified: ✅
- Accessibility tested: ✅

**Notes:**
- [Browser compatibility notes]
- [Accessibility considerations]
- [Performance optimizations applied]
- [Known issues or limitations]
- [Future improvements]
