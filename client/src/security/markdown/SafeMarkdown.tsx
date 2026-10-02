import type { ReactNode } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import styles from './SafeMarkdown.module.css'
import { isHttpUrl, sanitizeMarkdownUrl } from './urlPolicy'

type Props = {
  markdown: string
  className?: string
}

function SafeLink({
  href,
  children,
}: {
  href?: string
  children?: ReactNode
}) {
  if (!href) {
    return <span className={styles.blockedLink}>{children}</span>
  }

  const external = isHttpUrl(href)

  return (
    <a
      className={styles.link}
      href={href}
      {...(external
        ? {
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        : {})}
    >
      {children}
      {external && (
        <span className={styles.externalMark} aria-label="opens in new tab">
          ↗
        </span>
      )}
    </a>
  )
}

function SafeImage({ alt }: { alt?: string }) {
  const label = alt && alt.trim().length > 0 ? alt.trim() : 'image'
  return (
    <span className={styles.imageStub}>
      [Image not loaded: <span className={styles.imageAlt}>{label}</span>]
    </span>
  )
}

const components: Components = {
  a: ({ href, children }) => <SafeLink href={href}>{children}</SafeLink>,
  img: ({ alt }) => <SafeImage alt={alt} />,
}

export function SafeMarkdown({ markdown, className }: Props) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <ReactMarkdown urlTransform={sanitizeMarkdownUrl} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
