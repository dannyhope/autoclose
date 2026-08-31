export function PopupFooter() {
  return (
    <footer className="flex shrink-0 items-center justify-between px-3 py-2">
      <a
        href="https://dannyhope.co.uk/feedback"
        className="text-[11px] text-muted-foreground no-underline transition-colors hover:text-foreground"
        target="_blank"
        rel="noopener noreferrer"
      >
        Feedback
      </a>
      <a
        href="https://dannyhope.co.uk"
        className="text-[11px] text-muted-foreground no-underline transition-colors hover:text-foreground"
      >
        A Danny Hope product
      </a>
    </footer>
  );
}
