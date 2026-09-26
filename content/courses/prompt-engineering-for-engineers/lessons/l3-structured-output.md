---
slug: l3-structured-output
number: "L3"
title: "Structured Output"
module: 2
moduleTitle: "Shaping Input and Output"
verb: Structure
minutes: 55
prereqs: ["l2-context-grounding-and-injection"]
summary: "Describe Intake's record as a JSON schema, force the model to fill it through a tool call, validate the result with zod, retry with the error, and let the model say unknown instead of guessing."
objectives:
  - "Explain why free-text output breaks code and what a schema fixes."
  - "Write a JSON schema for a record with types, required fields, enums, and nullable fields."
  - "Get structured output through a forced tool call instead of asking nicely for JSON."
  - "Validate the result in code, and retry with the validation error when it fails."
  - "Design the schema so the model can say \"unknown\" instead of guessing."
keyTerms: ["structured-output", "json-schema", "required-field", "enum", "nullable", "tool-use", "tool-choice", "validation", "retry-with-error", "unknown-vs-guess", "confidence-field", "output-parsing"]
---

## Why this matters

Intake v1 ends its system prompt with one line: "Return the titles as JSON." Omar ships it on a Tuesday. By Friday the import job has crashed three nights in a row. Half the replies begin with "Here is the JSON you asked for:", which is not JSON. One reply wraps the array in an object with a key nobody expected. One reply for IN-2 contains an ISBN-13 that the supplier never sent, because the model padded the ISBN-10 with zeros to make it fit. The job fails at 2 a.m., and the on-call alert reaches Omar's phone. In the morning Nadia asks a fair question: why can a computer not read what a computer wrote? This lesson answers her. The model wrote prose. Code needs a shape.

## 1. Why free text breaks code

Free text is any output the model produces without a shape you can check. It is fine when a person reads it, because a person forgives a preface, a renamed key, or a missing bracket. Code forgives none of that. `JSON.parse` either succeeds or throws, and a key named `price` when your code reads `unitPrice` is silently `undefined`.

The failures come in three kinds. Prose around the JSON: a greeting, an explanation, a code fence. Inconsistent keys: `price` on Monday, `unitPrice` on Tuesday, `unit_price` on Wednesday. Guessed values: a number where the email had none, because the model would rather complete a record than leave a hole.

:::example Three Intake v1 outputs for IN-1
IN-1 is a supplier email offering two titles. The first is priced at 8.50 in pounds. The second has no price at all. Three runs of Intake v1 produce three shapes.

```text
Run 1: Here is the JSON you asked for:
[{"title":"Sea of Poppies","price":"£8.50"},{"title":"The Shipping News","price":"n/a"}]

Run 2: {"titles":[{"title":"Sea of Poppies","unitPrice":8.5,"currency":"GBP"},
        {"title":"The Shipping News","unitPrice":12.99,"currency":"GBP"}]}

Run 3: [{"title":"Sea of Poppies","unit_price":8.50,"cur":"GBP"},
        {"title":"The Shipping News","unit_price":null}]
```

Run 1 is not parseable. Run 2 parses but hides the array under `titles` and invents 12.99 for a book with no price. Run 3 parses, uses different keys, and drops the currency on the second record. The import job cannot be written against any of these, because there is no "these."
:::

Structured output is output whose shape is fixed before the call is made, so that code can parse it, check it, and act on it without a person in between. The rest of this lesson builds Intake v2 around that idea.

:::key
A person can read three shapes. Code can read one. Fix the shape before the call, not after.
:::

## 2. Describe the shape

A JSON schema is a description of what a JSON value may look like: its type, its properties, which properties must be present, and which values each may hold. It is the contract between the prompt and the code that consumes the result.

Four parts of the schema do most of the work. A type on every property, so `unitPrice` is a number and not the string `"£8.50"`. A required list, which names the properties that must be present on every record; a required field is one the model may not leave out, though it may still be null if the schema allows that. An enum, which is a closed list of allowed values, so `currency` is one of three codes and never `"pounds"`. And a nullable type, written as `["number", "null"]`, which says this property must be present but may hold null when the fact is unknown.

Here is the record schema for one offer, in full.

