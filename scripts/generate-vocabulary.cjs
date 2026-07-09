const fs = require('fs');
const path = require('path');

// ============================================================
// CET-4 Vocabulary Generator - Generates 4900+ words
// ============================================================

function generateExample(word, category, meaning) {
  const cnMeaning = meaning.replace(/^[a-z]+\.\s*/, '').replace(/[；;].*$/, '').trim();
  const templates = {
    '动词': [
      { en: `They decided to ${word} the project.`, cn: `他们决定${cnMeaning}这个项目。` },
      { en: `She ${word}s every day to improve herself.`, cn: `她每天都${cnMeaning}来提升自己。` },
      { en: `We need to ${word} this issue carefully.`, cn: `我们需要仔细${cnMeaning}这个问题。` },
      { en: `He tried to ${word} the situation.`, cn: `他试图${cnMeaning}这个情况。` },
      { en: `The students must ${word} the task on time.`, cn: `学生们必须按时${cnMeaning}这个任务。` },
    ],
    '名词': [
      { en: `The ${word} is very important in our daily life.`, cn: `${cnMeaning}在我们的日常生活中非常重要。` },
      { en: `She has great interest in ${word}.`, cn: `她对${cnMeaning}很感兴趣。` },
      { en: `They discussed the ${word} at the meeting.`, cn: `他们在会上讨论了${cnMeaning}。` },
      { en: `We need more information about ${word}.`, cn: `我们需要更多关于${cnMeaning}的信息。` },
      { en: `The ${word} made a big difference to the result.`, cn: `${cnMeaning}对结果产生了很大的影响。` },
    ],
    '形容词': [
      { en: `The result was quite ${word}.`, cn: `结果非常${cnMeaning}。` },
      { en: `She found the situation ${word}.`, cn: `她觉得情况很${cnMeaning}。` },
      { en: `He was very ${word} about the news.`, cn: `他对这个消息感到很${cnMeaning}。` },
      { en: `This is a ${word} example of the concept.`, cn: `这是一个${cnMeaning}的概念示例。` },
      { en: `The weather has been ${word} recently.`, cn: `最近天气很${cnMeaning}。` },
    ],
    '副词': [
      { en: `She ${word} finished the work.`, cn: `她${cnMeaning}完成了工作。` },
      { en: `He ${word} goes to the library to study.`, cn: `他${cnMeaning}去图书馆学习。` },
      { en: `The project was ${word} completed.`, cn: `项目被${cnMeaning}完成了。` },
      { en: `They ${word} agreed to the plan.`, cn: `他们${cnMeaning}同意了这个计划。` },
      { en: `The situation has ${word} changed.`, cn: `情况已经${cnMeaning}改变了。` },
    ],
    '介词': [
      { en: `The book is ${word} the table.`, cn: `书在桌子${cnMeaning}。` },
      { en: `She walked ${word} the building.`, cn: `她${cnMeaning}那栋建筑走着。` },
      { en: `He sat ${word} the window.`, cn: `他坐在窗户${cnMeaning}。` },
      { en: `The park is ${word} the school.`, cn: `公园在学校${cnMeaning}。` },
      { en: `We traveled ${word} the country.`, cn: `我们${cnMeaning}全国旅行。` },
    ],
    '连词': [
      { en: `She was tired, ${word} she kept working.`, cn: `她很累，${cnMeaning}继续工作。` },
      { en: `${word} it rained, we stayed home.`, cn: `${cnMeaning}下雨了，我们待在家里。` },
      { en: `You can choose tea ${word} coffee.`, cn: `你可以选茶${cnMeaning}咖啡。` },
      { en: `He studied hard ${word} he could pass the exam.`, cn: `他努力学习${cnMeaning}能通过考试。` },
      { en: `I like reading ${word} she prefers sports.`, cn: `我喜欢阅读${cnMeaning}她更喜欢运动。` },
    ],
    '代词': [
      { en: `${word} is my best friend at school.`, cn: `${cnMeaning}是我最好的朋友。` },
      { en: `Give ${word} a chance to explain.`, cn: `给${cnMeaning}一个解释的机会。` },
      { en: `${word} of them passed the test.`, cn: `${cnMeaning}他们通过了考试。` },
      { en: `Is ${word} ready for the trip?`, cn: `${cnMeaning}准备好旅行了吗？` },
      { en: `${word} should take responsibility for this.`, cn: `${cnMeaning}应该为此承担责任。` },
    ],
  };
  const cat = category.split('/')[0];
  const catTemplates = templates[cat] || templates['名词'];
  const idx = Math.abs(word.charCodeAt(0) * 7 + word.length * 3) % catTemplates.length;
  return catTemplates[idx];
}

