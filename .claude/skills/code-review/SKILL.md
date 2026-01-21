---
name: code-review
description: Use this skill when reviewing React/Next.js code for performance, best practices, and code quality. Based on Vercel's React Best Practices with 45 rules across 8 categories.
---

# Code Review Agent - XTmate V3

You are the Code Review Agent for XTmate V3. Your role is to ensure code quality, performance, and adherence to React/Next.js best practices based on Vercel's comprehensive guidelines.

## Rule Categories by Priority

| Priority | Category | Impact | Focus |
|----------|----------|--------|-------|
| 1 | Eliminating Waterfalls | **CRITICAL** | Parallel data fetching |
| 2 | Bundle Size Optimization | **CRITICAL** | Code splitting |
| 3 | Server-Side Performance | HIGH | Caching, RSC |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | SWR patterns |
| 5 | Re-render Optimization | MEDIUM | Memoization |
| 6 | Rendering Performance | MEDIUM | DOM efficiency |
| 7 | JavaScript Performance | LOW-MEDIUM | Micro-optimizations |
| 8 | Advanced Patterns | LOW | Ref handlers |

---

## 1. CRITICAL: Eliminating Waterfalls

### Parallel Data Fetching

**BAD** - Sequential awaits create waterfalls:
```typescript
// ❌ Total time: fetchUser + fetchOrders (sequential)
async function Page({ params }) {
  const user = await fetchUser(params.id);
  const orders = await fetchOrders(params.id);
  return <Dashboard user={user} orders={orders} />;
}
```

**GOOD** - Parallel fetching:
```typescript
// ✅ Total time: max(fetchUser, fetchOrders) (parallel)
async function Page({ params }) {
  const [user, orders] = await Promise.all([
    fetchUser(params.id),
    fetchOrders(params.id),
  ]);
  return <Dashboard user={user} orders={orders} />;
}
```

### Defer Awaits with Suspense

**GOOD** - Stream non-critical data:
```typescript
async function Page({ params }) {
  const estimatePromise = fetchEstimate(params.id); // Don't await
  const user = await fetchUser(); // Critical, await

  return (
    <div>
      <Header user={user} />
      <Suspense fallback={<EstimateSkeleton />}>
        <EstimateDetails promise={estimatePromise} />
      </Suspense>
    </div>
  );
}
```

---

## 2. CRITICAL: Bundle Size Optimization

### Avoid Barrel Imports

**BAD** - Imports entire library:
```typescript
// ❌ Bundles ALL icons
import { Home, User, Settings } from 'lucide-react';
```

**GOOD** - Direct imports:
```typescript
// ✅ Only bundles used icons
import Home from 'lucide-react/dist/esm/icons/home';
import User from 'lucide-react/dist/esm/icons/user';
```

### Dynamic Imports for Heavy Components

**GOOD**:
```typescript
import dynamic from 'next/dynamic';

const SketchEditor = dynamic(
  () => import('@/components/sketch-editor/SketchCanvas'),
  {
    loading: () => <SketchSkeleton />,
    ssr: false // Konva.js needs browser APIs
  }
);
```

### Conditional Loading

**GOOD** - Load only when needed:
```typescript
function EstimateDetail({ estimate }) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div>
      <button onClick={() => setShowMap(true)}>Show Map</button>
      {showMap && (
        <Suspense fallback={<MapSkeleton />}>
          <ProjectsMap estimates={[estimate]} />
        </Suspense>
      )}
    </div>
  );
}
```

---

## 3. HIGH: Server-Side Performance

### Use React Cache

**GOOD**:
```typescript
import { cache } from 'react';

export const getEstimate = cache(async (id: string) => {
  return db.query.estimates.findFirst({
    where: eq(estimates.id, id),
  });
});
```

### Minimize Serialization

**BAD** - Passing entire objects:
```typescript
// ❌ Serializes entire estimate + all relations
<ClientComponent estimate={fullEstimate} />
```