```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "author": { "type": ["string", "null"] },
    "isbn13": { "type": ["string", "null"] },
    "unitPrice": { "type": ["number", "null"] },
    "currency": { "type": "string", "enum": ["USD", "GBP", "EUR"] },
    "quantityOffered": { "type": ["integer", "null"] },
    "confidence": { "type": "string", "enum": ["high", "medium", "low"] },
    "notes": { "type": "string" }
  },
  "required": ["title", "author", "isbn13", "unitPrice", "currency",
               "quantityOffered", "confidence", "notes"]
}
```

Every field is required, and four of them are nullable. That combination is deliberate. The model must say something about `unitPrice` on every record, and one of the things it may say is null. A missing key would be ambiguous: did the model forget, or was there no price? A present null is a statement.

:::example Reading IN-1 through the schema
With the schema in place, IN-1 has exactly one correct shape: two records. The first has `unitPrice: 8.5` and `currency: "GBP"`. The second has `unitPrice: null`, `currency: "GBP"` because the email is priced in pounds throughout, `confidence: "medium"`, and a `notes` value of "no price given for this title." Runs 1, 2, and 3 from section 1 are all now wrong in ways the schema can name.
:::

:::beginner Required and nullable are different questions
Required asks: must the key be there? Nullable asks: may the value be null? A field can be required and nullable at the same time, and Intake's `unitPrice` is exactly that. The key always appears; the value is a number or null. A field that is optional and not nullable would be the opposite: sometimes absent, but never null when present.
:::

:::warning An enum is a promise you have to keep
`currency` allows USD, GBP, and EUR. The first supplier who quotes in Canadian dollars will either be forced into a wrong code or cause a validation failure. Both are better than a free string, because both are visible. When it happens, add CAD to the enum in code and to the instruction in the prompt in the same commit.
:::

## 3. Force the shape with a tool

Asking nicely for JSON is what v1 did, and section 1 shows what it earned. The reliable route is tool use. Tool use is the API feature where you describe a function the model may call, with a name, a description, and an `input_schema`, and the model answers by producing a call to it with arguments that fit the schema. You do not need the function to do anything. The call itself is the structured output.

Tool choice is the request parameter that controls whether the model may call a tool, must call some tool, or must call one named tool. Setting `tool_choice` to `{ type: "tool", name: "record_offers" }` means the model cannot answer in prose. Its only way to respond is to fill the schema.

The tool wraps the record schema from section 2 in an array named `offers`. Here is `src/llm/intake.ts` with the call.

```ts
import Anthropic from "@anthropic-ai/sdk";
import { OFFER_SCHEMA } from "./intake.schema";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const RECORD_OFFERS_TOOL: Anthropic.Tool = {
  name: "record_offers",
  description: "Record every title offered in a supplier email. Use an empty list when nothing is offered.",
  input_schema: {
    type: "object",
    properties: { offers: { type: "array", items: OFFER_SCHEMA } },
    required: ["offers"],
  },
};

const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 2048,
  system: INTAKE_SYSTEM_PROMPT,
  tools: [RECORD_OFFERS_TOOL],
  tool_choice: { type: "tool", name: "record_offers" },
  messages: [{ role: "user", content: `<email>\n${supplierEmail}\n</email>` }],
});

const call = response.content.find((b) => b.type === "tool_use");
```

`call.input` is an object that already matches the schema's shape: an `offers` array, each item with the eight keys, currency from the enum, nulls where allowed. There is no preface to strip and no code fence to unwrap. Other providers have an equivalent; the idea carries.

:::example The same IN-1 email, through the tool
Omar runs IN-1 through v2 five times. Every run returns one `tool_use` block named `record_offers`. Every `input.offers` has two items. Every item has all eight keys. The second item's `unitPrice` is null in all five runs. The import job's parser is now three lines: find the tool block, read `input`, hand it on.
:::

:::tip
Put the description on the tool to work. "Use an empty list when nothing is offered" is an instruction the model reads at the moment it decides what to return. Keep it to one or two sentences and say the same thing in `prompts/intake.system.md`, so neither place contradicts the other.
:::

:::try Ask Eve
Highlight the `tool_choice` line and ask Eve: "What would change in the response if this line were removed?"
:::

## 4. Validate anyway

A schema constrains shape, not meaning. The API guarantees the `input` has an `offers` array whose items have a string or null under `isbn13`. It does not guarantee the string is thirteen digits, that its check digit is right, or that `unitPrice` is positive. Those are facts about the world, and the schema does not know the world.

