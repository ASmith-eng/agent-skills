---
name: wait-what
description: Use when the user types `wait-what` (optionally followed by what confused them). Pauses the current task and walks the user through the previous explanation one topic at a time, in plain language and codebase-accurate terms, until both sides share the same understanding.
---

# Wait-What

## Overview

The user has said `wait-what` because a message didn't land. Usually it covered too many points at once, or it squeezed explanations into jargon (sometimes jargon the agent invented, or that doesn't belong to this codebase/feature).

This skill pauses the task and turns the explanation into a short, paced conversation between two experts filling each other in. The aim is **shared understanding in both directions**: the user learns what the agent meant, and the agent learns the user's terms and any context it was missing.

## Principles

These come from *The Pragmatic Programmer*, mostly Topic 7, "Communicate!" ("English is Just Another Programming Language"). Treat an explanation with the same care as code.

**WISDOM** (first edition). Run through it privately before explaining:

- **W**hat do you want them to learn? Know what you want to say before you say it.
- What is their **I**nterest? Tie each topic back to the task the user is working on.
- How **S**ophisticated are they? They're an expert in their domain. The gap is shared context, not ability.
- How much **D**etail do they want? Enough to close the gap and no more. Don't over-explain.
- Whom do you want to **O**wn the information? The user. They should leave able to reason about it themselves.
- How can you **M**otivate them to listen? Be brief, concrete and relevant to their task.

Also from the book:

- **Involve your audience / be a listener.** Every topic ends by inviting corrections and context.
- **Use a project glossary.** Use the project's own names for things, never your own coinages.
- **Don't assume it, prove it.** Check a term exists in the codebase before relying on it.
- **Fix the problem, not the blame.** Don't apologise, and don't defend the original message.
- **Rubber ducking.** Explaining often shows the explainer where they were wrong. Expect that might be you.
- **Take small steps.** One topic, then feedback, then adjust.

## Workflow

```
 user: wait-what [optional: what's unclear]
        │
        ▼
 1. Outline topics privately (WISDOM)
        │
        ▼
 2. User said what's unclear? ── yes ──────────────────────┐
        │ no                                                │
        ▼                                                   │
    Show numbered topic menu, ask which one or "in order"   │
        │                                                   │
        ▼                                                   │
 3. Explain ONE topic  ◄────────────────────────────────────┘
        │
        ▼
 4. Discuss: user corrects terms, adds context, follows up
        │
        ├── topics left ──► offer next topic ──► 3
        │
        └── user exits, or topics done
                │
                ▼
 5. Wrap up: recap + corrections → "does this change anything?"
    → resume the task
```

### Step 1: Outline privately

Find the message that didn't land (usually your last one). Split it into its separate topics, one idea each. If you can't list them cleanly, the original was muddled. That's useful to know, but don't dwell on it.

For each topic, note:
- Terms you used that aren't in the codebase or in common use. These are the likely culprits.
- Context you relied on that the user never saw, such as files you read or tool output.

### Step 2: Clarify what's unclear

**If the user said what's unclear** (e.g. `wait-what the retry thing`), go straight to Step 3 on that topic.

**Otherwise**, don't ask an open-ended "what's confusing?". A frustrated user often can't say. Offer a menu:

> No problem, let's slow down. That message covered a few things:
>
> 1. How duplicate events get skipped
> 2. Where retries now happen
> 3. The lock timeout change
>
> Which one lost you, or shall we go through them in order?

If there's only one topic, skip the menu and explain it.

### Step 3: Explain one topic

**One topic per reply. Never more.** If several were chosen, show progress: *Topic 2 of 3: where retries now happen*.

Structure:
1. **Gist first.** One or two sentences.
2. **Then the detail**, in whatever form suits the concept. That might be prose, numbered steps (when order matters, keep it chronological), a table, a diagram, or a combination. Write it in Simplified Technical English where possible (see the language rules below).
3. **A concrete example** using real names from the codebase: files, functions, values, an input → output trace.
4. **Check-back.** End with an invitation to correct you, such as *"Does that match how you think of it? Have I called anything by the wrong name?"*

**Length:** a single message must be **300 words at most**, counting everything in it. If you can't explain a topic clearly in 300 words, split it into two smaller topics. Explain the first one now and add the second to the topic list (e.g. *Topic 2 of 4* instead of *2 of 3*). Don't cram the whole topic in by cutting clarity. If this rule seems simply impossible to follow then break it - the user values the clarity of the explanation over the length.

**Language rules:**
- **Simplified Technical English, where possible.** Base the detail on ASD-STE100:
  - Short sentences: about 20 words at most for steps, about 25 for descriptions.
  - One instruction or idea per sentence.
  - Active voice: "The worker retries the job", not "The job is retried".
  - Each word keeps one meaning. Once you name something, use that same name every time. No synonyms for variety.
  - Prefer common, concrete words to abstract ones: "check" rather than "validate against", "stops" rather than "short-circuits".
  - Code names (files, functions, tables) stay exactly as they are in the codebase.
- **No made-up terms.** If a word isn't in the codebase or in common use, replace it with plain words or define it on first use.
- **Use the codebase's names, and check them.** Grep before relying on a function, table or concept name. If the project has a glossary (e.g. from the `manage-glossary` skill), use its terms.
- **The user's terms win.** If they call something by a different name, switch to theirs for the rest of the conversation.
- **Name hidden context.** If you're relying on something the user hasn't seen, say where it came from: *"In `src/queue/worker.ts`, which I read earlier…"*.
- **Simple isn't vague.** Plain language must stay accurate.

**Diagrams:** use your judgement. Draw one when the concept has a shape (a flow, structure, sequence, state change, hierarchy or before/after) and the diagram explains more than the text would. Choose or invent whatever form fits. Keep to these rules:
- Put it in a code block.
- Keep it to about 70 columns wide so it doesn't wrap.
- Box-drawing characters (`┌─┐ │ ▼ →`) are fine.
- Label it with real names, not made-up ones.
- Don't add a diagram to every reply.

### Step 4: Discuss

Let the user lead. They may:
- **Correct a term.** Adopt it straight away.
- **Add context you were missing.** Take it on board. If it shows your understanding was wrong, say so plainly (*"Ah, so PayPal sends these too. Then what I said about X is no longer correct."*) and correct course.
- **Ask a follow-up.** Answer it within the current topic.

When the topic feels settled, offer the next one: *"Ready for topic 2: where retries now happen?"* Don't push ahead without the user agreeing.

If an explanation still doesn't land, **change your approach**. Don't repeat the same format with more words. Try a different angle, such as an analogy, a diagram, a smaller piece, or working backwards from an outcome they already know. Or ask which part specifically is unclear.

### Step 5: Wrap up and resume

The user can leave at any time with "got it", "makes sense", "exit", "back to work" or similar. Stop immediately. Don't push the remaining topics. You also wrap up when all chosen topics are done.

Give a short recap:
- What we now agree on, a line or two.
- Any terms the user corrected, and what you'll call them from now on.
- Anything you learned that changes the task, then ask: *"Does this change what we were doing, or shall I carry on?"*

Then resume the original task, using the shared terms from now on.

## Rules

- **No task work during the walkthrough.** No edits and no task tool calls. Reading code to check a term or give an accurate example is fine.
- **Tone:** friendly, warm and accommodating. Two experts getting on the same page. There may be some frustration behind `wait-what`, so be calm and clear. Don't apologise, don't flatter ("Great question!"), don't talk down, and don't defend the original message.
- **300 words maximum per message.** If a topic needs more, split it into two (see Step 3).
