export function formatRupiah(amount) {
  if (amount === null || amount === undefined) return 'Rp 0';
  const num = parseFloat(amount);
  if (isNaN(num)) return 'Rp 0';
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return `${isNegative ? '-' : ''}Rp ${formatted}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

export function todayString() {
  return new Date().toISOString().split('T')[0];
}

export function getMonthYear(date = new Date()) {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function getProgressColor(percentage) {
  if (percentage >= 90) return 'red';
  if (percentage >= 70) return 'amber';
  return 'green';
}

export function getGoalTypeLabel(type) {
  const labels = {
    education: 'Pendidikan',
    asset: 'Aset',
    working_capital: 'Modal Kerja',
    custom: 'Lainnya',
  };
  return labels[type] || type;
}

export function getGoalTypeColor(type) {
  const colors = {
    education: '#A855F7',
    asset: '#00D4FF',
    working_capital: '#FFB800',
    custom: '#FF69B4',
  };
  return colors[type] || '#A0A0A0';
}
