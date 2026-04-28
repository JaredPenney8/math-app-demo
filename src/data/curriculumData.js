export const STUDENTS = ["Ava P.", "Ben T.", "Cara L.", "Deion M.", "Harris R.", "Nathan M."];

const CLASS_ROSTERS = {
  "901": ["Ava P.", "Ben T.", "Cara L."],
  "902": ["Deion M.", "Harris R.", "Nathan M."],
};


export function getClassStudentsFromRoster(rosterState, className) {
  const rosterClass = rosterState?.classes?.[className];
  if (!rosterClass) return CLASS_ROSTERS[className] || STUDENTS;

  if (Array.isArray(rosterClass)) {
    return rosterClass.filter(Boolean);
  }

  return (rosterClass.students || [])
    .filter((student) => !student.archived)
    .map((student) => student.name)
    .filter(Boolean);
}

export function getAllStudentsFromRoster(rosterState) {
  const classValues = Object.values(rosterState?.classes || {});
  const names = classValues.flatMap((classItem) => {
    if (Array.isArray(classItem)) return classItem.filter(Boolean);

    return (classItem.students || [])
      .filter((student) => !student.archived)
      .map((student) => student.name);
  });

  return Array.from(new Set(names.length ? names : STUDENTS));
}

export function makeDefaultAdaptationRow(gradeOverride = "G2") {
  return {
    readAloud: false,
    workedExamples: false,
    formulaSheet: false,
    simplifiedNumbers: false,
    lowerGradeWork: false,
    gradeOverride,
  };
}

export const GRADE_OPTIONS = [
  { id: "G2", label: "Grade 2", status: "Loaded" },
  { id: "G3", label: "Grade 3", status: "Scaffold" },
  { id: "G4", label: "Grade 4", status: "Scaffold" },
  { id: "G5", label: "Grade 5", status: "Scaffold" },
  { id: "G6", label: "Grade 6", status: "Scaffold" },
  { id: "G7", label: "Grade 7", status: "Scaffold" },
  { id: "G8", label: "Grade 8", status: "Scaffold" },
  { id: "G9", label: "Grade 9", status: "Scaffold" },
];

export const DEFAULT_STUDENT_GRADE_LEVELS = STUDENTS.reduce((acc, student) => {
  acc[student] = "G2";
  return acc;
}, {});

export const ADAPTATION_OPTIONS = [
  { key: "readAloud", label: "Read aloud" },
  { key: "workedExamples", label: "Examples" },
  { key: "formulaSheet", label: "Formula sheet" },
  { key: "simplifiedNumbers", label: "Simplified numbers" },
  { key: "lowerGradeWork", label: "Lower grade work" },
];


export const INDICATOR_CATALOG = {
  NO4: ["NO4.01", "NO4.02", "NO4.03"],
  NO7: ["NO7.01", "NO7.02", "NO7.03"],
  N01: ["N01.01", "N01.02", "N01.03", "N01.04", "N01.05", "N01.06"],
  N02: ["N02.01", "N02.02"],
  N04: ["N04.01", "N04.02", "N04.03", "N04.04", "N04.05", "N04.06", "N04.07", "N04.08", "N04.09"],
  N05: ["N05.01", "N05.02", "N05.03", "N05.04"],
  N06: ["N06.01", "N06.02", "N06.03"],
  N07: ["N07.01", "N07.02", "N07.03", "N07.04", "N07.05", "N07.06", "N07.07"],
  N08: ["N08.01", "N08.02"],
  N09: ["N09.01", "N09.02", "N09.03", "N09.04", "N09.05", "N09.06", "N09.07"],
  N10: ["N10.01", "N10.02", "N10.03", "N10.04", "N10.05"],
  PR01: ["PR01.01", "PR01.02", "PR01.03", "PR01.04", "PR01.05", "PR01.06"],
  PR02: ["PR02.01", "PR02.02", "PR02.03", "PR02.04", "PR02.05", "PR02.06", "PR02.07", "PR02.08", "PR02.09"],
  PR03: ["PR03.01", "PR03.02"],
  PR04: ["PR04.01", "PR04.02", "PR04.03"],
  M01: ["M01.01", "M01.02", "M01.03", "M01.04"],
  M02: ["M02.01", "M02.02", "M02.03", "M02.04", "M02.05"],
  M03: ["M03.01", "M03.02"],
  M04: ["M04.01", "M04.02", "M04.03"],
  G01: ["G01.01", "G01.02", "G01.03", "G01.04"],
  G02: ["G02.01", "G02.02", "G02.03", "G02.04", "G02.05", "G02.06"],
  G03: ["G03.01", "G03.02", "G03.03", "G03.04", "G03.05", "G03.06", "G03.07"],
  G04: ["G04.01", "G04.02"],
  SP01: ["SP01.01", "SP01.02", "SP01.03"],
  SP02: ["SP02.01", "SP02.02", "SP02.03", "SP02.04", "SP02.05", "SP02.06"],
};

