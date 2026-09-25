---
slug: l9-improving-cost
number: "L9"
title: "Improving Agents: Cost"
module: 5
moduleTitle: "Improving Agents"
verb: Improve
minutes: 60
prereqs: ["l8-improving-accuracy"]
summary: "Profile where the tokens go, cut cost with caching, trimming, routing, and cascades calibrated on labeled data, and run the upgrade drill when a new model ships."
objectives:
  - "Profile cost per conversation from traces and find the usual suspects: history growth, retrieval depth, and repeated tool schemas."
  - "Apply prompt caching, history trimming, retrieval limits, schema dedupe, and shorter outputs, measuring each change with the suite."
  - "Calibrate a model cascade on labeled data and choose the threshold that clears the accuracy floor."
  - "Decide when a weights track (distillation, SFT, RL) is justified, and when it is not."
  - "Run the upgrade drill when a model ships: re-run the suite on committed configs, redraw the frontier, and deploy, keep, or retire."
keyTerms: ["cost-profile", "history-growth", "prompt-caching", "model-routing", "cascade", "calibration", "token-reduction", "distillation", "sft", "rl", "weights-track", "upgrade-drill", "frontier-config"]
---

## Why this matters

Sprout works. The optimized config from L8 scores 92% on the suite, the CI gate is green, and Maya says the refund escalations finally make sense. Then the invoice arrives: $3,000 for the month. Pip's Plant Shop made $8,000 in the same month. Pip does not say no. Pip asks a better question: "Can it be cheaper without getting worse?"

Dev opens the billing page and sees one number, with no breakdown by conversation, turn, or tool. The traces from L2 have that breakdown, down to the token. This lesson turns them into a cost profile, a list of fixes with measured savings, and a rule for "without getting worse": the suite decides, not a feeling.

## 1. Where the money goes

Every model call is billed the same way:

`cost = input tokens × input price + output tokens × output price`

Input tokens are everything you send: system prompt, tool schemas, the conversation so far, tool results. Output tokens are what the model writes back, including tool calls. Input is usually far larger, because you resend the whole conversation on every call (L0).

:::example Pip's bill for 10,000 conversations
Dev uses the list prices copied on the day of the audit: $5 per million input tokens and $25 per million output tokens. Check your provider's current price sheet; the math is the same.

From the traces, an average Sprout conversation makes six model calls and uses 53,500 input tokens and 1,300 output tokens.

| Line | Math | Amount |
|---|---|---|
| Input | 10,000 × 53,500 = 535,000,000 tokens × $5 per million | $2,675 |
| Output | 10,000 × 1,300 = 13,000,000 tokens × $25 per million | $325 |
| Total | | $3,000 |

Input is 89% of the bill. Shrinking input tokens matters more than shortening replies.
:::

:::beginner Plain-English detour: "per million tokens"
One token is worth a tiny fraction of a cent, so prices are quoted per million. Divide the token count by 1,000,000 and multiply by the price: 6,000 tokens at $5 per million is $0.03.
:::

Where do 53,500 input tokens come from in six calls? Three usual suspects:

1. **History growth.** Every call resends the system prompt, the tool schemas, and every earlier message.
2. **Retrieval depth.** `search_care_guide` returns ten article chunks, and they are resent on every later call.
3. **Repeated tool schemas.** Six tool definitions with long descriptions ride along on every call, used or not.

:::key
You pay for the whole conversation on every call, so the cost of a conversation grows roughly with the square of its length, not in a straight line.
:::

## 2. Profiling

A **cost profile** says which tokens came from where. You build it from traces (L2), because every model-call span records its token usage.

:::example One model-call span, with usage
```json
{
  "name": "model_call",
  "metadata": {
    "model": "claude-opus-5",
    "usage": {
      "input_tokens": 11010,
      "output_tokens": 300,
      "cache_read_input_tokens": 0
    }
  }
}
```

Sum `input_tokens` across a trace's model-call spans for that conversation; average across conversations for the fleet number on the bill.
:::

Here is Alex's conversation about order #1042, call by call. Sprout's system prompt is 3,500 tokens and the six tool schemas are 2,500, so 6,000 tokens of fixed prefix ride on every call.

:::example History growth, turn by turn

