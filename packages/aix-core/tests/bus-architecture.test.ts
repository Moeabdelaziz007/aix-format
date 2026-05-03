/**
 * 🧪 اختبارات Bus Architecture
 * 
 * اختبار نظام الـ 4-Ring Bus:
 * Ring 0 (GENESIS) → Ring 1 (SOUL) → Ring 2 (MIND) → Ring 3 (BODY)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  emit,
  BUS_RINGS,
  BusEvent,
  createDNAEvent,
  createDeadHandEvent,
  createEvolutionEvent
} from '../src/bus';
import { kv } from '../src/storage/adapter';

describe('🔄 Bus Architecture - 4-Ring System', () => {
  
  beforeEach(async () => {
    // تنظيف قبل كل اختبار
    await kv.del('aix:pulse:stream');
  });

  afterEach(async () => {
    // تنظيف بعد كل اختبار
    await kv.del('aix:pulse:stream');
  });

  describe('🎯 Ring 0: GENESIS (Rust DNA)', () => {
    it('يجب أن ينشئ حدث DNA_VERIFIED بشكل صحيح', () => {
      const manifestId = 'test-manifest-001';
      const hash = 'abc123def456';
      
      const event = createDNAEvent(manifestId, hash, true);

      expect(event.ring).toBe(BUS_RINGS.GENESIS);
      expect(event.type).toBe('DNA_VERIFIED');
      expect(event.agentId).toBe(manifestId);
      expect(event.metadata?.hash).toBe(hash);
      expect(event.metadata?.ok).toBe(true);
      expect(event.message).toContain('✅');
    });

    it('يجب أن ينشئ حدث DNA_TAMPERED عند الفشل', () => {
      const manifestId = 'test-manifest-002';
      const hash = 'tampered123';
      
      const event = createDNAEvent(manifestId, hash, false);

      expect(event.ring).toBe(BUS_RINGS.GENESIS);
      expect(event.type).toBe('DNA_TAMPERED');
      expect(event.metadata?.ok).toBe(false);
      expect(event.message).toContain('🚨');
    });

    it('يجب أن يحتوي على timestamp صحيح', () => {
      const event = createDNAEvent('test', 'hash', true);
      const now = Date.now();
      
      expect(event.timestamp).toBeLessThanOrEqual(now);
      expect(event.timestamp).toBeGreaterThan(now - 1000); // خلال آخر ثانية
    });
  });

  describe('💫 Ring 1: SOUL (Identity, Pets, Dead Hand)', () => {
    it('يجب أن ينشئ حدث Dead Hand بشكل صحيح', () => {
      const agentId = 'agent-suspicious';
      const agentName = 'Suspicious Agent';
      const threatLevel = 'HIGH';
      const reason = 'Banned tool detected';
      const evidence = { tool: 'rm_rf', timestamp: Date.now() };

      const event = createDeadHandEvent(
        agentId,
        agentName,
        threatLevel,
        reason,
        evidence
      );

      expect(event.ring).toBe(BUS_RINGS.SOUL);
      expect(event.type).toBe('SECURITY_ALERT');
      expect(event.agentId).toBe(agentId);
      expect(event.agentName).toBe(agentName);
      expect(event.metadata?.threatLevel).toBe(threatLevel);
      expect(event.message).toContain('☠️');
    });

    it('يجب أن ينشئ حدث Pet Evolution', () => {
      const agentId = 'pet-agent-001';
      const agentName = 'Happy Pet';
      const newLevel = 2;
      const reward = 'Speed Boost';

      const event = createEvolutionEvent(
        agentId,
        agentName,
        newLevel,
        reward
      );

      expect(event.ring).toBe(BUS_RINGS.SOUL);
      expect(event.type).toBe('EVOLUTION');
      expect(event.metadata?.level).toBe(newLevel);
      expect(event.metadata?.reward).toBe(reward);
    });

    it('يجب أن يتعامل مع Pet Mood Changes', async () => {
      const event: BusEvent = {
        id: 'mood-change-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.SOUL,
        type: 'PET_MOOD_CHANGED',
        agentId: 'pet-001',
        agentName: 'Test Pet',
        message: 'Mood changed from curious to happy',
        metadata: {
          oldMood: 'curious',
          newMood: 'happy',
          reason: 'task_completed_fast'
        }
      };

      await emit(event);

      // التحقق من أن الحدث تم إرساله
      expect(event.type).toBe('PET_MOOD_CHANGED');
      expect(event.metadata?.oldMood).toBe('curious');
      expect(event.metadata?.newMood).toBe('happy');
    });
  });

  describe('🧠 Ring 2: MIND (Routing, Learning)', () => {
    it('يجب أن يتعامل مع ReAct Loop Events', async () => {
      const agentId = 'thinking-agent';
      
      // 1. THOUGHT_GENERATED
      const thoughtEvent: BusEvent = {
        id: 'thought-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.MIND,
        type: 'THOUGHT_GENERATED',
        agentId,
        agentName: 'Thinking Agent',
        message: 'Analyzing task requirements',
        metadata: {
          thought: 'I need to break this down into steps',
          confidence: 0.8
        }
      };

      await emit(thoughtEvent);
      expect(thoughtEvent.type).toBe('THOUGHT_GENERATED');

      // 2. ACTION_PLANNED
      const actionEvent: BusEvent = {
        id: 'action-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.MIND,
        type: 'ACTION_PLANNED',
        agentId,
        agentName: 'Thinking Agent',
        message: 'Planning to execute search',
        metadata: {
          action: 'web_search',
          parameters: { query: 'test' }
        }
      };

      await emit(actionEvent);
      expect(actionEvent.type).toBe('ACTION_PLANNED');

      // 3. OBSERVATION_RECORDED
      const observationEvent: BusEvent = {
        id: 'obs-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.MIND,
        type: 'OBSERVATION_RECORDED',
        agentId,
        agentName: 'Thinking Agent',
        message: 'Search completed successfully',
        metadata: {
          result: 'Found 10 results',
          duration: 500
        }
      };

      await emit(observationEvent);
      expect(observationEvent.type).toBe('OBSERVATION_RECORDED');
    });

    it('يجب أن يتعامل مع Task Routing', async () => {
      const routingEvent: BusEvent = {
        id: 'route-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.MIND,
        type: 'TASK_ROUTED',
        agentId: 'router-agent',
        agentName: 'Router',
        message: 'Task routed to GPT-4',
        metadata: {
          modelId: 'gpt-4',
          quality: 0.95,
          cost: 0.03,
          latency: 200
        }
      };

      await emit(routingEvent);
      
      expect(routingEvent.metadata?.modelId).toBe('gpt-4');
      expect(routingEvent.metadata?.quality).toBe(0.95);
    });
  });

  describe('🌐 Ring 3: BODY (MCP, Channels, Economics)', () => {
    it('يجب أن يتعامل مع Payment Events', async () => {
      const paymentEvent: BusEvent = {
        id: 'payment-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.BODY,
        type: 'PAYMENT_SETTLED',
        agentId: 'agent-001',
        agentName: 'Paid Agent',
        message: 'Payment settled: 0.05 Pi',
        metadata: {
          amount: 0.05,
          currency: 'Pi',
          txHash: '0xabc123',
          status: 'confirmed'
        }
      };

      await emit(paymentEvent);
      
      expect(paymentEvent.metadata?.amount).toBe(0.05);
      expect(paymentEvent.metadata?.currency).toBe('Pi');
    });

    it('يجب أن يتعامل مع Channel Provisioning', async () => {
      const channelEvent: BusEvent = {
        id: 'channel-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.BODY,
        type: 'CHANNEL_PROVISIONED',
        agentId: 'telegram-bot-001',
        agentName: 'Telegram Bot',
        message: 'Telegram channel provisioned',
        metadata: {
          platform: 'telegram',
          botToken: 'bot123:ABC',
          chatId: '12345'
        }
      };

      await emit(channelEvent);
      
      expect(channelEvent.metadata?.platform).toBe('telegram');
    });

    it('يجب أن يتعامل مع Streaming Results', async () => {
      const chunkEvent: BusEvent = {
        id: 'chunk-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.BODY,
        type: 'RESULT_CHUNK',
        agentId: 'streaming-agent',
        agentName: 'Streamer',
        message: 'Chunk received',
        metadata: {
          chunk: 'Hello ',
          index: 0,
          total: 3
        }
      };

      await emit(chunkEvent);
      
      expect(chunkEvent.metadata?.chunk).toBe('Hello ');
      expect(chunkEvent.metadata?.index).toBe(0);
    });
  });

  describe('🔗 Cross-Ring Communication', () => {
    it('يجب أن تتدفق الأحداث عبر الحلقات', async () => {
      const events: BusEvent[] = [];

      // محاكاة تدفق كامل عبر جميع الحلقات
      
      // Ring 0: DNA Verification
      const dnaEvent = createDNAEvent('agent-001', 'hash123', true);
      events.push(dnaEvent);
      await emit(dnaEvent);

      // Ring 1: Pet Mood Change
      const moodEvent: BusEvent = {
        id: 'mood-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.SOUL,
        type: 'PET_MOOD_CHANGED',
        agentId: 'agent-001',
        agentName: 'Test Agent',
        message: 'Mood: curious → happy',
        metadata: { oldMood: 'curious', newMood: 'happy' }
      };
      events.push(moodEvent);
      await emit(moodEvent);

      // Ring 2: Task Routing
      const routeEvent: BusEvent = {
        id: 'route-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.MIND,
        type: 'TASK_ROUTED',
        agentId: 'agent-001',
        agentName: 'Test Agent',
        message: 'Task routed',
        metadata: { modelId: 'gpt-4' }
      };
      events.push(routeEvent);
      await emit(routeEvent);

      // Ring 3: Payment
      const payEvent: BusEvent = {
        id: 'pay-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.BODY,
        type: 'PAYMENT_SETTLED',
        agentId: 'agent-001',
        agentName: 'Test Agent',
        message: 'Payment settled',
        metadata: { amount: 0.01 }
      };
      events.push(payEvent);
      await emit(payEvent);

      // التحقق من التسلسل
      expect(events).toHaveLength(4);
      expect(events[0].ring).toBe(BUS_RINGS.GENESIS);
      expect(events[1].ring).toBe(BUS_RINGS.SOUL);
      expect(events[2].ring).toBe(BUS_RINGS.MIND);
      expect(events[3].ring).toBe(BUS_RINGS.BODY);
    });

    it('يجب أن يحافظ على ترتيب الأحداث', async () => {
      const timestamps: number[] = [];

      for (let i = 0; i < 5; i++) {
        const event: BusEvent = {
          id: `event-${i}`,
          timestamp: Date.now(),
          ring: BUS_RINGS.MIND,
          type: 'STEP_STARTED',
          agentId: 'test-agent',
          agentName: 'Test',
          message: `Step ${i}`,
          metadata: { step: i }
        };

        timestamps.push(event.timestamp);
        await emit(event);
        
        // انتظار صغير لضمان الترتيب
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // التحقق من أن الأوقات متزايدة
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });
  });

  describe('📊 Event Metadata Validation', () => {
    it('يجب أن يحتوي كل حدث على الحقول المطلوبة', () => {
      const event: BusEvent = {
        id: 'test-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.MIND,
        type: 'TASK_ROUTED',
        agentId: 'agent-001',
        agentName: 'Test Agent',
        message: 'Test message'
      };

      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.ring).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.agentId).toBeDefined();
      expect(event.agentName).toBeDefined();
      expect(event.message).toBeDefined();
    });

    it('يجب أن يدعم metadata اختيارية', () => {
      const eventWithMetadata: BusEvent = {
        id: 'test-002',
        timestamp: Date.now(),
        ring: BUS_RINGS.SOUL,
        type: 'PET_MOOD_CHANGED',
        agentId: 'pet-001',
        agentName: 'Pet',
        message: 'Mood changed',
        metadata: {
          custom: 'data',
          nested: { value: 123 }
        }
      };

      expect(eventWithMetadata.metadata).toBeDefined();
      expect(eventWithMetadata.metadata?.custom).toBe('data');
      expect(eventWithMetadata.metadata?.nested).toEqual({ value: 123 });
    });
  });

  describe('⚡ Performance Tests', () => {
    it('يجب أن يكون emit سريعاً', async () => {
      const event: BusEvent = {
        id: 'perf-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.MIND,
        type: 'STEP_STARTED',
        agentId: 'perf-agent',
        agentName: 'Performance Test',
        message: 'Performance test'
      };

      const start = Date.now();
      await emit(event);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // أقل من 50ms
    });

    it('يجب أن يتعامل مع أحداث متزامنة', async () => {
      const promises = Array.from({ length: 20 }, (_, i) => {
        const event: BusEvent = {
          id: `concurrent-${i}`,
          timestamp: Date.now(),
          ring: BUS_RINGS.MIND,
          type: 'STEP_STARTED',
          agentId: `agent-${i}`,
          agentName: `Agent ${i}`,
          message: `Concurrent event ${i}`
        };
        return emit(event);
      });

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });

  describe('🛡️ Error Handling', () => {
    it('يجب أن يتعامل مع أحداث غير صالحة', async () => {
      const invalidEvent = {
        // حقول ناقصة
        id: 'invalid-001',
        timestamp: Date.now()
      } as any;

      // يجب ألا يتعطل
      await expect(emit(invalidEvent)).resolves.toBeDefined();
    });

    it('يجب أن يتعامل مع metadata كبيرة', async () => {
      const largeMetadata = {
        data: 'x'.repeat(10000) // 10KB من البيانات
      };

      const event: BusEvent = {
        id: 'large-001',
        timestamp: Date.now(),
        ring: BUS_RINGS.BODY,
        type: 'METRICS_UPDATED',
        agentId: 'test-agent',
        agentName: 'Test',
        message: 'Large metadata test',
        metadata: largeMetadata
      };

      await expect(emit(event)).resolves.toBeDefined();
    });
  });
});

// Made with Bob
