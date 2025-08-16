import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 业务档案基本信息
 */
export interface BusinessProfileData {
  business_name: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  business_hours: any;
  support_content: string;
  business_type: string;
}

/**
 * 营业地点信息
 */
export interface BusinessLocationData {
  location_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  business_hours: any;
}

/**
 * 员工信息
 */
export interface StaffMemberData {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  job_title: string;
  email: string;
  phone: string;
  is_active: boolean;
  job_types?: string[];
}

/**
 * 员工服务信息
 */
export interface StaffServiceData {
  staff_id: string;
  staff_name: string;
  job_name: string;
  job_description: string;
  custom_duration_minutes: number;
  custom_price: number;
  proficiency_level: string;
}

/**
 * 业务服务信息
 */
export interface BusinessServiceData {
  service_name: string;
  service_description: string;
  price: number;
  duration_minutes: number;
}

/**
 * 预约类型信息
 */
export interface AppointmentTypeData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

/**
 * 保险提供商信息
 */
export interface InsuranceData {
  provider_name: string;
  provider_code: string;
  network_status: string;
  copay_amount: number;
}

/**
 * 营业时间信息
 */
export interface OfficeHoursData {
  day_of_week: number; // 0=周日, 1=周一, ..., 6=周六
  start_time: string; // 格式: "09:00:00"
  end_time: string; // 格式: "17:00:00"
  is_active: boolean; // 是否营业
}

/**
 * Job Types信息 - 服务类型数据
 */
export interface JobTypeData {
  id: string;
  job_name: string;
  job_description: string;
  default_duration_minutes: number;
  default_price: number;
  price_currency: string;
  is_system_default: boolean;
  job_categories: {
    id: string;
    category_name: string;
    description: string;
  } | null;
}

/**
 * Agent配置信息
 */
export interface AgentConfigurationData {
  id: string;
  client_id: string;
  agent_type_id: string;
  agent_name: string;
  call_scripts: any;
  call_routing: any;
  agent_personality: string;
  call_scripts_prompt: string;
  greeting_message: string;
  agent_type?: {
    id: string;
    type_code: string;
    name: string;
    description: string;
    icon: string;
  };
}

/**
 * 元数据数据库查询类
 * 负责从多个表中获取业务元数据
 */
