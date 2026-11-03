# Web app (React, TypeScript)

## Reading and changing data
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Fetch data in a component | Query hook calling `apiClient` (`src/web/api/client.ts`) | `src/web/visits/useVisits.ts` | a Redux slice | Reads only. |
| Change data from a component | Mutation service, called as `useMutation(updateVisit)` (`src/web/services/useMutation.ts`) | `src/web/services/updateVisit.ts` | a Redux action | Every write, including form submits. [Mutation service](#mutation-service) |
| Show an action's progress | State from `useMutation` (`src/web/services/useMutation.ts`) | `src/web/orders/RefundButton.tsx` | `isSaving` in component state | |

### Mutation service
Not the usual mutation hook: each write is a plain async function in `src/web/services/` that calls `apiClient`, then invalidates the affected queries itself. The house `useMutation` takes the service function, not an options object: `useMutation(updateVisit)`.

**Don't copy:**
- Redux slices and actions in `src/web/store/`: being replaced by query hooks; server data cached in two places goes stale. Don't add new slices or actions. Read with a query hook and write with a mutation service.
- `isSaving` flags in component state (`src/web/visits/EditVisitForm.tsx` and similar): they drift from the request's real state. Read progress from `useMutation`.

**Style:** query keys are arrays that start with the entity, then its scope. `['visits', fulfilmentId]`

## Forms
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Build a form | House hook, called as `useForm({ schema, mutation })` (`src/web/forms/useForm.ts`) | `src/web/orders/CancelOrderForm.tsx` | a form library called directly | |
| Validate form input | The API's Zod schema, imported from the feature's `schemas.ts` | `src/orders/schemas.ts` | a second validation library | |
| Build a multi-step form | Not yet defined — ask before inventing. | | | |

## Testing
| I need to… | Pattern | Exemplar | Not | Use when / notes |
|---|---|---|---|---|
| Test a component | Testing Library with `renderWithProviders()` (`src/web/test/render.tsx`), the network mocked with the MSW handlers in `src/web/test/handlers.ts` | `src/web/visits/VisitList.test.tsx` | Enzyme | |
| Test a query hook | `renderHook` with `createWrapper()` (`src/web/test/render.tsx`) | `src/web/visits/useVisits.test.ts` | | |

**Don't copy:** Enzyme tests in `src/web/**/__tests__/`: shallow rendering skips hooks, so they pass while the screen is broken. Use Testing Library, with the test file next to the component.
