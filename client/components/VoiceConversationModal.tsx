import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, X, Send, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { transcribeAudio } from "@/services/api";
import { cn } from "@/lib/utils";

interface VoiceConversationModalProps {
  open: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

type SessionState = "idle" | "recording" | "processing" | "done" | "error";

const NUM_BARS = 32;

function AudioWaveform({
  state,
  analyserRef,
}: {
  state: SessionState;
  analyserRef: React.RefObject<AnalyserNode | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      let bars: number[] = [];

      if (state === "recording" && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / NUM_BARS);
        bars = Array.from({ length: NUM_BARS }, (_, i) => {
          const val = dataArray[i * step] / 255;
          return Math.max(0.05, val);
        });
      } else if (state === "processing") {
        const t = Date.now() / 600;
        bars = Array.from({ length: NUM_BARS }, (_, i) => {
          return 0.15 + 0.55 * Math.abs(Math.sin(t + i * 0.35));
        });
      } else {
        bars = Array.from({ length: NUM_BARS }, () => 0.05);
      }

      const barW = W / (NUM_BARS * 1.6);
      const gap = (W - barW * NUM_BARS) / (NUM_BARS + 1);

      bars.forEach((val, i) => {
        const barH = Math.max(4, val * (H * 0.85));
        const x = gap + i * (barW + gap);
        const y = (H - barH) / 2;

        const isActive = state === "recording" || state === "processing";
        const alpha = isActive ? 0.9 : 0.25;

        // Gradient fill: blue → violet
        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, `rgba(99,102,241,${alpha})`);
        gradient.addColorStop(1, `rgba(59,130,246,${alpha})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, barW / 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={80}
      className="w-full"
      aria-hidden="true"
    />
  );
}

export function VoiceConversationModal({
  open,
  onClose,
  onTranscript,
}: VoiceConversationModalProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopTimer();
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    recorderRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, [stopTimer]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      cleanup();
      setSessionState("idle");
      setTranscript("");
      setDuration(0);
    }
  }, [open, cleanup]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API analyser for waveform
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close();
        streamRef.current = null;
        audioCtxRef.current = null;
        analyserRef.current = null;

        setSessionState("processing");
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const text = await transcribeAudio(blob);
          setTranscript(text);
          setSessionState("done");
        } catch (err) {
          setSessionState("error");
          toast.error(
            err instanceof Error ? err.message : "Unable to transcribe recording."
          );
        }
      };

      recorder.start();
      setSessionState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setSessionState("error");
      toast.error("Microphone access is required for voice input.");
    }
  }, [stopTimer]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const handleSend = useCallback(() => {
    if (!transcript.trim()) return;
    onTranscript(transcript.trim());
    onClose();
  }, [transcript, onTranscript, onClose]);

  const handleRetry = useCallback(() => {
    setTranscript("");
    setSessionState("idle");
    setDuration(0);
  }, []);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const stateLabel: Record<SessionState, string> = {
    idle: "Tap the mic to start speaking",
    recording: "Listening...",
    processing: "Transcribing your speech...",
    done: "Transcription ready",
    error: "Something went wrong",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-full max-w-sm gap-0 overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        aria-describedby={undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Volume2 className="size-4 text-indigo-500" />
            Voice Input
          </DialogTitle>
          <button
            onClick={onClose}
            aria-label="Close voice dialog"
            className="flex size-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Waveform */}
        <div className="mx-5 mt-4 overflow-hidden rounded-2xl bg-slate-50 px-3 py-4 dark:bg-slate-900">
          <AudioWaveform state={sessionState} analyserRef={analyserRef} />
          <div className="mt-2 flex items-center justify-center gap-2">
            {sessionState === "recording" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                <span className="size-1.5 animate-pulse rounded-full bg-rose-500" />
                {formatDuration(duration)}
              </span>
            )}
            {sessionState === "processing" && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 className="size-3 animate-spin" />
                Transcribing...
              </span>
            )}
            {(sessionState === "idle" || sessionState === "done" || sessionState === "error") && (
              <span className="text-xs text-slate-400">{stateLabel[sessionState]}</span>
            )}
          </div>
        </div>

        {/* Live transcript */}
        {(sessionState === "done" || sessionState === "error") && (
          <div className="mx-5 mt-3 min-h-[60px] rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {sessionState === "done" && transcript
              ? transcript
              : <span className="text-slate-400 italic">No transcript available.</span>}
          </div>
        )}

        {/* Status label for idle/recording/processing */}
        {(sessionState === "idle" || sessionState === "recording" || sessionState === "processing") && (
          <p className="mt-3 px-5 text-center text-xs text-slate-400">
            {stateLabel[sessionState]}
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 px-5 pb-5 pt-4">
          {/* Cancel / Retry */}
          {(sessionState === "done" || sessionState === "error") ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="rounded-full px-4 text-xs"
            >
              Try again
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full px-4 text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </Button>
          )}

          {/* Main mic / stop button */}
          {sessionState !== "done" && sessionState !== "error" && (
            <button
              onClick={sessionState === "recording" ? stopRecording : startRecording}
              disabled={sessionState === "processing"}
              aria-label={sessionState === "recording" ? "Stop recording" : "Start recording"}
              className={cn(
                "flex size-16 items-center justify-center rounded-full shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                sessionState === "idle"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
                  : sessionState === "recording"
                    ? "bg-rose-500 text-white hover:bg-rose-600 hover:scale-105"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800"
              )}
            >
              {sessionState === "recording" ? (
                <Square className="size-6 fill-current" />
              ) : sessionState === "processing" ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <Mic className="size-6" />
              )}
            </button>
          )}

          {/* Send to chat */}
          {sessionState === "done" && (
            <Button
              onClick={handleSend}
              disabled={!transcript.trim()}
              size="sm"
              className="rounded-full bg-indigo-600 px-5 text-xs text-white hover:bg-indigo-700"
            >
              <Send className="mr-1.5 size-3" />
              Send to chat
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
