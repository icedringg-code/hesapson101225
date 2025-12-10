import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VoiceCommand {
  action: 'add_transaction' | 'add_job' | 'add_company' | 'view_company' | 'view_job' | 'unknown';
  data?: {
    companyName?: string;
    amount?: number;
    type?: 'income' | 'expense';
    description?: string;
    jobName?: string;
    contractAmount?: number;
    status?: string;
    paymentMethod?: string;
    currencyType?: 'TRY' | 'USD' | 'EUR' | 'GOLD';
    goldAmount?: number;
    goldPrice?: number;
  };
  message: string;
  needsMoreInfo?: boolean;
  nextQuestion?: string;
  completed?: boolean;
}

interface ConversationState {
  action: string | null;
  step: number;
  data: Record<string, any>;
}

interface VoiceAssistantProps {
  onCommandReceived?: (command: VoiceCommand) => void;
}

export default function VoiceAssistant({ onCommandReceived }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState<ConversationState>({
    action: null,
    step: 0,
    data: {}
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError('');
      setStatusMessage('Mikrofon erişimi isteniyor...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatusMessage('Konuşabilirsiniz...');
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini kontrol edin.');
      setStatusMessage('');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatusMessage('İşleniyor...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('conversationState', JSON.stringify(conversation));

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/voice-assistant`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ses işleme başarısız');
      }

      const result = await response.json();
      console.log('Voice Assistant Result:', result);
      console.log('Transcription:', result.transcription);
      console.log('Command:', result.command);

      const command = result.command;

      setStatusMessage(`Anlaşıldı: ${result.transcription}`);

      if (command.needsMoreInfo) {
        setConversation({
          action: command.action,
          step: conversation.step + 1,
          data: { ...conversation.data, ...command.data }
        });

        setTimeout(() => {
          if (command.nextQuestion) {
            setStatusMessage(command.nextQuestion);
          }
        }, 1500);
      } else if (command.completed) {
        if (onCommandReceived) {
          onCommandReceived(command);
        }

        setConversation({
          action: null,
          step: 0,
          data: {}
        });

        setTimeout(() => {
          setStatusMessage('');
        }, 2000);
      } else {
        if (onCommandReceived) {
          onCommandReceived(command);
        }

        setTimeout(() => {
          setStatusMessage('');
        }, 2000);
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Ses işlenirken bir hata oluştu');
      setStatusMessage('');
      setConversation({
        action: null,
        step: 0,
        data: {}
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all z-50 ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
            : isProcessing
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
        }`}
        title={isRecording ? 'Kaydı Durdur' : 'Sesli Komut'}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>

      {(statusMessage || error) && (
        <div className="fixed bottom-24 right-6 max-w-xs z-50">
          {statusMessage && (
            <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg mb-2">
              <p className="text-sm font-medium">{statusMessage}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
