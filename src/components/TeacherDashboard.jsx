import React, { useState, useMemo, useEffect } from "react";
import TeacherHome from "./TeacherHome";
import {
  buildStudentReportSummary,
  buildClassReportSummaryText,
  getSuggestedNextSkill,
  buildSmartAssignmentBundle,
} from "../utils/reportBuilder";
import {
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
} from "../data/curriculumData";

function TapBoxFractionQuestion({ total = 10, target = null, selectedCount = 0, onChange, disabled = false, answerState = null }) {
  const columns = total <= 5 ? total : Math.min(total, 10);
  const isAnswered = answerState === "correct" || answerState === "wrong";

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #eff6ff, #ffffff)",
          border: "1px solid #bfdbfe",
          borderRadius: 18,
          padding: 16,
          marginBottom: 14,
          boxShadow: "0 10px 28px rgba(37,99,235,0.08)",
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
          gridTemplateColumns: `repeat(${columns}, minmax(44px, 62px))`,
          gap: 10,
          marginBottom: 12,
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
                borderRadius: 16,
                border:
                  answerState === "correct"
                    ? "2px solid #16a34a"
                    : answerState === "wrong"
                    ? "2px solid #dc2626"
                    : "2px solid #2563eb",
                background:
                  answerState === "correct" && isFilled
                    ? "#16a34a"
                    : answerState === "wrong" && isFilled
                    ? "#dc2626"
                    : isFilled
                    ? "#2563eb"
                    : "#ffffff",
                color: isFilled ? "#ffffff" : "#2563eb",
                fontWeight: 900,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.75 : 1,
                boxShadow:
                  answerState === "correct"
                    ? "0 0 0 4px rgba(22, 163, 74, 0.16), 0 10px 20px rgba(22, 163, 74, 0.22)"
                    : answerState === "wrong"
                    ? "0 0 0 4px rgba(220, 38, 38, 0.14), 0 10px 20px rgba(220, 38, 38, 0.18)"
                    : isFilled
                    ? "0 8px 18px rgba(37, 99, 235, 0.25)"
                    : "none",
                transform: answerState === "correct" ? "scale(1.04)" : "scale(1)",
                animation:
                  answerState === "correct"
                    ? "tapBoxPop 0.28s ease"
                    : answerState === "wrong"
                    ? "tapBoxShake 0.36s ease"
                    : "none",
                transition: "background 0.18s ease, border 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
                minHeight: 48,
                touchAction: "manipulation",
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

function buildPracticeQuestionSet(
  outcome,
  activeAllQuestions,
  fallbackSkill = "fractions",
  count = 5,
  adaptiveLevel = "normal",
  targetIndicator = null,
  reviewIndicators = []
) {
  const safeIndicator = targetIndicator || `${outcome}.01`;
  const focusCount = Math.max(3, count - 2);
  const reviewCount = Math.max(0, count - focusCount);
  const cleanReviewIndicators = [
    ...new Set(
      reviewIndicators.filter(
        (indicator) => indicator && indicator !== safeIndicator
      )
    ),
  ].slice(0, reviewCount);

  if (outcome === "NO4") {
    const focusQuestions = buildFractionTapBoxPracticeSet(
      "NO4",
      safeIndicator,
      focusCount,
      adaptiveLevel
    ).map((question) => ({
      ...question,
      practiceRole: "Focus",
    }));

    const reviewQuestions = cleanReviewIndicators.flatMap((indicator) =>
      buildFractionTapBoxPracticeSet("NO4", indicator, 1, "easy").map(
        (question) => ({
          ...question,
          practiceRole: "Review",
          prompt: `Review: ${question.prompt}`,
        })
      )
    );

    return shuffleQuestions([...focusQuestions, ...reviewQuestions]).slice(
      0,
      count
    );
  }

  const outcomeQuestions = activeAllQuestions.filter(
    (q) => q.outcome === outcome
  );

  const targetedQuestions = targetIndicator
    ? outcomeQuestions.filter((q) => q.indicator === targetIndicator)
    : outcomeQuestions;

  const reviewQuestions = cleanReviewIndicators.flatMap((indicator) =>
    outcomeQuestions
      .filter((q) => q.indicator === indicator)
      .slice(0, 1)
      .map((question) => ({
        ...question,
        practiceRole: "Review",
      }))
  );

  const focusQuestions = shuffleQuestions(
    targetedQuestions.length ? targetedQuestions : outcomeQuestions
  )
    .slice(0, focusCount)
    .map((question) => ({
      ...question,
      practiceRole: "Focus",
    }));

  const fallback = QUESTION_BANK[fallbackSkill] || activeAllQuestions.slice(0, count);

  return shuffleQuestions(
    [...focusQuestions, ...reviewQuestions].length
      ? [...focusQuestions, ...reviewQuestions]
      : fallback
  ).slice(0, count);
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
  mistakeTypeStats: {},
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

function getWeakestIndicatorForOutcome(indicatorStats, student, outcome, fallbackIndicator = null) {
  const indicators = INDICATOR_CATALOG[outcome] || [];
  if (indicators.length === 0) return fallbackIndicator || `${outcome}.01`;

  const rows = indicators.map((indicator) => {
    const data = indicatorStats?.[`${student}-${indicator}`] || {};
    const attempts = data.attempts ?? 0;
    const correct = data.correct ?? 0;
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    const mastered = attempts >= 3 && accuracy >= 80;

    return { indicator, attempts, correct, accuracy, mastered };
  });

  const unfinished = rows.filter((row) => !row.mastered);
  const candidates = unfinished.length ? unfinished : rows;

  return [...candidates].sort((a, b) => {
    if (a.attempts === 0 && b.attempts > 0) return -1;
    if (b.attempts === 0 && a.attempts > 0) return 1;
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return a.indicator.localeCompare(b.indicator);
  })[0]?.indicator || fallbackIndicator || `${outcome}.01`;
}

function getReviewIndicatorsForOutcome(indicatorStats, student, outcome, targetIndicator = null, maxReview = 2) {
  const indicators = INDICATOR_CATALOG[outcome] || [];
  if (indicators.length === 0) return [];

  return indicators
    .map((indicator) => {
      const data = indicatorStats?.[`${student}-${indicator}`] || {};
      const attempts = data.attempts ?? 0;
      const correct = data.correct ?? 0;
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const mastered = attempts >= 3 && accuracy >= 80;

      return { indicator, attempts, correct, accuracy, mastered };
    })
    .filter((row) => row.indicator !== targetIndicator)
    .filter((row) => row.attempts > 0 || row.mastered)
    .sort((a, b) => {
      if (a.mastered !== b.mastered) return a.mastered ? -1 : 1;
      if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      return b.accuracy - a.accuracy;
    })
    .slice(0, maxReview)
    .map((row) => row.indicator);
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
  const nextIndicator = [...weakest.items]
    .filter((item) => !item.mastered)
    .sort((a, b) => {
      if (a.attempts === 0 && b.attempts > 0) return -1;
      if (b.attempts === 0 && a.attempts > 0) return 1;
      return (a.accuracy ?? 0) - (b.accuracy ?? 0);
    })[0]?.indicator || weakest.items[0]?.indicator || weakest.outcome;

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
    const reassessmentOutcome = row.outcomes.find(
      (outcome) => outcome.assessment.status === "Needs Reassessment"
    );

    if (reassessmentOutcome) {
      groups.reteach.push({
        ...row,
        groupReason: `${reassessmentOutcome.outcome} assessment needs a rebuild`,
        groupFocus: reassessmentOutcome.outcome,
        groupMove: "Reteach briefly, then assign targeted practice before reassessment.",
      });
      return;
    }

    const supportOutcome = row.outcomes.find(
      (outcome) => outcome.status === "Needs Support" || outcome.status === "Needs Reassessment"
    );

    if (supportOutcome || row.supportCount > 0 || row.nextStep.includes("Rebuild")) {
      const weakIndicator = supportOutcome?.items?.find((item) => !item.mastered)?.indicator || supportOutcome?.outcome || "next indicator";

      groups.reteach.push({
        ...row,
        groupReason: `Needs support with ${weakIndicator}`,
        groupFocus: supportOutcome?.outcome || weakIndicator,
        groupMove: "Use simplified numbers, examples, or a short teacher-table lesson.",
      });
      return;
    }

    const readyOutcome = row.outcomes.find(
      (outcome) => outcome.readyForAssessment && outcome.assessment.status !== "Passed"
    );

    if (readyOutcome || row.readyCount > 0 || row.nextStep.includes("assessment")) {
      groups.assessmentReady.push({
        ...row,
        groupReason: `${readyOutcome?.outcome || "Outcome"} indicators are strong enough`,
        groupFocus: readyOutcome?.outcome || "assessment",
        groupMove: "Assign or run the outcome assessment next.",
      });
      return;
    }

    if (row.masteredCount === OUTCOMES.length) {
      groups.enrichment.push({
        ...row,
        groupReason: "All listed outcomes are mastered",
        groupFocus: "Enrichment",
        groupMove: "Give challenge tasks, explanation prompts, or mixed review.",
      });
      return;
    }

    const developingOutcome = row.outcomes.find((outcome) => outcome.status === "Developing");
    const nextWeak = developingOutcome?.items?.find((item) => !item.mastered)?.indicator || developingOutcome?.outcome || "next indicator";

    groups.practice.push({
      ...row,
      groupReason: `Still building ${nextWeak}`,
      groupFocus: developingOutcome?.outcome || nextWeak,
      groupMove: "Assign a short practice cycle and watch accuracy.",
    });
  });

  return groups;
}
function getTeacherMistakeGroups(students, mistakeTypeStats = {}, alerts = []) {
  const groups = {};

  Object.values(mistakeTypeStats || {}).forEach((entry) => {
    if (!entry?.student || !students.includes(entry.student)) return;
    const type = entry.mistakeType || "Unclassified mistake";

    if (!groups[type]) {
      groups[type] = { mistakeType: type, total: 0, students: {}, examples: [] };
    }

    groups[type].total += entry.count || 0;
    groups[type].students[entry.student] = groups[type].students[entry.student] || {
      student: entry.student,
      count: 0,
      outcomes: new Set(),
      indicators: new Set(),
    };
    groups[type].students[entry.student].count += entry.count || 0;
    if (entry.outcome) groups[type].students[entry.student].outcomes.add(entry.outcome);
    if (entry.indicator) groups[type].students[entry.student].indicators.add(entry.indicator);
    groups[type].examples.push(entry);
  });

  (alerts || []).forEach((alert) => {
    if (!alert?.student || !students.includes(alert.student)) return;
    const type = alert.mistakeType || "Repeated alert / unclassified";

    if (!groups[type]) {
      groups[type] = { mistakeType: type, total: 0, students: {}, examples: [] };
    }

    const alertCount = alert.frequency || 1;
    groups[type].total += alertCount;
    groups[type].students[alert.student] = groups[type].students[alert.student] || {
      student: alert.student,
      count: 0,
      outcomes: new Set(),
      indicators: new Set(),
    };
    groups[type].students[alert.student].count += alertCount;
    if (alert.outcome) groups[type].students[alert.student].outcomes.add(alert.outcome);
    if (alert.skill) groups[type].students[alert.student].indicators.add(alert.skill);
    groups[type].examples.push(alert);
  });

  return Object.values(groups)
    .map((group) => ({
      mistakeType: group.mistakeType,
      total: group.total,
      students: Object.values(group.students)
        .map((student) => ({
          ...student,
          outcomes: Array.from(student.outcomes),
          indicators: Array.from(student.indicators),
        }))
        .sort((a, b) => b.count - a.count || a.student.localeCompare(b.student)),
      examples: group.examples.slice(-3),
      teacherMove:
        group.mistakeType.includes("Off-by-one") || group.mistakeType.includes("count")
          ? "Use touch-counting, one-to-one matching, and have students count shaded parts out loud."
          : group.mistakeType.includes("Denominator") || group.mistakeType.includes("whole model")
          ? "Reteach numerator vs. denominator: bottom = total parts, top = shaded parts."
          : group.mistakeType.includes("Under-counted")
          ? "Have students re-scan the whole model and mark each shaded part as they count."
          : group.mistakeType.includes("Over-counted")
          ? "Have students separate shaded vs. unshaded parts before answering."
          : "Pull a quick small group and ask students to explain the model before answering.",
    }))
    .sort((a, b) => b.total - a.total || a.mistakeType.localeCompare(b.mistakeType));
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

function getFriendlyReasoningLine(row, recommendedOutcome = null) {
  const focus = recommendedOutcome ? ` ${recommendedOutcome}` : "";

  if (!row) return "No data yet — keep building evidence.";

  if (row.priority === 1 || row.supportCount > 0 || row.alerts > 0) {
    return `Still building understanding with${focus} — a small group or guided support will help here.`;
  }

  const needsReassessment = row.outcomes?.some(
    (o) => o.assessment?.status === "Needs Reassessment"
  );
  if (needsReassessment) {
    return `Close with${focus} — a short review and retry should get this over the line.`;
  }

  const ready = row.outcomes?.some(
    (o) => o.readyForAssessment && o.assessment?.status !== "Passed"
  );
  if (ready) {
    return `Looking ready in${focus} — a quick check-in or assessment would confirm it.`;
  }

  const developing = row.outcomes?.some((o) => o.status === "Developing");
  if (developing) {
    return `Making progress with${focus} — just needs a few more strong attempts to lock it in.`;
  }

  const mastered = row.outcomes?.every((o) => o.assessment?.status === "Passed");
  if (mastered) {
    return "Solid understanding here — ready for a challenge or extension.";
  }

  return `Keep going with${focus} — building consistency across outcomes.`;
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


const LOGIN_STORAGE_KEY = "mathAppCurrentLogin";

const CLASS_LOGIN_CODES = {
  "901": "901",
  "902": "902",
};

const TEACHER_LOGIN = {
  username: "teacher",
  code: "TEACHER",
};

function getStoredLogin() {
  try {
    const saved = localStorage.getItem(LOGIN_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveStoredLogin(login) {
  try {
    localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(login));
  } catch {
    // localStorage may be blocked in some browsers. The app can still run for this session.
  }
}

function clearStoredLogin() {
  try {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function LoginScreen({ rosterState, onLogin }) {
  const classNames = Object.keys(rosterState?.classes || CLASS_LOGIN_CODES);
  const [role, setRole] = useState("student");
  const [loginMode, setLoginMode] = useState(firebaseEnabled ? "real" : "demo");
  const [authAction, setAuthAction] = useState("signin");
  const [classCode, setClassCode] = useState(classNames[0] || "901");
  const [studentName, setStudentName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const classStudents = getClassStudentsFromRoster(rosterState, classCode);

  function handleClassChange(nextClass) {
    setClassCode(nextClass);
  }

  async function submitLogin(event) {
    event.preventDefault();
    setMessage("");

    if (loginMode === "real") {
      if (!firebaseEnabled) {
        setMessage("Firebase is not configured yet. Use demo mode or add your .env Firebase keys.");
        return;
      }
      if (!email.trim() || !password) {
        setMessage("Enter an email and password.");
        return;
      }
      if (role === "student" && authAction === "register" && !studentName.trim()) {
        setMessage("Enter the student's name.");
        return;
      }

      setBusy(true);
      try {
        const newProfile = {
          role,
          displayName: role === "teacher" ? "Teacher" : studentName.trim(),
          classCode,
          studentName: studentName.trim(),
        };

        const user = authAction === "register"
          ? await registerRealAccount(email.trim(), password, newProfile)
          : await signInRealAccount(email.trim(), password);

        const savedProfile = await loadUserProfile(user.uid);
        const profileToUse = savedProfile || newProfile;

        if (!savedProfile) {
          await saveUserProfile(user.uid, { ...newProfile, email: user.email });
        }

        onLogin({
          ...profileToUse,
          uid: user.uid,
          email: user.email,
          cloudEnabled: true,
          role: profileToUse.role || role,
          displayName: profileToUse.displayName || (role === "teacher" ? "Teacher" : studentName.trim()),
          classCode: profileToUse.classCode || classCode,
          studentName: profileToUse.studentName || studentName.trim(),
        });
      } catch (error) {
        setMessage(error?.message || "Real account sign-in failed.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (role === "teacher") {
      if (accessCode.trim().toUpperCase() !== TEACHER_LOGIN.code) {
        setMessage("Use the teacher access code to open the teacher dashboard.");
        return;
      }

      onLogin({ role: "teacher", displayName: "Teacher", classCode, studentName, cloudEnabled: false });
      return;
    }

    if (role === "student" && !studentName.trim()) {
      setMessage("Enter the student's name.");
      return;
    }

    const expectedCode = CLASS_LOGIN_CODES[classCode] || classCode;
    if (accessCode.trim() !== expectedCode) {
      setMessage(`Use the class code for Class ${classCode}.`);
      return;
    }

    onLogin({ role: "student", displayName: studentName.trim(), classCode, studentName: studentName.trim(), cloudEnabled: false });
  }

  const toggleButton = (active) => ({
    padding: "12px 14px",
    borderRadius: 14,
    border: active ? "2px solid #2563eb" : "1px solid #cbd5e1",
    background: active ? "#dbeafe" : "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff, #f8fafc 45%, #ffffff)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
      <form onSubmit={submitLogin} style={{ width: "100%", maxWidth: 500, background: "#ffffff", border: "1px solid #dbeafe", borderRadius: 24, padding: 24, boxShadow: "0 22px 60px rgba(15, 23, 42, 0.12)" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#2563eb", fontWeight: 900, marginBottom: 6 }}>MATH MASTERY LOGIN</div>
          <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>Welcome back</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", lineHeight: 1.5 }}>Use real accounts for cloud progress, or demo codes while setting up Firebase.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: firebaseEnabled ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 14 }}>
          {firebaseEnabled && <button type="button" onClick={() => setLoginMode("real")} style={toggleButton(loginMode === "real")}>Real Account</button>}
          <button type="button" onClick={() => setLoginMode("demo")} style={toggleButton(loginMode === "demo")}>Demo Code</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <button type="button" onClick={() => setRole("student")} style={toggleButton(role === "student")}>Student</button>
          <button type="button" onClick={() => setRole("teacher")} style={toggleButton(role === "teacher")}>Teacher</button>
        </div>

        <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Class</label>
        <select value={classCode} onChange={(event) => handleClassChange(event.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid #cbd5e1", marginBottom: 14, fontSize: 16 }}>
          {classNames.map((name) => <option key={name} value={name}>Class {name}</option>)}
        </select>

        {role === "student" && (
          <>
            <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Student name</label>
            <input
              type="text"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="Type student name"
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: "1px solid #cbd5e1", marginBottom: 14, fontSize: 16 }}
            />
          </>
        )}

        {loginMode === "real" ? (
          <>
            <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@school.ca" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: "1px solid #cbd5e1", marginBottom: 14, fontSize: 16 }} />
            <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: "1px solid #cbd5e1", marginBottom: 14, fontSize: 16 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <button type="button" onClick={() => setAuthAction("signin")} style={toggleButton(authAction === "signin")}>Sign In</button>
              <button type="button" onClick={() => setAuthAction("register")} style={toggleButton(authAction === "register")}>Register</button>
            </div>
          </>
        ) : (
          <>
            <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>{role === "teacher" ? "Teacher code" : "Class code"}</label>
            <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder={role === "teacher" ? "TEACHER" : `Class ${classCode} code`} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: "1px solid #cbd5e1", marginBottom: 14, fontSize: 16 }} />
          </>
        )}

        {message && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 12, fontWeight: 800, marginBottom: 14 }}>{message}</div>}

        <button type="submit" disabled={busy} style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "none", background: busy ? "#94a3b8" : "#2563eb", color: "#ffffff", fontWeight: 900, fontSize: 16, cursor: busy ? "not-allowed" : "pointer" }}>
          {busy ? "Working..." : loginMode === "real" ? (authAction === "register" ? "Create Account" : "Sign In") : "Sign in"}
        </button>

        <div style={{ marginTop: 14, color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
          {firebaseEnabled ? "Real accounts save progress online. Students join with their class code. Teachers can view class progress from any device." : "Firebase is not configured yet. Demo codes: students use 901/902, teacher uses TEACHER."}
        </div>
      </form>
    </div>
  );
}

export default function TeacherDashboard({
      Card,
  Stat,
  styles,
  students = [],
  selectedClass,
  liveSyncStatus,
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
  mistakeTypeStats = {},
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
  onMarkGroupPulled,
  onAddGroupNote,
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
  const [showNextWhy, setShowNextWhy] = useState(false);
  const [reportMode, setReportMode] = useState("draft"); // "draft" or "final"
  const [actionLocked, setActionLocked] = useState(false);
  const [lockedQueueStudent, setLockedQueueStudent] = useState(null);
  const [teacherActionLog, setTeacherActionLog] = useState(() => {
    try {
      const saved = localStorage.getItem("teacherActionLog");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editedReportComments, setEditedReportComments] = useState(() => {
  try {
    const saved = localStorage.getItem("editedReportComments");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
});

const editableReportComment =
  currentStudent && editedReportComments[currentStudent] !== undefined
    ? editedReportComments[currentStudent]
    : "";

  useEffect(() => {
    try {
      localStorage.setItem("teacherActionLog", JSON.stringify(teacherActionLog));
    } catch {
      // Prevent app crash if localStorage is unavailable
    }
  }, [teacherActionLog]);
useEffect(() => {
  try {
    localStorage.setItem("editedReportComments", JSON.stringify(editedReportComments));
  } catch {
    // Prevent app crash if localStorage is unavailable
  }
}, [editedReportComments]);
useEffect(() => {
  if (!currentStudent) return;

  setEditedReportComments((prev) => {
    if (prev[currentStudent] !== undefined) return prev;

    return {
      ...prev,
      [currentStudent]: buildStudentReportSummary(
        currentStudent,
        indicatorStats,
        assessmentStats,
        teacherActionLog
      ),
    };
  });
}, [currentStudent, indicatorStats, assessmentStats, teacherActionLog]);
 useEffect(() => {
  console.log(
    buildStudentReportSummary(
      currentStudent,
      indicatorStats,
      assessmentStats,
      teacherActionLog
    )
  );
}, [currentStudent, indicatorStats, assessmentStats, teacherActionLog]);

  function logTeacherAction(action) {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      student: action.student || "Class",
      type: action.type || "Action",
      detail: action.detail || "",
    };

    setTeacherActionLog((prev) => [newEntry, ...prev].slice(0, 50));
  }

  const liveStudentData = useMemo(() => {
  const map = {};

  students.forEach((student) => {
    const cloud = classSnapshot?.[student];

    map[student] = {
      indicatorStats: cloud?.indicatorStats || {},
      assessmentStats: cloud?.assessmentStats || {},
      teacherAssignments: cloud?.teacherAssignments || {},
      alerts: cloud?.alerts || [],
    };
  });

  return map;
}, [students, classSnapshot]);
  const getMergedClassField = (fieldName, fallbackValue) => {
    const merged = Array.isArray(fallbackValue) ? [...fallbackValue] : { ...(fallbackValue || {}) };
    Object.values(classSnapshot || {}).forEach((studentData) => {
      const value = studentData?.[fieldName];
      if (!value) return;
      if (Array.isArray(value)) merged.push(...value);
      else if (typeof value === "object") Object.assign(merged, value);
    });
    return merged;
  };

  const classIndicatorStats = getMergedClassField("indicatorStats", indicatorStats);
  const classAssessmentStats = getMergedClassField("assessmentStats", assessmentStats);
  const classAlerts = getMergedClassField("alerts", alerts);
  const classMistakeTypeStats = getMergedClassField("mistakeTypeStats", mistakeTypeStats);
  const classTeacherAssignments = getMergedClassField("teacherAssignments", teacherAssignments);

 const analytics = getClassAnalytics(
  students,
  classIndicatorStats,
  classAssessmentStats,
  classAlerts,
  classTeacherAssignments
);
  const groups = getInstructionalGroups(analytics);
  const classReportSummaryText = buildClassReportSummaryText(
  students,
  classIndicatorStats,
  classAssessmentStats,
  teacherActionLog
);
function exportClassReportsPdf() {
  
  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const reportCards = students
    .map((student) => {
      const comment = buildStudentReportSummary(
        student,
        classIndicatorStats,
        classAssessmentStats,
        teacherActionLog
      );

      return `
               <section class="student-report">
                              <h2>${escapeHtml(student)}</h2>

          <div class="info-grid">
            <div><strong>Class:</strong> ${escapeHtml(selectedClass)}</div>
            <div><strong>Subject:</strong> Math</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

                    <div class="comment-box">
            <div class="box-label">Report Comment Draft</div>
            <p>${escapeHtml(comment)}</p>
          </div>

                    <div class="checklist-box">
            <div class="box-label">Teacher Review Before Pasting</div>
            <div class="check-row">☐ Adjust wording for student voice / tone</div>
            <div class="check-row">☐ Confirm evidence matches report period</div>
            <div class="check-row">☐ Add specific example if needed</div>
          </div>

          <div class="signature-grid">
            <div><strong>Reviewed By:</strong> ____________________</div>
            <div><strong>Date:</strong> ____________________</div>
          </div>

          <div class="footer-note">
            Teacher note: Use this as draft evidence-based wording and adjust as needed before final report cards.
          </div>
        </section>
      `;
    })
    .join("");

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Pop-up blocked. Allow pop-ups, then try again.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Class Math Report Comments</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #0f172a;
            background: white;
          }

          h1 {
            font-size: 24px;
            margin-bottom: 4px;
          }

          .subtitle {
            color: #64748b;
            margin-bottom: 24px;
            font-size: 13px;
          }

                    .student-report {
            border: 2px solid #cbd5e1;
            border-radius: 14px;
            padding: 22px;
            margin-bottom: 18px;
            page-break-after: always;
            page-break-inside: avoid;
            min-height: 90vh;
            box-sizing: border-box;
          }

          .student-report:last-child {
            page-break-after: auto;
          }

          .student-report h2 {
            font-size: 18px;
            margin: 0 0 10px 0;
          }

          .student-report p {
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }

                    .comment-box {
            border: 2px solid #cbd5e1;
            border-radius: 14px;
            padding: 16px;
            background: #f8fafc;
            margin-top: 14px;
          }

          .box-label {
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

                    .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 14px 0;
          }

          .info-grid div {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px;
            background: #ffffff;
            font-size: 12px;
          }

                    .checklist-box {
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            padding: 14px;
            background: #ffffff;
            margin-top: 14px;
          }

          .check-row {
            font-size: 12px;
            margin-top: 8px;
            color: #334155;
          }

                    .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 18px;
          }

          .signature-grid div {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            font-size: 12px;
            color: #334155;
          }

                    .footer-note {
            margin-top: 28px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #64748b;
          }

          @media print {
            .student-report {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
                <h1>Class Math Report Drafts</h1>
        <div class="subtitle">
          Class ${escapeHtml(selectedClass)} · Math · ${new Date().toLocaleDateString()}
        </div>
        ${reportCards}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
  const groupSummaryText = `
Reteach: ${groups.reteach.length}
Assessment Ready: ${groups.assessmentReady.length}
Practice: ${groups.practice.length}
Enrichment: ${groups.enrichment.length}
`;
  const dailyTeacherPlan = {
  highPriority: groups.reteach.length,
  quickWins: groups.assessmentReady.length,
  practice: groups.practice.length,
  enrichment: groups.enrichment.length,
};
const topTeacherMove =
  groups.reteach.length > 0
    ? "Start with the reteach group before assigning more independent work."
    : groups.assessmentReady.length > 0
    ? "Assign assessments to students who are ready."
    : groups.practice.length > 0
    ? "Assign short targeted practice to keep evidence building."
    : groups.enrichment.length > 0
    ? "Give enrichment or challenge work to students who are finished."
    : "No urgent move yet. Keep collecting evidence.";
    const smartGroupQueue = [
  ...groups.reteach.map((row) => ({
    ...row,
    queueType: "Reteach",
    queuePriority: 1,
    queueColor: "#fee2e2",
    queueBorder: "#fecaca",
    queueText: "#991b1b",
  })),
  ...groups.assessmentReady.map((row) => ({
    ...row,
    queueType: "Assessment Ready",
    queuePriority: 2,
    queueColor: "#dcfce7",
    queueBorder: "#bbf7d0",
    queueText: "#166534",
  })),
  ...groups.practice.map((row) => ({
    ...row,
    queueType: "Practice",
    queuePriority: 3,
    queueColor: "#dbeafe",
    queueBorder: "#bfdbfe",
    queueText: "#1e40af",
  })),
  ...groups.enrichment.map((row) => ({
    ...row,
    queueType: "Enrichment",
    queuePriority: 4,
    queueColor: "#f3e8ff",
    queueBorder: "#e9d5ff",
    queueText: "#6b21a8",
  })),
].sort((a, b) => {
  if (a.queuePriority !== b.queuePriority) return a.queuePriority - b.queuePriority;
  return a.student.localeCompare(b.student);
});

const actedStudentNames = teacherActionLog
  .filter((entry) =>
    ["Assigned Practice", "Assigned Assessment", "Mini Lesson", "Completed Queue Student", "Needs Support"].includes(entry.type)
  )
  .map((entry) => entry.student);

const activeQueue = smartGroupQueue.filter(
  (row) => !actedStudentNames.includes(row.student)
);

const nextQueueStudent =
  lockedQueueStudent && smartGroupQueue?.length
    ? smartGroupQueue.find((row) => row.student === lockedQueueStudent) || smartGroupQueue[0] || null
    : activeQueue[0] || smartGroupQueue[0] || null;

    function getTimeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return `${Math.floor(diff / 86400)}d ago`;
}
    const nextQueueRecommendedAction =
  nextQueueStudent?.queueType === "Assessment Ready"
    ? "assessment"
    : nextQueueStudent?.queueType === "Reteach"
    ? "mini"
    : "practice";
const nextStudentCard = nextQueueStudent ? (
  <div
  onClick={() => {
    setCurrentStudent(nextQueueStudent.student);
    showTeacherSection("teacher-section-live");
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
  }}
    style={{
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      background: nextQueueStudent.queueColor,
      border: `1px solid ${nextQueueStudent.queueBorder}`,
      color: nextQueueStudent.queueText,
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
      cursor: "pointer",
      transition: "transform 0.12s ease, box-shadow 0.12s ease",
    }}
  >
   <div style={{ fontWeight: 900, fontSize: 14 }}>
  Next Student {lockedQueueStudent === nextQueueStudent.student ? "🔒 Locked" : ""}
</div>

<div style={{ marginTop: 4, fontSize: 11, fontWeight: 800 }}>
  Queue: {groups.reteach.length} reteach • {groups.assessmentReady.length} assess • {groups.practice.length} practice
</div>

   <div style={{ fontSize: 18, fontWeight: 900 }}>
  {nextQueueStudent.student}
</div>

{teacherActionLog.length > 0 && (
  <div style={{ marginTop: 4, fontSize: 11, color: "#64748b", fontWeight: 800 }}>
   <span>
  Last:{" "}
  <span
    style={{
      color:
        teacherActionLog[teacherActionLog.length - 1].type === "Needs Support"
          ? "#b91c1c"
          : "#64748b",
      fontWeight: 900,
    }}
  >
    {teacherActionLog[teacherActionLog.length - 1].type}
  </span>
</span>
  </div>
)}

    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
  {nextQueueStudent.queueType} • {smartGroupQueue.length} waiting • #
  {smartGroupQueue.findIndex((row) => row.student === nextQueueStudent.student) + 1}
</div>

    <div style={{ fontSize: 12 }}>
      {nextQueueStudent.groupReason}
    </div>

    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800 }}>
  👉 {nextQueueStudent.groupMove}
</div>
{showNextWhy && (
  <div
    style={{
      marginTop: 6,
      fontSize: 11,
      background: "rgba(0,0,0,0.05)",
      padding: 8,
      borderRadius: 8,
    }}
  >
    <div><strong>Reason:</strong> {nextQueueStudent.groupReason}</div>
    <div style={{ marginTop: 4 }}>
      <strong>Suggested move:</strong> {nextQueueStudent.groupMove}
    </div>
    <div style={{ marginTop: 4 }}>
      <strong>Focus:</strong> {nextQueueStudent.groupFocus || "Next outcome"}
    </div>
  </div>
)}
<div
  onClick={(e) => {
    e.stopPropagation();
    setShowNextWhy((prev) => !prev);
  }}
  style={{
    marginTop: 6,
    fontSize: 11,
    fontWeight: 800,
    textDecoration: "underline",
    cursor: "pointer",
    transition: "transform 0.12s ease, box-shadow 0.12s ease",
  }}
>
  {showNextWhy ? "Hide details" : "Why this student?"}
</div>

   <div
  style={{
    marginTop: 10,
    fontSize: 12,
    fontWeight: 900,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <span>
  Recommended:{" "}
  {nextQueueRecommendedAction === "assessment"
    ? "Assess"
    : nextQueueRecommendedAction === "mini"
    ? "Mini Lesson"
    : "Practice"}
</span>

  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      event.preventDefault();
      setLockedQueueStudent((prev) =>
        prev === nextQueueStudent.student ? null : nextQueueStudent.student
      );
    }}
    style={{
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 900,
      background:
        lockedQueueStudent === nextQueueStudent.student
          ? "#fef3c7"
          : "#ffffff",
      border:
        lockedQueueStudent === nextQueueStudent.student
          ? "2px solid #d97706"
          : "1px solid rgba(15,23,42,0.15)",
    }}
  >
    {lockedQueueStudent === nextQueueStudent.student ? "Unlock" : "Lock"}
  </button>
</div>

<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
  {teacherActionLog.length > 0 && (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      event.preventDefault();
      setTeacherActionLog((prev) => prev.slice(1));
    }}
    style={{
      padding: "6px 10px",
      borderRadius: 999,
      background: "#f8fafc",
      border: "1px solid #cbd5e1",
      fontSize: 12,
      fontWeight: 900,
    }}
  >
    Undo Last
  </button>
)}
  <button
  type="button"
  onClick={(event) => {
  if (actionLocked) return;
  setActionLocked(true);
    event.stopPropagation();
    event.preventDefault();

    if (nextQueueRecommendedAction === "assessment") {
      assignLiveAssessment(
  nextQueueStudent.student,
  nextQueueStudent.groupFocus || getSuggestedOutcomeForRow(nextQueueStudent),
  { advanceGroup: true }
);
      logTeacherAction({
        student: nextQueueStudent.student,
        type: "Assigned Assessment",
        detail: `Recommended assessment from queue (${nextQueueStudent.queueType}).`,
      });
      return;
    }

    if (nextQueueRecommendedAction === "mini") {
      startLiveMiniLesson(nextQueueStudent.student, nextQueueStudent.groupFocus);
      logTeacherAction({
        student: nextQueueStudent.student,
        type: "Mini Lesson",
        detail: `Recommended mini lesson from queue (${nextQueueStudent.queueType}).`,
      });
      return;
    }

    assignLivePractice(
  nextQueueStudent.student,
  nextQueueStudent.groupFocus || getSuggestedOutcomeForRow(nextQueueStudent),
  { advanceGroup: true }
);
    logTeacherAction({
      student: nextQueueStudent.student,
      type: "Assigned Practice",
      detail: `Recommended practice from queue (${nextQueueStudent.queueType}).`,
    });

setTimeout(() => setActionLocked(false), 400);
  }}
  style={{
    padding: "6px 10px",
    borderRadius: 999,
    background: "#e0f2fe",
    border: "2px solid #0284c7",
    fontSize: 12,
    fontWeight: 900,
  }}
>
  Do Recommended
</button>
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      event.preventDefault();
      assignLivePractice(
  nextQueueStudent.student,
  nextQueueStudent.groupFocus || getSuggestedOutcomeForRow(nextQueueStudent),
  { advanceGroup: true }
);
      logTeacherAction({
        student: nextQueueStudent.student,
        type: "Assigned Practice",
        detail: `Quick assigned from queue (${nextQueueStudent.queueType}).`,
      });
    }}
    style={{
  padding: "6px 10px",
  borderRadius: 999,
  background: "#dbeafe",
  border: nextQueueRecommendedAction === "practice"
    ? "3px solid #1d4ed8"
    : "1px solid #93c5fd",
  fontSize: 12,
  fontWeight: 900,
  boxShadow: nextQueueRecommendedAction === "practice"
    ? "0 0 0 3px rgba(37,99,235,0.18)"
    : "none",
}}
  >
    Practice
  </button>

  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      event.preventDefault();
      assignLiveAssessment(nextQueueStudent.student, nextQueueStudent.groupFocus, { advanceGroup: true });
      logTeacherAction({
        student: nextQueueStudent.student,
        type: "Assigned Assessment",
        detail: `Quick assigned from queue (${nextQueueStudent.queueType}).`,
      });
    }}
    style={{
      padding: "6px 10px",
      borderRadius: 999,
      background: "#dcfce7",
      border: nextQueueRecommendedAction === "assessment"
  ? "3px solid #166534"
  : "1px solid #86efac",
boxShadow: nextQueueRecommendedAction === "assessment"
  ? "0 0 0 3px rgba(22,163,74,0.18)"
  : "none",
      fontSize: 12,
      fontWeight: 900,
    }}
  >
    Assess
  </button>

  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      event.preventDefault();
      startLiveMiniLesson(nextQueueStudent.student, nextQueueStudent.groupFocus);
      logTeacherAction({
        student: nextQueueStudent.student,
        type: "Mini Lesson",
        detail: `Started from queue (${nextQueueStudent.queueType}).`,
      });
    }}
    style={{
      padding: "6px 10px",
      borderRadius: 999,
      background: "#fee2e2",
      border: nextQueueRecommendedAction === "mini"
  ? "3px solid #b91c1c"
  : "1px solid #fecaca",
boxShadow: nextQueueRecommendedAction === "mini"
  ? "0 0 0 3px rgba(220,38,38,0.18)"
  : "none",
      fontSize: 12,
      fontWeight: 900,
    }}
  >
   Mini Lesson
  </button>

  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      event.preventDefault();
      logTeacherAction({
        student: nextQueueStudent.student,
        type: "Completed Queue Student",
        detail: `Marked ${nextQueueStudent.queueType} as done.`,
      });
    }}
    style={{
      padding: "6px 10px",
      borderRadius: 999,
      background: "#ffffff",
      border: "1px solid rgba(15,23,42,0.15)",
      fontSize: 12,
      fontWeight: 900,
    }}
  >
    Done
  </button>
  <button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    event.preventDefault();

    assignLiveAssessment(nextQueueStudent.student, nextQueueStudent.groupFocus, {
      forceResult: "Passed",
      advanceGroup: true,
    });

    logTeacherAction({
      student: nextQueueStudent.student,
      type: "Marked Passed",
      detail: `Quick marked as passed from queue (${nextQueueStudent.queueType}).`,
    });
  }}
  style={{
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fef9c3",
    border: "1px solid #fde047",
    fontSize: 12,
    fontWeight: 900,
  }}