Validation is the step in code that checks the parsed result against rules the schema cannot express. Intake uses zod, a TypeScript library that lets you declare a schema once and get both a type and a runtime check from it. The shape below mirrors section 2, then adds the refinements.

```ts
import { z } from "zod";

export const isbn13Ok = (s: string): boolean => {
  if (!/^\d{13}$/.test(s)) return false;
  const digits = [...s].map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
};

export const OfferSchema = z.object({
  title: z.string().min(1),
  author: z.string().nullable(),
  isbn13: z
    .string()
    .nullable()
    .refine((s) => s === null || isbn13Ok(s), { message: "isbn13 must be 13 digits with a valid check digit" }),
  unitPrice: z.number().positive().nullable(),
  currency: z.enum(["USD", "GBP", "EUR"]),
  quantityOffered: z.number().int().positive().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string(),
});

export const OffersSchema = z.object({ offers: z.array(OfferSchema) });
export type Offers = z.infer<typeof OffersSchema>;
```

`OffersSchema.safeParse(call?.input)` returns either `{ success: true, data }` with a typed value or `{ success: false, error }` with a message that names the field and the rule. That message is the raw material for section 5.

:::example The padded ISBN, caught
IN-2 carries the ISBN-10 `0316769487`. A v1 run once returned `"0000316769487"`. Thirteen characters, all digits, so the API schema accepts it. The zod refinement computes the check digit, gets 3, compares it to 7, and fails with "isbn13 must be 13 digits with a valid check digit." The record never reaches the import table.
:::

:::beginner What a check digit is
The last digit of an ISBN-13 is computed from the other twelve: multiply them by 1 and 3 in turn, add them up, and the check digit is whatever brings the total to a multiple of ten. It exists so that a mistyped or invented number fails a cheap arithmetic test. `isbn13Ok` is that test.
:::

:::key
The API schema keeps the shape honest. Your validator keeps the meaning honest. You need both, and the second one lives in your code.
:::

## 5. Retry with the error

When validation fails, you have two choices. Throw and let the import job die at 2 a.m., or tell the model what was wrong and let it try again. Retry with error is the second choice: send the validation message back as the result of the tool call, ask for a corrected call, and cap the attempts.

The cap matters. An unbounded loop is a bill with no ceiling. Intake allows the first call plus two retries. After that it throws, loudly, with the last error attached, so a person sees a real message and not a silent empty import.

```ts
export async function extractOffers(supplierEmail: string): Promise<Offers> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `<email>\n${supplierEmail}\n</email>` },
  ];
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      system: INTAKE_SYSTEM_PROMPT,
      tools: [RECORD_OFFERS_TOOL],
      tool_choice: { type: "tool", name: "record_offers" },
      messages,
    });
    const call = response.content.find((b) => b.type === "tool_use");
    const parsed = OffersSchema.safeParse(call?.input);
    if (parsed.success) return parsed.data;
    lastError = parsed.error.message;
    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: call!.id, content: `Validation failed: ${lastError} Call record_offers again with corrected values. Never invent an ISBN or a price; use null.` }],
    });
  }
  throw new Error(`Intake: record_offers failed validation after 3 attempts. Last error: ${lastError}`);
}
```

The retry message does two things. It quotes the error, so the model knows which field and which rule. And it restates the one instruction that matters most in a correction: use null rather than invent. Without that sentence, a model told "isbn13 is invalid" may try a different invented number.

:::example IN-2 on the second attempt
Attempt 1 returns the padded ISBN and fails the check digit. The tool result says so. Attempt 2 returns `isbn13: null` with `notes: "supplier gave ISBN-10 0316769487; not converted"` and `confidence: "medium"`. Validation passes. The import job records the title with no ISBN-13 and a note that a person can act on.
:::

:::warning Retrying is not a fix for a bad prompt
If one in five Intake calls needs a retry, the retry loop is hiding a prompt problem and doubling your cost to do it. Log every retry with the error text. When the same error repeats, the instruction belongs in `prompts/intake.system.md`, and L5 shows how to prove the change helped.
:::

## 6. Unknown beats guessed

Every hole in a record is a decision. The model can leave it empty, or it can fill it with the most plausible value. Left to itself it fills, because completing text is what it does. Unknown versus guess is the design question: does the schema and the prompt make "I do not know" a legal, easy, and expected answer?

