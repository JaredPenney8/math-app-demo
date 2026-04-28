import React, { useEffect, useMemo, useState } from "react";
import TeacherHome from "./components/TeacherHome";
import StudentDashboard from "./components/StudentDashboard";
import {
  STUDENTS,
  INDICATOR_CATALOG,
  OUTCOME_TITLES,
  OUTCOME_TO_SKILL,
  GRADE2_CURRICULUM,
  buildDefaultRosterState,
  DEFAULT_STUDENT_GRADE_LEVELS,
  buildDefaultAdaptations,
  getAllStudentsFromRoster,
  getClassStudentsFromRoster,
  GRADE_OPTIONS,
  ADAPTATION_OPTIONS,
  makeDefaultAdaptationRow,
} from "./data/curriculumData";

function TapBoxFractionQuestion({ total = 10, target = null, selectedCount = 0, onChange, disabled = false }) {
  const columns = total <= 5 ? total : Math.min(total, 10);

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #dbeafe",
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          Target: {target ?? "?"}/{total}
        </div>

        <div style={{ color: "#64748b", fontSize: 14 }}>
          Tap the boxes to shade the fraction.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(38px, 52px))`,
          gap: 8,
          marginBottom: 10,
          maxWidth: "100%",
        }}
      >
        {Array.from({ length: total }).map((_, index) => {
          const boxNumber = index + 1;
          const isFilled = boxNumber <= selectedCount;

          return (
            <button
              key={boxNumber}
              type="button"
              aria-label={`Shade ${boxNumber} out of ${total}`}
              onClick={() => {
                if (!disabled) onChange(boxNumber);
              }}
              disabled={disabled}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 12,
                border: "2px solid #2563eb",
                background: isFilled ? "#2563eb" : "#ffffff",
                color: isFilled ? "#ffffff" : "#2563eb",
                fontWeight: 900,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.75 : 1,
                boxShadow: isFilled ? "0 8px 18px rgba(37, 99, 235, 0.25)" : "none",
              }}
            >
              {isFilled ? "✓" : ""}
            </button>
          );
        })}
      </div>

      <div style={{ fontWeight: 900 }}>
        You shaded: {selectedCount}/{total}
      </div>
    </div>
  );
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleQuestions(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildFractionTapBoxPracticeSet(outcome = "NO4", indicator = "NO4.01", count = 5, adaptiveLevel = "normal") {
  let denominators;

  if (adaptiveLevel === "easy") {
    denominators = [2, 3, 4];
  } else if (adaptiveLevel === "challenge") {
    denominators = [6, 8, 10];
  } else {
    denominators = [4, 5, 6, 8];
  }
  const used = new Set();
  const questions = [];

  while (questions.length < count) {
    const total = denominators[randomInt(0, denominators.length - 1)];
    const target = randomInt(1, total - 1);
    const key = `${target}/${total}`;

    if (used.has(key)) continue;
    used.add(key);

    questions.push({
      id: `generated-tapbox-${outcome}-${indicator}-${key}-${Date.now()}-${questions.length}`,
      prompt: `Tap the boxes to shade ${key}.`,
      difficulty: adaptiveLevel,
      answers: [key],
      correct: key,
      tapBoxModel: {
        total,
        target,
      },
      outcome,
      indicator,
      skill: "Fraction visual model",
      visualType: "tapBoxFraction",
      modelLabel: `${target} out of ${total} shaded boxes`,
      thinkingSteps: [
        `The denominator ${total} means there are ${total} equal parts.`,
        `The numerator ${target} means you need to shade ${target} parts.`,
        "Tap the boxes until the shaded amount matches the target fraction.",
      ],
      curriculumText: "Represent and partition numbers/fractions using visual models.",
      mistakeIfWrong: `Needs support representing ${key} with shaded parts.`,
      hint: `The bottom number tells how many total boxes there are: ${total}.`,
      hint2: `The top number tells how many boxes to shade: ${target}.`,
      generated: true,
    });
  }

  return questions;
}

function buildPracticeQuestionSet(outcome, activeAllQuestions, fallbackSkill = "fractions", count = 5, adaptiveLevel = "normal") {
  if (outcome === "NO4") {
    return buildFractionTapBoxPracticeSet("NO4", "NO4.01", count, adaptiveLevel);
  }

  const outcomeQuestions = activeAllQuestions.filter((q) => q.outcome === outcome);
  const fallback = QUESTION_BANK[fallbackSkill] || activeAllQuestions.slice(0, count);

  return shuffleQuestions(outcomeQuestions.length ? outcomeQuestions : fallback).slice(0, count);
}

function buildSkillQuestionSet(skill, activeAllQuestions, count = 5, adaptiveLevel = "normal") {
  if (skill === "fractions") {
    return buildFractionTapBoxPracticeSet("NO4", "NO4.01", count, adaptiveLevel);
  }

  const base = QUESTION_BANK[skill] || activeAllQuestions.slice(0, count);
  return shuffleQuestions(base).slice(0, count);
}

function getVisualTypeForIndicator(indicatorId, text) {
  const lower = `${indicatorId} ${text}`.toLowerCase();
  if (lower.includes("coin") || lower.includes("money")) return "coins";
  if (lower.includes("ten-frame") || lower.includes("base-ten") || lower.includes("tens") || lower.includes("ones") || lower.includes("place value")) return "baseTen";
  if (lower.includes("tallies")) return "tallies";
  if (lower.includes("hundred chart") || lower.includes("sequence") || lower.includes("skip count") || lower.includes("number line") || lower.includes("order")) return "numberLine";
  if (lower.includes("pattern")) return "pattern";
  if (lower.includes("equal") || lower.includes("balance")) return "balance";
  if (lower.includes("calendar") || lower.includes("days") || lower.includes("months")) return "calendar";
  if (lower.includes("measure") || lower.includes("length") || lower.includes("mass") || lower.includes("unit")) return "measurement";
  if (lower.includes("shape") || lower.includes("object") || lower.includes("3-d") || lower.includes("2-d")) return "geometry";
  if (lower.includes("graph") || lower.includes("data") || lower.includes("pictograph")) return "graph";
  return "generic";
}


function getQuestionsForGrade(grade, questionEdits = {}) {
  const gradeQuestions = grade === "G2"
    ? ALL_QUESTIONS
    : Object.values(QUESTION_BANK).flat();
  return applyPublishedQuestionEdits(gradeQuestions, questionEdits);
}

function getAdaptationSupport(question, adaptations = {}) {
  if (!question) return null;

  const visualType = question.visualType || "generic";
  const outcomeTitle = OUTCOME_TITLES[question.outcome] || question.outcome || "this outcome";
  const indicatorText = question.curriculumText || question.skill || outcomeTitle;

  const formulaByVisual = {
    baseTen: "Tens + ones = the number. Count full tens first, then count ones.",
    coins: "Add coin values carefully. Quarter = 25¢, dime = 10¢, nickel = 5¢, penny = 1¢.",
    tallies: "A group of 5 tally marks can be counted as 5, then count the extras.",
    numberLine: "Look at the change from one number to the next. Use the same jump each time.",
    pattern: "Find the core that repeats, then use it to decide what comes next.",
    balance: "Check both sides. If both sides have the same value, use =. If not, use ≠.",
    calendar: "Move one day at a time on the calendar and count carefully.",
    measurement: "Use equal units with no gaps and no overlaps.",
    geometry: "Look at sides, corners, faces, curves, and flat surfaces.",
    graph: "Read the labels first, then compare the counts or heights.",
    generic: "Read the question, use the model or clue, and match the answer to the evidence.",
  };

  const exampleByVisual = {
    baseTen: "Example: 2 tens and 6 ones means 20 + 6 = 26.",
    coins: "Example: a quarter and a dime make 35¢ because 25¢ + 10¢ = 35¢.",
    tallies: "Example: 5 tallies and 3 more tallies make 8.",
    numberLine: "Example: 20, 30, 40 follows a +10 pattern, so the next number is 50.",
    pattern: "Example: ▲ ● ▲ ● repeats triangle, circle, so the next shape is ▲.",
    balance: "Example: 10 + 5 equals 15, so 10 + 5 = 15.",
    calendar: "Example: if today is Monday, one day later is Tuesday.",
    measurement: "Example: if 6 equal blocks fit end-to-end, the object is 6 units long.",
    geometry: "Example: a square has 4 equal sides and 4 corners.",
    graph: "Example: if B has the tallest bar, B has the most votes.",
    generic: `Example: This question is checking ${indicatorText}. Use the model before choosing.`,
  };

  return {
    formulaReminder: formulaByVisual[visualType] || formulaByVisual.generic,
    workedExample: exampleByVisual[visualType] || exampleByVisual.generic,
    simplifiedNote: `Simplified support: focus only on the key idea — ${indicatorText}.`,
    readAloudText: `${question.prompt}. The answer choices are ${(question.answers || []).join(", ")}.`,
    outcomeTitle,
  };
}

function applyAdaptationsToQuestion(question, adaptations = {}) {
  if (!question) return null;

  const support = getAdaptationSupport(question, adaptations);
  const adapted = { ...question, adaptationSupport: support };

  if (adaptations.simplifiedNumbers) {
    adapted.prompt = question.prompt
      .replace("Which expression represents this base-ten model?", "What number does this model show?")
      .replace("Which coin expression matches this amount?", "How much money is shown?")
      .replace("Which explanation best matches this performance indicator?", "Which answer matches the model?")
      .replace("Which answer best matches this performance indicator?", "Which answer matches the model?");
    adapted.thinkingSteps = [
      "Look at the model first.",
      "Count or name one part at a time.",
      "Choose the answer that matches the model.",
    ];
  }

  return adapted;
}

function getQuestionTemplateForVisual(visualType, difficulty) {
  const isChallenge = difficulty === "challenge";

  const templates = {
    baseTen: {
      prompt: isChallenge
        ? "Which expression represents this base-ten model?"
        : "Which number is shown by the tens and ones model?",
      answers: isChallenge ? ["20 + 6", "26 + 10", "2 + 6"] : ["26", "62", "20"],
      correct: isChallenge ? "20 + 6" : "26",
      modelLabel: "2 tens and 6 ones",
      thinkingSteps: ["Count the tens first.", "Count the ones next.", "Put the tens and ones together."],
    },
    coins: {
      prompt: isChallenge
        ? "Which coin expression matches this amount?"
        : "Which amount is represented by the coins?",
      answers: isChallenge ? ["25¢ + 10¢ + 10¢ + 5¢", "25¢ + 5¢", "10¢ + 10¢ + 5¢"] : ["50¢", "40¢", "65¢"],
      correct: isChallenge ? "25¢ + 10¢ + 10¢ + 5¢" : "50¢",
      modelLabel: "quarter, dime, dime, nickel",
      thinkingSteps: ["Name each coin.", "Add the coin values.", "Check that the total matches the answer."],
    },
    tallies: {
      prompt: isChallenge
        ? "Which number sentence matches the tally marks?"
        : "How many tally marks are shown?",
      answers: isChallenge ? ["5 + 5 + 3 = 13", "4 + 4 + 3 = 11", "5 + 3 = 8"] : ["13", "10", "15"],
      correct: isChallenge ? "5 + 5 + 3 = 13" : "13",
      modelLabel: "two groups of five and three more",
      thinkingSteps: ["Look for groups of five.", "Count the leftover tallies.", "Add the groups together."],
    },
    numberLine: {
      prompt: isChallenge
        ? "Which rule describes this number sequence?"
        : "What number belongs in the missing spot?",
      answers: isChallenge ? ["Skip count by 10s", "Skip count by 5s", "Count backward by 1s"] : ["50", "45", "55"],
      correct: isChallenge ? "Skip count by 10s" : "50",
      modelLabel: "20, 30, 40, ?, 60",
      thinkingSteps: ["Look at how the numbers change.", "Find the skip-counting rule.", "Use the rule for the missing number."],
    },
    pattern: {
      prompt: isChallenge
        ? "What is the core of this repeating pattern?"
        : "What comes next in the pattern?",
      answers: isChallenge ? ["triangle, circle", "circle, triangle", "triangle, triangle"] : ["●", "▲", "■"],
      correct: isChallenge ? "triangle, circle" : "●",
      modelLabel: "▲ ● ▲ ● ▲ ?",
      thinkingSteps: ["Find what repeats.", "Say the pattern core out loud.", "Use the core to predict the next item."],
    },
    balance: {
      prompt: "Which symbol makes the number sentence true?",
      answers: ["=", "≠", ">"],
      correct: "=",
      modelLabel: "10 + 5 ? 15",
      thinkingSteps: ["Solve the left side.", "Compare it to the right side.", "Choose the symbol that matches."],
    },
    calendar: {
      prompt: isChallenge
        ? "If today is Monday, what day is 3 days later?"
        : "How many days are in one week?",
      answers: isChallenge ? ["Thursday", "Wednesday", "Friday"] : ["7", "5", "12"],
      correct: isChallenge ? "Thursday" : "7",
      modelLabel: "Sun Mon Tue Wed Thu Fri Sat",
      thinkingSteps: ["Read the calendar labels.", "Count each day carefully.", "Stop on the day or number asked."],
    },
    measurement: {
      prompt: isChallenge
        ? "Why is this measurement fair?"
        : "How many unit blocks long is the object?",
      answers: isChallenge ? ["The units touch with no gaps", "The units overlap", "Some units are missing"] : ["6 units", "5 units", "7 units"],
      correct: isChallenge ? "The units touch with no gaps" : "6 units",
      modelLabel: "six equal unit blocks",
      thinkingSteps: ["Check that the units are the same size.", "Look for gaps or overlaps.", "Count the units from end to end."],
    },
    geometry: {
      prompt: isChallenge
        ? "Which attribute could sort these shapes?"
        : "Which shape has 4 equal sides?",
      answers: isChallenge ? ["curved sides or straight sides", "colour only", "how heavy it is"] : ["square", "circle", "triangle"],
      correct: isChallenge ? "curved sides or straight sides" : "square",
      modelLabel: "square, circle, triangle",
      thinkingSteps: ["Look at sides and corners.", "Name the shape or object.", "Match the attribute to the answer."],
    },
    graph: {
      prompt: isChallenge
        ? "Which category has the most votes?"
        : "How many votes are shown by the tallest bar?",
      answers: isChallenge ? ["B", "A", "C"] : ["5", "3", "2"],
      correct: isChallenge ? "B" : "5",
      modelLabel: "bar heights: A=3, B=5, C=2",
      thinkingSteps: ["Read the graph labels.", "Compare the heights/counts.", "Use the data to answer the question."],
    },
    generic: {
      prompt: isChallenge
        ? "Which explanation best matches this performance indicator?"
        : "Which answer best matches this performance indicator?",
      answers: ["A", "B", "C"],
      correct: "A",
      modelLabel: "indicator practice",
      thinkingSteps: ["Read the indicator.", "Use the model or clue.", "Choose the answer that matches the evidence."],
    },
  };

  return templates[visualType] || templates.generic;
}

function buildQuestionForIndicator(outcomeId, indicatorId, indicatorText, difficulty = "easy") {
  const visualType = getVisualTypeForIndicator(indicatorId, indicatorText);
  const template = getQuestionTemplateForVisual(visualType, difficulty);

  return {
    prompt: `${indicatorId}: ${template.prompt}`,
    difficulty,
    answers: template.answers,
    correct: template.correct,
    outcome: outcomeId,
    indicator: indicatorId,
    skill: `${OUTCOME_TITLES[outcomeId] || outcomeId}: ${indicatorText}`,
    visualType,
    modelLabel: template.modelLabel,
    thinkingSteps: template.thinkingSteps,
    curriculumText: indicatorText,
    mistakeIfWrong: `Needs support with ${indicatorId}: ${indicatorText}`,
    hint: `Look at the model first. This question checks: ${indicatorText}`,
    hint2: `Use the visual evidence to choose the answer that matches ${indicatorId}.`,
  };
}

const GRADE2_GENERATED_QUESTIONS = Object.entries(GRADE2_CURRICULUM).flatMap(([outcomeId, outcome]) =>
  Object.entries(outcome.indicators).flatMap(([indicatorId, indicatorText]) => [
    buildQuestionForIndicator(outcomeId, indicatorId, indicatorText, "easy"),
    buildQuestionForIndicator(outcomeId, indicatorId, indicatorText, "normal"),
    buildQuestionForIndicator(outcomeId, indicatorId, indicatorText, "challenge"),
  ])
);

function getCurriculumCoverage() {
  const rows = Object.entries(GRADE2_CURRICULUM).map(([outcomeId, outcome]) => {
    const indicatorIds = Object.keys(outcome.indicators);
    const questionCount = GRADE2_GENERATED_QUESTIONS.filter((q) => q.outcome === outcomeId).length;
    const coveredIndicators = indicatorIds.filter((indicatorId) =>
      GRADE2_GENERATED_QUESTIONS.some((q) => q.indicator === indicatorId)
    ).length;

    return {
      outcomeId,
      strand: outcome.strand,
      title: OUTCOME_TITLES[outcomeId] || outcomeId,
      indicators: indicatorIds.length,
      coveredIndicators,
      questionCount,
      complete: coveredIndicators === indicatorIds.length,
    };
  });

  return {
    rows,
    totalOutcomes: rows.length,
    totalIndicators: rows.reduce((sum, row) => sum + row.indicators, 0),
    totalQuestions: GRADE2_GENERATED_QUESTIONS.length,
    uncoveredIndicators: rows.reduce((sum, row) => sum + (row.indicators - row.coveredIndicators), 0),
  };
}

function getCurriculumQualityAudit() {
  const indicatorRows = Object.entries(GRADE2_CURRICULUM).flatMap(([outcomeId, outcome]) =>
    Object.entries(outcome.indicators).map(([indicatorId, text]) => {
      const questions = GRADE2_GENERATED_QUESTIONS.filter((q) => q.indicator === indicatorId);
      const difficulties = new Set(questions.map((q) => q.difficulty || "normal"));
      const visualType = getVisualTypeForIndicator(indicatorId, text);
      const hasEasy = difficulties.has("easy");
      const hasNormal = difficulties.has("normal");
      const hasChallenge = difficulties.has("challenge");
      const qualityScore = [hasEasy, hasNormal, hasChallenge].filter(Boolean).length;

      let teacherMove = "Ready for student practice.";
      if (qualityScore < 3) teacherMove = "Add missing difficulty versions.";
      if (visualType === "generic") teacherMove = "Review visual type and consider a custom model.";

      return {
        outcomeId,
        indicatorId,
        strand: outcome.strand,
        text,
        visualType,
        questionCount: questions.length,
        hasEasy,
        hasNormal,
        hasChallenge,
        qualityScore,
        teacherMove,
        samplePrompt: questions[0]?.prompt || "No question generated yet.",
      };
    })
  );

  const visualRows = Object.entries(
    indicatorRows.reduce((acc, row) => {
      acc[row.visualType] = acc[row.visualType] || { visualType: row.visualType, indicators: 0, questions: 0 };
      acc[row.visualType].indicators += 1;
      acc[row.visualType].questions += row.questionCount;
      return acc;
    }, {})
  )
    .map(([, value]) => value)
    .sort((a, b) => b.indicators - a.indicators);

  const priorityIndicators = indicatorRows
    .filter((row) => row.qualityScore < 3 || row.visualType === "generic")
    .sort((a, b) => a.qualityScore - b.qualityScore || a.indicatorId.localeCompare(b.indicatorId));

  return {
    indicatorRows,
    visualRows,
    priorityIndicators,
    totalIndicators: indicatorRows.length,
    completeIndicators: indicatorRows.filter((row) => row.qualityScore === 3 && row.visualType !== "generic").length,
    genericVisuals: indicatorRows.filter((row) => row.visualType === "generic").length,
  };
}


function buildBalancedAssessmentQuestions(allQuestions, outcome, desiredCount = 6) {
  const pool = allQuestions.filter((q) => q.outcome === outcome);
  if (pool.length === 0) return [];

  const byIndicator = pool.reduce((acc, question) => {
    const key = question.indicator || `${outcome}.unknown`;
    acc[key] = acc[key] || [];
    acc[key].push(question);
    return acc;
  }, {});

  const selected = [];
  const indicatorIds = Object.keys(byIndicator).sort();
  const difficultyOrder = ["easy", "normal", "challenge"];

  difficultyOrder.forEach((difficulty) => {
    indicatorIds.forEach((indicatorId) => {
      if (selected.length >= desiredCount) return;
      const candidate = byIndicator[indicatorId].find(
        (question) => (question.difficulty || "normal") === difficulty && !selected.includes(question)
      );
      if (candidate) selected.push(candidate);
    });
  });

  pool.forEach((question) => {
    if (selected.length < desiredCount && !selected.includes(question)) {
      selected.push(question);
    }
  });

  return selected.slice(0, desiredCount);
}

function getAssessmentBlueprint(allQuestions = GRADE2_GENERATED_QUESTIONS) {
  const rows = Object.entries(GRADE2_CURRICULUM).map(([outcomeId, outcome]) => {
    const balanced = buildBalancedAssessmentQuestions(allQuestions, outcomeId, 6);
    const uniqueIndicators = new Set(balanced.map((q) => q.indicator).filter(Boolean));
    const uniqueVisuals = new Set(balanced.map((q) => q.visualType || "generic"));
    const difficulties = balanced.reduce((acc, q) => {
      const key = q.difficulty || "normal";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const totalIndicators = Object.keys(outcome.indicators || {}).length;
    const indicatorCoverage = totalIndicators > 0 ? Math.round((uniqueIndicators.size / totalIndicators) * 100) : 0;
    const hasDifficultyMix = Boolean(difficulties.easy && difficulties.normal && difficulties.challenge);
    const hasEnoughItems = balanced.length >= 6;
    const hasVisualMix = uniqueVisuals.size >= 2 || uniqueIndicators.size <= 1;

    let status = "Ready";
    let teacherMove = "Use this as a balanced 6-question outcome assessment.";

    if (!hasEnoughItems) {
      status = "Needs more questions";
      teacherMove = "Add more question versions before using this outcome as an assessment.";
    } else if (!hasDifficultyMix || indicatorCoverage < 50) {
      status = "Review balance";
      teacherMove = "Review the assessment mix so it samples more indicators and difficulty levels.";
    } else if (!hasVisualMix) {
      status = "Review visuals";
      teacherMove = "Add a second representation type so students are not assessed from only one model.";
    }

    return {
      outcomeId,
      strand: outcome.strand,
      title: OUTCOME_TITLES[outcomeId] || outcomeId,
      totalQuestions: balanced.length,
      totalIndicators,
      sampledIndicators: uniqueIndicators.size,
      indicatorCoverage,
      difficulties,
      visualTypes: Array.from(uniqueVisuals),
      status,
      teacherMove,
      sample: balanced.map((q, index) => ({
        number: index + 1,
        indicator: q.indicator,
        difficulty: q.difficulty || "normal",
        visualType: q.visualType || "generic",
        prompt: q.prompt,
      })),
    };
  });

  return {
    rows,
    ready: rows.filter((row) => row.status === "Ready"),
    review: rows.filter((row) => row.status !== "Ready"),
  };
}


function getMasteryEvidenceReview(students, indicatorStats, assessmentStats, teacherAssignments) {
  const rows = students.flatMap((student) =>
    Object.entries(GRADE2_CURRICULUM).map(([outcomeId, outcome]) => {
      const indicatorSummary = getIndicatorSummaryForStudent(indicatorStats, student, outcomeId);
      const assessment = getAssessmentSummary(assessmentStats, student, outcomeId);
      const assignment = teacherAssignments?.[student] || null;
      const attemptedIndicators = indicatorSummary.items.filter((item) => item.attempts > 0).length;
      const weakIndicators = indicatorSummary.items.filter(
        (item) => item.attempts > 0 && !item.mastered
      );
      const masteredIndicators = indicatorSummary.items.filter((item) => item.mastered);
      const totalAttempts = indicatorSummary.items.reduce((sum, item) => sum + item.attempts, 0);
      const totalCorrect = indicatorSummary.items.reduce((sum, item) => sum + item.correct, 0);
      const evidencePercent = indicatorSummary.total > 0
        ? Math.round((attemptedIndicators / indicatorSummary.total) * 100)
        : 0;

      let evidenceStatus = "Collect Evidence";
      let teacherMove = `Start short practice for ${outcomeId} and watch the first weak indicator.`;

      if (assessment.status === "Passed") {
        evidenceStatus = "Mastered";
        teacherMove = "Move to enrichment, maintenance, or the next outcome.";
      } else if (assessment.status === "Needs Reassessment") {
        evidenceStatus = "Reassessment Needed";
        teacherMove = `Pull ${student} for a rebuild on ${weakIndicators[0]?.indicator || outcomeId}, then reassess.`;
      } else if (indicatorSummary.readyForAssessment) {
        evidenceStatus = "Ready for Assessment";
        teacherMove = `Assign the ${outcomeId} assessment; indicator evidence is strong enough.`;
      } else if (weakIndicators.length > 0) {
        evidenceStatus = "Targeted Practice";
        teacherMove = `Assign targeted practice for ${weakIndicators[0].indicator}.`;
      } else if (attemptedIndicators > 0) {
        evidenceStatus = "Developing";
        teacherMove = `Continue short practice cycles until ${indicatorSummary.requiredCount} indicators are mastered.`;
      }

      return {
        student,
        outcomeId,
        title: OUTCOME_TITLES[outcomeId] || outcomeId,
        strand: outcome.strand,
        evidenceStatus,
        teacherMove,
        assignment,
        assessment,
        attemptedIndicators,
        evidencePercent,
        masteredCount: masteredIndicators.length,
        requiredCount: indicatorSummary.requiredCount,
        totalIndicators: indicatorSummary.total,
        totalAttempts,
        totalCorrect,
        weakIndicators,
        masteredIndicators,
      };
    })
  );

  const priorityRows = rows
    .filter((row) => row.evidenceStatus !== "Mastered")
    .sort((a, b) => {
      const rank = {
        "Reassessment Needed": 1,
        "Ready for Assessment": 2,
        "Targeted Practice": 3,
        Developing: 4,
        "Collect Evidence": 5,
      };
      return (rank[a.evidenceStatus] || 9) - (rank[b.evidenceStatus] || 9) || a.student.localeCompare(b.student);
    });

  return {
    rows,
    priorityRows,
    readyCount: rows.filter((row) => row.evidenceStatus === "Ready for Assessment").length,
    reassessmentCount: rows.filter((row) => row.evidenceStatus === "Reassessment Needed").length,
    targetedPracticeCount: rows.filter((row) => row.evidenceStatus === "Targeted Practice").length,
    masteredCount: rows.filter((row) => row.evidenceStatus === "Mastered").length,
  };
}


function getQuestionQualityReview() {
  const rows = GRADE2_GENERATED_QUESTIONS.map((question) => {
    const hasVisual = Boolean(question.visualType && question.visualType !== "generic");
    const hasThinking = Array.isArray(question.thinkingSteps) && question.thinkingSteps.length >= 2;
    const hasHints = Boolean(question.hint && question.hint2);
    const hasMisconception = Boolean(question.mistakeIfWrong && question.mistakeIfWrong.length > 20);
    const hasCurriculumText = Boolean(question.curriculumText);
    const hasAssessmentReadiness = question.difficulty === "challenge" || question.prompt.toLowerCase().includes("explain") || question.prompt.toLowerCase().includes("justify");
    const score = [hasVisual, hasThinking, hasHints, hasMisconception, hasCurriculumText].filter(Boolean).length;
    let rating = "Ready";
    let nextMove = "Use this question in practice or assessment prep.";
    if (score <= 2) {
      rating = "Needs Rewrite";
      nextMove = "Rewrite the prompt, add better hints, and attach a clearer model.";
    } else if (score <= 4) {
      rating = "Review";
      nextMove = "Check the visual and wording before using for mastery evidence.";
    }
    return {
      id: `${question.indicator}-${question.difficulty}`,
      outcome: question.outcome,
      indicator: question.indicator,
      difficulty: question.difficulty || "normal",
      visualType: question.visualType || "generic",
      prompt: question.prompt,
      score,
      rating,
      nextMove,
      hasVisual,
      hasThinking,
      hasHints,
      hasMisconception,
      hasCurriculumText,
      hasAssessmentReadiness,
    };
  });
  const needsRewrite = rows.filter((row) => row.rating === "Needs Rewrite");
  const review = rows.filter((row) => row.rating === "Review");
  const ready = rows.filter((row) => row.rating === "Ready");
  const assessmentReady = rows.filter((row) => row.hasAssessmentReadiness && row.rating !== "Needs Rewrite");
  const byOutcome = Object.entries(
    rows.reduce((acc, row) => {
      acc[row.outcome] = acc[row.outcome] || { outcome: row.outcome, total: 0, ready: 0, review: 0, rewrite: 0 };
      acc[row.outcome].total += 1;
      if (row.rating === "Ready") acc[row.outcome].ready += 1;
      if (row.rating === "Review") acc[row.outcome].review += 1;
      if (row.rating === "Needs Rewrite") acc[row.outcome].rewrite += 1;
      return acc;
    }, {})
  ).map(([, value]) => value);
  return {
    rows,
    ready,
    review,
    needsRewrite,
    assessmentReady,
    byOutcome,
    readyPercent: rows.length > 0 ? Math.round((ready.length / rows.length) * 100) : 0,
  };
}


function buildQuestionImprovementStudio() {
  const review = getQuestionQualityReview();
  const priority = [...review.needsRewrite, ...review.review].slice(0, 8);

  function getRewriteFor(row) {
    const outcomeTitle = OUTCOME_TITLES[row.outcome] || row.outcome;
    const visualLabel = row.visualType === "generic" ? "a clear classroom model" : row.visualType.replaceAll("_", " ");
    const easyVerb = row.difficulty === "challenge" ? "explain" : row.difficulty === "normal" ? "show" : "choose";

    return {
      improvedPrompt: `${row.indicator}: Use ${visualLabel} to ${easyVerb} your thinking for ${outcomeTitle}.`,
      betterHint1: "Start by looking at the model. What does each part, group, mark, or symbol represent?",
      betterHint2: "Now connect the model to the number sentence or answer choice. Say what each number means.",
      misconception: row.hasMisconception
        ? "Keep the current misconception target, but make it visible in the feedback."
        : "Add a likely misconception, such as counting the wrong unit, skipping a step, or reading the model without explaining why.",
      teacherMove: row.rating === "Needs Rewrite"
        ? "Rewrite before using this for mastery evidence."
        : "Usable for practice; review before using as an assessment question.",
    };
  }

  return {
    priority,
    readyToUse: review.ready.length,
    needsTeacherEdit: priority.length,
    suggestions: priority.map((row) => ({ ...row, ...getRewriteFor(row) })),
  };
}


function applyPublishedQuestionEdits(questions, questionEdits) {
  const edits = questionEdits || {};

  return questions.map((question) => {
    const published = edits[question.id];

    if (!published || published.status !== "Published") {
      return question;
    }

    return {
      ...question,
      prompt: published.improvedPrompt || question.prompt,
      hint: published.hint || question.hint,
      hint2: published.hint2 || question.hint2,
      mistakeIfWrong: published.misconception || question.mistakeIfWrong,
      teacherMove: published.teacherMove || question.teacherMove,
      publishedEdit: true,
      publishedAt: published.publishedAt,
      originalPrompt: published.originalPrompt || question.prompt,
    };
  });
}

function getQuestionEditCounts(questionEdits) {
  const edits = Object.values(questionEdits || {});
  return {
    saved: edits.filter((item) => item.status === "Saved Draft").length,
    reviewed: edits.filter((item) => item.status === "Reviewed").length,
    published: edits.filter((item) => item.status === "Published").length,
    total: edits.length,
  };
}

const QUESTION_BANK = {
  fractions: [
    {
      prompt: "Tap the boxes to shade 3/4.",
      difficulty: "easy",
      answers: ["1/4", "2/4", "3/4"],
      correct: "3/4",
      tapBoxModel: {
  total: 4,
  target: 3,
},
      outcome: "NO4",
      indicator: "NO4.01",
      skill: "Fraction visual model",
      mistakeIfWrong: "Misread shaded parts",
      hint: "Count the shaded parts first, then count the total equal parts.",
      hint2: "Write it as shaded parts / total parts. For example, 3 shaded out of 4 total is 3/4.",
    },
    {
      prompt: "Which fraction shows half?",
      difficulty: "easy",
      answers: ["1/2", "1/3", "3/4"],
      correct: "1/2",
      outcome: "NO4",
      indicator: "NO4.02",
      skill: "Fraction visual model",
      mistakeIfWrong: "Confusing numerator and denominator",
      hint: "The top number tells how many parts you have. The bottom number tells how many equal parts are in the whole.",
      hint2: "For 3/4, the 3 means selected or shaded parts. The 4 means total equal parts.",
    },
    {
      prompt: "Targeted practice: What fraction is shaded?",
      difficulty: "normal",
      answers: ["1/4", "2/4", "3/4"],
      correct: "3/4",
      outcome: "NO4",
      indicator: "NO4.01",
      skill: "Fraction visual model",
      mistakeIfWrong: "Misread shaded parts",
      hint: "Count the shaded parts first, then count the total equal parts.",
      hint2: "Write it as shaded parts / total parts. For example, 3 shaded out of 4 total is 3/4.",
    },
    {
      prompt: "Targeted practice: Which fraction shows 3 out of 4?",
      difficulty: "normal",
      answers: ["3/4", "1/4", "4/3"],
      correct: "3/4",
      outcome: "NO4",
      indicator: "NO4.02",
      skill: "Fraction visual model",
      mistakeIfWrong: "Confusing numerator and denominator",
      hint: "The top number tells how many parts you have. The bottom number tells how many equal parts are in the whole.",
      hint2: "For 3/4, the 3 means selected or shaded parts. The 4 means total equal parts.",
    },
    {
      prompt: "Challenge: Build an equivalent fraction for 3/4.",
      difficulty: "challenge",
      type: "multi-step",
      steps: [
        {
          prompt: "Step 1: If we multiply the denominator 4 by 2, what denominator do we get?",
          answers: ["6", "8", "12"],
          correct: "8",
        },
        {
          prompt: "Step 2: To keep the fraction equivalent, what should we multiply the numerator 3 by?",
          answers: ["2", "3", "4"],
          correct: "2",
        },
        {
          prompt: "Step 3: What equivalent fraction do we get?",
          answers: ["6/8", "2/8", "4/6"],
          correct: "6/8",
        },
      ],
      answers: ["6/8", "2/8", "4/6"],
      correct: "6/8",
      outcome: "NO4",
      indicator: "NO4.03",
      skill: "Equivalent fractions",
      mistakeIfWrong: "Equivalent fraction misunderstanding",
      hint: "Equivalent fractions name the same amount. Try multiplying the top and bottom by the same number.",
      hint2: "3/4 × 2/2 = 6/8, so 6/8 names the same amount as 3/4.",
    },
  ],
  decimals: [
    {
      prompt: "Which decimal is bigger?",
      difficulty: "easy",
      answers: ["0.5", "0.7", "0.2"],
      correct: "0.7",
      outcome: "NO7",
      indicator: "NO7.02",
      skill: "Compare decimals",
      mistakeIfWrong: "Decimal comparison error",
      hint: "Compare the tenths first. The digit right after the decimal is the tenths place.",
      hint2: "0.7 has 7 tenths. 0.5 has 5 tenths. More tenths means the decimal is larger.",
    },
    {
      prompt: "What is 3 tenths as a decimal?",
      difficulty: "easy",
      answers: ["0.3", "3.0", "0.03"],
      correct: "0.3",
      outcome: "NO7",
      indicator: "NO7.01",
      skill: "Tenths as decimals",
      mistakeIfWrong: "Tenths place misunderstanding",
      hint: "Tenths mean parts out of 10. Three tenths is written as 0.3.",
      hint2: "The digit 3 goes in the tenths place, right after the decimal point.",
    },
    {
      prompt: "Targeted practice: Which decimal is bigger?",
      difficulty: "normal",
      answers: ["0.4", "0.8", "0.3"],
      correct: "0.8",
      outcome: "NO7",
      indicator: "NO7.02",
      skill: "Compare decimals",
      mistakeIfWrong: "Decimal comparison error",
      hint: "Compare the tenths first. The digit right after the decimal is the tenths place.",
      hint2: "0.8 has 8 tenths. 0.4 has 4 tenths. More tenths means the decimal is larger.",
    },
    {
      prompt: "Targeted practice: What is 7 tenths as a decimal?",
      difficulty: "normal",
      answers: ["0.7", "7.0", "0.07"],
      correct: "0.7",
      outcome: "NO7",
      indicator: "NO7.01",
      skill: "Tenths as decimals",
      mistakeIfWrong: "Tenths place misunderstanding",
      hint: "Tenths mean parts out of 10. Seven tenths is written as 0.7.",
      hint2: "The digit 7 goes in the tenths place, right after the decimal point.",
    },
    {
      prompt: "Challenge: Compare decimals using a benchmark.",
      difficulty: "challenge",
      type: "multi-step",
      steps: [
        {
          prompt: "Step 1: Which benchmark is 0.75 equal to?",
          answers: ["one half", "three quarters", "one tenth"],
          correct: "three quarters",
        },
        {
          prompt: "Step 2: Which two tenths is 0.75 between?",
          answers: ["0.5 and 0.6", "0.7 and 0.8", "0.8 and 0.9"],
          correct: "0.7 and 0.8",
        },
        {
          prompt: "Step 3: Which choice is closest to 0.75?",
          answers: ["0.7", "0.8", "0.5"],
          correct: "0.8",
        },
      ],
      answers: ["0.7", "0.8", "0.5"],
      correct: "0.8",
      outcome: "NO7",
      indicator: "NO7.03",
      skill: "Decimal benchmarks",
      mistakeIfWrong: "Decimal benchmark comparison error",
      hint: "Use 0.75 as three quarters. Check which choice is closest on a number line.",
      hint2: "0.75 is halfway between 0.7 and 0.8, but 0.8 is one of the closest choices.",
    },
  ],
};

const ALL_QUESTIONS = [...Object.values(QUESTION_BANK).flat(), ...GRADE2_GENERATED_QUESTIONS];
const OUTCOMES = Object.keys(INDICATOR_CATALOG);
const DEFAULT_STUDENT_STATE = {
  studentScreen: "today",
  skill: "fractions",
  questionIndex: 0,
  selected: "",
  multiStepAnswers: {},
  feedback: "",
  hintLevel: 0,
  mistakeCounts: {},
  alerts: [],
  intervention: null,
  correctStreak: 0,
  completedSkills: [],
  simplifiedMode: false,
  practiceQueue: [],
  practiceMode: false,
  practiceStats: {},
  practiceSession: null,
  assessmentMode: false,
  assessmentQueue: [],
  assessmentSession: null,
  assessmentStats: {},
  teacherAssignments: {},
  outcomeStats: {},
  indicatorStats: {},
  completionResult: null,
  questionEdits: {},
  interventionLog: [],
  interventionPlans: [],
  selectedClass: "901",
  rosterState: buildDefaultRosterState(),
  selectedGrade: "G2",
  studentGradeLevels: DEFAULT_STUDENT_GRADE_LEVELS,
  studentAdaptations: buildDefaultAdaptations(),
};

function getSaveKey(student) {
  return `mathAppProgress_${student}`;
}

function getSavedStudentData(student) {
  try {
    const saved = localStorage.getItem(getSaveKey(student));
    if (!saved) return { ...DEFAULT_STUDENT_STATE };
    return { ...DEFAULT_STUDENT_STATE, ...JSON.parse(saved) };
  } catch {
    return { ...DEFAULT_STUDENT_STATE };
  }
}

function getIndicatorSummaryForStudent(indicatorStats, student, outcome) {
  const indicators = INDICATOR_CATALOG[outcome] || [];
  const items = indicators.map((indicator) => {
    const key = `${student}-${indicator}`;
    const data = indicatorStats[key] || {};
    const attempts = data.attempts ?? 0;
    const correct = data.correct ?? 0;
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : data.accuracy ?? 0;
    const mastered = attempts >= 3 && accuracy >= 80;

    return {
      indicator,
      attempts,
      correct,
      accuracy,
      status: mastered ? "Mastered" : attempts === 0 ? "Not Started" : accuracy >= 60 ? "Developing" : "Needs Support",
      mastered,
    };
  });

  const masteredCount = items.filter((item) => item.mastered).length;
  const requiredCount = Math.max(1, Math.ceil(items.length * 0.7));
  const readyForAssessment = items.length > 0 && masteredCount >= requiredCount;

  return {
    outcome,
    title: OUTCOME_TITLES[outcome] || outcome,
    items,
    total: items.length,
    masteredCount,
    requiredCount,
    readyForAssessment,
    status: readyForAssessment ? "Ready for Assessment" : masteredCount > 0 ? "Developing" : items.some((item) => item.attempts > 0) ? "Needs Support" : "Not Started",
    progressLabel: `${masteredCount}/${requiredCount}`,
  };
}

function getAssessmentSummary(assessmentStats, student, outcome) {
  const data = assessmentStats[`${student}-${outcome}`];
  if (!data) {
    return {
      label: "No assessment",
      status: "Not Started",
      attempts: 0,
      lastScore: null,
      history: [],
    };
  }

  return {
    label: `${data.lastScore}%`,
    status: data.status,
    attempts: data.attempts || 0,
    lastScore: data.lastScore,
    history: data.history || [],
    completedAt: data.completedAt,
  };
}

function getOutcomeDisplay(indicatorStats, assessmentStats, student, outcome) {
  const indicator = getIndicatorSummaryForStudent(indicatorStats, student, outcome);
  const assessment = getAssessmentSummary(assessmentStats, student, outcome);
  const passed = assessment.status === "Passed";

  let status = indicator.status;
  if (passed) status = "Mastered";
  if (assessment.status === "Needs Reassessment") status = "Needs Reassessment";

  return {
    ...indicator,
    assessment,
    status,
    isMastered: passed,
    background: passed || indicator.readyForAssessment ? "#dcfce7" : indicator.status === "Developing" ? "#fef3c7" : indicator.status === "Not Started" ? "#f8fafc" : "#ffe4e6",
    color: passed || indicator.readyForAssessment ? "#166534" : indicator.status === "Developing" ? "#92400e" : indicator.status === "Not Started" ? "#64748b" : "#be123c",
    label: passed ? `Passed ${assessment.lastScore}%` : `${indicator.progressLabel} indicators`,
  };
}

function getStudentNextStep(student, indicatorStats, assessmentStats, teacherAssignments) {
  const activeAssignment = teacherAssignments[student];
  if (activeAssignment && activeAssignment.status !== "completed") {
    return `Complete assigned ${activeAssignment.type.toLowerCase()}: ${activeAssignment.target}`;
  }
  if (activeAssignment?.status === "completed") {
    return `Assignment complete: ${activeAssignment.type} ${activeAssignment.target}`;
  }

  for (const outcome of OUTCOMES) {
    const display = getOutcomeDisplay(indicatorStats, assessmentStats, student, outcome);
    if (display.assessment.status === "Needs Reassessment") return `Rebuild ${outcome}, then reassess`;
    if (display.readyForAssessment && display.assessment.status !== "Passed") return `Take ${outcome} assessment`;
  }

  const started = OUTCOMES.map((outcome) => getOutcomeDisplay(indicatorStats, assessmentStats, student, outcome));
  const notMastered = started.filter((item) => item.assessment.status !== "Passed");
  if (notMastered.length === 0) return "Ready for enrichment";

  const weakest = [...notMastered].sort((a, b) => a.masteredCount / a.requiredCount - b.masteredCount / b.requiredCount)[0];
  if (weakest.items.every((item) => item.attempts === 0)) return `Start ${weakest.outcome} practice`;
  return `Build indicators for ${weakest.outcome}`;
}

function getStudentTodayPlan(student, indicatorStats, assessmentStats, teacherAssignments) {
  const activeAssignment = teacherAssignments[student];

  if (activeAssignment?.status === "completed") {
    return {
      title: `Assignment complete: ${activeAssignment.type} ${activeAssignment.target}`,
      focus: activeAssignment.target,
      actionOutcome: activeAssignment.target,
      actionLabel: "Review results",
      steps: [
        `You finished with ${activeAssignment.result?.accuracy ?? "—"}% accuracy.`,
        "Your teacher can now see the completed result.",
        "Check the next recommended outcome when you are ready.",
      ],
    };
  }

  if (activeAssignment) {
    return {
      title: `Finish your teacher assignment: ${activeAssignment.type} ${activeAssignment.target}`,
      focus: activeAssignment.target,
      actionOutcome: activeAssignment.target,
      actionLabel: "Start assigned work",
      steps: [
        "Open the assigned practice or assessment.",
        "Try each question carefully before using hints.",
        "Finish the set so it clears from your dashboard.",
      ],
    };
  }

  const displays = OUTCOMES.map((outcome) => getOutcomeDisplay(indicatorStats, assessmentStats, student, outcome));
  const reassessment = displays.find((item) => item.assessment.status === "Needs Reassessment");
  if (reassessment) {
    return {
      title: `Rebuild confidence in ${reassessment.outcome}`,
      focus: reassessment.outcome,
      actionOutcome: reassessment.outcome,
      actionLabel: "Practice before reassessment",
      steps: [
        "Review the indicators that are not mastered yet.",
        "Complete a short practice set with visual support.",
        "Ask your teacher to reassess when the indicators are ready.",
      ],
    };
  }

  const ready = displays.find((item) => item.readyForAssessment && item.assessment.status !== "Passed");
  if (ready) {
    return {
      title: `You are ready for the ${ready.outcome} assessment`,
      focus: ready.outcome,
      actionOutcome: ready.outcome,
      actionLabel: "Start assessment when assigned",
      steps: [
        "Do one quick warm-up question.",
        "Take the assessment independently.",
        "Aim for 80% or higher to master the outcome.",
      ],
    };
  }

  const notMastered = displays.filter((item) => item.assessment.status !== "Passed");
  if (notMastered.length === 0) {
    return {
      title: "You are ready for enrichment",
      focus: "Challenge work",
      actionOutcome: null,
      actionLabel: "Start challenge work",
      steps: [
        "Review your mastered outcomes.",
        "Try challenge questions that connect outcomes together.",
        "Explain your strategy clearly, not just the answer.",
      ],
    };
  }

  const weakest = [...notMastered].sort((a, b) => a.masteredCount / a.requiredCount - b.masteredCount / b.requiredCount)[0];
  const nextIndicator = weakest.items.find((item) => !item.mastered)?.indicator || weakest.items[0]?.indicator || weakest.outcome;

  return {
    title: `Build indicators for ${weakest.outcome}`,
    focus: nextIndicator,
    actionOutcome: weakest.outcome,
    actionLabel: "Start today's practice",
    steps: [
      `Focus on ${nextIndicator}.`,
      "Use the visual first, then choose your answer.",
      "Get at least 3 attempts with 80% accuracy to master the indicator.",
    ],
  };
}

function getClassAnalytics(students, indicatorStats, assessmentStats, alerts, teacherAssignments) {
  const studentRows = students.map((student) => {
    const outcomes = OUTCOMES.map((outcome) => getOutcomeDisplay(indicatorStats, assessmentStats, student, outcome));
    const readyCount = outcomes.filter((item) => item.readyForAssessment && item.assessment.status !== "Passed").length;
    const masteredCount = outcomes.filter((item) => item.assessment.status === "Passed").length;
    const supportCount = outcomes.filter((item) => item.status === "Needs Support" || item.status === "Needs Reassessment").length;
    const studentAlerts = alerts.filter((alert) => alert.student === student);

    return {
      student,
      outcomes,
      readyCount,
      masteredCount,
      supportCount,
      alerts: studentAlerts.length,
      assignment: teacherAssignments[student] || null,
      nextStep: getStudentNextStep(student, indicatorStats, assessmentStats, teacherAssignments),
    };
  });

  const totalCells = students.length * OUTCOMES.length;
  const masteredCells = studentRows.reduce((sum, row) => sum + row.masteredCount, 0);
  const readyCells = studentRows.reduce((sum, row) => sum + row.readyCount, 0);
  const supportCells = studentRows.reduce((sum, row) => sum + row.supportCount, 0);

  const outcomeRows = OUTCOMES.map((outcome) => {
    const displays = students.map((student) => getOutcomeDisplay(indicatorStats, assessmentStats, student, outcome));
    return {
      outcome,
      title: OUTCOME_TITLES[outcome] || outcome,
      mastered: displays.filter((item) => item.assessment.status === "Passed").length,
      ready: displays.filter((item) => item.readyForAssessment && item.assessment.status !== "Passed").length,
      support: displays.filter((item) => item.status === "Needs Support" || item.status === "Needs Reassessment").length,
      notStarted: displays.filter((item) => item.status === "Not Started").length,
    };
  });

  return {
    studentRows,
    outcomeRows,
    totals: {
      students: students.length,
      masteredPercent: totalCells > 0 ? Math.round((masteredCells / totalCells) * 100) : 0,
      readyCells,
      supportCells,
      alertCount: alerts.length,
    },
  };
}

function getInstructionalGroups(analytics) {
  const groups = {
    assessmentReady: [],
    reteach: [],
    practice: [],
    enrichment: [],
  };

  analytics.studentRows.forEach((row) => {
    if (row.nextStep.includes("assessment") || row.readyCount > 0) {
      groups.assessmentReady.push(row);
      return;
    }

    if (row.supportCount > 0 || row.nextStep.includes("Rebuild")) {
      groups.reteach.push(row);
      return;
    }

    if (row.masteredCount === OUTCOMES.length) {
      groups.enrichment.push(row);
      return;
    }

    groups.practice.push(row);
  });

  return groups;
}

function getReportCardComment(display) {
  if (display.assessment.status === "Passed") {
    return "Outcome mastered through assessment.";
  }

  if (display.assessment.status === "Needs Reassessment") {
    return "Needs reassessment after targeted review.";
  }

  if (display.readyForAssessment) {
    return "Indicator evidence shows readiness for assessment.";
  }

  if (display.status === "Developing") {
    return "Developing; continue short practice cycles.";
  }

  if (display.status === "Needs Support") {
    return "Needs direct support and simplified practice.";
  }

  return "Not enough evidence collected yet.";
}

function getTeacherInsightLines(row) {
  if (!row) return ["No student selected yet."];

  const lines = [];
  const activeAssignment = row.assignment;

  if (activeAssignment?.status === "completed") {
    lines.push(
      `Completed ${activeAssignment.type} ${activeAssignment.target} with ${activeAssignment.result?.accuracy ?? "—"}% accuracy.`
    );
  } else if (activeAssignment) {
    lines.push(`Has assigned ${activeAssignment.type.toLowerCase()} for ${activeAssignment.target}.`);
  }

  const ready = row.outcomes.find(
    (item) => item.readyForAssessment && item.assessment.status !== "Passed"
  );
  const reassess = row.outcomes.find((item) => item.assessment.status === "Needs Reassessment");
  const support = row.outcomes.find(
    (item) => item.status === "Needs Support" || item.status === "Needs Reassessment"
  );
  const developing = row.outcomes.find((item) => item.status === "Developing");
  const passedCount = row.outcomes.filter((item) => item.assessment.status === "Passed").length;

  if (reassess) {
    lines.push(`${reassess.outcome} needs reassessment after a short rebuild cycle.`);
  } else if (ready) {
    lines.push(`Ready for ${ready.outcome} assessment based on indicator evidence.`);
  } else if (support) {
    const weakestIndicator = support.items.find((item) => !item.mastered)?.indicator || support.outcome;
    lines.push(`Needs support with ${support.outcome}, especially ${weakestIndicator}.`);
  } else if (developing) {
    lines.push(`Developing in ${developing.outcome}; keep practice short and targeted.`);
  }

  if (passedCount === row.outcomes.length) {
    lines.push("All listed outcomes are assessed as mastered; move to enrichment.");
  }

  if (row.alerts > 0) {
    lines.push(`${row.alerts} alert${row.alerts === 1 ? "" : "s"} recorded; check recent mistakes before assigning more work.`);
  }

  if (lines.length === 0) {
    lines.push("Start with placement or first practice set to collect evidence.");
  }

  return lines.slice(0, 3);
}


function getStudentConferenceNotes(row) {
  if (!row) {
    return {
      strength: "No student selected yet.",
      concern: "Start with placement or first practice set to collect evidence.",
      nextStep: "Collect evidence with a short practice set.",
      familyNote: "We are beginning to collect evidence for this outcome path.",
    };
  }

  const passed = row.outcomes.find((item) => item.assessment.status === "Passed");
  const ready = row.outcomes.find(
    (item) => item.readyForAssessment && item.assessment.status !== "Passed"
  );
  const reassess = row.outcomes.find((item) => item.assessment.status === "Needs Reassessment");
  const support = row.outcomes.find(
    (item) => item.status === "Needs Support" || item.status === "Needs Reassessment"
  );
  const developing = row.outcomes.find((item) => item.status === "Developing");

  const strength = passed
    ? `${row.student} has demonstrated assessment-level mastery in ${passed.outcome} (${OUTCOME_TITLES[passed.outcome]}).`
    : ready
    ? `${row.student} has enough indicator evidence to try the ${ready.outcome} assessment.`
    : developing
    ? `${row.student} is building consistency in ${developing.outcome} (${OUTCOME_TITLES[developing.outcome]}).`
    : `${row.student} is ready to begin collecting evidence through short practice sets.`;

  const concern = reassess
    ? `${reassess.outcome} needs a short rebuild cycle before reassessment.`
    : support
    ? `${support.outcome} needs direct support, especially with ${support.items.find((item) => !item.mastered)?.indicator || "the next indicator"}.`
    : developing
    ? `${developing.outcome} still needs more attempts before assessment readiness.`
    : "No major concern yet; more evidence is needed.";

  const nextStep = reassess
    ? `Assign targeted practice for ${reassess.outcome}, then retry assessment.`
    : ready
    ? `Assign the ${ready.outcome} assessment.`
    : support
    ? `Use simplified practice or a mini lesson for ${support.outcome}.`
    : developing
    ? `Continue short practice for ${developing.outcome}.`
    : "Start the first outcome practice set.";

  const familyNote = `${strength} Next step: ${nextStep}`;

  return { strength, concern, nextStep, familyNote };
}

function getClassPriorityRows(analytics) {
  return [...analytics.studentRows]
    .map((row) => {
      let priority = 3;
      let label = "Practice";

      if (row.outcomes.some((item) => item.assessment.status === "Needs Reassessment")) {
        priority = 1;
        label = "Reassessment rebuild";
      } else if (row.supportCount > 0 || row.alerts > 0) {
        priority = 1;
        label = "Needs support";
      } else if (row.readyCount > 0) {
        priority = 2;
        label = "Ready to assess";
      } else if (row.masteredCount === OUTCOMES.length) {
        priority = 4;
        label = "Enrichment";
      }

      return { ...row, priority, label, insightLines: getTeacherInsightLines(row) };
    })
    .sort((a, b) => a.priority - b.priority || b.alerts - a.alerts || a.student.localeCompare(b.student));
}


function getWeeklyInterventionPlan(analytics) {
  const priorityRows = getClassPriorityRows(analytics);

  return OUTCOMES.map((outcome) => {
    const rebuild = priorityRows.filter((row) => {
      const display = row.outcomes.find((item) => item.outcome === outcome);
      return display?.assessment.status === "Needs Reassessment" || display?.status === "Needs Support";
    });

    const ready = priorityRows.filter((row) => {
      const display = row.outcomes.find((item) => item.outcome === outcome);
      return display?.readyForAssessment && display?.assessment.status !== "Passed";
    });

    const practice = priorityRows.filter((row) => {
      const display = row.outcomes.find((item) => item.outcome === outcome);
      return display?.status === "Developing" && display?.assessment.status !== "Passed";
    });

    let focus = "Collect more evidence";
    let teacherMove = "Start a short practice cycle and watch which indicator causes errors.";
    let studentNames = [];

    if (rebuild.length > 0) {
      focus = "Teacher table / rebuild";
      teacherMove = "Use a 5-8 minute mini lesson, then assign targeted practice before reassessment.";
      studentNames = rebuild.map((row) => row.student);
    } else if (ready.length > 0) {
      focus = "Assessment ready";
      teacherMove = "Run the outcome assessment for these students while others continue practice.";
      studentNames = ready.map((row) => row.student);
    } else if (practice.length > 0) {
      focus = "Practice cycle";
      teacherMove = "Assign a short set and look for 3 attempts with at least 80% accuracy.";
      studentNames = practice.map((row) => row.student);
    }

    return {
      outcome,
      title: OUTCOME_TITLES[outcome] || outcome,
      focus,
      teacherMove,
      studentNames,
    };
  });
}


function getInterventionImpactRows(students, interventionLog, practiceStats, assessmentStats, indicatorStats) {
  return students.map((student) => {
    const studentLogs = interventionLog.filter((item) => item.student === student);
    const recent = studentLogs[0] || null;

    const completedPractice = Object.entries(practiceStats || {})
      .filter(([key]) => key.startsWith(`${student}-`))
      .map(([key, data]) => ({
        target: key.replace(`${student}-`, ""),
        accuracy: data.accuracy ?? null,
        attempts: data.attempts ?? 0,
        status: data.status || "In progress",
      }))
      .sort((a, b) => (b.attempts || 0) - (a.attempts || 0));

    const completedAssessments = Object.entries(assessmentStats || {})
      .filter(([key]) => key.startsWith(`${student}-`))
      .map(([key, data]) => ({
        target: key.replace(`${student}-`, ""),
        accuracy: data.lastScore ?? null,
        attempts: data.attempts ?? 0,
        status: data.status || "Not Started",
      }))
      .sort((a, b) => (b.attempts || 0) - (a.attempts || 0));

    const weakIndicators = Object.entries(indicatorStats || {})
      .filter(([key, data]) => key.startsWith(`${student}-`) && (data.accuracy ?? 0) < 80 && (data.attempts ?? 0) > 0)
      .map(([key, data]) => ({
        indicator: key.replace(`${student}-`, ""),
        accuracy: data.accuracy ?? 0,
        attempts: data.attempts ?? 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    const latestPractice = completedPractice[0] || null;
    const latestAssessment = completedAssessments[0] || null;

    let impact = "No intervention evidence yet";
    let nextMove = "Collect a short practice sample.";
    let tone = "neutral";

    if (latestAssessment?.status === "Passed") {
      impact = `Assessment passed at ${latestAssessment.accuracy}%.`;
      nextMove = "Move to the next outcome or enrichment.";
      tone = "positive";
    } else if (latestAssessment?.status === "Needs Reassessment") {
      impact = `Assessment needs reassessment at ${latestAssessment.accuracy}%.`;
      nextMove = `Rebuild ${latestAssessment.target} with targeted practice before retrying.`;
      tone = "urgent";
    } else if (latestPractice?.accuracy >= 80) {
      impact = `Practice improved to ${latestPractice.accuracy}%.`;
      nextMove = `Consider assessment readiness for ${latestPractice.target}.`;
      tone = "positive";
    } else if (latestPractice) {
      impact = `Practice accuracy is ${latestPractice.accuracy ?? "—"}%.`;
      nextMove = weakIndicators[0]
        ? `Reteach ${weakIndicators[0].indicator}, then assign another short set.`
        : `Repeat a shorter practice cycle for ${latestPractice.target}.`;
      tone = "watch";
    } else if (recent) {
      impact = `Recent move recorded: ${recent.type}.`;
      nextMove = "Check for practice or assessment evidence after this move.";
      tone = "watch";
    }

    return {
      student,
      recent,
      impact,
      nextMove,
      tone,
      weakIndicator: weakIndicators[0] || null,
      logCount: studentLogs.length,
    };
  });
}

function getCurriculumIndicatorText(indicatorId) {
  const outcomeId = indicatorId?.split(".")?.[0];
  return GRADE2_CURRICULUM?.[outcomeId]?.indicators?.[indicatorId] || indicatorId || "Unlisted indicator";
}

function getInterventionReferralData(students, indicatorStats, assessmentStats, alerts, threshold = 60) {
  const groups = {};

  function ensureGroup(outcome, indicator) {
    const outcomeId = outcome || indicator?.split(".")?.[0] || "Other";
    const indicatorId = indicator || `${outcomeId}.general`;
    if (!groups[outcomeId]) {
      groups[outcomeId] = {
        outcome: outcomeId,
        title: OUTCOME_TITLES[outcomeId] || GRADE2_CURRICULUM?.[outcomeId]?.outcome || outcomeId,
        indicators: {},
      };
    }
    if (!groups[outcomeId].indicators[indicatorId]) {
      groups[outcomeId].indicators[indicatorId] = {
        indicator: indicatorId,
        text: getCurriculumIndicatorText(indicatorId),
        students: [],
      };
    }
    return groups[outcomeId].indicators[indicatorId];
  }

  Object.entries(indicatorStats || {}).forEach(([key, data]) => {
    const matchingStudent = students.find((student) => key.startsWith(`${student}-`));
    if (!matchingStudent) return;

    const indicator = key.replace(`${matchingStudent}-`, "");
    const attempts = data?.attempts ?? 0;
    const accuracy = data?.accuracy ?? 0;

    if (attempts > 0 && accuracy < threshold) {
      const outcome = indicator.split(".")[0];
      ensureGroup(outcome, indicator).students.push({
        student: matchingStudent,
        accuracy,
        attempts,
        reason: `Indicator accuracy below ${threshold}%`,
      });
    }
  });

  Object.entries(assessmentStats || {}).forEach(([key, data]) => {
    const matchingStudent = students.find((student) => key.startsWith(`${student}-`));
    if (!matchingStudent) return;
    if (data?.status !== "Needs Reassessment") return;

    const outcome = key.replace(`${matchingStudent}-`, "");
    ensureGroup(outcome, `${outcome}.assessment`).students.push({
      student: matchingStudent,
      accuracy: data.lastScore ?? "—",
      attempts: data.attempts ?? 0,
      reason: "Assessment needs reassessment",
    });
  });

  (alerts || []).forEach((alert) => {
    if (!alert?.student) return;
    const outcome = alert.outcome || "Other";
    ensureGroup(outcome, `${outcome}.alert`).students.push({
      student: alert.student,
      accuracy: "—",
      attempts: alert.frequency ?? "—",
      reason: alert.issue || "Repeated alert",
    });
  });

  const outcomeGroups = Object.values(groups)
    .map((group) => ({
      ...group,
      indicators: Object.values(group.indicators).map((indicatorGroup) => ({
        ...indicatorGroup,
        students: indicatorGroup.students.filter(
          (student, index, array) =>
            index === array.findIndex(
              (item) => item.student === student.student && item.reason === student.reason
            )
        ),
      })),
    }))
    .filter((group) => group.indicators.some((indicator) => indicator.students.length > 0))
    .sort((a, b) => a.outcome.localeCompare(b.outcome));

  const studentCount = new Set(
    outcomeGroups.flatMap((group) =>
      group.indicators.flatMap((indicator) => indicator.students.map((item) => item.student))
    )
  ).size;

  const itemCount = outcomeGroups.reduce(
    (total, group) => total + group.indicators.reduce((sum, indicator) => sum + indicator.students.length, 0),
    0
  );

  return { outcomeGroups, studentCount, itemCount, threshold };
}

function buildInterventionReferralEmail(referralData, threshold = 60) {
  const date = new Date().toLocaleDateString();
  const lines = [
    `Math Intervention Catch-Up List`,
    `Date: ${date}`,
    `Criteria: students below ${threshold}% on indicator evidence, needing reassessment, or flagged by repeated alerts.`,
    "",
  ];

  if (!referralData.outcomeGroups.length) {
    lines.push("No students currently meet the intervention referral criteria.");
  } else {
    referralData.outcomeGroups.forEach((group) => {
      lines.push(`${group.outcome} — ${group.title}`);
      group.indicators.forEach((indicator) => {
        lines.push(`  ${indicator.indicator} — ${indicator.text}`);
        indicator.students.forEach((item) => {
          lines.push(
            `  - ${item.student}: ${item.accuracy}% accuracy, ${item.attempts} attempt(s). Reason: ${item.reason}.`
          );
        });
        lines.push("");
      });
    });
  }

  lines.push("Suggested support:");
  lines.push("- Pull a short small group by outcome/indicator.");
  lines.push("- Use concrete or visual models first.");
  lines.push("- Recheck with a short targeted practice set before reassessment.");
  lines.push("");
  lines.push("Thanks!");

  return lines.join("\n");
}
function buildFamilyCommunicationMessage({ row, conferenceNotes, tone = "simple", customNote = "", interventionPlans = [], interventionLog = [] }) {
  if (!row) {
    return "No student data is available yet.";
  }

  const firstName = row.student.split(" ")[0];
  const passed = row.outcomes.filter((item) => item.assessment.status === "Passed");
  const ready = row.outcomes.find((item) => item.readyForAssessment && item.assessment.status !== "Passed");
  const reassess = row.outcomes.find((item) => item.assessment.status === "Needs Reassessment");
  const support = row.outcomes.find((item) => item.status === "Needs Support" || item.status === "Needs Reassessment");
  const developing = row.outcomes.find((item) => item.status === "Developing");
  const focus = reassess || support || developing || ready || row.outcomes.find((item) => item.assessment.status !== "Passed") || row.outcomes[0];
  const weakIndicator = focus?.items?.find((item) => !item.mastered && item.attempts > 0) || focus?.items?.find((item) => !item.mastered);
  const indicatorText = weakIndicator ? getCurriculumIndicatorText(weakIndicator.indicator) : "the next math skill";
  const recentPlans = (interventionPlans || []).filter((plan) => plan.student === row.student).slice(-2);
  const recentLogs = (interventionLog || []).filter((entry) => entry.student === row.student).slice(-2);

  const strength = conferenceNotes?.strength || `${firstName} is continuing to build math confidence through short practice tasks.`;
  const focusArea = reassess
    ? `${focus.outcome} needs a short review before reassessment.`
    : support
    ? `${focus.outcome} needs more support, especially with ${weakIndicator?.indicator || "the next indicator"}: ${indicatorText}.`
    : developing
    ? `${focus.outcome} is developing and needs a few more accurate attempts before assessment readiness.`
    : ready
    ? `${focus.outcome} is ready for an assessment attempt.`
    : passed.length > 0
    ? `${firstName} has already mastered ${passed.map((item) => item.outcome).join(", ")}.`
    : "We are still collecting evidence through short practice tasks.";

  const nextStep = reassess
    ? `We will use a short review cycle, then reassess ${focus.outcome}.`
    : support
    ? `We will practise ${weakIndicator?.indicator || focus.outcome} using visual and concrete models.`
    : ready
    ? `The next step is to complete the ${focus.outcome} assessment.`
    : developing
    ? `The next step is more short, targeted practice for ${focus.outcome}.`
    : "The next step is to continue building evidence through practice.";

  const homeSupport = weakIndicator
    ? `At home, you can help by asking ${firstName} to explain the strategy out loud and show the answer with objects, drawings, or a simple model.`
    : `At home, you can help by asking ${firstName} to explain math thinking out loud during everyday counting, measuring, or sorting tasks.`;

  const interventionLine = recentPlans.length > 0
    ? `Recent support: ${recentPlans.map((plan) => `${plan.type} for ${plan.indicator || plan.outcome}`).join("; ")}.`
    : recentLogs.length > 0
    ? `Recent support: ${recentLogs.map((entry) => `${entry.type} for ${entry.target || entry.outcome || "math"}`).join("; ")}.`
    : "Recent support: we will continue monitoring progress and add support as needed.";

  const extra = customNote.trim() ? `\n\nTeacher note:\n${customNote.trim()}` : "";

  if (tone === "bullet") {
    return [
      `Hi,`,
      "",
      `Here is a quick math update for ${row.student}:`,
      "",
      `Strength: ${strength}`,
      `Focus area: ${focusArea}`,
      `Next step: ${nextStep}`,
      `How you can help: ${homeSupport}`,
      interventionLine,
      extra,
      "",
      `Thank you,`,
    ].join("\n");
  }

  if (tone === "formal") {
    return [
      `Hello,`,
      "",
      `I wanted to share a brief update on ${row.student}'s progress in math. ${strength}`,
      "",
      `At this time, our main focus is: ${focusArea}`,
      "",
      `${nextStep} ${homeSupport}`,
      "",
      interventionLine,
      extra,
      "",
      `Thank you,`,
    ].join("\n");
  }

  return [
    `Hi,`,
    "",
    `Here is a quick update on ${firstName}'s math learning.`,
    "",
    `Strength: ${strength}`,
    "",
    `Focus Area: ${focusArea}`,
    "",
    `Next Step: ${nextStep}`,
    "",
    `How you can help: ${homeSupport}`,
    "",
    interventionLine,
    extra,
    "",
    `Thank you,`,
  ].join("\n");
}

