import type { Nodes } from "hast";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import type { CalloutType } from "@/lib/markdown-plugins";
import { preprocessCallouts, remarkCallouts } from "@/lib/markdown-plugins";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";

function hastText(node: Nodes | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map((c) => hastText(c as Nodes)).join("");
  return "";
}

const components: Components = {
  div(props) {
    const { node, children, ...rest } = props;
    const attrs = rest as Record<string, unknown>;
    const type = attrs["data-callout"] as CalloutType | undefined;
    if (type) {
      const title = (attrs["data-title"] as string | undefined) || undefined;
      return (
        <Callout type={type} title={title} text={hastText(node)}>
          {children}
        </Callout>
      );
    }
    return <div {...rest}>{children}</div>;
  },
  pre(props) {
    const { node, children, ...rest } = props;
    return (
      <CodeBlock code={hastText(node)}>
        <pre {...rest}>{children}</pre>
      </CodeBlock>
    );
  },
  a(props) {
    const { node, href, children, ...rest } = props;
    void node;
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a href={href} {...rest} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {children}
      </a>
    );
  },
};

/**
 * Renders course markdown (lessons, notes, Eve's replies, feedback).
 * Works in both server and client components.
 */
export function Markdown({ content, className = "prose-lesson" }: { content: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts]}
        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
        components={components}
      >
        {preprocessCallouts(content)}
      </ReactMarkdown>
    </div>
  );
}