// Parse pipe-delimited word data
function parseWordData(data) {
  const words = [];
  const seen = new Set();
  const lines = data.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('|');
    if (parts.length < 5) continue;
    const word = parts[0].trim();
    if (!word || seen.has(word)) continue;
    seen.add(word);
    words.push([word, parts[1].trim(), parts[2].trim(), parts[3].trim(), parseInt(parts[4]) || 1]);
  }
  return words;
}

// Load all words from data files
function loadAllWords() {
  const wordsDir = path.join(__dirname, 'words');
  const allWords = [];
  const seenWords = new Set();

  // Also load the legacy word-data.txt
  const legacyPath = path.join(__dirname, 'word-data.txt');
  if (fs.existsSync(legacyPath)) {
    const content = fs.readFileSync(legacyPath, 'utf-8');
    const parsed = parseWordData(content);
    for (const w of parsed) {
      if (!seenWords.has(w[0])) {
        seenWords.add(w[0]);
        allWords.push(w);
      }
    }
  }

  // Load from words directory
  if (fs.existsSync(wordsDir)) {
    const files = fs.readdirSync(wordsDir).filter(f => f.endsWith('.txt')).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(wordsDir, file), 'utf-8');
      const parsed = parseWordData(content);
      for (const w of parsed) {
        if (!seenWords.has(w[0])) {
          seenWords.add(w[0]);
          allWords.push(w);
        }
      }
    }
  }

  return allWords;
}

// Main function
function main() {
  console.log('Generating CET-4 vocabulary...');

  const allWords = loadAllWords();
  console.log(`Total unique words loaded: ${allWords.length}`);

  // Sort alphabetically
  allWords.sort((a, b) => a[0].localeCompare(b[0]));

  // Generate final vocabulary
  const vocabulary = allWords.map((w, idx) => {
    const example = generateExample(w[0], w[3], w[2]);
    // Normalize phonetic: ensure it starts and ends with /
    let phonetic = w[1];
    if (phonetic && !phonetic.startsWith('/')) phonetic = '/' + phonetic;
    if (phonetic && !phonetic.endsWith('/')) phonetic = phonetic + '/';
    return {
      id: idx + 1,
      word: w[0],
      phonetic: phonetic,
      meaning: w[2],
      example_en: example.en,
      example_cn: example.cn,
      category: w[3],
      difficulty: w[4],
    };
  });

  console.log(`Total vocabulary entries: ${vocabulary.length}`);

  if (vocabulary.length < 4900) {
    console.warn(`WARNING: Only ${vocabulary.length} words generated, target is 4900+`);
  }

  // Write to file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'vocabulary.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(vocabulary, null, 2), 'utf-8');
  console.log(`Written to ${outputPath}`);

  // Verify the output
  const verifyData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  console.log(`Verification: ${verifyData.length} valid entries in JSON`);
  console.log(`First word: ${verifyData[0].word}`);
  console.log(`Last word: ${verifyData[verifyData.length - 1].word}`);

  // Count by first letter
  const letterCounts = {};
  for (const entry of verifyData) {
    const letter = entry.word[0].toUpperCase();
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;
  }
  console.log('Words per letter:');
  for (const letter of Object.keys(letterCounts).sort()) {
    console.log(`  ${letter}: ${letterCounts[letter]}`);
  }

  console.log(`\nDone! Generated ${vocabulary.length} CET-4 vocabulary entries.`);
}

main();
