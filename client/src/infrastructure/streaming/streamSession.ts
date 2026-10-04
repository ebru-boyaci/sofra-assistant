import { applyStreamEvent, createEmptyAssembly, markIncompleteIfNeeded } from './assembleStream'
import { createNdjsonParser } from './ndjsonParser'
import type { AssembledStream } from './streamTypes'

export type StreamTurnHandle = {
  readonly generation: number
  push: (chunk: Uint8Array) => void
  finish: () => AssembledStream
  getSnapshot: () => AssembledStream
  isCurrent: () => boolean
}

// Every beginTurn() and abort() bumps the generation. A handle from an older
// generation can no longer write, so a stopped or replaced stream never lands
// in the next turn.
export function createStreamSession() {
  let generation = 0
  let assembly = createEmptyAssembly()
  let seenSeqs = new Set<number>()

  const bump = () => {
    generation += 1
    assembly = createEmptyAssembly()
    seenSeqs = new Set()
    return generation
  }

  return {
    beginTurn(): StreamTurnHandle {
      const gen = bump()
      const parser = createNdjsonParser((value) => {
        if (gen !== generation) return
        assembly = applyStreamEvent(assembly, value, seenSeqs)
      })

      return {
        generation: gen,
        push(chunk: Uint8Array) {
          if (gen !== generation) return
          parser.push(chunk)
        },
        finish() {
          if (gen !== generation) return assembly
          parser.end()
          assembly = markIncompleteIfNeeded(assembly)
          return assembly
        },
        getSnapshot() {
          return assembly
        },
        isCurrent() {
          return gen === generation
        },
      }
    },

    abort() {
      bump()
    },

    get generation() {
      return generation
    },
  }
}

export type StreamSession = ReturnType<typeof createStreamSession>
