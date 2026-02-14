import { 
  calculateOccupationPeriod, 
  isTableAvailable 
} from "./reservationValidation";

/**
 * Valida e realoca mesas quando o número de pessoas muda
 */
export const validateAndReallocateTables = async (
  reservation,
  newPartySize,
  allTables,
  allReservations,
  shift
) => {
  const currentPartySize = reservation.party_size;
  
  // Se não mudou o número de pessoas, manter mesas atuais
  if (newPartySize === currentPartySize) {
    return {
      success: true,
      needsReallocation: false,
      tables: allTables.filter(t => 
        (reservation.linked_tables && reservation.linked_tables.length > 0)
          ? reservation.linked_tables.includes(t.id)
          : [reservation.table_id].includes(t.id)
      ),
      message: "Número de pessoas não alterado"
    };
  }

  // Obter mesas atuais da reserva
  const currentTableIds = reservation.linked_tables && reservation.linked_tables.length > 0 
    ? reservation.linked_tables 
    : [reservation.table_id];
  
  const currentTables = allTables.filter(t => currentTableIds.includes(t.id));
  const currentCapacity = currentTables.reduce((sum, t) => sum + t.seats, 0);

  // Calcular período de ocupação
  const dwellMinutes = shift.default_dwell_minutes;
  const bufferMinutes = shift.default_buffer_minutes;
  const occupationPeriod = calculateOccupationPeriod(
    reservation.slot_time,
    dwellMinutes,
    bufferMinutes
  );

  // Filtrar reservas do mesmo dia (excluindo a atual)
  const otherReservations = allReservations.filter(r => 
    r.date === reservation.date &&
    r.id !== reservation.id &&
    (r.status === 'pending' || r.status === 'confirmed')
  );

  // CASO 1: Número de pessoas DIMINUIU
  if (newPartySize < currentPartySize) {
    // Tentar otimizar - usar menos mesas se possível
    const sortedCurrentTables = [...currentTables].sort((a, b) => b.seats - a.seats);
    
    // Tentar usar apenas uma mesa se comportar
    const singleTable = sortedCurrentTables.find(t => t.seats >= newPartySize);
    
    if (singleTable) {
      return {
        success: true,
        needsReallocation: true,
        tables: [singleTable],
        message: `Otimizado: agora usando apenas ${singleTable.name} (${singleTable.seats} lugares) para ${newPartySize} pessoas`,
        freedTables: currentTables.filter(t => t.id !== singleTable.id).map(t => t.name)
      };
    }
    
    // Se não couber em uma mesa, usar as menores possíveis
    let neededSeats = newPartySize;
    const selectedTables = [];
    
    for (const table of sortedCurrentTables) {
      if (neededSeats <= 0) break;
      selectedTables.push(table);
      neededSeats -= table.seats;
    }
    
    return {
      success: true,
      needsReallocation: selectedTables.length < currentTables.length,
      tables: selectedTables,
      message: selectedTables.length < currentTables.length 
        ? `Otimizado: liberando ${currentTables.length - selectedTables.length} mesa(s)`
        : "Mantendo mesas atuais",
      freedTables: currentTables
        .filter(t => !selectedTables.find(st => st.id === t.id))
        .map(t => t.name)
    };
  }

  // CASO 2: Número de pessoas AUMENTOU
  // Verificar se as mesas atuais comportam o novo número
  if (currentCapacity >= newPartySize) {
    return {
      success: true,
      needsReallocation: false,
      tables: currentTables,
      message: `Mesas atuais (${currentCapacity} lugares) comportam ${newPartySize} pessoas`
    };
  }

  // Mesas atuais NÃO comportam - precisa buscar novas mesas
  
  // Verificar todas as mesas disponíveis no mesmo horário
  const availableTables = allTables.filter(t => 
    t.is_active && 
    t.status === 'available' &&
    isTableAvailable(
      t.id,
      reservation.date,
      occupationPeriod,
      otherReservations,
      dwellMinutes,
      bufferMinutes
    )
  );

  if (availableTables.length === 0) {
    return {
      success: false,
      needsReallocation: true,
      tables: [],
      message: "Não há mesas disponíveis neste horário para acomodar mais pessoas. Todas as outras mesas estão ocupadas.",
      error: "NO_AVAILABILITY"
    };
  }

  // Tentar encontrar a melhor combinação de mesas
  const allocation = findBestTableCombination(newPartySize, availableTables);
  
  if (!allocation.success) {
    const totalAvailableSeats = availableTables.reduce((sum, t) => sum + t.seats, 0);
    return {
      success: false,
      needsReallocation: true,
      tables: [],
      message: `Capacidade insuficiente. Necessário: ${newPartySize} lugares. Disponível: ${totalAvailableSeats} lugares.`,
      error: "INSUFFICIENT_CAPACITY"
    };
  }

  return {
    success: true,
    needsReallocation: true,
    tables: allocation.tables,
    message: `Redistribuído para ${allocation.tables.length} mesa(s): ${allocation.tables.map(t => t.name).join(', ')} (${allocation.totalSeats} lugares)`,
    previousTables: currentTables.map(t => t.name)
  };
};

/**
 * Encontra a melhor combinação de mesas para acomodar um grupo
 */
const findBestTableCombination = (partySize, availableTables) => {
  // Ordenar por capacidade (menor primeiro)
  const sortedTables = [...availableTables].sort((a, b) => a.seats - b.seats);
  
  // Estratégia 1: Mesa única exata ou próxima
  const exactMatch = sortedTables.find(t => t.seats === partySize);
  if (exactMatch) {
    return {
      success: true,
      tables: [exactMatch],
      totalSeats: exactMatch.seats
    };
  }
  
  // Estratégia 2: Mesa única maior que comporta
  const singleTable = sortedTables.find(t => t.seats >= partySize);
  if (singleTable) {
    return {
      success: true,
      tables: [singleTable],
      totalSeats: singleTable.seats
    };
  }
  
  // Estratégia 3: Combinação de mesas
  const selectedTables = [];
  let remainingSeats = partySize;
  
  for (const table of sortedTables) {
    if (remainingSeats <= 0) break;
    selectedTables.push(table);
    remainingSeats -= table.seats;
  }
  
  if (remainingSeats > 0) {
    return {
      success: false,
      tables: [],
      totalSeats: 0
    };
  }
  
  return {
    success: true,
    tables: selectedTables,
    totalSeats: selectedTables.reduce((sum, t) => sum + t.seats, 0)
  };
};