export const OUTCOME_TITLES = {
  NO4: "Fractions",
  NO7: "Decimals",
  N01: "Number sequence and skip counting",
  N02: "Even and odd numbers",
  N04: "Represent and partition numbers to 100",
  N05: "Compare and order numbers to 100",
  N06: "Estimate quantities to 100",
  N07: "Place value to 100",
  N08: "Adding or subtracting zero",
  N09: "Addition and subtraction to 100",
  N10: "Mental math facts to 18",
  PR01: "Repeating patterns",
  PR02: "Increasing patterns",
  PR03: "Equality and inequality with models",
  PR04: "Equal and not equal symbols",
  M01: "Calendar and time relationships",
  M02: "Non-standard units for length and mass",
  M03: "Compare/order length, height, and mass",
  M04: "Measure length with non-standard units",
  G01: "Sort 2-D shapes and 3-D objects",
  G02: "3-D objects",
  G03: "2-D shapes",
  G04: "2-D faces of 3-D objects",
  SP01: "Gather and record data",
  SP02: "Concrete graphs and pictographs",
};

export const OUTCOME_TO_SKILL = {
  NO4: "fractions",
  NO7: "decimals",
  N01: "grade2",
  N02: "grade2",
  N04: "grade2",
  N05: "grade2",
  N06: "grade2",
  N07: "grade2",
  N08: "grade2",
  N09: "grade2",
  N10: "grade2",
  PR01: "grade2",
  PR02: "grade2",
  PR03: "grade2",
  PR04: "grade2",
  M01: "grade2",
  M02: "grade2",
  M03: "grade2",
  M04: "grade2",
  G01: "grade2",
  G02: "grade2",
  G03: "grade2",
  G04: "grade2",
  SP01: "grade2",
  SP02: "grade2",
};

