import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toDateKey(d: Date | string) {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function debug(dateStr: string) {
  const dateKey = toDateKey(dateStr);
  console.log(`Debugging leave/attendance matching for date: ${dateKey}`);

  // Print which DATABASE_URL and current DB the Prisma client is using
  try {
    const envUrl = process.env.DATABASE_URL || '(no DATABASE_URL in env)';
    const safeUrl = typeof envUrl === 'string' ? envUrl.split('@').pop() : envUrl;
    console.log(`Effective DATABASE_URL (sanitized host/db): ${safeUrl}`);

    const dbNameRaw: any = await prisma.$queryRaw`SELECT DATABASE() as db`;
    const dbName = Array.isArray(dbNameRaw) ? dbNameRaw[0].db : dbNameRaw.db;
    console.log(`Prisma connected to database: ${dbName}`);

    const tzRaw: any = await prisma.$queryRaw`SELECT @@session.time_zone as session_tz, @@global.time_zone as global_tz`;
    const tz = Array.isArray(tzRaw) ? tzRaw[0] : tzRaw;
    console.log(`MySQL time_zone session=${tz.session_tz} global=${tz.global_tz}`);
  } catch (err) {
    console.warn('Could not read DB connection info via raw query:', err.message || err);
  }

  // Raw counts via SQL to compare with Prisma findMany
  const totalLeavesRaw: any = await prisma.$queryRaw`
    SELECT COUNT(*) AS cnt FROM leave_requests
    WHERE start_date <= ${dateStr} AND end_date >= ${dateStr}`;
  const totalLeaves = Array.isArray(totalLeavesRaw) ? totalLeavesRaw[0].cnt : totalLeavesRaw.cnt;
  console.log(`Raw SQL: found ${totalLeaves} leave_requests overlapping ${dateKey}`);

  const sampleLeaves: any[] = await prisma.$queryRaw`
    SELECT id, student_id, start_date, end_date, status
    FROM leave_requests
    WHERE start_date <= ${dateStr} AND end_date >= ${dateStr}
    LIMIT 100`;
  console.log(`Sample rows from leave_requests (up to 100): ${sampleLeaves.length}`);
  for (const r of sampleLeaves) {
    console.log(`id=${r.id} student_id=${r.student_id} status=${r.status} start=${r.start_date} end=${r.end_date}`);
  }

  // Now try fetching via Prisma model queries (original approach)
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      OR: [{ status: 'pending' }, { status: 'approved' }],
      startDate: { lte: new Date(dateStr) },
      endDate: { gte: new Date(dateStr) },
    },
    include: { student: true, leaveType: true },
  });
  console.log(`Prisma findMany returned ${leaves.length} leaveRequest model rows overlapping ${dateKey}`);

  // Attendance via raw SQL
  const totalAttendanceRaw: any = await prisma.$queryRaw`
    SELECT COUNT(*) AS cnt FROM attendance_records
    WHERE attendance_date = ${dateStr}`;
  const totalAttendance = Array.isArray(totalAttendanceRaw) ? totalAttendanceRaw[0].cnt : totalAttendanceRaw.cnt;
  console.log(`Raw SQL: found ${totalAttendance} attendance_records for ${dateKey}`);

  const sampleAttendance: any[] = await prisma.$queryRaw`
    SELECT id, student_id, attendance_date, status
    FROM attendance_records
    WHERE attendance_date = ${dateStr}
    LIMIT 100`;
  console.log(`Sample rows from attendance_records (up to 100): ${sampleAttendance.length}`);
  for (const r of sampleAttendance) {
    console.log(`id=${r.id} student_id=${r.student_id} status=${r.status} attendance_date=${r.attendance_date}`);
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { attendanceDate: new Date(dateStr) },
    include: { student: true, leaveType: true },
  });
  console.log(`Prisma findMany returned ${attendanceRecords.length} attendanceRecord model rows for ${dateKey}`);

  // Map attendance by studentId -> dateKey
  const attendanceByStudent: Record<string, any[]> = {};
  for (const a of attendanceRecords) {
    const key = toDateKey(a.attendanceDate);
    attendanceByStudent[a.studentId] = attendanceByStudent[a.studentId] || [];
    attendanceByStudent[a.studentId].push({ key, record: a });
  }

  for (const l of leaves) {
    const lStart = toDateKey(l.startDate);
    const lEnd = toDateKey(l.endDate);
    const inRange = dateKey >= lStart && dateKey <= lEnd;
    const att = attendanceByStudent[l.studentId] || [];
    const hasAttendanceToday = att.some(a => a.key === dateKey);

    console.log('---');
    console.log(`Leave id: ${l.id}, student: ${l.student.name} (${l.studentId}), status: ${l.status}`);
    console.log(`raw start: ${l.startDate.toISOString()}, raw end: ${l.endDate.toISOString()}`);
    console.log(`normalized start: ${lStart}, normalized end: ${lEnd}, inRange: ${inRange}`);
    console.log(`attendance records for student today: ${hasAttendanceToday ? att.filter(a => a.key === dateKey).map(x => x.record.id).join(',') : 'none'}`);
  }

  await prisma.$disconnect();
}

const argvDate = process.argv[2] || new Date().toISOString().split('T')[0];
debug(argvDate).catch(err => { console.error(err); prisma.$disconnect(); process.exit(1); });
