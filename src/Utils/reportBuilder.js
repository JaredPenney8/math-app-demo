import { INDICATOR_CATALOG, OUTCOME_TITLES } from "../data/curriculumData";

const OUTCOMES = Object.keys(INDICATOR_CATALOG);

function getIndicatorSummaryForStudent(indicatorStats, student, outcome) {
  const indicators = INDICATOR_CATALOG[outcome] || [];

  const items = indicators.map((indicator) => {
    const key = `${student}-${indicator}`;
    const data = indicatorStats?.[key] || {};
    const attempts = data.attempts ?? 0;
    const correct = data.correct ?? 0;
    const accuracy =
      attempts > 0 ? Math.round((correct / attempts) * 100) : data.accuracy ?? 0;

    const mastered = attempts >= 3 && accuracy >= 80;

    return {
      indicator,
      attempts,
      correct,
      accuracy,
      status:
        mastered
          ? "Mastered"
          : attempts === 0
          ? "Not Started"
          : accuracy >= 60
          ? "Developing"
          : "Needs Support",
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
    status:
      readyForAssessment
        ? "Ready for Assessment"
        : masteredCount > 0
        ? "Developing"
        : items.some((item) => item.attempts > 0)
        ? "Needs Support"
        : "Not Started",
    progressLabel: `${masteredCount}/${requiredCount}`,
  };
}

function getAssessmentSummary(assessmentStats, student, outcome) {
  const data = assessmentStats?.[`${student}-${outcome}`];

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
    label: passed ? `Passed ${assessment.lastScore}%` : `${indicator.progressLabel} indicators`,
  };
}
const GRADE_2_PROGRESSIONS = {
  number: {
    core: [
      "counting, representing, and comparing numbers",
      "using strategies to solve addition and subtraction problems",
      "explaining number choices with pictures, objects, and words",
    ],
    secure:
      "applying number strategies with growing independence and explaining thinking clearly",
    extended:
      "extending number thinking through larger numbers, flexible strategies, and multi-step problems",
  },

  fractions: {
    core: [
      "identifying equal and unequal parts",
      "naming and representing halves, thirds, and fourths",
      "using visual models to explain equal shares",
    ],
    secure:
      "representing simple fractions accurately and explaining how equal parts make a whole",
    extended:
      "extending fraction understanding by comparing fractions and connecting them to number lines and real-world sharing",
  },

  geometry: {
    core: [
      "identifying and describing 2-D shapes and 3-D objects",
      "sorting shapes by attributes",
      "explaining position, movement, and spatial relationships",
    ],
    secure:
      "describing shapes and spatial relationships using clear math language",
    extended:
      "extending geometry thinking by comparing attributes, building composite shapes, and explaining transformations",
  },

  measurement: {
    core: [
      "comparing length, height, mass, and capacity",
      "using non-standard and standard units to measure",
      "explaining measurement choices and comparisons",
    ],
    secure:
      "measuring and comparing accurately while explaining the unit used",
    extended:
      "extending measurement thinking through estimation, problem solving, and multi-step comparisons",
  },

  patterns: {
    core: [
      "identifying repeating and growing patterns",
      "extending patterns using numbers, pictures, and objects",
      "explaining the pattern rule",
    ],
    secure:
      "extending and explaining patterns using clear rules",
    extended:
      "extending pattern thinking by creating rules and connecting patterns to number relationships",
  },

  data: {
    core: [
      "collecting and organizing information",
      "reading simple graphs and tables",
      "explaining what the data shows",
    ],
    secure:
      "interpreting data and explaining conclusions using evidence",
    extended:
      "extending data thinking by comparing sets of data and explaining trends",
  },
};

export function getProgressionArea(outcomeTitle) {
  const title = String(outcomeTitle || "").toLowerCase();

  if (title.includes("fraction")) return "fractions";
  if (title.includes("number")) return "number";
  if (title.includes("geometry") || title.includes("shape")) return "geometry";
  if (title.includes("measurement")) return "measurement";
  if (title.includes("pattern")) return "patterns";
  if (title.includes("data") || title.includes("probability")) return "data";

  return "number";
}
export function buildSmartAssignmentBundle({
  weakestSkill,
  allIndicators = [],
}) {
  if (!weakestSkill) return [];

  const focus = weakestSkill;

  const supporting = allIndicators
    .slice()
    .filter((item) => item.indicator !== focus.indicator)
    .filter((item) => (item.accuracy ?? 0) >= (focus.accuracy ?? 0))
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0];

  const review = allIndicators
    .slice()
    .filter((item) => (item.accuracy ?? 0) >= 80)
    .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0];

  return [
    {
      type: "focus",
      indicator: focus.indicator,
    },
    supporting && {
      type: "support",
      indicator: supporting.indicator,
    },
    review && {
      type: "review",
      indicator: review.indicator,
    },
  ].filter(Boolean);
}

