'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { authenticatedFetch } from '@/lib/api-client';

// 步骤状态接口
interface StepStatus {
  completed: boolean;
  canAccess: boolean;
  lastFetchTime?: number;
}

// 业务数据接口
interface BusinessData {
  businessInfo?: any;
  products?: any[];
  services?: any[];
  staff?: any[];
  appointments?: any[];
  agents?: any[];
}

// Store状态接口
interface BusinessSettingsState {
  // 步骤状态
  workflow: {
    businessInfo: StepStatus;
    products: StepStatus;
    services: StepStatus;
    staffManagement: StepStatus;
    appointmentSystem: StepStatus;
    aiAgentSetup: StepStatus;
  };

  // 缓存的数据
  data: BusinessData;

  // 加载状态
  loading: boolean;
  initialized: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  initializeWorkflow: () => Promise<void>;
  updateBusinessInfo: (hasBusinessInfo: boolean) => void;
  updateProducts: (hasProducts: boolean) => void;
  updateServices: (hasServices: boolean) => void;
  updateStaff: (hasStaff: boolean) => void;
  updateAppointments: (hasAppointments: boolean) => void;
  updateAgents: (hasAgents: boolean) => void;
  clearCache: () => void;
}

// 缓存过期时间（5分钟）
// const CACHE_DURATION = 5 * 60 * 1000;

// 检查缓存是否过期
// const isCacheExpired = (lastFetchTime?: number): boolean => {
//   if (!lastFetchTime) return true;
//   return Date.now() - lastFetchTime > CACHE_DURATION;
// };

// 全局请求锁，防止重复请求
const requestLocks = new Set<string>();

// 安全的API请求函数
const safeFetch = async (endpoint: string, key: string): Promise<any> => {
  if (requestLocks.has(key)) {
    console.log(`Request for ${key} already in progress, skipping`);
    return null;
  }

  requestLocks.add(key);
  try {
    const response = await authenticatedFetch(endpoint);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`Failed to fetch ${key}:`, error);
    return null;
  } finally {
    requestLocks.delete(key);
  }
};

