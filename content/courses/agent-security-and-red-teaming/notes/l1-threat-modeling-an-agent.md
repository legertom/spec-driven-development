## Talking points

- Open with Dev's afternoon: two profile-note tools, no threat model. Ask which one worries the room and why. They cannot say yet, because nobody has named the assets.
- The four questions: what we protect, from whom, through which doors, what we do about it. Everything else in the lesson is one of those four with a table attached.
- Assets before actors. Push on "one address versus one refund" until someone agrees the address ranks higher.
- Actors: write Sam first. Low skill, high patience, two entry points. Then the mistake row, which does the same damage with no attacker.
- Trust boundary is about control, not honesty. Fernworks is a good supplier; the PDF is still untrusted, and `search_care_guide` carries it into the prompt.
- The diagram makes crossings countable. Six in, one out. The one out is `save_customer_note`, and it is the whole reason the write tool gets a different design.
- The register: low, medium, high, one owner per row. Dwell on R3: read-only tool, no injection, highest impact.
- Tiering is two questions. The worst call when fooled gives the tier. Whether the output comes back into the model gives the entry-point flag.

## Live demo idea

Draw the data-flow diagram on a whiteboard with the original six tools and one vertical line. Have students count the crossings. Add the two note tools and ask them to draw the arrows. Most put the profile-notes store on the trusted side because Maya writes to it. Trace A-6 together: Sam says something, Sprout writes it, a later session reads it. Move the store across the line. That one move is the lesson.

## Common misconceptions

- "A read-only tool is safe." T0 says what a tool can change, not what it can bring in.
- "The threat model is a compliance document." It changes in the same pull request as the surface, or it is already stale.
- "Only skilled attackers matter." Sam is the actor Sprout meets every day.
- "A row with likelihood and impact is complete." Without a tool, an entry point, and an owner it cannot be fixed or accepted.
- "Writing to memory is harmless because it can be undone." The write is reversible; the read it causes tomorrow is the risk.

## Timing

Section 1: 5 minutes. Sections 2 and 3: 10 minutes. Section 4: 8 minutes. Section 5 with the whiteboard: 12 minutes. Section 6: 10 minutes. Section 7: 7 minutes. Section 8: 3 minutes. Total 55 minutes.

## If you only have 20 minutes

Sections 5 and 7: draw the diagram, count the crossings, move the profile-notes store across the line, then tier the two new tools with the two questions. Assign the asset and actor tables and the register as reading, and point students at HW1.