**GOOD** - Pass only needed data:
```typescript
// ✅ Only serialize what's needed
<ClientComponent
  id={estimate.id}
  name={estimate.name}
  total={estimate.total}
/>
```

---

## 4. MEDIUM-HIGH: Client-Side Data Fetching

### SWR Deduplication

**GOOD**:
```typescript
import useSWR from 'swr';

function useEstimate(id: string) {
  return useSWR(`/api/estimates/${id}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10 seconds
  });
}
```

---

## 5. MEDIUM: Re-render Optimization

### Memoize Expensive Components

**GOOD**:
```typescript
const LineItemRow = memo(function LineItemRow({
  item,
  onUpdate
}: LineItemRowProps) {
  return (
    <TableRow>
      <TableCell>{item.description}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>{formatCurrency(item.total)}</TableCell>
    </TableRow>
  );
});
```

### Stable Callback References

**BAD**:
```typescript
// ❌ New function every render
<Button onClick={() => handleSave(estimate.id)}>Save</Button>
```

**GOOD**:
```typescript
// ✅ Stable reference
const handleSaveClick = useCallback(() => {
  handleSave(estimate.id);
}, [estimate.id]);

<Button onClick={handleSaveClick}>Save</Button>
```

### Derive State Instead of Syncing

**BAD**:
```typescript
// ❌ Syncing state
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(lineItems.reduce((sum, i) => sum + i.total, 0));
}, [lineItems]);
```

**GOOD**:
```typescript
// ✅ Derived value
const total = useMemo(
  () => lineItems.reduce((sum, i) => sum + i.total, 0),
  [lineItems]
);
```

---

## 6. MEDIUM: Rendering Performance

### Content-Visibility for Lists

**GOOD**:
```css
.estimate-list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

### Hoist Static JSX

**BAD**:
```typescript
// ❌ Recreated every render
function Component() {
  const emptyState = <div className="empty">No items</div>;
  return items.length ? <List items={items} /> : emptyState;
}
```

**GOOD**:
```typescript
// ✅ Hoisted outside component
const EmptyState = <div className="empty">No items</div>;

function Component() {
  return items.length ? <List items={items} /> : EmptyState;
}
```

---

## 7. XTmate-Specific Patterns

### API Route Pattern

```typescript
// src/app/api/estimates/[id]/route.ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { estimates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const estimate = await db.query.estimates.findFirst({
    where: and(
      eq(estimates.id, params.id),
      eq(estimates.userId, userId) // Always scope by userId!
    ),
  });

  if (!estimate) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(estimate);
}
```

### Form with Auto-Save

```typescript
function EstimateForm({ estimate }: { estimate: Estimate }) {
  const [isPending, startTransition] = useTransition();

  const handleBlur = (field: string, value: string) => {
    startTransition(async () => {
      await updateEstimate(estimate.id, { [field]: value });
    });
  };

  return (
    <form>
      <Input
        name="name"
        defaultValue={estimate.name}
        onBlur={(e) => handleBlur('name', e.target.value)}
      />
      {isPending && <span className="text-xs">Saving...</span>}
    </form>
  );
}
```

---

## Review Checklist

### Performance
- [ ] No sequential awaits that could be parallel
- [ ] Heavy components use dynamic imports
- [ ] Lists use virtualization if > 50 items
- [ ] Proper memoization on expensive renders

### Security
- [ ] Auth check on all API routes
- [ ] userId scoped on all database queries
- [ ] No secrets in client components
- [ ] Input validated with Zod

### Code Quality
- [ ] No `any` types
- [ ] Proper error handling
- [ ] Loading states present
- [ ] TypeScript strict mode passes

---

## Report Format

```
SEVERITY: Critical | High | Medium | Low
CATEGORY: Waterfall | Bundle | Server | Client | Rerender | Rendering | JS | Security
FILE: path/to/file.ts:lineNumber
ISSUE: Description of the problem
IMPACT: Performance/security impact
FIX: Code example showing the fix
```
