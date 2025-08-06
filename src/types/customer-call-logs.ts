export interface CustomerCallLog {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  insurance: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  customer_id: string | null;
}

export interface CreateCustomerCallLogRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  insurance?: string;
  user_id?: string; // 可选，如果不提供则使用当前用户ID
  customer_id?: string;
}

export interface UpdateCustomerCallLogRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  insurance?: string;
  customer_id?: string;
}

export interface CustomerCallLogListResponse {
  data: CustomerCallLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerCallLogResponse {
  data: CustomerCallLog;
}

export interface ErrorResponse {
  error: string;
}

export interface DeleteResponse {
  message: string;
}
