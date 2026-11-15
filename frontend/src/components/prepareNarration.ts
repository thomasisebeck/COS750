/** Prepare visible lesson text for spoken narration.
 * Decorative emojis are useful on screen, but should not be read aloud as
 * "sparkles", "trophy", etc. Keep ordinary words and graph notation intact.
 * This is shared by the browser voice and the optional natural voice service.
 */
const emojiSequence = /(?:\p{Regional_Indicator}{2}|[\p{Emoji_Presentation}\p{Extended_Pictographic}][\uFE0E\uFE0F]?(?:\p{Emoji_Modifier})?(?:\u200D[\p{Emoji_Presentation}\p{Extended_Pictographic}][\uFE0E\uFE0F]?(?:\p{Emoji_Modifier})?)*)/gu;

export function prepareNarrationText(text: string): string {
  return text
    // Read graph arrows as relationships, not as symbol names.
    .replace(/↔|⟷/gu, " in both directions ")
    .replace(/[→➝➜]/gu, " to ")
    .replace(/←/gu, " from ")
    // Preserve the numeric meaning of keycap emojis (1️⃣ -> 1).
    .replace(/([0-9])\uFE0F?\u20E3/gu, "$1")
    .replace(emojiSequence, " ")
    // Clean up standalone components of compound emojis and decorative bullets.
    .replace(/\uFE0E|\uFE0F|\u200D|\u20E3/gu, "")
    .replace(/[\u{E0020}-\u{E007F}]/gu, "")
    .replace(/[•●◦▪◆◇✦✧]/gu, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
