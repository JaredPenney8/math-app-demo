import React, { useEffect, useMemo, useState } from "react";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import { loadClassStudents } from "./firebaseClient";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseClient";
import {
  firebaseEnabled,
  registerRealAccount,
  signInRealAccount,
  signOutRealAccount,
  loadUserProfile,
  saveUserProfile,
  loadCloudStudentProgress,
  saveCloudStudentProgress,
  loadClassStudentProgress,
  loadClassAccounts,
} from "./firebaseClient";
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
} from "./data/curriculumData";

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
    background: "radial-gradient(circle at top left, #dbeafe 0, transparent 34%), linear-gradient(135deg, #f8fbff 0%, #f8fafc 54%, #fff7ed 100%)",
    color: "#0f172a",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "clamp(12px, 2vw, 22px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    maxWidth: 1180,
    margin: "0 auto 18px",
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 26,
    padding: "clamp(14px, 2vw, 18px)",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
    position: "sticky",
    top: 10,
    zIndex: 20,
    backdropFilter: "blur(12px)",
  },
  title: { margin: 0, fontSize: 32, letterSpacing: -1.1, lineHeight: 1.05, fontWeight: 950 },
  subtitle: { margin: "5px 0 0", color: "#64748b", fontWeight: 700, fontSize: 13 },
  headerControls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  select: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe3ef",
    fontWeight: 850,
    background: "white",
    minHeight: 46,
  },
  button: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "white",
    fontWeight: 850,
    cursor: "pointer",
    minHeight: 46,
  },
  activeButton: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #1d4ed8",
    background: "#2563eb",
    color: "white",
    fontWeight: 950,
    cursor: "pointer",
    minHeight: 46,
    boxShadow: "0 10px 24px rgba(37,99,235,0.22)",
  },
  resetButton: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: 950,
    cursor: "pointer",
    minHeight: 46,
  },
  main: {
    maxWidth: 1180,
    margin: "0 auto",
    paddingBottom: 44,
    transition: "all 0.25s ease",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 26,
    padding: "clamp(18px, 2.4vw, 26px)",
    boxShadow: "0 18px 50px rgba(15,23,42,0.075)",
    marginBottom: 18,
  },
  cardTitle: {
    margin: "0 0 14px",
    fontSize: "clamp(20px, 2vw, 24px)",
    letterSpacing: -0.35,
    lineHeight: 1.15,
    fontWeight: 950,
  },
  studentHero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    background: "linear-gradient(135deg, #172554, #1d4ed8)",
    color: "white",
    borderRadius: 32,
    padding: "clamp(22px, 3vw, 30px)",
    marginBottom: 16,
    boxShadow: "0 22px 46px rgba(29,78,216,0.22)",
    flexWrap: "wrap",
  },
  eyebrow: { margin: 0, textTransform: "uppercase", fontSize: 12, letterSpacing: 1.4, color: "#bfdbfe", fontWeight: 900 },
  heroTitle: {
    margin: "4px 0",
    fontSize: "clamp(25px, 3vw, 34px)",
    letterSpacing: -0.8,
    lineHeight: 1.05,
  },
  heroText: { margin: 0, color: "#dbeafe", maxWidth: 620 },
  heroBadge: { background: "white", color: "#1e3a8a", borderRadius: 999, padding: "12px 16px", fontWeight: 900 },
  studentNavBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(124px, 1fr))",
    gap: 10,
    marginBottom: 14,
  },
  studentNavButton: {
    display: "grid",
    gap: 3,
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: 20,
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#334155",
    fontWeight: 900,
    cursor: "pointer",
    minHeight: 70,
  },
  studentNavButtonActive: {
    display: "grid",
    gap: 3,
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: 20,
    border: "1px solid #1d4ed8",
    background: "#dbeafe",
    color: "#1e3a8a",
    fontWeight: 950,
    cursor: "pointer",
    minHeight: 70,
    boxShadow: "0 10px 24px rgba(37,99,235,0.12)",
  },
  currentTaskCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 22,
    padding: "clamp(14px, 2vw, 18px)",
    marginBottom: 14,
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
    flexWrap: "wrap",
  },
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
  primary: {
    padding: "13px 18px",
    borderRadius: 16,
    border: "1px solid #1d4ed8",
    background: "#2563eb",
    color: "white",
    fontWeight: 950,
    cursor: "pointer",
    minHeight: 48,
    boxShadow: "0 12px 26px rgba(37,99,235,0.22)",
  },
  secondary: {
    padding: "13px 18px",
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    minHeight: 48,
  },
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
  gridActionButton: {
    padding: "10px 13px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 850,
    cursor: "pointer",
    minHeight: 42,
  },
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
  patternRowWrap: { display: "flex", gap: 10, flexWrap: "wrap" },
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

