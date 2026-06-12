import { format, addMinutes, isAfter, isBefore } from "date-fns";
import { toDateOnly } from "@/lib/date-utils";

/**
 * Converte string de data para objeto Date local (evita problemas de timezone)
 */
export const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Meio-dia local
};

/**
 * Obtém o dia da semana de uma data string (0 = Domingo, 6 = Sábado)
 */
export const getDayOfWeek = (dateString) => {
  const date = parseLocalDate(dateString);
  return date.getDay();
};

/**
 * Valida se o restaurante está aberto no dia e horário especificados
 */
export const validateOpeningHours = (restaurant, date, shifts) => {
  const dayOfWeek = getDayOfWeek(date);
  
  console.log('📅 Validando funcionamento:', {
    date,
    dayOfWeek,
    dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]
  });
  
  // Verificar se tem algum turno ativo neste dia
  const shiftsForDay = shifts.filter(shift => {
    const isActive = shift.active &&
                     shift.days_of_week &&
                     shift.days_of_week.includes(dayOfWeek);

    console.log('🔍 Verificando turno:', {
      shiftName: shift.name,
      shiftDays: shift.days_of_week,
      dayOfWeek,
      isActive
    });

    return isActive;
  });
  
  if (shiftsForDay.length === 0) {
    const dayName = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dayOfWeek];
    return {
      valid: false,
      message: `Não é possível reservar neste dia. O restaurante não abre na ${dayName}.`,
      shifts: []
    };
  }
  
  console.log('✅ Turnos disponíveis:', shiftsForDay.map(s => s.name));
  
  return {
    valid: true,
    message: "",
    shifts: shiftsForDay
  };
};

/**
 * Valida se o turno está disponível para o horário atual
 */
