import * as React from "react"

const HEX_COLOR_PATTERN = /#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})(?![A-Fa-f0-9])/g

export function toSwatchColor(hex: string): string {
  return hex.length === 9 ? hex.slice(0, 7) : hex
}

export function isHexColor(text: string): boolean {
  return /^(#[A-Fa-f0-9]{8}|#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})$/.test(text.trim())
}

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block size-2.5 rounded-sm shrink-0 border border-white/10"
      style={{ backgroundColor: toSwatchColor(hex) }}
      aria-hidden
    />
  )
}

export function HexColorCode({ hex }: { hex: string }) {
  return (
    <code className="inline-flex items-center gap-1.5 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
      <ColorSwatch hex={hex} />
      {hex}
    </code>
  )
}

function HexColorInline({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle whitespace-nowrap">
      <ColorSwatch hex={hex} />
      <span className="font-mono text-xs">{hex}</span>
    </span>
  )
}

export function renderTextWithHexColors(
  text: string,
  keyPrefix = "",
): React.ReactNode {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  const regex = new RegExp(HEX_COLOR_PATTERN.source, "g")
  let match: RegExpExecArray | null
  let i = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const hex = `#${match[1]}`
    nodes.push(
      <HexColorInline key={`${keyPrefix}${match.index}-${i++}`} hex={hex} />,
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length === 1 ? nodes[0] : nodes
}

function getTextContent(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(getTextContent).join("")
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getTextContent(node.props.children)
  }
  return ""
}

export function getInlineCodeText(children: React.ReactNode): string {
  return getTextContent(children).trim()
}

export function renderChildrenWithHexColors(
  children: React.ReactNode,
  skipTags = new Set(["code", "pre"]),
): React.ReactNode {
  return React.Children.map(children, (child, index) => {
    if (typeof child === "string") {
      return renderTextWithHexColors(child, `${index}-`)
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      const tagName = typeof child.type === "string" ? child.type : null

      // Leave custom (function/class) components untouched — react-markdown
      // wraps inline code in a function component before our `code` handler runs.
      if (!tagName) {
        return child
      }

      if (skipTags.has(tagName)) {
        return child
      }

      if (child.props.children != null) {
        return React.cloneElement(
          child,
          { key: child.key ?? index },
          renderChildrenWithHexColors(child.props.children, skipTags),
        )
      }
    }

    return child
  })
}
