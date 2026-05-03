/**
 * Validation Engine Tests
 * Copyright © 2026 Mohamed Abdelaziz / AMRIKYY AI Solutions
 * Licensed under Apache-2.0 License - See LICENSE.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { register, validate, clear, getRules, unregister } from '../core/validation-engine.js';

describe('Validation Engine', () => {
  beforeEach(() => {
    clear();
  });

  describe('Rule Registration', () => {
    it('should register a rule', () => {
      register({
        name: 'test-rule',
        check: (data) => !!data.name
      });
      
      const rules = getRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('test-rule');
    });

    it('should throw error if rule missing name', () => {
      expect(() => {
        register({ check: () => true });
      }).toThrow('Rule must have name and check function');
    });

    it('should throw error if rule missing check function', () => {
      expect(() => {
        register({ name: 'test' });
      }).toThrow('Rule must have name and check function');
    });

    it('should set default priority to 50', () => {
      register({
        name: 'test',
        check: () => true
      });
      
      const rules = getRules();
      expect(rules[0].priority).toBe(50);
    });

    it('should respect custom priority', () => {
      register({
        name: 'test',
        priority: 10,
        check: () => true
      });
      
      const rules = getRules();
      expect(rules[0].priority).toBe(10);
    });

    it('should sort rules by priority', () => {
      register({ name: 'low', priority: 100, check: () => true });
      register({ name: 'high', priority: 10, check: () => true });
      register({ name: 'medium', priority: 50, check: () => true });
      
      const rules = getRules();
      expect(rules[0].name).toBe('high');
      expect(rules[1].name).toBe('medium');
      expect(rules[2].name).toBe('low');
    });
  });

  describe('Rule Unregistration', () => {
    it('should unregister a rule by name', () => {
      register({ name: 'test', check: () => true });
      expect(getRules()).toHaveLength(1);
      
      unregister('test');
      expect(getRules()).toHaveLength(0);
    });

    it('should not error when unregistering non-existent rule', () => {
      expect(() => unregister('non-existent')).not.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate data against registered rules', async () => {
      register({
        name: 'test',
        check: (data) => !!data.name,
        message: 'Name is required'
      });
      
      const errors = await validate({});
      expect(errors).toHaveLength(1);
      expect(errors[0].rule).toBe('test');
      expect(errors[0].message).toBe('Name is required');
    });

    it('should return no errors when validation passes', async () => {
      register({
        name: 'test',
        check: (data) => !!data.name
      });
      
      const errors = await validate({ name: 'test' });
      expect(errors).toHaveLength(0);
    });

    it('should execute rules in priority order', async () => {
      const order = [];
      
      register({
        name: 'low',
        priority: 20,
        check: () => { order.push('low'); return true; }
      });
      
      register({
        name: 'high',
        priority: 10,
        check: () => { order.push('high'); return true; }
      });
      
      await validate({});
      expect(order).toEqual(['high', 'low']);
    });

    it('should handle async rules', async () => {
      register({
        name: 'async',
        check: async (data) => {
          await new Promise(r => setTimeout(r, 10));
          return !!data.name;
        },
        message: 'Async validation failed'
      });
      
      const errors = await validate({});
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Async validation failed');
    });

    it('should catch and report rule errors', async () => {
      register({
        name: 'error',
        check: () => {
          throw new Error('test error');
        }
      });
      
      const errors = await validate({});
      expect(errors).toHaveLength(1);
      expect(errors[0].rule).toBe('error');
      expect(errors[0].error).toBe('test error');
      expect(errors[0].stack).toBeDefined();
    });

    it('should use default message when not provided', async () => {
      register({
        name: 'test-rule',
        check: () => false
      });
      
      const errors = await validate({});
      expect(errors[0].message).toBe('Validation failed: test-rule');
    });

    it('should validate multiple rules', async () => {
      register({
        name: 'rule1',
        check: (data) => !!data.field1,
        message: 'Field1 required'
      });
      
      register({
        name: 'rule2',
        check: (data) => !!data.field2,
        message: 'Field2 required'
      });
      
      const errors = await validate({});
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Field1 required');
      expect(errors[1].message).toBe('Field2 required');
    });
  });

  describe('Clear', () => {
    it('should clear all rules', () => {
      register({ name: 'test1', check: () => true });
      register({ name: 'test2', check: () => true });
      expect(getRules()).toHaveLength(2);
      
      clear();
      expect(getRules()).toHaveLength(0);
    });
  });

  describe('Get Rules', () => {
    it('should return copy of rules array', () => {
      register({ name: 'test', check: () => true });
      
      const rules1 = getRules();
      const rules2 = getRules();
      
      expect(rules1).not.toBe(rules2);
      expect(rules1).toEqual(rules2);
    });
  });
});

// Made with Moe Abdelaziz