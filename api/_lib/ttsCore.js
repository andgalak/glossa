import sdk from "microsoft-cognitiveservices-speech-sdk";

// One Greek voice for the MVP (the research's default). Voice choice is out of v1.
export const DEFAULT_VOICE = "el-GR-AthinaNeural";

// Azure reports offsets in 100-nanosecond ticks; convert to milliseconds.
const TICKS_PER_MS = 10000;

export class AzureNotConfiguredError extends Error {
  constructor() {
    super("Azure Speech is not configured");
    this.code = "AZURE_NOT_CONFIGURED";
  }
}

// Synthesize one paragraph to MP3 and collect per-word timing.
// Returns { audio (base64 mp3), mime, words: [{ text, audioOffset, duration, textOffset, wordLength }] }.
// audioOffset / duration are in milliseconds; textOffset / wordLength index into `text`.
export async function synthesize(text, voice = DEFAULT_VOICE) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) throw new AzureNotConfiguredError();

  const clean = (text ?? "").toString().trim();
  if (!clean) throw new Error("text is empty");

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = voice;
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

  // Passing null audioConfig keeps the audio in memory instead of playing it
  // on a (non-existent) server speaker.
  const synth = new sdk.SpeechSynthesizer(speechConfig, null);

  const words = [];
  synth.wordBoundary = (_s, e) => {
    // Skip punctuation-only boundaries; we only highlight real words.
    if (e.boundaryType === sdk.SpeechSynthesisBoundaryType.Punctuation) return;
    words.push({
      text: e.text,
      audioOffset: Math.round(e.audioOffset / TICKS_PER_MS),
      duration: Math.round(e.duration / TICKS_PER_MS),
      textOffset: e.textOffset,
      wordLength: e.wordLength,
    });
  };

  return new Promise((resolve, reject) => {
    synth.speakTextAsync(
      clean,
      result => {
        try {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const audio = Buffer.from(result.audioData).toString("base64");
            resolve({ audio, mime: "audio/mpeg", words });
          } else {
            reject(new Error(result.errorDetails || "Synthesis did not complete"));
          }
        } finally {
          synth.close();
        }
      },
      err => {
        synth.close();
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}
