export type NdjsonParser = {
  push: (chunk: Uint8Array) => void // feed one chunk
  end: () => void // stream finished
}

export function createNdjsonParser(
  onEvent: (value: unknown) => void, // a full line parsed OK
  onMalformedLine?: (line: string, error: unknown) => void,
): NdjsonParser {
  const decoder = new TextDecoder('utf-8')
  let lineBuffer = '' // text still waiting for a newline

  // Hand every finished line to onEvent. Keep the tail that has no \n yet.
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
      // stream: true holds a letter cut in half for the next chunk
      lineBuffer += decoder.decode(chunk, { stream: true })
      consumeCompleteLines()
    },
    end() {
      lineBuffer += decoder.decode() // write any held letter
      consumeCompleteLines()
      lineBuffer = ''
    },
  }
}