>
  Pass
</button>
<button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    event.preventDefault();

    logTeacherAction({
      student: nextQueueStudent.student,
      type: "Needs Support",
      detail: `Flagged for support from queue (${nextQueueStudent.queueType}).`,
    });
  }}
  style={{
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ffe4e6",
    border: "1px solid #fb7185",
    fontSize: 12,
    fontWeight: 900,
  }}
>
  Needs Support
</button>
</div>
  </div>
) : null;

const teacherSuggestions = [];

if (groups.reteach.length > 0) {
  teacherSuggestions.push({
    title: "Small Group Needed",
    priority: "High Priority",
    detail: `${groups.reteach.length} student${groups.reteach.length === 1 ? "" : "s"} need reteaching or rebuild support.`,
    actionLabel: "Assign Group Practice",
    onClick: () => onAssignGroupPractice(groups.reteach),
  });
}

if (groups.assessmentReady.length > 0) {
  teacherSuggestions.push({
    title: "Ready for Assessment",
    priority: "Quick Win",
    detail: `${groups.assessmentReady.length} student${groups.assessmentReady.length === 1 ? "" : "s"} are ready for an assessment.`,
    actionLabel: "Assign Assessment",
    onClick: () => onAssignGroupAssessment(groups.assessmentReady),
  });
}

