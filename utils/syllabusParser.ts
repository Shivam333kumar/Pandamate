
import { SyllabusTopic, ExamPlan, Task } from '../types';

/**
 * Parses raw syllabus text into structured SyllabusTopic objects.
 */
export function parseSyllabus(rawText: string): SyllabusTopic[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const topics: SyllabusTopic[] = [];
  let currentSubject = 'General';

  lines.forEach(line => {
    // Detect Subject Headers
    const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
    const isSection = /^Section\s+\d+/i.test(line);
    const endsWithColon = line.endsWith(':');
    const isShort = line.length < 60 && !line.includes(';') && !line.includes(',');
    const isNumberedSubject = /^\d+[\.\)]\s+[A-Z]/.test(line);

    if (isAllCaps || isSection || endsWithColon || isNumberedSubject || (isShort && !line.includes(' '))) {
      currentSubject = line.replace(/:$/, '').trim();
      return;
    }

    // Detect Topic Lines and split by semicolons
    const subTopics = line.split(';').map(s => s.trim()).filter(s => s.length > 0);
    subTopics.forEach(topicName => {
      topics.push({
        id: Math.random().toString(36).substr(2, 9),
        name: topicName,
        subject: currentSubject,
        estimatedMinutes: estimateTopicMinutes(topicName, subTopics.length),
        completed: false
      });
    });
  });

  return topics;
}

/**
 * Estimates study time for a topic based on text analysis.
 */
export function estimateTopicMinutes(topicName: string, subtopicCount: number = 1): number {
  let baseTime = 45;

  // Length Bonus
  const len = topicName.length;
  if (len >= 60) baseTime += 45;
  else if (len >= 40) baseTime += 30;
  else if (len >= 20) baseTime += 15;

  // Keyword Weights
  const heavy = ["design", "analysis", "theorem", "method", "equation", "derivation", "proof", "numerical", "algorithm", "matrix", "differential", "integral", "stability", "distribution", "transformation", "consolidation", "flow"];
  const medium = ["theory", "principle", "formula", "calculation", "stress", "strain", "pressure", "velocity", "discharge", "settlement", "capacity", "coefficient", "factor", "ratio", "modulus", "tension", "compression"];
  const light = ["basic", "concept", "type", "property", "definition", "classification", "index", "test", "standard", "code", "chart", "table", "diagram"];

  const lowerName = topicName.toLowerCase();
  heavy.forEach(k => { if (lowerName.includes(k)) baseTime += 30; });
  medium.forEach(k => { if (lowerName.includes(k)) baseTime += 20; });
  light.forEach(k => { if (lowerName.includes(k)) baseTime += 10; });

  // Subtopic Count Bonus
  if (subtopicCount === 2) baseTime += 15;
  else if (subtopicCount === 3) baseTime += 25;
  else if (subtopicCount >= 4) baseTime += 35;

  // Final Clamp & Rounding
  const final = Math.min(240, Math.max(30, baseTime));
  return Math.round(final / 15) * 15;
}

/**
 * Generates a day-by-day study schedule.
 */
export function generateSchedule(plan: ExamPlan): Task[] {
  const tasks: Task[] = [];
  const today = new Date();
  const examDate = new Date(plan.examDate);
  const bufferDays = plan.revisionBufferDays;
  
  // 1. Calculate Available Days
  const availableDates: string[] = [];
  let curr = new Date(today);
  curr.setDate(curr.getDate() + 1); // Start from tomorrow

  const lastStudyDate = new Date(examDate);
  lastStudyDate.setDate(lastStudyDate.getDate() - bufferDays);

  while (curr < lastStudyDate) {
    availableDates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  if (availableDates.length === 0) return [];

  // 2. Sort Topics by Priority if provided
  let sortedTopics = [...plan.topics.filter(t => !t.completed)];
  if (plan.subjectPriority && plan.subjectPriority.length > 0) {
    sortedTopics.sort((a, b) => {
      const pA = plan.subjectPriority!.indexOf(a.subject);
      const pB = plan.subjectPriority!.indexOf(b.subject);
      if (pA === -1 && pB === -1) return 0;
      if (pA === -1) return 1;
      if (pB === -1) return -1;
      return pA - pB;
    });
  }

  // 3. Distribute Topics (Greedy Bin-Packing)
  const dailyBudget = plan.dailyStudyMinutes;
  let dayIdx = 0;
  let currentDayMinutes = 0;

  sortedTopics.forEach(topic => {
    let remainingTopicMins = topic.estimatedMinutes;

    while (remainingTopicMins > 0 && dayIdx < availableDates.length) {
      const date = availableDates[dayIdx];
      const availableInDay = dailyBudget - currentDayMinutes;

      if (availableInDay <= 0) {
        dayIdx++;
        currentDayMinutes = 0;
        continue;
      }

      const duration = Math.min(remainingTopicMins, availableInDay);
      const isSplit = remainingTopicMins > availableInDay;

      const startTime = new Date(date);
      startTime.setHours(8, 0, 0, 0);
      startTime.setMinutes(currentDayMinutes);

      tasks.push({
        id: Math.random().toString(36).substr(2, 9),
        name: isSplit ? `${topic.name} (Part)` : topic.name,
        category: 'Study',
        startTime: startTime.toISOString(),
        durationMinutes: duration,
        completed: false,
        isSpacedRepetition: false
      });

      remainingTopicMins -= duration;
      currentDayMinutes += duration;

      if (currentDayMinutes >= dailyBudget) {
        dayIdx++;
        currentDayMinutes = 0;
      }
    }
  });

  // 4. Assign Revision Days
  const subjects = Array.from(new Set(plan.topics.map(t => t.subject)));
  let revDate = new Date(lastStudyDate);
  while (revDate < examDate) {
    const dateStr = revDate.toISOString().split('T')[0];
    subjects.forEach((sub, idx) => {
      const startTime = new Date(revDate);
      startTime.setHours(9 + idx, 0, 0, 0);
      tasks.push({
        id: Math.random().toString(36).substr(2, 9),
        name: `Revision: ${sub}`,
        category: 'Study',
        startTime: startTime.toISOString(),
        durationMinutes: 60,
        completed: false,
        isSpacedRepetition: true,
        repetitionStep: 0
      });
    });
    revDate.setDate(revDate.getDate() + 1);
  }

  return tasks;
}

/**
 * Extracts text from a file (.txt or .pdf).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  }

  if (file.type === 'application/pdf') {
    // PDF.js is loaded from CDN in index.html
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) throw new Error('PDF.js library not loaded');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }

    return fullText;
  }

  throw new Error('Unsupported file type. Use .txt or .pdf');
}
