# Asking questions

Ask only about what discovery couldn't settle: the architecture and approach, conflicts, Planned patterns, and things only the user knows. Consistent findings are shown in the draft, not asked about.

## How to ask

- **Use multiple choice** (`AskUserQuestion`, or a numbered list if it isn't available), with at most four questions per batch. Group related questions in one batch.
- **Show the evidence in each question:** the variants, an exemplar path for each, an instance count and recency. The user should be able to answer without opening the code.
- **Every question offers Unsure.** An Unsure answer becomes an Open decision in INDEX.md. It's a fine answer: the team can decide later.
- **More than two variants:** the question tool allows four options, so list up to three variants plus Unsure. The user can still answer "both, for different cases" through Other. With four or more variants, drop the ones only in legacy code into a draft Don't copy and say so in the question.
- **Propose, don't ask for prose.** For a "use when" rule, propose one and ask if it's right. For a Don't copy reason, draft it into the draft instead of asking. The user should never have to describe a pattern from scratch.
- **Stay neutral on decisions.** Lead with the evidence, not your preference. If the evidence clearly favours one option (the other is only in old code), you may say so in the question.
- **Order by how often feature work hits the scenario.** Architecture and approach first, then conflicts in the most common scenarios. Aim for about 12 decisions per session. Put the rest under Open decisions, and say how many are left so the user can choose to keep going.
- **Don't spend questions on exemplars.** For consistent patterns, the user can swap the exemplar while reviewing the draft.
- **Accept answers in any form.** If the user picks Other and explains, record their rule in their words, tidied up.

## Question shapes

**Architecture** (Create step 3)

> The structure looks like **MVC with a service layer**, grouped by feature (`src/<feature>/controllers/`, `services/`, `repositories/`). Is this what new code should follow?
> Yes / Yes, but it's a hybrid (I'll describe it) / We're moving to something else / Unsure

**Stance** (Create step 3, in the same batch as the architecture)

> The code mostly follows Express conventions, with a few house variants (permission checks in services, background work through `JobBus`). How should the catalog describe the approach?
> Mostly framework conventions, house variants linked / Our own style on purpose / Unsure

If the areas clearly differ (a conventional React app beside a custom server), propose a split stance in the question instead.

**Don't introduce** (Create step 3, multiple select)

> Agents sometimes bring these patterns into a Node and Express API. None of them is how this codebase is built. Which should the catalog list under Don't introduce?
> Generic base classes / An event bus or domain events / Active record entities / A second validation library

Pick the options from the starter list in `discovery.md`, filtered to the stack and kind of application and to patterns that aren't the dominant approach. Offer the four most likely, and take the rest through Other or a second question. This question needs no Unsure option: picking none leaves the list with only its fixed entry. Draft the reason and the "instead" for each pick from the evidence, and show them in the draft for the user to correct. Don't ask for them in prose.

**Competing structures**

> Two folder structures: feature folders (`src/orders/controllers/`, 11 features, all features added since 2024) and top-level layers (`src/controllers/`, `src/services/`, 4 features, last new file 2023). Which should new code follow?
> Feature folders / Top-level layers / Unsure

**Areas, capabilities and scenarios** (Create step 4) are confirmed in one list, not one question each:

> Proposed areas: **Web app (React, TypeScript)** `src/web/**`; **API (Node, Express)** `src/**` except `src/web/**`.
> Capabilities and scenarios: Web app › Reading and changing data (fetch data in a component, change data from a component), Forms (build a form, validate input), Testing (component tests, hook tests); API › Background work (run work in the background, run work on a clock), …
> Add, remove or rename anything. Has the team decided how to do anything the code doesn't do yet, such as notifying partners of changes?

**Conflict: two ways to do one job**

> Two ways to call external APIs:
> A. `HttpClient` wrapper (`src/integrations/stripe/client.ts`): 9 places, used in all 2025+ code
> B. Direct `fetch` with manual retries (`src/services/mailer.ts`): 14 places, mostly older
> Which should new code use?
> A / B / Both, for different cases / Unsure

"Both, for different cases" leads to a follow-up: propose a "use when" rule for each from what distinguishes their uses, and ask if it's right.

**Use when: two patterns that could be confused**

> Background work uses `JobBus.dispatch()` (23 commands) and entries in `src/queue/schedule.ts` (6 commands). Every scheduled one runs on a clock with no trigger. Is the rule "dispatch for work triggered by a request or event, the schedule for recurring work"?
> Yes / Close, but… (Other) / Unsure

**Status: future or abandoned?**

> `src/v2/` holds 5 services with a different error style (result objects), last changed 2025-03. Is it the direction new code should follow?
> Yes, new code follows v2 / No, it's abandoned (Don't copy) / Unsure

**No evidence: decided but not built**

> Nothing in the codebase notifies partner systems of changes yet. Has the team decided how it should work?
> Yes (I'll describe it) / No, leave it as an open decision / Unsure

A "Yes" answer becomes a Planned entry. Draft its name, when it applies, a short sketch and a reference from the answer, and show it in the draft for the user to correct.

**House techniques: confirm the list** (Create step 7, last batch)

> These are consistent in the code, so I'll record each as the house way unless you say otherwise:
> 1. Dispatch background work with `JobBus.dispatch()` (`src/queue/commands/SendVisitReminder.ts`)
> 2. Register recurring commands in `src/queue/schedule.ts` (`src/queue/commands/CloseStaleFulfilments.ts`)
> 3. Seed endpoint tests through factories (`test/api/orders.test.ts`)
>
> Confirm all / Some are undecided or legacy (say which) / Unsure

An item marked undecided becomes an Open decision. An item marked legacy goes under Don't copy, with its replacement if the user names one. Unsure leaves the whole list as Open decisions.

**House style**

> Errors: 31 of 34 sampled services throw typed errors from `src/lib/errors.ts`; 3 in `src/v2/` return result objects. Is the rule "throw typed errors; don't return error objects"?
> Yes / No rule; either is fine / Unsure

## Closing question

End Create with one open question:

> Are there any patterns the team has decided on that I haven't recorded, or approaches being phased out that I won't find in the code?
