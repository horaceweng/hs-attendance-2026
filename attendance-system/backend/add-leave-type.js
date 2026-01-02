// 添加喪假到資料庫
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('開始檢查與添加喪假...');
  
  // 檢查喪假是否已存在
  const existingLeaveType = await prisma.leaveType.findFirst({
    where: { name: '喪假' }
  });

  if (existingLeaveType) {
    console.log('喪假已存在，ID:', existingLeaveType.id);
  } else {
    // 添加喪假
    const newLeaveType = await prisma.leaveType.create({
      data: {
        name: '喪假',
        description: 'Bereavement leave'
      }
    });
    console.log('成功添加喪假，ID:', newLeaveType.id);
  }
  
  // 輸出所有假別
  const allLeaveTypes = await prisma.leaveType.findMany();
  console.log('所有假別:');
  allLeaveTypes.forEach(lt => {
    console.log(`- ${lt.id}: ${lt.name} (${lt.description || '無描述'})`);
  });
}

main()
  .catch(e => {
    console.error('錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });