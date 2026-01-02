// in backend/prisma/seed.ts --- FINAL TYPE-SAFE VERSION

import { PrismaClient, Role, Gender } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- 使用 upsert 安全地建立基礎資料 ---
  console.log('Upserting leave types...');
  const leaveTypes = [
    { name: '事假', description: 'Personal leave' },
    { name: '病假', description: 'Sick leave' },
    { name: '公假', description: 'Official leave' },
    { name: '喪假', description: 'Bereavement leave' },
  ];

  for (const lt of leaveTypes) {
  const existing = await prisma.leaveType.findFirst({ where: { name: lt.name } });
    if (existing) {
      await prisma.leaveType.update({ where: { id: existing.id }, data: lt });
    } else {
      await prisma.leaveType.create({ data: lt });
    }
  }

  // 現在我們有 1-12 年級
  const gradesData = [
    { id: 1, name: '1A' },
    { id: 2, name: '2A' },
    { id: 3, name: '3A' },
    { id: 4, name: '4A' },
    { id: 5, name: '5A' },
    { id: 6, name: '6A' },
    { id: 7, name: '7A' },
    { id: 8, name: '8A' },
    { id: 9, name: '9A' },
    { id: 10, name: '10A' },
    { id: 11, name: '11A' },
    { id: 12, name: '12A' },
  ];
  
  console.log('Creating grades...');
  for (const gradeInfo of gradesData) {
    await prisma.grade.upsert({ where: { id: gradeInfo.id }, update: {}, create: gradeInfo });
  }
  
  // --- 清除並重建使用者和學生資料 ---
  await prisma.teacherClassAssignment.deleteMany({});
  await prisma.studentClassEnrollment.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Creating users...');
  await prisma.user.createMany({
    data: [
      { name: '林龍伸', role: Role.teacher },
      { name: '紀輔則', role: Role.teacher }, 
      { name: '王新', role: Role.teacher },
      { name: '王慧宜', role: Role.teacher }, 
      { name: '怡茜', role: Role.GA_specialist },
      { name: '安妮', role: Role.GA_specialist },
    ]
  });
  
  // 正式學生資料 - 包含年級、班級、座號、學號和姓名
  type StudentInfo = {
    gradeNum: number;       // 年級數字，例如 12
    className: string;      // 班級，例如 103
    seatNo: number;         // 座號，例如 14
    studentId: string;      // 學號，例如 I10350
    name: string;           // 姓名，例如 賴安國
  };

  const studentsData: StudentInfo[] = [
    // 一年級
    { gradeNum: 1, className: '114', seatNo: 1, studentId: 'T11403', name: '李忻修' },
    { gradeNum: 1, className: '114', seatNo: 2, studentId: 'T11401', name: '曹琍媛' },
    { gradeNum: 1, className: '114', seatNo: 3, studentId: 'T11407', name: '蔡寧允' },
    { gradeNum: 1, className: '114', seatNo: 4, studentId: 'T11402', name: '張家菁' },
    { gradeNum: 1, className: '114', seatNo: 5, studentId: 'T11408', name: '陳柏宇' },
    { gradeNum: 1, className: '114', seatNo: 6, studentId: 'T11404', name: '黃彣妍' },
    { gradeNum: 1, className: '114', seatNo: 7, studentId: 'T11406', name: '陳以恩' },
    { gradeNum: 1, className: '114', seatNo: 8, studentId: 'T11405', name: '陳允曦' },
    { gradeNum: 1, className: '114', seatNo: 9, studentId: 'T11410', name: '張瀚宇' },
    { gradeNum: 1, className: '114', seatNo: 10, studentId: 'T11409', name: '蔡沐岑' },
    { gradeNum: 1, className: '114', seatNo: 11, studentId: 'T11412', name: '林丞熙' },
    { gradeNum: 1, className: '114', seatNo: 12, studentId: 'T11411', name: '翁睿岑' },
    
    // 二年級
    { gradeNum: 2, className: '113', seatNo: 1, studentId: 'R11205', name: '洪御皓' },
    { gradeNum: 2, className: '113', seatNo: 2, studentId: 'S11314', name: '陳右庭' },
    { gradeNum: 2, className: '113', seatNo: 3, studentId: 'S11308', name: '沈恩圻' },
    { gradeNum: 2, className: '113', seatNo: 4, studentId: 'S11307', name: '顏品悅' },
    { gradeNum: 2, className: '113', seatNo: 5, studentId: 'S11302', name: '吳安實' },
    { gradeNum: 2, className: '113', seatNo: 6, studentId: 'S11306', name: '林宸翟' },
    { gradeNum: 2, className: '113', seatNo: 7, studentId: 'S11309', name: '楊粢宇' },
    { gradeNum: 2, className: '113', seatNo: 8, studentId: 'S11310', name: '馮書宇' },
    { gradeNum: 2, className: '113', seatNo: 9, studentId: 'S11304', name: '林育帆' },
    { gradeNum: 2, className: '113', seatNo: 10, studentId: 'S11305', name: '李重希' },
    { gradeNum: 2, className: '113', seatNo: 11, studentId: 'S11303', name: '李亮儀' },
    { gradeNum: 2, className: '113', seatNo: 12, studentId: 'S11313', name: '陳怡蒼' },
    { gradeNum: 2, className: '113', seatNo: 13, studentId: 'S11301', name: '蔡雨泱' },
    { gradeNum: 2, className: '113', seatNo: 14, studentId: 'S11312', name: '徐定堉' },
    { gradeNum: 2, className: '113', seatNo: 15, studentId: 'S11311', name: '吳思' },
    { gradeNum: 2, className: '113', seatNo: 16, studentId: 'S11315', name: '黃琳斐' },
    
    // 三年級
    { gradeNum: 3, className: '112', seatNo: 1, studentId: 'R11214', name: '廖偉辰' },
    { gradeNum: 3, className: '112', seatNo: 2, studentId: 'R11208', name: '廖柏軒' },
    { gradeNum: 3, className: '112', seatNo: 3, studentId: 'R11213', name: '張詔傑' },
    { gradeNum: 3, className: '112', seatNo: 4, studentId: 'R11206', name: '黃唯時' },
    { gradeNum: 3, className: '112', seatNo: 5, studentId: 'R11215', name: '吳鎮宇' },
    { gradeNum: 3, className: '112', seatNo: 6, studentId: 'R11202', name: '朱栩瑤' },
    { gradeNum: 3, className: '112', seatNo: 7, studentId: 'Q11104', name: '余承順' },
    { gradeNum: 3, className: '112', seatNo: 8, studentId: 'R11203', name: '黃郁潔' },
    { gradeNum: 3, className: '112', seatNo: 9, studentId: 'R11216', name: '曾昱華' },
    { gradeNum: 3, className: '112', seatNo: 10, studentId: 'R11217', name: '林家安' },
    { gradeNum: 3, className: '112', seatNo: 11, studentId: 'R11204', name: '謝地' },
    { gradeNum: 3, className: '112', seatNo: 12, studentId: 'R11207', name: '楊易瑋' },
    { gradeNum: 3, className: '112', seatNo: 13, studentId: 'R11218', name: '陳映崨' },
    { gradeNum: 3, className: '112', seatNo: 14, studentId: 'R11210', name: '江子琪' },
    { gradeNum: 3, className: '112', seatNo: 15, studentId: 'R11209', name: '周茄' },

    // 四年級
    { gradeNum: 4, className: '111', seatNo: 1, studentId: 'Q11118', name: '倪宇樂' },
    { gradeNum: 4, className: '111', seatNo: 2, studentId: 'Q11111', name: '陳稚甯' },
    { gradeNum: 4, className: '111', seatNo: 3, studentId: 'Q11108', name: '任煦安' },
    { gradeNum: 4, className: '111', seatNo: 4, studentId: 'Q11101', name: '曹睿軒' },
    { gradeNum: 4, className: '111', seatNo: 5, studentId: 'Q11107', name: '陳薏蔓' },
    { gradeNum: 4, className: '111', seatNo: 6, studentId: 'Q11119', name: '林芸熙' },
    { gradeNum: 4, className: '111', seatNo: 7, studentId: 'Q11113', name: '李東叡' },
    { gradeNum: 4, className: '111', seatNo: 8, studentId: 'Q11112', name: '賴麗國' },
    { gradeNum: 4, className: '111', seatNo: 9, studentId: 'Q11102', name: '蔡岳宸' },
    { gradeNum: 4, className: '111', seatNo: 10, studentId: 'Q11105', name: '許芯菲' },
    { gradeNum: 4, className: '111', seatNo: 11, studentId: 'Q11103', name: '高元鈞' },
    { gradeNum: 4, className: '111', seatNo: 12, studentId: 'Q11109', name: '黃心妮' },
    { gradeNum: 4, className: '111', seatNo: 13, studentId: 'Q11114', name: '林瑾媗' },
    { gradeNum: 4, className: '111', seatNo: 14, studentId: 'Q11115', name: '王少甫' },
    { gradeNum: 4, className: '111', seatNo: 15, studentId: 'Q11116', name: '蔡寧家' },
    { gradeNum: 4, className: '111', seatNo: 16, studentId: 'Q11117', name: '陳亮衡' },

    // 五年級
    { gradeNum: 5, className: '110', seatNo: 1, studentId: 'P11032', name: '林宸安' },
    { gradeNum: 5, className: '110', seatNo: 2, studentId: 'P11006', name: '陳星瑜' },
    { gradeNum: 5, className: '110', seatNo: 3, studentId: 'P11008', name: '陳以宸' },
    { gradeNum: 5, className: '110', seatNo: 4, studentId: 'P11021', name: '沈敬閔' },
    { gradeNum: 5, className: '110', seatNo: 5, studentId: 'P11015', name: '楊東穆' },
    { gradeNum: 5, className: '110', seatNo: 6, studentId: 'P11005', name: '林妡縈' },
    { gradeNum: 5, className: '110', seatNo: 7, studentId: 'P11001', name: '莊秉霖' },
    { gradeNum: 5, className: '110', seatNo: 8, studentId: 'P11007', name: '王苡婕' },
    { gradeNum: 5, className: '110', seatNo: 9, studentId: 'P11003', name: '楊岱鋼' },
    { gradeNum: 5, className: '110', seatNo: 10, studentId: 'P11023', name: '陳彥均' },
    { gradeNum: 5, className: '110', seatNo: 11, studentId: 'P11011', name: '陳宇翔' },
    { gradeNum: 5, className: '110', seatNo: 12, studentId: 'P11012', name: '張鈺穎' },
    { gradeNum: 5, className: '110', seatNo: 13, studentId: 'P11017', name: '劉宥廷' },
    { gradeNum: 5, className: '110', seatNo: 14, studentId: 'P11019', name: '王凱宣' },
    { gradeNum: 5, className: '110', seatNo: 15, studentId: 'P11013', name: '葉翊廷' },
    { gradeNum: 5, className: '110', seatNo: 16, studentId: 'P11014', name: '黃卉歆' },
    { gradeNum: 5, className: '110', seatNo: 17, studentId: 'P11010', name: '洪御恩' },
    { gradeNum: 5, className: '110', seatNo: 18, studentId: 'O10915', name: '王子彤' },
    { gradeNum: 5, className: '110', seatNo: 19, studentId: 'P11002', name: '楊岱融' },
    { gradeNum: 5, className: '110', seatNo: 20, studentId: 'P11020', name: '陳亭羽' },
    { gradeNum: 5, className: '110', seatNo: 21, studentId: 'P11033', name: '陳映言' },
    { gradeNum: 5, className: '110', seatNo: 22, studentId: 'P11029', name: '施衍佐' },
    { gradeNum: 5, className: '110', seatNo: 23, studentId: 'P11025', name: '陳柏叡' },
    { gradeNum: 5, className: '110', seatNo: 24, studentId: 'P11035', name: '蔡懷賞' },
    { gradeNum: 5, className: '110', seatNo: 25, studentId: 'P11031', name: '賴靚齊' },
    { gradeNum: 5, className: '110', seatNo: 26, studentId: 'P11028', name: '吳芷安' },
    { gradeNum: 5, className: '110', seatNo: 27, studentId: 'P11030', name: '曾謙浩' },
    { gradeNum: 5, className: '110', seatNo: 28, studentId: 'P11027', name: '廖婕妤' },

    // 六年級
    { gradeNum: 6, className: '109', seatNo: 1, studentId: 'O10903', name: '黃士祈' },
    { gradeNum: 6, className: '109', seatNo: 2, studentId: 'O10904', name: '余振林' },
    { gradeNum: 6, className: '109', seatNo: 3, studentId: 'O10905', name: '曹恩維' },
    { gradeNum: 6, className: '109', seatNo: 4, studentId: 'O10906', name: '鄭梓青' },
    { gradeNum: 6, className: '109', seatNo: 5, studentId: 'O10908', name: '黃暄竣' },
    { gradeNum: 6, className: '109', seatNo: 6, studentId: 'O10909', name: '陳宇澔' },
    { gradeNum: 6, className: '109', seatNo: 7, studentId: 'N10821', name: '陳昱男' },
    { gradeNum: 6, className: '109', seatNo: 8, studentId: 'O10911', name: '謝  天' },
    { gradeNum: 6, className: '109', seatNo: 9, studentId: 'O10913', name: '黃首德' },
    { gradeNum: 6, className: '109', seatNo: 10, studentId: 'O10902', name: '蔡可歆' },
    { gradeNum: 6, className: '109', seatNo: 11, studentId: 'O10907', name: '鄭梓宥' },
    { gradeNum: 6, className: '109', seatNo: 12, studentId: 'O10914', name: '陳妍心' },
    { gradeNum: 6, className: '109', seatNo: 13, studentId: 'O10916', name: '吳淳真' },
    { gradeNum: 6, className: '109', seatNo: 14, studentId: 'O10917', name: '何定謙' },
    { gradeNum: 6, className: '109', seatNo: 15, studentId: 'O10918', name: '陳余運' },
    { gradeNum: 6, className: '109', seatNo: 16, studentId: 'O10901', name: '林澍右' },
    { gradeNum: 6, className: '109', seatNo: 17, studentId: 'O10919', name: '吳沁耘' },
    { gradeNum: 6, className: '109', seatNo: 18, studentId: 'O10920', name: '廖芷瑄' },

    // 七年級
    { gradeNum: 7, className: '108', seatNo: 1, studentId: 'N10807', name: '許貫堯' },
    { gradeNum: 7, className: '108', seatNo: 2, studentId: 'N10831', name: '林永晨' },
    { gradeNum: 7, className: '108', seatNo: 3, studentId: 'N10810', name: '楊詠丞' },
    { gradeNum: 7, className: '108', seatNo: 4, studentId: 'N10823', name: '王維翔' },
    { gradeNum: 7, className: '108', seatNo: 5, studentId: 'N10832', name: '陳映澄' },
    { gradeNum: 7, className: '108', seatNo: 6, studentId: 'N10809', name: '戴維萱' },
    { gradeNum: 7, className: '108', seatNo: 7, studentId: 'N10825', name: '劉洲睿' },
    { gradeNum: 7, className: '108', seatNo: 8, studentId: 'N10803', name: '余旻華' },
    { gradeNum: 7, className: '108', seatNo: 9, studentId: 'N10805', name: '陳柏綝' },
    { gradeNum: 7, className: '108', seatNo: 10, studentId: 'N10802', name: '施亮琦' },
    { gradeNum: 7, className: '108', seatNo: 11, studentId: 'N10808', name: '葉奕辰' },
    { gradeNum: 7, className: '108', seatNo: 12, studentId: 'N10822', name: '王裔騰' },
    { gradeNum: 7, className: '108', seatNo: 13, studentId: 'N10815', name: '張修福' },
    { gradeNum: 7, className: '108', seatNo: 14, studentId: 'N10806', name: '楊棠心' },
    { gradeNum: 7, className: '108', seatNo: 15, studentId: 'M10719', name: '方紹宸' },
    { gradeNum: 7, className: '108', seatNo: 16, studentId: 'N10814', name: '林芩如' },
    { gradeNum: 7, className: '108', seatNo: 17, studentId: 'N10811', name: '高元暘' },
    { gradeNum: 7, className: '108', seatNo: 18, studentId: 'N10801', name: '林禾晴' },
    { gradeNum: 7, className: '108', seatNo: 19, studentId: 'N10812', name: '黃紹恩' },
    { gradeNum: 7, className: '108', seatNo: 20, studentId: 'N10824', name: '夏子揚' },
    { gradeNum: 7, className: '108', seatNo: 21, studentId: 'N10804', name: '吳子杰' },
    { gradeNum: 7, className: '108', seatNo: 22, studentId: 'N10826', name: '黃麟筌' },
    { gradeNum: 7, className: '108', seatNo: 23, studentId: 'N10830', name: '吳忻庭' },
    { gradeNum: 7, className: '108', seatNo: 24, studentId: 'N10829', name: '陳宥霖' },
    { gradeNum: 7, className: '108', seatNo: 25, studentId: 'N10828', name: '林靚琝' },

    // 八年級
    { gradeNum: 8, className: '107', seatNo: 1, studentId: 'M10720', name: '梁涵晰' },
    { gradeNum: 8, className: '107', seatNo: 2, studentId: 'M10703', name: '楊杰靛' },
    { gradeNum: 8, className: '107', seatNo: 3, studentId: 'M10723', name: '朱柏穎' },
    { gradeNum: 8, className: '107', seatNo: 4, studentId: 'M10713', name: '劉星伶' },
    { gradeNum: 8, className: '107', seatNo: 5, studentId: 'M10712', name: '林亦欣' },
    { gradeNum: 8, className: '107', seatNo: 6, studentId: 'M10705', name: '吳軒彤' },
    { gradeNum: 8, className: '107', seatNo: 7, studentId: 'M10701', name: '董子莊' },
    { gradeNum: 8, className: '107', seatNo: 8, studentId: 'M10715', name: '紀沛樂' },
    { gradeNum: 8, className: '107', seatNo: 9, studentId: 'M10709', name: '鄭榆家' },
    { gradeNum: 8, className: '107', seatNo: 10, studentId: 'M10710', name: '陳昕妤' },
    { gradeNum: 8, className: '107', seatNo: 11, studentId: 'M10730', name: '林沂希' },
    { gradeNum: 8, className: '107', seatNo: 12, studentId: 'M10727', name: '劉宥岑' },
    { gradeNum: 8, className: '107', seatNo: 13, studentId: 'M10722', name: '鍾佳莉' },
    { gradeNum: 8, className: '107', seatNo: 14, studentId: 'M10724', name: '丁章恩' },
    { gradeNum: 8, className: '107', seatNo: 15, studentId: 'M10731', name: '林璟宥' },
    { gradeNum: 8, className: '107', seatNo: 16, studentId: 'M10702', name: '林鑫辰' },
    { gradeNum: 8, className: '107', seatNo: 17, studentId: 'M10714', name: '黃首傅' },

    // 九年級
    { gradeNum: 9, className: '106', seatNo: 1, studentId: 'L10633', name: '陳晉諺' },
    { gradeNum: 9, className: '106', seatNo: 2, studentId: 'L10613', name: '馬敬筌' },
    { gradeNum: 9, className: '106', seatNo: 3, studentId: 'L10618', name: '吳學睿' },
    { gradeNum: 9, className: '106', seatNo: 4, studentId: 'L10635', name: '吳沛芝' },
    { gradeNum: 9, className: '106', seatNo: 5, studentId: 'L10604', name: '楊絨晟' },
    { gradeNum: 9, className: '106', seatNo: 6, studentId: 'L10612', name: '李秉學' },
    { gradeNum: 9, className: '106', seatNo: 7, studentId: 'L10616', name: '許力恆' },
    { gradeNum: 9, className: '106', seatNo: 8, studentId: 'L10607', name: '蔡沂秀' },
    { gradeNum: 9, className: '106', seatNo: 9, studentId: 'L10626', name: '顏唯恩' },
    { gradeNum: 9, className: '106', seatNo: 10, studentId: 'L10621', name: '楊憶玟' },
    { gradeNum: 9, className: '106', seatNo: 11, studentId: 'L10603', name: '張承輝' },
    { gradeNum: 9, className: '106', seatNo: 12, studentId: 'K10517', name: '雲詠傑' },
    { gradeNum: 9, className: '106', seatNo: 13, studentId: 'L10622', name: '李欣儒' },
    { gradeNum: 9, className: '106', seatNo: 14, studentId: 'L10630', name: '廖筱芸' },
    { gradeNum: 9, className: '106', seatNo: 15, studentId: 'L10615', name: '邱悅暖' },
    { gradeNum: 9, className: '106', seatNo: 16, studentId: 'L10606', name: '許梓涵' },
    { gradeNum: 9, className: '106', seatNo: 17, studentId: 'L10627', name: '夏壐恩' },
    { gradeNum: 9, className: '106', seatNo: 18, studentId: 'L10619', name: '陳以軒' },
    { gradeNum: 9, className: '106', seatNo: 19, studentId: 'L10608', name: '蔡書丞' },
    { gradeNum: 9, className: '106', seatNo: 20, studentId: 'L10637', name: '賴筠思' },
    { gradeNum: 9, className: '106', seatNo: 21, studentId: 'L10631', name: '莊昕' },
    { gradeNum: 9, className: '106', seatNo: 22, studentId: 'L10623', name: '黃小軒' },
    { gradeNum: 9, className: '106', seatNo: 23, studentId: 'L10602', name: '鄭筱霏' },
    { gradeNum: 9, className: '106', seatNo: 24, studentId: 'L10632', name: '陳欲晨' },
    { gradeNum: 9, className: '106', seatNo: 25, studentId: 'L10610', name: '謝馨萮' },
    { gradeNum: 9, className: '106', seatNo: 26, studentId: 'L10634', name: '何芊謙' },

    // 十年級
    { gradeNum: 10, className: '105', seatNo: 1, studentId: 'K10532', name: '張恩睿' },
    { gradeNum: 10, className: '105', seatNo: 2, studentId: 'K10525', name: '童渝芯' },
    { gradeNum: 10, className: '105', seatNo: 3, studentId: 'K10502', name: '林琮人' },
    { gradeNum: 10, className: '105', seatNo: 4, studentId: 'K10509', name: '劉奐希' },
    { gradeNum: 10, className: '105', seatNo: 5, studentId: 'K10538', name: '黃亦廷' },
    { gradeNum: 10, className: '105', seatNo: 6, studentId: 'K10513', name: '洪博鑫' },
    { gradeNum: 10, className: '105', seatNo: 7, studentId: 'K10537', name: '賴慧國' },
    { gradeNum: 10, className: '105', seatNo: 8, studentId: 'K10507', name: '羅予葳' },
    { gradeNum: 10, className: '105', seatNo: 9, studentId: 'J10426', name: '黃湘芸' },
    { gradeNum: 10, className: '105', seatNo: 10, studentId: 'K10520', name: '林心悅' },
    { gradeNum: 10, className: '105', seatNo: 11, studentId: 'K10518', name: '雲詠筑' },
    { gradeNum: 10, className: '105', seatNo: 12, studentId: 'K10536', name: '蔡佳叡' },
    { gradeNum: 10, className: '105', seatNo: 13, studentId: 'J10445', name: '林孟萱' },
    { gradeNum: 10, className: '105', seatNo: 14, studentId: 'K10512', name: '方浿旂' },

    // 十一年級
    { gradeNum: 11, className: '104', seatNo: 1, studentId: 'J10431', name: '陳孟弘' },
    { gradeNum: 11, className: '104', seatNo: 2, studentId: 'J10418', name: '楊少軒' },
    { gradeNum: 11, className: '104', seatNo: 3, studentId: 'J10419', name: '李沛芸' },
    { gradeNum: 11, className: '104', seatNo: 4, studentId: 'J10401', name: '蔡書妍' },
    { gradeNum: 11, className: '104', seatNo: 5, studentId: 'J10422', name: '李予昕' },
    { gradeNum: 11, className: '104', seatNo: 6, studentId: 'J10430', name: '曾郁涵' },
    { gradeNum: 11, className: '104', seatNo: 7, studentId: 'J10428', name: '何沂蓁' },
    { gradeNum: 11, className: '104', seatNo: 8, studentId: 'J10413', name: '王暐諺' },
    { gradeNum: 11, className: '104', seatNo: 9, studentId: 'J10402', name: '王凱亭' },
    { gradeNum: 11, className: '104', seatNo: 10, studentId: 'J10429', name: '辜紹輔' },
    { gradeNum: 11, className: '104', seatNo: 11, studentId: 'J10434', name: '張廖嘉嵩' },
    { gradeNum: 11, className: '104', seatNo: 12, studentId: 'J10437', name: '張恩箖' },
    { gradeNum: 11, className: '104', seatNo: 13, studentId: 'J10438', name: '王翊庭' },
    { gradeNum: 11, className: '104', seatNo: 14, studentId: 'J10440', name: '張凱芸' },
    { gradeNum: 11, className: '104', seatNo: 15, studentId: 'J10441', name: '羅靖麒' },
    { gradeNum: 11, className: '104', seatNo: 16, studentId: 'J10443', name: '李耕甫' },
    { gradeNum: 11, className: '104', seatNo: 17, studentId: 'J10444', name: '林施凡' },

    // 十二年級
    { gradeNum: 12, className: '103', seatNo: 1, studentId: 'I10345', name: '吳亮岑' },
    { gradeNum: 12, className: '103', seatNo: 2, studentId: 'I10324', name: '邱悅恆' },
    { gradeNum: 12, className: '103', seatNo: 3, studentId: 'I10344', name: '黃首仁' },
    { gradeNum: 12, className: '103', seatNo: 4, studentId: 'I10337', name: '楊有容' },
    { gradeNum: 12, className: '103', seatNo: 5, studentId: 'I10319', name: '林思妤' },
    { gradeNum: 12, className: '103', seatNo: 6, studentId: 'I10330', name: '馬竟家' },
    { gradeNum: 12, className: '103', seatNo: 7, studentId: 'I10331', name: '洪廉莆' },
    { gradeNum: 12, className: '103', seatNo: 8, studentId: 'I10313', name: '翁芮怡' },
    { gradeNum: 12, className: '103', seatNo: 9, studentId: 'J10435', name: '張廖芯湄' },
    { gradeNum: 12, className: '103', seatNo: 10, studentId: 'I10304', name: '許漢霖' },
    { gradeNum: 12, className: '103', seatNo: 11, studentId: 'I10320', name: '葉璞懷' },
    { gradeNum: 12, className: '103', seatNo: 12, studentId: 'I10335', name: '董子瑄' },
    { gradeNum: 12, className: '103', seatNo: 13, studentId: 'I10347', name: '蔡欣宸' },
    { gradeNum: 12, className: '103', seatNo: 14, studentId: 'I10350', name: '賴安國' },
  ];
  
  console.log(`Creating classes for the school year 2025-2026...`);
  
  // 對於每個年級，創建一個班級 (1A, 2A, ..., 12A)
  for (const gradeInfo of gradesData) {
    // 使用年級資訊中的id作為班級名稱的一部分
    await prisma.class.create({ 
      data: { 
        name: `${gradeInfo.id}A`, 
        gradeId: gradeInfo.id, 
        schoolYear: 2025 
      }
    });
  }
  
  console.log(`Creating ${studentsData.length} students...`);
  
  // 創建學生記錄，只包含必要的欄位，不設定生日和性別
  // 為了符合 Prisma 模型的需求，我們將使用固定默認值
  const defaultBirthday = new Date('2000-01-01'); // 固定默認生日
  
  await prisma.student.createMany({
    data: studentsData.map(s => ({
      studentId: s.studentId, // 學號
      name: s.name, // 姓名
      birthday: defaultBirthday, // 使用固定的默認生日
      gender: Gender.other, // 使用默認性別
      enrollmentDate: new Date('2025-09-01'), // 添加入學日期
      // 這裡省略了隨機生成，後續可以根據需要手動更新這些信息
    })),
  });

  console.log(`Enrolling students into classes and setting seat numbers...`);
  
  // 獲取所有班級和學生
  const all_classes = await prisma.class.findMany();
  const all_students = await prisma.student.findMany();
  
  // 創建映射以便於查找
  const studentMap = new Map(all_students.map(s => [s.studentId, s]));
  const classMap = new Map(all_classes.map(c => [c.name, c]));

  // 創建學生-班級註冊關係
  const enrollmentsToCreate: { 
    studentId: number; 
    classId: number; 
    schoolYear: number; 
    seatNumber?: number;  // 考慮將座號添加到關聯表中
    originalClass?: string; // 原始班級，例如"103"
  }[] = [];
  
  for (const s_data of studentsData) {
    const student = studentMap.get(s_data.studentId);
    const class_ = classMap.get(`${s_data.gradeNum}A`); // 使用年級數字查找對應的班級
    
    if (student && class_) {
      enrollmentsToCreate.push({
        studentId: student.id,
        classId: class_.id,
        schoolYear: 2025,
        seatNumber: s_data.seatNo,
        originalClass: s_data.className
      });
    }
  }
  
  // 由於我們無法在當前模型中直接添加 seatNumber 和 originalClass 欄位，
  // 這裡先省略這些欄位，僅創建標準註冊關係
  await prisma.studentClassEnrollment.createMany({ 
    data: enrollmentsToCreate.map(e => ({
      studentId: e.studentId,
      classId: e.classId,
      schoolYear: e.schoolYear
    }))
  });

  // --- 指派老師到班級 ---
  console.log('Assigning teachers to classes...');
  const teacherFuZe = await prisma.user.findFirst({ where: { name: '紀輔則' } });
  const teacherLongShen = await prisma.user.findFirst({ where: { name: '林龍伸' } });
  const teacherXin = await prisma.user.findFirst({ where: { name: '王新' } });
  
  // 教師分配到高中班級
  const class10A = classMap.get('10A');
  const class11A = classMap.get('11A');
  const class12A = classMap.get('12A');
  
  if (teacherFuZe && class10A) await prisma.teacherClassAssignment.create({ data: { teacherId: teacherFuZe.id, classId: class10A.id, schoolYear: '2025', isActive: true }});
  if (teacherLongShen && class11A) await prisma.teacherClassAssignment.create({ data: { teacherId: teacherLongShen.id, classId: class11A.id, schoolYear: '2025', isActive: true }});
  if (teacherXin && class12A) await prisma.teacherClassAssignment.create({ data: { teacherId: teacherXin.id, classId: class12A.id, schoolYear: '2025', isActive: true }});

  console.log(`Seeding finished with ${studentsData.length} students across ${gradesData.length} grades.`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});