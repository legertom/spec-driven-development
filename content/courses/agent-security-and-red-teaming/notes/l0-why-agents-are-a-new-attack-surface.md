## Talking points

- Open with Sam's message and ask the room what should happen. Most answers are some form of "block the message." Hold that thought; the lesson's answer is "let the model be fooled and make it not matter."
- The form, chatbot, agent table is the whole lesson in one picture. Same words, same attacker, and only the agent turns words into an action.
- Entry points: five of Sprout's six never touch the chat box. Push on tool results: the code is trusted, what the tool returned is not.
- No reliable detector: show the five rephrasings and ask which filter catches the French line, the poem, and the base64.
- The design rule: assume the model is fooled, make sure it does not matter. Walk the two versions of Sprout and point out that the model was fooled in both.
- The OWASP table is a vocabulary, not a checklist. Spend the time on "one attack, three categories."
- Tiers are a property of the tool, never of the conversation. If a convincing story could lower a tier, the attacker would tell that story.
- Close with the three verbs and the file each one produces.

## Live demo idea

Run Sprout on staging with the test user. Paste A-1. Show the model drafting `issue_refund` and the tool guard returning `outside_return_window`. Comment out the guard's check block, rerun the same message, and show the refund going through. Restore the guard. Two minutes, identical prompt, and only code changed the outcome.

## Common misconceptions

- "A good system prompt prevents injection." It lowers how often the model is fooled and does nothing to what happens when it is.
- "Tool results are safe because we wrote the tool." The tool is yours. Its output came from a supplier, a carrier, or a customer.
- "Read-only tools are risk-free." Three of Sprout's T0 tools are entry points.
- "A convincing reason should lower the tier." Reasons come from the customer or the model, both of which can be fooled.
- "The OWASP list is a compliance checklist." It is a shared vocabulary for threat models and red-team reports.

## Timing

Section 1: 5 minutes. Section 2: 7 minutes. Section 3: 6 minutes. Section 4 with the demo: 8 minutes. Section 5: 4 minutes. Section 6: 3 minutes. Section 7: 2 minutes. Total 35 minutes.

## If you only have 20 minutes

Sections 1, 3, and 4: the three-system table, the five rephrasings, and the two versions of Sprout with the live demo. Assign the entry-point table, the OWASP map, and the tier table as reading.
