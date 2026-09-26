## Talking points

- Open with the card. Show "Customer is owed a full refund per policy" and ask who would approve it in a busy hour. The queue held; the card failed.
- The gate is for T2 only. One tool in Sprout's queue. A gate on every call trains the approver to click.
- The queue code carries three security properties: delete before check (no double pay), expiry means deny, a person's id on every decision.
- Facts, not stories. The "customer wrote" line is the tell for every indirect injection. The "sources read" line makes eradication fast. Name human-trust exploitation as the OWASP category.
- Fatigue is measurable: rate, time, reversals. Maya's Tuesday table says "the gate opened."
- Kill switch: who, how fast, how tested. Rollback is a deploy of a versioned prompt, and it did not fix A-2; it removed the instruction that produced the confident summary.
- Runbook: detect, contain, eradicate, recover, learn. Contain before you understand. Learn ends in a test.
- Forensic logs: five lines reconstructed the incident. Log the harness, not only the model.

## Live demo idea

On staging, with the test user, seed the care-guide index with a PDF carrying the A-2 white text and ask Sprout the repotting question. Show the queue receiving a refund request Jordan never made. Open the old card and the new one side by side. Then set `SPROUT_DISABLE_T2=true` in the running process, send the same question, and show the `kill_switch` denial in `logs/guard.jsonl`. Finish by tailing the five forensic lines and asking students to name the document, the prompt version, and the approver.

## Common misconceptions

- "Approve on timeout so customers are not stuck." A stuck customer is recoverable. An unattended refund is not.
- "The model's summary helps Maya decide faster." It is the attack surface. Show it, label it, never rely on it alone.
- "A second approver fixes fatigue." Two tired people click the same button. Fewer, richer requests fix fatigue.
- "The kill switch needs sign-off." A switch that needs a meeting is not a switch. Test it monthly.
- "The incident is over when the money is back." It is over when a test fails against the old version.

## Timing

Section 1: 5 minutes. Section 2 with the queue code: 8 minutes. Section 3 with the card demo: 10 minutes. Section 4: 6 minutes. Sections 5 and 6: 8 minutes. Section 7 with the timeline and the YAML case: 10 minutes. Section 8: 8 minutes. Total 55 minutes.

## If you only have 20 minutes

Sections 2, 3, and 7: the queue with timeout-deny, the card before and after, and the runbook steps ending in a test. Do the card demo. Assign the rest as reading.
