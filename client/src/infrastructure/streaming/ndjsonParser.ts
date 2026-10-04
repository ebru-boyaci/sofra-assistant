export type NdjsonParser = {
  push: (chunk: Uint8Array) => void
  end: () => void
}

export function createNdjsonParser(
  onEvent: (value: unknown) => void,
  onMalformedLine?: (line: string, error: unknown) => void,
): NdjsonParser {
  const decoder = new TextDecoder('utf-8')
  let lineBuffer = ''

  const consumeCompleteLines = () => {
    let newlineAt = lineBuffer.indexOf('\n')
    while (newlineAt !== -1) {
      const line = lineBuffer.slice(0, newlineAt)
      lineBuffer = lineBuffer.slice(newlineAt + 1)
      if (line.length > 0) {
        try {
          onEvent(JSON.parse(line) as unknown)
        } catch (error) {
          onMalformedLine?.(line, error)
        }
      }
      newlineAt = lineBuffer.indexOf('\n')
    }
  }

  return {
    push(chunk: Uint8Array) {
      // Chunks can end inside a multi-byte character; stream: true holds the
      // partial bytes until the next chunk instead of emitting U+FFFD.
      lineBuffer += decoder.decode(chunk, { stream: true })
      consumeCompleteLines()
    },
    end() {
      lineBuffer += decoder.decode()
      consumeCompleteLines()
      lineBuffer = ''
    },
  }
}