if (groups.practice.length > 0) {
  teacherSuggestions.push({
    title: "Practice Group",
    priority: "Keep Moving",
    detail: `${groups.practice.length} student${groups.practice.length === 1 ? "" : "s"} should continue short practice.`,
    actionLabel: "Assign Practice",
    onClick: () => onAssignGroupPractice(groups.practice),
  });
}
 const mistakeTypeGroups = getTeacherMistakeGroups(students, classMistakeTypeStats, classAlerts);
const priorityRows = getClassPriorityRows(analytics);

const studentsWhoNeedYouFirst = priorityRows
  .filter((row) => row.priority === 1 || row.supportCount > 0 || row.alerts > 0)
  .slice(0, 5);
const priorityGroupsByOutcome = studentsWhoNeedYouFirst.reduce((groups, row) => {
  const outcome =
    row.outcomes?.find((item) => item.assessment?.status === "Needs Reassessment")?.outcome ||
    row.outcomes?.find((item) => item.status === "Needs Support")?.outcome ||
    row.outcomes?.find((item) => item.readyForAssessment && item.assessment?.status !== "Passed")?.outcome ||
    row.outcomes?.find((item) => item.status === "Developing")?.outcome ||
    "NO4";

  groups[outcome] = groups[outcome] || [];
  groups[outcome].push(row);

  return groups;
}, {});
const selectedSummary = analytics.studentRows.find((row) => row.student === currentStudent) || analytics.studentRows[0];
const selectedRow = analytics?.studentRows?.find((row) => row.student === currentStudent);
const hasNeedsReassessment = selectedRow?.outcomes?.some(
  (item) => item.assessment?.status === "Needs Reassessment"
);

