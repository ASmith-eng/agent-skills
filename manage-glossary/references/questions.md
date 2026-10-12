# Asking questions

Ask only about what discovery couldn't settle: conflicts, collisions, and things only the user knows. Consistent findings are shown in the draft, not asked about.

## How to ask

- **Use multiple choice** (`AskUserQuestion`, or a numbered list if it isn't available), with at most four questions per batch. Group related questions in one batch.
- **Show the evidence in each question:** counts, where each variant lives, and which one is more recent. The user should be able to answer without opening the code.
- **Every question offers Unsure.** An Unsure answer becomes an Open decision in INDEX.md. It's a fine answer: the team can decide later.
- **Propose, don't ask for prose.** For a definition, propose one line and ask if it's right. For an Avoid reason, draft it into the draft instead of asking. The user should never have to write a convention from scratch.
- **Stay neutral on decisions.** Lead with the evidence, not your preference. If the evidence clearly favours one option (the other is only in old code), you may say so in the question.
- **Order by impact.** Ask about collisions first, then conflicts that cross domains, then conflicts by file count. Aim for about 12 decisions per session. Put the rest under Open decisions, and say how many are left so the user can choose to keep going.
- **Accept answers in any form.** If the user picks "Other" and explains, record their rule in their words, tidied up.

## Question shapes

**Conflict: two names for one thing**

> `Client` (12 files, mostly `legacy/`, last touched 2023) and `Customer` (40 files, active) seem to mean the same entity. Which should new code use?
> Customer / Client / They're different things / Unsure

"They're different things" leads to a follow-up: propose a one-line rule for when each applies, and ask if it's right.

**Collision: two things one word could describe**

> "Order" (the purchase and its payment status, 48 files) and "Fulfilment" (progress of the ordered service, 31 files) could both describe a booked service. Should "order" be reserved for the purchase only?
> Yes, keep them separate / They're the same concept / Unsure

**Definition: only the user knows**

> `Round` appears in 14 files under `src/scheduling/` and groups several `Visit`s for one crew. Is this right: "A crew's recurring route of visits on a fixed schedule, such as the fortnightly Tuesday lawn round"?
> Yes / Close, but… (Other) / Unsure

**Status: is it still in use?**

> `Account` (9 files, last changed 2022) overlaps with `Customer`. Is `Account` deprecated?
> Yes, use Customer / No, it's a separate concept / Unsure

**House rule**

> Data-reading functions use `get` (210) and `fetch` (95). Every `fetch` makes a network call; `get` is mixed. Is the rule "`fetch` for network calls, `get` for sync or cached"?
> Yes / No rule; either is fine / Unsure

**Paths** (Create step 6) are confirmed in one list, not one question each:

> Proposed paths: Fulfilment `src/fulfilment/**`, `src/staff-app/jobs/**`; Order `src/orders/**`, `src/checkout/**`; Customer (none: used everywhere). Correct anything that's wrong.

## Closing question

End Create with one open question:

> Are there any terms being phased out, or business terms I won't find in the code?
