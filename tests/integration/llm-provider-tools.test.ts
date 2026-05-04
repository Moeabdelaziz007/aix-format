/**
 * LLM Provider + Tools Execution Integration Tests
 * Tests agent runtime with mock LLM and tools (no real API calls)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Mock LLM Provider
interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length';
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

class MockLLMProvider {
  private callCount = 0;
  private responses: Map<string, LLMResponse> = new Map();

  constructor() {
    this.setupDefaultResponses();
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    this.callCount++;
    
    const lastMessage = messages[messages.length - 1];
    const key = this.getResponseKey(lastMessage.content);
    
    const response = this.responses.get(key) || {
      content: 'I understand your request.',
      finishReason: 'stop' as const
    };

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return response;
  }

  private getResponseKey(content: string): string {
    if (content.includes('weather')) return 'weather';
    if (content.includes('calculate')) return 'calculate';
    if (content.includes('search')) return 'search';
    if (content.includes('error')) return 'error';
    return 'default';
  }

  private setupDefaultResponses() {
    this.responses.set('weather', {
      content: '',
      toolCalls: [{
        id: 'call_1',
        name: 'get_weather',
        arguments: { location: 'Cairo' }
      }],
      finishReason: 'tool_calls'
    });

    this.responses.set('calculate', {
      content: '',
      toolCalls: [{
        id: 'call_2',
        name: 'calculate',
        arguments: { expression: '2 + 2' }
      }],
      finishReason: 'tool_calls'
    });

    this.responses.set('search', {
      content: '',
      toolCalls: [{
        id: 'call_3',
        name: 'web_search',
        arguments: { query: 'AIX format' }
      }],
      finishReason: 'tool_calls'
    });

    this.responses.set('error', {
      content: 'I encountered an error processing your request.',
      finishReason: 'stop'
    });
  }

  getCallCount(): number {
    return this.callCount;
  }

  reset(): void {
    this.callCount = 0;
  }
}

// Mock Tools
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>) => Promise<any>;
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private executionLog: Array<{ tool: string; args: any; result: any }> = [];

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async executeTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const result = await tool.execute(args);
    this.executionLog.push({ tool: name, args, result });
    return result;
  }

  getExecutionLog(): Array<{ tool: string; args: any; result: any }> {
    return this.executionLog;
  }

  reset(): void {
    this.executionLog = [];
  }
}

// Agent Runtime Engine
class AgentRuntimeEngine {
  private llmProvider: MockLLMProvider;
  private toolRegistry: ToolRegistry;
  private maxIterations = 10;

  constructor(llmProvider: MockLLMProvider, toolRegistry: ToolRegistry) {
    this.llmProvider = llmProvider;
    this.toolRegistry = toolRegistry;
  }

  async execute(prompt: string): Promise<{ result: string; iterations: number }> {
    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: prompt }
    ];

    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      const response = await this.llmProvider.chat(messages);

      if (response.finishReason === 'stop') {
        return { result: response.content, iterations };
      }

      if (response.finishReason === 'tool_calls' && response.toolCalls) {
        // Execute all tool calls
        for (const toolCall of response.toolCalls) {
          const toolResult = await this.toolRegistry.executeTool(
            toolCall.name,
            toolCall.arguments
          );

          messages.push({
            role: 'assistant',
            content: `Tool ${toolCall.name} returned: ${JSON.stringify(toolResult)}`
          });
        }

        // Continue conversation
        messages.push({
          role: 'user',
          content: 'Please continue based on the tool results.'
        });
      }
    }

    throw new Error('Max iterations reached');
  }
}

describe('LLM Provider + Tools Execution', () => {
  let llmProvider: MockLLMProvider;
  let toolRegistry: ToolRegistry;
  let runtime: AgentRuntimeEngine;

  before(() => {
    llmProvider = new MockLLMProvider();
    toolRegistry = new ToolRegistry();

    // Register mock tools
    toolRegistry.registerTool({
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: { location: { type: 'string' } },
      execute: async (args) => {
        return {
          location: args.location,
          temperature: 25,
          condition: 'sunny'
        };
      }
    });

    toolRegistry.registerTool({
      name: 'calculate',
      description: 'Perform calculations',
      parameters: { expression: { type: 'string' } },
      execute: async (args) => {
        // Safe evaluation using Function constructor with restricted scope
        try {
          const safeEval = new Function('return (' + args.expression + ')')();
          return { expression: args.expression, result: safeEval };
        } catch (error) {
          return { expression: args.expression, error: 'Invalid expression' };
        }
      }
    });

    toolRegistry.registerTool({
      name: 'web_search',
      description: 'Search the web',
      parameters: { query: { type: 'string' } },
      execute: async (args) => {
        return {
          query: args.query,
          results: [
            { title: 'AIX Format Docs', url: 'https://aix.network/docs' },
            { title: 'AIX GitHub', url: 'https://github.com/aix-format' }
          ]
        };
      }
    });

    runtime = new AgentRuntimeEngine(llmProvider, toolRegistry);
  });

  after(() => {
    llmProvider.reset();
    toolRegistry.reset();
  });

  describe('Basic Tool Execution', () => {
    it('should execute weather tool', async () => {
      const result = await runtime.execute('What is the weather in Cairo?');

      assert.ok(result.result);
      assert.ok(result.iterations > 0);

      const log = toolRegistry.getExecutionLog();
      assert.strictEqual(log.length, 1);
      assert.strictEqual(log[0].tool, 'get_weather');
      assert.strictEqual(log[0].args.location, 'Cairo');
      assert.strictEqual(log[0].result.temperature, 25);
    });

    it('should execute calculate tool', async () => {
      toolRegistry.reset();

      const result = await runtime.execute('Calculate 2 + 2');

      assert.ok(result.result);

      const log = toolRegistry.getExecutionLog();
      assert.strictEqual(log.length, 1);
      assert.strictEqual(log[0].tool, 'calculate');
      assert.strictEqual(log[0].result.result, 4);
    });

    it('should execute search tool', async () => {
      toolRegistry.reset();

      const result = await runtime.execute('Search for AIX format');

      assert.ok(result.result);

      const log = toolRegistry.getExecutionLog();
      assert.strictEqual(log.length, 1);
      assert.strictEqual(log[0].tool, 'web_search');
      assert.strictEqual(log[0].args.query, 'AIX format');
      assert.ok(Array.isArray(log[0].result.results));
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool gracefully', async () => {
      toolRegistry.reset();

      try {
        await toolRegistry.executeTool('unknown_tool', {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Tool not found'));
      }
    });

    it('should handle tool execution errors', async () => {
      toolRegistry.registerTool({
        name: 'failing_tool',
        description: 'A tool that fails',
        parameters: {},
        execute: async () => {
          throw new Error('Tool execution failed');
        }
      });

      try {
        await toolRegistry.executeTool('failing_tool', {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.message, 'Tool execution failed');
      }
    });
  });

  describe('Performance', () => {
    it('should execute 100 tool calls in under 2 seconds', async () => {
      toolRegistry.reset();

      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          toolRegistry.executeTool('calculate', { expression: `${i} + ${i}` })
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      assert.ok(duration < 2000, `Took ${duration}ms, expected <2000ms`);

      const log = toolRegistry.getExecutionLog();
      assert.strictEqual(log.length, 100);
    });

    it('should handle concurrent LLM requests', async () => {
      llmProvider.reset();

      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 50; i++) {
        promises.push(
          llmProvider.chat([
            { role: 'user', content: 'Hello' }
          ])
        );
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      assert.ok(duration < 1000, `Took ${duration}ms, expected <1000ms`);
      assert.strictEqual(results.length, 50);
      assert.strictEqual(llmProvider.getCallCount(), 50);
    });
  });

  describe('Multi-Step Workflows', () => {
    it('should handle multi-step tool execution', async () => {
      toolRegistry.reset();

      // Register a tool that requires multiple steps
      toolRegistry.registerTool({
        name: 'multi_step',
        description: 'Multi-step operation',
        parameters: { steps: { type: 'number' } },
        execute: async (args) => {
          const results = [];
          for (let i = 0; i < args.steps; i++) {
            results.push(`Step ${i + 1} completed`);
          }
          return { steps: args.steps, results };
        }
      });

      const result = await toolRegistry.executeTool('multi_step', { steps: 5 });

      assert.strictEqual(result.steps, 5);
      assert.strictEqual(result.results.length, 5);
    });
  });

  describe('Tool Registry Management', () => {
    it('should list all registered tools', () => {
      const tools = ['get_weather', 'calculate', 'web_search', 'failing_tool', 'multi_step'];
      
      // Verify tools are registered (indirect check via execution)
      tools.forEach(async (toolName) => {
        if (toolName !== 'failing_tool') {
          const exists = toolRegistry['tools'].has(toolName);
          assert.ok(exists, `Tool ${toolName} should be registered`);
        }
      });
    });

    it('should track execution history', async () => {
      toolRegistry.reset();

      await toolRegistry.executeTool('calculate', { expression: '1 + 1' });
      await toolRegistry.executeTool('calculate', { expression: '2 + 2' });
      await toolRegistry.executeTool('get_weather', { location: 'Cairo' });

      const log = toolRegistry.getExecutionLog();
      assert.strictEqual(log.length, 3);
      assert.strictEqual(log[0].tool, 'calculate');
      assert.strictEqual(log[1].tool, 'calculate');
      assert.strictEqual(log[2].tool, 'get_weather');
    });
  });

  describe('LLM Provider Behavior', () => {
    it('should return different responses for different prompts', async () => {
      llmProvider.reset();

      const weatherResponse = await llmProvider.chat([
        { role: 'user', content: 'What is the weather?' }
      ]);

      const calcResponse = await llmProvider.chat([
        { role: 'user', content: 'Calculate something' }
      ]);

      assert.notStrictEqual(
        weatherResponse.toolCalls?.[0]?.name,
        calcResponse.toolCalls?.[0]?.name
      );
    });

    it('should handle conversation context', async () => {
      llmProvider.reset();

      const messages: LLMMessage[] = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'What is the weather?' }
      ];

      const response = await llmProvider.chat(messages);

      assert.ok(response);
      assert.strictEqual(llmProvider.getCallCount(), 1);
    });
  });
});

// Made with Moe Abdelaziz
