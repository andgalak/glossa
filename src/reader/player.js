// Plays a single paragraph and reports word progress as a character offset into
// the paragraph text, so the UI highlights the same way whether the audio comes
// from Azure (exact timings) or the browser's speech synthesis (fallback).
//
// Callbacks: onBoundary(charOffset), onEnd(), onState("playing"|"paused"|"ended").

function pickGreekVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  return voices.find(v => (v.lang || "").toLowerCase().startsWith("el")) || null;
}

// speechSynthesis voices can load asynchronously; warm them up once.
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

export const browserTTSAvailable =
  typeof window !== "undefined" && !!window.speechSynthesis;

export class ParagraphPlayer {
  constructor({ onBoundary, onEnd, onState } = {}) {
    this.onBoundary = onBoundary || (() => {});
    this.onEnd = onEnd || (() => {});
    this.onState = onState || (() => {});
    this.mode = null; // "azure" | "browser"
    this.rate = 1;
    this.text = "";
    this.words = [];
    this.audio = null;
    this._raf = null;
    this._utter = null;
  }

  setRate(r) {
    this.rate = r;
    if (this.audio) this.audio.playbackRate = r;
    // Browser speech rate only takes effect on the next utterance.
  }

  // Azure: a data-URL mp3 plus word boundaries [{ audioOffset(ms), textOffset }].
  loadAzure(audioUrl, words, text) {
    this._teardown();
    this.mode = "azure";
    this.text = text;
    this.words = words || [];
    this.audio = new Audio(audioUrl);
    this.audio.playbackRate = this.rate;
    this.audio.onended = () => {
      this._stopRaf();
      this.onState("ended");
      this.onEnd();
    };
  }

  loadBrowser(text) {
    this._teardown();
    this.mode = "browser";
    this.text = text;
    this.words = [];
  }

  play(fromChar = 0) {
    if (this.mode === "azure") {
      const w =
        this.words.find(w => w.textOffset >= fromChar) || this.words[0];
      if (w) this.audio.currentTime = w.audioOffset / 1000;
      this.audio.playbackRate = this.rate;
      this.audio.play();
      this._startRaf();
      this.onState("playing");
    } else if (this.mode === "browser") {
      this._speak(fromChar);
    }
  }

  pause() {
    if (this.mode === "azure") {
      this.audio.pause();
      this._stopRaf();
    } else if (this.mode === "browser") {
      window.speechSynthesis.pause();
    }
    this.onState("paused");
  }

  resume() {
    if (this.mode === "azure") {
      this.audio.play();
      this._startRaf();
      this.onState("playing");
    } else if (this.mode === "browser") {
      window.speechSynthesis.resume();
      this.onState("playing");
    }
  }

  _speak(fromChar) {
    const slice = this.text.slice(fromChar);
    const u = new SpeechSynthesisUtterance(slice);
    u.lang = "el-GR";
    u.rate = this.rate;
    const voice = pickGreekVoice();
    if (voice) u.voice = voice;
    u.onboundary = e => {
      if (e.charIndex != null) this.onBoundary(fromChar + e.charIndex);
    };
    u.onend = () => {
      this.onState("ended");
      this.onEnd();
    };
    this._utter = u;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    this.onState("playing");
  }

  _startRaf() {
    const tick = () => {
      const t = this.audio.currentTime * 1000;
      let off = 0;
      for (const w of this.words) {
        if (w.audioOffset <= t) off = w.textOffset;
        else break;
      }
      this.onBoundary(off);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  _stopRaf() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _teardown() {
    this._stopRaf();
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this._utter = null;
  }

  destroy() {
    this._teardown();
  }
}
