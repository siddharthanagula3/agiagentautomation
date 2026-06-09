import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Joi from 'joi';

// Define Joi schema for validating employee YAML frontmatter
const employeeSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    'any.required': 'Employee name is required',
    'string.empty': 'Employee name cannot be empty',
  }),
  description: Joi.string().min(1).required().messages({
    'any.required': 'Employee description is required',
    'string.empty': 'Employee description cannot be empty',
  }),
  tools: Joi.alternatives()
    .try(
      Joi.string().min(1),
      Joi.array().items(Joi.string().min(1)).min(1)
    )
    .required()
    .messages({
      'any.required': 'At least one tool must be specified',
    }),
  model: Joi.string().default('inherit'),
  avatar: Joi.string().optional().allow(''),
  price: Joi.number().min(0).optional(),
  expertise: Joi.array().items(Joi.string()).optional(),
  role: Joi.string().optional().allow(''),
}).unknown(true);

const employeesDir = path.resolve('.agi/employees');

function validateEmployees() {
  console.log(`[Joi Validation] Scanning directory: ${employeesDir}`);

  if (!fs.existsSync(employeesDir)) {
    console.error(`Error: Directory not found: ${employeesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(employeesDir).filter(file => file.endsWith('.md'));
  console.log(`[Joi Validation] Found ${files.length} employee markdown files.`);

  let invalidCount = 0;

  for (const file of files) {
    const filePath = path.join(employeesDir, file);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      const { error, value } = employeeSchema.validate(data, {
        abortEarly: false,
        stripUnknown: false,
      });

      if (error) {
        invalidCount++;
        console.error(`\n[INVALID] ${file}:`);
        for (const detail of error.details) {
          console.error(`  - ${detail.message} (path: ${detail.path.join('.')})`);
        }
      } else {
        // Validate that body is not empty
        if (!content || content.trim().length === 0) {
          invalidCount++;
          console.error(`\n[INVALID] ${file}:`);
          console.error('  - Employee system prompt body is empty');
        }
      }
    } catch (err) {
      invalidCount++;
      console.error(`\n[ERROR] Failed to process ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('\n--- Validation Summary ---');
  if (invalidCount > 0) {
    console.error(`[Joi Validation] FAILED: ${invalidCount} files had validation errors.`);
    process.exit(1);
  } else {
    console.log(`[Joi Validation] PASSED: All ${files.length} employee markdown files are valid.`);
  }
}

validateEmployees();