| Call | What was added since the previous call | Input tokens this call |
|---|---|---|
| 1 | Fixed prefix (6,000) + Alex's opening message (80) | 6,080 |
| 2 | Sprout's `lookup_order` call (60) + tool result (360) | 6,500 |
| 3 | Sprout's reply (200) + Alex's follow-up about the broken pot (50) | 6,750 |
| 4 | Sprout's `search_care_guide` call (60) + ten chunks (4,200) | 11,010 |
| 5 | Sprout's reply (300) + Alex's question about tracking (40) | 11,350 |
| 6 | Sprout's `get_shipping_status` call (60) + tool result (400) | 11,810 |
| Total | | 53,500 |

That is the cost profile. The prefix, resent six times, is 36,000 tokens (67%). The ten chunks, resent on calls 4, 5, and 6, are 12,600 tokens (24%). Everything Alex and Sprout actually said, plus the order data, is 4,900 tokens (9%).
:::

:::tip
Sort a day of model-call spans by `input_tokens`, descending. The top ten tell you which suspect to chase first.
:::

## 3. Fixes

Work down the profile from the largest bucket, measuring each fix twice: cost per 1,000 conversations and suite accuracy. A fix that drops accuracy below the spec's floor is not a fix. Together, these are **token reduction**.

### Prompt caching

**Prompt caching** lets the provider store the beginning of your request and charge much less when the next call starts with the same bytes. It is a prefix match, so order matters: tool schemas first, then the system prompt, then the messages, with anything that changes (dates, customer names, the new message) after the cache breakpoint. A cache write, the first time the prefix is stored, costs 1.25× the normal input price. A cache read costs 0.1×. Caches expire after a few minutes without use.

:::example Caching the 6,000-token prefix: before and after
Per conversation, worst case: each conversation writes the prefix once and reads it five times.

| | Tokens at full price ($5 per M) | Cache write tokens ($6.25 per M) | Cache read tokens ($0.50 per M) | Prefix cost per conversation | Prefix cost per 1k conversations |
|---|---|---|---|---|---|
| Before | 36,000 | 0 | 0 | $0.18 | $180.00 |
| After | 0 | 6,000 | 30,000 | $0.0375 + $0.015 = $0.0525 | $52.50 |

Savings: $127.50 per 1,000 conversations, $1,275 a month, from a change that alters no behavior. Verify with `cache_read_input_tokens` in the traces: about 6,000 on most calls, or something in the prefix is changing.
:::

In the SDK, you mark the breakpoint with `cache_control: { type: "ephemeral" }` on the last stable system block, and you send `tools` in the same order on every call.

:::warning Common mistake: a timestamp in the system prompt
A line like "Today is 2026-09-25 14:03" at the top of the system prompt changes every minute, so every call misses the cache, and nothing on the bill says why. Put anything that varies after the breakpoint, or round it to the date.
:::

### History trimming

**History growth** has two cures: a window (keep only the last N turns) or a summary (replace old turns with a short recap). Both can lose facts. Dev's four-turn window saved $3 per 1,000 conversations, because Sprout's conversations are short, and produced a new failure: Sprout forgot Alex's order number and asked for it again. Reverted, logged.

### Retrieval depth

Dev checked recall@k on the retrieval labeled set from L5: recall@10 was 0.96 and recall@3 was 0.94. Three chunks are 1,260 tokens instead of 4,200, resent three times: 8,820 tokens saved per conversation, $44 per 1,000. Suite accuracy moved from 92.0% to 91.5%, inside the bootstrap interval. Kept.

### Tool-schema dedupe

Two rules: do not send tools the current role cannot call (a customer never needs the analyst tools from L3), and keep each description to what the model needs in order to choose the tool.

:::example Shrinking one tool description
Before, `search_care_guide` had 410 tokens of description: every topic in the library, every situation in which to use it, and a paragraph on what it returns. After, 60 tokens:

```yaml
name: search_care_guide
description: >
  Search plant-care articles (watering, light, repotting, pests). Use for
  any care question. Returns up to 3 chunks with article titles.
```

All six schemas went from 2,500 to 900 tokens. The prefix is cached, so the saving is smaller than it looks: about $14 per 1,000 conversations. Accuracy did not move.
:::

### Shorter outputs

Output tokens cost five times what input tokens cost. Sprout's final care reply to Alex was 620 tokens of repotting instructions. A prompt rule ("answer in under 150 words unless the customer asks for detail") and a `max_tokens` backstop brought output from 1,300 to 930 tokens: about $9 per 1,000. Accuracy held.

:::example The fixes ledger
Every fix is one row, one axis, one suite run.

