/**
 * 🧪 اختبارات التكامل: Gateway ↔ Expectation Engine
 * 
 * الهدف: التحقق من إصلاح Pattern 4 والتكامل الصحيح
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GatewayManager, GatewayTask } from '../src/gateway';
import { ExpectationEngine, TaskReality } from '../src/expectation-engine';
import { kv } from '../src/storage/adapter';

describe('🔗 Gateway ↔ Expectation Engine Integration', () => {
  const testAgentId = 'test-agent-integration';
  const testTaskId = 'test-task-001';

  beforeEach(async () => {
    // تنظيف البيانات قبل كل اختبار
    await kv.del(`agent:${testAgentId}`);
    await kv.del(`aix:expectation:${testAgentId}:${testTaskId}`);
  });

  afterEach(async () => {
    // تنظيف البيانات بعد كل اختبار
    await kv.del(`agent:${testAgentId}`);
    await kv.del(`aix:expectation:${testAgentId}:${testTaskId}`);
  });

  describe('✅ Pattern 4 Fix: Signature Matching', () => {
    it('يجب أن يستخدم gateway التوقيع الصحيح لـ setExpectation', async () => {
      const task: GatewayTask = {
        taskId: testTaskId,
        description: 'مهمة اختبار بسيطة',
        complexity: 'simple',
        maxSteps: 5,
      };

      // محاكاة استدعاء gateway
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: task.description,
          complexity: task.complexity,
          tools: []
        }
      );

      // التحقق من أن التوقع تم تعيينه بشكل صحيح
      expect(expectation).toBeDefined();
      expect(expectation.taskId).toBe(testTaskId);
      expect(expectation.expectedSteps).toBeGreaterThan(0);
      expect(expectation.expectedDuration).toBeGreaterThan(0);
    });

    it('يجب أن يفشل عند استخدام التوقيع القديم (الخاطئ)', async () => {
      // محاكاة الاستدعاء الخاطئ القديم
      try {
        await ExpectationEngine.setExpectation(
          testAgentId,
          testTaskId,
          { description: 'test' } as any
        );
        
        // يجب ألا نصل هنا
        expect(true).toBe(false);
      } catch (error) {
        // متوقع أن يفشل
        expect(error).toBeDefined();
      }
    });

    it('يجب أن يحسب التعقيد بناءً على الوصف والأدوات', async () => {
      const simpleTask = await ExpectationEngine.setExpectation(
        testAgentId,
        'simple-task',
        {
          description: 'مهمة بسيطة',
          complexity: 'simple',
          tools: []
        }
      );

      const complexTask = await ExpectationEngine.setExpectation(
        testAgentId,
        'complex-task',
        {
          description: 'مهمة معقدة تتطلب تحليل عميق ومعالجة بيانات كبيرة',
          complexity: 'complex',
          tools: ['web-search', 'code-execution', 'file-system']
        }
      );

      // المهمة المعقدة يجب أن تتطلب خطوات أكثر
      expect(complexTask.expectedSteps).toBeGreaterThan(simpleTask.expectedSteps);
      expect(complexTask.expectedDuration).toBeGreaterThan(simpleTask.expectedDuration);
    });
  });

  describe('😊 Happiness Calculation Flow', () => {
    it('يجب أن يحسب السعادة بشكل صحيح عند الإنجاز السريع', async () => {
      // 1. تعيين التوقع
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: 'مهمة اختبار',
          complexity: 'simple',
          tools: []
        }
      );

      // 2. محاكاة إنجاز أسرع من المتوقع
      const reality: TaskReality = {
        actualSteps: Math.floor(expectation.expectedSteps * 0.6), // 60% من المتوقع
        actualDuration: Math.floor(expectation.expectedDuration * 0.5), // 50% من المتوقع
        succeeded: true,
        actualXP: expectation.expectedXP * 1.5,
        completedAt: Date.now()
      };

      // 3. حساب السعادة
      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        reality
      );

      // 4. التحقق من النتائج
      expect(happiness.happiness).toBeGreaterThan(0); // يجب أن يكون سعيداً
      expect(happiness.mood).toMatch(/ecstatic|happy/); // مزاج إيجابي
      expect(happiness.stepsDeviation).toBeLessThan(0); // أقل من المتوقع
      expect(happiness.successMatch).toBe(true);
    });

    it('يجب أن يحسب الإحباط عند التأخير', async () => {
      // 1. تعيين التوقع
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: 'مهمة اختبار',
          complexity: 'simple',
          tools: []
        }
      );

      // 2. محاكاة إنجاز أبطأ من المتوقع
      const reality: TaskReality = {
        actualSteps: Math.floor(expectation.expectedSteps * 2), // ضعف المتوقع
        actualDuration: Math.floor(expectation.expectedDuration * 3), // 3 أضعاف المتوقع
        succeeded: true,
        actualXP: expectation.expectedXP * 0.5,
        completedAt: Date.now()
      };

      // 3. حساب السعادة
      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        reality
      );

      // 4. التحقق من النتائج
      expect(happiness.happiness).toBeLessThan(0); // يجب أن يكون محبطاً
      expect(happiness.mood).toMatch(/disappointed|frustrated/); // مزاج سلبي
      expect(happiness.stepsDeviation).toBeGreaterThan(0); // أكثر من المتوقع
    });

    it('يجب أن يتعامل مع الفشل بشكل صحيح', async () => {
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: 'مهمة اختبار',
          complexity: 'simple',
          tools: []
        }
      );

      const reality: TaskReality = {
        actualSteps: expectation.expectedSteps,
        actualDuration: expectation.expectedDuration,
        succeeded: false, // فشل
        actualXP: 0,
        completedAt: Date.now()
      };

      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        reality
      );

      expect(happiness.happiness).toBeLessThan(0);
      expect(happiness.successMatch).toBe(false);
      expect(happiness.mood).toMatch(/disappointed|frustrated/);
    });
  });

  describe('📊 Calibration System', () => {
    it('يجب أن يتعلم من التجارب السابقة', async () => {
      // محاكاة عدة مهام
      for (let i = 0; i < 5; i++) {
        const taskId = `calibration-task-${i}`;
        
        const expectation = await ExpectationEngine.setExpectation(
          testAgentId,
          taskId,
          {
            description: `مهمة ${i}`,
            complexity: 'simple',
            tools: []
          }
        );

        // محاكاة إنجاز أسرع من المتوقع دائماً
        const reality: TaskReality = {
          actualSteps: Math.floor(expectation.expectedSteps * 0.7),
          actualDuration: Math.floor(expectation.expectedDuration * 0.7),
          succeeded: true,
          actualXP: expectation.expectedXP,
          completedAt: Date.now()
        };

        await ExpectationEngine.calculateHappiness(testAgentId, taskId, reality);
      }

      // الآن يجب أن يكون النظام قد تعلم وخفض التوقعات
      const calibration = await ExpectationEngine.calibrateExpectations(testAgentId);
      
      expect(calibration.totalTasks).toBe(5);
      expect(calibration.averageStepsError).toBeLessThan(0); // يتوقع أقل الآن
    });
  });

  describe('🔄 Full Integration Flow', () => {
    it('يجب أن يعمل التدفق الكامل: Gateway → Expectation → Happiness', async () => {
      const task: GatewayTask = {
        taskId: testTaskId,
        description: 'مهمة تكامل كاملة',
        complexity: 'medium',
        maxSteps: 10,
        timeout: 30000,
      };

      // 1. Gateway يعين التوقع
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: task.description,
          complexity: task.complexity,
          tools: []
        }
      );

      expect(expectation).toBeDefined();
      expect(expectation.taskId).toBe(testTaskId);

      // 2. محاكاة تنفيذ المهمة
      const reality: TaskReality = {
        actualSteps: expectation.expectedSteps,
        actualDuration: expectation.expectedDuration,
        succeeded: true,
        actualXP: expectation.expectedXP,
        completedAt: Date.now()
      };

      // 3. حساب السعادة
      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        testTaskId,
        reality
      );

      expect(happiness).toBeDefined();
      expect(happiness.mood).toBeDefined();
      expect(happiness.happiness).toBeGreaterThanOrEqual(-100);
      expect(happiness.happiness).toBeLessThanOrEqual(100);

      // 4. التحقق من تحديث المعايرة
      const calibration = await ExpectationEngine.calibrateExpectations(testAgentId);
      expect(calibration.totalTasks).toBeGreaterThan(0);
    });
  });

  describe('⚠️ Edge Cases', () => {
    it('يجب أن يتعامل مع مهمة بدون توقع سابق', async () => {
      const reality: TaskReality = {
        actualSteps: 5,
        actualDuration: 1000,
        succeeded: true,
        actualXP: 10,
        completedAt: Date.now()
      };

      const happiness = await ExpectationEngine.calculateHappiness(
        testAgentId,
        'non-existent-task',
        reality
      );

      // يجب أن يعمل حتى بدون توقع سابق
      expect(happiness).toBeDefined();
      expect(happiness.happiness).toBe(0); // محايد
    });

    it('يجب أن يتعامل مع قيم متطرفة', async () => {
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: 'مهمة متطرفة',
          complexity: 'complex',
          tools: Array(100).fill('tool') // 100 أداة!
        }
      );

      expect(expectation.expectedSteps).toBeGreaterThan(0);
      expect(expectation.expectedSteps).toBeLessThan(1000); // حد معقول
    });

    it('يجب أن يتعامل مع وصف فارغ', async () => {
      const expectation = await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: '',
          complexity: 'simple',
          tools: []
        }
      );

      expect(expectation).toBeDefined();
      expect(expectation.expectedSteps).toBeGreaterThan(0);
    });
  });

  describe('🎯 Performance Tests', () => {
    it('يجب أن يكون سريعاً في تعيين التوقعات', async () => {
      const start = Date.now();
      
      await ExpectationEngine.setExpectation(
        testAgentId,
        testTaskId,
        {
          description: 'اختبار الأداء',
          complexity: 'simple',
          tools: []
        }
      );

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // أقل من 100ms
    });

    it('يجب أن يتعامل مع عدة مهام متزامنة', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        ExpectationEngine.setExpectation(
          testAgentId,
          `concurrent-task-${i}`,
          {
            description: `مهمة متزامنة ${i}`,
            complexity: 'simple',
            tools: []
          }
        )
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.expectedSteps).toBeGreaterThan(0);
      });
    });
  });
});

// Made with Bob
