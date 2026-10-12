import type { Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="text-3xl font-bold mt-4 mb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-semibold mt-3 mb-1" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold mt-2 mb-1" {...props}>
      {children}
    </h3>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ ...props }) => <ul className="list-disc list-inside" {...props} />,
};