function getLocalISODate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function formatISODate(isoDate) {
  if (!isoDate) return "No date";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function getCurrentIndicatorAccuracy(indicatorStats, student, indicator) {
  if (!student || !indicator) return null;
  const data = indicatorStats?.[`${student}-${indicator}`];
  if (!data || (data.attempts ?? 0) === 0) return null;
  return data.accuracy ?? Math.round(((data.correct ?? 0) / (data.attempts || 1)) * 100);
}

function getInterventionImpact(plan, indicatorStats) {
  const before = typeof plan.beforeAccuracy === "number" ? plan.beforeAccuracy : null;
  const after = getCurrentIndicatorAccuracy(indicatorStats, plan.student, plan.indicator);

  if (before === null || after === null) {
    return { label: "Waiting for evidence", change: null, after };
  }

  const change = after - before;
  if (change >= 10) return { label: "Improved", change, after };
  if (change <= -10) return { label: "Declined", change, after };
  return { label: "No major change", change, after };
}

function getDueInterventionPlans(interventionPlans) {
  const today = getLocalISODate(0);
  return (interventionPlans || [])
    .filter((plan) => plan.status !== "Reviewed" && plan.followUpDateISO && plan.followUpDateISO <= today)
    .sort((a, b) => a.followUpDateISO.localeCompare(b.followUpDateISO));
}

function getSuggestedOutcomeForRow(row, preferAssessment = false) {
  if (!row) return OUTCOMES[0];

  const reassess = row.outcomes.find((item) => item.assessment.status === "Needs Reassessment");
  if (reassess) return reassess.outcome;

  if (preferAssessment) {
    const ready = row.outcomes.find((item) => item.readyForAssessment && item.assessment.status !== "Passed");
    if (ready) return ready.outcome;
  }

  const support = row.outcomes.find((item) => item.status === "Needs Support" || item.status === "Developing");
  if (support) return support.outcome;

  const notPassed = row.outcomes.find((item) => item.assessment.status !== "Passed");
  return notPassed?.outcome || row.outcomes[0]?.outcome || OUTCOMES[0];
}

export default function App() {
  const [mode, setMode] = useState("student");
  const [currentStudent, setCurrentStudent] = useState("Ava P.");
  const [hasLoadedSave, setHasLoadedSave] = useState(false);

  const [studentScreen, setStudentScreen] = useState(DEFAULT_STUDENT_STATE.studentScreen);
  const [skill, setSkill] = useState(DEFAULT_STUDENT_STATE.skill);
  const [questionIndex, setQuestionIndex] = useState(DEFAULT_STUDENT_STATE.questionIndex);
  const [selected, setSelected] = useState(DEFAULT_STUDENT_STATE.selected);
  const [multiStepAnswers, setMultiStepAnswers] = useState(DEFAULT_STUDENT_STATE.multiStepAnswers);
  const [feedback, setFeedback] = useState(DEFAULT_STUDENT_STATE.feedback);
  const [hintLevel, setHintLevel] = useState(DEFAULT_STUDENT_STATE.hintLevel);
  const [mistakeCounts, setMistakeCounts] = useState(DEFAULT_STUDENT_STATE.mistakeCounts);
  const [alerts, setAlerts] = useState(DEFAULT_STUDENT_STATE.alerts);
  const [intervention, setIntervention] = useState(DEFAULT_STUDENT_STATE.intervention);
  const [correctStreak, setCorrectStreak] = useState(DEFAULT_STUDENT_STATE.correctStreak);
  const [adaptiveLevel, setAdaptiveLevel] = useState("normal");
  const [recentResults, setRecentResults] = useState([]);
  const [completedSkills, setCompletedSkills] = useState(DEFAULT_STUDENT_STATE.completedSkills);
  const [simplifiedMode, setSimplifiedMode] = useState(DEFAULT_STUDENT_STATE.simplifiedMode);
  const [practiceQueue, setPracticeQueue] = useState(DEFAULT_STUDENT_STATE.practiceQueue);
  const [practiceMode, setPracticeMode] = useState(DEFAULT_STUDENT_STATE.practiceMode);
  const [practiceStats, setPracticeStats] = useState(DEFAULT_STUDENT_STATE.practiceStats);
  const [practiceSession, setPracticeSession] = useState(DEFAULT_STUDENT_STATE.practiceSession);
  const [assessmentMode, setAssessmentMode] = useState(DEFAULT_STUDENT_STATE.assessmentMode);
  const [assessmentQueue, setAssessmentQueue] = useState(DEFAULT_STUDENT_STATE.assessmentQueue);
  const [assessmentSession, setAssessmentSession] = useState(DEFAULT_STUDENT_STATE.assessmentSession);
  const [assessmentStats, setAssessmentStats] = useState(DEFAULT_STUDENT_STATE.assessmentStats);
  const [teacherAssignments, setTeacherAssignments] = useState(DEFAULT_STUDENT_STATE.teacherAssignments);
  const [outcomeStats, setOutcomeStats] = useState(DEFAULT_STUDENT_STATE.outcomeStats);
  const [indicatorStats, setIndicatorStats] = useState(DEFAULT_STUDENT_STATE.indicatorStats);
  const [completionResult, setCompletionResult] = useState(DEFAULT_STUDENT_STATE.completionResult);
  const [questionEdits, setQuestionEdits] = useState(DEFAULT_STUDENT_STATE.questionEdits);
  const [interventionLog, setInterventionLog] = useState(DEFAULT_STUDENT_STATE.interventionLog);
  const [interventionPlans, setInterventionPlans] = useState(DEFAULT_STUDENT_STATE.interventionPlans);
  const [rosterState, setRosterState] = useState(DEFAULT_STUDENT_STATE.rosterState);
  const [selectedClass, setSelectedClass] = useState(DEFAULT_STUDENT_STATE.selectedClass);
  const [selectedGrade, setSelectedGrade] = useState(DEFAULT_STUDENT_STATE.selectedGrade);
  const [studentGradeLevels, setStudentGradeLevels] = useState(DEFAULT_STUDENT_STATE.studentGradeLevels);
  const [studentAdaptations, setStudentAdaptations] = useState(DEFAULT_STUDENT_STATE.studentAdaptations);
  const [classSnapshot, setClassSnapshot] = useState({});
  const [activeTeacherSection, setActiveTeacherSection] = useState("teacher-section-home");

  const allRosterStudents = getAllStudentsFromRoster(rosterState);
  const visibleStudents = getClassStudentsFromRoster(rosterState, selectedClass);
  const currentAdaptations = studentAdaptations[currentStudent] || buildDefaultAdaptations()[currentStudent] || {};
  const currentStudentGrade = studentGradeLevels[currentStudent] || selectedGrade;

  function applyStudentData(data) {
    setStudentScreen(data.studentScreen ?? "today");
    setSkill(data.skill ?? "fractions");
    setQuestionIndex(data.questionIndex ?? 0);
    setSelected(data.selected ?? "");
    setMultiStepAnswers(data.multiStepAnswers ?? {});
    setFeedback(data.feedback ?? "");
    setHintLevel(data.hintLevel ?? 0);
    setMistakeCounts(data.mistakeCounts ?? {});
    setAlerts(data.alerts ?? []);
    setIntervention(data.intervention ?? null);
    setCorrectStreak(data.correctStreak ?? 0);
    setCompletedSkills(data.completedSkills ?? []);
    setSimplifiedMode(data.simplifiedMode ?? false);
    setPracticeQueue(data.practiceQueue ?? []);
    setPracticeMode(data.practiceMode ?? false);
    setPracticeStats(data.practiceStats ?? {});
    setPracticeSession(data.practiceSession ?? null);
    setAssessmentMode(data.assessmentMode ?? false);
    setAssessmentQueue(data.assessmentQueue ?? []);
    setAssessmentSession(data.assessmentSession ?? null);
    setAssessmentStats(data.assessmentStats ?? {});
    setTeacherAssignments(data.teacherAssignments ?? {});
    setOutcomeStats(data.outcomeStats ?? {});
    setIndicatorStats(data.indicatorStats ?? {});
    setCompletionResult(data.completionResult ?? null);
    setQuestionEdits(data.questionEdits ?? {});
    setInterventionLog(data.interventionLog ?? []);
    setInterventionPlans(data.interventionPlans ?? []);
    setRosterState(data.rosterState ?? buildDefaultRosterState());
    setSelectedClass(data.selectedClass ?? "901");
    setSelectedGrade(data.selectedGrade ?? "G2");
    setStudentGradeLevels(data.studentGradeLevels ?? DEFAULT_STUDENT_GRADE_LEVELS);
    setStudentAdaptations(data.studentAdaptations ?? buildDefaultAdaptations());
  }

  function getCurrentStateForSave() {
    return {
      studentScreen,
      skill,
      questionIndex,
      selected,
      multiStepAnswers,
      feedback,
      hintLevel,
      mistakeCounts,
      alerts,
      intervention,
      correctStreak,
      completedSkills,
      simplifiedMode,
      practiceQueue,
      practiceMode,
      practiceStats,
      practiceSession,
      assessmentMode,
      assessmentQueue,
      assessmentSession,
      assessmentStats,
      teacherAssignments,
      outcomeStats,
      indicatorStats,
      completionResult,
      questionEdits,
      interventionLog,
      interventionPlans,
      rosterState,
      selectedClass,
      selectedGrade,
      studentGradeLevels,
      studentAdaptations,
    };
  }

  function refreshClassSnapshot() {
    const snapshot = {};
    allRosterStudents.forEach((student) => {
      snapshot[student] = student === currentStudent ? getCurrentStateForSave() : getSavedStudentData(student);
    });
    setClassSnapshot(snapshot);
  }

  useEffect(() => {
    if (!visibleStudents.includes(currentStudent)) {
      setCurrentStudent(visibleStudents[0] || STUDENTS[0]);
    }
  }, [selectedClass, visibleStudents, currentStudent, allRosterStudents]);

  useEffect(() => {
    setHasLoadedSave(false);
    applyStudentData(getSavedStudentData(currentStudent));
    setHasLoadedSave(true);
  }, [currentStudent]);

  useEffect(() => {
    if (!hasLoadedSave) return;
    const currentState = getCurrentStateForSave();
    localStorage.setItem(getSaveKey(currentStudent), JSON.stringify(currentState));
    const snapshot = {};
    STUDENTS.forEach((student) => {
      snapshot[student] = student === currentStudent ? currentState : getSavedStudentData(student);
    });
    setClassSnapshot(snapshot);
  }, [
    hasLoadedSave,
    currentStudent,
    studentScreen,
    skill,
    questionIndex,
    selected,
    multiStepAnswers,
    feedback,
    hintLevel,
    mistakeCounts,
    alerts,
    intervention,
    correctStreak,
    completedSkills,
    simplifiedMode,
    practiceQueue,
    practiceMode,
    practiceStats,
    practiceSession,
    assessmentMode,
    assessmentQueue,
    assessmentSession,
    assessmentStats,
    teacherAssignments,
    outcomeStats,
    indicatorStats,
    completionResult,
    questionEdits,
    interventionLog,
    interventionPlans,
    rosterState,
    selectedClass,
    selectedGrade,
    studentGradeLevels,
    studentAdaptations,
  ]);

  const effectiveGrade = currentAdaptations?.lowerGradeWork
    ? currentAdaptations.gradeOverride || currentStudentGrade || selectedGrade
    : currentStudentGrade || selectedGrade;

  const activeAllQuestions = useMemo(() => {
    return getQuestionsForGrade(effectiveGrade, questionEdits);
  }, [questionEdits, effectiveGrade]);

  const weakOutcomeQuestions = useMemo(() => {
    const studentOutcomes = Object.entries(outcomeStats)
      .filter(([key]) => key.startsWith(`${currentStudent}-`))
      .sort((a, b) => (a[1].accuracy ?? 0) - (b[1].accuracy ?? 0));

    if (studentOutcomes.length === 0) return null;

    const weakestOutcome = studentOutcomes[0][0].replace(`${currentStudent}-`, "");
    const weakestData = outcomeStats[`${currentStudent}-${weakestOutcome}`];
    const outcomeQuestions = activeAllQuestions.filter((q) => q.outcome === weakestOutcome);
    if (outcomeQuestions.length === 0) return null;

    let targetDifficulty = "normal";
    if ((weakestData?.accuracy ?? 0) < 60) targetDifficulty = "easy";
    if ((weakestData?.accuracy ?? 0) >= 80) targetDifficulty = "challenge";

    const easy = outcomeQuestions.filter((q) => (q.difficulty || "normal") === "easy");
    const normal = outcomeQuestions.filter((q) => (q.difficulty || "normal") === "normal");
    const challenge = outcomeQuestions.filter((q) => (q.difficulty || "normal") === "challenge");

    if (targetDifficulty === "easy") return [...easy, ...normal.slice(0, 1), ...challenge.slice(0, 1)];
    if (targetDifficulty === "challenge") return [...challenge, ...normal.slice(0, 1)];
    return [...normal, ...easy.slice(0, 1), ...challenge.slice(0, 1)];
  }, [currentStudent, outcomeStats, activeAllQuestions]);

  const generatedSkillQuestions = useMemo(() => {
    return buildSkillQuestionSet(skill, activeAllQuestions, 5, adaptiveLevel);
  }, [skill, activeAllQuestions, adaptiveLevel]);

  const questions =
  assessmentMode && assessmentQueue.length > 0
    ? assessmentQueue
    : practiceMode && practiceQueue.length > 0
    ? practiceQueue
    : weakOutcomeQuestions || generatedSkillQuestions || QUESTION_BANK[skill] || activeAllQuestions.filter((q) => q.outcome === "N01").slice(0, 6) || [];
  const question = questions[questionIndex] ?? questions[0] ?? null;
  const currentAssignment = teacherAssignments[currentStudent];
  const currentNextStep = getStudentNextStep(currentStudent, indicatorStats, assessmentStats, teacherAssignments);
  const currentTodayPlan = getStudentTodayPlan(currentStudent, indicatorStats, assessmentStats, teacherAssignments);

  function addInterventionLog(entry) {
    const logItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      student: entry.student || currentStudent,
      type: entry.type || "Teacher Move",
      target: entry.target || entry.outcome || "General",
      action: entry.action || "Intervention recorded",
      note: entry.note || "",
      source: entry.source || "Teacher",
      status: entry.status || "Open",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    setInterventionLog((prev) => [logItem, ...prev].slice(0, 100));
  }


  function scheduleInterventionPlan(planInput) {
    const followUpDays = Number(planInput.followUpDays) || 3;
    const indicator = planInput.indicator || `${planInput.outcome}.general`;
    const beforeAccuracy = getCurrentIndicatorAccuracy(indicatorStats, planInput.student, indicator);
    const plan = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      student: planInput.student,
      outcome: planInput.outcome || indicator.split(".")[0] || "General",
      indicator,
      indicatorText: planInput.indicatorText || getCurriculumIndicatorText(indicator),
      type: planInput.type || "Small Group",
      notes: planInput.notes || "Short targeted support using visual/concrete models.",
      status: "Scheduled",
      createdAtISO: getLocalISODate(0),
      scheduledDateISO: getLocalISODate(0),
      followUpDateISO: getLocalISODate(followUpDays),
      beforeAccuracy,
      afterAccuracy: null,
      impact: "Waiting for evidence",
    };

    setInterventionPlans((prev) => [plan, ...prev].slice(0, 150));
    addInterventionLog({
      student: plan.student,
      type: "Intervention Scheduled",
      target: `${plan.outcome} ${plan.indicator}`,
      action: `${plan.type} scheduled; follow-up ${formatISODate(plan.followUpDateISO)}`,
      note: plan.notes,
      source: "Referral Planner",
      status: "Scheduled",
    });
  }

  function markInterventionReviewed(planId) {
    setInterventionPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        const impact = getInterventionImpact(plan, indicatorStats);
        const updated = {
          ...plan,
          status: "Reviewed",
          reviewedAtISO: getLocalISODate(0),
          afterAccuracy: impact.after,
          impact: impact.label,
          impactChange: impact.change,
        };

        addInterventionLog({
          student: updated.student,
          type: "Intervention Reviewed",
          target: `${updated.outcome} ${updated.indicator}`,
          action: `Follow-up reviewed: ${updated.impact}`,
          note:
            updated.impactChange === null
              ? "More evidence is needed before impact can be measured."
              : `Change from baseline: ${updated.impactChange > 0 ? "+" : ""}${updated.impactChange} percentage points.`,
          source: "Referral Planner",
          status: "Reviewed",
        });

        return updated;
      })
    );
  }

  function getCurrentOutcomeMastery() {
        if (!question) {
      return {
        attempts: 0,
        accuracy: 0,
        status: "Not Started",
        mastered: false,
        indicatorSummary: {
          masteredCount: 0,
          requiredCount: 1,
          items: [],
        },
      };
    }
    const indicatorSummary = getIndicatorSummaryForStudent(indicatorStats, currentStudent, question.outcome);
    return {
      attempts: indicatorSummary.items.reduce((total, item) => total + item.attempts, 0),
      accuracy: indicatorSummary.total > 0 ? Math.round((indicatorSummary.masteredCount / indicatorSummary.total) * 100) : 0,
      status: indicatorSummary.status,
      mastered: indicatorSummary.readyForAssessment,
      indicatorSummary,
    };
  }

  function findNextUnmasteredSkill() {
    const skillOrder = ["fractions", "decimals"];
    for (const skillName of skillOrder) {
      const firstQuestion = QUESTION_BANK[skillName][0];
      const summary = getIndicatorSummaryForStudent(indicatorStats, currentStudent, firstQuestion.outcome);
      const assessment = getAssessmentSummary(assessmentStats, currentStudent, firstQuestion.outcome);
      if (assessment.status !== "Passed" && !summary.readyForAssessment) return skillName;
    }
    return null;
  }

  function addTeacherAlert(q) {
    const key = `${currentStudent}-${q.skill}`;
    setMistakeCounts((prev) => {
      const newCount = (prev[key] || 0) + 1;
      const updated = { ...prev, [key]: newCount };

      if (newCount === 3) {
        const newAlert = {
          student: currentStudent,
          outcome: q.outcome,
          skill: q.skill,
          issue: q.mistakeIfWrong,
          frequency: newCount,
          intervention: "Mini Lesson Assigned",
          time: new Date().toLocaleTimeString(),
        };
        setAlerts((old) => [newAlert, ...old]);
        setIntervention({ type: "mini_lesson", message: "I noticed this is tricky, so I’m opening a quick mini lesson to help." });
        setStudentScreen("mini");
      }

      return updated;
    });
  }
  if (!question) {
    return (
      <div style={styles.main}>
        <Card title="Loading Question">
          <p>No question is available yet.</p>
        </Card>
      </div>
    );
  }
  function recordAdaptiveResult(isCorrect) {
    setRecentResults((prev) => {
      const updated = [...prev, isCorrect].slice(-3);
      const lastTwo = updated.slice(-2);

      if (lastTwo.length === 2 && lastTwo.every(Boolean)) {
        setAdaptiveLevel("challenge");
      } else if (updated.length === 3 && updated.every((result) => !result)) {
        setAdaptiveLevel("easy");
      } else {
        setAdaptiveLevel("normal");
      }

      return updated;
    });
  }

  function checkAnswer(answerOverride = null) {
        if (!question) return;

    const answerToCheck = answerOverride ?? selected;
    const multiStepToCheck = answerOverride && typeof answerOverride === "object" ? answerOverride : multiStepAnswers;

    if (question.type === "multi-step" ? Object.keys(multiStepToCheck).length < question.steps.length : !answerToCheck) return;

    const isCorrect = question.type === "multi-step"
      ? question.steps.every((step, index) => multiStepToCheck[index] === step.correct)
      : answerToCheck === question.correct;

    if (!isCorrect && hintLevel === 0) {
      setHintLevel(1);
      setFeedback(`💡 Hint 1: ${question.hint || "Try using the visual model first."}`);
      return;
    }

    if (!isCorrect && hintLevel === 1) {
      setHintLevel(2);
      setFeedback(`💡 Hint 2: ${question.hint2 || "Look carefully at the key numbers in the question."}`);
      return;
    }

    if (feedback && hintLevel === 0) return;

    recordAdaptiveResult(isCorrect);

    const outcomeKey = `${currentStudent}-${question.outcome}`;
    const indicatorKey = `${currentStudent}-${question.indicator || `${question.outcome}.01`}`;

    setOutcomeStats((prev) => {
      const current = prev[outcomeKey] || { attempts: 0, correct: 0, alerted: false };
      const attempts = current.attempts + 1;
      const correct = current.correct + (isCorrect ? 1 : 0);
      const accuracy = Math.round((correct / attempts) * 100);
      const shouldAlert = attempts >= 5 && accuracy < 60 && !current.alerted;

      if (shouldAlert) {
        setAlerts((old) => [
          {
            student: currentStudent,
            outcome: question.outcome,
            skill: question.skill,
            issue: "Low accuracy on outcome",
            frequency: attempts,
            intervention: "Auto Targeted Practice Assigned",
            time: new Date().toLocaleTimeString(),
          },
          ...old,
        ]);

        const targetedQuestions = buildPracticeQuestionSet(question.outcome, activeAllQuestions, skill, 5, adaptiveLevel)
        const practiceKey = `${currentStudent}-${question.outcome}`;
        setPracticeStats((old) => ({ ...old, [practiceKey]: { before: mistakeCounts[practiceKey] || 0, after: null, improvement: null } }));
        setPracticeSession({ key: practiceKey, skill: question.outcome, attempts: 0, correct: 0, wrong: 0 });
        setPracticeQueue(targetedQuestions);
        setPracticeMode(true);
        setQuestionIndex(0);
        setIntervention({ type: "targeted_practice_auto", message: "I noticed this outcome is still tricky. I’m starting targeted practice now." });
        addInterventionLog({
          student: currentStudent,
          type: "Auto Intervention",
          target: question.outcome,
          action: "Auto targeted practice started",
          note: `${attempts} attempts with ${accuracy}% accuracy triggered support.`,
          source: "System",
          status: "In Progress",
        });
        setStudentScreen("lesson");
      }

      return {
        ...prev,
        [outcomeKey]: {
          attempts,
          correct,
          accuracy,
          status: accuracy >= 80 ? "Mastered" : accuracy >= 60 ? "Developing" : "Needs Support",
          alerted: current.alerted || shouldAlert,
        },
      };
    });

    setIndicatorStats((prev) => {
      const current = prev[indicatorKey] || { attempts: 0, correct: 0 };
      const attempts = current.attempts + 1;
      const correct = current.correct + (isCorrect ? 1 : 0);
      const accuracy = Math.round((correct / attempts) * 100);
      return {
        ...prev,
        [indicatorKey]: {
          attempts,
          correct,
          accuracy,
          status: attempts >= 3 && accuracy >= 80 ? "Mastered" : attempts === 0 ? "Not Started" : accuracy >= 60 ? "Developing" : "Needs Support",
        },
      };
    });

    if (practiceMode) {
      setPracticeSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attempts: (prev.attempts || 0) + 1,
          correct: (prev.correct || 0) + (isCorrect ? 1 : 0),
          wrong: (prev.wrong || 0) + (isCorrect ? 0 : 1),
        };
      });
    }

    if (assessmentMode) {
      setAssessmentSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: (prev.total || 0) + 1,
          correct: (prev.correct || 0) + (isCorrect ? 1 : 0),
        };
      });
    }

    if (isCorrect) {
      const nextStreak = correctStreak + 1;
      setCorrectStreak(nextStreak);
      const mastery = getCurrentOutcomeMastery();
      setFeedback(`✅ Correct! Next step: ${currentNextStep}. Indicator progress: ${mastery.indicatorSummary.masteredCount}/${mastery.indicatorSummary.requiredCount}.`);
      setHintLevel(0);
    } else {
      setCorrectStreak(0);
      setFeedback(`❌ Not quite. The answer is ${question.correct}.`);
      setHintLevel(0);
      addTeacherAlert(question);
    }
  }

  function finishPracticeSession() {
    const attempts = practiceSession?.attempts || 0;
    const correct = practiceSession?.correct || 0;
    const wrong = practiceSession?.wrong || 0;
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    const assignment = teacherAssignments[currentStudent];
    const target = assignment?.target || practiceSession?.skill || question.outcome;

    if (practiceSession) {
      setPracticeStats((prev) => ({
        ...prev,
        [practiceSession.key]: {
          before: prev[practiceSession.key]?.before ?? 0,
          attempts,
          correct,
          wrong,
          accuracy,
          status: accuracy >= 80 ? "Improved" : "Needs more practice",
        },
      }));
    }

    const result = {
      type: "Practice",
      target,
      accuracy,
      attempts,
      correct,
      status: accuracy >= 80 ? "Completed - Improved" : "Completed - Needs more practice",
      completedAt: new Date().toLocaleDateString(),
      nextStep: accuracy >= 80 ? `Try the ${target} assessment when your teacher assigns it.` : `Do another short practice cycle for ${target}.`,
    };

    setTeacherAssignments((prev) => ({
      ...prev,
      [currentStudent]: {
        ...(prev[currentStudent] || { type: "Practice", target }),
        status: "completed",
        completedAt: result.completedAt,
        result,
      },
    }));

    addInterventionLog({
      student: currentStudent,
      type: "Practice Completed",
      target,
      action: result.status,
      note: `${correct}/${attempts} correct (${accuracy}%).`,
      source: "Student Work",
      status: accuracy >= 80 ? "Improved" : "Needs Follow-Up",
    });

    setCompletionResult(result);
    setPracticeSession(null);
    setPracticeMode(false);
    setPracticeQueue([]);
    setIntervention(null);
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setHintLevel(0);
    setStudentScreen("completion");
  }

  function finishAssessmentSession() {
    const total = assessmentSession?.total || 0;
    const correct = assessmentSession?.correct || 0;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const outcome = assessmentSession?.outcome || question.outcome;
    const assessmentKey = `${currentStudent}-${outcome}`;

    setAssessmentStats((prev) => {
      const previous = prev[assessmentKey] || {};
      const newAttempt = {
        score: percent,
        correct,
        total,
        status: percent >= 80 ? "Passed" : "Needs Reassessment",
        completedAt: new Date().toLocaleDateString(),
      };
      return {
        ...prev,
        [assessmentKey]: {
          attempts: (previous.attempts || 0) + 1,
          lastScore: percent,
          lastCorrect: correct,
          lastTotal: total,
          status: percent >= 80 ? "Passed" : "Needs Reassessment",
          completedAt: newAttempt.completedAt,
          history: [newAttempt, ...(previous.history || [])].slice(0, 5),
        },
      };
    });

    if (percent >= 80) {
      setOutcomeStats((prev) => ({ ...prev, [`${currentStudent}-${outcome}`]: { ...(prev[`${currentStudent}-${outcome}`] || {}), assessmentPassed: true, status: "Mastered", assessmentScore: percent } }));
      setFeedback(`🎯 Assessment passed! ${outcome} is now mastered.`);
    } else {
      setFeedback(`Assessment complete: ${percent}%. Keep practicing before reassessment.`);
    }

    const result = {
      type: "Assessment",
      target: outcome,
      accuracy: percent,
      attempts: total,
      correct,
      status: percent >= 80 ? "Passed" : "Needs Reassessment",
      completedAt: new Date().toLocaleDateString(),
      nextStep: percent >= 80 ? `${outcome} is mastered. Move to the next outcome.` : `Review ${outcome}, then reassess.`,
    };

    setTeacherAssignments((prev) => ({
      ...prev,
      [currentStudent]: {
        ...(prev[currentStudent] || { type: "Assessment", target: outcome }),
        status: "completed",
        completedAt: result.completedAt,
        result,
      },
    }));

    addInterventionLog({
      student: currentStudent,
      type: "Assessment Completed",
      target: outcome,
      action: result.status,
      note: `${correct}/${total} correct (${percent}%).`,
      source: "Assessment",
      status: percent >= 80 ? "Mastered" : "Needs Reassessment",
    });

    setCompletionResult(result);
    setAssessmentMode(false);
    setAssessmentQueue([]);
    setAssessmentSession(null);
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setHintLevel(0);
    setStudentScreen("completion");
  }

  function nextQuestion() {
  if (questionIndex < questions.length - 1) {
    setQuestionIndex((index) => index + 1);
  } else if (assessmentMode) {
    finishAssessmentSession();
    return;
  } else if (practiceMode) {
    finishPracticeSession();
    return;
  } else {
    const mastery = getCurrentOutcomeMastery();

    if (mastery.mastered) {
      unlockNextSkill();
      return;
    }

    setQuestionIndex(0);
    setStudentScreen("complete");
    return;
  }

  setSelected("");
  setMultiStepAnswers({});
  setFeedback("");
  setHintLevel(0);
}

  function unlockNextSkill() {
    if (!completedSkills.includes(skill)) setCompletedSkills((old) => [...old, skill]);
    const nextSkill = findNextUnmasteredSkill();
    if (!nextSkill) {
      setStudentScreen("complete");
      return;
    }
    setSkill(nextSkill);
    setQuestionIndex(0);
    setCorrectStreak(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setHintLevel(0);
    setStudentScreen(nextSkill === skill ? "lesson" : "transition");
  }

  function resetCurrentStudentProgress() {
    const confirmed = window.confirm(`Reset saved progress for ${currentStudent}? This keeps the student in the roster but clears their local progress.`);
    if (!confirmed) return;

    localStorage.removeItem(getSaveKey(currentStudent));
    applyStudentData({
      ...DEFAULT_STUDENT_STATE,
      rosterState,
      selectedClass,
      selectedGrade,
      studentGradeLevels,
      studentAdaptations,
    });
    refreshClassSnapshot();
  }

  function getBackupPayload() {
    const currentState = getCurrentStateForSave();
    const studentsToExport = getAllStudentsFromRoster(rosterState);
    const studentRecords = {};

    studentsToExport.forEach((student) => {
      studentRecords[student] = student === currentStudent ? currentState : getSavedStudentData(student);
    });

    return {
      app: "math-learning-teacher-tool",
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      selectedClass,
      selectedGrade,
      currentStudent,
      rosterState,
      studentGradeLevels,
      studentAdaptations,
      students: studentsToExport,
      studentRecords,
    };
  }

  function exportBackupFile() {
    const payload = getBackupPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `math-app-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copyBackupToClipboard() {
    const payload = getBackupPayload();
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert("Backup copied to clipboard.");
    } catch {
      alert("Copy failed. Use Download Backup instead.");
    }
  }

  function importBackupFromText(importText) {
    if (!importText || !importText.trim()) {
      return { ok: false, message: "Paste backup JSON first." };
    }

    try {
      const payload = JSON.parse(importText);
      const records = payload.studentRecords || payload.records;

      if (!records || typeof records !== "object") {
        return { ok: false, message: "This backup does not include studentRecords." };
      }

      const confirmed = window.confirm("Import this backup? This will replace local saved app data for the students included in the backup.");
      if (!confirmed) {
        return { ok: false, message: "Import cancelled." };
      }

      Object.entries(records).forEach(([student, record]) => {
        localStorage.setItem(getSaveKey(student), JSON.stringify({
          ...DEFAULT_STUDENT_STATE,
          ...(record || {}),
          rosterState: payload.rosterState || record?.rosterState || buildDefaultRosterState(),
          selectedClass: payload.selectedClass || record?.selectedClass || "901",
          selectedGrade: payload.selectedGrade || record?.selectedGrade || "G2",
          studentGradeLevels: payload.studentGradeLevels || record?.studentGradeLevels || DEFAULT_STUDENT_GRADE_LEVELS,
          studentAdaptations: payload.studentAdaptations || record?.studentAdaptations || buildDefaultAdaptations(),
        }));
      });

      const nextStudent = payload.currentStudent && records[payload.currentStudent]
        ? payload.currentStudent
        : Object.keys(records)[0] || currentStudent;

      if (nextStudent) {
        setCurrentStudent(nextStudent);
        applyStudentData(getSavedStudentData(nextStudent));
      }

      refreshClassSnapshot();
      return { ok: true, message: `Imported backup for ${Object.keys(records).length} student(s).` };
    } catch (error) {
      return { ok: false, message: `Import failed: ${error.message}` };
    }
  }

  function resetSelectedClassProgress() {
    const classStudents = getClassStudentsFromRoster(rosterState, selectedClass);
    const confirmed = window.confirm(`Reset progress for all ${classStudents.length} active student(s) in Class ${selectedClass}? Roster names stay, progress clears.`);
    if (!confirmed) return;

    classStudents.forEach((student) => localStorage.removeItem(getSaveKey(student)));

    if (classStudents.includes(currentStudent)) {
      applyStudentData({
        ...DEFAULT_STUDENT_STATE,
        rosterState,
        selectedClass,
        selectedGrade,
        studentGradeLevels,
        studentAdaptations,
      });
    }

    refreshClassSnapshot();
  }

  function resetAllAppData() {
    const firstConfirm = window.confirm("Reset ALL local math app data? This includes progress, roster, adaptations, interventions, question edits, and assignments.");
    if (!firstConfirm) return;

    const secondConfirm = window.confirm("Final check: this cannot be undone unless you exported a backup first. Reset everything?");
    if (!secondConfirm) return;

    Object.keys(localStorage)
      .filter((key) => key.startsWith("mathAppProgress_"))
      .forEach((key) => localStorage.removeItem(key));

    setCurrentStudent(STUDENTS[0]);
    applyStudentData({ ...DEFAULT_STUDENT_STATE });
    refreshClassSnapshot();
  }

  function saveAssignmentForStudent(student, assignment) {
    if (student === currentStudent) {
      setTeacherAssignments((prev) => ({
        ...prev,
        [student]: assignment,
      }));
      return;
    }

    const saved = getSavedStudentData(student);
    const updated = {
      ...saved,
      teacherAssignments: {
        ...(saved.teacherAssignments || {}),
        [student]: assignment,
      },
    };
    localStorage.setItem(getSaveKey(student), JSON.stringify(updated));
  }

  function assignGroupPractice(rows) {
    rows.forEach((row) => {
      const outcome = getSuggestedOutcomeForRow(row, false);
      saveAssignmentForStudent(row.student, {
        type: "Practice",
        target: outcome,
        status: "assigned",
        assignedAt: new Date().toLocaleDateString(),
        assignedBy: "Group Assignment",
      });
      addInterventionLog({
        student: row.student,
        type: "Group Assignment",
        target: outcome,
        action: "Practice assigned",
        source: "Teacher",
        status: "Assigned",
      });
    });
    refreshClassSnapshot();
  }

  function assignGroupAssessment(rows) {
    rows.forEach((row) => {
      const outcome = getSuggestedOutcomeForRow(row, true);
      saveAssignmentForStudent(row.student, {
        type: "Assessment",
        target: outcome,
        status: "assigned",
        assignedAt: new Date().toLocaleDateString(),
        assignedBy: "Group Assignment",
      });
      addInterventionLog({
        student: row.student,
        type: "Group Assignment",
        target: outcome,
        action: "Assessment assigned",
        source: "Teacher",
        status: "Assigned",
      });
    });
    refreshClassSnapshot();
  }

  function startOutcomePractice(outcome) {
    const nextSkill = OUTCOME_TO_SKILL[outcome] || skill;
    const outcomeQuestions = buildPracticeQuestionSet(outcome, activeAllQuestions, nextSkill, 5);

    setSkill(nextSkill);
    setPracticeQueue(outcomeQuestions);
    setPracticeMode(true);
    setAssessmentMode(false);
    setAssessmentQueue([]);
    setPracticeSession({ key: `${currentStudent}-${outcome}`, skill: outcome, attempts: 0, correct: 0, wrong: 0 });
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setHintLevel(0);
    setStudentScreen("lesson");
  }

  function startAssignedWork() {
    const assignment = teacherAssignments[currentStudent];
    if (!assignment || assignment.status === "completed") {
      const outcome = currentTodayPlan.actionOutcome || question.outcome;
      startOutcomePractice(outcome);
      return;
    }

    if (assignment.type === "Assessment") {
      startAssessment(currentStudent, assignment.target);
      return;
    }

    const assignedQuestions = buildPracticeQuestionSet(assignment.target, activeAllQuestions, OUTCOME_TO_SKILL[assignment.target] || skill, 5);
    if (assignedQuestions.length === 0) {
      startOutcomePractice(assignment.target);
      return;
    }

    setSkill(OUTCOME_TO_SKILL[assignment.target] || skill);
    setTeacherAssignments((prev) => ({
      ...prev,
      [currentStudent]: {
        ...assignment,
        status: "in_progress",
        startedAt: new Date().toLocaleTimeString(),
      },
    }));
    addInterventionLog({
      student: currentStudent,
      type: "Assignment Started",
      target: assignment.target,
      action: `${assignment.type} started`,
      source: "Student",
      status: "In Progress",
    });
    setPracticeSession({ key: `${currentStudent}-${assignment.target}`, skill: assignment.target, attempts: 0, correct: 0, wrong: 0 });
    setPracticeQueue(assignedQuestions);
    setPracticeMode(true);
    setAssessmentMode(false);
    setAssessmentQueue([]);
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setHintLevel(0);
    setStudentScreen("lesson");
  }

  function assignOutcomePractice(student, outcome) {
    setCurrentStudent(student);
    const assignedQuestions = buildPracticeQuestionSet(outcome, activeAllQuestions, OUTCOME_TO_SKILL[outcome] || skill, 5);
    if (assignedQuestions.length === 0) return;

    setTeacherAssignments((prev) => ({
      ...prev,
      [student]: {
        type: "Practice",
        target: outcome,
        status: "in_progress",
        assignedAt: new Date().toLocaleDateString(),
        startedAt: new Date().toLocaleTimeString(),
      },
    }));
    addInterventionLog({
      student,
      type: "Teacher Assignment",
      target: outcome,
      action: "Practice assigned and opened",
      source: "Teacher",
      status: "In Progress",
    });
    setPracticeSession({ key: `${student}-${outcome}`, skill: outcome, attempts: 0, correct: 0, wrong: 0 });
    setPracticeQueue(assignedQuestions);
    setPracticeMode(true);
    setAssessmentMode(false);
    setAssessmentQueue([]);
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setHintLevel(0);
    setStudentScreen("lesson");
    setMode("student");
  }

  function startAssessment(student, outcome) {
    setCurrentStudent(student);
    const assessmentQuestions = buildBalancedAssessmentQuestions(activeAllQuestions, outcome, 6);
    if (assessmentQuestions.length === 0) return;

    setTeacherAssignments((prev) => ({
      ...prev,
      [student]: {
        type: "Assessment",
        target: outcome,
        status: "in_progress",
        assignedAt: new Date().toLocaleDateString(),
        startedAt: new Date().toLocaleTimeString(),
      },
    }));
    addInterventionLog({
      student,
      type: "Teacher Assignment",
      target: outcome,
      action: "Assessment assigned and opened",
      source: "Teacher",
      status: "In Progress",
    });
    setAssessmentQueue(assessmentQuestions);
    setAssessmentMode(true);
    setAssessmentSession({ outcome, correct: 0, total: 0 });
    setPracticeMode(false);
    setPracticeQueue([]);
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setHintLevel(0);
    setStudentScreen("lesson");
    setMode("student");
  }

  function assignWeakestPractice(student = currentStudent) {
    setCurrentStudent(student);
    const summaries = OUTCOMES.map((outcome) => getOutcomeDisplay(indicatorStats, assessmentStats, student, outcome));
    const weakest = summaries.sort((a, b) => a.masteredCount / a.requiredCount - b.masteredCount / b.requiredCount)[0];
    assignOutcomePractice(student, weakest.outcome);
  }

  function forceMiniLesson(student = currentStudent) {
    setCurrentStudent(student);
    setIntervention({ type: "teacher_mini_lesson", message: "Your teacher assigned a quick mini lesson to help with this skill." });
    addInterventionLog({
      student,
      type: "Teacher Move",
      target: "Current focus",
      action: "Mini lesson assigned",
      source: "Teacher",
      status: "Assigned",
    });
    setStudentScreen("mini");
    setMode("student");
  }

  function simplifyForStudent(student = currentStudent) {
    setCurrentStudent(student);
    setSimplifiedMode(true);
    setIntervention({ type: "simplify", message: "Simplified mode is on. Questions will use extra visual support." });
    addInterventionLog({
      student,
      type: "Teacher Move",
      target: "Current focus",
      action: "Simplified mode turned on",
      source: "Teacher",
      status: "Active",
    });
    setStudentScreen("lesson");
    setMode("student");
  }

  return (
    <div style={styles.page}>
      <style>{printStyles}</style>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Math App Demo</h1>
          <p style={styles.subtitle}>Teacher-driven mastery with a clear student path</p>
        </div>
        <div style={styles.headerControls}>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={styles.select}>
            {Object.keys(rosterState.classes || {}).map((className) => (
              <option key={className} value={className}>Class {className}</option>
            ))}
          </select>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={styles.select}>
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade.id} value={grade.id}>{grade.label} {grade.status === "Loaded" ? "" : "(scaffold)"}</option>
            ))}
          </select>
          <select value={currentStudent} onChange={(e) => setCurrentStudent(e.target.value)} style={styles.select}>
            {visibleStudents.map((student) => (
              <option key={student}>{student}</option>
            ))}
          </select>
          <button type="button" onClick={() => setMode("student")} style={mode === "student" ? styles.activeButton : styles.button}>Student App</button>
          <button type="button" onClick={() => setMode("teacher")} style={mode === "teacher" ? styles.activeButton : styles.button}>Teacher App</button>
          <button type="button" onClick={resetCurrentStudentProgress} style={styles.resetButton}>Reset Student</button>
        </div>
      </header>

      {mode === "student" ? (
       <StudentDashboard>
  <StudentApp
    screen={studentScreen}
    setScreen={setStudentScreen}
    skill={skill}
    question={question}
    questionIndex={questionIndex}
    totalQuestions={questions.length}
    selected={selected}
    setSelected={setSelected}
    multiStepAnswers={multiStepAnswers}
    setMultiStepAnswers={setMultiStepAnswers}
    feedback={feedback}
    hintLevel={hintLevel}
    checkAnswer={checkAnswer}
    nextQuestion={nextQuestion}
    intervention={intervention}
    setIntervention={setIntervention}
    correctStreak={correctStreak}
    completedSkills={completedSkills}
    simplifiedMode={simplifiedMode}
    setSimplifiedMode={setSimplifiedMode}
    practiceMode={practiceMode}
    practiceQueue={practiceQueue}
    assessmentMode={assessmentMode}
    assessmentSession={assessmentSession}
    currentAssignment={currentAssignment}
    completionResult={completionResult}
    nextStep={currentNextStep}
    todayPlan={currentTodayPlan}
    indicatorStats={indicatorStats}
    assessmentStats={assessmentStats}
    currentStudent={currentStudent}
    startAssignedWork={startAssignedWork}
    startOutcomePractice={startOutcomePractice}
    selectedClass={selectedClass}
    selectedGrade={selectedGrade}
    currentStudentGrade={effectiveGrade}
    currentAdaptations={currentAdaptations}
  />
</StudentDashboard>
      ) : (
        <TeacherDashboard
          students={visibleStudents}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          rosterState={rosterState}
          setRosterState={setRosterState}
          selectedGrade={selectedGrade}
          studentGradeLevels={studentGradeLevels}
          setStudentGradeLevels={setStudentGradeLevels}
          studentAdaptations={studentAdaptations}
          setStudentAdaptations={setStudentAdaptations}
          currentStudent={currentStudent}
          setCurrentStudent={setCurrentStudent}
          alerts={alerts}
          mistakeCounts={mistakeCounts}
          practiceStats={practiceStats}
          outcomeStats={outcomeStats}
          indicatorStats={indicatorStats}
          assessmentStats={assessmentStats}
          correctStreak={correctStreak}
          completedSkills={completedSkills}
          currentSkill={skill}
          teacherAssignments={teacherAssignments}
          interventionLog={interventionLog}
          interventionPlans={interventionPlans}
          classSnapshot={classSnapshot}
          questionEdits={questionEdits}
          setQuestionEdits={setQuestionEdits}
          activeAllQuestions={activeAllQuestions}
          onAssignWeakestPractice={assignWeakestPractice}
          onAssignOutcomePractice={assignOutcomePractice}
          onAssignGroupPractice={assignGroupPractice}
          onAssignGroupAssessment={assignGroupAssessment}
          onStartAssessment={startAssessment}
          onForceMiniLesson={forceMiniLesson}
          onSimplify={simplifyForStudent}
          onScheduleIntervention={scheduleInterventionPlan}
          onMarkInterventionReviewed={markInterventionReviewed}
          onExportBackup={exportBackupFile}
          onCopyBackup={copyBackupToClipboard}
          onImportBackup={importBackupFromText}
          onResetCurrentStudentProgress={resetCurrentStudentProgress}
          onResetSelectedClassProgress={resetSelectedClassProgress}
          onResetAllAppData={resetAllAppData}
          onClearAssignment={(student) => setTeacherAssignments((prev) => {
            const updated = { ...prev };
            delete updated[student];
            return updated;
          })}
          backupSummary={{
            students: allRosterStudents.length,
            classes: Object.keys(rosterState?.classes || {}).length,
            selectedClass,
            selectedGrade,
          }}
        />
      )}
    </div>
  );
}

function StudentApp({
  screen,
  setScreen,
  skill,
  question,
  questionIndex,
  totalQuestions,
  selected,
  setSelected,
  multiStepAnswers,
  setMultiStepAnswers,
  feedback,
  hintLevel,
  checkAnswer,
  nextQuestion,
  intervention,
  setIntervention,
  correctStreak,
  completedSkills,
  simplifiedMode,
  setSimplifiedMode,
  practiceMode,
  practiceQueue,
  assessmentMode,
  assessmentSession,
  currentAssignment,
  completionResult,
  nextStep,
  todayPlan,
  indicatorStats,
  assessmentStats,
  currentStudent,
  startAssignedWork,
  startOutcomePractice,
  selectedClass,
  selectedGrade,
  currentStudentGrade,
  currentAdaptations,
}) {
  if (!question) {
    return (
      <div style={styles.main}>
        <Card title="Loading Question">
          <p>No question is available yet.</p>
        </Card>
      </div>
    );
  }

  const lessonQuestion = applyAdaptationsToQuestion(question, currentAdaptations) || question;
  const adaptationSupport = lessonQuestion.adaptationSupport || getAdaptationSupport(question, currentAdaptations);
  const outcomeDisplay = getOutcomeDisplay(indicatorStats, assessmentStats, currentStudent, question.outcome);
  const currentIndicatorKey = `${currentStudent}-${question.indicator || `${question.outcome}.01`}`;
const currentIndicatorProgress = indicatorStats[currentIndicatorKey] || {
  attempts: 0,
  correct: 0,
  accuracy: 0,
  status: "Not Started",
};

const indicatorMasteryTarget = 3;
const indicatorAttempts = currentIndicatorProgress.attempts || 0;
const indicatorCorrect = currentIndicatorProgress.correct || 0;
const indicatorAccuracy = currentIndicatorProgress.accuracy || 0;
const indicatorStatus = currentIndicatorProgress.status || "Not Started";
const indicatorProgressPercent = Math.min(
  100,
  Math.round((indicatorAttempts / indicatorMasteryTarget) * 100)
);
  const outcomePathDisplays = OUTCOMES.map((outcome) => getOutcomeDisplay(indicatorStats, assessmentStats, currentStudent, outcome));

  const navItems = [
    { id: "today", label: "Today", helper: "Next step" },
    { id: "lesson", label: "Lesson", helper: `${questionIndex + 1}/${totalQuestions}` },
    { id: "path", label: "Path", helper: "Outcomes" },
    { id: "mini", label: "Mini", helper: "Support" },
    ...(completionResult ? [{ id: "completion", label: "Done", helper: "Results" }] : []),
  ];

  return (
    <div style={styles.main}>
      <div style={styles.currentTaskCard}>
        <div>
          <p style={styles.eyebrowDark}>Class / grade setup</p>
          <strong>{selectedClass ? `Class ${selectedClass}` : "Class not set"} · {currentStudentGrade || selectedGrade}</strong>
          <div style={styles.cellSubtext}>
            Adaptations active: {Object.entries(currentAdaptations || {}).filter(([key, value]) => key !== "gradeOverride" && value).map(([key]) => key).join(", ") || "None"}
          </div>
        </div>
        {currentAdaptations?.readAloud && question && (
          <button
            type="button"
            onClick={() => {
              if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(adaptationSupport?.readAloudText || lessonQuestion.prompt));
              }
            }}
            style={styles.gridActionButton}
          >
            Read Question
          </button>
        )}
      </div>
      <div style={styles.studentHero}>
        <div>
          <p style={styles.eyebrow}>Student dashboard</p>
          <h2 style={styles.heroTitle}>{nextStep}</h2>
          <p style={styles.heroText}>One clear task at a time. Start with Today, complete the lesson, then check your path.</p>
        </div>
        <div style={styles.heroBadge}>{outcomeDisplay.progressLabel} indicators</div>
      </div>

      <div style={styles.studentNavBar} aria-label="Student navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setScreen(item.id)}
            style={screen === item.id ? styles.studentNavButtonActive : styles.studentNavButton}
          >
            <span>{item.label}</span>
            <small>{item.helper}</small>
          </button>
        ))}
      </div>

      <div style={styles.currentTaskCard}>
        <div>
          <p style={styles.eyebrowDark}>Current task</p>
          <strong>{currentAssignment ? `${currentAssignment.type} ${currentAssignment.target}` : todayPlan.title}</strong>
          <div style={styles.cellSubtext}>
            {currentAssignment
              ? `Status: ${currentAssignment.status || "assigned"}`
              : `Focus: ${todayPlan.focus}`}
          </div>
        </div>
        <div style={styles.studentQuickStats}>
          <ProgressItem label="Streak" value={`${correctStreak}/3`} />
          <ProgressItem label="Assessment" value={assessmentMode ? `${assessmentSession?.outcome || "Outcome"}` : "None"} />
          <ProgressItem label="Practice" value={practiceMode ? `${practiceQueue.length} left` : "None"} />
        </div>
      </div>

      {screen === "today" && (
        <Card title="Today’s Plan">
          <div style={styles.todayHeader}>
            <div>
              <p style={styles.eyebrowDark}>Recommended focus</p>
              <h2 style={styles.todayTitle}>{todayPlan.title}</h2>
              <p style={styles.sectionIntro}>This screen tells the student exactly what to do next without making the app feel like a game.</p>
            </div>
            <div style={styles.todayFocusPill}>{todayPlan.focus}</div>
          </div>

          <div style={styles.planGrid}>
            {todayPlan.steps.map((step, index) => (
              <div key={step} style={styles.planStep}>
                <span style={styles.planNumber}>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>

          <div style={styles.row}>
            <button type="button" onClick={startAssignedWork} style={styles.primary}>{todayPlan.actionLabel}</button>
            <button type="button" onClick={() => setScreen("placement")} style={styles.secondary}>Check placement</button>
          </div>
        </Card>
      )}

      {screen === "path" && (
        <Card title="Outcome Path">
          <p style={styles.sectionIntro}>This shows the student path by curriculum outcome instead of by game level. Students build indicators, then complete the outcome assessment.</p>
          <div style={styles.outcomePathList}>
            {outcomePathDisplays.map((item, index) => {
              const isCurrent = item.outcome === question.outcome;
              const canAssess = item.readyForAssessment && item.assessment.status !== "Passed";
              const isPassed = item.assessment.status === "Passed";

              return (
                <div key={item.outcome} style={{ ...styles.outcomePathCard, borderColor: isCurrent ? "#2563eb" : "#dbe3ef" }}>
                  <div style={styles.pathNumber}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.pathTitleRow}>
                      <strong>{item.outcome} — {item.title}</strong>
                      <span style={{ ...styles.indicatorStatus, background: item.background, color: item.color }}>{isPassed ? "Mastered" : item.status}</span>
                    </div>
                    <div style={styles.cellSubtext}>Indicators mastered: {item.masteredCount}/{item.requiredCount} · Assessment: {item.assessment.status}</div>
                    <div style={styles.pathBarTrack}>
                      <div style={{ ...styles.pathBarFill, width: `${Math.min(100, Math.round((item.masteredCount / item.requiredCount) * 100))}%` }} />
                    </div>
                    <div style={styles.rowWrap}>
                      <button type="button" onClick={() => startOutcomePractice(item.outcome)} style={styles.gridActionButton}>Practice {item.outcome}</button>
                      <button type="button" disabled={!canAssess} onClick={() => setScreen("today")} style={{ ...styles.gridActionButton, opacity: canAssess ? 1 : 0.45, cursor: canAssess ? "pointer" : "not-allowed" }}>{canAssess ? "Ready to Assess" : "Assessment Locked"}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {screen === "placement" && (
        <Card title="Placement Test">
          <p style={styles.bigText}>Let’s find your starting point.</p>
          <p>This starts a short path that helps your teacher see which outcomes need support.</p>
          <button type="button" onClick={() => setScreen("lesson")} style={styles.primary}>Start Lesson</button>
        </Card>
      )}

      {screen === "lesson" && (
  <Card title={`Question ${questionIndex + 1}/${totalQuestions}`}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
      <span style={styles.skillTag}>{lessonQuestion.outcome}</span>
      <span style={styles.skillTag}>{lessonQuestion.indicator || "No indicator"}</span>
      <span style={styles.skillTag}>{(lessonQuestion.difficulty || "normal").toUpperCase()}</span>
      <span style={styles.skillTag}>Adaptive: {adaptiveLevel.toUpperCase()}</span>
    </div>

    <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginBottom: 16,
  }}
>
  <div style={styles.currentTaskCard}>
    <div>
      <p style={styles.eyebrowDark}>Indicator Progress</p>
      <strong>{indicatorAttempts}/{indicatorMasteryTarget} attempts</strong>
      <div style={styles.cellSubtext}>
        {indicatorCorrect} correct · {indicatorAccuracy}% accuracy
      </div>
    </div>
  </div>

  <div style={styles.currentTaskCard}>
    <div>
      <p style={styles.eyebrowDark}>Status</p>
      <strong>{indicatorStatus}</strong>
      <div style={styles.cellSubtext}>
        Goal: 3 attempts with 80%+
      </div>
    </div>
  </div>

  <div style={styles.currentTaskCard}>
    <div>
      <p style={styles.eyebrowDark}>Streak</p>
      <strong>{correctStreak}</strong>
      <div style={styles.cellSubtext}>
        Correct answers in a row
      </div>
    </div>
  </div>
</div>

<div
  style={{
    height: 12,
    background: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 18,
  }}
>
  <div
    style={{
      width: `${indicatorProgressPercent}%`,
      height: "100%",
      background: indicatorStatus === "Mastered" ? "#16a34a" : "#2563eb",
      borderRadius: 999,
      transition: "width 0.25s ease",
    }}
  />
</div>

    {practiceMode && (
      <p style={styles.interventionNotice}>
        Targeted practice: use the model first, then choose your answer.
      </p>
    )}

    {assessmentMode && (
      <p style={styles.interventionNotice}>
        Assessment mode: try this independently first.
      </p>
    )}

    {currentAdaptations?.examples && (
      <div style={styles.supportBox}>
        <strong>Example:</strong> {adaptationSupport?.workedExample}
      </div>
    )}

    {currentAdaptations?.formulaSheet && (
      <div style={styles.supportBox}>
        <strong>Helpful reminder:</strong> {adaptationSupport?.formulaReminder}
      </div>
    )}

    {currentAdaptations?.simplifiedNumbers && (
      <div style={styles.supportBox}>
        <strong>Simplified support:</strong> {adaptationSupport?.simplifiedNote}
      </div>
    )}

    <div style={{ ...styles.analyticsCard, marginTop: 12 }}>
      <p style={styles.eyebrowDark}>Question</p>
      <h2 style={{ marginTop: 4 }}>{lessonQuestion.prompt}</h2>
      {lessonQuestion.tapBoxModel && (
  <TapBoxFractionQuestion
    total={lessonQuestion.tapBoxModel.total}
    target={lessonQuestion.tapBoxModel.target}
    selectedCount={
      selected && selected.includes("/")
        ? Number(selected.split("/")[0])
        : 0
    }
    onChange={(count) => {
      const answer = `${count}/${lessonQuestion.tapBoxModel.total}`;
      setSelected(answer);
      setTimeout(() => {
        checkAnswer(answer);
      }, 100);
    }}
    disabled={feedback.includes("Correct")}
  />
)}

      {lessonQuestion.visualType && (
  <div style={{ marginTop: 16 }}>
    <CurriculumVisual question={lessonQuestion} />
  </div>
)}

      {lessonQuestion.thinkingSteps && (
        <div style={styles.thinkingCard}>
          <strong>Think it through</strong>
          {lessonQuestion.thinkingSteps.map((step, index) => (
            <div key={step} style={styles.thinkingStep}>
              <span style={styles.thinkingNumber}>{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {lessonQuestion.tapBoxModel ? null : lessonQuestion.type === "multi-step" ? (
      <div style={styles.multiStepBox}>
        {lessonQuestion.steps.map((step, index) => (
          <div key={step.prompt} style={styles.stepCard}>
            <strong>{step.prompt}</strong>

            <div style={styles.answers}>
              {step.answers.map((answer) => (
                <button
                  key={answer}
                  type="button"
                  onClick={() => {
  const updated = {
    ...multiStepAnswers,
    [index]: answer,
  };

  setMultiStepAnswers(updated);

  if (Object.keys(updated).length === lessonQuestion.steps.length) {
    setTimeout(() => {
      checkAnswer(updated);
    }, 100);
  }
}}
                  style={
                    multiStepAnswers[index] === answer
                      ? styles.selectedAnswer
                      : styles.answer
                  }
                >
                  {answer}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={styles.answers}>
        {lessonQuestion.answers.map((answer) => (
          <button
            key={answer}
            type="button"
            onClick={() => {
  setSelected(answer);
  setTimeout(() => {
    checkAnswer(answer);
  }, 100);
}}
            style={selected === answer ? styles.selectedAnswer : styles.answer}
          >
            {answer}
          </button>
        ))}
      </div>
    )}

    {feedback && (
  <div
    style={{
      ...styles.feedback,
      borderLeft: feedback.includes("Correct") ? "6px solid #16a34a" : "6px solid #f97316",
      background: feedback.includes("Correct") ? "#dcfce7" : "#ffedd5",
      color: "#0f172a",
    }}
  >
    <strong>
      {feedback.includes("Correct") ? "Nice work!" : "Let’s learn from that."}
    </strong>

    <p style={{ margin: "6px 0 0" }}>{feedback}</p>

    {!feedback.includes("Correct") && adaptationSupport?.workedExample && (
      <p style={{ margin: "8px 0 0" }}>
        <strong>Try this idea:</strong> {adaptationSupport.workedExample}
      </p>
    )}
  </div>
)}

    <div style={styles.row}>
      <button
        type="button"
        onClick={checkAnswer}
        disabled={
          lessonQuestion.type === "multi-step"
            ? Object.keys(multiStepAnswers).length < lessonQuestion.steps.length
            : !selected
        }
        style={{
          ...styles.primary,
          opacity:
            lessonQuestion.type === "multi-step"
              ? Object.keys(multiStepAnswers).length < lessonQuestion.steps.length
                ? 0.5
                : 1
              : selected
              ? 1
              : 0.5,
          cursor:
            lessonQuestion.type === "multi-step"
              ? Object.keys(multiStepAnswers).length < lessonQuestion.steps.length
                ? "not-allowed"
                : "pointer"
              : selected
              ? "pointer"
              : "not-allowed",
        }}
      >
        <button
  type="button"
  disabled
  style={{ ...styles.primary, opacity: 0.3 }}
>
  Auto Check
</button>
      </button>

      {feedback && hintLevel === 0 && (
        <button type="button" onClick={nextQuestion} style={styles.secondary}>
          Continue
        </button>
      )}

      <button type="button" onClick={() => setScreen("today")} style={styles.secondary}>
        Back to Today
      </button>
    </div>
  </Card>
)}
{screen === "complete" && (
  <Card title="Practice Complete">
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>

      <h2 style={{ margin: "0 0 8px" }}>Nice work today!</h2>

      <p style={styles.sectionIntro}>
        Your progress has been saved. Your teacher can now see your latest practice evidence.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <div style={styles.currentTaskCard}>
          <p style={styles.eyebrowDark}>Streak</p>
          <strong>{correctStreak}</strong>
          <div style={styles.cellSubtext}>correct in a row</div>
        </div>

        <div style={styles.currentTaskCard}>
          <p style={styles.eyebrowDark}>Mode</p>
          <strong>{assessmentMode ? "Assessment" : practiceMode ? "Practice" : "Lesson"}</strong>
          <div style={styles.cellSubtext}>session complete</div>
        </div>

        <div style={styles.currentTaskCard}>
          <p style={styles.eyebrowDark}>Saved</p>
          <strong>Yes</strong>
          <div style={styles.cellSubtext}>teacher dashboard updated</div>
        </div>
      </div>

      <div style={styles.row}>
        <button type="button" onClick={() => setScreen("today")} style={styles.primary}>
          Back to Today
        </button>

        <button type="button" onClick={() => setScreen("dashboard")} style={styles.secondary}>
          Student Dashboard
        </button>
      </div>
    </div>
  </Card>
)}
      {screen === "mini" && (
        <Card title="Mini Lesson Assigned">
          {intervention && <p style={styles.interventionNotice}>{intervention.message}</p>}
          <p style={styles.bigText}>Fractions show parts of a whole.</p>
          <p>If 3 out of 4 equal parts are shaded, the fraction is 3/4.</p>
          <FractionVisual selected="" setSelected={() => {}} />
          <button type="button" onClick={() => { setIntervention(null); setScreen("lesson"); }} style={styles.primary}>Back to Lesson</button>
        </Card>
      )}

      {screen === "completion" && completionResult && (
        <Card title="Assignment Complete">
          <div style={styles.completionHero}>
            <div style={styles.completionIcon}>✅</div>
            <div>
              <p style={styles.eyebrowDark}>{completionResult.type} complete</p>
              <h2 style={styles.todayTitle}>{completionResult.target}</h2>
              <p style={styles.sectionIntro}>Your teacher can now see this result in the dashboard.</p>
            </div>
          </div>

          <div style={styles.completionGrid}>
            <Stat label="Accuracy" value={`${completionResult.accuracy}%`} />
            <Stat label="Correct" value={`${completionResult.correct}/${completionResult.attempts}`} />
            <Stat label="Status" value={completionResult.status} />
          </div>

          <div style={styles.recommendationBox}>
            <strong>Next step:</strong>
            <p>{completionResult.nextStep}</p>
          </div>

          <div style={styles.row}>
            <button type="button" onClick={() => setScreen("today")} style={styles.primary}>Back to Today</button>
            <button type="button" onClick={() => setScreen("lesson")} style={styles.secondary}>Keep Practicing</button>
          </div>
        </Card>
      )}

      {screen === "transition" && (
        <Card title="New Skill Unlocked">
          <p style={styles.bigText}>A new skill is ready.</p>
          <p>You are moving to the next outcome that still needs indicator practice.</p>
          <button type="button" onClick={() => setScreen("lesson")} style={styles.primary}>Start Next Skill</button>
        </Card>
      )}

      {screen === "complete" && (
        <Card title="Path Complete">
          <p style={styles.bigText}>You completed the demo path.</p>
          <p>You finished the current fraction and decimal outcomes.</p>
        </Card>
      )}
    </div>
  );
}

function TeacherDashboard({
  students,
  selectedClass,
  setSelectedClass,
  rosterState,
  setRosterState,
  selectedGrade,
  studentGradeLevels,
  setStudentGradeLevels,
  studentAdaptations,
  setStudentAdaptations,
  currentStudent,
  setCurrentStudent,
  alerts,
  mistakeCounts,
  practiceStats,
  outcomeStats,
  indicatorStats,
  assessmentStats,
  correctStreak,
  completedSkills,
  currentSkill,
  teacherAssignments,
  interventionLog,
  interventionPlans,
  classSnapshot,
  questionEdits,
  setQuestionEdits,
  activeAllQuestions = GRADE2_GENERATED_QUESTIONS,
  onAssignWeakestPractice,
  onAssignOutcomePractice,
  onAssignGroupPractice,
  onAssignGroupAssessment,
  onStartAssessment,
  onForceMiniLesson,
  onSimplify,
  onScheduleIntervention,
  onMarkInterventionReviewed,
  onExportBackup,
  onCopyBackup,
  onImportBackup,
  onResetCurrentStudentProgress,
  onResetSelectedClassProgress,
  onResetAllAppData,
  backupSummary,
  onClearAssignment,
}) {
  const analytics = getClassAnalytics(students, indicatorStats, assessmentStats, alerts, teacherAssignments);
  const groups = getInstructionalGroups(analytics);
  const priorityRows = getClassPriorityRows(analytics);
  const selectedSummary = analytics.studentRows.find((row) => row.student === currentStudent) || analytics.studentRows[0];
  const selectedInsightLines = getTeacherInsightLines(selectedSummary);
  const selectedConferenceNotes = getStudentConferenceNotes(selectedSummary);
  const selectedIndicators = Object.entries(indicatorStats)
    .filter(([key]) => key.startsWith(`${currentStudent}-`))
    .map(([key, data]) => ({ indicator: key.replace(`${currentStudent}-`, ""), ...data }))
    .sort((a, b) => a.indicator.localeCompare(b.indicator));

  const [referralEmail, setReferralEmail] = useState("resource.teacher@example.com");
  const [referralThreshold, setReferralThreshold] = useState(60);
  const [interventionType, setInterventionType] = useState("Small Group");
  const [followUpDays, setFollowUpDays] = useState(3);
  const [interventionNotes, setInterventionNotes] = useState("Short targeted support using visual/concrete models.");
  const [familyEmail, setFamilyEmail] = useState("");
  const [familyTone, setFamilyTone] = useState("simple");
  const [familyCustomNote, setFamilyCustomNote] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [renameClassName, setRenameClassName] = useState(selectedClass || "");
  const [newStudentName, setNewStudentName] = useState("");
  const [moveTargetClass, setMoveTargetClass] = useState(selectedClass || "");
  const [backupImportText, setBackupImportText] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const interventionReferralData = getInterventionReferralData(
    students,
    indicatorStats,
    assessmentStats,
    alerts,
    Number(referralThreshold) || 60
  );
  const interventionReferralSubject = `Math Intervention Catch-Up List - ${new Date().toLocaleDateString()}`;
  const interventionReferralBody = buildInterventionReferralEmail(
    interventionReferralData,
    Number(referralThreshold) || 60
  );
  const dueInterventionPlans = getDueInterventionPlans(interventionPlans);
  const familyUpdateSubject = `Math Update - ${currentStudent}`;
  const familyUpdateBody = buildFamilyCommunicationMessage({
    row: selectedSummary,
    conferenceNotes: selectedConferenceNotes,
    tone: familyTone,
    customNote: familyCustomNote,
    interventionPlans,
    interventionLog,
  });

  function openFamilyUpdateEmail() {
    const mailto = `mailto:${encodeURIComponent(familyEmail)}?subject=${encodeURIComponent(familyUpdateSubject)}&body=${encodeURIComponent(familyUpdateBody)}`;
    window.location.href = mailto;
  }

  async function copyFamilyUpdate() {
    try {
      await navigator.clipboard.writeText(`${familyUpdateSubject}\n\n${familyUpdateBody}`);
      alert("Family update copied to clipboard.");
    } catch {
      alert("Copy failed. You can still highlight and copy the preview text manually.");
    }
  }

  function openInterventionReferralEmail() {
    const mailto = `mailto:${encodeURIComponent(referralEmail)}?subject=${encodeURIComponent(
      interventionReferralSubject
    )}&body=${encodeURIComponent(interventionReferralBody)}`;
    window.location.href = mailto;
  }

  async function copyInterventionReferral() {
    try {
      await navigator.clipboard.writeText(`${interventionReferralSubject}\n\n${interventionReferralBody}`);
      alert("Intervention list copied to clipboard.");
    } catch {
      alert("Copy failed. You can still highlight and copy the preview text manually.");
    }
  }

  function scheduleReferralStudent(group, indicatorGroup, item) {
    onScheduleIntervention?.({
      student: item.student,
      outcome: group.outcome,
      indicator: indicatorGroup.indicator,
      indicatorText: indicatorGroup.text,
      type: interventionType,
      followUpDays,
      notes: interventionNotes,
    });
  }

  function scheduleReferralIndicatorGroup(group, indicatorGroup) {
    indicatorGroup.students.forEach((item) => scheduleReferralStudent(group, indicatorGroup, item));
  }


  const savedQuestionEdits = Object.values(questionEdits || {}).sort((a, b) =>
    (b.savedAt || "").localeCompare(a.savedAt || "")
  );
  const questionEditCounts = getQuestionEditCounts(questionEdits);

  function makeQuestionEditSnapshot(edit, action) {
    return {
      action,
      at: new Date().toLocaleString(),
      status: edit?.status || "Saved Draft",
      improvedPrompt: edit?.improvedPrompt || "",
      hint: edit?.hint || "",
      hint2: edit?.hint2 || "",
      misconception: edit?.misconception || "",
      teacherMove: edit?.teacherMove || "",
    };
  }

  function saveSuggestedQuestionEdit(item) {
    setQuestionEdits((prev) => ({
      ...(prev || {}),
      [item.id]: {
        id: item.id,
        outcome: item.outcome,
        indicator: item.indicator,
        difficulty: item.difficulty,
        visualType: item.visualType,
        originalPrompt: item.prompt,
        improvedPrompt: item.improvedPrompt,
        hint: item.betterHint1,
        hint2: item.betterHint2,
        misconception: item.misconception,
        teacherMove: item.teacherMove,
        status: "Saved Draft",
        savedAt: new Date().toLocaleString(),
        versionHistory: [
          {
            action: "Draft saved",
            at: new Date().toLocaleString(),
            status: "Saved Draft",
            improvedPrompt: item.improvedPrompt,
            hint: item.betterHint1,
            hint2: item.betterHint2,
            misconception: item.misconception,
            teacherMove: item.teacherMove,
          },
        ],
      },
    }));
  }

  function markQuestionEditReviewed(id) {
    setQuestionEdits((prev) => {
      const existing = prev?.[id] || {};
      const updated = {
        ...existing,
        status: "Reviewed",
        reviewedAt: new Date().toLocaleString(),
      };

      return {
        ...(prev || {}),
        [id]: {
          ...updated,
          versionHistory: [
            makeQuestionEditSnapshot(updated, "Marked reviewed"),
            ...(existing.versionHistory || []),
          ].slice(0, 10),
        },
      };
    });
  }

  function publishQuestionEdit(id) {
    setQuestionEdits((prev) => {
      const existing = prev?.[id] || {};
      const updated = {
        ...existing,
        status: "Published",
        publishedAt: new Date().toLocaleString(),
      };

      return {
        ...(prev || {}),
        [id]: {
          ...updated,
          versionHistory: [
            makeQuestionEditSnapshot(updated, "Published to student flow"),
            ...(existing.versionHistory || []),
          ].slice(0, 10),
        },
      };
    });
  }

  function unpublishQuestionEdit(id) {
    setQuestionEdits((prev) => {
      const existing = prev?.[id] || {};
      const updated = {
        ...existing,
        status: "Reviewed",
        unpublishedAt: new Date().toLocaleString(),
      };

      return {
        ...(prev || {}),
        [id]: {
          ...updated,
          versionHistory: [
            makeQuestionEditSnapshot(updated, "Unpublished / restored original"),
            ...(existing.versionHistory || []),
          ].slice(0, 10),
        },
      };
    });
  }

  function rollbackQuestionEdit(id, version) {
    setQuestionEdits((prev) => {
      const existing = prev?.[id] || {};
      const updated = {
        ...existing,
        improvedPrompt: version.improvedPrompt || existing.improvedPrompt,
        hint: version.hint || existing.hint,
        hint2: version.hint2 || existing.hint2,
        misconception: version.misconception || existing.misconception,
        teacherMove: version.teacherMove || existing.teacherMove,
        status: "Reviewed",
        rolledBackAt: new Date().toLocaleString(),
      };

      return {
        ...(prev || {}),
        [id]: {
          ...updated,
          versionHistory: [
            makeQuestionEditSnapshot(updated, `Rolled back to: ${version.action || "previous version"}`),
            ...(existing.versionHistory || []),
          ].slice(0, 10),
        },
      };
    });
  }

  const workflowSupportRows = priorityRows
    .filter((row) => row.priority === 1 || row.supportCount > 0 || row.alerts > 0)
    .slice(0, 6);
  const workflowAssessmentRows = groups.assessmentReady.slice(0, 6);
  const workflowPracticeRows = groups.practice.slice(0, 6);
  const workflowFollowUpRows = dueInterventionPlans.slice(0, 6);
  const workflowTopReferralGroups = interventionReferralData.outcomeGroups.slice(0, 3);

  const teacherDashboardNavItems = [
  { label: "Home", target: "teacher-section-home" },
  { label: "Roster", target: "teacher-section-roster" },
  { label: "Adaptations", target: "teacher-section-adaptations" },
  { label: "Class Analytics", target: "teacher-section-analytics" },
  { label: "Interventions", target: "teacher-section-interventions" },
  { label: "Curriculum", target: "teacher-section-curriculum" },
  { label: "Question Quality", target: "teacher-section-question-quality" },
  { label: "Reports", target: "teacher-section-reports" },
  { label: "Family", target: "teacher-section-family" },
  { label: "Backup", target: "teacher-section-backup" },
];

  function getSelectedRosterClass() {
    return rosterState?.classes?.[selectedClass] || { name: selectedClass, students: [] };
  }

  function addClass() {
    const cleanName = newClassName.trim();
    if (!cleanName) return;

    setRosterState((prev) => {
      const classes = prev?.classes || {};
      if (classes[cleanName]) return prev;

      return {
        ...(prev || {}),
        classes: {
          ...classes,
          [cleanName]: { name: cleanName, students: [] },
        },
      };
    });

    setSelectedClass(cleanName);
    setRenameClassName(cleanName);
    setMoveTargetClass(cleanName);
    setNewClassName("");
  }

  function renameSelectedClass() {
    const cleanName = renameClassName.trim();
    if (!cleanName || cleanName === selectedClass) return;

    setRosterState((prev) => {
      const classes = prev?.classes || {};
      const current = classes[selectedClass];
      if (!current || classes[cleanName]) return prev;

      const updatedClasses = { ...classes };
      delete updatedClasses[selectedClass];
      updatedClasses[cleanName] = { ...current, name: cleanName };

      return { ...(prev || {}), classes: updatedClasses };
    });

    setSelectedClass(cleanName);
    setMoveTargetClass(cleanName);
  }

  function addStudentToSelectedClass() {
    const cleanName = newStudentName.trim();
    if (!cleanName) return;

    setRosterState((prev) => {
      const classes = prev?.classes || {};
      const currentClass = classes[selectedClass] || { name: selectedClass, students: [] };
      const alreadyExists = (currentClass.students || []).some(
        (student) => student.name.toLowerCase() === cleanName.toLowerCase() && !student.archived
      );
      if (alreadyExists) return prev;

      return {
        ...(prev || {}),
        classes: {
          ...classes,
          [selectedClass]: {
            ...currentClass,
            students: [...(currentClass.students || []), { name: cleanName, archived: false }],
          },
        },
      };
    });

    setStudentGradeLevels((prev) => ({ ...prev, [cleanName]: selectedGrade }));
    setStudentAdaptations((prev) => ({
      ...(prev || {}),
      [cleanName]: makeDefaultAdaptationRow(selectedGrade),
    }));
    setCurrentStudent(cleanName);
    setNewStudentName("");
  }

  function moveStudentToClass(studentName, targetClass) {
    if (!studentName || !targetClass || targetClass === selectedClass) return;

    setRosterState((prev) => {
      const classes = prev?.classes || {};
      const fromClass = classes[selectedClass] || { name: selectedClass, students: [] };
      const toClass = classes[targetClass] || { name: targetClass, students: [] };
      const movingStudent = (fromClass.students || []).find((student) => student.name === studentName);
      if (!movingStudent) return prev;

      const toAlreadyHasStudent = (toClass.students || []).some(
        (student) => student.name === studentName && !student.archived
      );

      return {
        ...(prev || {}),
        classes: {
          ...classes,
          [selectedClass]: {
            ...fromClass,
            students: (fromClass.students || []).filter((student) => student.name !== studentName),
          },
          [targetClass]: {
            ...toClass,
            students: toAlreadyHasStudent
              ? toClass.students
              : [...(toClass.students || []), { ...movingStudent, archived: false }],
          },
        },
      };
    });
  }

  function archiveStudent(studentName) {
    if (!studentName) return;

    setRosterState((prev) => {
      const classes = prev?.classes || {};
      const currentClass = classes[selectedClass] || { name: selectedClass, students: [] };

      return {
        ...(prev || {}),
        classes: {
          ...classes,
          [selectedClass]: {
            ...currentClass,
            students: (currentClass.students || []).map((student) =>
              student.name === studentName ? { ...student, archived: true } : student
            ),
          },
        },
      };
    });
  }

  const selectedRosterClass = getSelectedRosterClass();
  const rosterClassNames = Object.keys(rosterState?.classes || {});

  const [activeTeacherSection, setActiveTeacherSection] = useState("teacher-section-home");

  function showTeacherSection(target) {
  setActiveTeacherSection(target);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

  return (
    <div style={styles.main}>
      <div style={styles.teacherGrid} className="teacher-dashboard-grid">
        <style>
  {`
    .teacher-dashboard-grid > .screen-only {
      display: none !important;
    }

    .teacher-dashboard-grid > #teacher-section-navigation,
    .teacher-dashboard-grid > #${activeTeacherSection} {
      display: block !important;
    }
  `}
</style>
        <Card id="teacher-section-navigation" title="Teacher Dashboard Navigation" className="screen-only">
          <p style={styles.sectionIntro}>
            Use this as the teacher control panel. It keeps the dashboard organized without changing any student logic or data tracking.
          </p>
          <div style={styles.teacherNavGrid}>
            {teacherDashboardNavItems.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => showTeacherSection(item.target)}
                style={{
  ...styles.teacherNavButton,
  ...(activeTeacherSection === item.target
    ? {
        background: "#dbeafe",
        border: "2px solid #2563eb",
        color: "#1e3a8a",
      }
    : {}),
}}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </Card>

        <TeacherHome
          Card={Card}
          Stat={Stat}
          styles={styles}
          workflowSupportRows={workflowSupportRows}
          workflowAssessmentRows={workflowAssessmentRows}
          workflowPracticeRows={workflowPracticeRows}
          workflowFollowUpRows={workflowFollowUpRows}
          interventionReferralData={interventionReferralData}
          workflowTopReferralGroups={workflowTopReferralGroups}
          setCurrentStudent={setCurrentStudent}
          onAssignGroupPractice={onAssignGroupPractice}
          onAssignGroupAssessment={onAssignGroupAssessment}
          openInterventionReferralEmail={openInterventionReferralEmail}
          copyInterventionReferral={copyInterventionReferral}
          getSuggestedOutcomeForRow={getSuggestedOutcomeForRow}
        />
        <Card id="teacher-section-roster" title="Roster" className="screen-only">
          <p style={styles.sectionIntro}>
            Manage classes and students. Use this tab for class setup only — not daily teaching decisions.
          </p>

          <div style={styles.rosterControlsGrid}>
            <div style={styles.rosterControlBox}>
              <strong>Add class</strong>
              <div style={styles.rowWrap}>
                <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Example: 903" style={styles.textInput} />
                <button type="button" onClick={addClass} style={styles.gridActionButton}>Add Class</button>
              </div>
            </div>

            <div style={styles.rosterControlBox}>
              <strong>Rename selected class</strong>
              <div style={styles.rowWrap}>
                <input value={renameClassName} onChange={(e) => setRenameClassName(e.target.value)} placeholder={selectedClass} style={styles.textInput} />
                <button type="button" onClick={renameSelectedClass} style={styles.gridActionButton}>Rename</button>
              </div>
            </div>

            <div style={styles.rosterControlBox}>
              <strong>Add student to Class {selectedClass}</strong>
              <div style={styles.rowWrap}>
                <input value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Student name" style={styles.textInput} />
                <button type="button" onClick={addStudentToSelectedClass} style={styles.gridActionButton}>Add Student</button>
              </div>
            </div>
          </div>

          <div style={styles.rosterList}>
            <div style={styles.rosterListHeader}>
              <strong>Class {selectedClass}</strong>
              <span>{students.length} active student(s)</span>
            </div>

            {students.length === 0 ? (
              <p>No active students in this class yet.</p>
            ) : (
              students.map((student) => (
                <div key={student} style={styles.rosterStudentRow}>
                  <button type="button" onClick={() => setCurrentStudent(student)} style={styles.rosterStudentButton}>
                    <strong>{student}</strong>
                    <span>{student === currentStudent ? "Selected" : "Click to view"}</span>
                  </button>
                  <select value={moveTargetClass} onChange={(e) => setMoveTargetClass(e.target.value)} style={styles.smallSelect}>
                    {rosterClassNames.map((className) => (
                      <option key={className} value={className}>Class {className}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => moveStudentToClass(student, moveTargetClass)} disabled={moveTargetClass === selectedClass} style={{ ...styles.gridActionButton, opacity: moveTargetClass === selectedClass ? 0.5 : 1, cursor: moveTargetClass === selectedClass ? "not-allowed" : "pointer" }}>Move</button>
                  <button type="button" onClick={() => archiveStudent(student)} style={styles.dangerMiniButton}>Archive</button>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card id="teacher-section-backup" title="Backup / Restore Tools" className="screen-only">
          <p style={styles.sectionIntro}>
            Use this before big changes. Export creates a JSON backup of your local roster, student progress, adaptations, assignments, interventions, question edits, and reports. Import replaces local saved data for the students in the backup.
          </p>

          <div style={styles.statRow}>
            <Stat label="Classes" value={backupSummary?.classes ?? 0} />
            <Stat label="Students" value={backupSummary?.students ?? students.length} />
            <Stat label="Selected Class" value={backupSummary?.selectedClass || selectedClass} />
            <Stat label="Selected Grade" value={backupSummary?.selectedGrade || selectedGrade} />
          </div>

          <div style={styles.rosterControlsGrid}>
            <div style={styles.rosterControlBox}>
              <strong>1. Export a backup</strong>
              <p style={styles.cellSubtext}>Download a backup before adding big features or changing the roster.</p>
              <div style={styles.rowWrap}>
                <button type="button" onClick={onExportBackup} style={styles.primary}>Download Backup JSON</button>
                <button type="button" onClick={onCopyBackup} style={styles.secondary}>Copy Backup</button>
              </div>
            </div>

            <div style={styles.rosterControlBox}>
              <strong>2. Import a backup</strong>
              <p style={styles.cellSubtext}>Paste a JSON backup here. You will get a confirmation before anything is replaced.</p>
              <textarea
                value={backupImportText}
                onChange={(e) => setBackupImportText(e.target.value)}
                placeholder="Paste backup JSON here"
                style={{ ...styles.noteTextarea, minHeight: 130 }}
              />
              <button
                type="button"
                onClick={() => {
                  const result = onImportBackup?.(backupImportText);
                  setBackupStatus(result?.message || "Import finished.");
                  if (result?.ok) setBackupImportText("");
                }}
                style={styles.gridActionButton}
              >
                Import Backup
              </button>
            </div>

            <div style={styles.rosterControlBox}>
              <strong>3. Reset tools</strong>
              <p style={styles.cellSubtext}>These are protected with confirmation prompts. Export first if you may need the data later.</p>
              <div style={styles.rowWrap}>
                <button type="button" onClick={onResetCurrentStudentProgress} style={styles.dangerMiniButton}>Reset Selected Student</button>
                <button type="button" onClick={onResetSelectedClassProgress} style={styles.dangerMiniButton}>Reset Class {selectedClass}</button>
                <button type="button" onClick={onResetAllAppData} style={styles.dangerMiniButton}>Reset Everything</button>
              </div>
            </div>
          </div>

          {backupStatus && (
            <div style={styles.recommendationBox}>
              <strong>Backup status:</strong>
              <p>{backupStatus}</p>
            </div>
          )}
        </Card>

        <Card id="teacher-section-adaptations" title="Adaptations Scaffold" className="screen-only">
          <p style={styles.sectionIntro}>
            Class {selectedClass} is selected. Use this grid to record supports that will eventually change the student question view. Read aloud, worked examples, formula/reference sheets, simplified numbers, and lower-grade work are scaffolded now.
          </p>
          <div style={styles.adaptationGrid}>
            <div style={styles.adaptationHeader}>Student</div>
            <div style={styles.adaptationHeader}>Grade Level</div>
            {ADAPTATION_OPTIONS.map((option) => (
              <div key={option.key} style={styles.adaptationHeader}>{option.label}</div>
            ))}

            {students.map((student) => {
              const row = studentAdaptations?.[student] || {};
              return (
                <React.Fragment key={student}>
                  <button type="button" onClick={() => setCurrentStudent(student)} style={styles.adaptationStudentCell}>
                    <strong>{student}</strong>
                    <span>{student === currentStudent ? "Selected" : `Class ${selectedClass}`}</span>
                  </button>

                  <div style={styles.adaptationCell}>
                    <select
                      value={studentGradeLevels?.[student] || selectedGrade}
                      onChange={(e) => {
                        const nextGrade = e.target.value;
                        setStudentGradeLevels((prev) => ({ ...prev, [student]: nextGrade }));
                        setStudentAdaptations((prev) => ({
                          ...(prev || {}),
                          [student]: { ...(prev?.[student] || {}), gradeOverride: nextGrade },
                        }));
                      }}
                      style={styles.smallSelect}
                    >
                      {GRADE_OPTIONS.map((grade) => (
                        <option key={grade.id} value={grade.id}>{grade.label}</option>
                      ))}
                    </select>
                  </div>

                  {ADAPTATION_OPTIONS.map((option) => (
                    <label key={option.key} style={styles.adaptationCell}>
                      <input
                        type="checkbox"
                        checked={Boolean(row[option.key])}
                        onChange={(e) => {
                          setStudentAdaptations((prev) => ({
                            ...(prev || {}),
                            [student]: {
                              ...(prev?.[student] || {}),
                              [option.key]: e.target.checked,
                            },
                          }));
                        }}
                      />
                    </label>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
          <div style={styles.recommendationBox}>
            <strong>Safe scaffold note:</strong> Read aloud and support notices are active in student view now. Lower-grade content routing is scaffolded and ready for the next grade-level curriculum import.
          </div>
        </Card>

        <Card id="teacher-section-analytics" title="Class Analytics" className="screen-only">
          <div style={styles.statRow}>
            <Stat label="Students" value={analytics.totals.students} />
            <Stat label="Outcome Mastery" value={`${analytics.totals.masteredPercent}%`} />
            <Stat label="Ready to Assess" value={analytics.totals.readyCells} />
            <Stat label="Need Support" value={analytics.totals.supportCells} />
            <Stat label="Alerts" value={analytics.totals.alertCount} />
          </div>

          <h3>Outcome Snapshot</h3>
          <div style={styles.outcomeAnalyticsGrid}>
            {analytics.outcomeRows.map((row) => (
              <div key={row.outcome} style={styles.analyticsCard}>
                <div style={styles.analyticsTitle}>{row.outcome}</div>
                <div style={styles.cellSubtext}>{row.title}</div>
                <div style={styles.analyticsNumbers}>
                  <span>{row.mastered} mastered</span>
                  <span>{row.ready} ready</span>
                  <span>{row.support} support</span>
                  <span>{row.notStarted} not started</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card id="teacher-section-referrals" title="Intervention Referral / Catch-Up List" className="screen-only">
          <p style={styles.sectionIntro}>
            Generate a grouped list of students who are not yet meeting expectations, then open a reviewable email draft for a resource teacher. Nothing sends automatically.
          </p>

          <div style={styles.referralControls}>
            <label style={styles.fieldLabel}>
              Resource teacher email
              <input
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                style={styles.input}
                placeholder="resource.teacher@email.com"
              />
            </label>
            <label style={styles.fieldLabel}>
              Flag below accuracy
              <input
                type="number"
                value={referralThreshold}
                onChange={(e) => setReferralThreshold(e.target.value)}
                style={styles.smallInput}
                min="1"
                max="100"
              />
            </label>
          </div>

          <div style={styles.statRow}>
            <Stat label="Students Flagged" value={interventionReferralData.studentCount} />
            <Stat label="Support Items" value={interventionReferralData.itemCount} />
            <Stat label="Grouped By" value="Outcome + Indicator" />
            <Stat label="Sends Automatically" value="No" />
          </div>

          {interventionReferralData.outcomeGroups.length === 0 ? (
            <p style={styles.emptyText}>No students currently meet the referral criteria.</p>
          ) : (
            <div style={styles.referralPreviewBox}>
              <pre style={styles.referralPreviewText}>{interventionReferralBody}</pre>
            </div>
          )}

          <div style={styles.row}>
            <button type="button" onClick={copyInterventionReferral} style={styles.secondary}>
              Copy List
            </button>
            <button
              type="button"
              onClick={openInterventionReferralEmail}
              disabled={!referralEmail || interventionReferralData.itemCount === 0}
              style={{
                ...styles.primary,
                opacity: !referralEmail || interventionReferralData.itemCount === 0 ? 0.5 : 1,
                cursor: !referralEmail || interventionReferralData.itemCount === 0 ? "not-allowed" : "pointer",
              }}
            >
              Open Email Draft
            </button>
          </div>
        </Card>


        <Card id="teacher-section-interventions" title="Schedule Intervention + Follow-Up" className="screen-only">
          <p style={styles.sectionIntro}>
            Turn the referral list into scheduled support. Each scheduled item gets a follow-up date so you can check whether the intervention helped.
          </p>

          <div style={styles.referralControls}>
            <label style={styles.fieldLabel}>
              Intervention type
              <select value={interventionType} onChange={(e) => setInterventionType(e.target.value)} style={styles.input}>
                <option>Small Group</option>
                <option>Resource Catch-Up</option>
                <option>Mini Lesson</option>
                <option>1:1 Check-In</option>
                <option>Reassessment Prep</option>
              </select>
            </label>
            <label style={styles.fieldLabel}>
              Follow up in days
              <input
                type="number"
                min="1"
                max="14"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
                style={styles.smallInput}
              />
            </label>
            <label style={{ ...styles.fieldLabel, flex: "1 1 280px" }}>
              Notes
              <input value={interventionNotes} onChange={(e) => setInterventionNotes(e.target.value)} style={styles.input} />
            </label>
          </div>

          {interventionReferralData.outcomeGroups.length === 0 ? (
            <p style={styles.emptyText}>No flagged students to schedule right now.</p>
          ) : (
            <div style={styles.interventionScheduleList}>
              {interventionReferralData.outcomeGroups.map((group) => (
                <div key={group.outcome} style={styles.interventionScheduleGroup}>
                  <div style={styles.pathTitleRow}>
                    <strong>{group.outcome} — {group.title}</strong>
                    <span style={styles.curriculumStrandPill}>{group.indicators.length} area(s)</span>
                  </div>

                  {group.indicators.map((indicatorGroup) => (
                    <div key={indicatorGroup.indicator} style={styles.interventionScheduleIndicator}>
                      <div style={styles.pathTitleRow}>
                        <div>
                          <strong>{indicatorGroup.indicator}</strong>
                          <div style={styles.cellSubtext}>{indicatorGroup.text}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => scheduleReferralIndicatorGroup(group, indicatorGroup)}
                          style={styles.gridActionButton}
                        >
                          Schedule Group
                        </button>
                      </div>

                      <div style={styles.rowWrap}>
                        {indicatorGroup.students.map((item) => (
                          <button
                            key={`${indicatorGroup.indicator}-${item.student}-${item.reason}`}
                            type="button"
                            onClick={() => scheduleReferralStudent(group, indicatorGroup, item)}
                            style={styles.studentChipButton}
                          >
                            {item.student} · {item.accuracy}%
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Follow-Up Alerts" className="screen-only">
          <p style={styles.sectionIntro}>These are scheduled interventions that are due for a follow-up check today or earlier.</p>
          {dueInterventionPlans.length === 0 ? (
            <p style={styles.emptyText}>No follow-ups due today.</p>
          ) : (
            <div style={styles.interventionScheduleList}>
              {dueInterventionPlans.map((plan) => {
                const impact = getInterventionImpact(plan, indicatorStats);
                return (
                  <div key={plan.id} style={styles.interventionPlanRow}>
                    <div>
                      <strong>{plan.student}</strong> — {plan.outcome} / {plan.indicator}
                      <div style={styles.cellSubtext}>
                        {plan.type} · Follow-up due {formatISODate(plan.followUpDateISO)} · Baseline {plan.beforeAccuracy ?? "—"}% · Current {impact.after ?? "—"}%
                      </div>
                      <div style={styles.cellSubtext}>{plan.notes}</div>
                    </div>
                    <button type="button" onClick={() => onMarkInterventionReviewed?.(plan.id)} style={styles.gridActionButton}>
                      Mark Reviewed
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Intervention Timeline" className="screen-only">
          <p style={styles.sectionIntro}>A running list of scheduled supports, follow-up dates, and reviewed impact.</p>
          {interventionPlans.length === 0 ? (
            <p style={styles.emptyText}>No scheduled interventions yet.</p>
          ) : (
            <div style={styles.interventionScheduleList}>
              {interventionPlans.slice(0, 20).map((plan) => {
                const impact = getInterventionImpact(plan, indicatorStats);
                return (
                  <div key={plan.id} style={styles.interventionPlanRow}>
                    <div>
                      <strong>{plan.student}</strong> — {plan.type}
                      <div style={styles.cellSubtext}>
                        {plan.outcome} / {plan.indicator} · Scheduled {formatISODate(plan.scheduledDateISO)} · Follow-up {formatISODate(plan.followUpDateISO)}
                      </div>
                      <div style={styles.cellSubtext}>
                        Status: {plan.status} · Impact: {plan.status === "Reviewed" ? plan.impact : impact.label}
                        {impact.change !== null ? ` (${impact.change > 0 ? "+" : ""}${impact.change} pts)` : ""}
                      </div>
                    </div>
                    {plan.status !== "Reviewed" && (
                      <button type="button" onClick={() => onMarkInterventionReviewed?.(plan.id)} style={styles.gridActionButton}>
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card id="teacher-section-curriculum" title="Curriculum Browser" className="screen-only">
          <p style={styles.sectionIntro}>Nova Scotia Grade 2 outcomes are now loaded as structured outcomes and performance indicators. This curriculum map now drives generated practice questions and indicator evidence.</p>
          <div style={styles.curriculumBrowserGrid}>
            {Object.entries(GRADE2_CURRICULUM).map(([outcomeId, outcome]) => (
              <div key={outcomeId} style={styles.curriculumOutcomeCard}>
                <div style={styles.pathTitleRow}>
                  <strong>{outcomeId}</strong>
                  <span style={styles.curriculumStrandPill}>{outcome.strand}</span>
                </div>
                <p style={styles.cellSubtext}>{outcome.outcome}</p>
                <div style={styles.curriculumIndicatorList}>
                  {Object.entries(outcome.indicators).slice(0, 4).map(([indicatorId, text]) => (
                    <div key={indicatorId} style={styles.curriculumIndicatorItem}>
                      <strong>{indicatorId}</strong> — {text}
                    </div>
                  ))}
                  {Object.keys(outcome.indicators).length > 4 && <div style={styles.cellSubtext}>+ {Object.keys(outcome.indicators).length - 4} more indicator(s)</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card id="teacher-section-question-quality" title="Question Coverage Builder" className="screen-only">
          <p style={styles.sectionIntro}>Each Grade 2 performance indicator now receives easy, normal, and challenge question versions. This checks whether the curriculum engine is actually producing practice coverage.</p>
          {(() => {
            const coverage = getCurriculumCoverage();
            return (
              <>
                <div style={styles.statRow}>
                  <Stat label="Outcomes" value={coverage.totalOutcomes} />
                  <Stat label="Indicators" value={coverage.totalIndicators} />
                  <Stat label="Generated Questions" value={coverage.totalQuestions} />
                  <Stat label="Uncovered" value={coverage.uncoveredIndicators} />
                </div>

                <div style={styles.coverageGrid}>
                  {coverage.rows.map((row) => (
                    <div key={row.outcomeId} style={styles.coverageCard}>
                      <div style={styles.pathTitleRow}>
                        <strong>{row.outcomeId}</strong>
                        <span style={row.complete ? styles.coverageCompletePill : styles.coverageWarningPill}>
                          {row.complete ? "Covered" : "Needs items"}
                        </span>
                      </div>
                      <div style={styles.cellSubtext}>{row.title}</div>
                      <div style={styles.coverageBarTrack}>
                        <div
                          style={{
                            ...styles.coverageBarFill,
                            width: `${Math.round((row.coveredIndicators / row.indicators) * 100)}%`,
                          }}
                        />
                      </div>
                      <div style={styles.cellSubtext}>
                        {row.coveredIndicators}/{row.indicators} indicators · {row.questionCount} question versions
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </Card>


        <Card title="Curriculum Quality Audit" className="screen-only">
          <p style={styles.sectionIntro}>This checks whether the generated Grade 2 question set has enough difficulty depth and whether each indicator has a useful visual model type.</p>
          {(() => {
            const audit = getCurriculumQualityAudit();
            return (
              <>
                <div style={styles.statRow}>
                  <Stat label="Complete Indicators" value={`${audit.completeIndicators}/${audit.totalIndicators}`} />
                  <Stat label="Visual Types" value={audit.visualRows.length} />
                  <Stat label="Generic Visuals" value={audit.genericVisuals} />
                  <Stat label="Needs Review" value={audit.priorityIndicators.length} />
                </div>

                <h3>Visual Model Mix</h3>
                <div style={styles.coverageGrid}>
                  {audit.visualRows.map((row) => (
                    <div key={row.visualType} style={styles.coverageCard}>
                      <div style={styles.pathTitleRow}>
                        <strong>{row.visualType}</strong>
                        <span style={styles.visualTypePill}>{row.indicators} indicator(s)</span>
                      </div>
                      <div style={styles.cellSubtext}>{row.questions} generated question versions</div>
                    </div>
                  ))}
                </div>

                <h3>Indicators to Review First</h3>
                {audit.priorityIndicators.length === 0 ? (
                  <p style={styles.emptyText}>All indicators have easy, normal, and challenge versions with a mapped visual model.</p>
                ) : (
                  <div style={styles.priorityList}>
                    {audit.priorityIndicators.slice(0, 12).map((row) => (
                      <div key={row.indicatorId} style={styles.priorityRow}>
                        <div>
                          <strong>{row.indicatorId}</strong>
                          <div style={styles.cellSubtext}>{row.strand} · {row.visualType}</div>
                        </div>
                        <div style={styles.priorityInsight}>
                          {row.text}
                          <div style={styles.cellSubtext}>Sample: {row.samplePrompt}</div>
                        </div>
                        <div style={styles.priorityAction}>{row.teacherMove}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </Card>


        <Card title="Assessment Blueprint Check" className="screen-only">
          <p style={styles.sectionIntro}>This checks whether each outcome assessment pulls a balanced 6-question set instead of simply taking the first six questions.</p>
          {(() => {
            const blueprint = getAssessmentBlueprint(activeAllQuestions);

            return (
              <>
                <div style={styles.statRow}>
                  <Stat label="Ready Assessments" value={`${blueprint.ready.length}/${blueprint.rows.length}`} />
                  <Stat label="Needs Review" value={blueprint.review.length} />
                  <Stat label="Target Items" value="6 each" />
                  <Stat label="Balanced By" value="Indicator" />
                </div>

                <div style={styles.coverageGrid}>
                  {blueprint.rows.map((row) => (
                    <div key={`assessment-${row.outcomeId}`} style={styles.coverageCard}>
                      <div style={styles.pathTitleRow}>
                        <strong>{row.outcomeId} — {row.title}</strong>
                        <span style={row.status === "Ready" ? styles.coverageCompletePill : styles.coverageWarningPill}>{row.status}</span>
                      </div>
                      <div style={styles.cellSubtext}>
                        {row.totalQuestions} questions · {row.sampledIndicators}/{row.totalIndicators} indicators sampled · {row.indicatorCoverage}% coverage
                      </div>
                      <div style={styles.cellSubtext}>
                        Easy: {row.difficulties.easy || 0} · Normal: {row.difficulties.normal || 0} · Challenge: {row.difficulties.challenge || 0}
                      </div>
                      <div style={styles.cellSubtext}>Visuals: {row.visualTypes.join(", ")}</div>
                      <div style={styles.recommendationBox}>
                        <strong>Teacher move:</strong>
                        <p>{row.teacherMove}</p>
                      </div>
                      <details style={styles.detailsBox}>
                        <summary style={styles.detailsSummary}>Preview 6-question assessment mix</summary>
                        <div style={styles.indicatorList}>
                          {row.sample.map((item) => (
                            <div key={`${row.outcomeId}-${item.number}`} style={styles.indicatorRow}>
                              <div>
                                <strong>{item.number}. {item.indicator}</strong>
                                <div style={styles.cellSubtext}>{item.difficulty} · {item.visualType}</div>
                                <div style={styles.cellSubtext}>{item.prompt}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </Card>


        <Card title="Mastery Evidence Review" className="screen-only">
          <p style={styles.sectionIntro}>This explains why a student is ready, needs practice, or needs reassessment. It turns indicator attempts into teacher-facing evidence instead of only showing a status label.</p>
          {(() => {
            const evidence = getMasteryEvidenceReview(students, indicatorStats, assessmentStats, teacherAssignments);
            const selectedEvidence = evidence.rows.filter((row) => row.student === currentStudent);

            return (
              <>
                <div style={styles.statRow}>
                  <Stat label="Ready" value={evidence.readyCount} />
                  <Stat label="Reassess" value={evidence.reassessmentCount} />
                  <Stat label="Target Practice" value={evidence.targetedPracticeCount} />
                  <Stat label="Mastered" value={evidence.masteredCount} />
                </div>

                <h3>Selected Student Evidence</h3>
                <div style={styles.coverageGrid}>
                  {selectedEvidence.slice(0, 8).map((row) => (
                    <div key={`evidence-${row.student}-${row.outcomeId}`} style={styles.coverageCard}>
                      <div style={styles.pathTitleRow}>
                        <strong>{row.outcomeId} — {row.title}</strong>
                        <span style={
                          row.evidenceStatus === "Mastered" || row.evidenceStatus === "Ready for Assessment"
                            ? styles.coverageCompletePill
                            : styles.coverageWarningPill
                        }>
                          {row.evidenceStatus}
                        </span>
                      </div>
                      <div style={styles.cellSubtext}>
                        Evidence collected: {row.attemptedIndicators}/{row.totalIndicators} indicators · {row.totalAttempts} attempts · {row.totalCorrect} correct
                      </div>
                      <div style={styles.coverageBarTrack}>
                        <div style={{ ...styles.coverageBarFill, width: `${row.evidencePercent}%` }} />
                      </div>
                      <div style={styles.cellSubtext}>
                        Mastery rule: {row.masteredCount}/{row.requiredCount} indicators mastered
                      </div>
                      {row.weakIndicators.length > 0 && (
                        <div style={styles.cellSubtext}>
                          Watch: {row.weakIndicators.slice(0, 3).map((item) => `${item.indicator} (${item.accuracy}%)`).join(", ")}
                        </div>
                      )}
                      <div style={styles.recommendationBox}>
                        <strong>Teacher move:</strong>
                        <p>{row.teacherMove}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <h3>Class Evidence Priorities</h3>
                <div style={styles.priorityList}>
                  {evidence.priorityRows.slice(0, 12).map((row) => (
                    <div key={`evidence-priority-${row.student}-${row.outcomeId}`} style={styles.priorityRow}>
                      <div>
                        <strong>{row.student}</strong>
                        <div style={styles.cellSubtext}>{row.outcomeId} · {row.strand}</div>
                      </div>
                      <div style={styles.priorityInsight}>
                        {row.evidenceStatus}
                        <div style={styles.cellSubtext}>
                          {row.masteredCount}/{row.requiredCount} mastered · {row.totalAttempts} attempts
                        </div>
                      </div>
                      <div style={styles.priorityAction}>{row.teacherMove}</div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </Card>


        <Card title="Question Quality Review" className="screen-only">
          <p style={styles.sectionIntro}>This checks the generated questions for classroom usefulness: visual model, thinking steps, hints, misconception targeting, and curriculum alignment.</p>
          {(() => {
            const review = getQuestionQualityReview();
            const priority = [...review.needsRewrite, ...review.review].slice(0, 10);

            return (
              <>
                <div style={styles.statRow}>
                  <Stat label="Ready Questions" value={`${review.ready.length}/${review.rows.length}`} />
                  <Stat label="Ready Rate" value={`${review.readyPercent}%`} />
                  <Stat label="Needs Review" value={review.review.length} />
                  <Stat label="Rewrite First" value={review.needsRewrite.length} />
                </div>

                <h3>Outcome Question Readiness</h3>
                <div style={styles.coverageGrid}>
                  {review.byOutcome.map((row) => (
                    <div key={`quality-${row.outcome}`} style={styles.coverageCard}>
                      <div style={styles.pathTitleRow}>
                        <strong>{row.outcome}</strong>
                        <span style={row.rewrite > 0 ? styles.coverageWarningPill : styles.coverageCompletePill}>
                          {row.rewrite > 0 ? "Needs polish" : "Usable"}
                        </span>
                      </div>
                      <div style={styles.coverageBarTrack}>
                        <div
                          style={{
                            ...styles.coverageBarFill,
                            width: `${Math.round((row.ready / row.total) * 100)}%`,
                          }}
                        />
                      </div>
                      <div style={styles.cellSubtext}>
                        {row.ready} ready · {row.review} review · {row.rewrite} rewrite
                      </div>
                    </div>
                  ))}
                </div>

                <h3>Questions to Polish First</h3>
                {priority.length === 0 ? (
                  <p style={styles.emptyText}>All generated questions have usable visuals, hints, thinking steps, and curriculum links.</p>
                ) : (
                  <div style={styles.priorityList}>
                    {priority.map((row) => (
                      <div key={`question-quality-${row.id}`} style={styles.priorityRow}>
                        <div>
                          <strong>{row.indicator}</strong>
                          <div style={styles.cellSubtext}>{row.outcome} · {row.difficulty} · {row.visualType}</div>
                        </div>
                        <div style={styles.priorityInsight}>
                          {row.prompt}
                          <div style={styles.cellSubtext}>Quality score: {row.score}/5 · {row.rating}</div>
                        </div>
                        <div style={styles.priorityAction}>{row.nextMove}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </Card>

        <Card title="Question Improvement Studio" className="screen-only">
          <p style={styles.sectionIntro}>This turns the quality review into copy-ready teacher edits. It does not change the question bank automatically yet; it gives you the safer version to paste into the question generator later.</p>
          {(() => {
            const studio = buildQuestionImprovementStudio();

            return (
              <>
                <div style={styles.statRow}>
                  <Stat label="Ready to Use" value={studio.readyToUse} />
                  <Stat label="Teacher Edits Needed" value={studio.needsTeacherEdit} />
                  <Stat label="Safe Mode" value="Copy-first" />
                  <Stat label="Saved Drafts" value={savedQuestionEdits.length} />
                </div>

                {studio.suggestions.length === 0 ? (
                  <p style={styles.emptyText}>No priority question edits right now. The generated questions are ready enough for practice use.</p>
                ) : (
                  <div style={styles.editorList}>
                    {studio.suggestions.map((item) => (
                      <div key={`editor-${item.id}`} style={styles.editorCard}>
                        <div style={styles.pathTitleRow}>
                          <div>
                            <strong>{item.indicator}</strong>
                            <div style={styles.cellSubtext}>{item.outcome} · {item.difficulty} · {item.visualType}</div>
                          </div>
                          <span style={item.rating === "Needs Rewrite" ? styles.coverageWarningPill : styles.coverageCompletePill}>{item.rating}</span>
                        </div>

                        <div style={styles.editorSection}>
                          <span style={styles.editorLabel}>Current prompt</span>
                          <p>{item.prompt}</p>
                        </div>

                        <div style={styles.editorSectionStrong}>
                          <span style={styles.editorLabel}>Suggested improved prompt</span>
                          <p>{item.improvedPrompt}</p>
                        </div>

                        <div style={styles.editorTwoColumn}>
                          <div style={styles.editorMiniBox}>
                            <span style={styles.editorLabel}>Hint 1</span>
                            <p>{item.betterHint1}</p>
                          </div>
                          <div style={styles.editorMiniBox}>
                            <span style={styles.editorLabel}>Hint 2</span>
                            <p>{item.betterHint2}</p>
                          </div>
                        </div>

                        <div style={styles.editorSection}>
                          <span style={styles.editorLabel}>Misconception / teacher move</span>
                          <p>{item.misconception}</p>
                          <p><strong>{item.teacherMove}</strong></p>
                        </div>

                        <div style={styles.rowWrap}>
                          <button type="button" onClick={() => saveSuggestedQuestionEdit(item)} style={styles.gridActionButton}>
                            Save suggested edit
                          </button>
                          {questionEdits?.[item.id] && (
                            <button type="button" onClick={() => markQuestionEditReviewed(item.id)} style={styles.gridActionButton}>
                              Mark reviewed
                            </button>
                          )}
                          {questionEdits?.[item.id] && (
                            <span style={styles.assignmentPill}>{questionEdits[item.id].status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </Card>

        <Card title="Saved Question Drafts" className="screen-only">
          <p style={styles.sectionIntro}>These are teacher-approved improvements saved from the Question Improvement Studio. Reviewed drafts can now be published into the active student question flow, while the original generated bank stays preserved.</p>
          <div style={styles.statRow}>
            <Stat label="Saved Drafts" value={savedQuestionEdits.length} />
            <Stat label="Reviewed" value={savedQuestionEdits.filter((item) => item.status === "Reviewed").length} />
            <Stat label="Reviewed" value={questionEditCounts.reviewed} />
            <Stat label="Published" value={questionEditCounts.published} />
          </div>

          {savedQuestionEdits.length === 0 ? (
            <p style={styles.emptyText}>No saved question improvements yet. Use “Save suggested edit” in the Question Improvement Studio.</p>
          ) : (
            <div style={styles.editorList}>
              {savedQuestionEdits.slice(0, 8).map((item) => (
                <div key={`saved-edit-${item.id}`} style={styles.editorCard}>
                  <div style={styles.pathTitleRow}>
                    <div>
                      <strong>{item.indicator}</strong>
                      <div style={styles.cellSubtext}>{item.outcome} · {item.difficulty} · {item.visualType}</div>
                    </div>
                    <span style={item.status === "Reviewed" ? styles.coverageCompletePill : styles.coverageWarningPill}>{item.status}</span>
                  </div>
                  <div style={styles.editorTwoColumn}>
                    <div style={styles.editorMiniBox}>
                      <span style={styles.editorLabel}>Original</span>
                      <p>{item.originalPrompt}</p>
                    </div>
                    <div style={styles.editorMiniBox}>
                      <span style={styles.editorLabel}>Improved draft</span>
                      <p>{item.improvedPrompt}</p>
                    </div>
                  </div>
                  <div style={styles.cellSubtext}>Saved: {item.savedAt}{item.reviewedAt ? ` · Reviewed: ${item.reviewedAt}` : ""}{item.publishedAt ? ` · Published: ${item.publishedAt}` : ""}</div>
                  {item.versionHistory && item.versionHistory.length > 0 && (
                    <div style={styles.editorMiniBox}>
                      <span style={styles.editorLabel}>Version history</span>
                      {item.versionHistory.slice(0, 3).map((version, index) => (
                        <div key={`${item.id}-history-${index}`} style={styles.historyRow}>
                          <div>
                            <strong>{version.action}</strong>
                            <div style={styles.cellSubtext}>{version.at} · {version.status}</div>
                          </div>
                          {index > 0 && (
                            <button type="button" onClick={() => rollbackQuestionEdit(item.id, version)} style={styles.gridActionButton}>
                              Roll back
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={styles.rowWrap}>
                    {item.status !== "Reviewed" && item.status !== "Published" && (
                      <button type="button" onClick={() => markQuestionEditReviewed(item.id)} style={styles.gridActionButton}>
                        Mark reviewed
                      </button>
                    )}
                    {item.status === "Reviewed" && (
                      <button type="button" onClick={() => publishQuestionEdit(item.id)} style={styles.primarySmall}>
                        Publish to student flow
                      </button>
                    )}
                    {item.status === "Published" && (
                      <button type="button" onClick={() => unpublishQuestionEdit(item.id)} style={styles.gridActionButton}>
                        Unpublish
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setQuestionEdits((prev) => {
                        const updated = { ...(prev || {}) };
                        delete updated[item.id];
                        return updated;
                      })}
                      style={styles.gridActionButton}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Published Question Edits" className="screen-only">
          <p style={styles.sectionIntro}>These reviewed edits are now active in the student question flow. This is still safe: the original generated question remains stored, version history is tracked, and you can unpublish or roll back.</p>
          <div style={styles.statRow}>
            <Stat label="Published" value={questionEditCounts.published} />
            <Stat label="Reviewed Waiting" value={questionEditCounts.reviewed} />
            <Stat label="Saved Drafts" value={questionEditCounts.saved} />
            <Stat label="Original Bank" value="Preserved" />
          </div>
          {savedQuestionEdits.filter((item) => item.status === "Published").length === 0 ? (
            <p style={styles.emptyText}>No question edits are published yet. Mark a saved draft reviewed, then publish it when ready.</p>
          ) : (
            <div style={styles.editorList}>
              {savedQuestionEdits.filter((item) => item.status === "Published").slice(0, 6).map((item) => (
                <div key={`published-edit-${item.id}`} style={styles.editorCard}>
                  <div style={styles.pathTitleRow}>
                    <div>
                      <strong>{item.indicator}</strong>
                      <div style={styles.cellSubtext}>{item.outcome} · {item.difficulty} · Published: {item.publishedAt}</div>
                    </div>
                    <span style={styles.coverageCompletePill}>Active</span>
                  </div>
                  <div style={styles.editorTwoColumn}>
                    <div style={styles.editorMiniBox}>
                      <span style={styles.editorLabel}>Original prompt preserved</span>
                      <p>{item.originalPrompt}</p>
                    </div>
                    <div style={styles.editorMiniBox}>
                      <span style={styles.editorLabel}>Active student prompt</span>
                      <p>{item.improvedPrompt}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => unpublishQuestionEdit(item.id)} style={styles.gridActionButton}>
                    Restore original / unpublish
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Class Priority Board" className="screen-only">
          <p style={styles.sectionIntro}>A quick teacher trust layer: who needs attention first, why, and what action makes sense next.</p>

          <div style={styles.priorityList}>
            {priorityRows.map((row) => (
              <button
                key={`priority-${row.student}`}
                type="button"
                onClick={() => setCurrentStudent(row.student)}
                style={styles.priorityRow}
              >
                <div>
                  <strong>{row.student}</strong>
                  <div style={styles.cellSubtext}>{row.label}</div>
                </div>
                <div style={styles.priorityInsight}>
                  {row.insightLines[0]}
                </div>
                <div style={styles.priorityAction}>{row.nextStep}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Reassessment Watchlist" className="screen-only">
          <p style={styles.sectionIntro}>This closes the assessment loop: students who did not pass are separated from normal practice so the teacher can quickly reassign support before reassessment.</p>

          <div style={styles.priorityList}>
            {analytics.studentRows
              .flatMap((row) =>
                row.outcomes
                  .filter((display) => display.assessment.status === "Needs Reassessment")
                  .map((display) => ({ row, display }))
              )
              .map(({ row, display }) => (
                <div key={`reassessment-${row.student}-${display.outcome}`} style={styles.priorityRow}>
                  <div>
                    <strong>{row.student}</strong>
                    <div style={styles.cellSubtext}>{display.outcome} · {OUTCOME_TITLES[display.outcome]}</div>
                  </div>
                  <div style={styles.priorityInsight}>
                    Last assessment: {display.assessment.label}. Assign short targeted practice before retrying.
                  </div>
                  <div style={styles.rowWrap}>
                    <button type="button" onClick={() => onAssignOutcomePractice(row.student, display.outcome)} style={styles.gridActionButton}>
                      Assign Practice
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartAssessment(row.student, display.outcome)}
                      style={styles.gridActionButton}
                    >
                      Retry Assessment
                    </button>
                  </div>
                </div>
              ))}

            {analytics.studentRows.every((row) =>
              row.outcomes.every((display) => display.assessment.status !== "Needs Reassessment")
            ) && (
              <p style={styles.emptyText}>No reassessments needed right now.</p>
            )}
          </div>
        </Card>

        <Card title="Teacher Small Groups" className="screen-only">
          <p style={styles.sectionIntro}>Use this as your fast planning view. It groups students by what they most likely need next.</p>

          <div style={styles.groupGrid}>
            <GroupBox
              title="Ready for Assessment"
              helper="Assign or run the outcome assessment next."
              rows={groups.assessmentReady}
              empty="No students are assessment-ready yet."
              actionLabel="Assign Assessment to Group"
              onAssignGroup={() => onAssignGroupAssessment(groups.assessmentReady)}
            />
            <GroupBox
              title="Reteach / Simplify"
              helper="Use a mini lesson, simplified mode, or teacher table."
              rows={groups.reteach}
              empty="No students currently flagged for reteach."
              actionLabel="Assign Practice to Group"
              onAssignGroup={() => onAssignGroupPractice(groups.reteach)}
            />
            <GroupBox
              title="Practice Cycle"
              helper="Short targeted practice should move indicators forward."
              rows={groups.practice}
              empty="No students in regular practice right now."
              actionLabel="Assign Practice to Group"
              onAssignGroup={() => onAssignGroupPractice(groups.practice)}
            />
            <GroupBox
              title="Enrichment"
              helper="Give challenge tasks after assessed mastery."
              rows={groups.enrichment}
              empty="No students ready for enrichment yet."
            />
          </div>
        </Card>


        <Card title="Intervention Log" className="screen-only">
          <p style={styles.sectionIntro}>This records teacher moves and system interventions over time, so support decisions do not disappear after an assignment is completed.</p>

          {interventionLog.length === 0 ? (
            <p>No interventions logged yet. Assign practice, start an assessment, use mini lesson, or turn on simplified mode to record an entry.</p>
          ) : (
            <div style={styles.indicatorList}>
              {interventionLog.slice(0, 12).map((item) => (
                <div key={item.id} style={styles.indicatorRow}>
                  <div>
                    <strong>{item.student} · {item.type}</strong>
                    <div style={styles.cellSubtext}>{item.action} · {item.target}</div>
                    {item.note && <div style={styles.cellSubtext}>{item.note}</div>}
                    <div style={styles.cellSubtext}>{item.date} at {item.time} · Source: {item.source}</div>
                  </div>
                  <span style={styles.indicatorStatus}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Intervention Impact Tracker" className="screen-only">
          <p style={styles.sectionIntro}>This checks whether recent teacher moves are leading to improved practice, assessment success, or a need for another support cycle.</p>

          <div style={styles.indicatorList}>
            {getInterventionImpactRows(students, interventionLog, practiceStats, assessmentStats, indicatorStats).map((row) => (
              <div key={`impact-${row.student}`} style={styles.indicatorRow}>
                <div>
                  <strong>{row.student}</strong>
                  <div style={styles.cellSubtext}>{row.impact}</div>
                  <div style={styles.cellSubtext}><strong>Next move:</strong> {row.nextMove}</div>
                  {row.weakIndicator && (
                    <div style={styles.cellSubtext}>Watch: {row.weakIndicator.indicator} · {row.weakIndicator.accuracy}% over {row.weakIndicator.attempts} attempt(s)</div>
                  )}
                  <div style={styles.cellSubtext}>{row.logCount} logged intervention{row.logCount === 1 ? "" : "s"}</div>
                </div>
                <span
                  style={{
                    ...styles.indicatorStatus,
                    background:
                      row.tone === "positive"
                        ? "#dcfce7"
                        : row.tone === "urgent"
                        ? "#ffe4e6"
                        : row.tone === "watch"
                        ? "#fef3c7"
                        : "#f8fafc",
                    color:
                      row.tone === "positive"
                        ? "#166534"
                        : row.tone === "urgent"
                        ? "#be123c"
                        : row.tone === "watch"
                        ? "#92400e"
                        : "#64748b",
                  }}
                >
                  {row.tone === "positive" ? "Improving" : row.tone === "urgent" ? "Act Now" : row.tone === "watch" ? "Watch" : "No Data"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Weekly Intervention Planner" className="screen-only">
          <p style={styles.sectionIntro}>This turns the data into a simple teaching plan: who to pull, who to assess, and what the next teacher move should be.</p>

          <div style={styles.plannerGrid}>
            {getWeeklyInterventionPlan(analytics).map((plan) => (
              <div key={`weekly-plan-${plan.outcome}`} style={styles.plannerCard}>
                <div style={styles.plannerHeader}>
                  <div>
                    <strong>{plan.outcome}</strong>
                    <div style={styles.cellSubtext}>{plan.title}</div>
                  </div>
                  <span style={styles.plannerPill}>{plan.focus}</span>
                </div>

                <p style={styles.plannerMove}>{plan.teacherMove}</p>

                <div style={styles.cellSubtext}>Students</div>
                <div style={styles.studentChipRow}>
                  {plan.studentNames.length > 0 ? (
                    plan.studentNames.map((name) => (
                      <button
                        key={`${plan.outcome}-${name}`}
                        type="button"
                        onClick={() => setCurrentStudent(name)}
                        style={styles.studentChip}
                      >
                        {name}
                      </button>
                    ))
                  ) : (
                    <span style={styles.emptyMini}>No students flagged yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Teacher Intelligence Dashboard" className="screen-only">
          <div style={styles.statRow}>
            <Stat label="Current Skill" value={currentSkill} />
            <Stat label="Correct Streak" value={`${correctStreak}/3`} />
            <Stat label="Completed" value={completedSkills.length} />
            <Stat label="Saved Students" value={Object.keys(classSnapshot).length} />
          </div>

          <div style={styles.teacherActions}>
            <button type="button" onClick={() => onAssignWeakestPractice(currentStudent)} style={styles.primary}>Assign Weakest Practice</button>
            <button type="button" onClick={() => onForceMiniLesson(currentStudent)} style={styles.secondary}>Mini Lesson</button>
            <button type="button" onClick={() => onSimplify(currentStudent)} style={styles.secondary}>Simplify</button>
          </div>

          <p><strong>Selected student:</strong> {currentStudent}</p>

          <h3>Class Grid</h3>
          <div style={styles.classGrid}>
            <div style={styles.classGridHeader}>Student</div>
            {OUTCOMES.map((outcome) => <div key={outcome} style={styles.classGridHeader}>{outcome}</div>)}
            <div style={styles.classGridHeader}>What next?</div>
            <div style={styles.classGridHeader}>Actions</div>

            {analytics.studentRows.map((row) => (
              <React.Fragment key={row.student}>
                <button type="button" onClick={() => setCurrentStudent(row.student)} style={{ ...styles.classGridCell, textAlign: "left", cursor: "pointer" }}>
                  <strong>{row.student}</strong>
                  <div style={styles.cellSubtext}>{row.student === currentStudent ? "Selected" : "View details"}</div>
                </button>

                {OUTCOMES.map((outcome) => {
                  const cell = getOutcomeDisplay(indicatorStats, assessmentStats, row.student, outcome);
                  return (
                    <div key={outcome} style={{ ...styles.classGridCell, background: cell.background, color: cell.color, fontWeight: 800 }}>
                      {cell.label}
                      <div style={styles.cellSubtext}>{cell.status}</div>
                    </div>
                  );
                })}

                <div style={styles.classGridCell}>{row.nextStep}</div>

                <div style={styles.classGridActions}>
                  <button type="button" onClick={() => onAssignWeakestPractice(row.student)} style={styles.gridActionButton}>Practice</button>
                  <button type="button" onClick={() => onForceMiniLesson(row.student)} style={styles.gridActionButton}>Mini</button>
                  <button type="button" onClick={() => onSimplify(row.student)} style={styles.gridActionButton}>Simplify</button>
                  {teacherAssignments[row.student] && (
                      <span style={getAssignmentPillStyle(teacherAssignments[row.student])}>
                        {getAssignmentLabel(teacherAssignments[row.student])}
                      </span>
                    )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </Card>

        <Card title="Student Drill-Down" className="screen-only">
          <div style={styles.drillHeader}>
            <div>
              <p style={styles.drillEyebrow}>Selected Student</p>
              <h3 style={styles.drillTitle}>{currentStudent}</h3>
            </div>
            <div style={styles.drillBadge}>{selectedSummary?.nextStep}</div>
          </div>

          <div style={styles.drillGrid}>
            {OUTCOMES.map((outcome) => {
              const display = getOutcomeDisplay(indicatorStats, assessmentStats, currentStudent, outcome);
              return (
                <div key={outcome} style={styles.drillStat}>
                  <span>{outcome} · {OUTCOME_TITLES[outcome]}</span>
                  <strong>{display.progressLabel}</strong>
                  <small>{display.status} · Assessment: {display.assessment.status}</small>
                </div>
              );
            })}
          </div>

          <div style={styles.recommendationBox}>
            <strong>Recommended next step:</strong>
            <p>{selectedSummary?.nextStep}</p>
          </div>

          <div style={styles.insightBox}>
            <strong>Teacher insight:</strong>
            <ul style={styles.insightList}>
              {selectedInsightLines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>

          <h3>Teacher Assignments</h3>
          <div style={styles.assignmentBox}>
            {teacherAssignments[currentStudent] ? (
              <>
                <div>
                  <strong>Current assignment:</strong> {teacherAssignments[currentStudent].type} {teacherAssignments[currentStudent].target}
                  <div style={styles.cellSubtext}>Status: {teacherAssignments[currentStudent].status || "assigned"}</div>
                  <div style={styles.cellSubtext}>Assigned: {teacherAssignments[currentStudent].assignedAt}</div>
                  {teacherAssignments[currentStudent].result && (
                    <div style={styles.cellSubtext}>
                      Completed: {teacherAssignments[currentStudent].result.accuracy}% · {teacherAssignments[currentStudent].result.status}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => onClearAssignment(currentStudent)} style={styles.gridActionButton}>Clear</button>
              </>
            ) : <span>No active assignment.</span>}
          </div>

          <div style={styles.assignmentActions}>
            {OUTCOMES.map((outcome) => {
              const display = getOutcomeDisplay(indicatorStats, assessmentStats, currentStudent, outcome);
              return (
                <React.Fragment key={outcome}>
                  <button type="button" onClick={() => onAssignOutcomePractice(currentStudent, outcome)} style={styles.gridActionButton}>Assign Practice {outcome}</button>
                  <button
                    type="button"
                    onClick={() => onStartAssessment(currentStudent, outcome)}
                    disabled={!display.readyForAssessment}
                    style={{ ...styles.gridActionButton, opacity: display.readyForAssessment ? 1 : 0.5, cursor: display.readyForAssessment ? "pointer" : "not-allowed" }}
                  >
                    {display.readyForAssessment ? `Assign Assessment ${outcome}` : `${outcome} Assessment Locked`}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <h3>Indicator Progress</h3>
          {selectedIndicators.length === 0 ? <p>No indicator data yet.</p> : (
            <div style={styles.indicatorList}>
              {selectedIndicators.map((item) => (
                <div key={item.indicator} style={styles.indicatorRow}>
                  <div>
                    <strong>{item.indicator}</strong>
                    <div style={styles.cellSubtext}>{item.correct}/{item.attempts} correct · {item.accuracy}%</div>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Student Conference Notes" className="screen-only">
          <p style={styles.sectionIntro}>A quick teacher-facing note generator for conferences, parent updates, or support team meetings.</p>

          <div style={styles.noteGrid}>
            <div style={styles.noteBox}>
              <strong>Strength</strong>
              <p>{selectedConferenceNotes.strength}</p>
            </div>
            <div style={styles.noteBox}>
              <strong>Concern / Watch Point</strong>
              <p>{selectedConferenceNotes.concern}</p>
            </div>
            <div style={styles.noteBox}>
              <strong>Next Teaching Move</strong>
              <p>{selectedConferenceNotes.nextStep}</p>
            </div>
          </div>

          <label style={styles.noteLabel}>Copy-ready family update</label>
          <textarea
            readOnly
            value={selectedConferenceNotes.familyNote}
            style={styles.noteTextarea}
          />
        </Card>

        <Card id="teacher-section-family" title="Family Communication" className="screen-only">
          <p style={styles.sectionIntro}>Generate a family-friendly update from the selected student's current evidence. Nothing sends automatically.</p>

          <div style={styles.noteGrid}>
            <div style={styles.noteBox}>
              <label style={styles.noteLabel}>Family email</label>
              <input
                value={familyEmail}
                onChange={(event) => setFamilyEmail(event.target.value)}
                placeholder="family@example.com"
                style={styles.input}
              />
            </div>
            <div style={styles.noteBox}>
              <label style={styles.noteLabel}>Tone</label>
              <select value={familyTone} onChange={(event) => setFamilyTone(event.target.value)} style={styles.select}>
                <option value="simple">Simple</option>
                <option value="bullet">Bullet update</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div style={styles.noteBox}>
              <label style={styles.noteLabel}>Custom note</label>
              <input
                value={familyCustomNote}
                onChange={(event) => setFamilyCustomNote(event.target.value)}
                placeholder="Optional teacher note"
                style={styles.input}
              />
            </div>
          </div>

          <label style={styles.noteLabel}>Preview</label>
          <textarea readOnly value={familyUpdateBody} style={styles.noteTextarea} />

          <div style={styles.row}>
            <button type="button" onClick={copyFamilyUpdate} style={styles.primary}>Copy Family Update</button>
            <button type="button" onClick={openFamilyUpdateEmail} style={styles.secondary}>Open Email Draft</button>
          </div>
        </Card>


        <Card id="teacher-section-reports" title="Class Outcome Report" className="screen-only">

          <p style={styles.sectionIntro}>A report-card style overview for the whole class. Green means assessed mastery, yellow means ready or developing, and red means support is needed.</p>

          <div style={styles.reportMatrix}>
            <div style={styles.reportMatrixHeader}>Student</div>
            {OUTCOMES.map((outcome) => (
              <div key={outcome} style={styles.reportMatrixHeader}>{outcome}</div>
            ))}
            <div style={styles.reportMatrixHeader}>Teacher Comment</div>

            {analytics.studentRows.map((row) => {
              const firstPriority = row.outcomes.find((item) => item.assessment.status !== "Passed") || row.outcomes[0];
              return (
                <React.Fragment key={`report-${row.student}`}>
                  <div style={styles.reportMatrixCell}><strong>{row.student}</strong></div>
                  {row.outcomes.map((display) => (
                    <div
                      key={`${row.student}-${display.outcome}`}
                      style={{
                        ...styles.reportMatrixCell,
                        background: display.background,
                        color: display.color,
                        fontWeight: 850,
                      }}
                    >
                      <div>{display.progressLabel}</div>
                      <div style={styles.cellSubtext}>{display.status}</div>
                    </div>
                  ))}
                  <div style={styles.reportMatrixCell}>{getReportCardComment(firstPriority)}</div>
                </React.Fragment>
              );
            })}
          </div>
        </Card>


        <Card title="Print / Export Pack" className="screen-only">
          <p style={styles.sectionIntro}>Use this when you need a meeting handout, parent update, or weekly planning record. The print view now includes both a class planning page and the selected student report.</p>
          <div style={styles.teacherActions}>
            <button type="button" onClick={() => window.print()} style={styles.primary}>Print Report Pack</button>
            <button type="button" onClick={() => setCurrentStudent(currentStudent)} style={styles.secondary}>Selected: {currentStudent}</button>
          </div>
          <div style={styles.noteGrid}>
            <div style={styles.noteBox}>
              <strong>Prints first</strong>
              <p>Class planning summary with ready-to-assess, reteach, practice, and enrichment groups.</p>
            </div>
            <div style={styles.noteBox}>
              <strong>Then prints</strong>
              <p>Selected student outcome report, indicator details, assessment status, and family update note.</p>
            </div>
          </div>
        </Card>

        <Card title="Printable Class Planning Pack" className="print-report-card">
          <div style={styles.printReport}>
            <h2>Class Math Planning Summary</h2>
            <p><strong>Students:</strong> {students.length}</p>
            <p><strong>Outcome mastery:</strong> {analytics.totals.masteredPercent}%</p>
            <p><strong>Ready to assess:</strong> {analytics.totals.readyCells}</p>
            <p><strong>Need support:</strong> {analytics.totals.supportCells}</p>

            <h3>Outcome Snapshot</h3>
            <table style={styles.reportTable}>
              <thead>
                <tr>
                  <th style={styles.reportCell}>Outcome</th>
                  <th style={styles.reportCell}>Mastered</th>
                  <th style={styles.reportCell}>Ready</th>
                  <th style={styles.reportCell}>Support</th>
                  <th style={styles.reportCell}>Not Started</th>
                </tr>
              </thead>
              <tbody>
                {analytics.outcomeRows.map((row) => (
                  <tr key={`print-class-${row.outcome}`}>
                    <td style={styles.reportCell}>{row.outcome}</td>
                    <td style={styles.reportCell}>{row.mastered}</td>
                    <td style={styles.reportCell}>{row.ready}</td>
                    <td style={styles.reportCell}>{row.support}</td>
                    <td style={styles.reportCell}>{row.notStarted}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Instructional Groups</h3>
            <table style={styles.reportTable}>
              <thead>
                <tr>
                  <th style={styles.reportCell}>Group</th>
                  <th style={styles.reportCell}>Students</th>
                  <th style={styles.reportCell}>Teacher Move</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.reportCell}>Ready for Assessment</td>
                  <td style={styles.reportCell}>{groups.assessmentReady.map((row) => row.student).join(", ") || "—"}</td>
                  <td style={styles.reportCell}>Run or assign the outcome assessment.</td>
                </tr>
                <tr>
                  <td style={styles.reportCell}>Reteach / Simplify</td>
                  <td style={styles.reportCell}>{groups.reteach.map((row) => row.student).join(", ") || "—"}</td>
                  <td style={styles.reportCell}>Pull for mini lesson, simplified numbers, or teacher table.</td>
                </tr>
                <tr>
                  <td style={styles.reportCell}>Practice Cycle</td>
                  <td style={styles.reportCell}>{groups.practice.map((row) => row.student).join(", ") || "—"}</td>
                  <td style={styles.reportCell}>Assign short targeted practice by outcome.</td>
                </tr>
                <tr>
                  <td style={styles.reportCell}>Enrichment</td>
                  <td style={styles.reportCell}>{groups.enrichment.map((row) => row.student).join(", ") || "—"}</td>
                  <td style={styles.reportCell}>Give challenge, explanation, or extension tasks.</td>
                </tr>
              </tbody>
            </table>

            <h3>Priority Students</h3>
            <table style={styles.reportTable}>
              <thead>
                <tr>
                  <th style={styles.reportCell}>Student</th>
                  <th style={styles.reportCell}>Priority</th>
                  <th style={styles.reportCell}>Next Step</th>
                </tr>
              </thead>
              <tbody>
                {priorityRows.map((row) => (
                  <tr key={`print-priority-${row.student}`}>
                    <td style={styles.reportCell}>{row.student}</td>
                    <td style={styles.reportCell}>{row.label}</td>
                    <td style={styles.reportCell}>{row.nextStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Printable Student Report Pack" className="print-report-card">
          <div style={styles.printReport}>
            <h2>Student Progress Report Pack</h2>
            <p><strong>Student:</strong> {currentStudent}</p>
            <p><strong>Current need:</strong> {selectedSummary?.nextStep}</p>
            <p><strong>Strength:</strong> {selectedConferenceNotes.strength}</p>
            <p><strong>Concern / watch point:</strong> {selectedConferenceNotes.concern}</p>
            <p><strong>Next teaching move:</strong> {selectedConferenceNotes.nextStep}</p>

            <h3>Outcome Summary</h3>
            <table style={styles.reportTable}>
              <thead>
                <tr>
                  <th style={styles.reportCell}>Outcome</th>
                  <th style={styles.reportCell}>Indicators Ready</th>
                  <th style={styles.reportCell}>Readiness</th>
                  <th style={styles.reportCell}>Assessment</th>
                  <th style={styles.reportCell}>Report Status</th>
                </tr>
              </thead>
              <tbody>
                {OUTCOMES.map((outcome) => {
                  const display = getOutcomeDisplay(indicatorStats, assessmentStats, currentStudent, outcome);
                  return (
                    <tr key={outcome}>
                      <td style={styles.reportCell}>{outcome}</td>
                      <td style={styles.reportCell}>{display.masteredCount}/{display.requiredCount}</td>
                      <td style={styles.reportCell}>{display.readyForAssessment ? "Ready" : display.status}</td>
                      <td style={styles.reportCell}>{display.assessment.status === "Not Started" ? "—" : `${display.assessment.label} · ${display.assessment.status}`}</td>
                      <td style={styles.reportCell}>{display.assessment.status === "Passed" ? "Outcome Mastered" : display.readyForAssessment ? "Ready for Assessment" : "Continue Practice"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h3>Indicator Summary</h3>
            {selectedIndicators.length === 0 ? <p>No indicator data yet.</p> : (
              <table style={styles.reportTable}>
                <thead>
                  <tr>
                    <th style={styles.reportCell}>Indicator</th>
                    <th style={styles.reportCell}>Attempts</th>
                    <th style={styles.reportCell}>Correct</th>
                    <th style={styles.reportCell}>Accuracy</th>
                    <th style={styles.reportCell}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedIndicators.map((item) => (
                    <tr key={item.indicator}>
                      <td style={styles.reportCell}>{item.indicator}</td>
                      <td style={styles.reportCell}>{item.attempts}</td>
                      <td style={styles.reportCell}>{item.correct}</td>
                      <td style={styles.reportCell}>{item.accuracy}%</td>
                      <td style={styles.reportCell}>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3>Family Update</h3>
            <p>{selectedConferenceNotes.familyNote}</p>

            <h3>Teacher Notes</h3>
            <p>Use the next-step recommendation first. Assign assessment only when the indicator rule is met.</p>
            <p style={styles.printTip}>To print: use Ctrl + P.</p>
          </div>
        </Card>

        <Card title="Live Alerts" className="screen-only">
          {alerts.length === 0 ? <p>No alerts yet.</p> : alerts.map((alert, index) => (
            <div key={`${alert.student}-${alert.time}-${index}`} style={styles.alertCard}>
              <strong>{alert.student}</strong>
              <p><strong>Outcome:</strong> {alert.outcome}</p>
              <p><strong>Skill:</strong> {alert.skill}</p>
              <p><strong>Issue:</strong> {alert.issue}</p>
              <p><strong>Auto intervention:</strong> {alert.intervention}</p>
            </div>
          ))}
        </Card>

        <Card title="Mistake Pattern Tracker" className="screen-only">
          {Object.keys(mistakeCounts).length === 0 ? <p>No mistake patterns yet.</p> : Object.entries(mistakeCounts).map(([key, count]) => (
            <div key={key} style={styles.patternRow}><strong>{key}</strong><span>{count} mistake(s)</span></div>
          ))}
        </Card>

        <Card title="Practice Effectiveness" className="screen-only">
          {Object.keys(practiceStats).length === 0 ? <p>No practice data yet.</p> : Object.entries(practiceStats).map(([key, data]) => (
            <div key={key} style={styles.patternRow}>
              <div>
                <strong>{key}</strong>
                <div>Practice: {data.correct ?? 0}/{data.attempts ?? 0} correct</div>
                <div>Accuracy: {data.accuracy ?? "-"}%</div>
              </div>
              <div>{data.status ?? "In progress"}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}


function CurriculumVisual({ question }) {
  const visualType = question?.visualType || "generic";
  const label = question?.curriculumText || question?.skill || "Use the model to choose the best answer.";

  const visualConfig = {
    baseTen: {
      title: "Base-ten / ten-frame model",
      callout: "Count tens first, then count ones.",
      model: <BaseTenModel tens={2} ones={6} />,
    },
    coins: {
      title: "Coin model",
      callout: "Group coin values, then count on.",
      model: <CoinModel coins={["25¢", "10¢", "10¢", "5¢"]} />,
    },
    tallies: {
      title: "Tally model",
      callout: "Every bundle of five makes counting faster.",
      model: <TallyModel groups={[5, 5, 3]} />,
    },
    numberLine: {
      title: "Number line / sequence model",
      callout: "Look for the pattern in the spaces between numbers.",
      model: <NumberLineModel values={[20, 30, 40, "?", 60]} />,
    },
    pattern: {
      title: "Pattern model",
      callout: "Find the repeating core or the growth rule.",
      model: <PatternModel items={["▲", "●", "▲", "●", "▲", "?"]} />,
    },
    balance: {
      title: "Equality model",
      callout: "Both sides must have the same value for equality.",
      model: <BalanceModel left="10 + 5" middle="=" right="15" />,
    },
    calendar: {
      title: "Calendar model",
      callout: "Use rows and weekdays to organize time.",
      model: <CalendarModel />,
    },
    measurement: {
      title: "Measurement model",
      callout: "Units must touch with no gaps or overlaps.",
      model: <MeasurementModel units={6} />,
    },
    geometry: {
      title: "Shape model",
      callout: "Sort by attributes like sides, faces, corners, and curves.",
      model: <GeometryModel />,
    },
    graph: {
      title: "Data / graph model",
      callout: "Compare bar heights to answer the question.",
      model: <GraphModel values={[3, 5, 2]} labels={["A", "B", "C"]} />,
    },
  };

  const config = visualConfig[visualType] || {
    title: "Curriculum focus",
    callout: "Use the evidence in the model to decide.",
    model: <div style={styles.genericVisualModel}>Think → Model → Answer</div>,
  };

  return (
    <div style={styles.visualBox}>
      <div style={styles.visualHeaderRow}>
        <div>
          <div style={styles.visualTitle}>{config.title}</div>
          <p style={styles.visualCallout}>{config.callout}</p>
        </div>
        <span style={styles.visualTypePill}>{visualType}</span>
      </div>
      <div style={styles.visualModelStage}>{config.model}</div>
      <p style={styles.visualCaption}>{label}</p>
    </div>
  );
}

function BaseTenModel({ tens = 2, ones = 6 }) {
  return (
    <div style={styles.baseTenStage}>
      <div style={styles.baseTenTensGroup}>
        {Array.from({ length: tens }).map((_, rodIndex) => (
          <div key={rodIndex} style={styles.tenFrameRod}>
            {Array.from({ length: 10 }).map((_, index) => (
              <span key={index} style={styles.tenFrameMiniCell} />
            ))}
          </div>
        ))}
      </div>
      <div style={styles.baseTenOnesGroup}>
        {Array.from({ length: ones }).map((_, index) => (
          <span key={index} style={styles.oneCubePolished}>1</span>
        ))}
      </div>
      <div style={styles.modelEquation}>{tens} tens + {ones} ones = {tens * 10 + ones}</div>
    </div>
  );
}

function CoinModel({ coins }) {
  return (
    <div>
      <div style={styles.coinRowPolished}>
        {coins.map((coin, index) => (
          <div key={`${coin}-${index}`} style={styles.coinPolished}>
            <span>{coin}</span>
          </div>
        ))}
      </div>
      <div style={styles.modelEquation}>25 + 10 + 10 + 5 = 50¢</div>
    </div>
  );
}

function TallyModel({ groups }) {
  return (
    <div style={styles.tallyStage}>
      {groups.map((count, groupIndex) => (
        <div key={groupIndex} style={styles.tallyGroupBox}>
          {Array.from({ length: count }).map((_, index) => (
            <span key={index} style={index === 4 ? styles.tallySlash : styles.tallyMark} />
          ))}
        </div>
      ))}
      <div style={styles.modelEquation}>5 + 5 + 3 = 13</div>
    </div>
  );
}

function NumberLineModel({ values }) {
  return (
    <div style={styles.numberLineStage}>
      <div style={styles.numberLineTrack} />
      <div style={styles.numberLineDots}>
        {values.map((value, index) => (
          <div key={index} style={styles.numberLineDotGroup}>
            <span style={value === "?" ? styles.numberBubbleMissing : styles.numberBubblePolished}>{value}</span>
            {index < values.length - 1 && <span style={styles.numberLineJump}>+10</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternModel({ items }) {
  return (
    <div style={styles.patternStage}>
      {items.map((item, index) => (
        <span key={index} style={item === "?" ? styles.patternTokenMissing : styles.patternTokenPolished}>{item}</span>
      ))}
    </div>
  );
}

function BalanceModel({ left, middle, right }) {
  return (
    <div style={styles.balanceStage}>
      <div style={styles.balancePan}>{left}</div>
      <div style={styles.balanceCenter}>{middle}</div>
      <div style={styles.balancePan}>{right}</div>
    </div>
  );
}

function CalendarModel() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div style={styles.calendarStage}>
      {days.map((day) => <div key={day} style={styles.calendarHeaderCell}>{day}</div>)}
      {Array.from({ length: 14 }).map((_, index) => (
        <div key={index} style={index === 9 ? styles.calendarDayActive : styles.calendarDayCell}>{index + 1}</div>
      ))}
    </div>
  );
}

function MeasurementModel({ units }) {
  return (
    <div>
      <div style={styles.measurementObject}>object to measure</div>
      <div style={styles.measurementRowPolished}>
        {Array.from({ length: units }).map((_, index) => (
          <span key={index} style={styles.unitBlockPolished}>{index + 1}</span>
        ))}
      </div>
    </div>
  );
}

function GeometryModel() {
  return (
    <div style={styles.shapeSortStage}>
      <div style={styles.shapeSortColumn}><strong>Has corners</strong><span style={styles.shapeSquarePolished} /><span style={styles.shapeTrianglePolished}>△</span></div>
      <div style={styles.shapeSortColumn}><strong>Curved</strong><span style={styles.shapeCirclePolished} /></div>
    </div>
  );
}

function GraphModel({ values, labels }) {
  return (
    <div style={styles.graphStage}>
      {values.map((height, index) => (
        <div key={index} style={styles.graphColumn}>
          <div style={{ ...styles.barGraphBarPolished, height: height * 20 }} />
          <strong>{labels[index]}</strong>
        </div>
      ))}
    </div>
  );
}

function FractionVisual({ selected, setSelected }) {
  const parts = ["1/4", "2/4", "3/4", "4/4"];
  return (
    <div style={styles.visualBox}>
      <div style={styles.fractionBar}>
        {parts.map((part, index) => (
          <button
            key={part}
            type="button"
            onClick={() => setSelected("3/4")}
            style={{
              ...styles.fractionPart,
              background: index < 3 ? "#bfdbfe" : "#ffffff",
              borderColor: selected === "3/4" ? "#2563eb" : "#cbd5e1",
            }}
            aria-label={`fraction part ${part}`}
          />
        ))}
      </div>
      <p style={styles.cellSubtext}>3 shaded parts out of 4 equal parts</p>
    </div>
  );
}

function DecimalVisual() {
  return (
    <div style={styles.visualBox}>
      <div style={styles.decimalGrid}>
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} style={{ ...styles.decimalCell, background: index < 7 ? "#bbf7d0" : "#ffffff" }} />
        ))}
      </div>
      <p style={styles.cellSubtext}>7 tenths shown on a ten-part model</p>
    </div>
  );
}

function Card({ title, children, className = "", id = "" }) {
  return (
    <section id={id} style={styles.card} className={className}>
      <h2 style={styles.cardTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.statBox}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressItem({ label, value }) {
  return (
    <div style={styles.progressChip}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GroupBox({ title, helper, rows, empty, actionLabel, onAssignGroup }) {
  return (
    <div style={styles.groupBox}>
      <h3 style={styles.groupTitle}>{title}</h3>
      <p style={styles.cellSubtext}>{helper}</p>
      {rows.length === 0 ? (
        <p style={styles.emptyText}>{empty}</p>
      ) : (
        <>
          <div style={styles.groupList}>
            {rows.map((row) => (
              <div key={row.student} style={styles.groupStudent}>
                <strong>{row.student}</strong>
                <span>{row.nextStep}</span>
              </div>
            ))}
          </div>
          {onAssignGroup && (
            <button type="button" onClick={onAssignGroup} style={styles.groupAssignButton}>
              {actionLabel || "Assign to Group"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function getAssignmentLabel(assignment) {
  if (!assignment) return "";
  if (assignment.status === "completed") {
    return `🟢 Completed ${assignment.result?.accuracy ?? "—"}%`;
  }
  if (assignment.status === "in_progress") {
    return `🔵 In progress ${assignment.type} ${assignment.target}`;
  }
  return `🟡 Assigned ${assignment.type} ${assignment.target}`;
}

function getAssignmentPillStyle(assignment) {
  if (assignment?.status === "completed") {
    return { ...styles.assignmentPill, background: "#dcfce7", color: "#166534" };
  }
  if (assignment?.status === "in_progress") {
    return { ...styles.assignmentPill, background: "#dbeafe", color: "#1e40af" };
  }
  return styles.assignmentPill;
}

function StatusPill({ status }) {
  const background = status === "Mastered" || status === "Ready for Assessment" ? "#dcfce7" : status === "Developing" ? "#fef3c7" : status === "Not Started" ? "#f8fafc" : "#ffe4e6";
  const color = status === "Mastered" || status === "Ready for Assessment" ? "#166534" : status === "Developing" ? "#92400e" : status === "Not Started" ? "#64748b" : "#be123c";
  return <span style={{ ...styles.indicatorStatus, background, color }}>{status}</span>;
}


const printStyles = `
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; }
  button, select, input, textarea { font: inherit; }
  button:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.35); outline-offset: 2px; }
  button:hover { filter: brightness(0.98); transform: translateY(-1px); }
  button:active { transform: translateY(0); }
  @media (max-width: 760px) { header { position: static !important; } h1 { font-size: 26px !important; } h2 { font-size: 20px !important; } table { font-size: 12px !important; } }
  @media print {
    header, .screen-only, button { display: none !important; }
    body, #root { background: white !important; }
    * { box-shadow: none !important; }
    .print-report-card { display: block !important; border: none !important; padding: 0 !important; margin: 0 !important; }
    .print-report-card table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
    .print-report-card th, .print-report-card td { border: 1px solid #999 !important; padding: 8px !important; font-size: 12px !important; word-break: break-word !important; }
  }
`;

const styles = {
  outcomePathList: {
    display: "grid",
    gap: 12,
  },
  outcomePathCard: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: 14,
    border: "2px solid #dbe3ef",
    borderRadius: 18,
    background: "#ffffff",
  },
  pathNumber: {
    width: 34,
    height: 34,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 900,
    flexShrink: 0,
  },
  pathTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  pathBarTrack: {
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
  },
  pathBarFill: {
    height: "100%",
    borderRadius: 999,
    background: "#2563eb",
  },
  rowWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top left, #dbeafe 0, transparent 32%), linear-gradient(135deg, #f8fbff 0%, #f8fafc 52%, #fff7ed 100%)",
    color: "#0f172a",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    maxWidth: 1180,
    margin: "0 auto 20px",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 24,
    padding: 16,
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
    position: "sticky",
    top: 12,
    zIndex: 20,
    backdropFilter: "blur(12px)",
  },
  title: { margin: 0, fontSize: 32, letterSpacing: -1.1, lineHeight: 1.05, fontWeight: 950 },
  subtitle: { margin: "5px 0 0", color: "#64748b", fontWeight: 700, fontSize: 13 },
  headerControls: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  select: { padding: "10px 12px", borderRadius: 12, border: "1px solid #dbe3ef", fontWeight: 800, background: "white" },
  button: { padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", background: "white", fontWeight: 800, cursor: "pointer" },
  activeButton: { padding: "10px 14px", borderRadius: 12, border: "1px solid #1d4ed8", background: "#2563eb", color: "white", fontWeight: 900, cursor: "pointer" },
  resetButton: { padding: "10px 14px", borderRadius: 12, border: "1px solid #fecaca", background: "#fff1f2", color: "#be123c", fontWeight: 900, cursor: "pointer" },
  main: { maxWidth: 1180, margin: "0 auto", paddingBottom: 40 },
  card: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(226,232,240,0.95)", borderRadius: 24, padding: 24, boxShadow: "0 18px 50px rgba(15,23,42,0.075)", marginBottom: 18 },
  cardTitle: { margin: "0 0 14px", fontSize: 22, letterSpacing: -0.35, lineHeight: 1.15, fontWeight: 950 },
  studentHero: { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", background: "linear-gradient(135deg, #172554, #1d4ed8)", color: "white", borderRadius: 30, padding: 26, marginBottom: 16, boxShadow: "0 22px 46px rgba(29,78,216,0.22)", flexWrap: "wrap" },
  eyebrow: { margin: 0, textTransform: "uppercase", fontSize: 12, letterSpacing: 1.4, color: "#bfdbfe", fontWeight: 900 },
  heroTitle: { margin: "4px 0", fontSize: 30, letterSpacing: -0.8 },
  heroText: { margin: 0, color: "#dbeafe", maxWidth: 620 },
  heroBadge: { background: "white", color: "#1e3a8a", borderRadius: 999, padding: "12px 16px", fontWeight: 900 },
  studentNavBar: { display: "grid", gridTemplateColumns: "repeat(5, minmax(92px, 1fr))", gap: 8, marginBottom: 12, overflowX: "auto" },
  studentNavButton: { display: "grid", gap: 3, textAlign: "left", padding: "12px 14px", borderRadius: 18, border: "1px solid #cbd5e1", background: "white", color: "#334155", fontWeight: 900, cursor: "pointer", minWidth: 92 },
  studentNavButtonActive: { display: "grid", gap: 3, textAlign: "left", padding: "12px 14px", borderRadius: 18, border: "1px solid #1d4ed8", background: "#dbeafe", color: "#1e3a8a", fontWeight: 950, cursor: "pointer", minWidth: 92 },
  currentTaskCard: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: "0 10px 30px rgba(15,23,42,0.05)", flexWrap: "wrap" },
  studentQuickStats: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  progressChip: { display: "grid", gap: 2, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "9px 11px", minWidth: 96, color: "#334155" },
  progressPanel: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, background: "white", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14, marginBottom: 14, color: "#334155" },
  tabs: { display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" },
  tab: { padding: "10px 14px", borderRadius: 999, border: "1px solid #cbd5e1", background: "white", fontWeight: 800, cursor: "pointer" },
  activeTab: { padding: "10px 14px", borderRadius: 999, border: "1px solid #1d4ed8", background: "#dbeafe", color: "#1e3a8a", fontWeight: 900, cursor: "pointer" },
  lessonMetaRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  skillTag: { display: "inline-block", background: "#f1f5f9", color: "#334155", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 900 },
  bigText: { fontSize: 22, lineHeight: 1.35, fontWeight: 800 },
  interventionNotice: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: 12, borderRadius: 14, fontWeight: 700 },
  visualBox: { border: "1px solid #e2e8f0", borderRadius: 18, padding: 16, background: "#f8fafc", margin: "14px 0" },
  fractionBar: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 380, borderRadius: 14, overflow: "hidden", border: "1px solid #cbd5e1" },
  fractionPart: { height: 64, border: "1px solid #cbd5e1", cursor: "pointer" },
  decimalGrid: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3, maxWidth: 440 },
  decimalCell: { height: 42, border: "1px solid #cbd5e1", borderRadius: 6 },
  answers: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
  answer: { padding: "12px 16px", borderRadius: 14, border: "1px solid #cbd5e1", background: "white", fontWeight: 900, cursor: "pointer", minWidth: 88 },
  selectedAnswer: { padding: "12px 16px", borderRadius: 14, border: "2px solid #2563eb", background: "#dbeafe", color: "#1d4ed8", fontWeight: 900, cursor: "pointer", minWidth: 88 },
  multiStepBox: { display: "grid", gap: 12 },
  stepCard: { border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#ffffff" },
  feedback: { fontWeight: 800, padding: 12, background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0" },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 14 },
  primary: { padding: "12px 17px", borderRadius: 15, border: "1px solid #1d4ed8", background: "#2563eb", color: "white", fontWeight: 950, cursor: "pointer", minHeight: 44, boxShadow: "0 10px 20px rgba(37,99,235,0.18)", transition: "transform 120ms ease, filter 120ms ease" },
  secondary: { padding: "12px 17px", borderRadius: 15, border: "1px solid #cbd5e1", background: "white", color: "#334155", fontWeight: 900, cursor: "pointer", minHeight: 44, transition: "transform 120ms ease, filter 120ms ease" },
  todayHeader: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 },
  eyebrowDark: { margin: 0, textTransform: "uppercase", fontSize: 12, letterSpacing: 1.2, color: "#64748b", fontWeight: 900 },
  todayTitle: { margin: "4px 0", fontSize: 28, letterSpacing: -0.7 },
  todayFocusPill: { background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", borderRadius: 999, padding: "10px 14px", fontWeight: 950 },
  completionHero: { display: "flex", gap: 14, alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: 16, marginBottom: 14 },
  completionIcon: { display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: 999, background: "white", fontSize: 28, flex: "0 0 52px" },
  completionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 },
  planGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, margin: "16px 0" },
  planStep: { display: "flex", gap: 10, alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14, minHeight: 78 },
  planNumber: { display: "grid", placeItems: "center", flex: "0 0 34px", width: 34, height: 34, borderRadius: 999, background: "#2563eb", color: "white", fontWeight: 950 },
  teacherGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 0 },
  teacherNavGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginTop: 12 },
  teacherNavButton: { display: "grid", gap: 4, textAlign: "left", padding: 14, borderRadius: 16, border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a", cursor: "pointer", fontWeight: 850, boxShadow: "0 8px 22px rgba(15,23,42,0.05)" },
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 },
  statBox: { background: "linear-gradient(180deg, #ffffff, #f8fafc)", border: "1px solid #e2e8f0", borderRadius: 18, padding: 15, boxShadow: "0 8px 22px rgba(15,23,42,0.04)" },
  teacherActions: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
  classGrid: { display: "grid", gridTemplateColumns: "minmax(140px, 1.1fr) repeat(2, minmax(130px, 1fr)) minmax(190px, 1.4fr) minmax(240px, 1.4fr)", gap: 6, overflowX: "auto" },
  classGridHeader: { background: "#0f172a", color: "white", borderRadius: 12, padding: 10, fontSize: 12, fontWeight: 900 },
  classGridCell: { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, minHeight: 58 },
  classGridActions: { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cellSubtext: { color: "#64748b", fontSize: 12, fontWeight: 600, marginTop: 3 },
  gridActionButton: { padding: "8px 10px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155", fontWeight: 800, cursor: "pointer", fontSize: 12 },
  assignmentPill: { display: "inline-block", background: "#eef2ff", color: "#3730a3", borderRadius: 999, padding: "6px 9px", fontSize: 11, fontWeight: 900 },
  outcomeAnalyticsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 },
  analyticsCard: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 18, padding: 16 },
  analyticsTitle: { fontSize: 24, fontWeight: 950 },
  analyticsNumbers: { display: "grid", gap: 6, marginTop: 10, color: "#334155", fontWeight: 800 },
  drillHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  drillEyebrow: { margin: 0, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "#64748b", fontWeight: 900 },
  drillTitle: { margin: 0, fontSize: 26 },
  drillBadge: { background: "#fef3c7", color: "#92400e", borderRadius: 999, padding: "10px 14px", fontWeight: 900 },
  drillGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: "16px 0" },
  drillStat: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, display: "grid", gap: 6 },
  recommendationBox: { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 16, padding: 14, margin: "14px 0" },
  assignmentBox: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14 },
  assignmentActions: { display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 18px" },
  indicatorList: { display: "grid", gap: 8 },
  indicatorRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 12 },
  indicatorStatus: { borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" },
  printReport: { color: "#111827" },
  reportTable: { width: "100%", borderCollapse: "collapse", marginBottom: 16 },
  reportCell: { border: "1px solid #cbd5e1", padding: 8, textAlign: "left" },
  interventionScheduleList: {
    display: "grid",
    gap: 12,
    marginTop: 12,
  },
  interventionScheduleGroup: {
    border: "1px solid #dbe3ef",
    borderRadius: 16,
    padding: 14,
    background: "#f8fafc",
  },
  interventionScheduleIndicator: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    background: "white",
    marginTop: 10,
  },
  interventionPlanRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
    background: "white",
  },
  studentChipButton: {
    border: "1px solid #cbd5e1",
    background: "white",
    borderRadius: 999,
    padding: "8px 10px",
    fontWeight: 800,
    cursor: "pointer",
    color: "#334155",
  },
  printTip: { color: "#64748b", fontWeight: 700 },
  alertCard: { background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 16, padding: 14, marginBottom: 10 },
  patternRow: { display: "flex", justifyContent: "space-between", gap: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 12, marginBottom: 8 },
  sectionIntro: { color: "#475569", fontWeight: 650, lineHeight: 1.45 },
  priorityList: { display: "grid", gap: 8 },
  priorityRow: { display: "grid", gridTemplateColumns: "minmax(130px, 0.8fr) minmax(240px, 1.4fr) minmax(180px, 1fr)", gap: 10, alignItems: "center", width: "100%", textAlign: "left", background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 12, cursor: "pointer" },
  priorityInsight: { color: "#0f172a", fontWeight: 800, lineHeight: 1.35 },
  priorityAction: { justifySelf: "end", background: "#eef2ff", color: "#3730a3", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 900, textAlign: "center" },
  insightBox: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, margin: "14px 0" },
  insightList: { margin: "8px 0 0 18px", padding: 0, display: "grid", gap: 6, color: "#334155", fontWeight: 700 },
  groupGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 },
  groupBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 18, padding: 16 },
  groupTitle: { margin: "0 0 4px", fontSize: 18 },
  groupList: { display: "grid", gap: 8, marginTop: 12 },
  groupStudent: { display: "grid", gap: 4, background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: 10, fontSize: 13 },
  emptyText: { color: "#64748b", fontWeight: 700, background: "white", border: "1px dashed #cbd5e1", borderRadius: 14, padding: 12 },
  reportMatrix: { display: "grid", gridTemplateColumns: "minmax(140px, 1fr) repeat(2, minmax(150px, 1fr)) minmax(240px, 1.4fr)", gap: 6, overflowX: "auto" },
  reportMatrixHeader: { background: "#334155", color: "white", borderRadius: 12, padding: 10, fontSize: 12, fontWeight: 900 },
  reportMatrixCell: { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, minHeight: 58, fontSize: 13 },
  plannerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 },
  plannerCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 16 },
  plannerHeader: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  plannerPill: { background: "#ecfeff", color: "#155e75", border: "1px solid #a5f3fc", borderRadius: 999, padding: "6px 9px", fontSize: 11, fontWeight: 900, whiteSpace: "nowrap" },
  plannerMove: { margin: "10px 0 14px", color: "#334155", fontWeight: 750, lineHeight: 1.4 },
  studentChipRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  studentChip: { border: "1px solid #cbd5e1", background: "#f8fafc", color: "#0f172a", borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 900, cursor: "pointer" },
  emptyMini: { color: "#64748b", fontWeight: 700, fontSize: 12 },
  noteGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, margin: "12px 0" },
  noteBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, lineHeight: 1.45 },
  noteLabel: { display: "block", marginTop: 14, marginBottom: 6, fontWeight: 900, color: "#334155" },
  noteTextarea: { width: "100%", minHeight: 92, resize: "vertical", border: "1px solid #cbd5e1", borderRadius: 14, padding: 12, font: "inherit", lineHeight: 1.45, background: "#ffffff", color: "#0f172a" },
  editorList: { display: "grid", gap: 12, marginTop: 12 },
  editorCard: { background: "#ffffff", border: "1px solid #dbe3ef", borderRadius: 18, padding: 16, display: "grid", gap: 12 },
  editorSection: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, lineHeight: 1.45 },
  editorSectionStrong: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: 12, lineHeight: 1.45 },
  editorLabel: { display: "block", color: "#475569", fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 },
  editorTwoColumn: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 },
  editorMiniBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, lineHeight: 1.45 },
  curriculumBrowserGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 4 },
  curriculumOutcomeCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 },
  curriculumStrandPill: { background: "#f1f5f9", color: "#334155", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 900 },
  curriculumIndicatorList: { display: "grid", gap: 7, marginTop: 10 },
  curriculumIndicatorItem: { fontSize: 12, lineHeight: 1.35, color: "#334155", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 8 },
  visualTitle: { fontSize: 12, color: "#475569", fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  visualHeaderRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  visualCallout: { margin: "3px 0 0", color: "#334155", fontSize: 13, fontWeight: 750, lineHeight: 1.35 },
  visualTypePill: { background: "#e0f2fe", color: "#075985", border: "1px solid #bae6fd", borderRadius: 999, padding: "6px 9px", fontSize: 11, fontWeight: 950, whiteSpace: "nowrap" },
  visualModelStage: { background: "white", border: "1px solid #dbe3ef", borderRadius: 16, padding: 14, marginTop: 10, overflowX: "auto" },
  visualCaption: { margin: "10px 0 0", color: "#475569", fontSize: 13, fontWeight: 650, lineHeight: 1.4 },
  genericVisualModel: { border: "1px dashed #94a3b8", borderRadius: 14, padding: 20, textAlign: "center", color: "#334155", fontWeight: 900 },
  baseTenStage: { display: "grid", gap: 12 },
  baseTenTensGroup: { display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" },
  baseTenOnesGroup: { display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" },
  tenFrameRod: { display: "grid", gridTemplateColumns: "repeat(2, 18px)", gridTemplateRows: "repeat(5, 18px)", gap: 2, background: "#eff6ff", border: "2px solid #2563eb", borderRadius: 10, padding: 5 },
  tenFrameMiniCell: { width: 18, height: 18, borderRadius: 5, background: "#60a5fa", border: "1px solid #2563eb" },
  oneCubePolished: { width: 32, height: 32, borderRadius: 9, background: "#dbeafe", border: "2px solid #60a5fa", color: "#1e3a8a", display: "grid", placeItems: "center", fontWeight: 950 },
  modelEquation: { marginTop: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "9px 11px", color: "#0f172a", fontWeight: 900, width: "fit-content" },
  coinRowPolished: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  coinPolished: { width: 62, height: 62, borderRadius: 999, background: "#fde68a", border: "3px solid #b45309", color: "#78350f", display: "grid", placeItems: "center", fontWeight: 950 },
  tallyStage: { display: "grid", gap: 10 },
  tallyGroupBox: { display: "inline-flex", gap: 6, alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, width: "fit-content", minHeight: 54, marginRight: 8 },
  tallyMark: { width: 5, height: 38, borderRadius: 999, background: "#334155", display: "inline-block" },
  tallySlash: { width: 5, height: 44, borderRadius: 999, background: "#334155", display: "inline-block", transform: "rotate(58deg)", marginLeft: -22 },
  numberLineStage: { position: "relative", padding: "18px 4px 6px", minWidth: 430 },
  numberLineTrack: { position: "absolute", top: 43, left: 24, right: 24, height: 4, background: "#cbd5e1", borderRadius: 999 },
  numberLineDots: { display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 },
  numberLineDotGroup: { display: "grid", justifyItems: "center", gap: 6, minWidth: 58 },
  numberBubblePolished: { minWidth: 48, height: 48, borderRadius: 999, background: "#ffffff", border: "3px solid #2563eb", color: "#1e3a8a", display: "grid", placeItems: "center", fontWeight: 950 },
  numberBubbleMissing: { minWidth: 48, height: 48, borderRadius: 999, background: "#fef3c7", border: "3px dashed #d97706", color: "#92400e", display: "grid", placeItems: "center", fontWeight: 950 },
  numberLineJump: { color: "#64748b", fontSize: 11, fontWeight: 900 },
  patternStage: { display: "flex", gap: 10, flexWrap: "wrap" },
  patternTokenPolished: { width: 54, height: 54, borderRadius: 16, background: "#ffffff", border: "2px solid #cbd5e1", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 950 },
  patternTokenMissing: { width: 54, height: 54, borderRadius: 16, background: "#fef3c7", border: "2px dashed #d97706", color: "#92400e", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 950 },
  balanceStage: { display: "grid", gridTemplateColumns: "1fr 56px 1fr", gap: 10, alignItems: "center", textAlign: "center" },
  balancePan: { background: "#f8fafc", border: "2px solid #94a3b8", borderRadius: 16, padding: 18, fontSize: 22, fontWeight: 950 },
  balanceCenter: { background: "#2563eb", color: "white", borderRadius: 999, height: 56, display: "grid", placeItems: "center", fontSize: 26, fontWeight: 950 },
  calendarStage: { display: "grid", gridTemplateColumns: "repeat(7, minmax(38px, 1fr))", gap: 6, minWidth: 420 },
  calendarHeaderCell: { background: "#0f172a", color: "white", borderRadius: 10, padding: 8, textAlign: "center", fontSize: 12, fontWeight: 900 },
  calendarDayCell: { background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 8, textAlign: "center", fontWeight: 800 },
  calendarDayActive: { background: "#dbeafe", border: "2px solid #2563eb", color: "#1e3a8a", borderRadius: 10, padding: 8, textAlign: "center", fontWeight: 950 },
  measurementObject: { height: 22, borderRadius: 999, background: "#94a3b8", marginBottom: 10, display: "grid", placeItems: "center", color: "white", fontSize: 11, fontWeight: 900 },
  measurementRowPolished: { display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap" },
  unitBlockPolished: { width: 48, height: 36, border: "1px solid #64748b", background: "#ffffff", display: "grid", placeItems: "center", fontWeight: 900 },
  shapeSortStage: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 },
  shapeSortColumn: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, display: "grid", gap: 10, justifyItems: "center" },
  shapeSquarePolished: { width: 54, height: 54, borderRadius: 10, background: "#dbeafe", border: "2px solid #2563eb", display: "inline-block" },
  shapeCirclePolished: { width: 56, height: 56, borderRadius: 999, background: "#dcfce7", border: "2px solid #16a34a", display: "inline-block" },
  shapeTrianglePolished: { fontSize: 64, lineHeight: 1, color: "#9333ea", fontWeight: 950 },
  graphStage: { height: 150, display: "flex", gap: 14, alignItems: "flex-end", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 14 },
  graphColumn: { display: "grid", justifyItems: "center", gap: 6, alignItems: "end" },
  barGraphBarPolished: { width: 46, background: "#93c5fd", border: "2px solid #2563eb", borderRadius: "10px 10px 0 0" },
  baseTenRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" },
  tenRod: { width: 34, height: 110, borderRadius: 10, background: "#bfdbfe", border: "1px solid #60a5fa", display: "grid", placeItems: "center", color: "#1e3a8a", fontWeight: 950 },
  oneCube: { width: 34, height: 34, borderRadius: 9, background: "#dbeafe", border: "1px solid #93c5fd", display: "grid", placeItems: "center", color: "#1e40af", fontWeight: 900 },
  coinRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  coin: { width: 58, height: 58, borderRadius: 999, background: "#fde68a", border: "2px solid #d97706", display: "grid", placeItems: "center", fontWeight: 950, color: "#92400e" },
  tallyRow: { fontSize: 34, letterSpacing: 4, fontWeight: 950, color: "#334155", background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12 },
  numberLineRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  numberBubble: { minWidth: 44, minHeight: 44, borderRadius: 999, background: "white", border: "2px solid #cbd5e1", display: "grid", placeItems: "center", fontWeight: 950 },
  patternRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  patternToken: { width: 48, height: 48, borderRadius: 14, background: "white", border: "1px solid #cbd5e1", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 950 },
  balanceRow: { display: "grid", gridTemplateColumns: "1fr 56px 1fr", gap: 10, alignItems: "center", textAlign: "center", fontSize: 24, fontWeight: 950 },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, minmax(38px, 1fr))", gap: 6 },
  calendarCell: { background: "white", border: "1px solid #cbd5e1", borderRadius: 10, padding: 8, textAlign: "center", fontSize: 12, fontWeight: 900 },
  measurementRow: { display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap" },
  unitBlock: { width: 44, height: 34, border: "1px solid #94a3b8", background: "white", display: "grid", placeItems: "center", fontWeight: 900 },
  shapeRow: { display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
  shapeSquare: { width: 54, height: 54, borderRadius: 10, background: "#dbeafe", border: "2px solid #2563eb", display: "inline-block" },
  shapeCircle: { width: 56, height: 56, borderRadius: 999, background: "#dcfce7", border: "2px solid #16a34a", display: "inline-block" },
  shapeTriangle: { fontSize: 64, lineHeight: 1, color: "#9333ea", fontWeight: 950 },
  barGraph: { height: 110, display: "flex", gap: 12, alignItems: "flex-end", background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12 },
  barGraphBar: { width: 42, background: "#93c5fd", border: "1px solid #2563eb", borderRadius: "8px 8px 0 0" },
  coverageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 },
  coverageCard: { border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#ffffff" },
  coverageCompletePill: { borderRadius: 999, padding: "5px 9px", background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 900 },
  coverageWarningPill: { borderRadius: 999, padding: "5px 9px", background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 900 },
  coverageBarTrack: { height: 8, borderRadius: 999, background: "#e2e8f0", overflow: "hidden", marginTop: 10, marginBottom: 8 },
  coverageBarFill: { height: "100%", borderRadius: 999, background: "#2563eb" },
  thinkingCard: { border: "1px solid #dbeafe", borderRadius: 16, background: "#eff6ff", padding: 14, marginTop: 14, display: "grid", gap: 8 },
  thinkingStep: { display: "flex", alignItems: "center", gap: 10, color: "#1e3a8a", fontWeight: 750 },
  thinkingNumber: { width: 24, height: 24, borderRadius: 999, background: "#2563eb", color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 950, flex: "0 0 auto" },
  supportBox: { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1e3a8a", borderRadius: 14, padding: 12, marginTop: 10, fontSize: 14, lineHeight: 1.45, fontWeight: 650 },
  rosterControlsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 },
  rosterControlBox: { border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 16, padding: 14, display: "grid", gap: 10 },
  textInput: { padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontWeight: 700, minWidth: 0, flex: "1 1 170px" },
  rosterList: { display: "grid", gap: 10, marginTop: 16 },
  rosterListHeader: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", color: "#475569", fontSize: 13 },
  rosterStudentRow: { display: "grid", gridTemplateColumns: "minmax(160px, 1fr) 150px auto auto", gap: 8, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 14, padding: 10, background: "white" },
  rosterStudentButton: { textAlign: "left", border: "none", background: "transparent", cursor: "pointer", display: "grid", gap: 2, color: "#0f172a" },
  dangerMiniButton: { padding: "8px 10px", borderRadius: 10, border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", fontWeight: 900, cursor: "pointer" },
};
