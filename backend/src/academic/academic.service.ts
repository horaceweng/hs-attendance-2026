// src/academic/academic.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { AcademicYear } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSeasonDto,
  UpdateSeasonDto,
  CreateHolidayDto
} from './dto';

/**
 * 泛用的「班級註冊紀錄」形狀：只要求呼叫端會用到的欄位，
 * 讓 reports/statistics 各自不同的 Prisma include 形狀都能直接套用，
 * 不需要為了共用方法而改變既有查詢的 include 結構。
 */
export interface EnrollmentLike {
  schoolYear: number;
  createdAt?: Date | string | null;
}

export interface StudentWithEnrollments<T extends EnrollmentLike = EnrollmentLike> {
  enrollments: T[];
}

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // Academic Years Service
  /**
   * 通過學年年度查找學年 ID
   * @param year 學年年度 (例如: 2026)
   * @returns 學年 ID
   */
  async findAcademicYearByYear(year: number): Promise<number> {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { year }
    });

    if (!academicYear) {
      throw new NotFoundException(`找不到年度為 ${year} 的學年`);
    }

    return academicYear.id;
  }

  /**
   * 預先載入所有學年設定，供需要「逐日」判斷所屬學年的呼叫端
   * （例如報表逐日迴圈）重複使用，避免每天都對資料庫查詢一次。
   *
   * 用法：在迴圈開始前呼叫一次 `buildAcademicYearLookup()`，
   * 之後每次呼叫 `getAcademicYearForDate(date, cachedYears)` 時
   * 傳入這份快取，就只會在記憶體中查找、不會再打 DB。
   */
  async buildAcademicYearLookup(): Promise<AcademicYear[]> {
    return this.prisma.academicYear.findMany({
      orderBy: { year: 'desc' },
    });
  }

  /**
   * 找出「涵蓋指定日期」的學年設定。
   *
   * @param date 要查詢的日期
   * @param cachedYears 可選，預先用 buildAcademicYearLookup() 載入的學年清單。
   *                    提供時完全走記憶體查找，不會再查詢資料庫；
   *                    未提供時才會即時查一次全部學年（適合單次查詢的情境）。
   * @returns 涵蓋該日期的學年；若學年之間有斷檔（沒有任何學年涵蓋該日期），回傳 null。
   */
  async getAcademicYearForDate(
    date: Date,
    cachedYears?: AcademicYear[],
  ): Promise<AcademicYear | null> {
    const academicYears = cachedYears ?? (await this.buildAcademicYearLookup());
    const dayTime = new Date(date).setUTCHours(0, 0, 0, 0);

    const activeYear = academicYears.find((y) => {
      const yStart = new Date(y.startDate).setUTCHours(0, 0, 0, 0);
      const yEnd = new Date(y.endDate).setUTCHours(23, 59, 59, 999);
      return dayTime >= yStart && dayTime <= yEnd;
    });

    return activeYear ?? null;
  }

  /**
   * 依「指定日期」解析出學生對應的班級註冊紀錄。
   *
   * 邏輯：
   * 1. 先找出涵蓋該日期的學年（見 getAcademicYearForDate）。
   * 2. 若找到學年，取該學生 `schoolYear` 等於該學年年度的註冊紀錄。
   * 3. 【重要 fallback，勿移除】若找不到學年、或該學年下找不到對應的
   *    註冊紀錄，改用「createdAt 最新」的註冊紀錄作為備案。
   *    這是刻意保留的行為：歷史資料中 `schoolYear` 的編碼方式並不一致
   *    （曾有多種編年規則交錯使用），若沒有這層 fallback，
   *    會導致部份學生在報表/統計中被整批漏掉。
   * 4. 若學生完全沒有任何註冊紀錄，回傳 null。
   *
   * @param student 具備 enrollments 陣列的學生物件（形狀依呼叫端的 include 而定）
   * @param date 用來判斷所屬學年的日期
   * @param cachedYears 可選，預先載入的學年清單，避免逐日呼叫時重複查詢 DB
   */
  async resolveEnrollment<T extends EnrollmentLike>(
    student: StudentWithEnrollments<T>,
    date: Date,
    cachedYears?: AcademicYear[],
  ): Promise<T | null> {
    if (!student.enrollments || student.enrollments.length === 0) {
      return null;
    }

    const activeYear = await this.getAcademicYearForDate(date, cachedYears);

    let enrollment: T | undefined;
    if (activeYear) {
      enrollment = student.enrollments.find((e) => e.schoolYear === activeYear.year);
    }

    // Fallback：學年斷檔或找不到對應學年的註冊紀錄時，
    // 改用 createdAt 最新的一筆（語義同上方註解，勿移除）。
    if (!enrollment) {
      enrollment = student.enrollments.reduce((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime >= bTime ? a : b;
      });
    }

    return enrollment ?? null;
  }

  async findAllAcademicYears() {
    const results = await this.prisma.$queryRaw`
      SELECT 
        id, 
        year, 
        name, 
        start_date as startDate, 
        end_date as endDate, 
        is_active as isActive, 
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM academic_years 
      ORDER BY year DESC
    `;
    
    // 確保 isActive 欄位被轉換為布爾值
    if (Array.isArray(results)) {
      return results.map(year => ({
        ...year,
        isActive: Boolean(year.isActive)
      }));
    }
    
    return results;
  }

  async findOneAcademicYear(id: number) {
    // 使用Prisma ORM而非原始SQL查詢，這樣可以避免布爾值轉換問題
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
      include: {
        seasons: true
      }
    });
    
    if (!academicYear) {
      throw new NotFoundException(`Academic year with ID ${id} not found`);
    }
    
    // 過濾掉空的季節條目並確保所有布爾值正確
    const validSeasons = academicYear.seasons.filter(season => season !== null && season.id !== null);

    return {
      ...academicYear,
      isActive: Boolean(academicYear.isActive),
      seasons: validSeasons.map(season => ({
        ...season,
        isActive: Boolean(season.isActive)
      }))
    };
  }

  async createAcademicYear(data: CreateAcademicYearDto, autoPromoteStudents: boolean = false) {
    // 確保 isActive 是布爾值
    const isActive = Boolean(data.isActive);
    
    try {
      // 如果需要啟用新學年，先把所有現有學年設為不啟用
      if (isActive) {
        await this.prisma.academicYear.updateMany({
          where: {},  // 更新所有學年
          data: { isActive: false }
        });
      }

      // 創建新學年，如果需要啟用就直接設為啟用
      const newYear = await this.prisma.academicYear.create({
        data: {
          year: data.year,
          name: data.name,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isActive: isActive  // 直接使用傳入的啟用狀態
        }
      });

      // 確認新學年狀態
      const verifiedYear = await this.prisma.academicYear.findUnique({
        where: { id: newYear.id }
      });

      // 如果應該啟用但沒有啟用，進行修復
      if (verifiedYear && isActive && !verifiedYear.isActive) {
        await this.prisma.academicYear.update({
          where: { id: newYear.id },
          data: { isActive: true }
        });
      }

      let promotionResults: { promoted: number; graduated: number } | undefined;
      
      // 如果選擇自動升級學生
      if (autoPromoteStudents) {
        promotionResults = await this.promoteStudents(newYear.id);
      }
      
      // 返回完整的學年對象和升級結果
      const academicYear = await this.findOneAcademicYear(newYear.id);
      return { 
        ...academicYear, 
        promotionResults
      };
    } catch (error) {
      console.error('創建學年失敗:', error);
      throw error;
    }
  }
  
  /**
   * 獲取特定學年所有可用的班級
   * @param schoolYear 學年 (例如: 2026)
   */
  async getClassesForSchoolYear(schoolYear: number): Promise<any[]> {
    try {
      // 獲取指定學年的所有班級
      const classes = await this.prisma.class.findMany({
        where: { schoolYear: schoolYear },
        include: { grade: true },
        orderBy: { gradeId: 'asc' }
      });

      return classes;
    } catch (error) {
      console.error(`獲取 ${schoolYear} 學年班級時出錯:`, error);
      throw error;
    }
  }
  
  /**
   * 將所有活躍學生升級到下一個年級
   * @param academicYearId 新學年的ID
   */
  async promoteStudents(academicYearId: number): Promise<{ promoted: number; graduated: number }> {
    try {
      // 檢查學年是否存在
      const academicYear = await this.prisma.academicYear.findUnique({
        where: { id: academicYearId }
      });

      if (!academicYear) {
        throw new Error(`學年 ${academicYearId} 不存在`);
      }

      const newSchoolYear = academicYear.year;

      // 獲取所有活躍學生的當前班級註冊 (上一學年)
      const previousSchoolYear = newSchoolYear - 1;

      // 檢查上一學年是否存在
      const previousYearExists = await this.prisma.class.findFirst({
        where: { schoolYear: previousSchoolYear }
      });

      if (!previousYearExists) {
        // 找不到上一學年的班級資料，直接為新學年創建班級而不升級學生
        const grades = await this.prisma.grade.findMany({
          orderBy: { id: 'asc' }
        });

        if (grades.length === 0) {
          return { promoted: 0, graduated: 0 };
        }

        // 為每個年級創建一個班級
        const classesToCreate = grades.map(grade => ({
          name: `${grade.name}班`,
          gradeId: grade.id,
          schoolYear: newSchoolYear
        }));

        await this.prisma.class.createMany({
          data: classesToCreate
        });

        return { promoted: 0, graduated: 0 };
      }

      // 查詢所有活躍學生
      const activeStudentEnrollments = await this.prisma.studentClassEnrollment.findMany({
        where: {
          student: {
            status: 'active', // 只考慮活躍狀態的學生
          },
          schoolYear: previousSchoolYear, // 上一學年
        },
        include: {
          student: true,
          class: {
            include: {
              grade: true,
            },
          },
        },
      });

      // 先為新學年創建所有班級
      // 獲取上一學年的班級作為模板
      const previousYearClasses = await this.prisma.class.findMany({
        where: {
          schoolYear: previousSchoolYear
        },
        include: { grade: true },
        orderBy: { gradeId: 'asc' }
      });
      
      // 檢查新學年是否已有班級
      const existingNewYearClasses = await this.prisma.class.findMany({
        where: {
          schoolYear: newSchoolYear
        },
        orderBy: { gradeId: 'asc' }
      });
      
      // 創建新學年班級的映射 (gradeId => classId)
      const newYearClassesByGradeId = new Map<number, number>();

      // 如果新學年沒有班級，則創建
      if (existingNewYearClasses.length === 0) {
        // 獲取所有年級
        const grades = await this.prisma.grade.findMany({
          orderBy: { id: 'asc' }
        });

        // 如果有上一學年班級，則使用它們的命名規則
        if (previousYearClasses.length > 0) {
          // 按年級分組
          const classesByGradeId = new Map<number, any[]>();
          for (const cls of previousYearClasses) {
            if (!classesByGradeId.has(cls.gradeId)) {
              classesByGradeId.set(cls.gradeId, []);
            }
            const classes = classesByGradeId.get(cls.gradeId);
            if (classes) {
              classes.push(cls);
            }
          }
          
          // 為每個年級創建相同的班級
          const classesToCreate: Array<{name: string, gradeId: number, schoolYear: number}> = [];
          
          for (const grade of grades) {
            const prevClasses = classesByGradeId.get(grade.id) || [];
            
            if (prevClasses.length > 0) {
              // 如果有上一學年的班級，使用相同的命名
              for (const prevClass of prevClasses) {
                classesToCreate.push({
                  name: prevClass.name, // 保留原班級名稱，如 "1A"
                  gradeId: grade.id,
                  schoolYear: newSchoolYear
                });
              }
            } else {
              // 如果沒有上一學年的班級，創建默認班級
              classesToCreate.push({
                name: `${grade.id}A`, // 使用標準命名格式，如 "1A"
                gradeId: grade.id,
                schoolYear: newSchoolYear
              });
            }
          }
          
          // 批量創建班級
          if (classesToCreate.length > 0) {
            await this.prisma.class.createMany({
              data: classesToCreate
            });
          }
        } else {
          // 沒有上一學年班級，為每個年級創建標準班級
          const classesToCreate: Array<{name: string, gradeId: number, schoolYear: number}> = [];
          
          for (const grade of grades) {
            classesToCreate.push({
              name: `${grade.id}A`, // 使用標準命名格式，如 "1A"
              gradeId: grade.id,
              schoolYear: newSchoolYear
            });
          }
          
          if (classesToCreate.length > 0) {
            await this.prisma.class.createMany({
              data: classesToCreate
            });
          }
        }
      }
      
      // 獲取所有新學年班級 (重新查詢，確保有最新創建的班級)
      const allNewYearClasses = await this.prisma.class.findMany({
        where: {
          schoolYear: newSchoolYear
        },
        include: { grade: true }
      });
      
      // 按照年級ID進行分組
      const existingClassesByGradeId: Record<number, any> = {};
      for (const cls of allNewYearClasses) {
        if (!existingClassesByGradeId[cls.gradeId]) {
          existingClassesByGradeId[cls.gradeId] = cls;
          newYearClassesByGradeId.set(cls.gradeId, cls.id);
        }
      }
      
      // 檢查是否為所有可能的年級都有班級
      const grades = await this.prisma.grade.findMany({
        orderBy: { id: 'asc' }
      });
      
      // 為缺失的年級創建班級
      for (const grade of grades) {
        if (!existingClassesByGradeId[grade.id]) {
          const newClass = await this.prisma.class.create({
            data: {
              name: `${grade.name}班`,
              gradeId: grade.id,
              schoolYear: newSchoolYear
            }
          });
          
          existingClassesByGradeId[grade.id] = newClass;
          newYearClassesByGradeId.set(grade.id, newClass.id);
        }
      }
      
      // 為每個學生創建新學年的班級註冊
      const enrollmentsToCreate: Array<{studentId: number, classId: number, schoolYear: number}> = [];
      const graduatedStudentIds: number[] = [];
      
      for (const enrollment of activeStudentEnrollments) {
        try {
          // 獲取學生當前的年級
          const currentGradeId = enrollment.class.gradeId;
          
          // 計算下一年級
          const nextGradeId = currentGradeId + 1;
          
          // 檢查學生是否已經在新學年有註冊
          const existingEnrollment = await this.prisma.studentClassEnrollment.findFirst({
            where: {
              studentId: enrollment.student.id,
              schoolYear: newSchoolYear
            }
          });
          
          if (existingEnrollment) {
            continue;
          }
          
          // 檢查下一年級是否存在（如果是12年級的學生，可能畢業）
          if (nextGradeId <= 12) {  // 假設最高年級是12
            // 找到下一年級的班級
            const nextClass = existingClassesByGradeId[nextGradeId];
            
            if (nextClass) {
              // 創建新學年的班級註冊
              enrollmentsToCreate.push({
                studentId: enrollment.student.id,
                classId: nextClass.id,
                schoolYear: newSchoolYear,
              });
            } else {
              // 找不到下一年級的班級，嘗試為此年級創建一個新班級
              try {
                const grade = await this.prisma.grade.findFirst({
                  where: { id: nextGradeId }
                });
                
                if (grade) {
                  const newClass = await this.prisma.class.create({
                    data: {
                      name: `${grade.name}班`,
                      gradeId: nextGradeId,
                      schoolYear: newSchoolYear
                    }
                  });

                  // 創建新學年的班級註冊
                  enrollmentsToCreate.push({
                    studentId: enrollment.student.id,
                    classId: newClass.id,
                    schoolYear: newSchoolYear,
                  });
                }
              } catch (error) {
                console.error(`為 ${nextGradeId} 年級創建新班級時出錯:`, error);
              }
            }
          } else {
            // 如果沒有下一年級，學生畢業
            graduatedStudentIds.push(enrollment.student.id);
          }
        } catch (error) {
          console.error(`處理學生 ID=${enrollment.student.id} 時出錯:`, error);
        }
      }
      
      // 如果沒有找到學生，但有上一學年的班級，嘗試創建一個測試學生進行升級
      if (activeStudentEnrollments.length === 0 && previousYearClasses.length > 0) {
        // 尋找或創建一個測試學生
        let demoStudent = await this.prisma.student.findFirst({
          where: {
            studentId: 'DEMO-STUDENT'
          }
        });
        
        if (!demoStudent) {
          try {
            demoStudent = await this.prisma.student.create({
              data: {
                studentId: 'DEMO-STUDENT',
                name: '演示學生',
                birthday: new Date('2010-01-01'),
                gender: 'male',
                status: 'active',
                enrollmentDate: new Date(`${newSchoolYear}-09-01`)
              }
            });
          } catch (error) {
            console.error('創建演示學生失敗:', error);
          }
        }
        
        if (demoStudent) {
          // 為每個班級創建一個註冊
          for (const cls of allNewYearClasses) {
            try {
              const existingEnrollment = await this.prisma.studentClassEnrollment.findFirst({
                where: {
                  studentId: demoStudent.id,
                  classId: cls.id,
                  schoolYear: newSchoolYear
                }
              });
              
              if (!existingEnrollment) {
                enrollmentsToCreate.push({
                  studentId: demoStudent.id,
                  classId: cls.id,
                  schoolYear: newSchoolYear
                });
              }
            } catch (error) {
              console.error(`為班級 ${cls.id} 創建演示學生註冊失敗:`, error);
            }
          }
        }
      }
      
      // 批量創建新學年的班級註冊和更新畢業學生
      try {
        // 使用事務確保所有操作都成功或都失敗
        await this.prisma.$transaction(async (prisma) => {
          // 批量創建新的班級註冊
          if (enrollmentsToCreate.length > 0) {
            await prisma.studentClassEnrollment.createMany({
              data: enrollmentsToCreate,
              skipDuplicates: true, // 跳過重複的記錄
            });
          }

          // 批量更新畢業學生的狀態
          if (graduatedStudentIds.length > 0) {
            await prisma.student.updateMany({
              where: {
                id: { in: graduatedStudentIds }
              },
              data: {
                status: 'graduated',
                departureDate: new Date(),
                departureReason: '畢業',
              },
            });
          }
        });

        return {
          promoted: enrollmentsToCreate.length,
          graduated: graduatedStudentIds.length
        };
      } catch (error) {
        console.error('批量處理學生升級時出錯:', error);
        throw error;
      }
    } catch (error) {
      console.error('升級學生時出錯:', error);
      throw error;
    }
  }

  async updateAcademicYear(id: number, data: UpdateAcademicYearDto) {
    try {
      const now = new Date();
      
      // 如果學年設為啟用，先將所有其他學年設為停用
      if (data.isActive) {
        await this.prisma.$executeRaw`
          UPDATE academic_years SET is_active = false, updated_at = ${now} WHERE id != ${id} AND is_active = true
        `;
      }
      
      const result = await this.prisma.$executeRaw`
        UPDATE academic_years
        SET year = ${data.year}, 
            name = ${data.name}, 
            start_date = ${new Date(data.startDate)}, 
            end_date = ${new Date(data.endDate)}, 
            is_active = ${data.isActive},
            updated_at = ${now}
        WHERE id = ${id}
      `;
      
      if (result === 0) {
        throw new NotFoundException(`Academic year with ID ${id} not found`);
      }
      
      return this.findOneAcademicYear(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`更新學年 ID=${id} 失敗:`, error);
      throw error;
    }
  }

  async removeAcademicYear(id: number) {
    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM academic_years WHERE id = ${id}
      `;

      if (result === 0) {
        throw new NotFoundException(`Academic year with ID ${id} not found`);
      }

      return { id };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`刪除學年 ID=${id} 失敗:`, error);
      throw error;
    }
  }

  // Seasons Service
  async findAllSeasons(academicYearId?: number) {
    // 使用Prisma ORM而非原始SQL查詢
    const query = academicYearId ? { academicYearId } : {};
    
    const seasons = await this.prisma.season.findMany({
      where: query,
      include: {
        academicYear: true
      },
      orderBy: [
        { academicYearId: 'desc' },
        { startDate: 'asc' }
      ]
    });
    
    // 確保所有布爾值正確轉換
    return seasons.map(season => ({
      ...season,
      isActive: Boolean(season.isActive),
      academicYear: {
        ...season.academicYear,
        isActive: Boolean(season.academicYear.isActive)
      }
    }));
  }

  async findOneSeason(id: number) {
    // 使用 Prisma ORM 查詢季節
    const season = await this.prisma.season.findUnique({
      where: { id },
      include: {
        academicYear: true
      }
    });
    
    if (!season) {
      throw new NotFoundException(`Season with ID ${id} not found`);
    }
    
    // 確保布爾值正確
    return {
      ...season,
      isActive: Boolean(season.isActive),
      academicYear: {
        ...season.academicYear,
        isActive: Boolean(season.academicYear.isActive)
      }
    };
  }

  async createSeason(data: CreateSeasonDto) {
    try {
      // 使用 Prisma ORM 創建季節，避免 SQL 注入和數據類型問題
      const season = await this.prisma.season.create({
        data: {
          name: data.name,
          type: data.type,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          academicYearId: data.academicYearId,
          isActive: Boolean(data.isActive),
        },
        include: {
          academicYear: true
        }
      });
      
      // 確保布爾值正確
      return {
        ...season,
        isActive: Boolean(season.isActive),
        academicYear: {
          ...season.academicYear,
          isActive: Boolean(season.academicYear.isActive)
        }
      };
    } catch (error) {
      if (error.code === 'P2003') { // Prisma 外鍵約束錯誤代碼
        throw new NotFoundException(`Academic year with ID ${data.academicYearId} not found`);
      }
      console.error('創建季節失敗:', error);
      throw error;
    }
  }

  async updateSeason(id: number, data: UpdateSeasonDto) {
    try {
      // 使用 Prisma ORM 更新季節
      const season = await this.prisma.season.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          academicYearId: data.academicYearId,
          isActive: Boolean(data.isActive),
          updatedAt: new Date()
        },
        include: {
          academicYear: true
        }
      });
      
      // 確保布爾值正確
      return {
        ...season,
        isActive: Boolean(season.isActive),
        academicYear: {
          ...season.academicYear,
          isActive: Boolean(season.academicYear.isActive)
        }
      };
    } catch (error) {
      if (error.code === 'P2025') { // Prisma 記錄找不到錯誤代碼
        throw new NotFoundException(`Season with ID ${id} not found`);
      }
      if (error.code === 'P2003') { // Prisma 外鍵約束錯誤代碼
        throw new NotFoundException(`Academic year with ID ${data.academicYearId} not found`);
      }
      console.error('更新季節失敗:', error);
      throw error;
    }
  }

  async removeSeason(id: number) {
    try {
      // Delete related holidays first
      await this.prisma.$executeRaw`
        DELETE FROM holidays WHERE season_id = ${id}
      `;
      
      const result = await this.prisma.$executeRaw`
        DELETE FROM seasons WHERE id = ${id}
      `;
      
      if (result === 0) {
        throw new NotFoundException(`Season with ID ${id} not found`);
      }
      
      return { id };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`刪除季節 ID=${id} 失敗:`, error);
      throw error;
    }
  }

  // Holidays Service
  async findAllHolidays(seasonId?: number) {
    if (seasonId) {
      return this.prisma.$queryRaw`
        SELECT h.*, 
        JSON_OBJECT(
          'id', s.id, 
          'name', s.name, 
          'type', s.type,
          'startDate', s.start_date, 
          'endDate', s.end_date, 
          'academicYearId', s.academic_year_id,
          'isActive', s.is_active
        ) as season
        FROM holidays h
        JOIN seasons s ON h.season_id = s.id
        WHERE h.season_id = ${seasonId}
        ORDER BY h.date ASC
      `;
    }
    
    return this.prisma.$queryRaw`
      SELECT h.*, 
      JSON_OBJECT(
        'id', s.id, 
        'name', s.name, 
        'type', s.type,
        'startDate', s.start_date, 
        'endDate', s.end_date, 
        'academicYearId', s.academic_year_id,
        'isActive', s.is_active
      ) as season
      FROM holidays h
      JOIN seasons s ON h.season_id = s.id
      ORDER BY h.date ASC
    `;
  }

  async findOneHoliday(id: number) {
    const holiday = await this.prisma.$queryRaw`
      SELECT h.*, 
      JSON_OBJECT(
        'id', s.id, 
        'name', s.name, 
        'type', s.type,
        'startDate', s.start_date, 
        'endDate', s.end_date, 
        'academicYearId', s.academic_year_id,
        'isActive', s.is_active
      ) as season
      FROM holidays h
      JOIN seasons s ON h.season_id = s.id
      WHERE h.id = ${id}
    `;
    
    if (!holiday || (Array.isArray(holiday) && holiday.length === 0)) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }
    
    return Array.isArray(holiday) ? holiday[0] : holiday;
  }

  async createHoliday(data: CreateHolidayDto) {
    try {
      const now = new Date();
      await this.prisma.$executeRaw`
        INSERT INTO holidays (date, description, season_id, created_at, updated_at)
        VALUES (${new Date(data.date)}, ${data.description}, ${data.seasonId}, ${now}, ${now})
      `;
      
      // Get the last inserted ID
      const result = await this.prisma.$queryRaw`SELECT LAST_INSERT_ID() as id`;
      const id = Array.isArray(result) ? (result[0] as any).id : (result as any).id;
      
      return this.findOneHoliday(id);
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new NotFoundException(`Season with ID ${data.seasonId} not found`);
      }
      throw error;
    }
  }

  async removeHoliday(id: number) {
    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM holidays WHERE id = ${id}
      `;
      
      if (result === 0) {
        throw new NotFoundException(`Holiday with ID ${id} not found`);
      }
      
      return { id };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`刪除假日 ID=${id} 失敗:`, error);
      throw error;
    }
  }
}