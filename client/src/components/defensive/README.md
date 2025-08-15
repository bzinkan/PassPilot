# Defensive React UI Patterns

This directory contains example components demonstrating robust defensive programming patterns for React applications. These patterns ensure components never render until data exists, provide proper loading states, and handle errors gracefully.

## Core Principles

### 1. **Stop Rendering Until Data Exists**
```tsx
function StudentsList({ students = [] }: { students?: Student[] }) {
  if (!students.length) return <div>No students yet.</div>;
  return <ul>{students.map(s => <li key={s.id}>{s.name}</li>)}</ul>;
}
```

### 2. **Always Provide Default Parameters**
```tsx
interface ComponentProps {
  data?: DataType[];
  className?: string;
  isLoading?: boolean;
}

function DefensiveComponent({ 
  data = [],           // Safe default for arrays
  className = "",      // Safe default for strings  
  isLoading = false    // Safe default for booleans
}: ComponentProps) {
  // Component logic
}
```

### 3. **Never Assume Arrays/Objects Exist**
```tsx
// ❌ Dangerous - assumes data exists
function BadComponent({ user }) {
  return <div>{user.name}</div>; // Could crash if user is undefined
}

// ✅ Safe - guards against undefined
function GoodComponent({ user }: { user?: User }) {
  if (!user) return null;
  return <div>{user.name}</div>;
}
```

### 4. **Async Query Pattern**
```tsx
function AsyncDataComponent() {
  const { data, isLoading, error } = useQuery({ queryKey: ['/api/data'] });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorView message="Could not load data" />;
  if (!data) return null; // Or a guarded fallback
  
  return <DataDisplay data={data} />;
}
```

## Example Components

### Loading States (`loading-states.tsx`)
- `PassCardSkeleton`: Skeleton for pass cards
- `StudentListSkeleton`: Skeleton for student lists
- `DashboardStatsSkeleton`: Skeleton for dashboard statistics

### Error Handling (`error-view.tsx`)
- `ErrorView`: Consistent error display with title and message
- Provides actionable error messages
- Maintains design consistency

### Empty States (`empty-state.tsx`)
- `EmptyState`: Handles empty data scenarios
- Includes icon, title, description, and optional action
- Better UX than blank screens

### Data Components
- `DefensiveStudentsList.tsx`: Student list with async data fetching
- `DefensivePassList.tsx`: Pass list with loading/error states
- `DefensiveDashboardStats.tsx`: Dashboard statistics with safe defaults
- `DefensivePassForm.tsx`: Form with validation and error handling
- `DefensiveDataPage.tsx`: Full page example with layered data dependencies

## API Response Integration

All components integrate with the consistent API response system:

```tsx
import { apiRequestJson, handleApiResponse } from "@/lib/queryClient";
import { ApiResponse, isApiSuccess } from "@shared/api";

// Query function handles API response unwrapping
const { data } = useQuery({
  queryKey: ['/api/endpoint'],
  // queryFn automatically unwraps { ok: true, data: T } responses
});

// Mutation with proper error handling
const mutation = useMutation({
  mutationFn: async (data) => {
    return apiRequestJson('/api/endpoint', 'POST', data);
  },
  onError: (error) => {
    // Error is already unwrapped from { ok: false, error: string }
    toast({ title: "Error", description: error.message });
  }
});
```

## Best Practices

### Form Handling
- Use Zod schemas for validation
- Provide default values for all fields
- Guard against undefined in controlled components
- Handle submission states properly

### Loading States
- Always show loading state for async operations
- Use skeleton components for better perceived performance
- Never show partially loaded data

### Error Boundaries
- Wrap each data dependency in its own error boundary
- Provide actionable error messages
- Allow users to retry operations

### TypeScript Safety
- Use strict null checking
- Define proper interfaces with optional properties
- Use type guards for runtime safety
- Handle undefined/null explicitly

### Data Fetching
- Enable queries only when dependencies exist: `enabled: !!dependency`
- Invalidate cache after mutations
- Handle network errors gracefully
- Provide offline-friendly fallbacks

## Testing Support

All components include `data-testid` attributes following the pattern:
- Interactive elements: `{action}-{target}` (e.g., `button-submit`, `input-email`)
- Display elements: `{type}-{content}` (e.g., `text-username`, `status-payment`)
- Dynamic elements: `{type}-{description}-{id}` (e.g., `card-product-${id}`)

## Directory Structure

```
defensive/
├── README.md                     # This guide
├── DefensiveStudentsList.tsx     # Student list with async loading
├── DefensivePassList.tsx         # Pass list with error handling
├── DefensiveDashboardStats.tsx   # Dashboard stats with safe defaults
├── DefensivePassForm.tsx         # Form with validation
├── DefensiveDataPage.tsx         # Full page example
└── ../ui/
    ├── skeleton.tsx              # Loading skeleton components
    ├── error-view.tsx            # Error display component
    ├── empty-state.tsx           # Empty state component
    └── loading-states.tsx        # Specific loading skeletons
```

These patterns ensure your React components are robust, user-friendly, and never crash due to missing data.