import React from "react";

const ADAPTATION_COLUMNS = [
  { key: "readAloud", label: "Read Aloud" },
  { key: "examples", label: "Examples" },
  { key: "formulaSheet", label: "Formula Sheet" },
  { key: "simplifiedNumbers", label: "Simplified Numbers" },
  { key: "lowerGradeWork", label: "Lower Grade Work" },
];

const GRADE_OPTIONS = ["", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"];

function getStudentsForClass(rosterState, selectedClass) {
  if (!rosterState || !selectedClass) return [];

  const classData =
    rosterState.classes?.[selectedClass] ||
    rosterState[selectedClass] ||
    rosterState.classrooms?.[selectedClass];

  if (Array.isArray(classData)) return classData;

  if (Array.isArray(classData?.students)) return classData.students;

  return [];
}

export default function AdaptationsGrid({
  rosterState,
  selectedClass,
  setSelectedClass,
  studentAdaptations,
  setStudentAdaptations,
}) {
  const classNames = Object.keys(
    rosterState?.classes || rosterState?.classrooms || rosterState || {}
  );

  const students = getStudentsForClass(rosterState, selectedClass);

  function updateToggle(studentName, key) {
    setStudentAdaptations((prev) => ({
      ...prev,
      [studentName]: {
        readAloud: false,
        examples: false,
        formulaSheet: false,
        simplifiedNumbers: false,
        lowerGradeWork: false,
        gradeOverride: "",
        ...(prev?.[studentName] || {}),
        [key]: !prev?.[studentName]?.[key],
      },
    }));
  }

  function updateGradeOverride(studentName, value) {
    setStudentAdaptations((prev) => ({
      ...prev,
      [studentName]: {
        readAloud: false,
        examples: false,
        formulaSheet: false,
        simplifiedNumbers: false,
        lowerGradeWork: false,
        gradeOverride: "",
        ...(prev?.[studentName] || {}),
        gradeOverride: value,
      },
    }));
  }

  function applyColumnToAll(key, value) {
    setStudentAdaptations((prev) => {
      const next = { ...prev };

      students.forEach((student) => {
        const name = typeof student === "string" ? student : student.name;

        if (!name) return;

        next[name] = {
          readAloud: false,
          examples: false,
          formulaSheet: false,
          simplifiedNumbers: false,
          lowerGradeWork: false,
          gradeOverride: "",
          ...(next[name] || {}),
          [key]: value,
        };
      });

      return next;
    });
  }

  return (
    <section style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Adaptations Grid</h2>
          <p style={styles.subtitle}>
            Select a class, then toggle supports for each student.
          </p>
        </div>

        <select
          value={selectedClass || ""}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={styles.select}
        >
          <option value="">Select class</option>
          {classNames.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      {!selectedClass ? (
        <div style={styles.emptyBox}>Choose a class to view adaptations.</div>
      ) : students.length === 0 ? (
        <div style={styles.emptyBox}>No students found for this class.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.stickyStudent }}>Student</th>

                {ADAPTATION_COLUMNS.map((col) => (
                  <th key={col.key} style={styles.th}>
                    <div style={styles.columnHeader}>
                      <span>{col.label}</span>

                      <div style={styles.applyButtons}>
                        <button
                          type="button"
                          style={styles.applyBtn}
                          onClick={() => applyColumnToAll(col.key, true)}
                        >
                          All On
                        </button>

                        <button
                          type="button"
                          style={styles.applyBtn}
                          onClick={() => applyColumnToAll(col.key, false)}
                        >
                          All Off
                        </button>
                      </div>
                    </div>
                  </th>
                ))}

                <th style={styles.th}>Grade Override</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const studentName =
                  typeof student === "string" ? student : student.name;

                const adaptations = studentAdaptations?.[studentName] || {};

                return (
                  <tr key={studentName}>
                    <td style={{ ...styles.td, ...styles.studentCell }}>
                      {studentName}
                    </td>

                    {ADAPTATION_COLUMNS.map((col) => {
                      const isOn = Boolean(adaptations[col.key]);

                      return (
                        <td key={col.key} style={styles.td}>
                          <button
                            type="button"
                            onClick={() => updateToggle(studentName, col.key)}
                            style={{
                              ...styles.toggle,
                              ...(isOn ? styles.toggleOn : styles.toggleOff),
                            }}
                          >
                            {isOn ? "ON" : "OFF"}
                          </button>
                        </td>
                      );
                    })}

                    <td style={styles.td}>
                      <select
                        value={adaptations.gradeOverride || ""}
                        onChange={(e) =>
                          updateGradeOverride(studentName, e.target.value)
                        }
                        style={styles.gradeSelect}
                      >
                        {GRADE_OPTIONS.map((grade) => (
                          <option key={grade || "none"} value={grade}>
                            {grade || "None"}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },
  select: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 15,
    minWidth: 140,
  },
  emptyBox: {
    padding: 18,
    borderRadius: 12,
    background: "#f9fafb",
    color: "#4b5563",
    border: "1px dashed #d1d5db",
  },
  tableWrap: {
    overflowX: "auto",
    maxWidth: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 850,
  },
  th: {
    position: "sticky",
    top: 0,
    background: "#f3f4f6",
    padding: 10,
    textAlign: "center",
    borderBottom: "1px solid #d1d5db",
    fontSize: 13,
    zIndex: 2,
  },
  td: {
    padding: 10,
    textAlign: "center",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  stickyStudent: {
    left: 0,
    zIndex: 3,
    textAlign: "left",
  },
  studentCell: {
    position: "sticky",
    left: 0,
    zIndex: 1,
    background: "#ffffff",
    textAlign: "left",
    fontWeight: 700,
    minWidth: 160,
  },
  columnHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
  },
  applyButtons: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  applyBtn: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: 999,
    padding: "3px 7px",
    fontSize: 11,
    cursor: "pointer",
  },
  toggle: {
    border: "none",
    borderRadius: 999,
    padding: "7px 14px",
    fontWeight: 800,
    cursor: "pointer",
    minWidth: 64,
  },
  toggleOn: {
    background: "#dcfce7",
    color: "#166534",
  },
  toggleOff: {
    background: "#f3f4f6",
    color: "#374151",
  },
  gradeSelect: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
  },
};