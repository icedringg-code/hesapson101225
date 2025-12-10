// GenelPara API - Ücretsiz, key gerektirmez (Ana kaynak)
async function getGoldPriceFromGenelPara(): Promise<{ buy: number; sell: number } | null> {
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

// Yedek API - TruncGil Finans
async function getGoldPriceFromTruncGil(): Promise<{ buy: number; sell: number } | null> {
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

// Alternatif API - Doviz.com
async function getGoldPriceFromDoviz(): Promise<{ buy: number; sell: number } | null> {
  try {
    const response = await fetch('https://www.doviz.com/api/v1/golds/GA/latest');
    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.buying && data.selling) {
      const buy = parseFloat(data.buying);
      const sell = parseFloat(data.selling);
      if (!isNaN(buy) && !isNaN(sell) && buy > 0 && sell > 0) {
        console.log('✓ Doviz.com Gram Altın:', { buy, sell });
        return { buy, sell };
      }
    }
  } catch (error) {
    console.error('Doviz.com API hatası:', error);
  }
  return null;
}

// Alternatif API - Altın Fiyatları
async function getGoldPriceFromAltinFiyatlari(): Promise<{ buy: number; sell: number } | null> {
  try {
    const response = await fetch('https://canli.altin.in/api/altin');
    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.gram_altin) {
      const buy = parseFloat((data.gram_altin.alis || '0').toString().replace(',', '.'));
      const sell = parseFloat((data.gram_altin.satis || '0').toString().replace(',', '.'));
      if (!isNaN(buy) && !isNaN(sell) && buy > 0 && sell > 0) {
        console.log('✓ AltinFiyatlari.com Gram Altın:', { buy, sell });
        return { buy, sell };
      }
    }
  } catch (error) {
    console.error('AltinFiyatlari.com API hatası:', error);
  }
  return null;
}

export async function getCurrentGoldPrice(): Promise<number> {
  console.log('Gram Altın fiyatı Türk piyasasından çekiliyor...');

  // Çalışan Türk API kaynaklarını sırasıyla dene
  const sources = [
    getGoldPriceFromGenelPara,
    getGoldPriceFromTruncGil,
    getGoldPriceFromDoviz,
    getGoldPriceFromAltinFiyatlari
  ];

  for (const source of sources) {
    const result = await source();
    if (result && result.sell > 0) {
      console.log('✓ Başarılı! Satış fiyatı:', result.sell, 'TRY');
      return result.sell;
    }
  }

  console.error('✗ Hiçbir kaynaktan altın fiyatı alınamadı!');
  return 0;
}

export function calculateGoldAmount(price: number, goldPricePerGram: number): number {
  if (goldPricePerGram === 0) return 0;
  return price / goldPricePerGram;
}

export function formatGoldAmount(amount: number): string {
  return `${amount.toFixed(3)} gr`;
}