function buildPracticeQuestionSet(outcome, activeAllQuestions, fallbackSkill = "fractions", count = 5, adaptiveLevel = "normal", targetIndicator = null, reviewIndicators = []) {
  const safeIndicator = targetIndicator || `${outcome}.01`;
  const focusCount = Math.max(3, count - 2);
  const reviewCount = Math.max(0, count - focusCount);
  const cleanReviewIndicators = [...new Set(reviewIndicators.filter((indicator) => indicator && indicator !== safeIndicator))].slice(0, reviewCount);

  if (outcome === "NO4") {
    const focusQuestions = buildFractionTapBoxPracticeSet("NO4", safeIndicator, focusCount, adaptiveLevel).map((question) => ({
      ...question,
      practiceRole: "Focus",
    }));

    const reviewQuestions = cleanReviewIndicators.flatMap((indicator) =>
      buildFractionTapBoxPracticeSet("NO4", indicator, 1, "easy").map((question) => ({
        ...question,
        practiceRole: "Review",
        prompt: `Review: ${question.prompt}`,
      }))
    );

    return shuffleQuestions([...focusQuestions, ...reviewQuestions]).slice(0, count);
  }

  const outcomeQuestions = activeAllQuestions.filter((q) => q.outcome === outcome);
  const targetedQuestions = targetIndicator
    ? outcomeQuestions.filter((q) => q.indicator === targetIndicator)
    : outcomeQuestions;
  const reviewQuestions = cleanReviewIndicators.flatMap((indicator) =>
    outcomeQuestions.filter((q) => q.indicator === indicator).slice(0, 1).map((question) => ({
      ...question,
      practiceRole: "Review",
    }))
  );
  const focusQuestions = shuffleQuestions(targetedQuestions.length ? targetedQuestions : outcomeQuestions).slice(0, focusCount).map((question) => ({
    ...question,
    practiceRole: "Focus",
  }));
  const fallback = QUESTION_BANK[fallbackSkill] || activeAllQuestions.slice(0, count);

  return shuffleQuestions([...focusQuestions, ...reviewQuestions].length ? [...focusQuestions, ...reviewQuestions] : fallback).slice(0, count);
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
  const [lastMistakeType, setLastMistakeType] = useState("");
  const [hintLevel, setHintLevel] = useState(DEFAULT_STUDENT_STATE.hintLevel);
  const [mistakeCounts, setMistakeCounts] = useState(DEFAULT_STUDENT_STATE.mistakeCounts);
  const [mistakeTypeStats, setMistakeTypeStats] = useState(DEFAULT_STUDENT_STATE.mistakeTypeStats);
  const [alerts, setAlerts] = useState(DEFAULT_STUDENT_STATE.alerts);
  const [intervention, setIntervention] = useState(DEFAULT_STUDENT_STATE.intervention);
  const [correctStreak, setCorrectStreak] = useState(DEFAULT_STUDENT_STATE.correctStreak);
  const [adaptiveLevel, setAdaptiveLevel] = useState("normal");
  const [recentResults, setRecentResults] = useState([]);
  const [answerState, setAnswerState] = useState(null);
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
  const [focusedGroupStudents, setFocusedGroupStudents] = useState([]);
const [focusedGroupIndex, setFocusedGroupIndex] = useState(0);
  const [activeTeacherSection, setActiveTeacherSection] = useState("teacher-section-home");
  const [authUser, setAuthUser] = useState(() => getStoredLogin());
  const [cloudClassStudents, setCloudClassStudents] = useState([]);
  const [liveSyncStatus, setLiveSyncStatus] = useState({
  connected: false,
  lastUpdate: null,
  studentCount: 0,
  error: "",
});

  const allRosterStudents = getAllStudentsFromRoster(rosterState);
  const localVisibleStudents = getClassStudentsFromRoster(rosterState, selectedClass);
  const visibleStudents = authUser?.role === "teacher" && cloudClassStudents.length > 0
    ? cloudClassStudents
    : localVisibleStudents;
  const currentAdaptations = studentAdaptations[currentStudent] || buildDefaultAdaptations()[currentStudent] || {};
  const currentStudentGrade = studentGradeLevels[currentStudent] || selectedGrade;

  useEffect(() => {
    if (!authUser) return;
    if (authUser.classCode && selectedClass !== authUser.classCode) {
      setSelectedClass(authUser.classCode);
    }
    if (authUser.studentName && currentStudent !== authUser.studentName) {
      setCurrentStudent(authUser.studentName);
    }
    const preferredMode = authUser.role === "teacher" ? mode : "student";
    if (mode !== preferredMode) {
      setMode(preferredMode);
    }
  }, [authUser]);

  function applyStudentData(data) {
    setStudentScreen(data.studentScreen ?? "today");
    setSkill(data.skill ?? "fractions");
    setQuestionIndex(data.questionIndex ?? 0);
    setSelected(data.selected ?? "");
    setMultiStepAnswers(data.multiStepAnswers ?? {});
    setFeedback(data.feedback ?? "");
    setAnswerState(null);
    setHintLevel(data.hintLevel ?? 0);
    setMistakeCounts(data.mistakeCounts ?? {});
    setMistakeTypeStats(data.mistakeTypeStats ?? {});
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
      mistakeTypeStats,
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
    if (authUser?.role === "student" && authUser?.studentName) {
      if (currentStudent !== authUser.studentName) setCurrentStudent(authUser.studentName);
      return;
    }

    if (!visibleStudents.includes(currentStudent)) {
      setCurrentStudent(visibleStudents[0] || authUser?.studentName || "Student");
    }
  }, [selectedClass, visibleStudents, currentStudent, allRosterStudents, authUser?.role, authUser?.studentName]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudentData() {
      setHasLoadedSave(false);
      const localData = getSavedStudentData(currentStudent);
      let dataToUse = localData;

      if (authUser?.cloudEnabled && authUser?.uid && authUser?.studentName === currentStudent) {
        try {
          const cloudData = await loadCloudStudentProgress(authUser.uid, currentStudent);
          if (cloudData) dataToUse = { ...DEFAULT_STUDENT_STATE, ...cloudData };

          // Pull teacher actions from the class snapshot too.
          // Teacher actions are written to classes/{classCode}/students/{studentName},
          // while student progress is also saved under the student's own uid.
          const classProgress = await loadClassStudentProgress(authUser.classCode || selectedClass || "901");
          const classRow = classProgress?.[currentStudent];

          if (classRow) {
            dataToUse = {
              ...dataToUse,
              teacherAssignments: {
                ...(dataToUse.teacherAssignments || {}),
                ...(classRow.teacherAssignments || {}),
              },
              interventionLog: [
                ...(dataToUse.interventionLog || []),
                ...(classRow.interventionLog || []),
              ].filter((entry, index, array) => {
                const key = `${entry?.date || ""}-${entry?.type || ""}-${entry?.target || ""}-${entry?.action || ""}`;
                return array.findIndex((item) => `${item?.date || ""}-${item?.type || ""}-${item?.target || ""}-${item?.action || ""}` === key) === index;
              }),
              teacherAction: classRow.teacherAction || dataToUse.teacherAction,
              teacherActionHistory: [
                ...(dataToUse.teacherActionHistory || []),
                ...(classRow.teacherActionHistory || []),
              ].slice(-12),
            };
          }
        } catch (error) {
          console.warn("Cloud progress load failed; using local save.", error);
        }
      }

      if (!cancelled) {
        applyStudentData(dataToUse);
        setHasLoadedSave(true);
      }
    }

    loadStudentData();
    return () => {
      cancelled = true;
    };
  }, [currentStudent, authUser?.uid, authUser?.cloudEnabled, authUser?.studentName, authUser?.classCode, selectedClass]);

  useEffect(() => {
    if (!hasLoadedSave) return;
    const currentState = getCurrentStateForSave();
    localStorage.setItem(getSaveKey(currentStudent), JSON.stringify(currentState));
    if (authUser?.cloudEnabled && authUser?.uid && authUser?.studentName === currentStudent) {
      saveCloudStudentProgress(authUser.uid, currentStudent, currentState, authUser).catch((error) => {
        console.warn("Cloud progress save failed; local save still worked.", error);
      });
    }
    const snapshot = {};
    visibleStudents.forEach((student) => {
      snapshot[student] = student === currentStudent ? currentState : getSavedStudentData(student);
    });
    setClassSnapshot((old) => ({ ...old, ...snapshot }));
  }, [
    hasLoadedSave,
    currentStudent,
    authUser?.cloudEnabled,
    authUser?.uid,
    authUser?.studentName,
    studentScreen,
    skill,
    questionIndex,
    selected,
    multiStepAnswers,
    feedback,
    hintLevel,
    mistakeCounts,
    mistakeTypeStats,
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

  useEffect(() => {
  if (!authUser?.cloudEnabled || authUser?.role !== "teacher" || !selectedClass) {
    return;
  }

  const studentsRef = collection(db, "classes", selectedClass, "students");

  const unsubscribe = onSnapshot(
    studentsRef,
    (snapshot) => {
      const liveSnapshot = {};
      const studentNames = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const name = data?.studentName || docSnap.id;

        if (!name) return;

        liveSnapshot[name] = {
          ...DEFAULT_STUDENT_STATE,
          ...data,
        };

        studentNames.push(name);
      });

      setClassSnapshot((old) => ({
        ...old,
        ...liveSnapshot,
      }));

      const uniqueNames = Array.from(new Set(studentNames)).sort();

      setCloudClassStudents(uniqueNames);
      setLiveSyncStatus({
  connected: true,
  lastUpdate: new Date().toLocaleTimeString(),
  studentCount: uniqueNames.length,
  error: "",
});

      setRosterState((old) => {
        const existing = old?.classes?.[selectedClass]?.students || [];
        const existingNames = new Set(existing.map((student) => student.name));

        const newStudents = uniqueNames
          .filter((studentName) => !existingNames.has(studentName))
          .map((studentName) => ({ name: studentName, archived: false }));

        if (newStudents.length === 0) return old;

        return {
          ...old,
          classes: {
            ...old.classes,
            [selectedClass]: {
              ...(old.classes?.[selectedClass] || { name: selectedClass, students: [] }),
              students: [...existing, ...newStudents],
            },
          },
        };
      });
    },
   (error) => {
  console.warn("Live class listener failed; local data still works.", error);

  setLiveSyncStatus((old) => ({
    ...old,
    connected: false,
    error: error?.message || "Live sync error",
  }));
}
  );

  return () => unsubscribe();
}, [authUser?.cloudEnabled, authUser?.role, selectedClass]);

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
          issue: lastMistakeType ? `${q.mistakeIfWrong} (${lastMistakeType})` : q.mistakeIfWrong,
          mistakeType: lastMistakeType || "Unclassified",
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
  function getMistakeTypeForQuestion(questionToCheck, answerToCheck) {
    if (!questionToCheck || !answerToCheck) return "No answer selected yet";

    if (questionToCheck.tapBoxModel && typeof answerToCheck === "string" && answerToCheck.includes("/")) {
      const correctParts = String(questionToCheck.correct || "").split("/");
      const answerParts = String(answerToCheck || "").split("/");
      const correctNumerator = Number(correctParts[0]);
      const correctDenominator = Number(correctParts[1]);
      const selectedNumerator = Number(answerParts[0]);
      const selectedDenominator = Number(answerParts[1]);

      if (Number.isNaN(selectedNumerator) || Number.isNaN(selectedDenominator)) {
        return "Fraction format mistake";
      }

      if (selectedDenominator !== correctDenominator) {
        return "Denominator mismatch — the total number of equal parts changed";
      }

      if (selectedNumerator === correctDenominator) {
        return "Filled the whole model — denominator may have been read as the answer";
      }

      if (Math.abs(selectedNumerator - correctNumerator) === 1) {
        return "Off-by-one counting error";
      }

      if (selectedNumerator < correctNumerator) {
        return "Under-counted shaded parts";
      }

      if (selectedNumerator > correctNumerator) {
        return "Over-counted shaded parts";
      }

      return "Visual fraction mismatch";
    }

    if (questionToCheck.type === "multi-step") {
      return "Multi-step reasoning error — one step does not match yet";
    }

    return "Answer choice mismatch";
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

  function recordMistakeType(questionToRecord, mistakeType) {
    if (!questionToRecord || !mistakeType) return;

    const outcome = questionToRecord.outcome || "Unknown";
    const indicator = questionToRecord.indicator || `${outcome}.01`;
    const key = `${currentStudent}|${outcome}|${indicator}|${mistakeType}`;

    setMistakeTypeStats((prev) => {
      const current = prev[key] || {
        student: currentStudent,
        outcome,
        indicator,
        mistakeType,
        count: 0,
        lastSeen: null,
      };

      return {
        ...prev,
        [key]: {
          ...current,
          count: (current.count || 0) + 1,
          lastSeen: new Date().toLocaleString(),
        },
      };
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

    setAnswerState(isCorrect ? "correct" : "wrong");
    setTimeout(() => setAnswerState(null), 650);

    const mistakeType = isCorrect ? "" : getMistakeTypeForQuestion(question, answerToCheck);

    // Count the first checked answer immediately. Hints should not block data tracking.
    // Prevent double-counting the same answered question if the button is clicked again.
    if (feedback?.startsWith("✅") || feedback?.startsWith("❌")) return;

    recordAdaptiveResult(isCorrect);

    const outcomeKey = `${currentStudent}-${question.outcome}`;
    const indicatorKey = `${currentStudent}-${question.indicator || `${question.outcome}.01`}`;

    const priorIndicator = indicatorStats[indicatorKey] || { attempts: 0, correct: 0 };
    const nextIndicatorAttempts = (priorIndicator.attempts || 0) + 1;
    const nextIndicatorCorrect = (priorIndicator.correct || 0) + (isCorrect ? 1 : 0);
    const nextIndicatorAccuracy = Math.round((nextIndicatorCorrect / nextIndicatorAttempts) * 100);
    const nextIndicatorStatus =
      nextIndicatorAttempts >= 3 && nextIndicatorAccuracy >= 80
        ? "Mastered"
        : nextIndicatorAccuracy >= 60
        ? "Developing"
        : "Needs Support";

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

        const targetedQuestions = buildPracticeQuestionSet(question.outcome, activeAllQuestions, skill, 5, adaptiveLevel, question.indicator)
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

    setIndicatorStats((prev) => ({
      ...prev,
      [indicatorKey]: {
        attempts: nextIndicatorAttempts,
        correct: nextIndicatorCorrect,
        accuracy: nextIndicatorAccuracy,
        status: nextIndicatorStatus,
      },
    }));

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
      setLastMistakeType("");
      const nextStreak = correctStreak + 1;
      setCorrectStreak(nextStreak);
      setFeedback(`✅ Correct! ${question.indicator || question.outcome}: ${nextIndicatorCorrect}/${nextIndicatorAttempts} correct · ${nextIndicatorAccuracy}% · ${nextIndicatorStatus}.`);
      setHintLevel(0);
    } else {
      setCorrectStreak(0);
      setLastMistakeType(mistakeType);
      recordMistakeType(question, mistakeType);
      setFeedback(`❌ Not quite. The answer is ${question.correct}. ${question.indicator || question.outcome}: ${nextIndicatorCorrect}/${nextIndicatorAttempts} correct · ${nextIndicatorAccuracy}% · ${nextIndicatorStatus}.`);
      setHintLevel(0);
      addTeacherAlert(question);
    }
  }

  async function finishPracticeSession() {
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
    // 🔥 AUTO COMPLETE ASSIGNMENT (EXACT PATCH)

if (userProfile?.role === "student") {
  const assignment = teacherAssignments[currentStudent];

  if (assignment && assignment.status !== "completed") {
    const accuracy =
      assessmentSession?.score ??
      Math.round(
        ((practiceSession?.correct || 0) /
          (practiceSession?.total || 1)) *
          100
      );

    const updatedAssignments = {
      ...teacherAssignments,
      [currentStudent]: {
        ...assignment,
        status: "completed",
        completedAt: new Date().toISOString(),
        result: {
          accuracy,
        },
      },
    };

    // update state
    setTeacherAssignments(updatedAssignments);

    // 🔥 SAVE TO FIREBASE
    await saveCloudStudentProgress(
      user.uid,
      currentStudent,
      {
        teacherAssignments: updatedAssignments,
      },
      userProfile
    );
  }
}
    setPracticeSession(null);
    setPracticeMode(false);
    setPracticeQueue([]);
    setIntervention(null);
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setLastMistakeType("");
    setHintLevel(0);
    setStudentScreen("completion");
  }

  async function finishAssessmentSession() {
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
    setLastMistakeType("");
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

    setCurrentStudent(authUser?.studentName || visibleStudents[0] || "Student");
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
    const outcome = row.groupFocus || getSuggestedOutcomeForRow(row, false);

    saveAssignmentForStudent(row.student, {
      type: "Practice",
      target: outcome,
      status: "assigned",
      assignedAt: new Date().toLocaleDateString(),
      assignedBy: row.customQuestions?.length
        ? "Suggested Smart Bundle"
        : "Group Assignment",
      customQuestions: row.customQuestions || null,
      customBundle: row.customBundle || null,
    });

    addInterventionLog({
      student: row.student,
      type: row.customQuestions?.length
        ? "Suggested Smart Bundle"
        : "Group Assignment",
      target: outcome,
      action: row.customQuestions?.length
        ? `Smart practice bundle assigned (${row.customQuestions.length} questions)`
        : "Practice assigned",
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

  async function saveGroupSupportAction(rows = [], actionType = "Small Group Pulled") {
    const cleanRows = (rows || []).filter((row) => row?.student);
    if (cleanRows.length === 0) return;

    const now = new Date().toISOString();
    const readableDate = new Date().toLocaleDateString();
    let noteText = "";

    if (actionType === "Group Note") {
      noteText = window.prompt(`Add a note for this group (${cleanRows.map((row) => row.student).join(", ")}):`) || "";
      if (!noteText.trim()) return;
    }

    const snapshotUpdates = {};

    for (const row of cleanRows) {
      const student = row.student;
      const outcome = getSuggestedOutcomeForRow(row, false) || row.groupFocus || row.outcomes?.[0]?.outcome || "NO4";
      const baseState =
        student === currentStudent
          ? getCurrentStateForSave()
          : classSnapshot[student] || getSavedStudentData(student);

      const actionRecord = {
        type: actionType,
        student,
        outcome,
        note: noteText,
        createdAt: now,
        createdLabel: readableDate,
        source: "Smart Groups",
      };

      const updatedInterventionLog = [
        ...(baseState.interventionLog || []),
        {
          student,
          type: actionType === "Group Note" ? "Group Note" : "Small Group",
          target: outcome,
          action: actionType === "Group Note" ? noteText : "Marked as pulled from Smart Groups",
          source: "Teacher",
          status: actionType === "Group Note" ? "Note" : "Pulled",
          date: readableDate,
        },
      ];

      const updatedState = {
        ...baseState,
        interventionLog: updatedInterventionLog,
        teacherAction: actionRecord,
        teacherActionHistory: [...(baseState.teacherActionHistory || []).slice(-9), actionRecord],
        selectedClass,
        updatedAt: now,
      };

      if (student === currentStudent) {
        setInterventionLog(updatedInterventionLog);
      }

      localStorage.setItem(getSaveKey(student), JSON.stringify(updatedState));
      snapshotUpdates[student] = updatedState;

      if (authUser?.cloudEnabled && authUser?.uid) {
        try {
          await saveCloudStudentProgress(authUser.uid, student, updatedState, {
            ...authUser,
            studentName: student,
            classCode: selectedClass,
          });
        } catch (error) {
          console.warn("Group action saved locally but cloud save failed.", error);
        }
      }
    }

    setClassSnapshot((old) => ({ ...old, ...snapshotUpdates }));
  }

  function markGroupPulled(rows) {
    saveGroupSupportAction(rows, "Small Group Pulled");
  }

  function addGroupNote(rows) {
    saveGroupSupportAction(rows, "Group Note");
  }

  async function saveLiveTeacherAction(row, actionType) {
    if (!row?.student) return;

    const student = row.student;
    const now = new Date().toISOString();
    const readableDate = new Date().toLocaleDateString();
    const preferAssessment = actionType === "Assessment";
    const outcome = getSuggestedOutcomeForRow(row, preferAssessment) || row.outcomes?.[0]?.outcome || "NO4";

    let noteText = "";
    if (actionType === "Note") {
      noteText = window.prompt(`Add teacher note for ${student}:`) || "";
      if (!noteText.trim()) return;
    }

    const actionRecord = {
      type: actionType,
      student,
      outcome,
      note: noteText,
      createdAt: now,
      createdLabel: readableDate,
      source: "Live Dashboard",
    };

    const assignment =
      actionType === "Practice" || actionType === "Assessment"
        ? {
            type: actionType,
            target: outcome,
            status: "assigned",
            assignedAt: readableDate,
            assignedBy: "Live Dashboard",
          }
        : null;

    const baseState =
      student === currentStudent
        ? getCurrentStateForSave()
        : classSnapshot[student] || getSavedStudentData(student);

    const updatedTeacherAssignments = assignment
      ? { ...(baseState.teacherAssignments || {}), [student]: assignment }
      : baseState.teacherAssignments || {};

    const updatedInterventionLog = [
      ...(baseState.interventionLog || []),
      {
        student,
        type: actionType === "Small Group" ? "Small Group" : actionType === "Note" ? "Teacher Note" : "Teacher Assignment",
        target: outcome,
        action: actionType === "Note" ? noteText : `${actionType} assigned from Live Dashboard`,
        source: "Teacher",
        status: actionType === "Note" ? "Note" : "Assigned",
        date: readableDate,
      },
    ];

    const updatedState = {
      ...baseState,
      teacherAssignments: updatedTeacherAssignments,
      interventionLog: updatedInterventionLog,
      teacherAction: actionRecord,
      teacherActionHistory: [...(baseState.teacherActionHistory || []).slice(-9), actionRecord],
      selectedClass,
      updatedAt: now,
    };

    if (assignment) {
      saveAssignmentForStudent(student, assignment);
    }

    if (student === currentStudent) {
      setInterventionLog(updatedInterventionLog);
    }

    localStorage.setItem(getSaveKey(student), JSON.stringify(updatedState));
    setClassSnapshot((old) => ({ ...old, [student]: updatedState }));

    if (authUser?.cloudEnabled && authUser?.uid) {
      try {
        await saveCloudStudentProgress(authUser.uid, student, updatedState, {
          ...authUser,
          studentName: student,
          classCode: selectedClass,
        });
      } catch (error) {
        console.warn("Live teacher action saved locally but cloud save failed.", error);
      }
    }
  }

  function startOutcomePractice(outcome) {
    const nextSkill = OUTCOME_TO_SKILL[outcome] || skill;
    const targetIndicator = getWeakestIndicatorForOutcome(indicatorStats, currentStudent, outcome);
    const reviewIndicators = getReviewIndicatorsForOutcome(indicatorStats, currentStudent, outcome, targetIndicator);
    const outcomeQuestions = buildPracticeQuestionSet(outcome, activeAllQuestions, nextSkill, 5, adaptiveLevel, targetIndicator, reviewIndicators);

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
    setLastMistakeType("");
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

    const targetIndicator = getWeakestIndicatorForOutcome(indicatorStats, currentStudent, assignment.target);
    const reviewIndicators = getReviewIndicatorsForOutcome(indicatorStats, currentStudent, assignment.target, targetIndicator);
    const assignedQuestions =
  assignment.customQuestions?.length > 0
    ? assignment.customQuestions
    : buildPracticeQuestionSet(
        assignment.target,
        activeAllQuestions,
        OUTCOME_TO_SKILL[assignment.target] || skill,
        5,
        adaptiveLevel,
        targetIndicator,
        reviewIndicators
      );
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
    setLastMistakeType("");
    setHintLevel(0);
    setStudentScreen("lesson");
  }


  function startTeacherActionWork(actionInput = null) {
    const action = actionInput || latestTeacherMove || null;
    const actionType = action?.type || currentAssignment?.type || "Practice";
    const rawTarget = action?.target || action?.outcome || currentAssignment?.target || currentTodayPlan.actionOutcome || question?.outcome || "NO4";
    const target = rawTarget || "NO4";

    if (actionType === "Assessment") {
      startAssessment(currentStudent, target);
      return;
    }

    if (actionType === "Small Group") {
      setStudentScreen("today");
      setFeedback("Your teacher marked this for small-group support. Check in with your teacher before continuing.");
      return;
    }

    if (actionType === "Note" || actionType === "Teacher Note") {
      setStudentScreen("today");
      setFeedback(action?.note || action?.action || "Teacher note reviewed.");
      return;
    }

    const targetIndicator = getWeakestIndicatorForOutcome(indicatorStats, currentStudent, target);
    const reviewIndicators = getReviewIndicatorsForOutcome(indicatorStats, currentStudent, target, targetIndicator);
    const assignedQuestions = buildPracticeQuestionSet(
      target,
      activeAllQuestions,
      OUTCOME_TO_SKILL[target] || skill,
      5,
      adaptiveLevel,
      targetIndicator,
      reviewIndicators
    );

    if (assignedQuestions.length === 0) {
      startOutcomePractice(target);
      return;
    }

    setSkill(OUTCOME_TO_SKILL[target] || skill);
    setTeacherAssignments((prev) => ({
      ...prev,
      [currentStudent]: {
        type: "Practice",
        target,
        status: "in_progress",
        assignedAt: currentAssignment?.assignedAt || new Date().toLocaleDateString(),
        startedAt: new Date().toLocaleTimeString(),
        assignedBy: currentAssignment?.assignedBy || action?.source || "Teacher Action",
      },
    }));
    addInterventionLog({
      student: currentStudent,
      type: "Teacher Action Started",
      target,
      action: `${actionType} launched from student dashboard`,
      source: "Student",
      status: "In Progress",
    });
    setPracticeSession({ key: `${currentStudent}-${target}`, skill: target, attempts: 0, correct: 0, wrong: 0 });
    setPracticeQueue(assignedQuestions);
    setPracticeMode(true);
    setAssessmentMode(false);
    setAssessmentQueue([]);
    setQuestionIndex(0);
    setSelected("");
    setMultiStepAnswers({});
    setFeedback("");
    setLastMistakeType("");
    setHintLevel(0);
    setStudentScreen("lesson");
  }

  function assignOutcomePractice(student, outcome) {
    setCurrentStudent(student);
    const targetIndicator = getWeakestIndicatorForOutcome(indicatorStats, student, outcome);
    const reviewIndicators = getReviewIndicatorsForOutcome(indicatorStats, student, outcome, targetIndicator);
    const assignedQuestions = buildPracticeQuestionSet(outcome, activeAllQuestions, OUTCOME_TO_SKILL[outcome] || skill, 5, adaptiveLevel, targetIndicator, reviewIndicators);
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
    setLastMistakeType("");
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
    setLastMistakeType("");
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

  function handleLogin(nextUser) {
    saveStoredLogin(nextUser);
    setAuthUser(nextUser);
    setSelectedClass(nextUser.classCode || selectedClass);
    if (nextUser.studentName) setCurrentStudent(nextUser.studentName);
    setMode(nextUser.role === "teacher" ? "teacher" : "student");
    setStudentScreen("today");
  }

  async function handleLogout() {
    clearStoredLogin();
    try {
      await signOutRealAccount();
    } catch {
      // Demo mode or Firebase not configured.
    }
    setAuthUser(null);
    setMode("student");
  }

  const isTeacherLogin = authUser?.role === "teacher";

  if (!authUser) {
    return <LoginScreen rosterState={rosterState} onLogin={handleLogin} />;
  }

  return (
    <div style={styles.page}>
      <style>{printStyles}</style>
      <style>{`
        @keyframes tapBoxPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1.04); }
        }

        @keyframes tapBoxShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Math App Demo</h1>
          <p style={styles.subtitle}>Teacher-driven mastery with a clear student path</p>
        </div>
        <div style={styles.headerControls}>
          <div style={{ fontWeight: 900, color: "#0f172a", padding: "8px 10px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            {authUser.role === "teacher" ? "Teacher" : authUser.displayName} · Class {selectedClass}{authUser.cloudEnabled ? " · Cloud" : " · Demo"}
          </div>
          <select disabled={!isTeacherLogin} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={styles.select}>
            {Object.keys(rosterState.classes || {}).map((className) => (
              <option key={className} value={className}>Class {className}</option>
            ))}
          </select>
          {isTeacherLogin && (
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={styles.select}>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade.id} value={grade.id}>{grade.label} {grade.status === "Loaded" ? "" : "(scaffold)"}</option>
              ))}
            </select>
          )}
          {isTeacherLogin ? (
            <select value={currentStudent} onChange={(e) => setCurrentStudent(e.target.value)} style={styles.select}>
              {visibleStudents.length === 0 && <option value="">No students yet</option>}
              {visibleStudents.map((student) => (
                <option key={student} value={student}>{student}</option>
              ))}
            </select>
          ) : (
            <div style={{ ...styles.select, display: "flex", alignItems: "center", fontWeight: 900, color: "#0f172a", background: "#f8fafc" }}>
              {authUser.studentName || authUser.displayName || currentStudent}
            </div>
          )}
          {isTeacherLogin && (
            <>
              <button type="button" onClick={() => setMode("student")} style={mode === "student" ? styles.activeButton : styles.button}>Student App</button>
              <button type="button" onClick={() => setMode("teacher")} style={mode === "teacher" ? styles.activeButton : styles.button}>Teacher App</button>
              <button type="button" onClick={resetCurrentStudentProgress} style={styles.resetButton}>Reset Student</button>
            </>
          )}
          <button type="button" onClick={handleLogout} style={styles.secondary}>Sign Out</button>
        </div>
      </header>

      {mode === "student" || !isTeacherLogin ? (
       <StudentDashboard>
  <StudentApp
    screen={studentScreen}
    setScreen={setStudentScreen}
    skill={skill}
    answerState={answerState}
setAnswerState={setAnswerState}
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
    interventionLog={interventionLog}
    completionResult={completionResult}
    nextStep={currentNextStep}
    todayPlan={currentTodayPlan}
    indicatorStats={indicatorStats}
    assessmentStats={assessmentStats}
    currentStudent={currentStudent}
    startAssignedWork={startAssignedWork}
    startTeacherActionWork={startTeacherActionWork}
    startOutcomePractice={startOutcomePractice}
    selectedClass={selectedClass}
    selectedGrade={selectedGrade}
    currentStudentGrade={effectiveGrade}
    currentAdaptations={currentAdaptations}
    adaptiveLevel={adaptiveLevel}
setAdaptiveLevel={setAdaptiveLevel}
lastMistakeType={lastMistakeType}
setLastMistakeType={setLastMistakeType}
  />
</StudentDashboard>
      ) : (
        <TeacherDashboard
          Card={Card}
          Stat={Stat}
          styles={styles}
          students={visibleStudents}
          selectedClass={selectedClass}
          liveSyncStatus={liveSyncStatus}
          classSnapshot={classSnapshot}
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
          mistakeTypeStats={mistakeTypeStats}
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
          questionEdits={questionEdits}
          setQuestionEdits={setQuestionEdits}
          activeAllQuestions={activeAllQuestions}
          onAssignWeakestPractice={assignWeakestPractice}
          onAssignOutcomePractice={assignOutcomePractice}
          onAssignGroupPractice={assignGroupPractice}
          onAssignGroupAssessment={assignGroupAssessment}
          onMarkGroupPulled={markGroupPulled}
          onAddGroupNote={addGroupNote}
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
  adaptiveLevel,
setAdaptiveLevel,
answerState,
setAnswerState,
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
  interventionLog = [],
  completionResult,
  nextStep,
  todayPlan,
  indicatorStats,
  assessmentStats,
  currentStudent,
  startAssignedWork,
  startTeacherActionWork,
  startOutcomePractice,
  selectedClass,
  selectedGrade,
  currentStudentGrade,
  currentAdaptations,
  lastMistakeType,
setLastMistakeType,
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
  const latestTeacherMove = [...(interventionLog || [])]
    .filter((entry) => entry && (entry.source === "Teacher" || entry.source === "Live Dashboard" || entry.type === "Teacher Note" || entry.type === "Small Group" || entry.type === "Teacher Assignment"))
    .slice(-1)[0] || null;

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

      {(currentAssignment || latestTeacherMove) && (
        <Card title="Teacher Action">
          {currentAssignment ? (
            <>
              <p style={styles.bigText}>Your teacher assigned {currentAssignment.type} for {currentAssignment.target}.</p>
              <p style={styles.sectionIntro}>Status: {currentAssignment.status || "assigned"}{currentAssignment.assignedAt ? ` · Assigned: ${currentAssignment.assignedAt}` : ""}</p>
              <button
                type="button"
                onClick={() => startTeacherActionWork({ type: currentAssignment.type, target: currentAssignment.target, source: currentAssignment.assignedBy })}
                style={styles.primary}
              >
                {currentAssignment.type === "Assessment" ? "Start assessment" : "Start practice"}
              </button>
            </>
          ) : (
            <>
              <p style={styles.bigText}>{latestTeacherMove?.type || "Teacher note"}</p>
              <p style={styles.sectionIntro}>{latestTeacherMove?.action || latestTeacherMove?.note || latestTeacherMove?.type || "Check in with your teacher."}</p>
              {latestTeacherMove?.target ? <div style={styles.todayFocusPill}>{latestTeacherMove.target}</div> : null}
              {latestTeacherMove?.type === "Practice" || latestTeacherMove?.type === "Assessment" ? (
                <button
                  type="button"
                  onClick={() => startTeacherActionWork(latestTeacherMove)}
                  style={styles.primary}
                >
                  {latestTeacherMove.type === "Assessment" ? "Start assessment" : "Start practice"}
                </button>
              ) : latestTeacherMove?.type === "Small Group" ? (
                <div style={styles.todayFocusPill}>Meet with teacher</div>
              ) : null}
            </>
          )}
        </Card>
      )}

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
            <button type="button" onClick={() => startTeacherActionWork(currentAssignment || latestTeacherMove)} style={styles.primary}>{currentAssignment ? (currentAssignment.type === "Assessment" ? "Start assessment" : "Start practice") : todayPlan.actionLabel}</button>
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
    answerState={answerState}
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

    {lastMistakeType && !feedback.includes("Correct") && (
      <div
        style={{
          marginTop: 10,
          padding: "8px 10px",
          borderRadius: 10,
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          color: "#9a3412",
          fontWeight: 800,
        }}
      >
        Mistake clue: {lastMistakeType}
      </div>
    )}

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
        Auto Check
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
  /* deploy polish mobile tap targets */
  @media (max-width: 640px) {
    button, select { min-height: 44px !important; }
  }
  @media print {
    header, .screen-only, button { display: none !important; }
    body, #root { background: white !important; }
    * { box-shadow: none !important; }
    .print-report-card { display: block !important; border: none !important; padding: 0 !important; margin: 0 !important; }
    .print-report-card table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
    .print-report-card th, .print-report-card td { border: 1px solid #999 !important; padding: 8px !important; font-size: 12px !important; word-break: break-word !important; }
  }
`;
