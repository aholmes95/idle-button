export const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function fmtNumber(value, decimals = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs < 1000) {
    if (Number.isInteger(abs)) {
      return sign + abs.toLocaleString('en-US');
    }
    return sign + abs.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  }

  if (abs >= 1e36) {
    return sign + abs.toExponential(2);
  }

  const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(abs) / 3));
  const scaled = abs / Math.pow(10, tier * 3);
  // Handle rounding edge case where 999.999... rounds to 1000.00
  if (scaled >= 999.995 && tier < SUFFIXES.length - 1) {
    const nextScaled = abs / Math.pow(10, (tier + 1) * 3);
    return sign + nextScaled.toFixed(decimals) + SUFFIXES[tier + 1];
  }
  return sign + scaled.toFixed(decimals) + SUFFIXES[tier];
}

export function fmtMoney(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '$0.00';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 1000) {
    return sign + '$' + abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  return sign + '$' + fmtNumber(abs, 2);
}

export function fmtDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '0s';
  const total = Math.floor(seconds);
  if (total < 60) return `${total}s`;
  if (total < 3600) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  }
  if (total < 86400) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  return `${d}d ${h}h`;
}

export const fmtTime = fmtDuration;