const hasReadyAssessment = selectedRow?.outcomes?.some(
  (item) => item.readyForAssessment && item.assessment?.status !== "Passed"
);

const hasSupportNeed =
  selectedRow?.supportCount > 0 ||
  selectedRow?.alerts > 0 ||
  selectedRow?.outcomes?.some((item) => item.status === "Needs Support");

  const lastActionForCurrentStudent = teacherActionLog.find(
  (entry) => entry.student === currentStudent
);

const recommendedAction =
  lastActionForCurrentStudent?.type === "Mini Lesson"
    ? "practice"
    : lastActionForCurrentStudent?.type === "Assigned Practice" && hasReadyAssessment
    ? "assessment"
    : hasNeedsReassessment || hasSupportNeed
    ? "mini"
    : hasReadyAssessment || selectedRow?.readyCount > 0
    ? "assessment"
    : "practice";
  const selectedInsightLines = getTeacherInsightLines(selectedSummary);
  const selectedStudentNextStep = selectedSummary?.nextStep || "No next step yet.";
  const selectedRecommendedOutcome =
  selectedSummary?.outcomes?.find((item) => item.assessment?.status === "Needs Reassessment")?.outcome ||
  selectedSummary?.outcomes?.find((item) => item.status === "Needs Support")?.outcome ||
  selectedSummary?.outcomes?.find((item) => item.readyForAssessment && item.assessment?.status !== "Passed")?.outcome ||
  selectedSummary?.outcomes?.find((item) => item.status === "Developing")?.outcome ||
  selectedSummary?.outcomes?.find((item) => item.assessment?.status !== "Passed")?.outcome ||
  "NO4"; const selectedFriendlyReason = getFriendlyReasoningLine(selectedSummary, selectedRecommendedOutcome);
const adaptiveSuggestionReason =
  lastActionForCurrentStudent?.type === "Mini Lesson"
    ? "You just taught this student, so the next best move is a short practice check."
    : lastActionForCurrentStudent?.type === "Assigned Practice" && hasReadyAssessment
    ? "Practice has been assigned and the evidence suggests this student may be ready to assess."
    : selectedFriendlyReason;

const recommendedLiveAction =
  lastActionForCurrentStudent?.type === "Mini Lesson"
    ? "practice"
    : lastActionForCurrentStudent?.type === "Assigned Practice" && hasReadyAssessment
    ? "assessment"
    : hasNeedsReassessment || hasSupportNeed
    ? "miniLesson"
    : hasReadyAssessment
    ? "assessment"
    : "practice";
  const selectedConferenceNotes = getStudentConferenceNotes(selectedSummary);
  const selectedIndicators = Object.entries(classIndicatorStats)
    .filter(([key]) => key.startsWith(`${currentStudent}-`))
    .map(([key, data]) => ({ indicator: key.replace(`${currentStudent}-`, ""), ...data }))
    .sort((a, b) => a.indicator.localeCompare(b.indicator));
const weakestSkill =
  selectedIndicators?.length > 0
    ? [...selectedIndicators]
        .filter((item) => (item.attempts ?? 0) > 0)
        .sort((a, b) => {
          const accuracyA = a.accuracy ?? 0;
          const accuracyB = b.accuracy ?? 0;

          if (accuracyA !== accuracyB) return accuracyA - accuracyB;

          return (b.attempts ?? 0) - (a.attempts ?? 0);
        })[0]
    : null;

const smartBundle = buildSmartAssignmentBundle({
  weakestSkill,
  allIndicators: selectedIndicators,
});
const smartBundleQuestions =
  currentStudent && weakestSkill
    ? buildPracticeQuestionSet(
        "NO4",
        activeAllQuestions,
        "fractions",
        5,
        "normal",
        weakestSkill.indicator,
        smartBundle
          .filter((item) => item.type === "support" || item.type === "review")
          .map((item) => item.indicator)
      )
    : [];
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
    classIndicatorStats,
    classAssessmentStats,
    classAlerts,
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

  
  const workflowAssessmentRows = groups.assessmentReady.slice(0, 6);
  const workflowPracticeRows = groups.practice.slice(0, 6);
  const workflowFollowUpRows = dueInterventionPlans.slice(0, 6);
  const workflowTopReferralGroups = interventionReferralData.outcomeGroups.slice(0, 3);
