/** Split long browser narration into sentence-sized utterances.
 * Some browser speech engines stop mid-way through very long utterances.
 */
export function speechChunks(text: string, maxLength = 240): string[] {
  const sentences = text.trim().match(/[^.!?]+[.!?]*/g) ?? [];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    let chunk = "";
    for (const word of words) {
      const candidate = chunk ? `${chunk} ${word}` : word;
      if (candidate.length > maxLength && chunk) {chunks.push(chunk);chunk = word;}
      else chunk = candidate;
    }
    if (chunk) {
      const previous = chunks.at(-1);
      if (previous && previous.length + chunk.length + 1 <= maxLength) chunks[chunks.length-1] = `${previous} ${chunk}`;
      else chunks.push(chunk);
    }
  }
  return chunks;
}
