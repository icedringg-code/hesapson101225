import express from 'express';
import cors from 'cors';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jobsRouter from './routes/jobs.js';
import companiesRouter from './routes/companies.js';
import transactionsRouter from './routes/transactions.js';
import statisticsRouter from './routes/statistics.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/statistics', statisticsRouter);

app.post('/api/voice-assistant', upload.single('audio'), async (req, res) => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Step 1: Transcribe audio using Whisper
    const transcriptionFormData = new FormData();
    transcriptionFormData.append('file', req.file.buffer, {
      filename: 'recording.webm',
      contentType: req.file.mimetype,
    });
    transcriptionFormData.append('model', 'whisper-1');
    transcriptionFormData.append('language', 'tr');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        ...transcriptionFormData.getHeaders(),
      },
      body: transcriptionFormData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    const transcription = await transcriptionResponse.json();
    const text = transcription.text;

    // Step 2: Analyze the text using GPT to extract command and data
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
            content: `Sen bir iş takip uygulaması için sesli asistansın. Kullanıcının Türkçe komutunu analiz edip JSON formatında yapılandırılmış veri döndür.

Mümkün aksiyonlar:
- add_transaction: Tahsilat veya ödeme ekleme
- add_job: Yeni iş ekleme
- add_company: Yeni firma ekleme
- view_company: Firma detaylarını görüntüleme
- view_job: İş detaylarını görüntüleme
- unknown: Anlaşılamayan komut

Ödeme metodları: cash (Nakit), bank_transfer (Banka), check (Çek)
Para birimleri: TRY (Türk Lirası), USD (Dolar), EUR (Euro), GOLD (Altın)

Cevabın SADECE JSON olmalı:
{
  "action": "action_type",
  "data": {
    "companyName": "firma adı",
    "amount": sayı,
    "type": "income" veya "expense",
    "description": "açıklama",
    "jobName": "iş adı",
    "contractAmount": sayı,
    "paymentMethod": "cash", "bank_transfer" veya "check",
    "currencyType": "TRY", "USD", "EUR" veya "GOLD",
    "goldAmount": gram cinsinden altın miktarı,
    "goldPrice": gram başına altın fiyatı
  },
  "message": "kullanıcıya gösterilecek mesaj"
}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!gptResponse.ok) {
      const error = await gptResponse.text();
      throw new Error(`GPT analysis failed: ${error}`);
    }

    const gptResult = await gptResponse.json();
    const commandText = gptResult.choices[0].message.content;

    let command;
    try {
      command = JSON.parse(commandText);
    } catch {
      command = {
        action: 'unknown',
        message: 'Komutunuzu anlayamadım. Lütfen tekrar deneyin.',
      };
    }

    res.json({
      transcription: text,
      command,
    });
  } catch (error) {
    console.error('Voice assistant error:', error);
    res.status(500).json({
      error: error.message || 'Ses işlenirken bir hata oluştu',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Voice assistant server running on port ${PORT}`);
});