export const validateShiftAvailability = (shift, date, bookingCutoffHours = 2) => {
  const now = new Date();
  const reservationDate = parseLocalDate(date);
  
  // Se é hoje, verificar cutoff e horário do turno
  if (format(reservationDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
    const [endHour, endMin] = shift.end_time.split(':').map(Number);
    const shiftEndTime = new Date(now);
    shiftEndTime.setHours(endHour, endMin, 0, 0);
    
    // Converter horas para minutos e subtrair do horário de fim do turno
    const cutoffMinutes = Math.round(bookingCutoffHours * 60);
    const cutoffTime = addMinutes(shiftEndTime, -cutoffMinutes);
    
    if (isAfter(now, cutoffTime)) {
      const cutoffLabel = bookingCutoffHours < 1 
        ? `${cutoffMinutes} minutos` 
        : bookingCutoffHours === 1 
          ? '1 hora' 
          : `${bookingCutoffHours} horas`;
      return {
        valid: false,
        message: `Horários de reserva encerrados para o turno ${shift.name} hoje. Antecedência mínima: ${cutoffLabel}.`
      };
    }
  }
  
  return { valid: true, message: "" };
};

/**
 * Calcula o período de ocupação de uma reserva (slot + dwell + buffer)
 */
export const calculateOccupationPeriod = (slotTime, dwellMinutes, bufferMinutes) => {
  const [hour, min] = slotTime.split(':').map(Number);
  const slotMinutes = hour * 60 + min;
  
  return {
    start: slotMinutes - bufferMinutes,
    end: slotMinutes + dwellMinutes + bufferMinutes,
    slotMinutes
  };
};

/**
 * Verifica se dois períodos de tempo se sobrepõem
 */
export const periodsOverlap = (period1, period2) => {
  return period1.start < period2.end && period1.end > period2.start;
};

/**
 * Verifica se uma mesa está disponível para uma reserva
 */
export const isTableAvailable = (
  tableId,
  date,
  occupationPeriod,
  existingReservations,
  dwellMinutes,
  bufferMinutes
) => {
  // Filtrar reservas que usam esta mesa no mesmo dia
  const tableReservations = existingReservations.filter(r => {
    if (toDateOnly(r.date) !== toDateOnly(date)) return false;

    const status = r.status?.toUpperCase();
    if (status === 'CANCELLED' || status === 'NO_SHOW') return false;
    
    const tableIds = r.linked_tables && r.linked_tables.length > 0 
      ? r.linked_tables 
      : [r.table_id];
    
    return tableIds.includes(tableId);
  });
  
  // Verificar sobreposição com cada reserva existente
  for (const existingRes of tableReservations) {
    // Usar dwell e buffer da reserva existente se disponível, senão usar padrões
    const existingDwell = existingRes.dwell_minutes || dwellMinutes;
    const existingBuffer = existingRes.buffer_minutes || bufferMinutes;
    
    const existingPeriod = calculateOccupationPeriod(
      existingRes.slot_time,
      existingDwell,
      existingBuffer
    );
    
    if (periodsOverlap(occupationPeriod, existingPeriod)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Encontra mesas disponíveis que acomodem o grupo
 */
export const findAvailableTables = (
  partySize,
  tables,
  date,
  occupationPeriod,
  existingReservations,
  dwellMinutes,
  bufferMinutes
) => {
  // Filtrar mesas ativas e disponíveis
  // Backend retorna: is_active (boolean) e status (UPPERCASE)
  const activeTables = tables.filter(t =>
    t.is_active &&
    t.status?.toUpperCase() === 'AVAILABLE'
  );
  
  // Verificar disponibilidade de cada mesa
  const availableTables = activeTables.filter(table =>
    isTableAvailable(
      table.id,
      date,
      occupationPeriod,
      existingReservations,
      dwellMinutes,
      bufferMinutes
    )
  );
  
  if (availableTables.length === 0) {
    return {
      success: false,
      message: "Todas as mesas estão ocupadas neste horário. Quer entrar na fila de espera?",
      tables: []
    };
  }
  
  // Ordenar por capacidade (menor primeiro para otimizar)
  availableTables.sort((a, b) => a.seats - b.seats);
  
  // Tentar alocar com o mínimo de mesas
  const allocation = allocateTablesOptimally(partySize, availableTables);
  
  if (!allocation.success) {
    return {
      success: false,
      message: `Capacidade insuficiente. Disponível: ${allocation.totalAvailable} lugares, necessário: ${partySize}.`,
      tables: []
    };
  }
  
  return {
    success: true,
    message: "",
    tables: allocation.tables
  };
};

/**
 * Aloca mesas de forma otimizada
 */
export const allocateTablesOptimally = (partySize, availableTables) => {
  // Estratégia 1: Tentar encontrar uma única mesa que acomode o grupo
  const singleTable = availableTables.find(t => t.seats >= partySize);
  
  if (singleTable) {
    return {
      success: true,
      tables: [singleTable],
      totalSeats: singleTable.seats
    };
  }
  
  // Estratégia 2: Combinar múltiplas mesas (começando pela menor)
  const selectedTables = [];
  let remainingSeats = partySize;
  
  for (const table of availableTables) {
    if (remainingSeats <= 0) break;
    
    selectedTables.push(table);
    remainingSeats -= table.seats;
  }
  
  if (remainingSeats > 0) {
    const totalAvailable = availableTables.reduce((sum, t) => sum + t.seats, 0);
    return {
      success: false,
      tables: [],
      totalAvailable
    };
  }
  
  return {
    success: true,
    tables: selectedTables,
    totalSeats: selectedTables.reduce((sum, t) => sum + t.seats, 0)
  };
};

/**
 * Valida capacidade máxima do turno
 */
export const validateShiftCapacity = (
  shift,
  date,
  partySize,
  existingReservations
) => {
  if (!shift.max_capacity) {
    return { valid: true, message: "" };
  }
  
  // Somar pessoas de todas as reservas ativas no mesmo turno e dia
  const shiftReservations = existingReservations.filter(r =>
    toDateOnly(r.date) === toDateOnly(date) &&
    r.shift_id === shift.id &&
    (r.status?.toUpperCase() === 'PENDING' || r.status?.toUpperCase() === 'CONFIRMED')
  );
  
  const currentOccupancy = shiftReservations.reduce((sum, r) => sum + r.party_size, 0);
  
  if (currentOccupancy + partySize > shift.max_capacity) {
    return {
      valid: false,
      message: `Capacidade máxima do turno atingida. Ocupação atual: ${currentOccupancy}/${shift.max_capacity}`
    };
  }
  
  return { valid: true, message: "" };
};

/**
 * Gera slots disponíveis para um turno
 */
export const generateAvailableSlots = (
  shift,
  date,
  partySize,
  tables,
  existingReservations,
  bookingCutoffHours = 2
) => {
  const slots = [];
  const [startHour, startMin] = shift.start_time.split(':').map(Number);
  const [endHour, endMin] = shift.end_time.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const interval = shift.slot_interval_minutes;
  const dwellMinutes = shift.default_dwell_minutes;
  const bufferMinutes = shift.default_buffer_minutes;
  
  const now = new Date();
  const reservationDate = parseLocalDate(date);
  const isToday = format(reservationDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
  
  // Gerar slots até o fim do turno (não subtrair dwell)
  for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    const slotTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    
    // Se é hoje, verificar cutoff (converter horas para minutos)
    if (isToday) {
      const slotDateTime = new Date();
      slotDateTime.setHours(hour, min, 0, 0);
      const cutoffMinutes = Math.round(bookingCutoffHours * 60);
      const cutoffTime = addMinutes(now, cutoffMinutes);
      
      if (isBefore(slotDateTime, cutoffTime)) {
        console.log(`⏰ Slot ${slotTime} bloqueado por cutoff. Necessário ${cutoffMinutes}min de antecedência.`);
        continue;
      }
    }
    
    // Verificar se há mesas disponíveis neste slot
    const occupationPeriod = calculateOccupationPeriod(slotTime, dwellMinutes, bufferMinutes);
    const availability = findAvailableTables(
      partySize,
      tables,
      date,
      occupationPeriod,
      existingReservations,
      dwellMinutes,
      bufferMinutes
    );
    
    if (availability.success) {
      slots.push({
        time: slotTime,
        available: true,
        tablesCount: availability.tables.length
      });
    }
  }
  
  return slots;
};

/**
 * Validação completa antes de criar uma reserva
 */
export const validateReservation = async (
  restaurantId,
  date,
  shiftId,
  slotTime,
  partySize,
  restaurant,
  shifts,
  tables,
  existingReservations
) => {
  // 1. Validar dias de funcionamento
  const openingValidation = validateOpeningHours(restaurant, date, shifts);
  if (!openingValidation.valid) {
    return { valid: false, error: openingValidation.message };
  }
  
  // 2. Validar turno existe e está ativo
  const shift = shifts.find(s => s.id === shiftId);
  if (!shift || !shift.active) {
    return { valid: false, error: "Turno inválido ou inativo" };
  }
  
  // 3. Validar disponibilidade do turno para o horário
  const shiftAvailability = validateShiftAvailability(
    shift,
    date,
    restaurant.booking_cutoff_hours || 2
  );
  if (!shiftAvailability.valid) {
    return { valid: false, error: shiftAvailability.message };
  }
  
  // 4. Validar capacidade máxima do turno
  const capacityValidation = validateShiftCapacity(
    shift,
    date,
    partySize,
    existingReservations
  );
  if (!capacityValidation.valid) {
    return { valid: false, error: capacityValidation.message };
  }
  
  // 5. Validar tamanho do grupo
  const maxOnline = restaurant.max_online_party_size || 8;
  const maxTotal = restaurant.max_party_size || 12;
  
  if (partySize > maxTotal) {
    return {
      valid: false,
      error: `Grupo muito grande. Máximo permitido: ${maxTotal} pessoas. Entre em contato diretamente.`
    };
  }
  
  // 6. Encontrar mesas disponíveis
  const occupationPeriod = calculateOccupationPeriod(
    slotTime,
    shift.default_dwell_minutes,
    shift.default_buffer_minutes
  );
  
  const tableAvailability = findAvailableTables(
    partySize,
    tables,
    date,
    occupationPeriod,
    existingReservations,
    shift.default_dwell_minutes,
    shift.default_buffer_minutes
  );
  
  if (!tableAvailability.success) {
    return { valid: false, error: tableAvailability.message };
  }
  
  return {
    valid: true,
    error: "",
    data: {
      shift,
      tables: tableAvailability.tables,
      occupationPeriod
    }
  };
};