const workflowSupportRows = priorityRows
  .filter((row) => row.priority === 1 || row.supportCount > 0 || row.alerts > 0)
  .slice(0, 6);
  const teacherDashboardNavItems = [
  { label: "Home", target: "teacher-section-home" },
  { label: "Live", target: "teacher-section-live" },
  { label: "Smart Groups", target: "teacher-section-smart-groups" },
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

  const [focusedGroupStudents, setFocusedGroupStudents] = useState([]);
const [focusedGroupIndex, setFocusedGroupIndex] = useState(0);
const [completedFocusedStudents, setCompletedFocusedStudents] = useState([]);
const [miniLessonStudents, setMiniLessonStudents] = useState([]);
const [autoAssignOnNext, setAutoAssignOnNext] = useState(false);
const [liveActionMessage, setLiveActionMessage] = useState("");
  const [activeTeacherSection, setActiveTeacherSection] = useState("teacher-section-home");

  function recordLiveAction(message) {
  setLiveActionMessage(message);

  window.setTimeout(() => {
    setLiveActionMessage("");
  }, 3000);
}

  function assignLivePractice(student, outcome, options = {}) {
  if (!student) return;

  const liveRow =
    analytics.studentRows.find((row) => row.student === student) || {
      student,
      outcomes: [],
    };

  const safeOutcome =
    outcome ||
    (liveRow.outcomes?.length ? getSuggestedOutcomeForRow(liveRow) : null) ||
    "NO4";

  setCurrentStudent(student);

  onAssignGroupPractice([
  {
    ...liveRow,
    student,
    groupFocus: safeOutcome,
    customQuestions: options.customQuestions || null,
    customBundle: options.customBundle || null,
  },
]);

  recordLiveAction(`Assigned practice to ${student}${safeOutcome ? ` for ${safeOutcome}` : ""}.`);

  if (options.advanceGroup) goToNextFocusedStudent();
}

  function assignLiveAssessment(student, outcome, options = {}) {
  if (!student) return;

  const liveRow =
    analytics.studentRows.find((row) => row.student === student) || {
      student,
      outcomes: [],
    };

  const safeOutcome =
    outcome ||
    (liveRow.outcomes?.length ? getSuggestedOutcomeForRow(liveRow) : null) ||
    "NO4";

  setCurrentStudent(student);

  onAssignGroupAssessment([
    {
      ...liveRow,
      student,
      groupFocus: safeOutcome,
    },
  ]);

  recordLiveAction(`Assigned assessment to ${student}${safeOutcome ? ` for ${safeOutcome}` : ""}.`);

  if (options.advanceGroup) goToNextFocusedStudent();
}

  function startLiveMiniLesson(student, outcome) {
    if (!student) return;
    setCurrentStudent(student);
    onForceMiniLesson?.(student, outcome);
    recordLiveAction(`Started mini lesson for ${student}${outcome ? ` on ${outcome}` : ""}.`);
  }

  function simplifyLiveWork(student) {
    if (!student) return;
    setCurrentStudent(student);
    onSimplify?.(student);
    recordLiveAction(`Turned on simplified support for ${student}.`);
  }
function goToNextFocusedStudent() {
  if (focusedGroupStudents.length === 0) return;

  setCompletedFocusedStudents((old) =>
    old.includes(currentStudent) ? old : [...old, currentStudent]
  );

  const isLast = focusedGroupIndex === focusedGroupStudents.length - 1;

  if (isLast) {
    setFocusedGroupStudents([]);
    setFocusedGroupIndex(0);
    setCompletedFocusedStudents([]);
    return;
  }

  const nextIndex = focusedGroupIndex + 1;
const nextStudent = focusedGroupStudents[nextIndex];

if (autoAssignOnNext && onAssignGroupPractice) {
  const nextStudentRow = analytics.studentRows.find(
    (row) => row.student === nextStudent
  );

  const nextOutcome =
    nextStudentRow?.outcomes?.find((item) => item.assessment?.status === "Needs Reassessment")?.outcome ||
    nextStudentRow?.outcomes?.find((item) => item.status === "Needs Support")?.outcome ||
    nextStudentRow?.outcomes?.find((item) => item.readyForAssessment && item.assessment?.status !== "Passed")?.outcome ||
    nextStudentRow?.outcomes?.find((item) => item.status === "Developing")?.outcome ||
    selectedRecommendedOutcome ||
    "NO4";

  onAssignGroupPractice([
    {
      student: nextStudent,
      groupFocus: nextOutcome,
    },
  ]);
  setLiveActionMessage(`Assigned ${nextOutcome} practice to ${nextStudent}.`);
}

setFocusedGroupIndex(nextIndex);
setCurrentStudent(nextStudent);
}
   function showTeacherSection(target) {
  setActiveTeacherSection(target);
  window.scrollTo({ top: 0, behavior: "smooth" });
}


function GroupBox({ title, helper, rows = [], empty, actionLabel, onAssignGroup }) {
  return (
    <div style={styles.groupBox}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div>
          <h3 style={styles.groupTitle}>{title}</h3>
          <p style={styles.cellSubtext}>{helper}</p>
        </div>
        <span
          style={{
            background: rows.length ? "#dbeafe" : "#f1f5f9",
            color: rows.length ? "#1d4ed8" : "#64748b",
            borderRadius: 999,
            padding: "6px 10px",
            fontWeight: 900,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p style={styles.emptyText}>{empty}</p>
      ) : (
        <>
          <div style={styles.groupList}>
            {rows.map((row) => (
              <div key={row.student} style={styles.groupStudent}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <strong>{row.student}</strong>
                  {row.groupFocus && (
                    <span
                      style={{
                        background: "#eef2ff",
                        color: "#3730a3",
                        borderRadius: 999,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.groupFocus}
                    </span>
                  )}
                </div>

                <span>{row.nextStep}</span>

                {row.groupReason && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 12,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                      color: "#334155",
                    }}
                  >
                    <strong>Why:</strong> {row.groupReason}
                    {row.groupMove && (
                      <div style={{ marginTop: 4 }}>
                        <strong>Teacher move:</strong> {row.groupMove}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {onAssignGroup && (
            <button type="button" onClick={onAssignGroup} style={styles.groupAssignButton || styles.gridActionButton}>
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

        <Card id="teacher-section-live" title="Live Class Dashboard" className="screen-only">
          <p style={styles.sectionIntro}>
            Use this page during class. Pick a student, see the current evidence, then choose the next teacher action without jumping around the app.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div style={styles.analyticsCard}>
              <div style={styles.cellSubtext}>Focus Student</div>
              <div style={{ fontSize: 24, fontWeight: 950, color: "#1e3a8a", marginTop: 4 }}>
                {currentStudent || "None selected"}
              </div>
              <div style={styles.cellSubtext}>Class {selectedClass}</div>
            </div>

            <div style={styles.analyticsCard}>
              <div style={styles.cellSubtext}>Recommended Outcome</div>
              <div style={{ fontSize: 24, fontWeight: 950, color: "#312e81", marginTop: 4 }}>
                {selectedRecommendedOutcome || "—"}
              </div>
              <div style={styles.cellSubtext}>Based on support flags, readiness, and recent evidence.</div>
            </div>

            <div style={styles.analyticsCard}>
              <div style={styles.cellSubtext}>Live Sync</div>
              <div style={{ fontSize: 24, fontWeight: 950, color: liveSyncStatus?.connected ? "#166534" : "#92400e", marginTop: 4 }}>
                {liveSyncStatus?.connected ? "Connected" : "Local / Not connected"}
              </div>
              <div style={styles.cellSubtext}>
                {liveSyncStatus?.lastUpdate ? `Updated ${liveSyncStatus.lastUpdate}` : `${liveSyncStatus?.studentCount ?? students.length} student(s)`}
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: 14,
              padding: 14,
              borderRadius: 18,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <div style={{ fontWeight: 950, color: "#1e3a8a", marginBottom: 6 }}>
              Current Teacher Move
              {(() => {
  const lastAction = teacherActionLog.find(
    (entry) => entry.student === currentStudent
  );

  if (!lastAction) return null;

  return (
    <div
      style={{
        marginTop: 6,
        fontSize: 12,
        fontWeight: 800,
        color: "#475569",
      }}
    >
      Last action: {lastAction.type}
      {lastAction.detail ? ` · ${lastAction.detail}` : ""}
    </div>
  );
})()}
            </div>
            <div style={{ fontSize: 14, color: "#334155", fontWeight: 750, lineHeight: 1.45 }}>
              <strong>Next:</strong> {selectedStudentNextStep}
            </div>
            <div style={{ fontSize: 14, color: "#334155", fontWeight: 750, lineHeight: 1.45, marginTop: 4 }}>
              <strong>Why:</strong> {selectedFriendlyReason}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontWeight: 800 }}>
              Evidence: {selectedSummary?.supportCount || 0} support flag(s) · {selectedSummary?.alerts || 0} alert(s)
            </div>

            {liveActionMessage && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  borderRadius: 12,
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  color: "#166534",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {liveActionMessage}
              </div>
            )}

            <div
  id="live-action-buttons"
  style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}
>
              <button
                type="button"
               onClick={() => {
  assignLivePractice(currentStudent, selectedRecommendedOutcome, { advanceGroup: true });

  logTeacherAction({
    student: currentStudent,
    type: "Assigned Practice",
    detail: selectedRecommendedOutcome || "",
  });

  if (autoAssignOnNext && focusedGroupStudents.length > 0) {
    const isLast = focusedGroupIndex >= focusedGroupStudents.length - 1;

    if (!isLast) {
      const nextIndex = focusedGroupIndex + 1;
      const nextStudent = focusedGroupStudents[nextIndex];

      setFocusedGroupIndex(nextIndex);
      setCurrentStudent(nextStudent);
    }
  }
}}
                style={{
  ...styles.gridActionButton,
  boxShadow:
    recommendedLiveAction === "practice"
      ? "0 0 0 3px rgba(34, 197, 94, 0.25)"
      : "none",
}}
                disabled={!currentStudent}
              >
                Assign Practice
              </button>

              <button
                type="button"
                onClick={() => {
  assignLiveAssessment(currentStudent, selectedRecommendedOutcome, { advanceGroup: true });

  logTeacherAction({
    student: currentStudent,
    type: "Assigned Assessment",
    detail: selectedRecommendedOutcome || "",
  });
}}
                style={{
  ...styles.gridActionButton,
  boxShadow:
    recommendedLiveAction === "assessment"
      ? "0 0 0 3px rgba(59, 130, 246, 0.25)"
      : "none",
}}
                disabled={!currentStudent}
              >
                Assign Assessment
              </button>

              <button
                type="button"
                onClick={() => {
  startLiveMiniLesson(currentStudent, selectedRecommendedOutcome);

  logTeacherAction({
    student: currentStudent,
    type: "Mini Lesson",
    detail: selectedRecommendedOutcome || "",
  });

  if (autoAssignOnNext && focusedGroupStudents.length > 0) {
    goToNextFocusedStudent();
  }
}}
                style={{
  ...styles.gridActionButton,
  boxShadow:
    recommendedLiveAction === "miniLesson"
      ? "0 0 0 3px rgba(234, 88, 12, 0.25)"
      : "none",
}}
                disabled={!currentStudent}
              >
                Mini Lesson
              </button>

              <button
                type="button"
                onClick={() => {
  simplifyLiveWork(currentStudent);

  logTeacherAction({
    student: currentStudent,
    type: "Simplified Work",
    detail: "Adapted live task",
  });
}}
                style={styles.gridActionButton}
                disabled={!currentStudent}
              >
                Simplify
              </button>

              <div style={{ marginBottom: 10, fontWeight: "600" }}>
  {focusedGroupStudents.length > 0 ? (
    <>
      Student {focusedGroupIndex + 1} of {focusedGroupStudents.length}
      {" — "}
      {focusedGroupStudents[focusedGroupIndex]}
    </>
  ) : (
    "No active group"
  )}
</div>
{teacherActionLog.length > 0 && (
  <div
    style={{
      marginTop: 10,
      padding: 10,
      borderRadius: 12,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b" }}>
      Recent Actions
    </div>

    {teacherActionLog.slice(0, 3).map((entry) => (
  <button
    type="button"
    key={entry.id}
    onClick={() => {
      if (entry.student && entry.student !== "Class") {
        setCurrentStudent(entry.student);
        showTeacherSection("teacher-section-live");

        setTimeout(() => {
          document.getElementById("teacher-section-live")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      }
    }}
    style={{
  fontSize: 12,
  fontWeight: 700,
  color: entry.student === currentStudent ? "#1e3a8a" : "#334155",
  textAlign: "left",
  background: entry.student === currentStudent ? "#eff6ff" : "transparent",
  border: entry.student === currentStudent ? "1px solid #bfdbfe" : "none",
  borderRadius: entry.student === currentStudent ? 6 : 0,
  cursor: entry.student && entry.student !== "Class" ? "pointer" : "default",
  padding: entry.student === currentStudent ? "2px 6px" : 0,
}}
  >
    {entry.type} — {entry.student}{entry.detail ? ` · ${entry.detail}` : ""}
  </button>
))}
  </div>
)}
  <div
  style={{
    marginBottom: 10,
    padding: 10,
    borderRadius: 12,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontWeight: 900,
    fontSize: 13,
  }}
>
  Suggested live action:{" "}
  {recommendedAction === "mini"
    ? "Mini Lesson / Support"
    : recommendedAction === "assessment"
    ? "Assign Assessment"
    : "Assign Practice"}

  <div
    style={{
      marginTop: 4,
      fontSize: 12,
      fontWeight: 700,
      color: "#64748b",
    }}
  >
    {adaptiveSuggestionReason}
  </div>
</div>

<label
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    fontWeight: 800,
    color: "#334155",
  }}
>
  <input
    type="checkbox"
    checked={autoAssignOnNext}
    onChange={(e) => setAutoAssignOnNext(e.target.checked)}
  />
  Auto-move to next student after action
</label>

{liveActionMessage && (
  <div
    style={{
      marginBottom: 10,
      padding: 10,
      borderRadius: 12,
      background: "#ecfdf5",
      border: "1px solid #bbf7d0",
      color: "#166534",
      fontWeight: 800,
      fontSize: 13,
    }}
  >
    {liveActionMessage}
  </div>
)}

<button
  type="button"
  onClick={() => {
    if (focusedGroupStudents.length === 0) return;

    const current = focusedGroupStudents[focusedGroupIndex];

    setCompletedFocusedStudents((old) =>
      old.includes(current) ? old : [...old, current]
    );

    const isLast = focusedGroupIndex >= focusedGroupStudents.length - 1;

    if (isLast) {
      alert("Group rotation complete.");
      setFocusedGroupStudents([]);
      setFocusedGroupIndex(0);
      setCompletedFocusedStudents([]);
      return;
    }

   const nextIndex = focusedGroupIndex + 1;
const nextStudent = focusedGroupStudents[nextIndex];

// 🔥 AUTO ASSIGN PRACTICE
if (onAssignGroupPractice) {
  onAssignGroupPractice([nextStudent]);
}

setFocusedGroupIndex(nextIndex);
setCurrentStudent(nextStudent);
  }}
  style={styles.gridActionButton}
  disabled={focusedGroupStudents.length === 0}
>
  Next Student
</button>
<button
  type="button"
  onClick={() => {
  setFocusedGroupStudents([]);
  setFocusedGroupIndex(0);
  setCompletedFocusedStudents([]);
  setMiniLessonStudents([]); 
  setCurrentStudent(null);
  recordLiveAction("Group reset.");
}}
  style={{
    ...styles.secondaryButton,
    marginTop: 8,
  }}
>
  Reset Group
</button>
<button
  type="button"
  onClick={() => {
  if (!currentStudent) return;

  if (onForceMiniLesson) {
    onForceMiniLesson(currentStudent);
  }

    setMiniLessonStudents((old) =>
    old.includes(currentStudent) ? old : [...old, currentStudent]
  );

  recordLiveAction(`Mini lesson triggered for ${currentStudent}.`);
}}
  style={{
    ...styles.gridActionButton,
    marginTop: 8,
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
  }}
>
  Mini Lesson
</button>
<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
  <button
    type="button"
    onClick={() => {
      if (!currentStudent) return;

      if (onAssignGroupPractice) {
        onAssignGroupPractice([{ student: currentStudent }]);
      }

      recordLiveAction(`Practice assigned to ${currentStudent}.`);
    }}
    style={{
  ...styles.gridActionButton,
  marginTop: 8,
  background: recommendedAction === "mini" ? "#fde68a" : "#fef3c7",
  border: "1px solid #fcd34d",
  color: "#92400e",
  boxShadow: recommendedAction === "mini" ? "0 0 0 3px #fde68a" : "none",
}}
  >
    Assign Practice
  </button>

  <button
    type="button"
    onClick={() => {
      if (!currentStudent) return;

      if (onStartAssessment) {
        onStartAssessment(currentStudent);
      }

      recordLiveAction(`Assessment started for ${currentStudent}.`);
    }}
    style={{
  ...styles.gridActionButton,
  background: recommendedAction === "practice" ? "#bae6fd" : "#e0f2fe",
  border: "1px solid #7dd3fc",
  color: "#075985",
  boxShadow: recommendedAction === "practice" ? "0 0 0 3px #7dd3fc" : "none",
}}
  >
    Start Assessment
  </button>
</div>
            </div>
          </div>

          {focusedGroupStudents.length > 0 && (
            <div
              style={{
  ...styles.gridActionButton,
  background: recommendedAction === "assessment" ? "#ddd6fe" : "#ede9fe",
  border: "1px solid #c4b5fd",
  color: "#5b21b6",
  boxShadow: recommendedAction === "assessment" ? "0 0 0 3px #c4b5fd" : "none",
}}
            >
              <div style={{ fontWeight: 950, color: "#312e81", marginBottom: 8 }}>
                Focus Group Progress: {focusedGroupIndex + 1}/{focusedGroupStudents.length}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {focusedGroupStudents.map((student, index) => {
                  const isDone = completedFocusedStudents.includes(student);
                  const hadMiniLesson = miniLessonStudents.includes(student);
                  const isCurrent = student === currentStudent;

                  return (
                    <button
                      type="button"
                      key={student}
                      onClick={() => {
                        setFocusedGroupIndex(index);
                        setCurrentStudent(student);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "7px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900,
                        border: isCurrent ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        background: isDone ? "#bbf7d0" : isCurrent ? "#dbeafe" : "#f8fafc",
                        color: isDone ? "#14532d" : isCurrent ? "#1e40af" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {hadMiniLesson ? "📘 Mini" : isDone ? "✓ Done" : isCurrent ? "▶" : index + 1} {student}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {analytics.studentRows.length === 0 ? (
            <p>No students found for this class yet. Have a student register with Class {selectedClass}, complete a question, then return here.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.reportTable}>
                <thead>
                  <tr>
                    <th style={styles.reportCell}>Student</th>
                    <th style={styles.reportCell}>Status</th>
                    <th style={styles.reportCell}>Evidence</th>
                    <th style={styles.reportCell}>Next Step</th>
                    <th style={styles.reportCell}>Live Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.studentRows.map((row) => {
                    const studentIndicatorRows = Object.entries(classIndicatorStats || {})
                      .filter(([key]) => key.startsWith(`${row.student}-`))
                      .map(([key, data]) => ({
                        indicator: key.replace(`${row.student}-`, ""),
                        attempts: data?.attempts || 0,
                        correct: data?.correct || 0,
                        accuracy: data?.accuracy || 0,
                        status: data?.status || "Not Started",
                      }));

                    const attemptedIndicators = studentIndicatorRows.filter((item) => item.attempts > 0).length;
                    const masteredIndicators = studentIndicatorRows.filter(
                      (item) => item.status === "Mastered" || (item.attempts >= 3 && item.accuracy >= 80)
                    ).length;
                    const supportIndicators = studentIndicatorRows.filter(
                      (item) => item.status === "Needs Support" || (item.attempts > 0 && item.accuracy < 60)
                    ).length;
                    const totalAttempts = studentIndicatorRows.reduce((sum, item) => sum + item.attempts, 0);
                    const totalCorrect = studentIndicatorRows.reduce((sum, item) => sum + item.correct, 0);
                    const liveAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
                    const suggestedOutcome = getSuggestedOutcomeForRow(row);

                    const status = supportIndicators > 0 || row.supportCount > 0
                      ? "Needs Support"
                      : row.readyCount > 0
                      ? "Ready"
                      : masteredIndicators > 0
                      ? "Mastered Evidence"
                      : attemptedIndicators > 0
                      ? "Developing"
                      : row.masteredCount > 0
                      ? "Mastered"
                      : "Not Started";

                    const evidenceLabel = totalAttempts > 0
                      ? `${totalCorrect}/${totalAttempts} correct · ${liveAccuracy}% · ${masteredIndicators} mastered`
                      : "No evidence yet";

                    return (
                      <tr key={row.student} style={row.student === currentStudent ? { background: "#eff6ff" } : undefined}>
                        <td style={styles.reportCell}>
                          <button
                            type="button"
                            onClick={() => setCurrentStudent(row.student)}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              margin: 0,
                              color: "#1e3a8a",
                              fontWeight: 950,
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            {row.student}
                          </button>
                          {row.student === currentStudent && <div style={styles.cellSubtext}>Selected</div>}
                        </td>
                        <td style={styles.reportCell}>{status}</td>
                        <td style={styles.reportCell}>{evidenceLabel}</td>
                        <td style={styles.reportCell}>{row.nextStep}</td>
                        <td style={styles.reportCell}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => setCurrentStudent(row.student)}
                              style={styles.gridActionButton}
                            >
                              Focus
                            </button>
                            <button
                              type="button"
                              onClick={() => assignLivePractice(row.student, suggestedOutcome)}
                              style={styles.gridActionButton}
                            >
                              Practice
                            </button>
                            <button
                              type="button"
                              onClick={() => assignLiveAssessment(row.student, suggestedOutcome)}
                              style={styles.gridActionButton}
                            >
                              Assess
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFocusedGroupStudents([row.student]);
                                setFocusedGroupIndex(0);
                                setCompletedFocusedStudents([]);
                                setCurrentStudent(row.student);
                                recordLiveAction(`${row.student} added to the live focus queue.`);
                              }}
                              style={styles.gridActionButton}
                            >
                              Queue
                            </button>
                          </div>
                          {classSnapshot?.[row.student]?.teacherAction ? (
                            <div style={styles.cellSubtext}>
                              Last: {classSnapshot[row.student].teacherAction.type}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card id="teacher-section-smart-groups" title="Smart Groups" className="screen-only">
          <p style={styles.sectionIntro}>
            Pull small groups from live evidence. These groups are built from indicator progress, assessment readiness, support flags, and repeated mistakes.
          </p>

          <div style={styles.groupGrid}>
            <div style={styles.analyticsCard}>
              <div style={styles.analyticsTitle}>Pull First</div>
              <div style={styles.cellSubtext}>Students most likely needing teacher table support right now.</div>
              {(groups.reteach || []).length === 0 ? (
                <p style={styles.emptyText}>No urgent reteach group right now.</p>
              ) : (
                <div style={styles.indicatorList}>
                  {groups.reteach.slice(0, 6).map((row) => (
                    <div key={`smart-reteach-${row.student}`} style={styles.indicatorRow}>
                      <div>
                        <strong>{row.student}</strong>
                        <div style={styles.cellSubtext}>{row.groupReason || row.nextStep}</div>
                        <div style={styles.cellSubtext}>Focus: {row.groupFocus || "next indicator"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={styles.rowWrap}>
                <button
  type="button"
  onClick={() => {
    onAssignGroupPractice(groups.reteach || []);
    alert("Practice assigned to reteach group");
  }}
  disabled={(groups.reteach || []).length === 0}
  style={{
    ...styles.gridActionButton,
    opacity: (groups.reteach || []).length === 0 ? 0.5 : 1,
  }}
>
  Assign Practice to Group
</button>
                <button type="button" onClick={() => onMarkGroupPulled(groups.reteach || [])} disabled={(groups.reteach || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.reteach || []).length === 0 ? 0.5 : 1 }}>
                  Mark Group Pulled
                </button>
                <button type="button" onClick={() => onAddGroupNote(groups.reteach || [])} disabled={(groups.reteach || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.reteach || []).length === 0 ? 0.5 : 1 }}>
                  Add Group Note
                </button>
              </div>
            </div>

            <div style={styles.analyticsCard}>
              <div style={styles.analyticsTitle}>Ready to Assess</div>
              <div style={styles.cellSubtext}>Students with enough indicator evidence for an outcome assessment.</div>
              {(groups.assessmentReady || []).length === 0 ? (
                <p style={styles.emptyText}>No students ready for assessment yet.</p>
              ) : (
                <div style={styles.indicatorList}>
                  {groups.assessmentReady.slice(0, 6).map((row) => (
                    <div key={`smart-assess-${row.student}`} style={styles.indicatorRow}>
                      <div>
                        <strong>{row.student}</strong>
                        <div style={styles.cellSubtext}>{row.groupReason || row.nextStep}</div>
                        <div style={styles.cellSubtext}>Focus: {row.groupFocus || "assessment"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={styles.rowWrap}>
                <button type="button" onClick={() => onAssignGroupAssessment(groups.assessmentReady || [])} disabled={(groups.assessmentReady || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.assessmentReady || []).length === 0 ? 0.5 : 1 }}>
                  Assign Assessment to Group
                </button>
                <button type="button" onClick={() => onMarkGroupPulled(groups.assessmentReady || [])} disabled={(groups.assessmentReady || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.assessmentReady || []).length === 0 ? 0.5 : 1 }}>
                  Mark Group Pulled
                </button>
                <button type="button" onClick={() => onAddGroupNote(groups.assessmentReady || [])} disabled={(groups.assessmentReady || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.assessmentReady || []).length === 0 ? 0.5 : 1 }}>
                  Add Group Note
                </button>
              </div>
            </div>

            <div style={styles.analyticsCard}>
              <div style={styles.analyticsTitle}>Practice Cycle</div>
              <div style={styles.cellSubtext}>Students who should keep building evidence with short targeted practice.</div>
              {(groups.practice || []).length === 0 ? (
                <p style={styles.emptyText}>No students need a regular practice cycle right now.</p>
              ) : (
                <div style={styles.indicatorList}>
                  {groups.practice.slice(0, 6).map((row) => (
                    <div key={`smart-practice-${row.student}`} style={styles.indicatorRow}>
                      <div>
                        <strong>{row.student}</strong>
                        <div style={styles.cellSubtext}>{row.groupReason || row.nextStep}</div>
                        <div style={styles.cellSubtext}>Focus: {row.groupFocus || "next indicator"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={styles.rowWrap}>
                <button type="button" onClick={() => onAssignGroupPractice(groups.practice || [])} disabled={(groups.practice || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.practice || []).length === 0 ? 0.5 : 1 }}>
                  Assign Practice to Group
                </button>
                <button type="button" onClick={() => onMarkGroupPulled(groups.practice || [])} disabled={(groups.practice || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.practice || []).length === 0 ? 0.5 : 1 }}>
                  Mark Group Pulled
                </button>
                <button type="button" onClick={() => onAddGroupNote(groups.practice || [])} disabled={(groups.practice || []).length === 0} style={{ ...styles.gridActionButton, opacity: (groups.practice || []).length === 0 ? 0.5 : 1 }}>
                  Add Group Note
                </button>
              </div>
            </div>

            <div style={styles.analyticsCard}>
              <div style={styles.analyticsTitle}>Mistake-Based Groups</div>
              <div style={styles.cellSubtext}>Groups based on repeated mistake patterns, not just outcomes.</div>
              {mistakeTypeGroups.length === 0 ? (
                <p style={styles.emptyText}>No mistake groups yet. They appear after repeated errors are recorded.</p>
              ) : (
                <div style={styles.indicatorList}>
                  {mistakeTypeGroups.slice(0, 4).map((group) => (
                    <div key={`smart-mistake-${group.mistakeType}`} style={styles.indicatorRow}>
                      <div>
                        <strong>{group.mistakeType}</strong>
                        <div style={styles.cellSubtext}>{group.total} recorded mistake{group.total === 1 ? "" : "s"}</div>
                        <div style={styles.cellSubtext}>Students: {group.students.map((student) => student.student).join(", ") || "—"}</div>
                        <div style={{ ...styles.recommendationBox, marginTop: 8 }}>
                          <strong>Teacher move:</strong> {group.teacherMove}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={styles.rowWrap}>
                <button
                  type="button"
                  onClick={() => onAssignGroupPractice(mistakeTypeGroups.flatMap((group) => group.students || []))}
                  disabled={mistakeTypeGroups.length === 0}
                  style={{ ...styles.gridActionButton, opacity: mistakeTypeGroups.length === 0 ? 0.5 : 1 }}
                >
                  Assign Practice to Mistake Groups
                </button>
                <button
                  type="button"
                  onClick={() => onMarkGroupPulled(mistakeTypeGroups.flatMap((group) => group.students || []))}
                  disabled={mistakeTypeGroups.length === 0}
                  style={{ ...styles.gridActionButton, opacity: mistakeTypeGroups.length === 0 ? 0.5 : 1 }}
                >
                  Mark Mistake Group Pulled
                </button>
                <button
                  type="button"
                  onClick={() => onAddGroupNote(mistakeTypeGroups.flatMap((group) => group.students || []))}
                  disabled={mistakeTypeGroups.length === 0}
                  style={{ ...styles.gridActionButton, opacity: mistakeTypeGroups.length === 0 ? 0.5 : 1 }}
                >
                  Add Mistake Group Note
                </button>
              </div>
            </div>
          </div>
        </Card>

  <div
  style={{
    marginBottom: 16,
    padding: 14,
    borderRadius: 18,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
  }}
>
  <div style={{ fontWeight: 900, color: "#1e3a8a" }}>
    Live Sync: {liveSyncStatus?.connected ? "Connected" : "Not connected"}
  </div>

  <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
    Class {selectedClass} · {liveSyncStatus?.studentCount ?? 0} cloud students
    {liveSyncStatus?.lastUpdate ? ` · Updated ${liveSyncStatus.lastUpdate}` : ""}
  </div>

  {liveSyncStatus?.error && (
    <div style={{ fontSize: 13, color: "#b91c1c", marginTop: 4 }}>
      {liveSyncStatus.error}
    </div>
  )}
</div>

<div
  style={{
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
  }}
>
  <div style={{ fontWeight: 900, color: "#312e81", marginBottom: 10 }}>
    Teacher Decision Suggestions
  </div>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 8,
    marginBottom: 12,
  }}
>
  <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>High Priority</div>
    <div style={{ fontSize: 22, fontWeight: 900, color: "#991b1b" }}>{dailyTeacherPlan.highPriority}</div>
  </div>

  <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Quick Wins</div>
    <div style={{ fontSize: 22, fontWeight: 900, color: "#166534" }}>{dailyTeacherPlan.quickWins}</div>
  </div>

  <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Practice</div>
    <div style={{ fontSize: 22, fontWeight: 900, color: "#3730a3" }}>{dailyTeacherPlan.practice}</div>
  </div>

  <div style={{ background: "#fff", borderRadius: 12, padding: 10 }}>
    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Enrichment</div>
    <div style={{ fontSize: 22, fontWeight: 900, color: "#92400e" }}>{dailyTeacherPlan.enrichment}</div>
  </div>
</div>
  {teacherSuggestions.length === 0 ? (
    <div style={{ color: "#64748b", fontSize: 14 }}>
      No suggestions yet. Student data will appear here as evidence builds.
    </div>
  ) : (
    <div style={{ display: "grid", gap: 10 }}>
      {teacherSuggestions.map((item) => (
        <div
          key={item.title}
          style={{
            background: "#ffffff",
            border: "1px solid #ddd6fe",
            borderRadius: 14,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
  <div style={{ fontWeight: 900, color: "#3730a3" }}>{item.title}</div>
  <div
    style={{
      fontSize: 12,
      fontWeight: 900,
      color: "#312e81",
      background: "#e0e7ff",
      borderRadius: 999,
      padding: "4px 8px",
    }}
  >
    {item.priority}
  </div>
</div>
          <div style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>
            {item.detail}
          </div>
          <div style={{ fontSize: 13, color: "#312e81", marginTop: 6, fontWeight: 800 }}>
            <button
  type="button"
  onClick={item.onClick}
  style={{
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  }}
>
  {item.actionLabel}
</button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

<div
  style={{
    background: "#ffffff",
    border: "1px solid #ddd6fe",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  }}
>
  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 900 }}>
    Today’s Top Move
  </div>
  <div style={{ marginTop: 4, fontWeight: 900, color: "#312e81" }}>
    {topTeacherMove}
  </div>
  </div>

<div
  style={{
    background: "#ffffff",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  }}
>
  <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 900 }}>
    <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 900, marginBottom: 8 }}>
  Priority Groups by Outcome
</div>

<div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
  {Object.entries(priorityGroupsByOutcome).map(([outcome, rows]) => (
    <div
      key={outcome}
      style={{
        background: "#fff",
        border: "1px solid #fed7aa",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <div style={{ fontWeight: 900, color: "#9a3412" }}>
        {outcome}: {rows.length} student{rows.length === 1 ? "" : "s"}
      </div>
      <button
  type="button"
  onClick={() => {
  const firstStudent = rows[0]?.student;
  const groupStudents = rows.map((row) => row.student);

  if (firstStudent) {
    setCurrentStudent(firstStudent);
    setFocusedGroupStudents(groupStudents);
    setFocusedGroupIndex(0);
    setCompletedFocusedStudents([]);

    logTeacherAction({
      student: firstStudent,
      type: "Focused Group",
      detail: `${outcome}: ${groupStudents.join(", ")}`,
    });

    showTeacherSection("teacher-section-live");

    document.getElementById("live-action-buttons")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}}
  style={{
    marginTop: 6,
    fontSize: 12,
    fontWeight: 800,
    color: "#1e3a8a",
    background: "#e0e7ff",
    border: "none",
    borderRadius: 8,
    padding: "4px 8px",
    cursor: "pointer",
  }}
>
  Focus This Group
</button>
      <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
        {rows.map((row) => row.student).join(", ")}
        <button
  type="button"
  onClick={() => {
  const groupStudents = rows.map((row) => row.student);
  const firstStudent = groupStudents[0];

  if (firstStudent) {
    setCurrentStudent(firstStudent);
    setFocusedGroupStudents(groupStudents);
    setFocusedGroupIndex(0);
    setCompletedFocusedStudents([]);

    onAssignGroupPractice(
      rows.map((row) => ({
        student: row.student,
        groupFocus: outcome,
      }))
    );

    logTeacherAction({
      student: firstStudent,
      type: "Assigned Group Practice",
      detail: `${outcome}: ${groupStudents.join(", ")}`,
    });

    showTeacherSection("teacher-section-live");

    setTimeout(() => {
      document.getElementById("live-action-buttons")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }
}}
>
  Assign {outcome} Practice
</button>
{rows.some((row) =>
  row.outcomes?.some(
    (item) =>
      item.outcome === outcome &&
      item.readyForAssessment &&
      item.assessment?.status !== "Passed"
  )
) && (
  <button
    type="button"
   onClick={() => {
  const groupStudents = rows.map((row) => row.student);
  const firstStudent = groupStudents[0];

  onAssignGroupAssessment(
    rows.map((row) => ({
      student: row.student,
      groupFocus: outcome,
    }))
  );

  if (firstStudent) {
    setCurrentStudent(firstStudent);
    setFocusedGroupStudents(groupStudents);
    setFocusedGroupIndex(0);
    setCompletedFocusedStudents([]);

    logTeacherAction({
      student: firstStudent,
      type: "Assigned Group Assessment",
      detail: `${outcome}: ${groupStudents.join(", ")}`,
    });

    showTeacherSection("teacher-section-live");

    setTimeout(() => {
      document.getElementById("live-action-buttons")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }
}}
    style={{
      ...styles.gridActionButton,
      marginTop: 8,
      marginLeft: 8,
    }}
  >
    Assign {outcome} Assessment
  </button>
)}
      </div>
    </div>
  ))}
</div>
    Students Who Need You First
  </div>

  {studentsWhoNeedYouFirst.length === 0 ? (
    <div style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>
      No urgent students right now.
    </div>
  ) : (
    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
      {studentsWhoNeedYouFirst.map((row) => (
        <div
          key={row.student}
          style={{
            border: "1px solid #fee2e2",
            borderRadius: 12,
            padding: 10,
            background: row.student === currentStudent ? "#fee2e2" : "#fff7ed",
boxShadow: row.student === currentStudent ? "0 0 0 3px rgba(220, 38, 38, 0.16)" : "none",
          }}
        >
          <button
  key={row.student}
  type="button"
  onClick={() => {
  setCurrentStudent(row.student);
  logTeacherAction({
    student: row.student,
    type: "Entered Live",
    detail: row.nextStep || "Started live teaching flow",
  });
  showTeacherSection("teacher-section-live");

  document.getElementById("live-action-buttons")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}}
  style={{
    ...styles.studentChip,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <span>{row.student}</span>

  <span style={{ fontSize: 11, fontWeight: 900, color: "#2563eb" }}>
    Start Live →
  </span>
</button>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
            {row.nextStep}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
<div
  style={{
    marginTop: 10,
    fontSize: 13,
    fontWeight: 900,
    color: "#7f1d1d",
  }}
>
  Selected: {currentStudent || "None"}
</div>
        <>
  {nextStudentCard}
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
  setLiveStudent={setCurrentStudent}
  currentStudent={currentStudent}
  onAssignGroupPractice={onAssignGroupPractice}
  onAssignGroupAssessment={onAssignGroupAssessment}
  openInterventionReferralEmail={openInterventionReferralEmail}
  copyInterventionReferral={copyInterventionReferral}
  getSuggestedOutcomeForRow={getSuggestedOutcomeForRow}
   showTeacherSection={showTeacherSection}
   logTeacherAction={logTeacherAction}
/>
</>
<Card id="teacher-section-actions" title="Recent Teacher Actions" className="screen-only">
  <p style={styles.sectionIntro}>
    Live record of your teaching moves. Helps track evidence, decisions, and next steps.
  </p>
<div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
  <button
    type="button"
    onClick={() => {
      const summary = teacherActionLog
        .slice(0, 20)
        .map((entry) => `${entry.date} — ${entry.student}: ${entry.type}${entry.detail ? ` — ${entry.detail}` : ""}`)
        .join("\n");

      navigator.clipboard.writeText(summary || "No teacher actions recorded yet.");
      alert("Daily teacher summary copied.");
    }}
    style={styles.gridActionButton}
    disabled={teacherActionLog.length === 0}
  >
   Copy Summary
</button>

<button
  type="button"
  onClick={() => {
    navigator.clipboard.writeText(groupSummaryText.trim());
    alert("Group summary copied.");
  }}
  style={styles.gridActionButton}
>
  Copy Groups
</button>
<button
  type="button"
  onClick={() => {
    navigator.clipboard.writeText(classReportSummaryText.trim());
    alert("All report comments copied.");
  }}
  style={styles.gridActionButton}
>
  Copy All Report Comments
</button>

<button
  type="button"
  onClick={exportClassReportsPdf}
  style={styles.gridActionButton}
>
  Export Class PDF
</button>

<button
  type="button"
  onClick={() => {
    if (window.confirm("Clear all teacher action history?")) {
      setTeacherActionLog([]);
    }
  }}
  style={styles.dangerMiniButton}
  disabled={teacherActionLog.length === 0}
>
  Clear Log
</button>
</div>
  {teacherActionLog.length === 0 ? (
    <p>No actions recorded yet.</p>
  ) : (
    <div
      style={{
        maxHeight: 260,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {[...teacherActionLog].reverse().slice(0, 20).map((entry) => {
  const actionColor =
    entry.type === "Assigned Practice"
      ? "#dcfce7"
      : entry.type === "Assigned Assessment"
      ? "#dbeafe"
      : entry.type === "Mini Lesson"
      ? "#f3e8ff"
      : entry.type === "Simplified Work"
      ? "#ffedd5"
      : "#ffffff";

  const actionBorder =
    entry.type === "Assigned Practice"
      ? "#86efac"
      : entry.type === "Assigned Assessment"
      ? "#93c5fd"
      : entry.type === "Mini Lesson"
      ? "#d8b4fe"
      : entry.type === "Simplified Work"
      ? "#fdba74"
      : "#e5e7eb";

  return (
        <button
  type="button"
  key={entry.id}
  onClick={() => {
    if (entry.student && entry.student !== "Class") {
      setCurrentStudent(entry.student);
    }
  }}
  style={{
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${actionBorder}`,
background: actionColor,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    textAlign: "left",
    cursor: entry.student && entry.student !== "Class" ? "pointer" : "default",
    fontFamily: "inherit",
  }}
>
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
  <div style={{ fontWeight: 800, fontSize: 13 }}>
    {entry.student} — (
  <span
    style={{
      color: entry.type === "Needs Support" ? "#b91c1c" : "#334155",
      fontWeight: entry.type === "Needs Support" ? 900 : 700,
    }}
  >
    {entry.type}
  </span>
)
  </div>

  {entry.student && entry.student !== "Class" && (
    <div style={{ fontSize: 11, fontWeight: 900, color: "#2563eb" }}>
      Select
    </div>
  )}
</div>

  {entry.detail && (
    <div style={{ fontSize: 12, color: "#374151" }}>
      {entry.detail}
    </div>
  )}

          <div
  style={{ fontSize: 11, color: "#9ca3af" }}
  title={new Date(entry.date).toLocaleString()}
>
  {getTimeAgo(entry.date)}
</div>
        </button>
  );
})}
    </div>
  )}
</Card>
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

        <Card title="Teacher Small Groups + Reasons" className="screen-only">
          <p style={styles.sectionIntro}>Use this as your fast planning view. It groups students by what they most likely need next and explains why each student is there.</p>

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

        <Card title="Mistake Groups + Reteach Clues" className="screen-only">
          <p style={styles.sectionIntro}>
            This groups students by the kind of mistake they are making, so you can pull a smarter reteach group instead of only grouping by outcome.
          </p>

          {mistakeTypeGroups.length === 0 ? (
            <p style={styles.emptyText}>No mistake groups yet. They will appear after students complete questions and make repeated errors.</p>
          ) : (
            <div style={styles.groupGrid}>
              {mistakeTypeGroups.map((group) => (
                <div key={group.mistakeType} style={styles.analyticsCard}>
                  <div style={styles.analyticsTitle}>{group.mistakeType}</div>
                  <div style={styles.cellSubtext}>{group.total} recorded mistake{group.total === 1 ? "" : "s"}</div>
                  <div style={{ ...styles.recommendationBox, marginTop: 10 }}>
                    <strong>Teacher move:</strong> {group.teacherMove}
                  </div>

                  <div style={styles.indicatorList}>
                    {group.students.map((student) => (
                      <div key={`${group.mistakeType}-${student.student}`} style={styles.indicatorRow}>
                        <div>
                          <strong>{student.student}</strong>
                          <div style={styles.cellSubtext}>
                            {student.count} time{student.count === 1 ? "" : "s"}
                            {student.outcomes.length > 0 ? ` · ${student.outcomes.join(", ")}` : ""}
                          </div>
                          {student.indicators.length > 0 && (
                            <div style={styles.cellSubtext}>Focus: {student.indicators.slice(0, 2).join(", ")}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onAssignWeakestPractice(student.student)}
                          style={styles.gridActionButton}
                        >
                          Assign Practice
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
        {/* ===== REPORT CARD PANEL ===== */}
<style>
  {`
    @media print {
      body * {
        visibility: hidden;
      }

      .print-report-card,
      .print-report-card * {
        visibility: visible;
      }

      .print-report-card {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
        background: white;
      }

      .print-report-card button {
        display: none !important;
      }
    }
  `}
</style>
<Card title="Report Card Summary" className="print-report-card">
  <div style={{ marginBottom: 10 }}>
  <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
    Student Report
  </div>

  <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
    {currentStudent ? `Student: ${currentStudent}` : "No student selected"}
  </div>

  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
    {new Date().toLocaleDateString()}
  </div>
</div>
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    
    <div style={{ fontWeight: 800, color: "#334155" }}>
      {currentStudent || "No student selected"}
    </div>

      {/* Generated Comment */}
<div

  style={{
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#475569",
  }}
>
  {currentStudent
    ? buildStudentReportSummary(
        currentStudent,
        indicatorStats,
        assessmentStats,
        teacherActionLog
      )
    : "Select a student to generate a report summary."}
</div>

{/* Suggested Next Skill */}
<div
  style={{
    background: "#ecfeff",
    border: "1px solid #67e8f9",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#0f172a",
    fontWeight: 800,
    marginTop: 10,
  }}
>
  <div style={{ fontSize: 11, color: "#0891b2", marginBottom: 4 }}>
    Suggested Next Skill
  </div>

  {currentStudent && weakestSkill
    ? getSuggestedNextSkill(
        weakestSkill.indicator || "",
        weakestSkill.status || "Developing"
      )
    : "Select a student with recorded indicator data to see next-step guidance."}

  {currentStudent && weakestSkill ? (
    <div
      style={{
        marginTop: 6,
        fontSize: 11,
        color: "#475569",
        fontWeight: 700,
      }}
    >
      Based on: {weakestSkill.indicator} · {weakestSkill.accuracy}% accuracy ·{" "}
      {weakestSkill.attempts} attempt{weakestSkill.attempts === 1 ? "" : "s"}
    </div>
  ) : null}
</div>

{/* Suggested Practice Bundle */}
<div
  style={{
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  }}
>
  <div style={{ fontSize: 11, fontWeight: 900, color: "#475569" }}>
    Suggested Practice Bundle
  </div>

  {smartBundle?.length === 0 ? (
    <div style={{ fontSize: 12, marginTop: 6 }}>
      No bundle available yet.
    </div>
  ) : (
    smartBundle?.map((item, i) => (
      <div
        key={i}
        style={{
          fontSize: 12,
          marginTop: 6,
          fontWeight: 700,
          color: "#334155",
        }}
      >
        {item.type.toUpperCase()}: {item.indicator}
      </div>
    ))
  )}
    {smartBundleQuestions?.length > 0 ? (
    <div
      style={{
        marginTop: 10,
        paddingTop: 10,
        borderTop: "1px solid #e2e8f0",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, color: "#475569" }}>
        Question Preview
      </div>

      {smartBundleQuestions.slice(0, 5).map((question, index) => (
        <div
          key={question.id || index}
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#334155",
            fontWeight: 700,
          }}
        >
          {index + 1}. {question.practiceRole || "Practice"} — {question.prompt}
        </div>
      ))}
    </div>
  ) : null}

<button
  type="button"
  onClick={() => {
  if (!currentStudent || smartBundleQuestions?.length === 0) return;

  assignLivePractice(currentStudent, "NO4", {
  advanceGroup: false,
  customQuestions: smartBundleQuestions,
  customBundle: smartBundle,
});

  logTeacherAction({
    student: currentStudent,
    type: "Assigned Practice",
    detail: `Assigned suggested fraction smart bundle (${smartBundleQuestions.length} questions): ${smartBundle
  .map((item) => `${item.type}: ${item.indicator}`)
  .join(", ")}.`,
  });

  console.log("Assigned suggested bundle preview:", smartBundleQuestions);
}}
  style={{
    marginTop: 10,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #0ea5e9",
    background: "#e0f2fe",
    color: "#0369a1",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  }}
>
  Assign Suggested Bundle
</button>

</div>

{/* Editable Comment */}
<textarea
  value={editableReportComment}
  onChange={(e) => {
  const value = e.target.value;

  if (!currentStudent) return;

  setEditedReportComments((prev) => ({
    ...prev,
    [currentStudent]: value,
  }));
}}
  style={{
    marginTop: 12,
    width: "100%",
    minHeight: 140,
    borderRadius: 12,
    border: "2px solid #cbd5e1",
    padding: 12,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#1e293b",
    resize: "vertical",
    fontFamily: "inherit",
  }}
/>

    <button
  type="button"
  onClick={() => {
    if (!currentStudent) return;
    const text = editableReportComment;
    navigator.clipboard.writeText(text);
    alert("Report comment copied.");
  }}
  style={styles.gridActionButton}
>
           Copy Report Comment
    </button>

    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(classReportSummaryText.trim());
        alert("All report comments copied.");
      }}
      style={styles.gridActionButton}
    >
      Copy All Report Comments
    </button>

    <button
      type="button"
      onClick={exportClassReportsPdf}
      style={styles.gridActionButton}
    >
      Export Class PDF
    </button>

    <button
      type="button"
      onClick={() => {
        window.print();
      }}
      style={styles.gridActionButton}
    >
      Export / Print PDF
    </button>

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

        <Card id="teacher-section-live-alerts" title="Live Alerts" className="screen-only">
          {classAlerts.length === 0 ? <p>No alerts yet.</p> : classAlerts.map((alert, index) => (
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
