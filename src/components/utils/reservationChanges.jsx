import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateChangeLog = (oldReservation, newData, shifts) => {
  const changes = [];
  
  // Verificar mudança de data
  if (newData.date && newData.date !== oldReservation.date) {
    const oldDate = format(new Date(oldReservation.date), "dd/MM/yyyy");
    const newDate = format(new Date(newData.date), "dd/MM/yyyy");
    changes.push(`Data alterada de ${oldDate} para ${newDate}`);
  }
  
  // Verificar mudança de horário
  if (newData.slot_time && newData.slot_time !== oldReservation.slot_time) {
    changes.push(`Horário alterado de ${oldReservation.slot_time} para ${newData.slot_time}`);
  }
  
  // Verificar mudança de quantidade de pessoas
  if (newData.party_size && newData.party_size !== oldReservation.party_size) {
    changes.push(`Quantidade de pessoas alterada de ${oldReservation.party_size} para ${newData.party_size}`);
  }
  
  // Verificar mudança de turno
  if (newData.shift_id && newData.shift_id !== oldReservation.shift_id && shifts) {
    const oldShift = shifts.find(s => s.id === oldReservation.shift_id);
    const newShift = shifts.find(s => s.id === newData.shift_id);
    if (oldShift && newShift) {
      changes.push(`Turno alterado de ${oldShift.name} para ${newShift.name}`);
    }
  }
  
  return changes;
};

export const buildModificationNote = (changes, source = 'admin') => {
  if (changes.length === 0) return '';
  
  const timestamp = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const sourceText = source === 'online' ? '(alterado pelo cliente online)' : '(alterado pelo admin)';
  
  return `\n\n🔄 Reserva alterada em ${timestamp} ${sourceText}:\n${changes.map(c => `• ${c}`).join('\n')}`;
};

export const addModificationToReservation = (reservation, changes, modifiedBy = 'admin') => {
  const existingTags = reservation.tags || [];
  const existingLog = reservation.modification_log || [];
  
  // Adicionar tag "alterada" se não existir
  const newTags = existingTags.includes('alterada') 
    ? existingTags 
    : [...existingTags, 'alterada'];
  
  // Adicionar ao log de modificações
  const newLogEntry = {
    timestamp: new Date().toISOString(),
    changes: changes.join('; '),
    modified_by: modifiedBy
  };
  
  return {
    tags: newTags,
    modification_log: [...existingLog, newLogEntry]
  };
};

export const addCancellationToReservation = (reservation, reason = '', cancelledBy = 'admin') => {
  const existingTags = reservation.tags || [];
  const existingLog = reservation.modification_log || [];
  
  // Adicionar tag "cancelada" se não existir
  const newTags = existingTags.includes('cancelada') 
    ? existingTags 
    : [...existingTags, 'cancelada'];
  
  const timestamp = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const sourceText = cancelledBy === 'online' ? '(cancelado pelo cliente online)' : '(cancelado pelo admin)';
  
  // Adicionar ao log
  const newLogEntry = {
    timestamp: new Date().toISOString(),
    changes: `Reserva cancelada${reason ? `: ${reason}` : ''}`,
    modified_by: cancelledBy
  };
  
  const cancellationNote = `\n\n❌ Reserva cancelada em ${timestamp} ${sourceText}${reason ? `\nMotivo: ${reason}` : ''}`;
  
  return {
    tags: newTags,
    modification_log: [...existingLog, newLogEntry],
    notes: (reservation.notes || '') + cancellationNote,
    cancelled_at: new Date().toISOString()
  };
};