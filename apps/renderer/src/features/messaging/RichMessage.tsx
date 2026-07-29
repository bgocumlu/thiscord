import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function highlightMentions(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return children.split(/(@(?:everyone|[a-z0-9._-]{2,32}))/gi).map((part, index) => (
      /^@(?:everyone|[a-z0-9._-]{2,32})$/i.test(part)
        ? <span className="message-mention" key={`${part}-${index}`}>{part}</span>
        : part
    ))
  }
  if (Array.isArray(children)) return children.map((child) => highlightMentions(child))
  return children
}

export default function RichMessage({ content, embedsEnabled }: {
  readonly content: string
  readonly embedsEnabled: boolean
}) {
  const urls = Array.from(new Set(content.match(/https?:\/\/[^\s<]+/gi) ?? [])).slice(0, 3)
  return (
    <div className="message-content">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="nofollow noopener noreferrer">
              {children}<ExternalLink size={12} />
            </a>
          ),
          p: ({ children }) => <p>{highlightMentions(children)}</p>,
          li: ({ children }) => <li>{highlightMentions(children)}</li>,
        }}
      >
        {content}
      </Markdown>
      {embedsEnabled && urls.length ? (
        <div className="link-previews">
          {urls.map((url) => {
            let label = url
            try {
              const parsed = new URL(url)
              label = `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`
            } catch {
              // The Markdown link remains usable if URL parsing fails.
            }
            return (
              <a href={url} target="_blank" rel="nofollow noopener noreferrer" key={url}>
                <ExternalLink size={15} />
                <span><strong>{label}</strong><small>{url}</small></span>
              </a>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
