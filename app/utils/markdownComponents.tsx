import type { Components } from "react-markdown";

export const markdownComponents: Components = {
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
