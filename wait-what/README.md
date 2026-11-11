# Wait-What

An AI agent skill for when you're deep in conversation and suddenly realise you don't fully understand what the agent is talking about any more. Reply `wait-what` and the agent pauses what it's doing. It then walks you through what it meant, one topic at a time, in plain language and your codebase's own terms, until you're both on the same page.

## What it's for

Agents tend to miss in two ways:

- **Long replies covering many points at once.** It's hard to tell which part matters, and which is essentially filler text.
- **Short replies packed with jargon.** In trying to be concise, agents squeeze explanations into complex terms, sometimes ones they've invented, synonyms for words you do understand, or concepts that simply don't belong anywhere in your codebase.

`wait-what` fixes both by turning the explanation into a short, paced conversation in simple language.

## How it works

1. **You type `wait-what`**, optionally with what confused you (`wait-what the retry thing`).
2. **If you didn't say, the agent lists the topics** its message covered and asks which one lost you, or offers to go through them in order.
3. **It explains one topic per reply.** It gives the gist first, then the detail in Simplified Technical English (short sentences, active voice, one meaning per word), using real file and function names, a concrete example, and a diagram if one helps. Each message is 300 words at most to make things easy to digest.
4. **You correct and add context.** The explanation is designed to flow both ways - the user can correct wording, concepts, and add context that helps correct the agent where it caused confusion.
5. **Leave whenever you like.** Say "got it" or "back to work" and the agent stops, recaps what you now agree on (including any corrected terms), asks whether the task needs to change, and picks up where it left off.

## Why use it

**It goes both ways.** This isn't the agent explaining itself louder. Often the walkthrough shows that the agent misunderstood something, and that gets caught before it turns into code.

**No invented jargon.** The agent must use names that exist in your codebase (and your glossary, if you keep one like `manage-glossary`), check them before relying on them, and adopt your terms when you correct it.

**Calm and friendly.** If you're reaching for `wait-what`, you may be a bit frustrated. The agent stays clear and friendly, doesn't apologise or get defensive, and doesn't talk down to you.

## Example use cases

- *"wait-what"* after a dense summary of changes.
- *"wait-what does the 'lock TTL' part mean"* to focus on one point.
- *"wait-what, what's a hydration step?"* when a term means nothing to you.

## Credits

The approach draws on *The Pragmatic Programmer* (Hunt & Thomas), especially Topic 7, "Communicate!", and the first edition's WISDOM acrostic.
