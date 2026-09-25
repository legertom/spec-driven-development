/**
 * Markdown helpers shared by the server renderer and Eve's chat bubbles.
 *
 * Authors write callouts as:
 *
 *   :::example Sprout looks up an order
 *   …body…
 *   :::
 *
 * remark-directive only understands `:::example[Sprout looks up an order]`, so
 * `preprocessCallouts` rewrites the friendly form into the bracket form before
 * parsing, and `remarkCallouts` turns each container directive into a
 * <div class="callout callout-example" data-callout="example" data-title="…">.
 */
import type { Nodes, Root } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const CALLOUT_TYPES = ["example", "key", "beginner", "warning", "tip", "try"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

export function preprocessCallouts(markdown: string): string {
  return markdown.replace(
    /^:::([a-z]+)[ \t]+(?!\[)(.+?)[ \t]*$/gm,
    (_match, name: string, title: string) => `:::${name}[${title.replace(/[\[\]]/g, "")}]`,
  );
}

function textOf(node: Nodes): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node) return node.children.map((child) => textOf(child as Nodes)).join("");
  return "";
}

export const remarkCallouts: Plugin<[], Root> = () => (tree) => {
  visit(tree, "containerDirective", (node: ContainerDirective) => {
    const name = node.name;
    if (!(CALLOUT_TYPES as readonly string[]).includes(name)) return;
    let title = "";
    const first = node.children[0];
    const firstData = first?.data as { directiveLabel?: boolean } | undefined;
    if (first && first.type === "paragraph" && firstData?.directiveLabel) {
      title = textOf(first).trim();
      node.children.shift();
    }
    const data = (node.data ??= {}) as Record<string, unknown>;
    data.hName = "div";
    data.hProperties = {
      className: ["callout", `callout-${name}`],
      dataCallout: name,
      dataTitle: title,
    };
  });
};
