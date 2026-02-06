const fs = require('fs');
const path = require('path');

// 读取所有模拟卷文件
const k12MdPath = path.join(__dirname, '../../k12_md');
const outputFile = path.join(__dirname, 'mock-exam-questions-full.js');

// 题目类型映射
function getQuestionType(questionText) {
  if (questionText.includes('读音') || questionText.includes('注音') || questionText.includes('加点字')) {
    return 'pinyin';
  }
  if (questionText.includes('成语') || questionText.includes('熟语')) {
    return 'idiom';
  }
  if (questionText.includes('语病') || questionText.includes('病句')) {
    return 'correction';
  }
  if (questionText.includes('修辞')) {
    return 'literature';
  }
  if (questionText.includes('标点')) {
    return 'grammar';
  }
  if (questionText.includes('作家作品') || questionText.includes('古诗文') || questionText.includes('文言')) {
    return 'literature';
  }
  // 默认词汇题
  return 'vocabulary';
}

// 提取单个题目
function extractQuestion(text, examNum, qNum) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // 跳过标题行和非题目行
  if (lines.length === 0) return null;

  // 检查是否是有效的题目（第一行应该包含题号）
  const firstLine = lines[0];
  if (!firstLine.match(/^\d+\./) && !firstLine.match(/[ABC-D]/)) {
    return null;
  }

  // 提取答案
  let correctAnswer = 0;
  const answerPatterns = [
    /\(\s*\*\*([A-D])\*\*\s*\)/,
    /is\s*\(\s*\*\*([A-D])\*\*\s*\)/,
    /（\s*\*\*([A-D])\*\*\s*）/
  ];

  for (const pattern of answerPatterns) {
    const match = firstLine.match(pattern);
    if (match) {
      correctAnswer = match[1].charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      break;
    }
  }

  // 提取题目文本（移除题号和答案）
  let questionText = firstLine
    .replace(/^\d+\.\s*/, '')
    .replace(/is\s*\(\s*\*\*[A-D]\*\*\s*\)/g, '')
    .replace(/\(\s*\*\*[A-D]\*\*\s*\)/g, '')
    .replace(/（\s*\*\*[A-D]\*\*\s*）/g, '')
    .trim();

  if (questionText.length < 5) {
    // 题目可能在下一行
    if (lines.length > 1 && lines[1].length > 5 && !lines[1].match(/^[A-D]\./)) {
      questionText = lines[1];
    }
  }

  // 提取选项
  const options = [];
  let currentOption = '';
  let optionLetter = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const optMatch = line.match(/^([A-D])\.\s*(.*)/);

    if (optMatch) {
      // 保存上一个选项
      if (currentOption && optionLetter) {
        options.push(`${optionLetter}. ${currentOption.trim()}`);
      }
      optionLetter = optMatch[1];
      currentOption = optMatch[2] || '';
    } else if (optionLetter && line.length > 0 && !line.match(/^\d+\./)) {
      // 继续当前选项的内容
      currentOption += ' ' + line;
    }

    // 如果遇到下一个题号，停止
    if (line.match(/^\d+\./) && i > 1) {
      break;
    }
  }

  // 保存最后一个选项
  if (currentOption && optionLetter) {
    options.push(`${optionLetter}. ${currentOption.trim()}`);
  }

  // 如果没有找到4个选项，尝试正则匹配
  if (options.length < 4) {
    const allText = lines.join('\n');
    const matches = allText.matchAll(/([A-D])\.\s*([^\n]+?)(?=\n[A-D]\.|\n\d+\.|$)/g);
    const newOptions = [];
    for (const m of matches) {
      newOptions.push(`${m[1]}. ${m[2].trim()}`);
    }
    if (newOptions.length >= 4) {
      options.length = 0;
      options.push(...newOptions.slice(0, 4));
    }
  }

  // 确保有4个选项
  while (options.length < 4) {
    options.push(`${String.fromCharCode(65 + options.length)}. 选项${options.length + 1}`);
  }

  // 如果题目文本太短或无效，返回null
  if (questionText.length < 5 || questionText.includes('语文知识') || questionText.includes('阅读材料')) {
    return null;
  }

  return {
    id: `mock${String(examNum).padStart(2, '0')}_${String(qNum).padStart(2, '0')}`,
    type: getQuestionType(questionText),
    question: questionText,
    options: options.slice(0, 4),
    correctAnswer: correctAnswer,
    explanation: ''
  };
}

// 解析单个模拟卷文件
function parseMockExam(content, examNum) {
  const questions = [];

  // 移除参考答案部分
  content = content.replace(/##\s*参考答案[\s\S]*/, '');

  // 按题号分割所有题目
  const questionBlocks = content.split(/\n(?=\d+\.\s)/).filter(block => block.trim());

  let qIndex = 1;
  for (const block of questionBlocks) {
    if (qIndex > 24) break;

    const q = extractQuestion(block, examNum, qIndex);
    if (q) {
      questions.push(q);
      qIndex++;
    }
  }

  return questions;
}

// 主函数
function main() {
  let allQuestions = [];

  for (let i = 1; i <= 20; i++) {
    const filename = `模拟卷${i}.md`;
    const filePath = path.join(k12MdPath, filename);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const questions = parseMockExam(content, i);
      allQuestions = allQuestions.concat(questions);
      console.log(`Parsed ${filename}: ${questions.length} questions`);
    } catch (err) {
      console.error(`Error parsing ${filename}:`, err.message);
    }
  }

  console.log(`Total questions parsed: ${allQuestions.length}`);

  // 写入文件
  const output = `/**
 * 模拟卷题目数据
 * 共20套模拟卷，每套24题，共480题
 */
export const MOCK_EXAM_QUESTIONS = ${JSON.stringify(allQuestions, null, 2)};
`;

  fs.writeFileSync(outputFile, output, 'utf-8');
  console.log(`Written to ${outputFile}`);
}

main();
