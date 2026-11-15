import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Square, Volume2, VolumeX } from "lucide-react";
import { speechChunks } from "./speechChunks";
import { prepareNarrationText } from "./prepareNarration";

/** Speak with a natural voice when a private /api/tts route is configured.
 * Otherwise use the highest-quality English voice available on this device.
 * The audio is explicitly user-initiated and can be stopped at any time.
 */
export function SpeechButton({ text, getText }: { text: string; getText?: (button: HTMLElement) => string }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const currentSpeech = useRef<SpeechSynthesisUtterance | null>(null);
  const session = useRef(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const available = typeof window !== "undefined" && ("speechSynthesis" in window || typeof Audio !== "undefined");

  const stop = () => {
    session.current++;
    controller.current?.abort();
    controller.current = null;
    if (audio.current) { audio.current.pause(); audio.current.currentTime = 0; audio.current = null; }
    if (objectUrl.current) { URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    currentSpeech.current = null;
    setPlaying(false);
    setLoading(false);
  };

  useEffect(() => {
    const activeSession = session;
    return () => {
      activeSession.current++;
      controller.current?.abort();
      audio.current?.pause();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      window.speechSynthesis?.cancel();
    };
  }, [text]);

  function browserVoice(mySession: number, narration: string) {
    if (!("speechSynthesis" in window) || mySession !== session.current) {
      setLoading(false);
      setPlaying(false);
      return;
    }
    const engine = window.speechSynthesis;
    engine.cancel();
    const voices = engine.getVoices().filter((voice) => /^en(?:[-_]|$)/i.test(voice.lang));
    const score = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase();
      return (/natural|neural|enhanced|premium/.test(name) ? 200 : 0) +
        (/online/.test(name) ? 40 : 0) +
        (/microsoft|google|samantha|aria|jenny|sonia/.test(name) ? 12 : 0) +
        (/en[-_]za/i.test(voice.lang) ? 8 : /en[-_]gb/i.test(voice.lang) ? 7 : 5);
    };
    const chosen = voices.sort((a,b) => score(b) - score(a))[0];
    const spokenText = narration.replace(/Dijkstra(?:’s|'s)?/gi, "Dike-stra's");
    const chunks = speechChunks(spokenText);
    let chunkIndex = 0;
    setLoading(false);
    setPlaying(true);
    function speakNext() {
      if (mySession !== session.current) return;
      if (chunkIndex >= chunks.length) {setPlaying(false);return;}
      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex++]);
      utterance.voice = chosen ?? null;
      utterance.lang = chosen?.lang ?? "en-GB";
      utterance.rate = .93;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = speakNext;
      utterance.onerror = () => {if (mySession === session.current) setPlaying(false);};
      currentSpeech.current = utterance;
      engine.speak(utterance);
    }
    speakNext();
  }

  async function toggle() {
    if (!available) return;
    if (playing || loading) { stop(); return; }
    stop();
    const narration = prepareNarrationText((buttonRef.current && getText?.(buttonRef.current)) || text);
    if (!narration) return;
    const mySession = session.current;
    const pending = new AbortController();
    controller.current = pending;
    setLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narration }),
        signal: pending.signal,
      });
      if (!response.ok || !response.headers.get("content-type")?.includes("audio/")) {
        throw new Error("Natural narration unavailable");
      }
      const blob = await response.blob();
      if (mySession !== session.current) return;
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;
      const player = new Audio(url);
      audio.current = player;
      player.onended = () => {if (mySession === session.current) stop();};
      player.onerror = () => {if (mySession === session.current) { stop(); browserVoice(session.current, narration); }};
      await player.play();
      if (mySession !== session.current) return;
      setLoading(false);
      setPlaying(true);
    } catch (error) {
      if (mySession !== session.current || pending.signal.aborted) return;
      if (error instanceof Error && error.name === "AbortError") return;
      if (audio.current) {audio.current.pause();audio.current = null;}
      if (objectUrl.current) {URL.revokeObjectURL(objectUrl.current);objectUrl.current = null;}
      browserVoice(mySession, narration);
    }
  }

  return <button
    ref={buttonRef}
    type="button"
    className="pf-speech-button"
    disabled={!available}
    onClick={() => { void toggle(); }}
    aria-label={!available ? "Narration unavailable in this browser" : loading ? "Stop loading narration" : playing ? "Stop narration" : "Read this page, including its examples and questions"}
    title="Read this page: headings, explanations, graph, questions and visible feedback"
  >
    {!available ? <VolumeX size={17}/> : loading ? <LoaderCircle size={17} className="pf-speech-loading"/> : playing ? <Square size={14}/> : <Volume2 size={17}/>}
    <span>{!available ? "No voice" : loading ? "Loading" : playing ? "Stop" : "Listen"}</span>
  </button>;
}
