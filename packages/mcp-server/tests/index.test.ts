import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

// Mock dependencies
vi.mock("fs/promises");
vi.mock("../../../core/abom-scanner.js", () => ({
  scanAgent: vi.fn().mockReturnValue({ score: 100 })
}));

describe('MCP Server Tools', () => {
  let requestHandler: any;
  let listToolsHandler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const mockSetRequestHandler = vi.fn((schema, handler) => {
      if (schema === CallToolRequestSchema) {
        requestHandler = handler;
      } else if (schema === ListToolsRequestSchema) {
        listToolsHandler = handler;
      }
    });

    vi.spyOn(Server.prototype, 'setRequestHandler').mockImplementation(mockSetRequestHandler);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../src/index.js');
  });

  describe('list_tools', () => {
    it('should list all available tools', async () => {
      const response = await listToolsHandler();
      expect(response.tools).toHaveLength(5);
      expect(response.tools.map((t: any) => t.name)).toContain('get_blackbox_logs');
    });
  });

  describe('get_blackbox_logs', () => {
    it('should return error on invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('{ "invalid": "json" ');
      const response = await requestHandler({
        params: { name: "get_blackbox_logs", arguments: { manifestPath: "dummy.json" } }
      });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid format:');
    });

    it('should return error on invalid YAML', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid: yaml: :\n');
      const response = await requestHandler({
        params: { name: "get_blackbox_logs", arguments: { manifestPath: "dummy.yaml" } }
      });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid format:');
    });

    it('should successfully parse valid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        meta: { id: "test-id", name: "Test Agent" },
        black_box: { traces: [{ id: 1 }] }
      }));
      const response = await requestHandler({
        params: { name: "get_blackbox_logs", arguments: { manifestPath: "valid.json" } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('"agent_id": "test-id"');
    });

    it('should successfully parse valid YAML', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('meta:\n  id: yaml-id\n  name: YAML Agent\nblack_box:\n  traces: []');
      const response = await requestHandler({
        params: { name: "get_blackbox_logs", arguments: { manifestPath: "valid.yaml" } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('"agent_id": "yaml-id"');
    });

    it('should handle manifest without traces', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ meta: { id: 'no-logs' } }));
      const response = await requestHandler({
        params: { name: 'get_blackbox_logs', arguments: { manifestPath: 'no-logs.json' } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('"total_logs": 0');
    });

    it('should handle missing file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      const response = await requestHandler({
        params: { name: "get_blackbox_logs", arguments: { manifestPath: "missing.json" } }
      });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Error: File not found');
    });
  });

  describe('verify_abom_compliance', () => {
    it('should return compliance status for valid manifest', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        abom: { version: "1.0" },
        black_box: { traces: [{ signature: "sig1" }] }
      }));
      const response = await requestHandler({
        params: { name: "verify_abom_compliance", arguments: { manifestPath: "valid.json" } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('"compliant": true');
    });

    it('should successfully parse valid YAML manifest', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('abom:\n  version: "1.0"\nblack_box:\n  traces: []');
      const response = await requestHandler({
        params: { name: 'verify_abom_compliance', arguments: { manifestPath: 'valid.yaml' } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('"compliant": false');
    });

    it('should handle manifest without abom or traces', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ meta: { id: 'no-abom' } }));
      const response = await requestHandler({
        params: { name: 'verify_abom_compliance', arguments: { manifestPath: 'no-abom.json' } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('"compliant": false');
      expect(response.content[0].text).toContain('"has_abom": false');
    });

    it('should return error on invalid format', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('{{{');
      const response = await requestHandler({
        params: { name: "verify_abom_compliance", arguments: { manifestPath: "invalid.json" } }
      });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid format:');
    });
  });

  describe('discover_agents', () => {
    it('should return mock agents', async () => {
      const response = await requestHandler({
        params: { name: "discover_agents", arguments: {} }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('Research Analyst');
    });
  });

  describe('validate_aix', () => {
    it('should return success for valid content', async () => {
      const response = await requestHandler({
        params: { name: "validate_aix", arguments: { content: '{"id": "test"}' } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toBe('Manifest is valid AIX format.');
    });

    it('should return error for invalid format', async () => {
      const response = await requestHandler({
        params: { name: "validate_aix", arguments: { content: 'invalid: yaml: :' } }
      });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid format:');
    });

    it('should return error for missing content', async () => {
      const response = await requestHandler({
        params: { name: "validate_aix", arguments: {} }
      });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Error: Missing content');
    });
  });

  describe('scan_agent', () => {
    it('should return scan report for valid content', async () => {
      const response = await requestHandler({
        params: { name: "scan_agent", arguments: { content: '{"id": "test"}' } }
      });
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('"score": 100');
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent tool', async () => {
      const response = await requestHandler({
        params: { name: "unknown_tool", arguments: {} }
      });
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Tool not found: unknown_tool');
    });
  });
});
