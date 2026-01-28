interface DomainGroupProps {
  domain: string
}

export function DomainGroup({ domain }: DomainGroupProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 mb-1 px-1">
      <img
        src={"https://www.google.com/s2/favicons?domain=" + encodeURIComponent(domain) + "&sz=16"}
        alt=""
        className="w-4 h-4 flex-none"
      />
      <span className="truncate" title={domain}>
        {domain}
      </span>
    </div>
  )
}