export function getSuggestedNextSkill(outcomeTitle, status = "Developing") {
  const progressionArea = getProgressionArea(outcomeTitle);
  const progression = GRADE_2_PROGRESSIONS[progressionArea];

  if (!progression) {
    return "continued opportunities to practise, explain thinking, and demonstrate learning";
  }

  if (status === "Mastered" || status === "Ready for Assessment") {
    return progression.extended;
  }

  if (status === "Needs Support" || status === "Needs Reassessment") {
    return progression.core[0];
  }

  return progression.core[1] || progression.secure;
}
function formatList(items, maxItems = 3) {
  const uniqueItems = [...new Set(items.filter(Boolean))].slice(0, maxItems);

  if (uniqueItems.length === 0) return "";
  if (uniqueItems.length === 1) return uniqueItems[0];
  if (uniqueItems.length === 2) return `${uniqueItems[0]} and ${uniqueItems[1]}`;

  return `${uniqueItems.slice(0, -1).join(", ")}, and ${
    uniqueItems[uniqueItems.length - 1]
  }`;
}

export function buildStudentReportSummary(
  student,
  indicatorStats,
  assessmentStats,
  teacherActionLog = []
) {
  if (!student) return "No student selected.";

  function getOutcomeTone(outcomeTitle) {
    const title = String(outcomeTitle || "").toLowerCase();

    if (title.includes("number")) {
      return {
        strength: "number sense, strategies, and problem solving",
        support: "number sense, basic facts, and explaining strategies",
      };
    }

    if (title.includes("geometry") || title.includes("shape")) {
      return {
        strength: "shape, space, and visual reasoning",
        support: "describing shapes, positions, and spatial relationships",
      };
    }

    if (title.includes("measurement")) {
      return {
        strength: "measurement concepts and comparisons",
        support: "measuring, comparing, and explaining measurements",
      };
    }

    if (title.includes("pattern")) {
      return {
        strength: "patterns and relationships",
        support: "identifying, extending, and explaining patterns",
      };
    }

    if (title.includes("data") || title.includes("probability")) {
      return {
        strength: "collecting, organizing, and interpreting information",
        support: "reading data and explaining what information shows",
      };
    }

    return {
      strength: outcomeTitle,
      support: outcomeTitle,
    };
  }

  const strengths = [];
  const needs = [];
  const nextSteps = [];
  const evidence = [];

  let passedCount = 0;
  let readyCount = 0;
  let needsCount = 0;
  let developingCount = 0;
  let evidenceCount = 0;

  OUTCOMES.forEach((outcome) => {
    const display = getOutcomeDisplay(
      indicatorStats,
      assessmentStats,
      student,
      outcome
    );

       const outcomeTitle = OUTCOME_TITLES[outcome] || outcome;
    const tone = getOutcomeTone(outcomeTitle);
    const progressionArea = getProgressionArea(outcomeTitle);
    const progression = GRADE_2_PROGRESSIONS[progressionArea];

    if (display?.assessment?.status === "Passed") {
      passedCount += 1;
      evidenceCount += 1;
      strengths.push(tone.strength);
      return;
    }

    if (display?.assessment?.status === "Needs Reassessment") {
      needsCount += 1;
      evidenceCount += 1;
      needs.push(tone.support);
      nextSteps.push(progression.core[0]);
      return;
    }

    if (display?.readyForAssessment) {
      readyCount += 1;
      evidenceCount += 1;
      strengths.push(tone.strength);
      evidence.push(`${outcomeTitle} readiness`);
      nextSteps.push(progression.secure);
      return;
    }

    if (display?.status === "Needs Support") {
      needsCount += 1;
      evidenceCount += 1;
      needs.push(tone.support);
      nextSteps.push(progression.core[1]);
      return;
    }

    if (display?.status === "Developing") {
      developingCount += 1;
      evidenceCount += 1;
      nextSteps.push(progression.core[2]);
    }
  });

  const studentActions = teacherActionLog.filter(
    (entry) => entry.student === student
  );

  const studentActionCount = studentActions.length;
  const actionTypes = [...new Set(studentActions.map((entry) => entry.type))];

  if (actionTypes.includes("Assigned Practice")) {
    evidence.push("practice tasks");
  }

  if (
    actionTypes.includes("Assigned Assessment") ||
    actionTypes.includes("Marked Passed")
  ) {
    evidence.push("assessment tasks");
  }

  if (actionTypes.includes("Mini Lesson")) {
    evidence.push("small group instruction");
    needs.push("teacher support");
  }

  if (actionTypes.includes("Needs Support")) {
    needs.push("teacher support");
  }

  if (actionTypes.includes("Simplified Work")) {
    evidence.push("adapted supports");
    needs.push("adapted supports");
  }

  const studentIndicatorEntries = Object.entries(indicatorStats || {}).filter(
    ([key, data]) =>
      key.startsWith(`${student}-`) &&
      data &&
      (data.attempts ?? 0) > 0
  );

  const totalAttempts = studentIndicatorEntries.reduce(
    (sum, [, data]) => sum + (data.attempts ?? 0),
    0
  );

  const totalCorrect = studentIndicatorEntries.reduce(
    (sum, [, data]) => sum + (data.correct ?? 0),
    0
  );

  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  const strongestIndicator = studentIndicatorEntries
    .map(([key, data]) => ({
      indicator: key.replace(`${student}-`, ""),
      accuracy:
        data.accuracy ??
        ((data.attempts ?? 0) > 0
          ? Math.round(((data.correct ?? 0) / (data.attempts ?? 1)) * 100)
          : 0),
      attempts: data.attempts ?? 0,
    }))
    .filter((item) => item.attempts >= 2)
    .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts)[0];

  if (evidenceCount === 0 && studentActionCount === 0) {
    return `${student} is beginning to demonstrate understanding through short practice tasks. Continued opportunities to build number sense, visual reasoning, and problem-solving skills will support progress across outcomes.`;
  }

   let overallSentence = `${student} is developing understanding of grade-level math outcomes through practice and teacher support.`;

  if (passedCount >= 2 || readyCount >= 2) {
    overallSentence = `${student} demonstrates secure progress toward grade-level math outcomes and is applying skills with growing independence.`;
  } else if (passedCount > 0 || readyCount > 0) {
    overallSentence = `${student} demonstrates progress toward grade-level math outcomes and is showing growing confidence as a mathematician.`;
  }

  if (needsCount > developingCount && needsCount > 0) {
    overallSentence = `${student} is beginning to develop understanding of grade-level math outcomes and benefits from guided practice, modelling, and teacher support.`;
  }

  const strengthSentence =
    strengths.length > 0
      ? `${student} demonstrates strength in ${formatList(strengths)}.`
      : strongestIndicator
      ? `${student} shows strength with ${strongestIndicator.indicator}.`
      : "";

  const evidenceSentence =
    studentActionCount > 0
      ? `This is based on ${studentActionCount} recorded learning interaction${
          studentActionCount === 1 ? "" : "s"
        }${evidence.length > 0 ? `, including ${formatList(evidence)}` : ""}.`
      : overallAccuracy !== null && totalAttempts >= 3
      ? `Recent work shows ${overallAccuracy}% accuracy across ${totalAttempts} attempt${
          totalAttempts === 1 ? "" : "s"
        }.`
      : "";

  let progressSentence = "";

  if (overallAccuracy !== null && totalAttempts >= 3) {
    if (overallAccuracy >= 75) {
      progressSentence = "Accuracy is improving with continued practice.";
    } else if (overallAccuracy >= 50) {
      progressSentence = "Accuracy is becoming more consistent with support.";
    } else {
      progressSentence = "Accuracy is developing and requires continued support.";
    }
  }

  const needsSentence =
    needs.length > 0
      ? `Continued support is recommended with ${formatList(needs)}.`
      : "";

    const nextSentence =
    nextSteps.length > 0
      ? `Next steps include ${formatList(nextSteps)}, with a focus on explaining thinking and using strategies independently.`
      : "Next steps include continued opportunities to practise, explain thinking, and demonstrate learning.";

  const fullComment = [
    overallSentence,
    strengthSentence,
    evidenceSentence,
    progressSentence,
    needsSentence,
    nextSentence,
  ]
    .filter(Boolean)
    .join(" ");

  return fullComment.length > 650
    ? [overallSentence, strengthSentence, needsSentence, nextSentence]
        .filter(Boolean)
        .join(" ")
    : fullComment;
}
export function buildClassReportSummaryText(
  students,
  indicatorStats,
  assessmentStats,
  teacherActionLog = []
) {
  if (!students || students.length === 0) {
    return "No students available.";
  }

  return students
    .map((student) => {
      const comment = buildStudentReportSummary(
        student,
        indicatorStats,
        assessmentStats,
        teacherActionLog
      );

      return `${student}\n${comment}`;
    })
    .join("\n\n");
}
export function exportClassReportsPdf({
  students = [],
  selectedClass = "",
  indicatorStats = {},
  assessmentStats = {},
  teacherActionLog = [],
  editedReportComments = {},
}) {
  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const reportCards = students
    .map((student) => {
      const comment =
        editedReportComments[student] ??
        buildStudentReportSummary(
          student,
          indicatorStats,
          assessmentStats,
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
        <title>Class Math Report Drafts</title>
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