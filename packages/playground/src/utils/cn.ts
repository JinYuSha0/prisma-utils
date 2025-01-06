export const cn = (...args: (string | boolean)[]) =>
  args.filter(Boolean).join(" ");
