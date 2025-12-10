import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExchangeRates {
  date: string;
  usd_buy: number;
  usd_sell: number;
  eur_buy: number;
  eur_sell: number;
  gold_buy: number;
  gold_sell: number;
}

async function fetchTCMBRates(dateStr: string): Promise<{ usd_buy: number; usd_sell: number; eur_buy: number; eur_sell: number } | null> {
  try {
    const [day, month, year] = dateStr.split('-');
    const tcmbDate = `${day}${month}${year}`;
    const url = dateStr === new Date().toISOString().split('T')[0]
      ? 'https://www.tcmb.gov.tr/kurlar/today.xml'
      : `https://www.tcmb.gov.tr/kurlar/${year}${month}/${tcmbDate}.xml`;

    console.log('TCMB URL:', url);

    const response = await fetch(url);
    if (!response.ok) {
      console.error('TCMB API yanıt vermedi:', response.status);
      return null;
    }

    const xmlText = await response.text();

    const usdMatch = xmlText.match(/<Currency[^>]*Code="USD"[^>]*>[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/);
    const eurMatch = xmlText.match(/<Currency[^>]*Code="EUR"[^>]*>[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/);

    if (!usdMatch || !eurMatch) {
      console.error('TCMB XML parse hatası');
      return null;
    }

    const usd_buy = parseFloat(usdMatch[1]);
    const usd_sell = parseFloat(usdMatch[2]);
    const eur_buy = parseFloat(eurMatch[1]);
    const eur_sell = parseFloat(eurMatch[2]);

    console.log('✓ TCMB Kurları:', { usd_buy, usd_sell, eur_buy, eur_sell });

    return { usd_buy, usd_sell, eur_buy, eur_sell };
  } catch (error) {
    console.error('TCMB API hatası:', error);
    return null;
  }
}

async function fetchGoldPriceFromGenelPara(): Promise<{ buy: number; sell: number } | null> {
  try {
    const response = await fetch('https://api.genelpara.com/json/?list=altin&sembol=GA');
    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.success && data.data && data.data.GA) {
      const goldData = data.data.GA;
      const buy = parseFloat(goldData.alis.toString().replace(',', '.'));
      const sell = parseFloat(goldData.satis.toString().replace(',', '.'));
      if (!isNaN(buy) && !isNaN(sell) && buy > 0 && sell > 0) {
        console.log('✓ GenelPara Gram Altın:', { buy, sell });
        return { buy, sell };
      }
    }
  } catch (error) {
    console.error('GenelPara API hatası:', error);
  }
  return null;
}

async function fetchGoldPriceFromTruncGil(): Promise<{ buy: number; sell: number } | null> {
  try {
    const response = await fetch('https://finans.truncgil.com/v4/today.json');
    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.HAS) {
      const buy = parseFloat((data.HAS.Buying || '0').toString().replace(',', '.'));
      const sell = parseFloat((data.HAS.Selling || '0').toString().replace(',', '.'));
      if (!isNaN(buy) && !isNaN(sell) && buy > 0 && sell > 0) {
        console.log('✓ TruncGil HAS Altın:', { buy, sell });
        return { buy, sell };
      }
    }
  } catch (error) {
    console.error('TruncGil API hatası:', error);
  }
  return null;
}

async function fetchGoldPriceFromCollectAPI(): Promise<{ buy: number; sell: number } | null> {
  try {
    const response = await fetch('https://api.collectapi.com/economy/goldPrice', {
      headers: {
        'authorization': 'apikey 0iG4CfNqGjMJ9vPz4f0PuU:2N4AXO8VcRB0Ee9EBQ0Syb',
        'content-type': 'application/json'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.success && data.result) {
      const gramGold = data.result.find((item: any) => item.name === 'Gram Altın');
      if (gramGold) {
        const buy = parseFloat(gramGold.buying);
        const sell = parseFloat(gramGold.selling);
        if (!isNaN(buy) && !isNaN(sell) && buy > 0 && sell > 0) {
          console.log('✓ CollectAPI Gram Altın:', { buy, sell });
          return { buy, sell };
        }
      }
    }
  } catch (error) {
    console.error('CollectAPI hatası:', error);
  }
  return null;
}

async function getCurrentGoldPrice(): Promise<{ buy: number; sell: number }> {
  const sources = [
    fetchGoldPriceFromGenelPara,
    fetchGoldPriceFromTruncGil,
    fetchGoldPriceFromCollectAPI
  ];

  for (const source of sources) {
    const result = await source();
    if (result && result.sell > 0) {
      return result;
    }
  }

  console.error('✗ Hiçbir kaynaktan altın fiyatı alınamadı!');
  return { buy: 0, sell: 0 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const date = dateParam || new Date().toISOString().split('T')[0];

    console.log('Tarih için kurlar çekiliyor:', date);

    const tcmbRates = await fetchTCMBRates(date);
    if (!tcmbRates) {
      throw new Error('TCMB kurları alınamadı');
    }

    const goldPrice = await getCurrentGoldPrice();
    if (goldPrice.sell === 0) {
      throw new Error('Altın fiyatı alınamadı');
    }

    const rates: ExchangeRates = {
      date,
      usd_buy: tcmbRates.usd_buy,
      usd_sell: tcmbRates.usd_sell,
      eur_buy: tcmbRates.eur_buy,
      eur_sell: tcmbRates.eur_sell,
      gold_buy: goldPrice.buy,
      gold_sell: goldPrice.sell,
    };

    console.log('✓ Tüm kurlar hazır:', rates);

    return new Response(
      JSON.stringify({
        success: true,
        data: rates
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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
