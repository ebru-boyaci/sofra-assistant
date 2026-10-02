import { applyStreamEvent, createEmptyAssembly, markIncompleteIfNeeded } from './assembleStream'
import { createNdjsonParser } from './ndjsonParser'
import type { AssembledStream } from './streamTypes'

export type StreamTurnHandle = {
  readonly generation: number // this turn's id
  push: (chunk: Uint8Array) => void // feed one chunk
  finish: () => AssembledStream // body ended
  getSnapshot: () => AssembledStream
  isCurrent: () => boolean
}

// One chat turn. A newer turn stops the old one from writing.
export function createStreamSession() {
  let generation = 0 // current turn id
  let assembly = createEmptyAssembly()
  let seenSeqs = new Set<number>() // seqs already applied this turn

  const bump = () => {
    generation += 1 // old chunks are ignored after this
    assembly = createEmptyAssembly()
    seenSeqs = new Set()
    return generation
  }

  return {
    beginTurn(): StreamTurnHandle {
      const gen = bump()
      const parser = createNdjsonParser((value) => {
        if (gen !== generation) return // stale turn
        assembly = applyStreamEvent(assembly, value, seenSeqs)
      })

      return {
        generation: gen,
        push(chunk: Uint8Array) {
          if (gen !== generation) return // stale turn
          parser.push(chunk)
        },
        finish() {
          if (gen !== generation) return assembly
          parser.end()
          assembly = markIncompleteIfNeeded(assembly) // no done -> incomplete
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
      bump() // stop the in-flight turn
    },

    get generation() {
      return generation
    },
  }
}

export type StreamSession = ReturnType<typeof createStreamSession>
