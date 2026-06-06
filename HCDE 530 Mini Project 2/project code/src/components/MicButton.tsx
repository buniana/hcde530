import { useCallback, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useWhisperRecording } from '../hooks/useWhisperRecording';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function MicButton({ onTranscript, disabled }: MicButtonProps) {
  const { isRecording, isTranscribing, error, startRecording, stopRecording } = useWhisperRecording();

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const handleClick = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else if (!isTranscribing) {
      await startRecording((text) => onTranscriptRef.current(text));
    }
  }, [isRecording, isTranscribing, startRecording, stopRecording]);

  const active = isRecording || isTranscribing;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClick}
        disabled={disabled || isTranscribing}
        aria-label={
          isTranscribing ? 'Transcribing audio' : isRecording ? 'Stop recording' : 'Start voice input'
        }
        className={[
          'relative flex items-center justify-center w-7 h-7 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-primary',
          active ? 'text-white bg-danger hover:bg-danger/90' : 'text-text-muted hover:text-primary hover:bg-primary/10',
          disabled || isTranscribing ? 'opacity-40 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-danger animate-ping opacity-50" aria-hidden="true" />
        )}
        {isTranscribing ? (
          <span
            className="relative z-10 w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        ) : isRecording ? (
          <MicOff className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
        ) : (
          <Mic className="w-3.5 h-3.5" aria-hidden="true" />
        )}
      </button>
      {error && <span className="text-[11px] text-danger whitespace-nowrap">{error}</span>}
      {isTranscribing && <span className="text-[11px] text-text-muted whitespace-nowrap">Transcribing...</span>}
    </div>
  );
}