export const useBusinessSettingsStore = create<BusinessSettingsState>()(
  persist(
    (set, get) => ({
      workflow: {
        businessInfo: { completed: false, canAccess: true },
        products: { completed: false, canAccess: false },
        services: { completed: false, canAccess: false },
        staffManagement: { completed: false, canAccess: false },
        appointmentSystem: { completed: false, canAccess: false },
        aiAgentSetup: { completed: false, canAccess: false },
      },

      data: {},
      loading: false,
      initialized: false,

      setLoading: (loading: boolean) => set({ loading }),

      initializeWorkflow: async () => {
        const state = get();

        // 防止重复初始化
        if (state.loading || state.initialized) {
          return;
        }

        set({ loading: true });

        try {
          // 并行获取所有数据
          const [
            businessResult,
            productsResult,
            servicesResult,
            appointmentsResult,
            staffResult,
            agentsResult,
          ] = await Promise.allSettled([
            Promise.resolve(true), // businessInfo 暂时为 true
            safeFetch('/api/business/products', 'products'),
            safeFetch('/api/business/services', 'services'),
            safeFetch('/api/appointment-types', 'appointments'),
            safeFetch('/api/business/staff-members', 'staff'),
            safeFetch('/api/ai-agents', 'agents'),
          ]);

          // 提取数据
          const businessInfo =
            businessResult.status === 'fulfilled' ? businessResult.value : true;
          const productsData =
            productsResult.status === 'fulfilled' ? productsResult.value : null;
          const servicesData =
            servicesResult.status === 'fulfilled' ? servicesResult.value : null;
          const appointmentsData =
            appointmentsResult.status === 'fulfilled'
              ? appointmentsResult.value
              : null;
          const staffData =
            staffResult.status === 'fulfilled' ? staffResult.value : null;
          const agentsData =
            agentsResult.status === 'fulfilled' ? agentsResult.value : null;

          const products = productsData?.products || [];
          const services = servicesData?.services || [];
          const appointments = appointmentsData?.appointment_types || [];
          const staff = staffData?.staff || [];
          const agents = agentsData?.agents || [];

          // 计算步骤状态
          const hasBusinessInfo = !!businessInfo;
          const hasProducts = products.length > 0;
          const hasServices = services.length > 0;
          const hasAppointments = appointments.length > 0;
          const hasStaff = staff.length > 0;
          const hasAgents = agents.length > 0;

          const now = Date.now();

          set({
            data: {
              businessInfo,
              products,
              services,
              appointments,
              staff,
              agents,
            },
            workflow: {
              businessInfo: {
                completed: hasBusinessInfo,
                canAccess: true,
                lastFetchTime: now,
              },
              products: {
                completed: hasProducts,
                canAccess: hasBusinessInfo,
                lastFetchTime: now,
              },
              services: {
                completed: hasServices,
                canAccess: hasBusinessInfo,
                lastFetchTime: now,
              },
              appointmentSystem: {
                completed: hasAppointments,
                canAccess: hasBusinessInfo && hasServices,
                lastFetchTime: now,
              },
              staffManagement: {
                completed: hasStaff,
                canAccess: hasBusinessInfo && hasServices && hasAppointments,
                lastFetchTime: now,
              },
              aiAgentSetup: {
                completed: hasAgents,
                canAccess:
                  hasBusinessInfo &&
                  hasProducts &&
                  hasServices &&
                  hasAppointments &&
                  hasStaff,
                lastFetchTime: now,
              },
            },
            loading: false,
            initialized: true,
          });
        } catch (error) {
          console.warn('Failed to initialize workflow state:', error);
          set({ loading: false });
        }
      },

      updateBusinessInfo: (hasBusinessInfo: boolean) => {
        set(state => ({
          workflow: {
            ...state.workflow,
            businessInfo: {
              ...state.workflow.businessInfo,
              completed: hasBusinessInfo,
            },
            products: {
              ...state.workflow.products,
              canAccess: hasBusinessInfo,
            },
            services: {
              ...state.workflow.services,
              canAccess: hasBusinessInfo,
            },
          },
        }));
      },

      updateProducts: (hasProducts: boolean) => {
        set(state => ({
          workflow: {
            ...state.workflow,
            products: { ...state.workflow.products, completed: hasProducts },
          },
        }));
      },

      updateServices: (hasServices: boolean) => {
        set(state => ({
          workflow: {
            ...state.workflow,
            services: { ...state.workflow.services, completed: hasServices },
            appointmentSystem: {
              ...state.workflow.appointmentSystem,
              canAccess: state.workflow.businessInfo.completed && hasServices,
            },
          },
        }));
      },

      updateStaff: (hasStaff: boolean) => {
        set(state => ({
          workflow: {
            ...state.workflow,
            staffManagement: {
              ...state.workflow.staffManagement,
              completed: hasStaff,
            },
            aiAgentSetup: {
              ...state.workflow.aiAgentSetup,
              canAccess:
                state.workflow.businessInfo.completed &&
                state.workflow.products.completed &&
                state.workflow.services.completed &&
                state.workflow.appointmentSystem.completed &&
                hasStaff,
            },
          },
        }));
      },

      updateAppointments: (hasAppointments: boolean) => {
        set(state => ({
          workflow: {
            ...state.workflow,
            appointmentSystem: {
              ...state.workflow.appointmentSystem,
              completed: hasAppointments,
            },
            staffManagement: {
              ...state.workflow.staffManagement,
              canAccess:
                state.workflow.businessInfo.completed &&
                state.workflow.services.completed &&
                hasAppointments,
            },
          },
        }));
      },

      updateAgents: (hasAgents: boolean) => {
        set(state => ({
          workflow: {
            ...state.workflow,
            aiAgentSetup: {
              ...state.workflow.aiAgentSetup,
              completed: hasAgents,
            },
          },
        }));
      },

      clearCache: () => {
        set({
          data: {},
          initialized: false,
          workflow: {
            businessInfo: { completed: false, canAccess: true },
            products: { completed: false, canAccess: false },
            services: { completed: false, canAccess: false },
            staffManagement: { completed: false, canAccess: false },
            appointmentSystem: { completed: false, canAccess: false },
            aiAgentSetup: { completed: false, canAccess: false },
          },
        });
      },
    }),
    {
      name: 'business-settings-storage',
      partialize: state => ({
        workflow: state.workflow,
        data: state.data,
        initialized: state.initialized,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          console.log('Business settings state rehydrated');
        }
      },
    }
  )
);
