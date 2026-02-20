// User Types
export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
  role?: 'USER' | 'ADMIN';
  avatar_url?: string;
}

export interface UpdateUserDTO {
  full_name?: string;
  avatar_url?: string;
  password?: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_date: Date;
  updated_date: Date;
}

// Auth Types
export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  user: UserResponseDTO;
  token: string;
}

export interface ResetPasswordDTO {
  email: string;
  new_password: string;
  reset_token?: string;
}

// Restaurant Types
export interface CreateRestaurantDTO {
  name: string;
  slug: string;
  phone: string;
  address: string;
  total_capacity: number;
  timezone?: string;
  public?: boolean;
  operating_hours?: any;
}

export interface UpdateRestaurantDTO {
  name?: string;
  slug?: string;
  phone?: string;
  address?: string;
  total_capacity?: number;
  timezone?: string;
  public?: boolean;
  operating_hours?: any;
  whatsapp_message_template?: string;
  max_party_size?: number;
  max_online_party_size?: number;
  booking_cutoff_hours?: number;
  cancellation_cutoff_hours?: number;
  modification_cutoff_hours?: number;
  late_tolerance_minutes?: number;
  enable_waitlist?: boolean;
  enable_table_joining?: boolean;
  enable_modifications?: boolean;
}

export interface RestaurantResponseDTO {
  id: string;
  owner_email: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  total_capacity: number;
  timezone: string;
  public: boolean;
  operating_hours: any;
  whatsapp_message_template?: string;
  max_party_size?: number;
  max_online_party_size?: number;
  booking_cutoff_hours?: number;
  cancellation_cutoff_hours?: number;
  modification_cutoff_hours?: number;
  late_tolerance_minutes?: number;
  enable_waitlist?: boolean;
  enable_table_joining?: boolean;
  enable_modifications?: boolean;
  created_date: Date;
  updated_date: Date;
}

// Customer Types
export interface CreateCustomerDTO {
  restaurant_id: string;
  full_name: string;
  phone_whatsapp: string;
  email?: string;
  birth_date?: Date;
}

export interface UpdateCustomerDTO {
  full_name?: string;
  phone_whatsapp?: string;
  email?: string;
  birth_date?: Date;
  total_reservations?: number;
  total_spent?: number;
}

export interface CustomerResponseDTO {
  id: string;
  restaurant_id: string;
  owner_email: string;
  full_name: string;
  phone_whatsapp: string;
  email: string | null;
  birth_date: Date | null;
  total_reservations: number;
  total_spent: number;
  created_date: Date;
  updated_date: Date;
}

// Table Types
export interface CreateTableDTO {
  restaurant_id: string;
  name: string;
  seats: number;
  environment_id?: string;
  is_active?: boolean;
  status?: 'AVAILABLE' | 'UNAVAILABLE' | 'BLOCKED';
  position_x?: number;
  position_y?: number;
}

export interface UpdateTableDTO {
  name?: string;
  seats?: number;
  environment_id?: string;
  is_active?: boolean;
  status?: 'AVAILABLE' | 'UNAVAILABLE' | 'BLOCKED';
  position_x?: number;
  position_y?: number;
}

export interface TableResponseDTO {
  id: string;
  restaurant_id: string;
  owner_email: string;
  name: string;
  seats: number;
  environment_id: string | null;
  is_active: boolean;
  status: string;
  position_x: number | null;
  position_y: number | null;
  created_date: Date;
  updated_date: Date;
}

// Environment Types
export interface CreateEnvironmentDTO {
  restaurant_id: string;
  name: string;
  capacity?: number;
  is_active?: boolean;
}

export interface UpdateEnvironmentDTO {
  name?: string;
  capacity?: number;
  is_active?: boolean;
}

export interface EnvironmentResponseDTO {
  id: string;
  restaurant_id: string;
  owner_email: string;
  name: string;
  capacity: number | null;
  is_active: boolean;
  created_date: Date;
  updated_date: Date;
}

// Shift Types
export interface CreateShiftDTO {
  restaurant_id: string;
  name: string;
  start_time: string;
  end_time: string;
  slot_interval_minutes?: number;
  default_dwell_minutes?: number;
  default_buffer_minutes?: number;
  max_capacity?: number;
  days_of_week: number[];
  active?: boolean;
}

export interface UpdateShiftDTO {
  name?: string;
  start_time?: string;
  end_time?: string;
  slot_interval_minutes?: number;
  default_dwell_minutes?: number;
  default_buffer_minutes?: number;
  max_capacity?: number;
  days_of_week?: number[];
  active?: boolean;
}

export interface ShiftResponseDTO {
  id: string;
  restaurant_id: string;
  owner_email: string;
  name: string;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
  default_dwell_minutes: number;
  default_buffer_minutes: number;
  max_capacity: number | null;
  days_of_week: number[];
  active: boolean;
  created_date: Date;
  updated_date: Date;
}

// Reservation Types
export interface CreateReservationDTO {
  restaurant_id: string;
  customer_id: string;
  date: Date;
  shift_id: string;
  slot_time: string;
  party_size: number;
  table_id: string;
  linked_tables?: string[];
  environment_id?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  source: 'PHONE' | 'ONLINE';
  notes?: string;
}

export interface UpdateReservationDTO {
  customer_id?: string;
  date?: Date;
  shift_id?: string;
  slot_time?: string;
  party_size?: number;
  table_id?: string;
  linked_tables?: string[];
  environment_id?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  source?: 'PHONE' | 'ONLINE';
  notes?: string;
}

export interface ReservationResponseDTO {
  id: string;
  restaurant_id: string;
  owner_email: string;
  customer_id: string;
  reservation_code: string;
  date: Date;
  shift_id: string;
  slot_time: string;
  party_size: number;
  table_id: string;
  linked_tables: string[];
  environment_id: string | null;
  status: string;
  source: string;
  notes: string | null;
  created_date: Date;
  updated_date: Date;
}

// Subscription Types
export interface CreateSubscriptionDTO {
  user_email: string;
  plan_type: 'DOMUS_FREE' | 'DOMUS_PAID';
  status: 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'PAST_DUE';
  current_period_start: Date;
  current_period_end: Date;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface UpdateSubscriptionDTO {
  plan_type?: 'DOMUS_FREE' | 'DOMUS_PAID';
  status?: 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'PAST_DUE';
  current_period_start?: Date;
  current_period_end?: Date;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  cancelled_at?: Date;
}

export interface SubscriptionResponseDTO {
  id: string;
  user_email: string;
  plan_type: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: Date;
  current_period_end: Date;
  cancelled_at: Date | null;
  created_date: Date;
  updated_date: Date;
}

// Filter Types
export interface FilterParams {
  [key: string]: any;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

