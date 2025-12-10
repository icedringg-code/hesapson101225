import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    currencyType?: 'TL' | 'Dolar' | 'Altın';
    goldAmount?: number;
    goldPrice?: number;
    startDate?: string;
    endDate?: string;
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const conversationStateStr = formData.get('conversationState') as string;

    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    let conversationState: ConversationState = {
      action: null,
      step: 0,
      data: {}
    };

    if (conversationStateStr) {
      try {
        conversationState = JSON.parse(conversationStateStr);
      } catch (e) {
        console.error('Failed to parse conversation state:', e);
      }
    }

    const transcriptionFormData = new FormData();
    transcriptionFormData.append('file', audioFile);
    transcriptionFormData.append('model', 'whisper-1');
    transcriptionFormData.append('language', 'tr');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: transcriptionFormData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    const transcription = await transcriptionResponse.json();
    const text = transcription.text;

    console.log('Transcribed text:', text);

    let systemPrompt = '';

    if (conversationState.action) {
      systemPrompt = `Kullanıcıyla "${conversationState.action}" işlemi için konuşma devam ediyor.

Şu ana kadar toplanan bilgiler:
${JSON.stringify(conversationState.data, null, 2)}

Adım: ${conversationState.step}

Kullanıcının yeni cevabını analiz et ve eksik bilgileri topla.

${conversationState.action === 'add_job' ? `
İŞ EKLEME İÇİN GEREKLİ BİLGİLER:
1. İş adı (jobName) - ZORUNLU
2. Açıklama (description) - opsiyonel
3. Başlangıç tarihi (startDate) - ZORUNLU (YYYY-MM-DD formatında)
4. Bitiş tarihi (endDate) - opsiyonel (YYYY-MM-DD formatında)
5. Sözleşme tutarı (contractAmount) - opsiyonel
` : ''}

${conversationState.action === 'add_company' ? `
FİRMA EKLEME İÇİN GEREKLİ BİLGİLER:
1. Firma adı (companyName) - ZORUNLU
2. Firma tipi (İşveren/Çalışan) - otomatik İşveren
` : ''}

${conversationState.action === 'add_transaction' ? `
İŞLEM EKLEME İÇİN GEREKLİ BİLGİLER:
1. İşlem tipi (type: income/expense) - ZORUNLU
2. Tutar (amount) - ZORUNLU
3. Açıklama (description) - opsiyonel
4. Ödeme yöntemi (paymentMethod: cash/bank_transfer/check) - opsiyonel
5. Para birimi (currencyType: TL/Dolar/Altın) - opsiyonel
` : ''}

Eğer tüm ZORUNLU bilgiler toplandıysa:
{
  "action": "${conversationState.action}",
  "data": {...tüm toplanan bilgiler...},
  "message": "Bilgiler tamamlandı, ekleniyor...",
  "completed": true,
  "needsMoreInfo": false
}

Eğer hala eksik ZORUNLU bilgi varsa:
{
  "action": "${conversationState.action}",
  "data": {...şu ana kadar toplanan bilgiler...},
  "message": "Anladım: [kullanıcının son cevabı]",
  "needsMoreInfo": true,
  "nextQuestion": "[bir sonraki sorunuz]",
  "completed": false
}`;
    } else {
      systemPrompt = `Sen bir iş takip uygulaması için sesli asistansın. Kullanıcının Türkçe komutunu analiz et ve SADECE JSON formatında yanıt ver.

KOMUT TANIMLAMA KURALLARI:

1. Eğer kullanıcı "iş", "ekle", "yeni", "ekleme" gibi kelimeler kullanıyorsa VE "iş" kelimesi varsa → action: "add_job"

2. Eğer kullanıcı "firma" kelimesi kullanıyorsa VE "ekle" veya "yeni" gibi kelimeler varsa → action: "add_company"

3. Eğer kullanıcı "tahsilat", "ödeme", "işlem" kelimelerini kullanıyorsa VE "ekle" gibi kelimeler varsa → action: "add_transaction"

4. Diğer durumlarda → action: "unknown"

ÇIKTI FORMATI (SADECE JSON):

İş eklemek için:
{
  "action": "add_job",
  "data": {},
  "message": "Yeni iş ekleme başlatıldı",
  "needsMoreInfo": true,
  "nextQuestion": "İşin adı ne?",
  "completed": false
}

Firma eklemek için:
{
  "action": "add_company",
  "data": {},
  "message": "Yeni firma ekleme başlatıldı",
  "needsMoreInfo": true,
  "nextQuestion": "Firmanın adı ne?",
  "completed": false
}

İşlem eklemek için:
{
  "action": "add_transaction",
  "data": {},
  "message": "Yeni işlem ekleme başlatıldı",
  "needsMoreInfo": true,
  "nextQuestion": "Bu bir tahsilat mı yoksa ödeme mi?",
  "completed": false
}

Anlaşılmayan komut için:
{
  "action": "unknown",
  "message": "Komutunuzu anlayamadım. 'İş ekle', 'Firma ekle' veya 'Tahsilat ekle' diyebilirsiniz."
}

ÖNEMLİ: Sadece geçerli JSON formatında yanıt ver. Açıklama veya ek metin ekleme.`;
    }

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!gptResponse.ok) {
      const error = await gptResponse.text();
      throw new Error(`GPT analysis failed: ${error}`);
    }

    const gptResult = await gptResponse.json();
    const commandText = gptResult.choices[0].message.content;

    console.log('GPT response:', commandText);

    let command: VoiceCommand;
    try {
      command = JSON.parse(commandText);
      console.log('Parsed command:', command);

      // Fallback: Eğer unknown ama transcription'da açık komut varsa düzelt
      if (command.action === 'unknown' && !conversationState.action) {
        const lowerText = text.toLowerCase();

        if ((lowerText.includes('iş') || lowerText.includes('is')) &&
            (lowerText.includes('ekle') || lowerText.includes('yeni') || lowerText.includes('ekleme'))) {
          command = {
            action: 'add_job',
            data: {},
            message: 'Yeni iş ekleme başlatıldı',
            needsMoreInfo: true,
            nextQuestion: 'İşin adı ne?',
            completed: false
          };
          console.log('Fallback activated: add_job');
        } else if (lowerText.includes('firma') &&
                   (lowerText.includes('ekle') || lowerText.includes('yeni'))) {
          command = {
            action: 'add_company',
            data: {},
            message: 'Yeni firma ekleme başlatıldı',
            needsMoreInfo: true,
            nextQuestion: 'Firmanın adı ne?',
            completed: false
          };
          console.log('Fallback activated: add_company');
        } else if ((lowerText.includes('tahsilat') || lowerText.includes('ödeme') || lowerText.includes('işlem')) &&
                   lowerText.includes('ekle')) {
          command = {
            action: 'add_transaction',
            data: {},
            message: 'Yeni işlem ekleme başlatıldı',
            needsMoreInfo: true,
            nextQuestion: 'Bu bir tahsilat mı yoksa ödeme mi?',
            completed: false
          };
          console.log('Fallback activated: add_transaction');
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse:', commandText);
      command = {
        action: 'unknown',
        message: 'Komutunuzu anlayamadım. Lütfen tekrar deneyin.',
      };
    }

    return new Response(
      JSON.stringify({
        transcription: text,
        command,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});