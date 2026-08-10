import type { PageBlock } from '@/lib/classroom-store'

const sizes = { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl' }
const weights = { normal: 'font-normal', medium: 'font-medium', bold: 'font-bold' }

export function PageBlockRenderer({ block }: { block: PageBlock }) {
  const style = { color: block.color, backgroundColor: block.background === 'transparent' ? undefined : block.background, textAlign: block.align, fontStyle: block.fontStyle ?? 'normal', textDecoration: block.textDecoration ?? 'none' } as const
  const classes = `rounded-lg px-3 py-2 ${sizes[block.fontSize]} ${weights[block.fontWeight]}`
  if (block.type === 'divider') return <hr className="my-4 border-border" />
  if (block.type === 'notice') return <div className={`${classes} border-l-4`} style={{ ...style, borderLeftColor: block.borderColor ?? block.color }}>{block.content}</div>
  if (block.type === 'link') return <a className={`${classes} block underline`} style={style} href={block.url || '#'} target="_blank" rel="noreferrer">{block.content || block.url}</a>
  if (block.type === 'resource') return <a className={`${classes} block border border-border hover:shadow-sm`} style={style} href={block.url || '#'} target="_blank" rel="noreferrer"><span className="block font-bold">{block.content}</span><span className="text-sm opacity-70">Open resource</span></a>
  const Tag = block.type === 'heading' ? 'h2' : 'p'
  return <Tag className={classes} style={style}>{block.content}</Tag>
}