Three things make it so. The nullable types from section 2 make null legal. A confidence field, an enum of `high`, `medium`, and `low`, gives the model a place to express doubt without corrupting a value; a guessed price at `low` confidence is still a wrong number in a price column, so confidence goes alongside null, not instead of it. And an explicit instruction says which fields must never be computed or inferred. Identifiers are the clearest case. An ISBN-13 either appears in the email or it does not; a model that derives one is manufacturing a fact.

Here is the relevant block of `prompts/intake.system.md`.

```markdown
## Unknown values

- If the email does not state a field, set it to null. Do not estimate.
- Never compute or infer an identifier. If only an ISBN-10 is given, set
  isbn13 to null and put the ISBN-10 in notes.
- Never convert an RRP or a list price into unitPrice. Set unitPrice to null
  and put the quoted figure and its label in notes.
- Set confidence to low when you had to interpret the email to fill any field.
```

:::example IN-2, done right
The email offers one title with an ISBN-10 and "RRP £14.99." The correct record has `isbn13: null`, `unitPrice: null`, `currency: "GBP"`, `confidence: "low"`, and `notes: "ISBN-10 0316769487 given; RRP £14.99 quoted, not a unit price."` Nothing invented, and every fact the supplier did give is preserved where a person can see it.
:::

:::beginner Why an RRP is not a unit price
An RRP is a recommended retail price, the number printed on the back of the book. A unit price is what the supplier will charge Bramble per copy. They differ, often by half. Putting the RRP into `unitPrice` would make Intake believe Bramble pays retail for stock.
:::

:::try Ask Eve
Highlight the "Unknown values" block and ask Eve: "Which of these four rules would the schema alone enforce, and which need the instruction?"
:::

## 7. Zero is a valid answer

The tool description says "use an empty list when nothing is offered," and the system prompt repeats it. Both are needed because an empty array is the answer a completion model resists most. Given a newsletter full of titles, it wants to record something.

IN-3 is a supplier newsletter. It mentions six titles, a staff pick, and an author event. It offers nothing for sale. The correct output is `{ "offers": [] }`. That is not a failure, and the import job must treat it as a successful run with zero rows, not as an error to retry.

:::example IN-3 through Intake v2
The first run of v2 on IN-3 returns two offers with `unitPrice: null` and `confidence: "low"`: the staff pick and the event book. Omar adds one line to the prompt: "A title that is mentioned but not offered for sale, with a quantity or a price, is not an offer." The next five runs return an empty `offers` array. Validation passes, the job logs "0 offers recorded," and nobody is paged.
:::

:::key
An empty list, a null, and a low confidence are all correct answers. Design the schema so each is cheap for the model to give, and the model will give them.
:::

## 8. Where the shape lives

The shape of an Intake record now exists in three places. The tool's `input_schema` in `src/llm/intake.ts` tells the API what to accept. The zod schema in the same module tells your code what is valid. The "Unknown values" block in `prompts/intake.system.md` tells the model what to do at the edges the schema cannot reach.

Keep the first two in one module and the prompt file beside it, and change them together. A pull request that adds `CAD` to the zod enum but not to the tool schema will reject every Canadian email at validation. One that adds it to both but not to the prompt will leave the model unsure whether CAD is welcome. Version them as one thing, in one commit, with one entry in `prompts/CHANGELOG.md`.

:::try Ask Eve
Highlight this section and ask Eve: "Draft the changelog entry for adding CAD to Intake, naming every file that changed."
:::

## Summary

- Free text breaks code three ways: prose around the JSON, inconsistent keys, and guessed values. A fixed shape, decided before the call, is the fix.
- A JSON schema names each field's type, lists the required fields, closes `currency` and `confidence` with enums, and makes `unitPrice`, `isbn13`, `author`, and `quantityOffered` nullable.
- A forced tool call, `tool_choice: { type: "tool", name: "record_offers" }`, means the model can only answer by filling the schema.
- The schema constrains shape, not meaning, so zod validates the result, the check digit refinement catches invented ISBNs, and a failure is sent back as a tool result for at most two retries before the job fails loudly.
- Null, `confidence: "low"`, and an empty `offers` array are all correct answers; the prompt says so, the schema allows them, and the tool schema, the zod schema, and the prompt are versioned together.