| Step | Change | Cost per 1k | Suite accuracy | Decision |
|---|---|---|---|---|
| 0 | L8 winner, no cost work | $300.00 | 92.0% | Baseline |
| 1 | Prompt caching on the fixed prefix | $172.50 | 92.0% | Keep |
| 2 | Retrieval k = 10 to k = 3 | $128.40 | 91.5% | Keep |
| 3 | Tool descriptions 2,500 to 900 tokens | $114.40 | 91.5% | Keep |
| 4 | Reply-length rule and `max_tokens` | $105.15 | 91.5% | Keep |
| 5 | History window of four turns | $102.00 | 89.5% | Revert |

After step 4: $105 per 1,000 conversations, $1,050 a month, down from $3,000, with accuracy inside the baseline's interval. No trade-off yet.
:::

:::key
Every cost fix is an experiment with two readouts, dollars and suite accuracy. Log both, including the reverts.
:::

## 4. Routing and cascades

**Model routing** sends each request to a model chosen by a rule. A **cascade** is a routing pattern where a cheap model tries first and a bigger model takes over when the cheap one is unsure or the task is hard.

The cheap model costs about a fifth as much, but on the dev slice it scores 87%, below the 90% floor in Sprout's spec. The question is *which* conversations it handles well. Only labeled data can answer that.

**Calibration** means checking a confidence score against reality. Sprout's cheap configuration returns a `confidence` number between 0 and 1 with each reply. On its own it is a guess the model made about itself. Calibration asks how often, at each confidence level, the cheap model was actually right.

:::example Calibrating on 200 labeled conversations
Dev runs both models over the 200-conversation dev slice. "Correct" means every evaluator passed. Rows are buckets of the cheap model's self-reported confidence.

| Cheap model confidence | Conversations | Cheap model correct | Big model correct |
|---|---|---|---|
| 0.9 to 1.0 | 96 | 94 (98%) | 95 (99%) |
| 0.8 to 0.9 | 44 | 40 (91%) | 41 (93%) |
| 0.7 to 0.8 | 30 | 23 (77%) | 26 (87%) |
| below 0.7 | 30 | 17 (57%) | 22 (73%) |
| All | 200 | 174 (87%) | 184 (92%) |

Dev wrote the rule before looking: keep a bucket on the cheap model only if it is within two points of the big model there. The top two buckets qualify. The threshold falls out of the table: escalate below 0.8.
:::

Now turn thresholds into a decision. An escalated conversation costs the cheap attempt plus the big model's run.

| Threshold | Handled by the cheap model | Suite accuracy (dev) | Cost per 1k | Clears the 90% floor? |
|---|---|---|---|---|
| No cascade, big model only | 0% | 92.0% | $105 | Yes |
| Escalate below 0.9 | 48% | 91.5% | $76 | Yes |
| Escalate below 0.8 | 70% | 91.0% | $53 | Yes |
| Escalate below 0.7 | 85% | 89.5% | $37 | No |
| Cheap model only | 100% | 87.0% | $21 | No |

Dev picks 0.8: the lowest threshold that still clears the floor, at $53 per 1,000 conversations. Then, once, the test slice: 90.8%. The decision holds.

:::beginner Plain-English detour: confidence
A confidence score is the model's own estimate of how likely it is to be right. Models are often overconfident, so the raw number is not a probability you can trust. Calibration replaces "the model says 0.85" with "when it says 0.8 to 0.9, it is right 91% of the time."
:::

Rules can be code too: messages with "refund," "lawyer," or "chargeback" skip straight to the big model, because those filled the cheap model's worst bucket.

:::warning Common mistake: routing by vibes
"The cheap model seemed fine on the easy stuff" is not a threshold. Two weeks later Maya notices refund conversations going wrong and nobody can say which model handled them. Calibrate on labeled data, log the route in the trace, and rebuild the buckets whenever a model changes.
:::

:::try Ask Eve
Ask Eve: "If the cheap model's 0.8 to 0.9 bucket had scored 85% instead of 91%, what threshold would Dev choose, and what would it cost per 1k?"
:::

## 5. The weights track

Everything so far changed prompts, tools, harness code, and routing. The **weights track** changes the model itself. Three doors:

- **Distillation**: train a small model to imitate a big model's outputs on your traffic, so it can take over more buckets.
- **Supervised fine-tuning (SFT)**: train on labeled examples of correct behavior, so the model learns your conventions directly.
- **Reinforcement learning (RL)**: train against a reward signal, such as your suite, so the model is pushed toward what your evaluators pass.

