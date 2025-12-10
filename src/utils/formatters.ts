export function formatCurrency(amount: number): string {
  const parts = amount.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `₺${integerPart},${decimalPart}`;
}

export function formatNumber(amount: number, decimals: number = 3): string {
  return amount.toFixed(decimals);
}

export function formatDate(date: string | null): string {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleDateString('tr-TR');
  } catch {
    return date;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Aktif':
      return 'green';
    case 'Tamamlandı':
      return 'blue';
    case 'Duraklatıldı':
      return 'yellow';
    default:
      return 'gray';
  }
}
