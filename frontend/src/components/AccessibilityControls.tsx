import { useState } from "react";
import { Accessibility, Check, X } from "lucide-react";

interface AccessibilityControlsProps {
  highContrast: boolean;
  onContrastChange: (enabled: boolean) => void;
  reducedMotion: boolean;
  onMotionChange: (enabled: boolean) => void;
  soundEnabled: boolean;
  onSoundChange: (enabled: boolean) => void;
  soundVolume: number;
  onVolumeChange: (volume: number) => void;
}

/** Preferences add to—not replace—text labels, symbols and colour-safe feedback. */
export function AccessibilityControls({
  highContrast, onContrastChange, reducedMotion, onMotionChange, soundEnabled, onSoundChange, soundVolume, onVolumeChange,
}: AccessibilityControlsProps) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="pf-accessibility" aria-label="Accessibility options">
      {open && <div className="pf-access-panel" role="group" aria-label="Display preferences">
        <div className="pf-access-heading"><strong>Make it yours</strong><button type="button" aria-label="Close accessibility settings" onClick={() => setOpen(false)}><X size={16}/></button></div>
        <p>Graph states are always labelled. Colour is never your only clue.</p>
        <button type="button" role="switch" aria-checked={highContrast} className="pf-access-setting" onClick={() => onContrastChange(!highContrast)}><span>High contrast</span><span className={`pf-switch ${highContrast ? "on" : ""}`}>{highContrast && <Check size={12}/>}</span></button>
        <button type="button" role="switch" aria-checked={reducedMotion} className="pf-access-setting" onClick={() => onMotionChange(!reducedMotion)}><span>Reduce animations</span><span className={`pf-switch ${reducedMotion ? "on" : ""}`}>{reducedMotion && <Check size={12}/>}</span></button>
        <button type="button" role="switch" aria-checked={soundEnabled} className="pf-access-setting" onClick={() => onSoundChange(!soundEnabled)}><span>Sound feedback</span><span className={`pf-switch ${soundEnabled ? "on" : ""}`}>{soundEnabled && <Check size={12}/>}</span></button>
        <div className="pf-volume-control"><label htmlFor="pf-audio-volume">Feedback volume <strong>{soundVolume}%</strong></label>
          <input id="pf-audio-volume" type="range" min="0" max="100" step="5" value={soundVolume} disabled={!soundEnabled}
            onChange={(event)=>onVolumeChange(Number(event.target.value))}/>
        </div>
      </div>}
      <button type="button" className="pf-access-trigger" aria-expanded={open} aria-label="Accessibility and display preferences" onClick={() => setOpen(!open)}><Accessibility size={22}/><span>Access</span></button>
    </aside>
  );
}
