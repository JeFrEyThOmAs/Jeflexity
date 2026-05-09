import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  className?: string;
};

const components: Components = {
  p: ({ children }) => <p className="mb-3 text-[15px] leading-7 text-zinc-300 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
  em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-violet-400/90">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:text-zinc-500">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[15px] leading-7 text-zinc-300 [&>p]:mb-1 [&>p:last-child]:mb-0">{children}</li>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-sky-400 underline decoration-sky-500/40 underline-offset-2 transition hover:text-sky-300"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-base font-semibold tracking-tight text-zinc-100 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold tracking-tight text-zinc-200 first:mt-0">{children}</h3>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === "string" && className.includes("language-");
    if (!isBlock) {
      return (
        <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-violet-200" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={`block w-full overflow-x-auto rounded-none border-0 bg-transparent p-0 font-mono text-[13px] text-zinc-300 ${className ?? ""}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-3">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-violet-500/50 pl-4 text-zinc-400 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-6 border-white/10" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[280px] border-collapse text-left text-sm text-zinc-300">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.04] text-zinc-200">{children}</thead>,
  th: ({ children }) => <th className="border-b border-white/10 px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-b border-white/[0.06] px-3 py-2">{children}</td>,
};

export function AssistantMarkdown({ content, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
