// 测试客户查找功能
const {
  AppointmentService,
} = require('./src/lib/services/appointment-service');

// 创建服务实例
const appointmentService = new AppointmentService();

async function testCustomerLookup() {
  try {
    const phone = '+19099908801';
    const userId = 'test-user-id'; // 用实际的user_id测试

    console.log(`正在查找电话号码: ${phone}, 用户ID: ${userId}`);

    const customer = await appointmentService.lookupCustomer(phone, userId);

    if (customer) {
      console.log('找到客户:', customer);
    } else {
      console.log('未找到客户');
    }
  } catch (error) {
    console.error('查询失败:', error);
  }
}

// 导出为模块以便测试
module.exports = { testCustomerLookup };

// 如果直接运行此脚本
if (require.main === module) {
  testCustomerLookup();
}