All three are expensive to start and to keep. You now own a model: hosting or a tuning bill, versioning, a full suite run on every retrain, and, for RL, a fresh chance at reward hacking (L8). Open a door only when the cheaper rungs are exhausted.

:::example The weights-track decision checklist
Dev answers every line before proposing training. A single "no" means stay on the prompt track.

| Question | Sprout's answer |
|---|---|
| Has the manual fix loop plateaued: three iterations without a keep? | Yes. Flat at 91 to 92% |
| Has a bounded improve-loop also plateaued? | Yes. Forty runs, no keeps |
| Are the remaining failures capability limits, not spec gaps? (Put the shape of the right answer in the prompt; if the model still fails, it is capability) | No. They are refund edge cases the spec does not cover. Pip has to decide the policy first |
| Do you have 1,000 or more labeled examples of correct behavior, or a reward signal you trust? | No. 300 labeled, judges validated on 60 |
| Do the savings pay for it: monthly savings × 12 > engineering + training + ongoing evaluation? | No. $530 × 12 = $6,360 |
| Can the tuned model go through the same CI gate and upgrade drill as any other config? | Yes |

Three "no" answers. Sprout stays on the prompt track. The analyst agent from L3, with 2,000 reviewed warehouse queries and a flat prompt search, might answer differently.
:::

:::key
Train weights only when prompt search is flat, the failures are true capability limits, and the savings pay for owning a model.
:::

## 6. The upgrade drill

Models ship every few months, and each one moves every point on your frontier. The **upgrade drill** finds out how without guessing. Because every configuration is a file (L8), it is mechanical:

1. A new model ships.
2. Add one **frontier config** file per candidate: the new model in each role it could play.
3. Run the full suite on every committed config, same seeds, same workload.
4. Redraw the frontier.
5. Decide per config: **deploy** it, **keep** it on file for the next drill, or **retire** it because something now dominates it.

```bash
for cfg in configs/*.json; do
  npm run suite -- --config "$cfg" --seed 42 \
    --out "results/2026-11-20/$(basename "$cfg" .json).json"
done
npm run frontier -- results/2026-11-20   # prints the table, marks dominated configs
```

:::example Dev's drill log

| Date | Trigger | Configs run (accuracy / cost per 1k) | Decision |
|---|---|---|---|
| 2026-09-26 | Cost work done | big-only 92.0 / $105; cascade-0.8 91.0 / $53; cheap-only 87.0 / $21 | Deploy cascade-0.8. Keep the others on file |
| 2026-10-14 | New small model ships | cheap2-only 90.5 / $23; cascade2-0.8 (recalibrated) 91.8 / $49 | Deploy cascade2-0.8. Retire cascade-0.8, dominated on both axes |
| 2026-11-20 | New frontier model ships | big2-only 94.0 / $150; cascade2-big2-0.8 92.6 / $61 | Keep both on file. cascade2-0.8 already clears the floor; 0.8 more points for $12 per 1k is not worth it |

The October row is the drill paying off: the suite ran, the table changed, and the decision took ten minutes. "Recalibrated" means the section 4 buckets were rebuilt for the new cheap model.
:::

:::tip
Schedule the drill: the first Monday of each month, plus a run whenever a provider announces a model.
:::

:::try Ask Eve
Ask Eve: "A new frontier model is 30% cheaper than the one in big-only. Walk me through the drill and tell me which rows of the log might change."
:::

## 7. Homework 2

Homework 2 closes the Improve verb with two parts, graded against the rubric below. **Part A**: route a prompt, tool, or harness change to the top failure mode in your own taxonomy, run the manual fix loop on your dev slice, and freeze a winner on your test slice, read once. **Part B**: profile cost from your traces, measure one caching change, calibrate a cascade on labeled data, and run the upgrade drill across at least two committed frontier configs.

## Summary

- Cost is tokens in times price plus tokens out times price. Input dominates because every call resends the whole conversation. Profile it from traces.
- The usual suspects are history growth, retrieval depth, and repeated tool schemas. Cache the stable prefix first, then trim retrieval, schemas, and outputs, measuring each change with the suite.
- A cascade sends easy conversations to a cheap model and escalates the rest. Calibrate the threshold on labeled data and pick the lowest one that clears the accuracy floor.
- The weights track (distillation, SFT, RL) is for flat prompt search, true capability limits, and savings that pay for owning a model.
- Keep every configuration as a file and run the upgrade drill when a model ships: full suite, redraw the frontier, then deploy, keep, or retire.
