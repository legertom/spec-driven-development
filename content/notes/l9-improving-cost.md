## Talking points

- Start with the bill: $3,000 a month for a shop that makes $8,000. Do the token multiplication on the board so the number is real, then point at the 89% that is input.
- The square: you resend the whole conversation on every call, so cost grows roughly with the square of the length. Six calls, and turn one is paid for six times.
- Profiling comes from traces. Lesson 2 paid for this lesson; say so.
- Fixes in order of safety: caching (free, no behavior change), tool-schema trimming, retrieval depth, history trimming, shorter outputs. Each fix is an experiment with two readouts, dollars and suite accuracy. Log the reverts.
- Cascades: cheap model first, escalate on a threshold, and the threshold comes from labeled data or the cascade saves money by silently getting worse.
- Weights: distillation, SFT, RL only when prompt search is flat, failures are capability limits, and the savings pay for owning a model. Most teams never need this rung.
- The upgrade drill: configs are files, a new model is a re-run of the suite, a redrawn frontier, and a written deploy / keep / retire decision.

## Live demo idea

Take one real trace and show the token counts per span in the tracing UI. Add up the system prompt, the tool schemas, the history, and the retrieved chunks for one call, then multiply by the number of calls. Turn on prompt caching for the stable prefix, re-run the same scenario, and show the cache-read token count in the usage fields and the cost difference. Then lower retrieval from k = 10 to k = 3 and run the retrieval eval to show recall barely moved.

## Common misconceptions

- "Cheaper model means worse; expensive means better." Measure on your suite. Some upgrades cost more for the same accuracy.
- "Caching is automatic." It is a prefix match; a timestamp at the top of the prompt defeats it.
- "Shorter replies are the big win." Output is about a tenth of the bill in the example.
- "A cascade is free accuracy." Uncalibrated, it is a way to get worse without noticing.
- "Fine-tuning is the professional move." It is the last rung and adds a whole system to maintain.

## Timing

Sections 1 and 2: 15 minutes. Section 3 with the live caching demo: 15 minutes. Section 4: 10 minutes. Section 5: 5 minutes. Section 6: 10 minutes. Homework briefing: 5 minutes. Total 60 minutes.

## If you only have 20 minutes

Sections 1, 3 (caching and history), and 6: where the money goes, the two safest fixes, and the upgrade drill. Assign routing and the weights track as reading.
