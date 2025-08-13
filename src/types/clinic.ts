/**
 * 诊所业务相关类型定义
 */

// 患者接口
export type Patient = {
  id: string;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null; // Date类型在JSON中是string
  profile: string | null;
  ssn: string | null;
} | null;

// 创建患者请求
export interface CreatePatientRequest {
  id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string; // YYYY-MM-DD格式
  profile?: string;
  ssn?: string;
  user_id?: string; // 如果不提供则使用认证用户ID
  insurance?: string; // 响应格式控制
}

// 更新患者请求
export interface UpdatePatientRequest {
  id?: string; // 患者ID，用于标识更新操作
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  profile?: string;
  ssn?: string;
  format?: 'json' | 'text'; // 响应格式控制
}

// 预约接口（用于显示，不用于CRUD）
export interface Appointment {
  id: string;
  user_id: string;
  call_log_id: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
  updated_at: string;
  date_time: string | null;
  doctor_id: string | null;
  patient_id: string | null;
  reason_for_visit: string | null;
}

// 患者搜索参数
export interface PatientSearchParams {
  // 生日 + SSN后4位查询
  date_of_birth?: string;
  ssn_last4?: string;

  // 生日 + 电话号码查询
  phone?: string;

  // 模糊查询
  name?: string; // 搜索first_name或last_name

  // 分页参数
  page?: number;
  limit?: number;

  // 响应格式控制
  format?: 'json' | 'text'; // 'text'返回格式化字符串，'json'返回结构化数据
}

// API响应格式
export interface PatientListResponse {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientResponse {
  data: Patient;
}

export interface ErrorResponse {
  error: string;
}

export interface DeleteResponse {
  message: string;
  deletedRecord?: Patient;
}

// MetaData 请求参数
export interface MetaDataRequest {
  // 暂时为空，未来可以添加过滤参数如 format, language 等
  format?: 'json' | 'text';
}

// MetaData 响应类型
export interface MetaDataResponse {
  practice_name: string;
  location: string;
  phone: string;
  email: string;
  team: string[];
  services: string[];
  hours: string[];
  insurance: string[];
  emergency_info: string;
  user_id: string;
  agent_id: string;
}

// Retell函数调用相关类型
export interface RetellFunctionCall {
  name: string;
  call: {
    call_id?: string;
    agent_id?: string;
    // 其他call对象属性...
  };
  args:
    | PatientSearchParams
    | CreatePatientRequest
    | UpdatePatientRequest
    | MetaDataRequest;
}

// Retell函数响应类型
export interface RetellFunctionResponse {
  result?: PatientListResponse | PatientResponse | MetaDataResponse | string;
  error?: string;
}
