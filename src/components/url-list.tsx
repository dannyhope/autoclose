import type { ReactNode } from 'react';
import { Check, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { faviconPageUrl, faviconSrc } from '@/lib/favicon';
import { labelForUrl, openUrlInNewTab, type UrlGroup, type UrlItem } from '@/lib/url-groups';
import binIcon from '../icons/bin-darker.svg?url';

type UrlListProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: UrlGroup[];
  headerAction?: ReactNode;
  onDelete: (url: string) => void;
  onMove?: (url: string) => void;
  moveTitle?: string;
  moveIcon?: 'protect' | 'safe';
};

type RowActionsProps = {
  url: string;
  isOpen: boolean;
  onDelete: (url: string) => void;
  onMove?: (url: string) => void;
  moveTitle?: string;
  moveIcon?: 'protect' | 'safe';
};

function RowActions({ url, isOpen, onDelete, onMove, moveTitle, moveIcon }: RowActionsProps) {
  return (
    <>
      <span className="w-4 shrink-0 text-center text-xs">{isOpen ? '🔴' : ''}</span>
      {onMove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title={moveTitle}
          onClick={() => onMove(url)}
        >
          {moveIcon === 'safe' ? (
            <Check className="size-3.5 text-muted-foreground" />
          ) : (
            <Shield className="size-3.5 text-muted-foreground" />
          )}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title="Remove this pattern"
        onClick={() => onDelete(url)}
      >
        <img src={binIcon} alt="Remove" className="size-4" />
      </Button>
    </>
  );
}

function Favicon({ domain, sampleUrl }: { domain: string; sampleUrl: string }) {
  const icon = faviconSrc(faviconPageUrl(domain, sampleUrl));
  if (!icon) {
    return null;
  }
  return (
    <img
      src={icon}
      alt=""
      width={16}
      height={16}
      className="size-4 shrink-0"
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
    />
  );
}

function UrlRow({
  item,
  label,
  showFavicon,
  domain,
  sampleUrl,
  onDelete,
  onMove,
  moveTitle,
  moveIcon
}: {
  item: UrlItem;
  label: string;
  showFavicon?: boolean;
  domain?: string;
  sampleUrl?: string;
  onDelete: (url: string) => void;
  onMove?: (url: string) => void;
  moveTitle?: string;
  moveIcon?: 'protect' | 'safe';
}) {
  const isOpen = (item.matchingTabs?.length ?? 0) > 0;
  return (
    <div className="flex min-h-7 min-w-0 items-center gap-1 py-0.5 pr-1">
      {showFavicon && domain ? <Favicon domain={domain} sampleUrl={sampleUrl || item.url} /> : null}
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left text-sm leading-tight"
        title={item.url}
        onClick={() => openUrlInNewTab(item.url)}
      >
        {label}
      </button>
      <RowActions
        url={item.url}
        isOpen={isOpen}
        onDelete={onDelete}
        onMove={onMove}
        moveTitle={moveTitle}
        moveIcon={moveIcon}
      />
    </div>
  );
}

export function UrlList({
  title,
  open,
  onOpenChange,
  groups,
  headerAction,
  onDelete,
  onMove,
  moveTitle,
  moveIcon
}: UrlListProps) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn('flex min-h-0 flex-col', open && 'flex-1')}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-1.5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="inline-flex min-w-0 items-center gap-2 bg-transparent p-0 text-left text-sm font-medium"
            title={`Show or hide your ${title.toLowerCase()} list`}
          >
            <ChevronDown className={cn('size-4 shrink-0 transition-transform', !open && '-rotate-90')} />
            <span className="leading-tight">{title}</span>
          </button>
        </CollapsibleTrigger>
        {headerAction}
      </div>
      <CollapsibleContent className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card data-[state=closed]:hidden">
        <ScrollArea className="h-full">
          <ul className="list-none px-3 py-2">
            {groups.map((group) => {
              const loneItem = group.items.length === 1 ? group.items[0] : null;
              return (
                <li key={group.domain} className="mt-2 first:mt-0">
                  {loneItem ? (
                    <UrlRow
                      item={loneItem}
                      label={labelForUrl(loneItem.url, { includeDomain: true })}
                      showFavicon
                      domain={group.domain}
                      sampleUrl={group.sampleUrl}
                      onDelete={onDelete}
                      onMove={onMove}
                      moveTitle={moveTitle}
                      moveIcon={moveIcon}
                    />
                  ) : (
                    <>
                      <div className="flex min-w-0 items-center gap-2 px-1 text-xs text-muted-foreground">
                        <Favicon domain={group.domain} sampleUrl={group.sampleUrl} />
                        <span className="min-w-0 truncate" title={group.domain}>
                          {group.domain}
                        </span>
                      </div>
                      {group.items.map((item) => (
                        <div key={item.url} className="pl-7">
                          <UrlRow
                            item={item}
                            label={labelForUrl(item.url)}
                            onDelete={onDelete}
                            onMove={onMove}
                            moveTitle={moveTitle}
                            moveIcon={moveIcon}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