export class MetaDataQueries {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * 获取业务档案基本信息
   */
  async getBusinessProfile(): Promise<BusinessProfileData | null> {
    const { data, error } = await this.supabase
      .from('business_profiles')
      .select(
        'business_name, business_phone, business_email, business_address, business_hours, support_content, business_type'
      )
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching business profile:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取主要营业地点信息
   */
  async getPrimaryLocation(): Promise<BusinessLocationData | null> {
    // 首先尝试获取标记为主要地点的位置
    let { data, error } = await this.supabase
      .from('business_locations')
      .select(
        'location_name, street_address, city, state, postal_code, phone, business_hours'
      )
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .eq('is_primary', true)
      .single();

    // 如果没有主要地点，则获取第一个激活的地点
    if (error && error.code === 'PGRST116') {
      const result = await this.supabase
        .from('business_locations')
        .select(
          'location_name, street_address, city, state, postal_code, phone, business_hours'
        )
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching business location:', error);
      return null;
    }

    return data;
  }

  /**
   * 获取所有激活的员工信息
   */
  async getStaffMembers(): Promise<StaffMemberData[]> {
    const { data, error } = await this.supabase
      .from('staff_members')
      .select(
        'id, first_name, last_name, title, job_title, email, phone, is_active, job_types'
      )
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('first_name');

    if (error) {
      console.error('Error fetching staff members:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 获取员工的服务信息
   */
  async getStaffServicesById(
    staffId: string,
    jobTypeIds: string[]
  ): Promise<any[]> {
    if (!jobTypeIds || jobTypeIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('job_types')
      .select('id, job_name, job_description')
      .in('id', jobTypeIds)
      .eq('is_active', true);

    if (error) {
      console.error(`Error fetching job types for staff ${staffId}:`, error);
      return [];
    }

    return data || [];
  }

  /**
   * 获取员工提供的服务信息
   */
  async getStaffServices(): Promise<StaffServiceData[]> {
    const { data, error } = await this.supabase
      .from('staff_job_assignments')
      .select(
        `
        staff_id,
        custom_duration_minutes,
        custom_price,
        proficiency_level,
        staff_members!inner(first_name, last_name, is_active),
        job_types!inner(job_name, job_description)
      `
      )
      .eq('staff_members.user_id', this.userId)
      .eq('staff_members.is_active', true)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching staff services:', error);
      return [];
    }

    return (
      data?.map((item: any) => ({
        staff_id: item.staff_id,
        staff_name: `${item.staff_members.first_name} ${item.staff_members.last_name}`,
        job_name: item.job_types.job_name,
        job_description: item.job_types.job_description,
        custom_duration_minutes: item.custom_duration_minutes,
        custom_price: item.custom_price,
        proficiency_level: item.proficiency_level,
      })) || []
    );
  }

  /**
   * 获取业务服务信息
   */
  async getBusinessServices(): Promise<BusinessServiceData[]> {
    const { data, error } = await this.supabase
      .from('business_services')
      .select('service_name, service_description, price, duration_minutes')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('service_name');

    if (error) {
      console.error('Error fetching business services:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 获取预约类型信息
   */
  async getAppointmentTypes(): Promise<AppointmentTypeData[]> {
    const { data, error } = await this.supabase
      .from('appointment_types')
      .select('name, description, duration_minutes, price')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching appointment types:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 获取接受的保险信息 - 从business profile的insurance_accepted数组字段获取
   */
  async getAcceptedInsurance(): Promise<InsuranceData[]> {
    try {
      // 直接查询business_profiles表的insurance_accepted字段
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('insurance_accepted')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching insurance_accepted from profile:', error);
        return [];
      }

      // 如果没有数据或insurance_accepted为空，返回空数组
      if (
        !data?.insurance_accepted ||
        !Array.isArray(data.insurance_accepted)
      ) {
        return [];
      }

      // 将字符串数组转换为InsuranceData格式
      return data.insurance_accepted.map((insuranceName: string) => ({
        provider_name: insuranceName,
        provider_code: insuranceName.toLowerCase().replace(/\s+/g, '_'),
        network_status: null,
        copay_amount: null,
      }));
    } catch (error) {
      console.error('Error fetching accepted insurance from profile:', error);
      return [];
    }
  }

  /**
   * 获取营业时间信息
   */
  async getOfficeHours(): Promise<OfficeHoursData[]> {
    const { data, error } = await this.supabase
      .from('office_hours')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('user_id', this.userId)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching office hours:', error);
      return [];
    }

    return (
      data?.map((item: any) => ({
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: item.is_active,
      })) || []
    );
  }

  /**
   * 获取Job Types（服务类型）信息
   */
  async getJobTypes(serviceTypeCode: string): Promise<JobTypeData[]> {
    const { data, error } = await this.supabase
      .from('job_types')
      .select(
        `
        id,
        job_name,
        job_description,
        default_duration_minutes,
        default_price,
        price_currency,
        is_system_default,
        job_categories (
          id,
          category_name,
          description
        )
      `
      )
      .eq('service_type_code', serviceTypeCode)
      .eq('is_active', true)
      .or(`is_system_default.eq.true,user_id.eq.${this.userId}`)
      .order('job_name');

    if (error) {
      console.error('Error fetching job types:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 获取Agent配置信息 - 通过retell_agents表的agentId查找
   */
  async getAgentConfigurations(
    agentId?: string
  ): Promise<AgentConfigurationData[]> {
    try {
      // 如果没有提供agentId，返回空数组
      if (!agentId) {
        console.warn('No agentId provided for agent configuration lookup');
        return [];
      }

      // 第一步：通过retell_agents表查找ai_agent_id
      const { data: retellAgentData, error: retellAgentError } =
        await this.supabase
          .from('retell_agents')
          .select('ai_agent_id')
          .eq('retell_agent_id', agentId)
          .eq('user_id', this.userId)
          .single();

      if (retellAgentError || !retellAgentData?.ai_agent_id) {
        console.warn(
          `No retell agent found for agentId: ${agentId}`,
          retellAgentError
        );
        return [];
      }

      const aiAgentId = retellAgentData.ai_agent_id;

      // 第二步：使用ai_agent_id查询agent_configurations_scoped表
      const { data, error } = await this.supabase
        .from('agent_configurations_scoped')
        .select(
          `
          id,
          client_id,
          agent_type_id,
          agent_name,
          call_scripts,
          call_routing,
          agent_personality,
          call_scripts_prompt,
          greeting_message,
          agent_types (
            id,
            type_code,
            name,
            description,
            icon
          )
        `
        )
        .eq('id', aiAgentId);

      if (error) {
        console.error('Error fetching agent configurations:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.warn(
          `No agent configuration found for aiAgentId: ${aiAgentId}`
        );
        return [];
      }

      // 格式化返回数据
      return data.map((config: any) => ({
        id: config.id,
        client_id: config.client_id,
        agent_type_id: config.agent_type_id,
        agent_name: config.agent_name,
        call_scripts: config.call_scripts,
        call_routing: config.call_routing,
        agent_personality: config.agent_personality,
        call_scripts_prompt: config.call_scripts_prompt,
        greeting_message: config.greeting_message,
        agent_type: config.agent_types
          ? {
              id: config.agent_types.id,
              type_code: config.agent_types.type_code,
              name: config.agent_types.name,
              description: config.agent_types.description,
              icon: config.agent_types.icon,
            }
          : undefined,
      }));
    } catch (error) {
      console.error('Error in getAgentConfigurations:', error);
      return [];
    }
  }

  /**
   * 获取特定Agent配置信息
   */
  async getAgentConfiguration(
    agentId: string
  ): Promise<AgentConfigurationData | null> {
    const configurations = await this.getAgentConfigurations(agentId);
    return configurations.length > 0 ? configurations[0] : null;
  }

  /**
   * 获取所有元数据（一次性获取所有数据以提高性能）
   */
  async getAllMetaData() {
    // 首先获取业务档案来确定服务类型
    const businessProfile = await this.getBusinessProfile();
    const serviceTypeCode = businessProfile?.business_type || 'dental'; // 默认为dental

    const [
      primaryLocation,
      staffMembers,
      staffServices,
      businessServices,
      appointmentTypes,
      acceptedInsurance,
      officeHours,
      jobTypes,
    ] = await Promise.all([
      this.getPrimaryLocation(),
      this.getStaffMembers(),
      this.getStaffServices(),
      this.getBusinessServices(),
      this.getAppointmentTypes(),
      this.getAcceptedInsurance(),
      this.getOfficeHours(),
      this.getJobTypes(serviceTypeCode),
    ]);

    return {
      businessProfile,
      primaryLocation,
      staffMembers,
      staffServices,
      businessServices,
      appointmentTypes,
      acceptedInsurance,
      officeHours,
      jobTypes,
    };
  }
}
