import { MetaDataResponse, StaffInfo, ServiceInfo } from '@/types/clinic';
import {
  MetaDataQueries,
  BusinessProfileData,
  BusinessLocationData,
  StaffMemberData,
  StaffServiceData,
  BusinessServiceData,
  AppointmentTypeData,
  InsuranceData,
  OfficeHoursData,
  JobTypeData,
} from './db-queries';

/**
 * 元数据聚合器
 * 负责将来自多个数据库表的数据聚合成MetaDataResponse格式
 */
export class MetaDataAggregator {
  /**
   * 格式化地址信息 - 优先使用business_profiles的地址信息
   */
  private static formatLocation(
    businessProfile: BusinessProfileData | null,
    location: BusinessLocationData | null
  ): string {
    // 优先使用business_profiles中的地址信息
    if (businessProfile?.business_address) {
      return businessProfile.business_address;
    }

    // 降级到business_locations的地址信息，拼接分离的字段
    if (location) {
      const parts = [
        location.street_address,
        location.city,
        location.state,
        location.postal_code,
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    return '';
  }

  /**
   * 格式化员工信息为对象数组，包含id、name、title和services
   */
  private static async formatTeam(
    staffMembers: StaffMemberData[],
    queries: MetaDataQueries
  ): Promise<StaffInfo[]> {
    const teamPromises = staffMembers.map(async staff => {
      const fullName = `${staff.first_name} ${staff.last_name}`.trim();
      const title = staff.title || staff.job_title;

      // 获取员工的服务信息
      let services = [];
      if (staff.job_types && staff.job_types.length > 0) {
        const jobTypes = await queries.getStaffServicesById(
          staff.id,
          staff.job_types
        );
        services = jobTypes.map(jobType => ({
          id: jobType.id,
          job_name: jobType.job_name,
          job_description: jobType.job_description,
        }));
      }

      return {
        id: staff.id,
        name: fullName,
        title: title || undefined,
        services: services.length > 0 ? services : undefined,
      };
    });

    return Promise.all(teamPromises);
  }

  /**
   * 聚合所有服务信息 - 优先使用job_types数据，返回包含id的服务对象
   */
  private static aggregateServices(
    jobTypes: JobTypeData[],
    businessServices: BusinessServiceData[],
    staffServices: StaffServiceData[],
    appointmentTypes: AppointmentTypeData[]
  ): ServiceInfo[] {
    const serviceMap = new Map<string, ServiceInfo>();

    // 优先使用job_types数据
    jobTypes.forEach(jobType => {
      if (jobType.job_name && jobType.id) {
        serviceMap.set(jobType.id, {
          id: jobType.id,
          name: jobType.job_name,
        });
      }
    });

    // 如果job_types没有数据，则使用原有的聚合逻辑作为降级
    if (serviceMap.size === 0) {
      // 添加业务服务 (使用服务名作为ID，因为business_services可能没有独立的ID)
      businessServices.forEach((service, index) => {
        if (service.service_name) {
          const id = `business_service_${index}`;
          serviceMap.set(id, {
            id: id,
            name: service.service_name,
          });
        }
      });

      // 添加员工提供的服务 (使用组合ID)
      staffServices.forEach((service, index) => {
        if (service.job_name) {
          const id = `staff_service_${service.staff_id}_${index}`;
          serviceMap.set(id, {
            id: id,
            name: service.job_name,
          });
        }
      });

      // 添加预约类型 (使用预约类型名作为ID)
      appointmentTypes.forEach((type, index) => {
        if (type.name) {
          const id = `appointment_type_${index}`;
          serviceMap.set(id, {
            id: id,
            name: type.name,
          });
        }
      });
    }

    // 转换为数组并按名称排序
    return Array.from(serviceMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * 格式化营业时间 - 优先使用office_hours表数据
   */
  private static formatBusinessHours(
    businessHours: any,
    officeHours: OfficeHoursData[]
  ): string[] {
    // 优先使用office_hours表的数据
    if (officeHours && officeHours.length > 0) {
      return this.formatOfficeHours(officeHours);
    }

    // 如果没有office_hours数据，尝试解析business_hours JSONB作为降级
    if (businessHours && typeof businessHours === 'object') {
      return this.parseBusinessHoursJson(businessHours);
    }

    // 默认营业时间（与office_hours格式保持一致）
    return [
      'Sunday: Closed',
      'Monday: 9:00 AM to 5:00 PM',
      'Tuesday: 9:00 AM to 5:00 PM',
      'Wednesday: 9:00 AM to 5:00 PM',
      'Thursday: 9:00 AM to 5:00 PM',
      'Friday: 9:00 AM to 5:00 PM',
      'Saturday: Closed',
    ];
  }

  /**
   * 格式化office_hours表数据
   * day_of_week: 0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六
   */
  private static formatOfficeHours(officeHours: OfficeHoursData[]): string[] {
    const daysOfWeek = [
      'Sunday', // 0
      'Monday', // 1
      'Tuesday', // 2
      'Wednesday', // 3
      'Thursday', // 4
      'Friday', // 5
      'Saturday', // 6
    ];

    return daysOfWeek.map((dayName, index) => {
      const dayData = officeHours.find(hour => hour.day_of_week === index);

      if (!dayData || !dayData.is_active) {
        return `${dayName}: Closed`;
      }

      const startTime = this.formatTime(dayData.start_time);
      const endTime = this.formatTime(dayData.end_time);

      return `${dayName}: ${startTime} to ${endTime}`;
    });
  }

  /**
   * 解析business_hours JSONB数据
   */
  private static parseBusinessHoursJson(businessHours: any): string[] {
    try {
      const daysOfWeek = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];

      return daysOfWeek.map(day => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        const dayData = businessHours[day];

        if (!dayData || !dayData.open) {
          return `${dayName}: Closed`;
        }

        const startTime = this.formatTime(dayData.start);
        const endTime = this.formatTime(dayData.end);

        return `${dayName}: ${startTime} to ${endTime}`;
      });
    } catch (error) {
      console.error('Error parsing business hours JSON:', error);
      return ['Business hours: Please contact us'];
    }
  }

  /**
   * 格式化时间（从24小时制转换为12小时制）
   */
  private static formatTime(time: string): string {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return time; // 如果解析失败，返回原始时间
    }
  }

  /**
   * 格式化保险信息
   */
  private static formatInsurance(insuranceData: InsuranceData[]): string[] {
    return insuranceData.map(insurance => {
      const baseName = insurance.provider_name;
      const networkInfo = insurance.network_status
        ? ` (${insurance.network_status})`
        : '';

      return `${baseName}${networkInfo}`;
    });
  }

  /**
   * 主聚合方法：将所有数据聚合成MetaDataResponse
   */
  static async aggregateMetaData(
    userId: string,
    _agentId: string,
    queries: MetaDataQueries
  ): Promise<MetaDataResponse> {
    // 获取所有数据
    const {
      businessProfile,
      primaryLocation,
      staffMembers,
      staffServices,
      businessServices,
      appointmentTypes,
      acceptedInsurance,
      officeHours,
      jobTypes,
    } = await queries.getAllMetaData();

    // 确定数据源优先级：business_profiles > business_locations > 默认值
    const practiceName =
      businessProfile?.business_name ||
      primaryLocation?.location_name ||
      'Our Practice';

    const location = this.formatLocation(businessProfile, primaryLocation);

    const phone =
      businessProfile?.business_phone || primaryLocation?.phone || '';

    const email = businessProfile?.business_email || '';

    // 聚合团队信息
    const team = await this.formatTeam(staffMembers, queries);

    // 聚合服务信息 - 优先使用job_types数据
    const services = this.aggregateServices(
      jobTypes,
      businessServices,
      staffServices,
      appointmentTypes
    );

    // 格式化营业时间
    const hours = this.formatBusinessHours(
      businessProfile?.business_hours,
      officeHours
    );

    // 格式化保险信息
    const insurance = this.formatInsurance(acceptedInsurance);

    const result: MetaDataResponse = {
      practice_name: practiceName,
      location: location,
      phone: phone,
      email: email,
      team: team,
      services: services,
      hours: hours,
      insurance: insurance,
      user_id: userId,
    };

    return result;
  }

  /**
   * 生成详细的服务信息（包含价格和时长）- 优先使用job_types数据
   */
  static generateDetailedServices(
    jobTypes: JobTypeData[],
    businessServices: BusinessServiceData[],
    staffServices: StaffServiceData[],
    appointmentTypes: AppointmentTypeData[]
  ) {
    return {
      job_types: jobTypes.map(jobType => ({
        id: jobType.id,
        name: jobType.job_name,
        description: jobType.job_description,
        price: jobType.default_price,
        duration: jobType.default_duration_minutes,
        currency: jobType.price_currency,
        category: jobType.job_categories?.category_name,
        is_system_default: jobType.is_system_default,
      })),
      business_services: businessServices.map(service => ({
        name: service.service_name,
        description: service.service_description,
        price: service.price,
        duration: service.duration_minutes,
      })),
      staff_services: staffServices.map(service => ({
        staff_name: service.staff_name,
        service_name: service.job_name,
        description: service.job_description,
        price: service.custom_price,
        duration: service.custom_duration_minutes,
        proficiency: service.proficiency_level,
      })),
      appointment_types: appointmentTypes.map(type => ({
        name: type.name,
        description: type.description,
        price: type.price,
        duration: type.duration_minutes,
      })),
    };
  }

  /**
   * 验证聚合后的数据完整性
   */
  static validateMetaData(metaData: MetaDataResponse): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    if (!metaData.practice_name || metaData.practice_name === 'Our Practice') {
      warnings.push('Practice name is missing or using default value');
    }

    if (!metaData.location) {
      warnings.push('Business location is missing');
    }

    if (!metaData.phone) {
      warnings.push('Business phone number is missing');
    }

    if (!metaData.email) {
      warnings.push('Business email is missing');
    }

    if (metaData.team.length === 0) {
      warnings.push('No staff members found');
    }

    if (metaData.services.length === 0) {
      warnings.push('No services found');
    }

    if (metaData.insurance.length === 0) {
      warnings.push('No insurance information found');
    }

    const isValid = warnings.length === 0;

    return { isValid, warnings };
  }
}
