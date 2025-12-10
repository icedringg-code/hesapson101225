import { supabase } from '../lib/supabase';
import { getCurrentGoldPrice } from './gold';

export interface ExchangeRates {
  date: string;
  usd_buy: number;
  usd_sell: number;
  eur_buy: number;
  eur_sell: number;
  gold_buy: number;
  gold_sell: number;
}

export async function fetchExchangeRatesForDate(date: string): Promise<ExchangeRates | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    // Önce veritabanından kontrol et
    const { data: existingRate, error: fetchError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('date', date)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching exchange rate:', fetchError);
      return null;
    }

    // Bugünün tarihi ise, altın fiyatını her zaman güncelle
    if (existingRate && isToday) {
      console.log('Bugünün kurları güncelleniyor...');
      const rates = await fetchRatesFromAPI(date);
      if (rates) {
        const { error: updateError } = await supabase
          .from('exchange_rates')
          .update({
            usd_buy: rates.usd_buy,
            usd_sell: rates.usd_sell,
            eur_buy: rates.eur_buy,
            eur_sell: rates.eur_sell,
            gold_buy: rates.gold_buy,
            gold_sell: rates.gold_sell,
          })
          .eq('date', date);

        if (updateError) {
          console.error('Error updating exchange rate:', updateError);
        } else {
          console.log('Güncel kurlar güncellendi:', rates);
        }
        return rates;
      }
    }

    if (existingRate) {
      console.log('Kurlar veritabanından yüklendi:', existingRate);
      return existingRate;
    }

    // Veritabanında yoksa, API'den çek
    console.log('Kurlar API\'den çekiliyor...');
    const rates = await fetchRatesFromAPI(date);
    if (rates) {
      console.log('API\'den çekilen kurlar:', rates);

      // Veritabanına kaydet
      const { data: savedRate, error: saveError } = await supabase
        .from('exchange_rates')
        .insert({
          date,
          usd_buy: rates.usd_buy,
          usd_sell: rates.usd_sell,
          eur_buy: rates.eur_buy,
          eur_sell: rates.eur_sell,
          gold_buy: rates.gold_buy,
          gold_sell: rates.gold_sell,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving exchange rate:', saveError);
        return rates;
      }

      console.log('Kurlar veritabanına kaydedildi');
      return savedRate;
    }

    return null;
  } catch (error) {
    console.error('Error in fetchExchangeRatesForDate:', error);
    return null;
  }
}

async function fetchTCMBRates(dateStr: string): Promise<{ usd_buy: number; usd_sell: number; eur_buy: number; eur_sell: number } | null> {
  try {
    const [year, month, day] = dateStr.split('-');
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

    console.log('✓ TCMB Resmi Kurları:', { usd_buy, usd_sell, eur_buy, eur_sell });

    return { usd_buy, usd_sell, eur_buy, eur_sell };
  } catch (error) {
    console.error('TCMB API hatası:', error);
    return null;
  }
}

async function fetchRatesFromAPI(date: string): Promise<ExchangeRates | null> {
  try {
    console.log(`API çağrısı başlatılıyor: ${date}`);

    const isToday = date === new Date().toISOString().split('T')[0];
    let usd_buy = 0;
    let usd_sell = 0;
    let eur_buy = 0;
    let eur_sell = 0;

    const tcmbRates = await fetchTCMBRates(date);
    if (tcmbRates) {
      usd_buy = tcmbRates.usd_buy;
      usd_sell = tcmbRates.usd_sell;
      eur_buy = tcmbRates.eur_buy;
      eur_sell = tcmbRates.eur_sell;
    }

    if (usd_sell === 0 || eur_sell === 0) {
      const endpoint = isToday ? 'latest' : date;
      const apiUrl = `https://api.frankfurter.app/${endpoint}?from=USD&to=TRY,EUR`;
      console.log('Frankfurter API URL (yedek):', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Frankfurter API yanıt vermedi:', response.status);
        return null;
      }

      const data = await response.json();
      if (!data.rates) {
        console.error('API veri formatı hatalı:', data);
        return null;
      }

      usd_sell = data.rates.TRY || 0;
      usd_buy = usd_sell * 0.995;

      const eurToUsd = data.rates.EUR || 0;
      eur_sell = eurToUsd > 0 ? usd_sell / eurToUsd : 0;
      eur_buy = eur_sell * 0.995;

      console.log(`${isToday ? 'Güncel' : 'Tarihi'} kurlar (Frankfurter yedek):`, { usd_sell, eur_sell });
    }

    // HAS Altın fiyatını Türk piyasası kaynaklarından çek
    let gold_sell = 0;
    let gold_buy = 0;

    // Bugünün tarihi ise gerçek Türk piyasa fiyatlarını çek
    if (isToday) {
      gold_sell = await getCurrentGoldPrice();
      if (gold_sell > 0) {
        gold_buy = gold_sell * 0.998;
        console.log('✓ Gram Altın (Türk piyasası):', {
          buy: gold_buy.toFixed(2),
          sell: gold_sell.toFixed(2)
        });
      }
    }

    // Bugün değilse veya API çalışmazsa, spot fiyattan hesapla
    if (gold_sell === 0) {
      try {
        const spotApiUrl = 'https://api.metals.live/v1/spot/gold';
        const spotResponse = await fetch(spotApiUrl);

        if (spotResponse.ok) {
          const spotData = await spotResponse.json();
          if (Array.isArray(spotData) && spotData.length > 0 && spotData[0].price) {
            const goldOunceUSD = spotData[0].price;
            const goldGramUSD = goldOunceUSD / 31.1035;
            // Türkiye piyasası çarpanı: 1.7 (KDV + işçilik + kâr)
            gold_sell = goldGramUSD * usd_sell * 1.7;
            gold_buy = gold_sell * 0.995;
            console.log(`HAS Altın (${isToday ? 'spot hesaplama' : 'geçmiş tarih tahmini'}):`, gold_sell.toFixed(2));
          }
        }
      } catch (spotError) {
        console.error('Spot altın API hatası:', spotError);
        // Son çare: Sabit spot fiyatı ile hesapla
        const goldOunceUSD = 2650;
        const goldGramUSD = goldOunceUSD / 31.1035;
        gold_sell = goldGramUSD * usd_sell * 1.7;
        gold_buy = gold_sell * 0.995;
        console.log(`HAS Altın (${isToday ? 'tahmini' : 'geçmiş tarih tahmini'}):`, gold_sell.toFixed(2));
      }
    }

    console.log('✓ Tüm kurlar hazır:', {
      date,
      usd_buy: usd_buy.toFixed(4),
      usd_sell: usd_sell.toFixed(4),
      eur_buy: eur_buy.toFixed(4),
      eur_sell: eur_sell.toFixed(4),
      gold_buy: gold_buy.toFixed(2),
      gold_sell: gold_sell.toFixed(2)
    });

    return {
      date,
      usd_buy: usd_buy || usd_sell * 0.998,
      usd_sell,
      eur_buy: eur_buy || eur_sell * 0.998,
      eur_sell,
      gold_buy: gold_buy || gold_sell * 0.995,
      gold_sell,
    };
  } catch (error) {
    console.error('API çağrı hatası:', error);
    return null;
  }
}

export async function getCurrentRates(): Promise<ExchangeRates | null> {
  const today = new Date().toISOString().split('T')[0];
  return fetchExchangeRatesForDate(today);
}
