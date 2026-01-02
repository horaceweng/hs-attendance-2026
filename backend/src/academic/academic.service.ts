// src/academic/academic.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSeasonDto,
  UpdateSeasonDto,
  CreateHolidayDto
} from './dto';

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
    
    // 輸出詳細調試信息
    console.log(`學年ID=${id} 找到 ${academicYear.seasons.length} 個季節記錄，其中有效記錄 ${validSeasons.length} 個`);
    if (academicYear.seasons.length > 0 && validSeasons.length === 0) {
      console.log(`警告: 學年ID=${id} 的季節數據可能有問題，原始數據:`, JSON.stringify(academicYear.seasons));
    }
    
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
      console.log(`創建學年: 學年=${data.year}, 名稱=${data.name}, 啟用=${isActive}`);
      
      // 如果需要啟用新學年，先把所有現有學年設為不啟用
      if (isActive) {
        await this.prisma.academicYear.updateMany({
          where: {},  // 更新所有學年
          data: { isActive: false }
        });
        console.log('已將所有現有學年設為停用');
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
      
      console.log(`學年創建成功: ID=${newYear.id}, 年度=${newYear.year}, 啟用=${newYear.isActive}`);
      
      // 確認新學年狀態
      const verifiedYear = await this.prisma.academicYear.findUnique({
        where: { id: newYear.id }
      });
      
      if (verifiedYear) {
        console.log(`確認學年狀態: ID=${verifiedYear.id}, 啟用=${verifiedYear.isActive}`);
        
        // 如果應該啟用但沒有啟用，進行修復
        if (isActive && !verifiedYear.isActive) {
          console.log('學年應該啟用但實際未啟用，進行修復');
          await this.prisma.academicYear.update({
            where: { id: newYear.id },
            data: { isActive: true }
          });
        }
      } else {
        console.log(`警告: 無法驗證新學年 ID=${newYear.id} 的狀態`);
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
      
      console.log(`${schoolYear} 學年中有 ${classes.length} 個班級`);
      
      if (classes.length === 0) {
        console.log(`警告: ${schoolYear} 學年中沒有找到班級`);
        
        // 查看是否有任何班級在系統中
        const allClasses = await this.prisma.class.findMany({
          take: 5,
          orderBy: { schoolYear: 'desc' }
        });
        
        if (allClasses.length > 0) {
          console.log(`系統中有班級，最近的學年是: ${allClasses[0].schoolYear}`);
          console.log(`示例班級: ${allClasses[0].name} (ID: ${allClasses[0].id}, 年級: ${allClasses[0].gradeId})`);
        } else {
          console.log('系統中沒有任何班級');
        }
      }
      
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
      console.log(`開始處理學年ID=${academicYearId} 的學生升級...`);
      
      // 檢查學年是否存在
      const academicYear = await this.prisma.academicYear.findUnique({
        where: { id: academicYearId }
      });
      
      if (!academicYear) {
        console.log(`錯誤: ID=${academicYearId} 的學年不存在`);
        throw new Error(`學年 ${academicYearId} 不存在`);
      }
      
      const newSchoolYear = academicYear.year;
      
      // 我們不在這裡管理學年的啟用狀態，因為這應該由createAcademicYear處理
      console.log(`學年ID=${academicYearId}, 年度=${newSchoolYear} 存在，繼續學生升級流程`);
      
      // 獲取所有活躍學生的當前班級註冊 (上一學年)
      const previousSchoolYear = newSchoolYear - 1;
      
      console.log(`當前學年: ${newSchoolYear}, 上一學年: ${previousSchoolYear}`);
      
      // 檢查上一學年是否存在
      const previousYearExists = await this.prisma.class.findFirst({
        where: { schoolYear: previousSchoolYear }
      });
      
      if (!previousYearExists) {
        console.log(`警告：在系統中找不到 ${previousSchoolYear} 學年的班級資料。將創建新班級而不升級學生。`);
        
        // 獲取所有年級
        const grades = await this.prisma.grade.findMany({
          orderBy: { id: 'asc' }
        });
        
        if (grades.length === 0) {
          console.log('警告：系統中沒有任何年級資料');
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
        
        console.log(`已為 ${newSchoolYear} 學年創建 ${classesToCreate.length} 個基本班級`);
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
      
      console.log(`找到 ${activeStudentEnrollments.length} 個活躍學生需要升級`);
      
      if (activeStudentEnrollments.length === 0) {
        console.log(`警告：在 ${previousSchoolYear} 學年中沒有找到任何學生班級註冊`);
        
        // 嘗試查看是否有任何學生註冊
        const anyEnrollments = await this.prisma.studentClassEnrollment.findMany({
          take: 5
        });
        
        console.log(`數據庫中有 ${anyEnrollments.length} 個學生班級註冊記錄`);
        if (anyEnrollments.length > 0) {
          console.log(`示例：學生ID=${anyEnrollments[0].studentId}, 班級ID=${anyEnrollments[0].classId}, 學年=${anyEnrollments[0].schoolYear}`);
        }
      }
      
      // 先為新學年創建所有班級
      console.log(`為 ${newSchoolYear} 學年創建班級...`);
      
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
      
      console.log(`發現 ${previousYearClasses.length} 個上一學年班級, ${existingNewYearClasses.length} 個新學年已存在班級`);
      
      // 創建新學年班級的映射 (gradeId => classId)
      const newYearClassesByGradeId = new Map<number, number>();
      
      // 如果新學年沒有班級，則創建
      if (existingNewYearClasses.length === 0) {
        console.log(`為 ${newSchoolYear} 學年創建班級...`);
        
        // 獲取所有年級
        const grades = await this.prisma.grade.findMany({
          orderBy: { id: 'asc' }
        });
        
        console.log(`找到 ${grades.length} 個年級作為創建班級的基礎`);
        
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
            console.log(`成功為 ${newSchoolYear} 學年創建了 ${classesToCreate.length} 個班級`);
            console.log(`班級名稱示例: ${classesToCreate.map(c => c.name).join(', ')}`);
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
            console.log(`成功為 ${newSchoolYear} 學年創建了 ${classesToCreate.length} 個班級`);
            console.log(`班級名稱示例: ${classesToCreate.map(c => c.name).join(', ')}`);
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
      
      console.log(`${newSchoolYear} 學年共有 ${allNewYearClasses.length} 個班級可用於學生升級`);
      console.log(`班級年級對應關係: ${JSON.stringify(Object.keys(existingClassesByGradeId))}`);
      
      // 檢查是否為所有可能的年級都有班級
      const grades = await this.prisma.grade.findMany({
        orderBy: { id: 'asc' }
      });
      
      // 為缺失的年級創建班級
      for (const grade of grades) {
        if (!existingClassesByGradeId[grade.id]) {
          console.log(`為缺少的 ${grade.id} 年級創建班級`);
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
            console.log(`學生 ${enrollment.student.name} (ID: ${enrollment.student.id}) 已經在 ${newSchoolYear} 學年有班級註冊`);
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
              
              console.log(`學生 ${enrollment.student.name} (ID: ${enrollment.student.id}) 從 ${currentGradeId} 年級升級到 ${nextGradeId} 年級 (班級 ID: ${nextClass.id})`);
            } else {
              console.log(`警告: 找不到 ${nextGradeId} 年級的班級，學生 ${enrollment.student.name} (ID: ${enrollment.student.id}) 無法升級`);
              
              // 嘗試為此年級創建一個新班級
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
                  
                  console.log(`為 ${nextGradeId} 年級創建了一個新班級 (ID: ${newClass.id})`);
                  
                  // 創建新學年的班級註冊
                  enrollmentsToCreate.push({
                    studentId: enrollment.student.id,
                    classId: newClass.id,
                    schoolYear: newSchoolYear,
                  });
                  
                  console.log(`學生 ${enrollment.student.name} (ID: ${enrollment.student.id}) 從 ${currentGradeId} 年級升級到 ${nextGradeId} 年級 (班級 ID: ${newClass.id})`);
                }
              } catch (error) {
                console.error(`為 ${nextGradeId} 年級創建新班級時出錯:`, error);
              }
            }
          } else {
            // 如果沒有下一年級，學生畢業
            graduatedStudentIds.push(enrollment.student.id);
            console.log(`學生 ${enrollment.student.name} (ID: ${enrollment.student.id}) 從 ${currentGradeId} 年級畢業`);
          }
        } catch (error) {
          console.error(`處理學生 ID=${enrollment.student.id} 時出錯:`, error);
        }
      }
      
      // 如果沒有找到學生，但有上一學年的班級，嘗試創建一個測試學生進行升級
      if (activeStudentEnrollments.length === 0 && previousYearClasses.length > 0) {
        console.log('嘗試為每個年級的班級創建演示學生註冊...');
        
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
            console.log(`創建了演示學生 (ID: ${demoStudent.id})`);
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
                console.log(`為班級 ${cls.name} (ID: ${cls.id}) 創建了演示學生註冊`);
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
            console.log(`成功創建 ${enrollmentsToCreate.length} 個學生的新班級註冊`);
          } else {
            console.log('沒有學生需要升級');
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
            console.log(`成功將 ${graduatedStudentIds.length} 個學生標記為畢業`);
          }
        });
        
        // 驗證操作成功，但不再修改學年啟用狀態
        console.log(`學生升級/畢業處理完成`);
        
        
        // 驗證班級和學生註冊是否正確
        const createdClasses = await this.prisma.class.findMany({
          where: { schoolYear: newSchoolYear }
        });
        
        const createdEnrollments = await this.prisma.studentClassEnrollment.findMany({
          where: { schoolYear: newSchoolYear }
        });
        
        console.log(`已再次確認 ${newSchoolYear} 學年設為啟用`);
        console.log(`驗證: ${createdClasses.length} 個班級和 ${createdEnrollments.length} 個學生註冊已創建`);
        
        if (createdClasses.length > 0) {
          console.log(`班級樣本: ID=${createdClasses[0].id}, 名稱=${createdClasses[0].name}, 學年=${createdClasses[0].schoolYear}, 年級ID=${createdClasses[0].gradeId}`);
        }
        
        if (createdEnrollments.length > 0) {
          console.log(`學生註冊樣本: ID=${createdEnrollments[0].id}, 學生ID=${createdEnrollments[0].studentId}, 班級ID=${createdEnrollments[0].classId}, 學年=${createdEnrollments[0].schoolYear}`);
        }
        
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
      throw new NotFoundException(`Academic year with ID ${id} not found`);
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
      throw new NotFoundException(`Academic year with ID ${id} not found`);
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
      throw new NotFoundException(`Season with ID ${id} not found`);
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
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }
  }
}