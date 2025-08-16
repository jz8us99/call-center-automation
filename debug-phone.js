// 测试电话号码格式化问题

function normalizePhone(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if missing (assuming US)
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }

  // Add + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

console.log('Testing phone normalization:');
console.log('Input: +19099908801');
console.log('Output:', normalizePhone('+19099908801'));

console.log('\nInput: 19099908801');
console.log('Output:', normalizePhone('19099908801'));

console.log('\nInput: 9099908801');
console.log('Output:', normalizePhone('9099908801'));

console.log('\nInput: (909) 990-8801');
console.log('Output:', normalizePhone('(909) 990-8801'));
