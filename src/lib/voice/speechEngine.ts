export type VoiceConfig = {
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
  preferredVoiceName?: string;
};

export const defaultVoiceConfig: VoiceConfig = {
  rate: 0.92,
  pitch: 1.0,
  volume: 1.0,
  lang: "en-IN",
};

export enum Priority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export interface VoiceQueueItem {
  text: string;
  priority: Priority;
  id: string;
}

function createQueueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SpeechEngine {
  private queue: VoiceQueueItem[] = [];
  private isSpeakingState = false;
  private lastSpokenText = "";
  private currentPriority: Priority | null = null;
  private cancelled = false;
  private config: VoiceConfig;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor(config?: Partial<VoiceConfig>) {
    this.config = { ...defaultVoiceConfig, ...config };
    this.initVoice();
  }

  private initVoice(): void {
    if (!this.isAvailable()) return;

    const select = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.selectVoice(voices);
      } else {
        window.speechSynthesis.addEventListener(
          "voiceschanged",
          () => this.selectVoice(window.speechSynthesis.getVoices()),
          { once: true }
        );
      }
    };

    select();
  }

  private selectVoice(voices: SpeechSynthesisVoice[]): void {
    if (!voices.length) return;

    const preferred = this.config.preferredVoiceName
      ? voices.find((voice) => voice.name.includes(this.config.preferredVoiceName!))
      : null;

    this.selectedVoice =
      preferred ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-in")) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
      voices[0];
  }

  public speak(text: string, priority: Priority = Priority.NORMAL): void {
    if (!this.isAvailable()) return;
    if (text.trim() !== "" && text === this.lastSpokenText) return;

    const item: VoiceQueueItem = {
      text,
      priority,
      id: createQueueId(),
    };

    if (priority === Priority.CRITICAL) {
      this.cancel();
      this.queue.unshift(item);
      this.processQueue();
      return;
    }

    if (priority === Priority.HIGH) {
      if (this.isSpeakingState && this.currentPriority !== null && this.currentPriority <= Priority.NORMAL) {
        this.cancel();
      }
      this.queue.unshift(item);
      this.processQueue();
      return;
    }

    this.queue.push(item);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.isSpeakingState || !this.queue.length || !this.isAvailable()) {
      return;
    }

    const item = this.queue.shift()!;
    const utterance = new SpeechSynthesisUtterance(item.text);

    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;
    utterance.volume = this.config.volume;
    utterance.lang = this.config.lang;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    this.currentPriority = item.priority;
    this.isSpeakingState = true;
    this.cancelled = false;

    utterance.onend = () => {
      if (this.cancelled) {
        this.cancelled = false;
        this.isSpeakingState = false;
        this.currentPriority = null;
        return;
      }

      this.isSpeakingState = false;
      this.lastSpokenText = item.text;
      this.currentPriority = null;
      window.setTimeout(() => this.processQueue(), 50);
    };

    utterance.onerror = () => {
      this.isSpeakingState = false;
      this.currentPriority = null;
      window.setTimeout(() => this.processQueue(), 50);
    };

    speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (!this.isAvailable()) return;
    this.cancelled = true;
    speechSynthesis.cancel();
    this.queue = [];
    this.isSpeakingState = false;
    this.currentPriority = null;
  }

  public setConfig(partial: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...partial };
    if (partial.preferredVoiceName || partial.lang) {
      this.selectVoice(window.speechSynthesis.getVoices());
    }
  }

  public isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const speechEngine = new SpeechEngine();