export const GRADE2_CURRICULUM = {
  N01: { strand: "Number", outcome: "Students will say number sequences by 1s, 2s, 5s, and 10s.", indicators: { "N01.01": "Extend counting sequence by 1s, forward and backward.", "N01.02": "Extend skip counting by 2s, 5s, or 10s forward/backward.", "N01.03": "Skip count by 10s from any starting point.", "N01.04": "Identify/correct errors in a skip counting sequence.", "N01.05": "Count money with pennies, nickels, or dimes to 100¢.", "N01.06": "Count using groups of 2s, 5s, or 10s and counting on." } },
  N02: { strand: "Number", outcome: "Students will demonstrate whether a number up to 100 is even or odd.", indicators: { "N02.01": "Use models to decide if a number is even or odd.", "N02.02": "Identify even and odd numbers in a sequence or hundred chart." } },
  N04: { strand: "Number", outcome: "Students will represent and partition numbers to 100.", indicators: { "N04.01": "Represent a number using ten-frames or base-ten materials.", "N04.02": "Represent a number using coins.", "N04.03": "Represent a number using tallies.", "N04.04": "Represent a number pictorially.", "N04.05": "Find examples of a number in the environment.", "N04.06": "Represent a number using expressions.", "N04.07": "Read a number in symbolic or word form.", "N04.08": "Record numbers 0-20 in words.", "N04.09": "Record numbers 0-100 symbolically." } },
  N05: { strand: "Number", outcome: "Students will compare and order numbers up to 100.", indicators: { "N05.01": "Compare/order numbers using hundred chart, number line, ten-frames, or place value.", "N05.02": "Identify errors in an ordered sequence.", "N05.03": "Identify missing numbers in a hundred chart.", "N05.04": "Identify errors in a hundred chart." } },
  N06: { strand: "Number", outcome: "Students will estimate quantities to 100 using referents.", indicators: { "N06.01": "Estimate a quantity by comparing it to a known referent.", "N06.02": "Estimate groups of ten using 10 as a referent.", "N06.03": "Select between two estimates and explain the choice." } },
  N07: { strand: "Number", outcome: "Students will illustrate place value for numerals to 100.", indicators: { "N07.01": "Explain same digits in a 2-digit numeral using counters.", "N07.02": "Count objects using tens and ones and record the numeral.", "N07.03": "Describe a 2-digit numeral in at least two ways.", "N07.04": "Use ten-frames/diagrams to show tens and ones.", "N07.05": "Use base-ten materials to show tens and ones.", "N07.06": "Explain why digit value depends on placement.", "N07.07": "Represent one unit when shown a pre-grouped ten." } },
  N08: { strand: "Number", outcome: "Students will explain the effect of adding/subtracting zero.", indicators: { "N08.01": "Add zero and explain why the sum is unchanged.", "N08.02": "Subtract zero and explain why the difference is unchanged." } },
  N09: { strand: "Number", outcome: "Students will add/subtract to 100 using strategies, problems, and models.", indicators: { "N09.01": "Solve a story problem with materials/diagram and write a number sentence.", "N09.02": "Solve a story problem by writing an expression.", "N09.03": "Match a number sentence to a story problem.", "N09.04": "Create a number sentence and story problem for a solution.", "N09.05": "Model addition/subtraction and record symbolically.", "N09.06": "Add numbers in two ways and explain why the sum is the same.", "N09.07": "Recognize/create equivalent addition/subtraction sentences." } },
  N10: { strand: "Number", outcome: "Students will recall addition facts to 18 and related subtraction facts.", indicators: { "N10.01": "Explain a mental math strategy for addition facts.", "N10.02": "Use and describe a personal addition strategy.", "N10.03": "Quickly recall addition facts to 18.", "N10.04": "Explain think-addition for subtraction.", "N10.05": "Use and describe a personal subtraction strategy." } },
  PR01: { strand: "Patterns", outcome: "Students will describe, extend, compare, and create repeating patterns.", indicators: { "PR01.01": "Identify the core of a repeating pattern.", "PR01.02": "Describe and extend a double attribute pattern.", "PR01.03": "Create a repeating pattern and explain the rule.", "PR01.04": "Predict an element and extend to check.", "PR01.05": "Translate a repeating pattern from one mode to another.", "PR01.06": "Compare repeating patterns." } },
  PR02: { strand: "Patterns", outcome: "Students will describe, extend, and create increasing patterns.", indicators: { "PR02.01": "Identify and describe increasing patterns.", "PR02.02": "Represent an increasing pattern.", "PR02.03": "Identify errors in an increasing pattern.", "PR02.04": "Explain the pattern rule.", "PR02.05": "Create an increasing pattern and explain the rule.", "PR02.06": "Represent a pattern another way.", "PR02.07": "Solve a problem using increasing patterns.", "PR02.08": "Identify increasing patterns in the environment.", "PR02.09": "Determine missing terms and explain reasoning." } },
  PR03: { strand: "Patterns", outcome: "Students will explain equality/inequality using models.", indicators: { "PR03.01": "Determine equality using a balance scale.", "PR03.02": "Construct/draw unequal sets and explain why." } },
  PR04: { strand: "Patterns", outcome: "Students will record equalities and inequalities symbolically.", indicators: { "PR04.01": "Choose = or ≠ and justify.", "PR04.02": "Model equalities and record them.", "PR04.03": "Model inequalities and record them." } },
  M01: { strand: "Measurement", outcome: "Students will understand calendars and days, weeks, months, years.", indicators: { "M01.01": "Read a calendar.", "M01.02": "Name/order days and months.", "M01.03": "State days in a week and months in a year.", "M01.04": "Solve a problem about days/weeks/months." } },
  M02: { strand: "Measurement", outcome: "Students will relate unit size to number of units.", indicators: { "M02.01": "Explain unit choice for length.", "M02.02": "Explain unit choice for mass.", "M02.03": "Select a unit and explain why.", "M02.04": "Estimate number of units needed.", "M02.05": "Explain why measurement changes with unit size." } },
  M03: { strand: "Measurement", outcome: "Students will compare/order length, height, and mass.", indicators: { "M03.01": "Estimate, measure, and record using non-standard units.", "M03.02": "Compare/order measures and explain method." } },
  M04: { strand: "Measurement", outcome: "Students will measure length using multiple copies of a unit.", indicators: { "M04.01": "Explain why gaps/overlaps are inaccurate.", "M04.02": "Count units needed to measure length.", "M04.03": "Estimate and measure using non-standard units." } },
  G01: { strand: "Geometry", outcome: "Students will sort 2-D shapes and 3-D objects using two attributes.", indicators: { "G01.01": "Explain presorted sets.", "G01.02": "Identify common attributes.", "G01.03": "Sort 2-D shapes by two attributes.", "G01.04": "Sort 3-D objects by two attributes." } },
  G02: { strand: "Geometry", outcome: "Students will recognize, describe, compare, and build 3-D objects.", indicators: { "G02.01": "Sort 3-D objects.", "G02.02": "Identify attributes of 3-D objects.", "G02.03": "Describe 3-D objects with different dimensions.", "G02.04": "Describe 3-D objects in different positions.", "G02.05": "Create and describe a 3-D model.", "G02.06": "Find examples of 3-D objects." } },
  G03: { strand: "Geometry", outcome: "Students will recognize, describe, compare, and build 2-D shapes.", indicators: { "G03.01": "Sort 2-D shapes.", "G03.02": "Identify common attributes of 2-D shapes.", "G03.03": "Identify 2-D shapes with different dimensions.", "G03.04": "Identify 2-D shapes in different positions.", "G03.05": "Find examples of 2-D shapes.", "G03.06": "Create a model of a 2-D shape.", "G03.07": "Create a pictorial representation of a 2-D shape." } },
  G04: { strand: "Geometry", outcome: "Students will identify 2-D shapes as parts of 3-D objects.", indicators: { "G04.01": "Match 2-D shapes to faces of 3-D objects.", "G04.02": "Name the 2-D faces of a 3-D object." } },
  SP01: { strand: "Data", outcome: "Students will gather and record data about self and others.", indicators: { "SP01.01": "Formulate a data question.", "SP01.02": "Organize collected data.", "SP01.03": "Answer questions using collected data." } },
  SP02: { strand: "Data", outcome: "Students will construct and interpret concrete graphs and pictographs.", indicators: { "SP02.01": "Compare concrete graphs.", "SP02.02": "Compare pictographs.", "SP02.03": "Answer questions about graphs.", "SP02.04": "Create a concrete graph and draw conclusions.", "SP02.05": "Create a pictograph with one-to-one correspondence.", "SP02.06": "Solve a problem using graphs." } },
};
export function buildDefaultRosterState() {
  return {
    classes: Object.fromEntries(
      Object.entries(CLASS_ROSTERS).map(([className, names]) => [
        className,
        {
          students: names.map((name) => ({ name, archived: false })),
        },
      ])
    ),
    archivedStudents: [],
  };
}

export function buildDefaultAdaptations(students = STUDENTS) {
  return students.reduce((acc, student) => {
    acc[student] = makeDefaultAdaptationRow("G2");
    return acc;
  }, {});
}