const fs = require('fs');
const path = require('path');

// Utility function to create a passage
function makePassage(id, title, category, difficulty, contentEn, contentCn, wordCount, questions) {
  const estimatedTime = wordCount <= 220 ? '7min' : wordCount <= 280 ? '8min' : wordCount <= 340 ? '10min' : '12min';
  return {
    id,
    title,
    category,
    difficulty,
    content_en: contentEn,
    content_cn: contentCn,
    word_count: wordCount,
    estimated_time: estimatedTime,
    questions: questions.map((q, i) => ({
      id: i + 1,
      question_text: q[0],
      option_a: q[1],
      option_b: q[2],
      option_c: q[3],
      option_d: q[4],
      correct_answer: q[5],
      explanation: q[6]
    }))
  };
}

const passages = [];

// We'll load passage data from separate module files
const dataDir = __dirname;

// Load all passage data files in order
const files = fs.readdirSync(dataDir).filter(f => f.startsWith('data-') && f.endsWith('.cjs')).sort();
for (const file of files) {
  const data = require(path.join(dataDir, file));
  for (const p of data) {
    passages.push(makePassage(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]));
  }
}

// Write output
const outputPath = path.resolve(__dirname, '../src/data/reading.json');
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const output = JSON.stringify(passages, null, 2);
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`Generated ${passages.length} passages to ${outputPath}`);

// Validate
try {
  const parsed = JSON.parse(output);
  console.log(`Validation: JSON is valid with ${parsed.length} entries`);
  const categories = {};
  for (const p of parsed) {
    categories[p.category] = (categories[p.category] || 0) + 1;
  }
  console.log('Categories:', JSON.stringify(categories, null, 2));
} catch (e) {
  console.error('JSON validation failed:', e.message);
}
