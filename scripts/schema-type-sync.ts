#!/usr/bin/env node
/**
 * Schema-Type Sync — نظام الكشف التلقائي عن انحراف Schema
 * 
 * المشكلة: TypeScript types تنحرف بصمت عن JSON schemas مع مرور الوقت،
 * مما يسبب فشل التحقق في وقت التشغيل لا يمكن للتحليل الثابت اكتشافه.
 * 
 * الحل: نظام تحقق ثنائي الاتجاه يقارن بين:
 * 1. schemas/aix.schema.json (مصدر الحقيقة)
 * 2. packages/aix-types/index.d.ts (الأنواع المكتوبة يدوياً)
 * 
 * يفشل البناء مع تقارير مفصلة عن الاختلافات الدقيقة.
 * 
 * @author Mohamed Abdelaziz - AMRIKYY AI Solutions
 * @license Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import Ajv from 'ajv';

// ═══════════════════════════════════════════════════════════════════════════
// التكوين
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  schemaPath: 'schemas/aix.schema.json',
  typesPath: 'packages/aix-types/index.d.ts',
  generatedDir: '.generated',
  configPath: 'schema-sync.config.json',
  exitOnDrift: true,
};

interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  nested?: Record<string, FieldDefinition>;
  description?: string;
  location: string;
}

interface DriftReport {
  missingInTypes: FieldDefinition[];
  missingInSchema: FieldDefinition[];
  typeMismatches: Array<{
    field: string;
    schemaType: string;
    tsType: string;
    location: string;
  }>;
  hasDrift: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// استخراج الحقول من JSON Schema
// ═══════════════════════════════════════════════════════════════════════════

function extractFieldsFromSchema(
  schema: any,
  prefix: string = '',
  required: string[] = []
): Record<string, FieldDefinition> {
  const fields: Record<string, FieldDefinition> = {};

  if (!schema.properties) return fields;

  for (const [fieldName, fieldSchema] of Object.entries<any>(schema.properties)) {
    const fullName = prefix ? `${prefix}.${fieldName}` : fieldName;
    const isRequired = required.includes(fieldName);

    let fieldType = 'unknown';
    if (fieldSchema.type) {
      fieldType = Array.isArray(fieldSchema.type) 
        ? fieldSchema.type.join(' | ') 
        : fieldSchema.type;
    } else if (fieldSchema.enum) {
      fieldType = fieldSchema.enum.map((v: any) => `"${v}"`).join(' | ');
    } else if (fieldSchema.$ref) {
      fieldType = fieldSchema.$ref.split('/').pop() || 'ref';
    }

    fields[fullName] = {
      name: fullName,
      type: fieldType,
      required: isRequired,
      description: fieldSchema.description,
      location: `schema:${fullName}`,
    };

    // استخراج الحقول المتداخلة
    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      const nestedFields = extractFieldsFromSchema(
        fieldSchema,
        fullName,
        fieldSchema.required || []
      );
      fields[fullName].nested = nestedFields;
      Object.assign(fields, nestedFields);
    }
  }

  return fields;
}

// ═══════════════════════════════════════════════════════════════════════════
// استخراج الحقول من TypeScript باستخدام AST
// ═══════════════════════════════════════════════════════════════════════════

function extractFieldsFromTypeScript(
  sourceFile: ts.SourceFile
): Record<string, FieldDefinition> {
  const fields: Record<string, FieldDefinition> = {};

  function visit(node: ts.Node, interfaceName: string = '') {
    if (ts.isInterfaceDeclaration(node)) {
      const name = node.name.text;
      
      node.members.forEach((member) => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText(sourceFile);
          const fullName = interfaceName ? `${interfaceName}.${propName}` : propName;
          const isOptional = member.questionToken !== undefined;
          
          let propType = 'unknown';
          if (member.type) {
            propType = member.type.getText(sourceFile);
          }

          fields[fullName] = {
            name: fullName,
            type: propType,
            required: !isOptional,
            location: `types:${name}.${propName}:${member.getStart(sourceFile)}`,
          };
        }
      });
    }

    ts.forEachChild(node, (child) => visit(child, interfaceName));
  }

  visit(sourceFile);
  return fields;
}

// ═══════════════════════════════════════════════════════════════════════════
// مقارنة الحقول واكتشاف الانحراف
// ═══════════════════════════════════════════════════════════════════════════

function compareFields(
  schemaFields: Record<string, FieldDefinition>,
  tsFields: Record<string, FieldDefinition>
): DriftReport {
  const report: DriftReport = {
    missingInTypes: [],
    missingInSchema: [],
    typeMismatches: [],
    hasDrift: false,
  };

  // الحقول المفقودة في TypeScript
  for (const [fieldName, fieldDef] of Object.entries(schemaFields)) {
    if (!tsFields[fieldName]) {
      report.missingInTypes.push(fieldDef);
      report.hasDrift = true;
    }
  }

  // الحقول المفقودة في Schema
  for (const [fieldName, fieldDef] of Object.entries(tsFields)) {
    if (!schemaFields[fieldName]) {
      report.missingInSchema.push(fieldDef);
      report.hasDrift = true;
    }
  }

  // عدم تطابق الأنواع
  for (const [fieldName, schemaDef] of Object.entries(schemaFields)) {
    const tsDef = tsFields[fieldName];
    if (tsDef && !typesMatch(schemaDef.type, tsDef.type)) {
      report.typeMismatches.push({
        field: fieldName,
        schemaType: schemaDef.type,
        tsType: tsDef.type,
        location: tsDef.location,
      });
      report.hasDrift = true;
    }
  }

  return report;
}

function typesMatch(schemaType: string, tsType: string): boolean {
  // تطبيع الأنواع للمقارنة
  const normalize = (type: string) => 
    type.replace(/\s+/g, '').toLowerCase();
  
  const normalizedSchema = normalize(schemaType);
  const normalizedTs = normalize(tsType);

  // تعيينات الأنواع الشائعة
  const typeMap: Record<string, string[]> = {
    'string': ['string'],
    'number': ['number'],
    'boolean': ['boolean'],
    'object': ['object', 'record<string,any>'],
    'array': ['array', 'any[]'],
  };

  for (const [schemaT, tsTypes] of Object.entries(typeMap)) {
    if (normalizedSchema.includes(schemaT)) {
      return tsTypes.some(t => normalizedTs.includes(t));
    }
  }

  return normalizedSchema === normalizedTs;
}

// ═══════════════════════════════════════════════════════════════════════════
// إنشاء تقرير الانحراف
// ═══════════════════════════════════════════════════════════════════════════

function generateDriftReport(report: DriftReport): string {
  let output = '\n';
  output += '═══════════════════════════════════════════════════════════════\n';
  output += '🚨 تقرير انحراف Schema-Type Drift Report\n';
  output += '═══════════════════════════════════════════════════════════════\n\n';

  if (!report.hasDrift) {
    output += '✅ لا يوجد انحراف - Schema و Types متزامنان تماماً\n';
    output += '✅ No drift detected - Schema and Types are perfectly synchronized\n\n';
    return output;
  }

  if (report.missingInTypes.length > 0) {
    output += '❌ حقول مفقودة في TypeScript (موجودة في Schema):\n';
    output += '❌ Fields missing in TypeScript (present in Schema):\n\n';
    report.missingInTypes.forEach((field) => {
      output += `   • ${field.name}\n`;
      output += `     النوع / Type: ${field.type}\n`;
      output += `     مطلوب / Required: ${field.required}\n`;
      output += `     الموقع / Location: ${field.location}\n\n`;
    });
  }

  if (report.missingInSchema.length > 0) {
    output += '❌ حقول مفقودة في Schema (موجودة في TypeScript):\n';
    output += '❌ Fields missing in Schema (present in TypeScript):\n\n';
    report.missingInSchema.forEach((field) => {
      output += `   • ${field.name}\n`;
      output += `     النوع / Type: ${field.type}\n`;
      output += `     الموقع / Location: ${field.location}\n\n`;
    });
  }

  if (report.typeMismatches.length > 0) {
    output += '❌ عدم تطابق الأنواع:\n';
    output += '❌ Type mismatches:\n\n';
    report.typeMismatches.forEach((mismatch) => {
      output += `   • ${mismatch.field}\n`;
      output += `     Schema: ${mismatch.schemaType}\n`;
      output += `     TypeScript: ${mismatch.tsType}\n`;
      output += `     الموقع / Location: ${mismatch.location}\n\n`;
    });
  }

  output += '═══════════════════════════════════════════════════════════════\n';
  output += '🔧 كيفية الإصلاح / HOW TO FIX:\n';
  output += '═══════════════════════════════════════════════════════════════\n\n';
  output += '1. قم بتحرير schemas/aix.schema.json بالتغييرات المطلوبة\n';
  output += '   Edit schemas/aix.schema.json with your intended changes\n\n';
  output += '2. قم بتحديث packages/aix-types/index.d.ts يدوياً لتطابق Schema\n';
  output += '   Update packages/aix-types/index.d.ts manually to match Schema\n\n';
  output += '3. قم بتشغيل: npm run schema:sync:check\n';
  output += '   Run: npm run schema:sync:check\n\n';
  output += '4. قم بعمل commit للملفين معاً\n';
  output += '   Commit both files together\n\n';

  return output;
}

// ═══════════════════════════════════════════════════════════════════════════
// الوظيفة الرئيسية
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🔍 بدء فحص انحراف Schema-Type...');
  console.log('🔍 Starting Schema-Type drift detection...\n');

  // قراءة Schema
  const schemaPath = path.resolve(CONFIG.schemaPath);
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);

  // قراءة TypeScript
  const typesPath = path.resolve(CONFIG.typesPath);
  if (!fs.existsSync(typesPath)) {
    console.error(`❌ Types file not found: ${typesPath}`);
    process.exit(1);
  }

  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    typesPath,
    typesContent,
    ts.ScriptTarget.Latest,
    true
  );

  // استخراج الحقول
  console.log('📊 استخراج الحقول من Schema...');
  console.log('📊 Extracting fields from Schema...');
  const schemaFields = extractFieldsFromSchema(schema, '', schema.required || []);
  console.log(`   ✓ تم العثور على ${Object.keys(schemaFields).length} حقل`);
  console.log(`   ✓ Found ${Object.keys(schemaFields).length} fields\n`);

  console.log('📊 استخراج الحقول من TypeScript...');
  console.log('📊 Extracting fields from TypeScript...');
  const tsFields = extractFieldsFromTypeScript(sourceFile);
  console.log(`   ✓ تم العثور على ${Object.keys(tsFields).length} حقل`);
  console.log(`   ✓ Found ${Object.keys(tsFields).length} fields\n`);

  // المقارنة
  console.log('🔄 مقارنة الحقول...');
  console.log('🔄 Comparing fields...\n');
  const report = compareFields(schemaFields, tsFields);

  // إنشاء التقرير
  const reportText = generateDriftReport(report);
  console.log(reportText);

  // حفظ التقرير
  const generatedDir = path.resolve(CONFIG.generatedDir);
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const reportPath = path.join(generatedDir, 'schema-drift-report.txt');
  fs.writeFileSync(reportPath, reportText);
  console.log(`📄 تم حفظ التقرير في: ${reportPath}`);
  console.log(`📄 Report saved to: ${reportPath}\n`);

  // الخروج بناءً على النتيجة
  if (report.hasDrift && CONFIG.exitOnDrift) {
    console.error('❌ فشل: تم اكتشاف انحراف Schema-Type');
    console.error('❌ FAILED: Schema-Type drift detected\n');
    process.exit(1);
  }

  console.log('✅ نجح: لا يوجد انحراف');
  console.log('✅ SUCCESS: No drift detected\n');
  process.exit(0);
}

// تشغيل
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ خطأ غير متوقع:', error);
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { extractFieldsFromSchema, extractFieldsFromTypeScript, compareFields };

// Made with Moe Abdelaziz
