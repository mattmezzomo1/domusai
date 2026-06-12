import { formatDateOnlyBR } from '@/lib/date-utils';

export const DEFAULT_WHATSAPP_MESSAGE = 'Olá {nome}! Tudo bem?';

const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

const asPeople = (partySize) => {
  if (!partySize) return '';
  const value = Number(partySize);
  if (!Number.isFinite(value)) return String(partySize);
  return `${value} ${value === 1 ? 'pessoa' : 'pessoas'}`;
};

export function buildWhatsAppMessage({
  template,
  customer,
  customerName,
  reservation,
  restaurant,
  shift,
  tables = [],
} = {}) {
  const resolvedTemplate = template || DEFAULT_WHATSAPP_MESSAGE;
  const name = customerName || customer?.full_name || customer?.name || '';
  const tableNames = tables.map((table) => table?.name).filter(Boolean).join(', ');

  const values = {
    nome: name,
    name,
    cliente: name,
    data: formatDateOnlyBR(reservation?.date),
    date: formatDateOnlyBR(reservation?.date),
    horario: reservation?.slot_time || '',
    hora: reservation?.slot_time || '',
    time: reservation?.slot_time || '',
    pessoas: asPeople(reservation?.party_size),
    party_size: asPeople(reservation?.party_size),
    codigo: reservation?.reservation_code || '',
    codigo_reserva: reservation?.reservation_code || '',
    reserva: reservation?.reservation_code || '',
    restaurante: restaurant?.name || '',
    restaurant: restaurant?.name || '',
    endereco: restaurant?.address || '',
    address: restaurant?.address || '',
    turno: shift?.name || '',
    horario_inicio: shift?.start_time || '',
    horario_fim: shift?.end_time || '',
    turno_inicio: shift?.start_time || '',
    turno_fim: shift?.end_time || '',
    mesa: tableNames,
    mesas: tableNames,
  };

  return resolvedTemplate.replace(/\{([^{}]+)\}/g, (match, key) => {
    const value = values[normalizeKey(key)];
    return value || match;
  });
}
