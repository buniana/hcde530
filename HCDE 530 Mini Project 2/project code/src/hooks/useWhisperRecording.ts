import { useState, useRef, useCallback } from 'react';
import { transcribeAudio, cleanTranscript } from '../api/openai';

export function useWhisperRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef<((text: string) => void) | null>(null);

  const startRecording = useCallback(async (onTranscript: (text: string) => void) => {
    setError('');
    onTranscriptRef.current = onTranscript;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access was blocked — please allow mic access in your browser settings.');
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      // console.log('chunks:', chunksRef.current.length, 'blob size:', audioBlob.size); // ← add this
      chunksRef.current = [];

      setIsRecording(false);
      setIsTranscribing(true);
      try {
        const rawText = await transcribeAudio(audioBlob);
        if (rawText.trim()) {
          const cleanedText = await cleanTranscript(rawText.trim());
          onTranscriptRef.current?.(cleanedText || rawText.trim());
      }
      } catch {
        setError("Couldn't transcribe audio — try again");
      } finally {
        setIsTranscribing(false);
        onTranscriptRef.current = null;
      }
    };

    mediaRecorder.start(250);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      mr.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  return { isRecording, isTranscribing, error, startRecording, stopRecording };
}
