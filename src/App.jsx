import React, { useEffect, useMemo, useState } from "react";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import FractionModel from "./components/FractionModel";
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

import {
  FRACTION_QUESTIONS,
  DECIMAL_QUESTIONS,
} from "./data/questionBank";

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
  answers: {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  marginTop: 18,
  justifyContent: "center",
},

answer: {
  padding: "18px 20px",
  borderRadius: 24,
  border: "3px solid #bfdbfe",
  background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
  fontWeight: 900,
  fontSize: 18,
  color: "#0f172a",
  cursor: "pointer",
  minWidth: 120,
  minHeight: 78,
  boxShadow:
    "0 14px 28px rgba(37,99,235,0.10), 0 4px 10px rgba(15,23,42,0.06)",
  transition:
    "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease, border 0.12s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  touchAction: "manipulation",
  userSelect: "none",
},
  selectedAnswer: {
  padding: "18px 20px",
  borderRadius: 24,
  border: "3px solid #2563eb",
  background:
    "linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)",
  color: "#1e3a8a",
  fontWeight: 950,
  fontSize: 18,
  cursor: "pointer",
  minWidth: 120,
  minHeight: 78,
  boxShadow:
    "0 18px 32px rgba(37,99,235,0.22), 0 6px 14px rgba(37,99,235,0.12)",
  transform: "translateY(-2px) scale(1.035)",
  transition:
    "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  touchAction: "manipulation",
  userSelect: "none",
},
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
  thinkingCard: {
  marginTop: 12,
  marginBottom: 14,
  padding: 14,
  borderRadius: 18,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
},
  thinkingStep: {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 10,
  color: "#334155",
  fontWeight: 700,
  fontSize: 14,
},
 thinkingNumber: {
  width: 26,
  height: 26,
  borderRadius: 999,
  background: "#2563eb",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 12,
  flexShrink: 0,
},
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

  if (
    lower.includes("ten-frame") ||
    lower.includes("base-ten") ||
    lower.includes("tens") ||
    lower.includes("ones") ||
    lower.includes("place value")
  ) {
    return "baseTen";
  }

  if (lower.includes("tallies")) return "tallies";

  if (
    lower.includes("hundred chart") ||
    lower.includes("sequence") ||
    lower.includes("skip count") ||
    lower.includes("number line") ||
    lower.includes("order")
  ) {
    return "numberLine";
  }

  if (lower.includes("pattern")) return "pattern";
  if (lower.includes("equal") || lower.includes("balance")) return "balance";
  if (lower.includes("calendar") || lower.includes("days") || lower.includes("months")) return "calendar";

  if (
    lower.includes("measure") ||
    lower.includes("length") ||
    lower.includes("mass") ||
    lower.includes("unit")
  ) {
    return "measurement";
  }

  if (
    lower.includes("shape") ||
    lower.includes("object") ||
    lower.includes("3-d") ||
    lower.includes("2-d")
  ) {
    return "geometry";
  }

  if (lower.includes("graph") || lower.includes("data") || lower.includes("pictograph")) return "graph";

  return "generic";
}

function getPathwayDisplayName(pathwaySkill) {
  const names = {
    counting: "Counting",
    comparing: "Comparing Numbers",
    skipCounting: "Skip Counting",
    numberLine: "Number Lines",

    patterns: "Patterns",
    repeatingPatterns: "Repeating Patterns",
    growingPatterns: "Growing Patterns",

    graphs: "Graphs",
    compareData: "Comparing Data",

    shapes: "Shapes",
    angles: "Angles",
    area: "Area",
    perimeter: "Perimeter",
  };

  return names[pathwaySkill] || pathwaySkill;
}

function getPathwayStudentGoal(pathwaySkill) {
  const goals = {
    counting: "Count carefully and use the visual model to keep track.",
    comparing: "Compare the numbers and choose the one that matches the question.",
    skipCounting: "Look for equal jumps and use the pattern to find what comes next.",
    numberLine: "Use the number line to notice order, jumps, and missing numbers.",

    patterns: "Find what repeats or changes, then predict the next part.",
    repeatingPatterns: "Find the repeating core and use it to continue the pattern.",
    growingPatterns: "Look at how the pattern grows or changes each step.",

    graphs: "Read the labels first, then compare the bars or counts.",
    compareData: "Use the graph to decide which category has more, fewer, most, or least.",

    shapes: "Look at sides, corners, curves, and shape attributes.",
    angles: "Look at corners and turns carefully.",
    area: "Count the space covered by equal square units.",
    perimeter: "Think about the distance around the outside edge.",
  };

  return goals[pathwaySkill] || "Use the model, think about the clue, then choose the answer that matches.";
}
function getVisualWarmupText(question) {
  const visualType = question?.visualType;

  const warmups = {
    baseTen: "Look at the tens first, then the ones.",
    numberLine: "Notice how the numbers change each step.",
    pattern: "Find what repeats or changes.",
    tallies: "Look for groups of five before counting extras.",
    graph: "Read the labels before comparing the bars.",
    geometry: "Look carefully at sides, corners, and curves.",
    coins: "Name each coin before adding.",
    measurement: "Count equal units carefully.",
    balance: "Compare both sides carefully.",
    calendar: "Use the rows and weekdays to help organize time.",
  };

  return warmups[visualType] || null;
}

function getPathwayBadge(pathwaySkill) {
  if (pathwaySkill === "graphs" || pathwaySkill === "compareData") {
    return {
      label: "📊 Data Explorer",
      background: "#ede9fe",
      color: "#5b21b6",
    };
  }

  if (
    pathwaySkill === "patterns" ||
    pathwaySkill === "repeatingPatterns" ||
    pathwaySkill === "growingPatterns"
  ) {
    return {
      label: "🧩 Pattern Detective",
      background: "#ecfeff",
      color: "#155e75",
    };
  }

  if (pathwaySkill === "shapes" || pathwaySkill === "angles") {
    return {
      label: "📐 Geometry Thinker",
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (pathwaySkill === "area" || pathwaySkill === "perimeter") {
    return {
      label: "📏 Measurement Mapper",
      background: "#f0fdf4",
      color: "#166534",
    };
  }

  return {
    label: "🔢 Number Strategist",
    background: "#eff6ff",
    color: "#1e3a8a",
  };
}

function getPathwayProgressMessage(questionIndex, totalQuestions) {
  const progress = (questionIndex + 1) / Math.max(totalQuestions, 1);

  if (progress < 0.34) {
    return "You are getting started.";
  }

  if (progress < 0.67) {
    return "You are building confidence.";
  }

  if (progress < 1) {
    return "You are almost finished.";
  }

  return "Pathway complete.";
}

function PathwayLessonHeader({
  selectedPathwaySkill,
  questionIndex,
  totalQuestions,
}) {
  if (!selectedPathwaySkill) return null;

  const pathwayBadge = getPathwayBadge(selectedPathwaySkill);
  const isFirstQuestion = questionIndex === 0;
  const pathwayName = getPathwayDisplayName(selectedPathwaySkill);
  const pathwayGoal = getPathwayStudentGoal(selectedPathwaySkill);
  const progressMessage = getPathwayProgressMessage(
    questionIndex,
    totalQuestions
  );

  return (
    <div
      style={{
        marginBottom: isFirstQuestion ? 14 : 10,
        padding: isFirstQuestion ? 14 : 10,
        borderRadius: 18,
        background: isFirstQuestion ? "#eff6ff" : "#f8fafc",
        border: isFirstQuestion ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
        color: isFirstQuestion ? "#1e3a8a" : "#334155",
        fontWeight: 800,
        lineHeight: 1.4,
        opacity: isFirstQuestion ? 1 : 0.94,
        transition: "all 0.22s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontWeight: 950,
              opacity: 0.82,
            }}
          >
            Pathway focus
          </div>

          <div
            style={{
              fontSize: isFirstQuestion ? 18 : 15,
              fontWeight: 950,
              marginTop: 3,
            }}
          >
            {pathwayName}
          </div>
        </div>

        {pathwayBadge && (
          <div
            style={{
              width: "fit-content",
              borderRadius: 999,
              padding: "7px 12px",
              background: pathwayBadge.background,
              color: pathwayBadge.color,
              fontWeight: 950,
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            {pathwayBadge.label}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: isFirstQuestion ? 8 : 6,
          fontSize: isFirstQuestion ? 14 : 13,
          fontWeight: isFirstQuestion ? 800 : 900,
          opacity: isFirstQuestion ? 1 : 0.78,
        }}
      >
        {isFirstQuestion ? pathwayGoal : progressMessage}
      </div>
    </div>
  );
}

function LessonTopBar({
  questionIndex,
  totalQuestions,
  displayedLessonXp,
  lessonLevel,
  lessonProgressPercent,
}) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 18,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 14 }}>
            Question {questionIndex + 1} of {totalQuestions}
          </strong>

          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: totalQuestions }).map((_, index) => {
              const isComplete = index < questionIndex;
              const isCurrent = index === questionIndex;

              return (
                <div
                  key={index}
                  style={{
                    width: isCurrent ? 16 : 8,
                    height: 8,
                    borderRadius: 999,
                    background: isComplete
                      ? "#22c55e"
                      : isCurrent
                      ? "#2563eb"
                      : "#cbd5e1",
                    transition: "all 0.22s ease",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: "#f8fafc",
            color: "#334155",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          ⭐ {displayedLessonXp} XP · Level {lessonLevel}
        </div>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${lessonProgressPercent}%`,
            height: "100%",
            borderRadius: 999,
            background: "#2563eb",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

function LessonPathwayBanner({
  selectedPathwaySkill,
  selectedStrand,
  activeStrandTheme,
  onReturnToPathway,
}) {
  if (!selectedPathwaySkill) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderRadius: 999,
          background: activeStrandTheme.soft,
          color: activeStrandTheme.accent,
          border: `1px solid ${activeStrandTheme.border}`,
          fontWeight: 900,
        }}
      >
        📍 {selectedStrand} · {selectedPathwaySkill}
      </div>

      <button
        type="button"
        onClick={onReturnToPathway}
        style={{
          border: "1px solid #cbd5e1",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: 14,
          padding: "10px 14px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        ← Return to pathway
      </button>
    </div>
  );
}

function LessonIndicatorSummary({
  lessonQuestion,
  answerState,
  indicatorAccuracy,
  indicatorStatus,
  indicatorProgressPercent,
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <span style={styles.skillTag}>
          {lessonQuestion.outcome} · {lessonQuestion.indicator || "No indicator"}
        </span>

        <span style={styles.skillTag}>
          {(lessonQuestion.difficulty || "normal").toUpperCase()}
        </span>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: answerState === "correct" ? "#dcfce7" : "#fff7ed",
            color: answerState === "correct" ? "#166534" : "#92400e",
            fontSize: 12,
            fontWeight: 950,
            border:
              answerState === "correct"
                ? "1px solid #86efac"
                : "1px solid #fed7aa",
          }}
        >
          {answerState === "correct" ? "Ready to continue" : "Solve the question"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
          padding: "10px 12px",
          borderRadius: 16,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          color: "#334155",
          fontSize: 13,
          fontWeight: 850,
        }}
      >
        <span>{indicatorAccuracy}% accuracy</span>
        <span>•</span>
        <span>{indicatorStatus}</span>
      </div>

      <div
        style={{
          height: 6,
          background: "#eef2f7",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: `${indicatorProgressPercent}%`,
            height: "100%",
            background: indicatorStatus === "Mastered" ? "#22c55e" : "#93c5fd",
            borderRadius: 999,
            transition: "width 0.25s ease",
          }}
        />
      </div>
    </>
  );
}

function LessonModePrompt({ practiceMode, assessmentMode }) {
  if (!practiceMode && !assessmentMode) return null;

  return (
    <p
      style={{
        margin: "0 0 10px",
        color: "#64748b",
        fontSize: 13,
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {practiceMode
        ? "Use the model, then choose."
        : "Try this one on your own."}
    </p>
  );
}

function LessonAdaptationSupportBlocks({
  currentAdaptations,
  adaptationSupport,
}) {
  return (
    <>
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
    </>
  );
}

function LessonQuestionSurfaceHeader({ lessonQuestion, answerState }) {
  return (
    <>
      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: 10,
        }}
      >
        Solve
      </p>

      <h2
        style={{
          marginTop: 0,
          marginBottom: 28,
          fontSize: "clamp(34px, 6vw, 52px)",
          lineHeight: 1.08,
          fontWeight: 950,
          color: "#0f172a",
          textAlign: "center",
          letterSpacing: "-0.03em",
          maxWidth: 900,
          marginInline: "auto",
        }}
      >
        {lessonQuestion.prompt}
      </h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            borderRadius: 999,
            padding: "6px 12px",
            background:
              answerState === "correct"
                ? "#dcfce7"
                : answerState === "wrong"
                ? "#ffedd5"
                : "#eff6ff",
            color:
              answerState === "correct"
                ? "#166534"
                : answerState === "wrong"
                ? "#9a3412"
                : "#1d4ed8",
            fontSize: 13,
            fontWeight: 900,
            border:
              answerState === "correct"
                ? "1px solid #86efac"
                : answerState === "wrong"
                ? "1px solid #fdba74"
                : "1px solid #bfdbfe",
            transition: "all 0.22s ease",
          }}
        >
          {answerState === "correct"
            ? "Confidence Growing"
            : answerState === "wrong"
            ? "Learning Moment"
            : "Your Turn"}
        </div>
      </div>
    </>
  );
}

function LessonVisualWarmup({ lessonQuestion }) {
  const warmupText = getVisualWarmupText(lessonQuestion);

  if (!warmupText) return null;

  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #dbe3ef",
        color: "#334155",
        fontSize: 13,
        fontWeight: 800,
        lineHeight: 1.35,
      }}
    >
      👀 {warmupText}
    </div>
  );
}

function LessonFractionVisualModels({
  lessonQuestion,
  effectiveTapBoxModel,
}) {
  if (lessonQuestion.visualType !== "fraction_model") return null;

  return (
    <div
      style={{
        marginTop: 18,
        marginBottom: 18,
        padding: 16,
        borderRadius: 18,
        background: "linear-gradient(135deg, #eff6ff, #f0fdf4)",
        border: "2px solid #bfdbfe",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        flexWrap: "wrap",
      }}
    >
      <FractionModel
        total={effectiveTapBoxModel?.total || 4}
        shaded={effectiveTapBoxModel?.target || 1}
        model="circle"
        size={140}
      />

      <FractionModel
        total={effectiveTapBoxModel?.total || 4}
        shaded={effectiveTapBoxModel?.target || 1}
        model="bar"
        size={140}
      />
    </div>
  );
}

function LessonCurriculumVisualBlock({
  lessonQuestion,
  currentAdaptations,
  effectiveTapBoxModel,
}) {
  if (
    !lessonQuestion.visualType ||
    lessonQuestion.visualType === "generic" ||
    lessonQuestion.visualType === "fraction_model" ||
    effectiveTapBoxModel
  ) {
    return null;
  }

  return (
    <div style={{ marginTop: 16, marginBottom: 16 }}>
      <CurriculumVisual
        question={lessonQuestion}
        adaptations={currentAdaptations || {}}
      />
    </div>
  );
}

function LessonQuestionShell({ selected, feedback, children }) {
  return (
    <div
      style={{
        ...styles.analyticsCard,
        marginTop: 12,
        borderRadius: 24,
        padding: 22,
        background: "#ffffff",
        border:
          selected && !feedback
            ? "2px solid #93c5fd"
            : "1px solid #dbeafe",
        boxShadow:
          selected && !feedback
            ? "0 0 18px rgba(37,99,235,0.14)"
            : "0 8px 22px rgba(15,23,42,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function LessonFeedbackBox({
  feedback,
  answerState,
  lastMistakeType,
  adaptationSupport,
}) {
  if (!feedback) return null;

  return (
    <div
      style={{
        ...styles.feedback,
        marginTop: 18,
        borderRadius: 22,
        padding: 18,
        border: feedback.includes("Correct")
          ? "3px solid #86efac"
          : "3px solid #fdba74",
        background: feedback.includes("Correct")
          ? "linear-gradient(135deg, #dcfce7, #f0fdf4)"
          : "linear-gradient(135deg, #ffedd5, #fff7ed)",
        color: "#0f172a",
        boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          marginBottom: 6,
        }}
      >
        {feedback.includes("Correct") ? "✅ Nice work!" : "💡 Let’s learn from that."}
      </div>

      <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 700 }}>
        {feedback}
      </p>

      {lastMistakeType && !feedback.includes("Correct") && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 14,
            background: "#fff7ed",
            border: "2px solid #fed7aa",
            color: "#9a3412",
            fontWeight: 900,
          }}
        >
          Mistake clue: {lastMistakeType}
        </div>
      )}

      {!feedback.includes("Correct") && adaptationSupport?.workedExample && (
        <p style={{ margin: "10px 0 0", fontSize: 15, fontWeight: 700 }}>
          <strong>Try this idea:</strong> {adaptationSupport.workedExample}
        </p>
      )}
    </div>
  );
}

function LessonContinueRow({
  lessonQuestion,
  multiStepAnswers,
  checkAnswer,
  feedback,
  hintLevel,
  answerState,
  nextQuestion,
  selectedPathwaySkill,
  onReturnToPathway,
}) {
  return (
    <div style={styles.row}>
      {lessonQuestion.type === "multi-step" && (
        <button
          type="button"
          onClick={checkAnswer}
          disabled={Object.keys(multiStepAnswers).length < lessonQuestion.steps.length}
          style={{
            ...styles.primary,
            opacity:
              Object.keys(multiStepAnswers).length < lessonQuestion.steps.length ? 0.5 : 1,
            cursor:
              Object.keys(multiStepAnswers).length < lessonQuestion.steps.length
                ? "not-allowed"
                : "pointer",
          }}
        >
          Check Answers
        </button>
      )}

      {feedback && hintLevel === 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 850,
              color: answerState === "correct" ? "#1d4ed8" : "#92400e",
            }}
          >
            {answerState === "correct"
              ? "Ready for the next question."
              : "Review the hint, then keep going."}
          </div>

          <button
            type="button"
            onClick={nextQuestion}
            style={{
              ...styles.secondary,
              background:
                answerState === "correct"
                  ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                  : "#ffffff",
              color: answerState === "correct" ? "#ffffff" : "#0f172a",
              border:
                answerState === "correct"
                  ? "1px solid #1d4ed8"
                  : styles.secondary.border,
              boxShadow:
                answerState === "correct"
                  ? "0 12px 28px rgba(37,99,235,0.24)"
                  : "none",
              transform:
                answerState === "correct" ? "translateY(-1px)" : "translateY(0)",
              transition: "all 0.22s ease",
              fontWeight: 950,
            }}
          >
            {answerState === "correct" ? "Continue →" : "Try Another"}
          </button>
        </div>
      )}

      {!selectedPathwaySkill && (
        <button
          type="button"
          onClick={onReturnToPathway}
          style={styles.secondary}
        >
          Return to Pathway
        </button>
      )}
    </div>
  );
}

function ReadAloudSupport({
  lessonQuestion,
  adaptationSupport,
  speakReadAloudText,
  setSupportUsage,
  setInterventionLog,
  currentStudent,
}) {
  if (!lessonQuestion.showReadAloudText) return null;

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        borderRadius: 10,
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1d4ed8",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span>🔊 Read aloud: {adaptationSupport?.readAloudText}</span>

        <button
          type="button"
          onClick={() => {
            speakReadAloudText(adaptationSupport?.readAloudText);

            setSupportUsage((prev) => ({
              ...prev,
              readAloudUsed: (prev?.readAloudUsed || 0) + 1,
            }));

            setInterventionLog((prev) => [
              ...prev,
              {
                student: currentStudent,
                type: "Read Aloud Used",
                question: lessonQuestion?.prompt || "",
                timestamp: new Date().toISOString(),
              },
            ]);
          }}
          style={{
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: 999,
            padding: "6px 12px",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ▶ Read
        </button>
      </div>
    </div>
  );
}

function WorkedExampleSupport({
  lessonQuestion,
  adaptationSupport,
  setSupportUsage,
  setInterventionLog,
  currentStudent,
}) {
  if (!lessonQuestion.showWorkedExample) return null;

  return (
    <details
      onToggle={(e) => {
        if (e.target.open) {
          setSupportUsage((prev) => ({
            ...prev,
            exampleOpened: (prev?.exampleOpened || 0) + 1,
          }));

          setInterventionLog((prev) => [
            ...prev,
            {
              student: currentStudent,
              type: "Worked Example Opened",
              question: lessonQuestion?.prompt || "",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }}
      style={{
        marginTop: 8,
        borderRadius: 10,
        background: "#fef3c7",
        border: "1px solid #fde68a",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          padding: 10,
          color: "#92400e",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        ✏️ Show Example
      </summary>

      <div
        style={{
          padding: "0 10px 10px",
          color: "#92400e",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {adaptationSupport?.workedExample}
      </div>
    </details>
  );
}

function FormulaReminderSupport({
  lessonQuestion,
  adaptationSupport,
  setSupportUsage,
  setInterventionLog,
  currentStudent,
}) {
  if (!lessonQuestion.showFormulaReminder) return null;

  return (
    <details
      onToggle={(e) => {
        if (e.target.open) {
          setSupportUsage((prev) => ({
            ...prev,
            reminderOpened: (prev?.reminderOpened || 0) + 1,
          }));

          setInterventionLog((prev) => [
            ...prev,
            {
              student: currentStudent,
              type: "Formula Reminder Opened",
              question: lessonQuestion?.prompt || "",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }}
      style={{
        marginTop: 8,
        borderRadius: 10,
        background: "#ecfccb",
        border: "1px solid #bef264",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          padding: 10,
          color: "#3f6212",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        📘 Show Reminder
      </summary>

      <div
        style={{
          padding: "0 10px 10px",
          color: "#3f6212",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {adaptationSupport?.formulaReminder}
      </div>
    </details>
  );
}

function LessonThinkingSteps({ lessonQuestion, feedback }) {
  if (
    !lessonQuestion.showWorkedExample ||
    !lessonQuestion.thinkingSteps ||
    feedback.includes("Correct")
  ) {
    return null;
  }

  return (
    <div style={styles.thinkingCard}>
      <strong>Think it through</strong>

      {lessonQuestion.thinkingSteps.map((step, index) => (
        <div key={step} style={styles.thinkingStep}>
          <span style={styles.thinkingNumber}>{index + 1}</span>
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}

function PathwayCompletionMessage({ selectedPathwaySkill }) {
  if (!selectedPathwaySkill) {
    return (
      <p style={styles.sectionIntro}>
        Your progress has been saved. Your teacher can now see your latest practice evidence.
      </p>
    );
  }

  const pathwayBadge = getPathwayBadge(selectedPathwaySkill);

  return (
    <>
      <div
        style={{
          margin: "0 auto 14px",
          width: "fit-content",
          borderRadius: 999,
          padding: "8px 14px",
          background: pathwayBadge.background,
          color: pathwayBadge.color,
          fontWeight: 950,
          fontSize: 13,
          letterSpacing: 0.3,
        }}
      >
        {pathwayBadge.label}
      </div>

      <p style={styles.sectionIntro}>
        {getPathwayStudentGoal(selectedPathwaySkill)}
      </p>

      <div
        style={{
          margin: "16px auto",
          padding: 14,
          borderRadius: 18,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1e3a8a",
          fontWeight: 850,
          lineHeight: 1.4,
          maxWidth: 520,
        }}
      >
        You practiced a focused pathway. Your teacher can use this evidence to see what you understand and what support may help next.
      </div>
    </>
  );
}

function CompletionStatsGrid({ stats = [] }) {
  if (!stats.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
        marginTop: 16,
        marginBottom: 16,
      }}
    >
      {stats.map((stat) => (
        <div key={stat.label} style={styles.currentTaskCard}>
          <p style={styles.eyebrowDark}>{stat.label}</p>

          <strong>{stat.value}</strong>

          {stat.detail && (
            <div style={styles.cellSubtext}>
              {stat.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CompletionActionRow({ actions = [] }) {
  const visibleActions = actions.filter(Boolean);

  if (!visibleActions.length) return null;

  return (
    <div style={styles.row}>
      {visibleActions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          style={action.variant === "primary" ? styles.primary : styles.secondary}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function AssignmentCompletionDetails({
  completionResult,
  practiceSession,
  practiceQueue,
}) {
  if (!completionResult) return null;

  return (
    <>
      {practiceSession?.roleStats && practiceQueue?.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <strong>Question Types:</strong>

          {(() => {
            const counts = practiceQueue.reduce((acc, q) => {
              const type = q.questionType || "mixed";
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {});

            return Object.entries(counts).map(([type, count]) => (
              <div key={type}>
                {type}: {count}
              </div>
            ));
          })()}
        </div>
      )}

      {completionResult?.roleStats && (
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <strong>Practice Breakdown:</strong>
          {Object.entries(completionResult.roleStats).map(([key, stats]) => (
            <div key={key}>
              {key.toUpperCase()}: {stats.correct}/{stats.attempts}
            </div>
          ))}
        </div>
      )}

      {completionResult?.supportUsage &&
        (completionResult.supportUsage.readAloudUsed > 0 ||
          completionResult.supportUsage.exampleOpened > 0 ||
          completionResult.supportUsage.reminderOpened > 0) && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: 12,
              color: "#334155",
            }}
          >
            <strong>Supports Used:</strong>

            <div style={{ marginTop: 6 }}>
              🔊 Read Aloud: {completionResult.supportUsage.readAloudUsed}
            </div>

            <div>
              ✏️ Example Opened: {completionResult.supportUsage.exampleOpened}
            </div>

            <div>
              📘 Reminder Opened: {completionResult.supportUsage.reminderOpened}
            </div>
          </div>
        )}

      <div style={styles.recommendationBox}>
        <strong>Next step:</strong>
        <p>{completionResult.nextStep}</p>

        {completionResult?.supportInsight && (
          <p style={{ marginTop: 8 }}>
            <strong>Support note:</strong> {completionResult.supportInsight}
          </p>
        )}
      </div>
    </>
  );
}

function CompletionHero({ icon = "✅", eyebrow, title, text }) {
  return (
    <div style={styles.completionHero}>
      <div style={styles.completionIcon}>{icon}</div>

      <div>
        {eyebrow && <p style={styles.eyebrowDark}>{eyebrow}</p>}
        {title && <h2 style={styles.todayTitle}>{title}</h2>}
        {text && <p style={styles.sectionIntro}>{text}</p>}
      </div>
    </div>
  );
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
    geometry: "Tap each shape and notice sides, corners, curved edges, and flat surfaces.",
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
if (adaptations.examples) {
  adapted.showWorkedExample = true;
}

if (adaptations.formulaSheet) {
  adapted.showFormulaReminder = true;
}

if (adaptations.readAloud) {
  adapted.showReadAloudText = true;
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
    : "What number is shown by the tallest bar?",
  answers: isChallenge ? ["B", "A", "C"] : ["5", "3", "2"],
  correct: isChallenge ? "B" : "5",
  modelLabel: "bar heights: A=3, B=5, C=2",
  thinkingSteps: [
    "Read the graph labels.",
    "Compare the heights/counts.",
    "Use the data to answer the question.",
  ],
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

function buildVisualDataFromTemplate(visualType, template = {}) {
  const modelLabel = template.modelLabel || "";
  const lower = modelLabel.toLowerCase();

  if (visualType === "numberLine") {
    const values = modelLabel
      .replace(/blank/gi, "?")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item === "?" ? "?" : Number(item)))
      .filter((item) => item === "?" || !Number.isNaN(item));

    return {
      values: values.length ? values : [20, 30, 40, "?", 60],
    };
  }

  if (visualType === "pattern") {
    const items = modelLabel
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      items: items.length ? items : ["▲", "●", "▲", "●", "▲", "?"],
    };
  }

  if (visualType === "tallies") {
    if (lower.includes("two groups of five") && lower.includes("three")) {
      return { groups: [5, 5, 3] };
    }

    if (lower.includes("group of five") && lower.includes("three")) {
      return { groups: [5, 3] };
    }

    const plusGroups = modelLabel
      .split("+")
      .map((item) => Number(item.trim()))
      .filter((item) => !Number.isNaN(item));

    if (plusGroups.length) {
      return { groups: plusGroups };
    }

    return { groups: [5, 5, 3] };
  }

  if (visualType === "baseTen") {
    const tensMatch = modelLabel.match(/(\d+)\s*tens?/i);
    const onesMatch = modelLabel.match(/(\d+)\s*ones?/i);

    return {
      tens: tensMatch ? Number(tensMatch[1]) : 2,
      ones: onesMatch ? Number(onesMatch[1]) : 6,
    };
  }

  if (visualType === "coins") {
    const coins = [];

    const coinMap = [
      { word: "quarter", value: "25¢" },
      { word: "dime", value: "10¢" },
      { word: "nickel", value: "5¢" },
      { word: "penny", value: "1¢" },
    ];

    coinMap.forEach((coin) => {
      const matches = lower.match(new RegExp(coin.word, "g")) || [];
      matches.forEach(() => coins.push(coin.value));
    });

    return {
      coins: coins.length ? coins : ["25¢", "10¢", "10¢", "5¢"],
    };
  }

  if (visualType === "balance") {
    const balanceMatch = modelLabel.match(/(.+?)\s*(\?|=|≠|>|<)\s*(.+)/);

    return {
      left: balanceMatch ? balanceMatch[1].trim() : "10 + 5",
      middle: balanceMatch ? balanceMatch[2].trim() : "=",
      right: balanceMatch ? balanceMatch[3].trim() : "15",
    };
  }

  if (visualType === "measurement") {
    const numberWordMap = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    const digitMatch = modelLabel.match(/(\d+)/);
    const wordMatch = Object.keys(numberWordMap).find((word) =>
      lower.includes(word)
    );

    return {
      units: digitMatch
        ? Number(digitMatch[1])
        : wordMatch
        ? numberWordMap[wordMatch]
        : 6,
    };
  }

  if (visualType === "graph") {
    const matches = [...modelLabel.matchAll(/([A-Za-z])\s*=\s*(\d+)/g)];

    return {
      labels: matches.length ? matches.map((match) => match[1]) : ["A", "B", "C"],
      values: matches.length ? matches.map((match) => Number(match[2])) : [3, 5, 2],
    };
  }

  return {};
}

function applyVisualDifficultyUpgrade(question) {
  if (!question) return question;

  const difficulty = question.difficulty || "easy";

  if (difficulty !== "challenge") {
    return question;
  }

  return {
    ...question,
    visualData: {
      ...(question.visualData || {}),
      challengeMode: true,
      showExtraLabels: true,
      showReasoningPrompt: true,
    },
  };
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
    visualData: buildVisualDataFromTemplate(visualType, template),
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
  fractions: FRACTION_QUESTIONS,
  decimals: DECIMAL_QUESTIONS,
};

const GEOMETRY_PATHWAY_QUESTIONS = [
  {
    id: "geometry-shapes-1",
    prompt: "Which shape has 4 equal sides?",
    readAloudText:
      "Which shape has 4 equal sides? The choices are square, circle, and triangle.",
    answers: ["square", "circle", "triangle"],
    correct: "square",
    outcome: "G01",
    indicator: "G01.01",
    skill: "Shapes",
    visualType: "geometry",
    difficulty: "easy",
    modelLabel: "square, circle, triangle",
    thinkingSteps: [
      "Look at the sides.",
      "Find the shape with 4 sides.",
      "Check that all 4 sides are equal.",
    ],
    curriculumText: "Identify and describe 2-D shapes.",
  },
  {
    id: "geometry-shapes-2",
    prompt: "Which shape has no corners?",
    readAloudText:
      "Which shape has no corners? The choices are circle, square, and rectangle.",
    answers: ["circle", "square", "rectangle"],
    correct: "circle",
    outcome: "G01",
    indicator: "G01.02",
    skill: "Shapes",
    visualType: "geometry",
    difficulty: "easy",
    modelLabel: "circle, square, rectangle",
    thinkingSteps: [
      "Look for corners.",
      "A corner is where two sides meet.",
      "Choose the shape with no corners.",
    ],
    curriculumText: "Compare attributes of 2-D shapes.",
  },
  {
    id: "geometry-shapes-3",
    prompt: "Which shape has 3 sides?",
    readAloudText:
      "Which shape has 3 sides? The choices are triangle, square, and circle.",
    answers: ["triangle", "square", "circle"],
    correct: "triangle",
    outcome: "G01",
    indicator: "G01.03",
    skill: "Shapes",
    visualType: "geometry",
    difficulty: "easy",
    modelLabel: "triangle, square, circle",
    thinkingSteps: [
      "Count the sides.",
      "Look for the shape with exactly 3 sides.",
      "Match the shape name to the model.",
    ],
    curriculumText: "Identify triangles by their attributes.",
  },
  {
    id: "geometry-shapes-4",
    prompt: "Which attribute could sort these shapes?",
    readAloudText:
      "Which attribute could sort these shapes? The choices are curved sides or straight sides, colour only, or how heavy it is.",
    answers: [
      "curved sides or straight sides",
      "colour only",
      "how heavy it is",
    ],
    correct: "curved sides or straight sides",
    outcome: "G01",
    indicator: "G01.04",
    skill: "Shapes",
    visualType: "geometry",
    difficulty: "normal",
    modelLabel: "square, circle, triangle",
    thinkingSteps: [
      "Look at what the shapes have.",
      "Compare sides and corners.",
      "Choose an attribute that describes the shapes.",
    ],
    curriculumText: "Sort shapes using attributes.",
  },
];

const NUMBER_PATHWAY_QUESTIONS = [
  {
    id: "number-line-1",
    prompt: "What number belongs in the missing spot?",
    readAloudText:
      "What number belongs in the missing spot? The sequence is 20, 30, 40, blank, 60.",
    answers: ["50", "45", "55"],
    correct: "50",
    outcome: "N01",
    indicator: "N01.01",
    skill: "Number Line",
    visualType: "numberLine",
    difficulty: "easy",
    modelLabel: "20, 30, 40, ?, 60",
    thinkingSteps: [
      "Look at how the numbers change.",
      "Find the counting pattern.",
      "Use the pattern to find the missing number.",
    ],
    curriculumText: "Use number sequences and skip counting.",
  },

  {
    id: "number-line-2",
    prompt: "What number belongs in the missing spot?",
readAloudText:
  "What number belongs in the missing spot? The sequence is 20, 30, 40, blank, 60.",
answers: ["50", "45", "55"],
correct: "50",
outcome: "N01",
indicator: "N01.02",
skill: "Skip Counting",
visualType: "numberLine",
difficulty: "easy",
modelLabel: "20, 30, 40, ?, 60",
thinkingSteps: [
  "Look at the skip-counting pattern.",
  "Count by 10s.",
  "Find the missing number.",
],
    curriculumText: "Skip count forward by numbers.",
  },

  {
    id: "base-ten-1",
    prompt: "What number is shown?",
    readAloudText:
      "What number is shown by the tens and ones blocks?",
    answers: ["26", "62", "20"],
    correct: "26",
    outcome: "N02",
    indicator: "N02.01",
    skill: "Place Value",
    visualType: "baseTen",
    difficulty: "easy",
    modelLabel: "2 tens and 6 ones",
    thinkingSteps: [
      "Count the tens first.",
      "Count the ones next.",
      "Put them together.",
    ],
    curriculumText: "Represent numbers using tens and ones.",
  },

  {
    id: "coins-1",
    prompt: "How much money is shown?",
    readAloudText:
      "How much money is shown by the coins?",
    answers: ["50¢", "40¢", "65¢"],
    correct: "50¢",
    outcome: "N03",
    indicator: "N03.01",
    skill: "Money",
    visualType: "coins",
    difficulty: "easy",
    modelLabel: "quarter, dime, dime, nickel",
    thinkingSteps: [
      "Name each coin.",
      "Add the values together.",
      "Choose the matching amount.",
    ],
    curriculumText: "Represent money amounts using coins.",
  },

  {
    id: "tallies-1",
    prompt: "How many tally marks are shown?",
    readAloudText:
      "How many tally marks are shown?",
    answers: ["13", "10", "15"],
    correct: "13",
    outcome: "N04",
    indicator: "N04.01",
    skill: "Tallies",
    visualType: "tallies",
    difficulty: "easy",
    modelLabel: "5 + 5 + 3",
    thinkingSteps: [
      "Look for groups of five.",
      "Count the extra marks.",
      "Add them together.",
    ],
    curriculumText: "Count and represent quantities.",
  },
];

const DATA_PATHWAY_QUESTIONS = [
  {
    id: "data-graph-1",
    prompt: "What number is shown by the tallest bar?",
    readAloudText:
      "What number is shown by the tallest bar? The graph has A equals 3, B equals 5, and C equals 2.",
    answers: ["5", "3", "2"],
    correct: "5",
    outcome: "SP01",
    indicator: "SP01.01",
    skill: "Graphs",
    visualType: "graph",
    difficulty: "easy",
    modelLabel: "A=3, B=5, C=2",
    thinkingSteps: [
      "Read the labels.",
      "Find the tallest bar.",
      "Use the number shown by that bar.",
    ],
    curriculumText: "Read and compare information on a graph.",
  },
  {
    id: "data-graph-2",
    prompt: "Which category has the most?",
    readAloudText:
      "Which category has the most? The graph has A equals 3, B equals 5, and C equals 2.",
    answers: ["B", "A", "C"],
    correct: "B",
    outcome: "SP01",
    indicator: "SP01.02",
    skill: "Graphs",
    visualType: "graph",
    difficulty: "easy",
    modelLabel: "A=3, B=5, C=2",
    thinkingSteps: [
      "Compare the bar heights.",
      "Find the tallest bar.",
      "Choose the matching category.",
    ],
    curriculumText: "Compare categories on a graph.",
  },
  {
    id: "data-graph-3",
    prompt: "How many more does B show than C?",
    readAloudText:
      "How many more does B show than C? B shows 5 and C shows 2.",
    answers: ["3", "2", "5"],
    correct: "3",
    outcome: "SP01",
    indicator: "SP01.03",
    skill: "Compare Data",
    visualType: "graph",
    difficulty: "normal",
    modelLabel: "A=3, B=5, C=2",
    thinkingSteps: [
      "Find B on the graph.",
      "Find C on the graph.",
      "Compare 5 and 2.",
    ],
    curriculumText: "Compare data using a graph.",
  },
];

function addVisualDataToQuestion(question) {
  if (!question) return question;

  const questionWithVisualData = question.visualData
    ? question
    : {
        ...question,
        visualData: buildVisualDataFromTemplate(question.visualType, {
          modelLabel: question.modelLabel,
        }),
      };

  return applyVisualDifficultyUpgrade(questionWithVisualData);
}

const EXTRA_DATA_PATHWAY_QUESTIONS = [
  
  {
    id: "data-graph-most-votes",
    prompt: "Which category has the most votes?",
    difficulty: "easy",
    answers: ["Dogs", "Cats", "Birds"],
    correct: "Dogs",
    outcome: "SP1",
    indicator: "SP1.01",
    skill: "Read and compare data in a bar graph",
    visualType: "graph",
    modelLabel: "Dogs=6, Cats=4, Birds=2",
    curriculumText: "Read and compare information shown in a graph.",
    thinkingSteps: [
      "Read each graph label.",
      "Compare the bar heights.",
      "Choose the category with the greatest number.",
    ],
    mistakeIfWrong: "Needs support comparing values in a graph.",
    hint: "Look for the tallest bar.",
    hint2: "The tallest bar shows the most votes.",
  },
  {
    id: "data-graph-least-votes",
    prompt: "Which category has the fewest votes?",
    difficulty: "easy",
    answers: ["Apples", "Bananas", "Oranges"],
    correct: "Oranges",
    outcome: "SP1",
    indicator: "SP1.02",
    skill: "Identify least in a graph",
    visualType: "graph",
    modelLabel: "Apples=5, Bananas=3, Oranges=1",
    curriculumText: "Use graph data to identify least and greatest values.",
    thinkingSteps: [
      "Read the labels.",
      "Compare the bar heights.",
      "Choose the shortest bar.",
    ],
    mistakeIfWrong: "Needs support identifying the least value in graph data.",
    hint: "Look for the shortest bar.",
    hint2: "Fewest means the smallest number.",
  },
  {
    id: "data-graph-how-many",
    prompt: "How many students chose soccer?",
    difficulty: "easy",
    answers: ["7", "4", "2"],
    correct: "7",
    outcome: "SP1",
    indicator: "SP1.03",
    skill: "Read a value from a bar graph",
    visualType: "graph",
    modelLabel: "Soccer=7, Hockey=4, Basketball=2",
    curriculumText: "Read a value from a graph using labels and bar height.",
    thinkingSteps: [
      "Find the soccer label.",
      "Look at the height of the soccer bar.",
      "Match the height to the number.",
    ],
    mistakeIfWrong: "Needs support reading exact values from a graph.",
    hint: "Find Soccer first.",
    hint2: "Then read the number shown by that bar.",
  },
];

const EXTRA_PATTERN_PATHWAY_QUESTIONS = [
  {
    id: "pattern-repeat-1",
    prompt: "What comes next in the pattern?",
    difficulty: "easy",
    answers: ["▲", "●", "■"],
    correct: "▲",
    outcome: "PR1",
    indicator: "PR1.01",
    skill: "Identify repeating patterns",
    visualType: "pattern",
    modelLabel: "▲ ● ▲ ● ?",
    curriculumText: "Recognize and continue repeating patterns.",
    thinkingSteps: [
      "Look for the repeating part.",
      "Say the pattern out loud.",
      "Choose the next shape.",
    ],
    mistakeIfWrong: "Needs support extending repeating patterns.",
    hint: "Find what repeats.",
    hint2: "The pattern repeats triangle, circle.",
  },

  {
    id: "pattern-repeat-2",
    prompt: "Which shape should replace the question mark?",
    difficulty: "easy",
    answers: ["■", "●", "▲"],
    correct: "■",
    outcome: "PR1",
    indicator: "PR1.02",
    skill: "Complete repeating patterns",
    visualType: "pattern",
    modelLabel: "■ ● ■ ● ?",
    curriculumText: "Use repeating patterns to predict missing elements.",
    thinkingSteps: [
      "Find the repeating core.",
      "Look at the last shown shape.",
      "Continue the pattern.",
    ],
    mistakeIfWrong: "Needs support identifying repeating cores.",
    hint: "The shapes repeat in the same order.",
    hint2: "Square, circle, square, circle...",
  },

  {
    id: "pattern-growing-1",
    prompt: "What number comes next?",
    difficulty: "easy",
    answers: ["8", "7", "9"],
    correct: "8",
    outcome: "PR1",
    indicator: "PR1.03",
    skill: "Identify growing patterns",
    visualType: "numberLine",
    modelLabel: "2, 4, 6, ?",
    curriculumText: "Recognize growing number patterns.",
    thinkingSteps: [
      "Look at how the numbers change.",
      "Find the pattern rule.",
      "Use the same change again.",
    ],
    mistakeIfWrong: "Needs support identifying growing patterns.",
    hint: "The pattern grows by the same amount.",
    hint2: "Count the jump between numbers.",
  },

  {
    id: "pattern-growing-2",
    prompt: "Which rule matches this pattern?",
    difficulty: "challenge",
    answers: ["Add 2", "Add 1", "Subtract 2"],
    correct: "Add 2",
    outcome: "PR1",
    indicator: "PR1.04",
    skill: "Describe pattern rules",
    visualType: "numberLine",
    modelLabel: "1, 3, 5, 7",
    curriculumText: "Describe how a pattern changes.",
    thinkingSteps: [
      "Compare one number to the next.",
      "Look for the repeated change.",
      "Choose the matching rule.",
    ],
    mistakeIfWrong: "Needs support describing pattern rules.",
    hint: "Check the difference between numbers.",
    hint2: "The same amount is added each time.",
  },
];

const EXTRA_NUMBER_PATHWAY_QUESTIONS = [
  {
    id: "number-counting-base-ten-1",
    prompt: "What number is shown by the model?",
    difficulty: "easy",
    answers: ["34", "43", "30"],
    correct: "34",
    outcome: "NO1",
    indicator: "NO1.01",
    skill: "Count tens and ones",
    visualType: "baseTen",
    modelLabel: "3 tens and 4 ones",
    curriculumText: "Represent and describe numbers using tens and ones.",
    thinkingSteps: [
      "Count the tens first.",
      "Count the ones next.",
      "Put the tens and ones together.",
    ],
    mistakeIfWrong: "Needs support counting tens and ones.",
    hint: "Each ten is worth 10.",
    hint2: "3 tens and 4 ones makes 34.",
  },
  {
    id: "number-skip-counting-1",
    prompt: "What number belongs in the missing spot?",
    difficulty: "easy",
    answers: ["40", "35", "45"],
    correct: "40",
    outcome: "NO1",
    indicator: "NO1.02",
    skill: "Skip count by 5s",
    visualType: "numberLine",
    modelLabel: "25, 30, 35, ?, 45",
    curriculumText: "Skip count forward using equal jumps.",
    thinkingSteps: [
      "Look at the jump from one number to the next.",
      "Use the same jump again.",
      "Choose the missing number.",
    ],
    mistakeIfWrong: "Needs support skip counting by equal jumps.",
    hint: "The numbers go up by 5.",
    hint2: "35 plus 5 is 40.",
  },
  {
    id: "number-tally-counting-1",
    prompt: "How many tally marks are shown?",
    difficulty: "easy",
    answers: ["12", "10", "15"],
    correct: "12",
    outcome: "NO1",
    indicator: "NO1.03",
    skill: "Count tally marks",
    visualType: "tallies",
    modelLabel: "5 + 5 + 2",
    curriculumText: "Count groups efficiently using tallies.",
    thinkingSteps: [
      "Look for groups of five.",
      "Count the extra tallies.",
      "Add the groups together.",
    ],
    mistakeIfWrong: "Needs support counting tally groups.",
    hint: "Two full groups of five make 10.",
    hint2: "10 and 2 more is 12.",
  },
  {
    id: "number-comparing-1",
    prompt: "Which number is greater?",
    difficulty: "easy",
    answers: ["47", "39", "They are equal"],
    correct: "47",
    outcome: "NO1",
    indicator: "NO1.04",
    skill: "Compare two numbers",
    visualType: "numberLine",
    modelLabel: "39, ?, 47",
    curriculumText: "Compare and order numbers.",
    thinkingSteps: [
      "Look at both numbers.",
      "Think about which number comes later on the number line.",
      "Choose the greater number.",
    ],
    mistakeIfWrong: "Needs support comparing two-digit numbers.",
    hint: "Greater means larger.",
    hint2: "47 is greater than 39.",
  },
];

const EXTRA_GEOMETRY_PATHWAY_QUESTIONS = [
  {
    id: "geometry-shapes-attributes-1",
    prompt: "Which shape has 4 equal sides?",
    difficulty: "easy",
    answers: ["Square", "Circle", "Triangle"],
    correct: "Square",
    outcome: "G01",
    indicator: "G01.01",
    skill: "Identify shape attributes",
    visualType: "geometry",
    modelLabel: "square, circle, triangle",
    curriculumText: "Sort and describe 2-D shapes using attributes.",
    thinkingSteps: [
      "Look at each shape.",
      "Check the sides and corners.",
      "Choose the shape with 4 equal sides.",
    ],
    mistakeIfWrong: "Needs support identifying shape attributes.",
    hint: "A square has 4 equal sides.",
    hint2: "Look for the shape with straight equal sides.",
  },
  {
    id: "geometry-shapes-sort-1",
    prompt: "Which attribute could sort these shapes?",
    difficulty: "challenge",
    answers: ["Curved sides or straight sides", "Colour only", "How heavy it is"],
    correct: "Curved sides or straight sides",
    outcome: "G01",
    indicator: "G01.02",
    skill: "Sort shapes by attributes",
    visualType: "geometry",
    modelLabel: "square, circle, triangle",
    curriculumText: "Sort 2-D shapes using observable attributes.",
    thinkingSteps: [
      "Look at the shapes carefully.",
      "Notice sides and curves.",
      "Choose an attribute that describes the shapes.",
    ],
    mistakeIfWrong: "Needs support sorting shapes by attributes.",
    hint: "Use what you can see.",
    hint2: "Sides and curves are shape attributes.",
  },
  {
    id: "geometry-measurement-area-1",
    prompt: "How many square units cover the shape?",
    difficulty: "easy",
    answers: ["6 square units", "5 square units", "7 square units"],
    correct: "6 square units",
    outcome: "M01",
    indicator: "M01.01",
    skill: "Understand area with square units",
    visualType: "measurement",
    modelLabel: "six equal unit blocks",
    curriculumText: "Measure area using equal square units.",
    thinkingSteps: [
      "Look at the unit squares.",
      "Count each equal unit.",
      "Choose the total number of square units.",
    ],
    mistakeIfWrong: "Needs support counting equal area units.",
    hint: "Each square counts as one unit.",
    hint2: "Count all the squares that cover the shape.",
  },
  {
    id: "geometry-measurement-perimeter-1",
    prompt: "What does perimeter mean?",
    difficulty: "easy",
    answers: ["Distance around a shape", "Space inside a shape", "Number of corners"],
    correct: "Distance around a shape",
    outcome: "M01",
    indicator: "M01.02",
    skill: "Understand perimeter",
    visualType: "measurement",
    modelLabel: "six equal unit blocks",
    curriculumText: "Describe perimeter as the distance around a shape.",
    thinkingSteps: [
      "Think about the outside edge.",
      "Perimeter goes around the shape.",
      "Choose the answer that means distance around.",
    ],
    mistakeIfWrong: "Needs support understanding perimeter.",
    hint: "Perimeter is around the outside.",
    hint2: "Area is inside. Perimeter is around.",
  },
];

const ALL_QUESTIONS = [
  ...GEOMETRY_PATHWAY_QUESTIONS,
  ...NUMBER_PATHWAY_QUESTIONS,
  ...DATA_PATHWAY_QUESTIONS,
  ...EXTRA_DATA_PATHWAY_QUESTIONS,
  ...EXTRA_PATTERN_PATHWAY_QUESTIONS,
  ...EXTRA_NUMBER_PATHWAY_QUESTIONS,
  ...EXTRA_GEOMETRY_PATHWAY_QUESTIONS,
  ...Object.values(QUESTION_BANK).flat(),
  ...GRADE2_GENERATED_QUESTIONS,
].map(addVisualDataToQuestion);
const OUTCOMES = Object.keys(INDICATOR_CATALOG);
const DEFAULT_STUDENT_STATE = {
  studentScreen: "strands",
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
const [selectedStrand, setSelectedStrand] = useState("Geometry");
const [selectedPathwaySkill, setSelectedPathwaySkill] = useState(null);

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
    const [supportUsage, setSupportUsage] = useState(DEFAULT_STUDENT_STATE.supportUsage);
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
  const showStudentChrome =
  studentScreen !== "lesson" &&
  studentScreen !== "strands";

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
        setSupportUsage(
      data.supportUsage ?? {
        readAloudUsed: 0,
        exampleOpened: 0,
        reminderOpened: 0,
      }
    );
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
            supportUsage,
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

const pathwaySkillQuestions = useMemo(() => {
  if (!selectedPathwaySkill) return null;

  const pathwayRules = {
    shapes: {
      visualTypes: ["geometry"],
      keywords: ["shape", "2-d", "3-d", "side", "corner", "attribute"],
    },
    angles: {
      visualTypes: ["geometry"],
      keywords: ["angle", "corner", "turn"],
    },
    area: {
      visualTypes: ["measurement"],
      keywords: ["area", "cover", "square unit"],
    },
    perimeter: {
      visualTypes: ["measurement"],
      keywords: ["perimeter", "around", "distance around"],
    },

    counting: {
      visualTypes: ["numberLine", "baseTen", "tallies"],
      keywords: ["count", "number", "tens", "ones", "tally"],
    },
    comparing: {
      visualTypes: ["numberLine", "baseTen"],
      keywords: ["compare", "greater", "less", "order", "least", "most"],
    },
    skipCounting: {
      visualTypes: ["numberLine", "tallies"],
      keywords: ["skip", "sequence", "pattern", "count by"],
    },
    numberLine: {
      visualTypes: ["numberLine"],
      keywords: ["number line", "missing", "sequence", "order"],
    },

    patterns: {
      visualTypes: ["pattern"],
      keywords: ["pattern", "repeat", "core"],
    },
    repeatingPatterns: {
      visualTypes: ["pattern"],
      keywords: ["repeat", "repeating", "core"],
    },
    growingPatterns: {
      visualTypes: ["pattern"],
      keywords: ["growing", "increase", "change"],
    },

    graphs: {
      visualTypes: ["graph"],
      keywords: ["graph", "bar", "data", "votes", "tallest"],
    },
    compareData: {
      visualTypes: ["graph"],
      keywords: ["compare", "most", "least", "more", "fewer", "data"],
    },
  };

  const rule = pathwayRules[selectedPathwaySkill];

  if (!rule) return null;

  const matches = activeAllQuestions.filter((question) => {
    if (!rule.visualTypes.includes(question.visualType)) return false;

    const searchableText = [
      question.prompt,
      question.skill,
      question.curriculumText,
      question.indicator,
      question.modelLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return rule.keywords.some((keyword) =>
      searchableText.includes(keyword)
    );
  });

  const fallbackMatches = activeAllQuestions.filter((question) =>
    rule.visualTypes.includes(question.visualType)
  );

  const sourceQuestions = matches.length ? matches : fallbackMatches;

  const groupedByVisualType = rule.visualTypes.map((visualType) =>
    sourceQuestions.filter((question) => question.visualType === visualType)
  );

  const easyQuestions = sourceQuestions.filter(
  (question) => question.difficulty !== "challenge"
);

const challengeQuestions = sourceQuestions.filter(
  (question) => question.difficulty === "challenge"
);

const groupedEasy = rule.visualTypes.map((visualType) =>
  easyQuestions.filter((question) => question.visualType === visualType)
);

const groupedChallenge = rule.visualTypes.map((visualType) =>
  challengeQuestions.filter((question) => question.visualType === visualType)
);

const balancedQuestions = [];

for (let round = 0; round < 6; round += 1) {
  groupedEasy.forEach((group) => {
    if (group[round] && balancedQuestions.length < 4) {
      balancedQuestions.push(group[round]);
    }
  });
}

for (let round = 0; round < 6; round += 1) {
  groupedChallenge.forEach((group) => {
    if (group[round] && balancedQuestions.length < 6) {
      balancedQuestions.push(group[round]);
    }
  });
}

if (balancedQuestions.length < 6) {
  sourceQuestions.forEach((question) => {
    const alreadyIncluded = balancedQuestions.some(
      (item) => item.id === question.id
    );

    if (!alreadyIncluded && balancedQuestions.length < 6) {
      balancedQuestions.push(question);
    }
  });
}

  console.log("PATHWAY DEBUG", {
    selectedPathwaySkill,
    visualTypes: rule.visualTypes,
    keywordMatches: matches.length,
    returned: balancedQuestions.length,
    availableVisualTypes: [...new Set(activeAllQuestions.map((q) => q.visualType))],
  });

  return balancedQuestions.length ? balancedQuestions : null;
}, [selectedPathwaySkill, activeAllQuestions]);

const questions =
  pathwaySkillQuestions
    ? pathwaySkillQuestions
    : assessmentMode && assessmentQueue.length > 0
    ? assessmentQueue
    : practiceMode && practiceQueue.length > 0
    ? practiceQueue
    : weakOutcomeQuestions || generatedSkillQuestions || QUESTION_BANK[skill] || activeAllQuestions.filter((q) => q.outcome === "N01").slice(0, 6) || [];
  const question = questions[questionIndex] ?? questions[0] ?? null;
 const currentAssignment = teacherAssignments[currentStudent];
const currentNextStep = getStudentNextStep(currentStudent, indicatorStats, assessmentStats, teacherAssignments);
const currentTodayPlan = getStudentTodayPlan(currentStudent, indicatorStats, assessmentStats, teacherAssignments);

const STRAND_ICONS = {
  Geometry: "🔷",
  Measurement: "📏",
  Patterns: "🔁",
  Number: "🔢",
  Data: "📊",
};

const STRAND_THEMES = {
  Geometry: {
    accent: "#6366f1",
    soft: "#eef2ff",
    border: "#c7d2fe",
  },
  Measurement: {
    accent: "#16a34a",
    soft: "#ecfdf3",
    border: "#bbf7d0",
  },
  Patterns: {
    accent: "#ea580c",
    soft: "#fff7ed",
    border: "#fed7aa",
  },
  Number: {
    accent: "#2563eb",
    soft: "#eff6ff",
    border: "#bfdbfe",
  },
  Data: {
    accent: "#0f766e",
    soft: "#f0fdfa",
    border: "#99f6e4",
  },
};

const STRAND_PATHWAYS = {
  Geometry: [
    {
      id: "shapes",
      icon: "🔷",
      title: "Shapes",
      description: "Explore 2D and 3D shapes.",
      progress: 65,
      currentFocus: true,
      completed: false,
    },
    {
      id: "area",
      icon: "▦",
      title: "Area",
      description: "Understand space inside shapes.",
      progress: 100,
      currentFocus: false,
      completed: true,
    },
    {
      id: "perimeter",
      icon: "📏",
      title: "Perimeter",
      description: "Measure around shapes.",
      progress: 10,
      currentFocus: false,
    },
    {
      id: "angles",
      icon: "∠",
      title: "Angles",
      description: "Learn about turns and corners.",
      progress: 0,
      currentFocus: false,
    },
    {
      id: "symmetry",
      icon: "🪞",
      title: "Symmetry",
      description: "Coming soon after shapes and angles.",
      progress: 0,
      currentFocus: false,
      locked: true,
    },
    {
      id: "building",
      icon: "🧱",
      title: "Build & Compare",
      description: "Use shapes to build and compare designs.",
      progress: 0,
      currentFocus: false,
      locked: true,
    },
  ],

  Number: [
    {
      id: "counting",
      icon: "🔢",
      title: "Counting",
      description: "Count forward and backward using models.",
      progress: 35,
      currentFocus: true,
    },
    {
      id: "skipCounting",
      icon: "⏭️",
      title: "Skip Counting",
      description: "Find patterns while counting by numbers.",
      progress: 20,
      currentFocus: false,
    },
    {
      id: "comparing",
      icon: "⚖️",
      title: "Comparing Numbers",
      description: "Compare and order numbers.",
      progress: 10,
      currentFocus: false,
    },
    {
      id: "numberLine",
      icon: "➖",
      title: "Number Line",
      description: "Use number lines to think about numbers.",
      progress: 0,
      currentFocus: false,
    },
  ],

  Patterns: [
    {
      id: "patterns",
      icon: "🔁",
      title: "Repeating Patterns",
      description: "Find what repeats.",
      progress: 40,
      currentFocus: true,
    },
    {
      id: "growingPatterns",
      icon: "📈",
      title: "Growing Patterns",
      description: "Look for what changes each step.",
      progress: 15,
      currentFocus: false,
    },
    ],

  Data: [
    {
      id: "graphs",
      icon: "📊",
      title: "Graphs",
      description: "Read and compare simple graphs.",
      progress: 20,
      currentFocus: true,
    },
    {
      id: "compareData",
      icon: "🔎",
      title: "Compare Data",
      description: "Look at categories and amounts.",
      progress: 0,
      currentFocus: false,
    },
  ],
};

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

    const role = question.practiceRole || "general";

const isCorrect =
  question.type === "multi-step"
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

    const roleStats = {
  focus: { attempts: prev.roleStats?.focus?.attempts || 0, correct: prev.roleStats?.focus?.correct || 0 },
  support: { attempts: prev.roleStats?.support?.attempts || 0, correct: prev.roleStats?.support?.correct || 0 },
  review: { attempts: prev.roleStats?.review?.attempts || 0, correct: prev.roleStats?.review?.correct || 0 },
  general: { attempts: prev.roleStats?.general?.attempts || 0, correct: prev.roleStats?.general?.correct || 0 },
};

    const roleKey = role.toLowerCase();

    if (!roleStats[roleKey]) {
      roleStats[roleKey] = { attempts: 0, correct: 0 };
    }

    roleStats[roleKey].attempts += 1;
    if (isCorrect) roleStats[roleKey].correct += 1;

    return {
      ...prev,
      attempts: (prev.attempts || 0) + 1,
      correct: (prev.correct || 0) + (isCorrect ? 1 : 0),
      wrong: (prev.wrong || 0) + (isCorrect ? 0 : 1),
      roleStats,
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
const totalSupportUses =
  (supportUsage?.readAloudUsed || 0) +
  (supportUsage?.exampleOpened || 0) +
  (supportUsage?.reminderOpened || 0);

const supportInsight =
  totalSupportUses >= 5
    ? "High support use during this practice session. Consider a short teacher check-in before increasing independence."
    : supportUsage?.exampleOpened >= 3
    ? "Worked examples were used repeatedly. Student may benefit from guided modelling before independent practice."
    : supportUsage?.readAloudUsed >= 3
    ? "Read-aloud support was used repeatedly. Continue monitoring independent reading/access needs."
    : supportUsage?.reminderOpened >= 3
    ? "Strategy reminders were used repeatedly. Student may benefit from a quick review of the key strategy."
    : totalSupportUses > 0
    ? "Student used available supports during practice."
    : "Student completed practice without opening recorded supports.";
    const status = accuracy >= 80 ? "Improved" : "Needs more practice";
const completedAt = new Date().toLocaleDateString();
const nextStep =
  accuracy >= 80
    ? "Continue with the next skill or assign a mastery check."
    : "Review the missed skill and assign a short targeted practice cycle.";
    const result = {
  type: "Practice",
  target,
  accuracy,
  attempts,
  correct,
  roleStats: practiceSession?.roleStats || null,
  supportUsage,
  supportInsight,
  status,
  completedAt,
  nextStep,
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
if (totalSupportUses >= 5) {
  addInterventionLog({
    student: currentStudent,
    type: "Needs Support",
    target,
    action: "High Support Use",
    note: supportInsight,
    source: "Support Analytics",
    status: "Teacher Follow-Up Recommended",
  });
}
    setCompletionResult(result);
    console.log("Practice completion result:", result);
    // 🔥 AUTO COMPLETE ASSIGNMENT (EXACT PATCH)

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

setSupportUsage({
  readAloudUsed: 0,
  exampleOpened: 0,
  reminderOpened: 0,
});

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

  @keyframes lessonCardEnter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.99);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes xpFloat {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
     @keyframes xpLevelPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.16);
    }
    100% {
      transform: scale(1.12);
    }
  }
    @keyframes lessonSuccessPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.015);
  }
  100% {
    transform: scale(1.01);
  }
}
  @keyframes lessonSupportShake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  50% {
    transform: translateX(3px);
  }
  75% {
    transform: translateX(-2px);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes correctAnswerGlow {
  0% {
    transform: scale(1.02);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1.03);
  }
}

@keyframes strandFocusPulse {
  0% {
    box-shadow: 0 14px 34px rgba(99,102,241,0.18);
  }

  50% {
    box-shadow: 0 18px 40px rgba(99,102,241,0.28);
  }

  100% {
    box-shadow: 0 14px 34px rgba(99,102,241,0.18);
  }
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
selectedStrand={selectedStrand}
setSelectedStrand={setSelectedStrand}
selectedPathwaySkill={selectedPathwaySkill}
setSelectedPathwaySkill={setSelectedPathwaySkill}
STRAND_PATHWAYS={STRAND_PATHWAYS}
STRAND_THEMES={STRAND_THEMES}
STRAND_ICONS={STRAND_ICONS}
skill={skill}
setSkill={setSkill}
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
    practiceSession={practiceSession}
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
  selectedStrand,
  setSelectedStrand,
  selectedPathwaySkill,
setSelectedPathwaySkill,
STRAND_PATHWAYS,
STRAND_THEMES,
STRAND_ICONS,
skill,
setSkill,
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
  practiceSession,
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
  const showStudentChrome =
    screen !== "lesson" &&
    screen !== "strands";

    if (!question) {
    return (
      <div style={styles.main}>
        <Card title="Loading Question">
          <p>No question is available yet.</p>
        </Card>
      </div>
    );
  }

  const normalizedQuestion = addVisualDataToQuestion(question);

const lessonQuestion =
  applyAdaptationsToQuestion(
    normalizedQuestion,
    currentAdaptations
  ) || normalizedQuestion;

const detectedFractionMatch =
  lessonQuestion.prompt?.match(/(\d+)\/(\d+)/);

const detectedTarget = detectedFractionMatch
  ? Number(detectedFractionMatch[1])
  : 1;

const detectedTotal = detectedFractionMatch
  ? Number(detectedFractionMatch[2])
  : 4;

const effectiveTapBoxModel =
  lessonQuestion.tapBoxModel ||
  (lessonQuestion.visualType === "fraction_model"
    ? {
        total: detectedTotal,
        target: detectedTarget,
      }
    : null);

const shuffledAnswers = useMemo(() => {
  if (!lessonQuestion?.answers) return [];

  return [...lessonQuestion.answers].sort(() => Math.random() - 0.5);
}, [lessonQuestion?.prompt]);

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

const lessonProgressPercent = Math.min(
  100,
  Math.round(((questionIndex + 1) / Math.max(totalQuestions, 1)) * 100)
);

const pathwayBadge = selectedPathwaySkill
  ? getPathwayBadge(selectedPathwaySkill)
  : null;

  const pathwayProgressMessage = getPathwayProgressMessage(
  questionIndex,
  totalQuestions
);

const lessonXp = correctStreak * 10 + questionIndex * 5;
const earnedXpThisQuestion = answerState === "correct" ? 10 : 0;
const displayedLessonXp = lessonXp + earnedXpThisQuestion;
const lessonLevel = Math.floor(displayedLessonXp / 50) + 1;
const xpToNextLevel = 50 - (displayedLessonXp % 50 || 50);
const leveledUp = answerState === "correct" && displayedLessonXp > 0 && displayedLessonXp % 50 === 0;
const lessonAlmostComplete = questionIndex + 1 >= totalQuestions;

const lessonProgressTitle = lessonAlmostComplete
  ? "Finish Strong"
  : correctStreak >= 3
  ? "Combo Run"
  : answerState === "correct"
  ? "Math Power Up"
  : "Lesson Progress";

const lessonConfidenceMessage = lessonAlmostComplete
  ? "You are almost done this lesson."
  : correctStreak >= 3
  ? "You are building a strong streak."
  : answerState === "correct"
  ? "That answer added to your progress."
  : "Take your time and use the visual model.";

const lessonMoodIcon = lessonAlmostComplete
  ? "🏁"
  : correctStreak >= 3
  ? "🔥"
  : answerState === "correct"
  ? "⭐"
  : "🧠";

const lessonStatusText =
  answerState === "correct"
    ? "Great thinking!"
    : answerState === "wrong"
    ? "Learning in progress"
    : selected
    ? "Checking your thinking..."
    : "Choose an answer to continue";

const lessonGoalText =
  question?.visualType === "tapBoxFraction"
    ? "Goal: shade the correct fraction amount."
    : question?.visualType === "fraction_model"
    ? "Goal: use the fraction model carefully."
    : question?.visualType === "baseTen"
    ? "Goal: count tens and ones carefully."
    : question?.visualType === "numberLine"
    ? "Goal: follow the number pattern."
    : question?.visualType === "coins"
    ? "Goal: add the coin values together."
        : question?.visualType === "geometry"
    ? "Goal: use the shapes to help your thinking."
    : question?.visualType === "graph"
    ? "Goal: read the graph carefully."
    : "Goal: use the model, then choose the best answer.";
const encouragementMessages = [
  "You are building strong math habits.",
  "Take your time and use the visual.",
  "Each question helps your brain grow.",
  "You are making progress one step at a time.",
  "Math confidence comes from practice.",
];

const rotatingEncouragement =
  encouragementMessages[questionIndex % encouragementMessages.length];
  const guideMessage =
  answerState === "correct"
    ? "Guide: I saw your thinking pay off."
    : answerState === "wrong"
    ? "Guide: Let’s use the visual and try the idea again."
    : "Guide: Look at the model before you answer.";
const outcomePathDisplays = OUTCOMES.map((outcome) =>
  getOutcomeDisplay(indicatorStats, assessmentStats, currentStudent, outcome)
);

const latestTeacherMove = [...(interventionLog || [])]
  .filter(
    (entry) =>
      entry &&
      (entry.source === "Teacher" ||
        entry.source === "Live Dashboard" ||
        entry.type === "Teacher Note" ||
        entry.type === "Small Group" ||
        entry.type === "Teacher Assignment")
  )
  .slice(-1)[0] || null;

  const activeStrandTheme =
  STRAND_THEMES[selectedStrand] || STRAND_THEMES.Number;

  const navItems = [
    { id: "today", label: "Today", helper: "Next step" },
    { id: "lesson", label: "Lesson", helper: `${questionIndex + 1}/${totalQuestions}` },
    { id: "strands", label: "Path", helper: "Math Worlds" },
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
      {showStudentChrome && (
  <>
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
  </>
)}
{screen === "strands" && (
  <Card title="Choose Your Math World">
    <div style={{ textAlign: "center", marginBottom: 18 }}>
      <p style={styles.eyebrowDark}>Start learning</p>

      <h2
        style={{
          margin: "6px 0 8px",
          fontSize: "clamp(28px, 6vw, 42px)",
          lineHeight: 1.05,
          fontWeight: 950,
          color: "#0f172a",
          letterSpacing: "-0.03em",
        }}
      >
        Choose your math path
      </h2>

      <p
        style={{
          ...styles.sectionIntro,
          margin: "0 auto",
          maxWidth: 520,
        }}
      >
        Pick one area. We’ll guide you one step at a time.
      </p>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
      }}
    >
      {[
  {
    icon: "🔢",
    title: "Number",
    note: "Numbers and operations",
    progress: 100,
    completed: true,
  },
  {
    icon: "🔁",
    title: "Patterns",
    note: "Patterns and rules",
    progress: 28,
  },
  {
    icon: "📏",
    title: "Measurement",
    note: "Length, time, money",
    progress: 41,
  },
  {
    icon: "🔷",
    title: "Geometry",
    note: "Shapes and space",
    progress: 42,
    currentFocus: true,
  },
  {
    icon: "📊",
    title: "Data",
    note: "Graphs and chance",
    progress: 12,
    locked: false,
  },
]
     
    .map((strand) => (
     <button
  key={strand.title}
  type="button"
  onMouseEnter={(e) => {
  if (strand.locked) return;

  e.currentTarget.style.transform = "translateY(-2px)";

  const action = e.currentTarget.querySelector(".strand-action");

  if (action) {
    action.style.transform = "scale(1.03)";
  }

  e.currentTarget.style.boxShadow = "0 14px 30px rgba(15,23,42,0.10)";
}}
  onMouseLeave={(e) => {
  if (strand.locked) return;

  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = strand.currentFocus
    ? "0 14px 34px rgba(99,102,241,0.18)"
    : "0 8px 20px rgba(15,23,42,0.06)";
}}
  onClick={() => {
  if (strand.locked) return;

  setSelectedStrand(strand.title);
  setSelectedPathwaySkill(null);
  setScreen("strand-pathway");
}}
  style={{
    minHeight: 170,
    padding: 22,
    borderRadius: 24,
   border: strand.completed
  ? "2px solid #86efac"
  : strand.currentFocus
  ? "2px solid #6366f1"
  : "1px solid #dbeafe",
background: strand.completed
  ? "linear-gradient(180deg, #ffffff, #f0fdf4)"
  : strand.currentFocus
  ? "linear-gradient(180deg, #ffffff, #eef2ff)"
  : "linear-gradient(180deg, #ffffff, #f8fafc)",
boxShadow: strand.currentFocus
  ? "0 14px 34px rgba(99,102,241,0.18)"
  : "0 8px 20px rgba(15,23,42,0.06)",
    cursor: strand.locked ? "not-allowed" : "pointer",
opacity: strand.locked ? 0.58 : 1,
textAlign: "left",
transition: "all 0.18s ease",
transform: "translateY(0)",
animation: strand.currentFocus
  ? "strandFocusPulse 2.6s ease-in-out infinite"
  : "none",
}}
>
  <div
  style={{
    fontSize: 54,
    marginBottom: 12,
  }}
>
  {strand.icon}
</div>

{strand.completed && (
  <div
    style={{
      display: "inline-block",
      marginBottom: 10,
      padding: "5px 10px",
      borderRadius: 999,
      background: "#dcfce7",
      color: "#15803d",
      border: "1px solid #86efac",
      fontSize: 11,
      fontWeight: 950,
    }}
  >
    ✓ Completed
  </div>
)}

{strand.locked && (
  <div
    style={{
      display: "inline-block",
      marginBottom: 10,
      padding: "5px 10px",
      borderRadius: 999,
      background: "#f1f5f9",
      color: "#64748b",
      border: "1px solid #e2e8f0",
      fontSize: 11,
      fontWeight: 950,
    }}
  >
    Coming Soon
  </div>
)}

{strand.currentFocus && (
  <div
    style={{
      display: "inline-block",
      marginBottom: 10,
      padding: "5px 10px",
      borderRadius: 999,
      background: "#eef2ff",
      color: "#4338ca",
      border: "1px solid #c7d2fe",
      fontSize: 11,
      fontWeight: 950,
    }}
  >
    Current Class Focus
  </div>
)}
          <div
            style={{
              fontSize: 22,
              fontWeight: 950,
              color: "#0f172a",
            }}
          >
            {strand.title}
          </div>

          {strand.currentFocus && (
  <div
    style={{
      marginBottom: 10,
      fontSize: 12,
      fontWeight: 900,
      color: "#4338ca",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }}
  >
    Teacher Recommended
  </div>
)}

          <div
  style={{
    marginTop: 6,
    fontSize: 14,
    fontWeight: 700,
    color: "#64748b",
  }}
>
  {strand.note}
</div>

<div
  style={{
    marginTop: 14,
  }}
>
  <div
    style={{
      height: 10,
      borderRadius: 999,
      background: "#e2e8f0",
      overflow: "hidden",
      marginBottom: 6,
    }}
  >
    <div
      style={{
        width: `${strand.progress || 0}%`,
        height: "100%",
        borderRadius: 999,
       background: strand.locked
  ? "#cbd5e1"
  : strand.currentFocus
  ? "#6366f1"
  : "#2563eb",
      }}
    />
  </div>

  <div
    style={{
      fontSize: 12,
      fontWeight: 900,
      color: "#64748b",
    }}
  >
    {strand.progress || 0}% explored
  </div>

  <div
    style={{
      marginTop: 6,
      fontSize: 11,
      fontWeight: 800,
      color: "#94a3b8",
    }}
  >
    {strand.currentFocus
  ? "👥 Most students are here right now"
  : strand.locked
  ? "🔒 Unlocks later"
  : "✨ Available to explore"}
  </div>
</div>

          <div
  className="strand-action"
  style={{
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 14,
    background: strand.locked
  ? "#f1f5f9"
  : strand.currentFocus
  ? "#4338ca"
  : "#0f172a",
    color: strand.locked
  ? "#64748b"
  : "#ffffff",
    fontWeight: 900,
    textAlign: "center",
    fontSize: 13,
  }}
>
  {strand.locked
  ? "Coming Soon"
  : strand.completed
  ? "Review Pathway"
  : strand.currentFocus
  ? "Continue Learning"
  : "Start Pathway"}
</div>

</button>
              ))}
    </div>
  </Card>
)}

<div
  style={{
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 16,
  }}
>
  <button
    type="button"
    onClick={() => setScreen("strands")}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      borderRadius: 999,
      border: `1px solid ${activeStrandTheme.border}`,
      background: "#ffffff",
      color: activeStrandTheme.accent,
      fontWeight: 900,
      cursor: "pointer",
    }}
  >
    ← Back to Strands
  </button>
</div>

            {screen === "strand-pathway" && (
        <Card title={`${selectedStrand} Pathway`}>
         
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  }}
>
  <span>Math Worlds</span>

  <span style={{ opacity: 0.45 }}>→</span>

  <span style={{ color: activeStrandTheme.accent }}>
    {selectedStrand}
  </span>
</div>

            <h2
              style={{
                margin: "6px 0 10px",
                fontSize: "clamp(30px, 6vw, 46px)",
                lineHeight: 1.05,
                fontWeight: 950,
                color: "#0f172a",
                letterSpacing: "-0.03em",
              }}
            >
              {selectedStrand}
            </h2>

            <p
              style={{
                ...styles.sectionIntro,
                maxWidth: 540,
                margin: "0 auto",
              }}
            >
              Choose a skill pathway to continue building understanding.
            </p>
            <div
  style={{
    marginTop: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    transition: "all 0.18s ease",
  }}
>
  <span>Complete skills</span>

  <div
    style={{
      width: 18,
      height: 2,
      borderRadius: 999,
      background: activeStrandTheme.border,
    }}
  />

  <span>Build confidence</span>

  <div
    style={{
      width: 18,
      height: 2,
      borderRadius: 999,
      background: activeStrandTheme.border,
    }}
  />

  <span>Unlock assessment</span>
</div>
          </div>

<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 26,
  }}
>
  {(STRAND_PATHWAYS[selectedStrand] || []).map((step, index, arr) => (
    <div
      key={step.id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
     <div
  style={{
    display: "grid",
    justifyItems: "center",
    gap: 6,
  }}
>
  <div
    style={{
      width: 38,
      height: 38,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      fontWeight: 900,
      background: step.locked
  ? "#f1f5f9"
  : step.currentFocus
  ? activeStrandTheme.accent
  : step.completed
  ? "#dcfce7"
  : activeStrandTheme.soft,
        boxShadow: step.currentFocus
  ? `0 0 0 6px ${activeStrandTheme.soft}`
  : "none",

transform: step.currentFocus
  ? "scale(1.08)"
  : "scale(1)",

transition: "all 0.22s ease",
      color: step.locked
  ? "#94a3b8"
  : step.currentFocus
  ? "#ffffff"
  : step.completed
  ? "#15803d"
  : activeStrandTheme.accent,
      border: `2px solid ${
        step.locked ? "#e2e8f0" : activeStrandTheme.border
      }`,
    }}
  >
   {step.completed ? "✓" : step.icon}
  </div>

  <div
    style={{
      fontSize: 11,
      fontWeight: 900,
      color: step.locked ? "#94a3b8" : "#334155",
      maxWidth: 70,
      textAlign: "center",
      lineHeight: 1.15,
    }}
  >
    {step.title}
  </div>
</div>

      {index < arr.length - 1 && (
        <div
          style={{
            width: 34,
            height: 4,
            borderRadius: 999,
            background: step.locked
              ? "#e2e8f0"
              : activeStrandTheme.border,
          }}
        />
      )}
    </div>
  ))}
</div>
<div
  style={{
    marginBottom: 22,
    padding: "14px 18px",
    borderRadius: 20,
    background: activeStrandTheme.soft,
    border: `1px solid ${activeStrandTheme.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  }}
>
  <div>
    <div
      style={{
        fontSize: 12,
        fontWeight: 900,
        color: activeStrandTheme.accent,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      Suggested Next
    </div>

    <div
      style={{
        fontSize: 18,
        fontWeight: 950,
        color: "#0f172a",
      }}
    >
      Continue building confidence with{" "}
{(
  (STRAND_PATHWAYS[selectedStrand] || []).find(
    (step) => step.currentFocus
  )?.title || "this skill"
)}
    </div>
  </div>

  <div
    style={{
      padding: "10px 14px",
      borderRadius: 999,
      background: "#ffffff",
      border: `1px solid ${activeStrandTheme.border}`,
      fontWeight: 900,
      color: activeStrandTheme.accent,
      fontSize: 13,
    }}
  >
      {(
  (STRAND_PATHWAYS[selectedStrand] || []).find(
    (step) => step.currentFocus
  )?.title || "Current"
)}{" "}
Focus
  </div>
</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {(STRAND_PATHWAYS[selectedStrand] || []).map((skillCard) => (
              <button
                key={skillCard.id}
                type="button"
                onClick={() => {
  if (skillCard.locked) return;

  setSelectedPathwaySkill(skillCard.id);

  if (["shapes", "angles"].includes(skillCard.id)) {
    setSkill("geometry");
  }

  if (["area", "perimeter"].includes(skillCard.id)) {
    setSkill("measurement");
  }

  if (
    skillCard.id === "counting" ||
    skillCard.id === "skipCounting" ||
    skillCard.id === "comparing" ||
    skillCard.id === "numberLine"
  ) {
    setSkill("numbers");
  }

  if (
  skillCard.id === "graphs" ||
  skillCard.id === "compareData"
) {
  setSkill("data");
}

  setScreen("lesson");
}}
onMouseEnter={(e) => {
  if (skillCard.locked) return;

  e.currentTarget.style.transform = "translateY(-4px)";
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0)";
}}
                style={{
                  padding: 20,
                  borderRadius: 26,
                  border: skillCard.completed
  ? "2px solid #86efac"
  : skillCard.currentFocus
  ? `2px solid ${activeStrandTheme.accent}`
  : "1px solid #dbeafe",
                  background: skillCard.completed
  ? "linear-gradient(180deg, #ffffff, #f0fdf4)"
  : skillCard.currentFocus
  ? `linear-gradient(180deg, #ffffff, ${activeStrandTheme.soft})`
  : "linear-gradient(180deg, #ffffff, #f8fafc)",
                 boxShadow: skillCard.completed
  ? "0 14px 30px rgba(134,239,172,0.25)"
  : skillCard.currentFocus
  ? `0 14px 30px ${activeStrandTheme.border}`
  : "0 8px 20px rgba(15,23,42,0.06)",
                  textAlign: "left",
                  cursor: skillCard.locked ? "not-allowed" : "pointer",
opacity: skillCard.locked ? 0.62 : 1,
                  transition: "all 0.22s ease",
transform: "translateY(0)",
                }}
              >
                <div
                  style={{
                    fontSize: 46,
                    marginBottom: 14,
                  }}
                >
                  {skillCard.icon}
                </div>

{skillCard.completed && (
  <div
    style={{
      display: "inline-block",
      marginBottom: 10,
      padding: "5px 10px",
      borderRadius: 999,
      background: "#dcfce7",
      color: "#15803d",
      border: "1px solid #86efac",
      fontSize: 11,
      fontWeight: 950,
    }}
  >
    ✓ Completed
  </div>
)}

{skillCard.locked && (
  <div
    style={{
      display: "inline-block",
      marginBottom: 10,
      padding: "5px 10px",
      borderRadius: 999,
      background: "#f1f5f9",
      color: "#64748b",
      fontSize: 11,
      fontWeight: 950,
    }}
  >
    Coming Soon
  </div>
)}

                {skillCard.currentFocus && (
                  <div
                    style={{
                      display: "inline-block",
                      marginBottom: 10,
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: activeStrandTheme.soft,
color: activeStrandTheme.accent,
border: `1px solid ${activeStrandTheme.border}`,
fontSize: 11,
                      fontWeight: 950,
                    }}
                  >
                    Current Focus
                  </div>
                )}

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 950,
                    color: "#0f172a",
                    marginBottom: 8,
                  }}
                >
                  {skillCard.title}
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.45,
                    marginBottom: 18,
                  }}
                >
                  {skillCard.description}
                </div>

                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "#e2e8f0",
                    overflow: "hidden",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: `${skillCard.progress}%`,
                      height: "100%",
                      background: "#6366f1",
                      borderRadius: 999,
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#475569",
                    marginBottom: 14,
                  }}
                >
                  {skillCard.progress}% explored
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    padding: "12px 14px",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontWeight: 900,
                    textAlign: "center",
                  }}
                >
                  {skillCard.locked ? "Coming Soon" : "Continue"}
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={() => setStudentScreen("strands")}
              style={styles.secondary}
            >
              ← Back to strands
            </button>
          </div>
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
  <Card
  title={
    selectedPathwaySkill
      ? `${selectedStrand} Pathway · ${
          selectedPathwaySkill.charAt(0).toUpperCase() +
          selectedPathwaySkill.slice(1)
        }`
      : `Question ${questionIndex + 1}/${totalQuestions}`
  }
><LessonPathwayBanner
  selectedPathwaySkill={selectedPathwaySkill}
  selectedStrand={selectedStrand}
  activeStrandTheme={activeStrandTheme}
  onReturnToPathway={() => setScreen("strand-pathway")}
/>
  <div
    key={question?.id || questionIndex}
    style={{
      animation: "lessonCardEnter 0.22s ease",
    }}
  >
   <LessonTopBar
  questionIndex={questionIndex}
  totalQuestions={totalQuestions}
  displayedLessonXp={displayedLessonXp}
  lessonLevel={lessonLevel}
  lessonProgressPercent={lessonProgressPercent}
/>
<PathwayLessonHeader
  selectedPathwaySkill={selectedPathwaySkill}
  questionIndex={questionIndex}
  totalQuestions={totalQuestions}
/>
<details style={{ marginBottom: 14 }}>
  <summary
  style={{
    cursor: "pointer",
    fontWeight: 900,
    color: "#334155",
    fontSize: 13,
    marginBottom: 10,
    listStyle: "none",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "8px 12px",
    width: "fit-content",
  }}
>
  💡 Need help?
</summary>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
  <div
    style={{
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 2,
    }}
  >
    <p style={styles.eyebrowDark}>
      {lessonMoodIcon} {lessonProgressTitle}
    </p>

        <div
      style={{
        borderRadius: 999,
        padding: "4px 9px",
        fontSize: 11,
        fontWeight: 950,
        background:
          question?.difficulty === "challenge"
            ? "#fee2e2"
            : question?.difficulty === "easy"
            ? "#dcfce7"
            : "#dbeafe",
        color:
          question?.difficulty === "challenge"
            ? "#991b1b"
            : question?.difficulty === "easy"
            ? "#166534"
            : "#1e3a8a",
      }}
    >
      {question?.difficulty === "challenge"
        ? "Challenge"
        : question?.difficulty === "easy"
        ? "Warm-Up"
        : "Practice"}
    </div>

        {question?.practiceRole && (
      <div
        style={{
          borderRadius: 999,
          padding: "4px 9px",
          fontSize: 11,
          fontWeight: 950,
          background:
            question.practiceRole === "Focus"
              ? "#eef2ff"
              : "#fef3c7",
          color:
            question.practiceRole === "Focus"
              ? "#3730a3"
              : "#92400e",
        }}
      >
        {question.practiceRole}
      </div>
    )}

    {question?.visualType && (
      <div
        style={{
          borderRadius: 999,
          padding: "4px 9px",
          fontSize: 11,
          fontWeight: 950,
          background: "#f1f5f9",
          color: "#334155",
        }}
      >
        {question.visualType === "tapBoxFraction"
          ? "Tap Model"
          : question.visualType === "fraction_model"
          ? "Fraction Model"
          : question.visualType === "baseTen"
          ? "Base Ten"
          : question.visualType === "numberLine"
          ? "Number Line"
          : question.visualType === "coins"
          ? "Coins"
          : question.visualType === "geometry"
          ? "Geometry"
          : question.visualType === "graph"
          ? "Graph"
          : "Visual"}
      </div>
    )}
  </div>

  <strong>{questionIndex + 1} of {totalQuestions}</strong>

<div
  style={{
    display: "flex",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  }}
>
  {Array.from({ length: totalQuestions }).map((_, index) => {
    const isComplete = index < questionIndex;
    const isCurrent = index === questionIndex;

    return (
      <div
  key={index}
  style={{
    width: isComplete ? 14 : isCurrent ? 18 : 10,
    height: isComplete ? 14 : 10,
    borderRadius: 999,
    background: isComplete
  ? "#22c55e"
  : isCurrent
  ? answerState === "correct"
    ? "#22c55e"
    : "#2563eb"
  : "#cbd5e1",
          transition: "all 0.22s ease",
          boxShadow: isCurrent
  ? answerState === "correct"
    ? "0 0 16px rgba(34,197,94,0.42)"
    : "0 0 12px rgba(37,99,235,0.35)"
  : isComplete
  ? "0 0 10px rgba(34,197,94,0.28)"
  : "none",
display: "grid",
placeItems: "center",
fontSize: 9,
fontWeight: 950,
color: "#ffffff",

}}
>
{isComplete ? "✓" : ""}
</div>
    );
  })}
</div>
<div
  style={{
    marginTop: 3,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
    display: "grid",
    gap: 3,
  }}
>
  <div
  style={{
    display: "grid",
    gap: 2,
  }}
>
  <div>{lessonConfidenceMessage}</div>

  <div
  style={{
    display: "grid",
    gap: 2,
  }}
>
  <div
    style={{
      color: "#64748b",
      fontSize: 12,
      fontWeight: 700,
    }}
  >
    {rotatingEncouragement}
  </div>

  <details
  style={{
    marginTop: 2,
  }}
>
  <summary
    style={{
      cursor: "pointer",
      color: "#1d4ed8",
      fontSize: 12,
      fontWeight: 850,
      listStyle: "none",
    }}
  >
    🦊 Guide tip
  </summary>

  <div
    style={{
      marginTop: 4,
      color: "#334155",
      fontSize: 12,
      fontWeight: 750,
      lineHeight: 1.35,
    }}
  >
    {guideMessage}
  </div>
</details>
</div>
</div>

  <div
  style={{
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    color: "#334155",
    fontWeight: 900,
  }}
>
  <span>{lessonGoalText}</span>

<details>
  <summary
    style={{
      cursor: "pointer",
      borderRadius: 999,
      padding: "4px 8px",
      background: "#ecfeff",
      color: "#155e75",
      border: "1px solid #a5f3fc",
      fontSize: 11,
      fontWeight: 950,
      listStyle: "none",
    }}
  >
    Use the visual
  </summary>

  <div
    style={{
      marginTop: 6,
      color: "#334155",
      fontSize: 12,
      fontWeight: 750,
      lineHeight: 1.35,
    }}
  >
    Look carefully at the model before choosing an answer.
  </div>
</details>

  {(currentAdaptations?.examples ||
    currentAdaptations?.readAloud ||
    currentAdaptations?.formulaSheet ||
    currentAdaptations?.simplifiedNumbers) && (
    <span
      style={{
        borderRadius: 999,
        padding: "4px 8px",
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fde68a",
        fontSize: 11,
        fontWeight: 950,
      }}
    >
      Support Active
    </span>
  )}
</div>
</div>
        </div>

        <div
  style={{
    display: "grid",
    gap: 8,
    justifyItems: "end",
  }}
>
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
  <div
  style={{
    display: "grid",
    gap: 2,
    background: correctStreak > 1 ? "#fff7ed" : "#f8fafc",
    color: correctStreak > 1 ? "#c2410c" : "#334155",
    border: correctStreak > 1 ? "1px solid #fed7aa" : "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 950,
    transform: correctStreak > 1 ? "scale(1.04)" : "scale(1)",
    transition: "all 0.22s ease",
    minWidth: 92,
  }}
>
  <div>🔥 {correctStreak} streak</div>

  {correctStreak >= 3 && (
  <div
    style={{
      display: "grid",
      gap: 4,
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 900,
        color: "#ea580c",
        letterSpacing: 0.4,
      }}
    >
      COMBO BOOST
    </div>

        <div
      style={{
        height: 8,
        borderRadius: 999,
        background: "#e2e8f0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(correctStreak * 20, 100)}%`,
          height: "100%",
          borderRadius: 999,
          background:
            correctStreak >= 3
              ? "linear-gradient(90deg, #22c55e, #16a34a)"
              : "linear-gradient(90deg, #60a5fa, #2563eb)",
          transition: "width 0.22s ease",
        }}
      />
    </div>

    <div
      style={{
        fontSize: 11,
        fontWeight: 850,
        color: correctStreak >= 3 ? "#166534" : "#64748b",
        textAlign: "right",
      }}
    >
      {correctStreak >= 3
        ? "Great focus — keep going."
        : "Build focus with each correct answer."}
    </div>
  </div>
)}
</div>

  <div
    style={{
      background: earnedXpThisQuestion ? "#dcfce7" : "#f8fafc",
      color: earnedXpThisQuestion ? "#166534" : "#334155",
      border: earnedXpThisQuestion ? "1px solid #86efac" : "1px solid #e2e8f0",
      borderRadius: 999,
      padding: "8px 12px",
      fontWeight: 950,
      transform:
  leveledUp
    ? "scale(1.12)"
    : earnedXpThisQuestion
    ? "scale(1.06)"
    : "scale(1)",
transition: "all 0.22s ease",
animation:
  leveledUp
    ? "xpLevelPulse 0.45s ease"
    : "none",
    }}
  >
    ⭐ {displayedLessonXp} XP · Level {lessonLevel}
  </div>
  </div>

  <div
    style={{
      width: 140,
      display: "grid",
      gap: 4,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        fontWeight: 900,
        color: "#475569",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
  <span>Focus</span>

  {correctStreak >= 3 && (
    <span
      style={{
        borderRadius: 999,
        padding: "2px 6px",
        background: "#dcfce7",
        color: "#166534",
        fontSize: 9,
        fontWeight: 950,
      }}
    >
      READY
    </span>
  )}
</div>

<span>{Math.min(correctStreak * 20, 100)}%</span>
    </div>

    <div
      style={{
        height: 8,
        borderRadius: 999,
        background: "#e2e8f0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(correctStreak * 20, 100)}%`,
          height: "100%",
          borderRadius: 999,
          background:
            correctStreak >= 3
              ? "linear-gradient(90deg, #22c55e, #16a34a)"
              : "linear-gradient(90deg, #60a5fa, #2563eb)",
          transition: "width 0.22s ease",
        }}
      />
    </div>
  </div>
</div>

      </div>

      <div
        style={{
          height: 14,
          borderRadius: 999,
          background: "#dbeafe",
          overflow: "hidden",
          border: "1px solid #bfdbfe",
        }}
      >
        <div
  style={{
    width: `${lessonProgressPercent}%`,
    height: "100%",
    borderRadius: 999,
    background:
      answerState === "correct"
        ? "linear-gradient(90deg, #2563eb, #22c55e)"
        : "linear-gradient(90deg, #2563eb, #60a5fa)",
    transition:
      "width 0.35s ease, box-shadow 0.22s ease, transform 0.22s ease",
    boxShadow:
      answerState === "correct"
        ? "0 0 16px rgba(34,197,94,0.55)"
        : "none",
    transform:
      answerState === "correct"
        ? "scaleY(1.08)"
        : "scaleY(1)",
  }}
/>
      </div>

<div
  style={{
    marginTop: 8,
    display: "grid",
    gap: 3,
    color: "#475569",
    fontSize: 13,
    fontWeight: 850,
  }}
>
  <div
  style={{
    color:
      answerState === "correct"
        ? "#166534"
        : answerState === "wrong"
        ? "#c2410c"
        : "#475569",
    transition: "color 0.2s ease",
  }}
>
  {lessonStatusText}
</div>

<div
  style={{
    display: "grid",
    gap: 4,
  }}
>
  <div>
    {lessonAlmostComplete
      ? "Final question — finish strong!"
      : leveledUp
      ? "New level reached! Keep the streak going."
      : `${xpToNextLevel} XP until next level`}
  </div>

  {lessonAlmostComplete && (
    <div
      style={{
        borderRadius: 14,
        padding: "8px 10px",
        background: "linear-gradient(135deg, #ecfeff, #f0fdf4)",
        border: "1px solid #a5f3fc",
        color: "#155e75",
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      🏁 You are almost ready to complete this lesson.
    </div>
  )}
</div>

</div>

{feedback && (
  <div
    style={{
      marginTop: 10,
      fontWeight: 900,
      color: answerState === "correct" ? "#166534" : "#92400e",
      transform: feedback ? "translateY(0)" : "translateY(4px)",
      opacity: feedback ? 1 : 0,
      transition: "all 0.22s ease",
    }}
  >
    <div
  style={{
    display: "grid",
    gap: 4,
    justifyItems: "start",
  }}
>
  <div>
    {leveledUp
      ? `🎉 Level ${lessonLevel}! You are building stronger math power.`
      : answerState === "correct"
      ? "+10 XP — nice work!"
      : "Keep going — learning still counts."}
  </div>

  </div>
  </div>
)}

</details>

    <LessonIndicatorSummary
  lessonQuestion={lessonQuestion}
  answerState={answerState}
  indicatorAccuracy={indicatorAccuracy}
  indicatorStatus={indicatorStatus}
  indicatorProgressPercent={indicatorProgressPercent}
/>

   <LessonModePrompt
  practiceMode={practiceMode}
  assessmentMode={assessmentMode}
/>

    <LessonAdaptationSupportBlocks
  currentAdaptations={currentAdaptations}
  adaptationSupport={adaptationSupport}
/>

 <LessonQuestionShell selected={selected} feedback={feedback}>

    <LessonQuestionSurfaceHeader
  lessonQuestion={lessonQuestion}
  answerState={answerState}
/>

   <LessonFractionVisualModels
  lessonQuestion={lessonQuestion}
  effectiveTapBoxModel={effectiveTapBoxModel}
/>

{effectiveTapBoxModel && (
  <TapBoxFractionQuestion
    total={effectiveTapBoxModel.total}
    target={effectiveTapBoxModel.target}
    selectedCount={
      selected && selected.includes("/")
        ? Number(selected.split("/")[0])
        : 0
    }
    onChange={(count) => {
      const answer = `${count}/${effectiveTapBoxModel.total}`;
      setSelected(answer);
      setTimeout(() => {
        checkAnswer(answer);
      }, 100);
    }}
    disabled={feedback.includes("Correct")}
    answerState={answerState}
  />
)}

<LessonVisualWarmup lessonQuestion={lessonQuestion} />
<LessonVisualWarmup lessonQuestion={lessonQuestion} />

<LessonCurriculumVisualBlock
  lessonQuestion={lessonQuestion}
  currentAdaptations={currentAdaptations}
  effectiveTapBoxModel={effectiveTapBoxModel}
/>

      {lessonQuestion.showWorkedExample && lessonQuestion.thinkingSteps && !feedback.includes("Correct") && (
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
    </LessonQuestionShell>

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
        {shuffledAnswers.map((answer) => (
          <button
            key={answer}
            type="button"
            onMouseEnter={(e) => {
  if (selected !== answer) {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.08)";
  }
}}

onMouseLeave={(e) => {
  if (selected !== answer) {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  }
}}
            onClick={() => {
  setSelected(answer);
  setTimeout(() => {
    checkAnswer(answer);
  }, 100);
}}
   style={
  selected === answer
    ? {
        ...styles.selectedAnswer,
        minHeight: 96,
        borderRadius: 22,
        fontSize: 28,
        fontWeight: 900,
        padding: "18px 20px",
        boxShadow:
          answerState === "correct"
            ? "0 0 22px rgba(34,197,94,0.38)"
            : "0 0 18px rgba(37,99,235,0.28)",
        transform:
          answerState === "correct"
            ? "translateY(-1px) scale(1.03)"
            : "translateY(-1px) scale(1.02)",
        transition: "all 0.18s ease",
      }
    : {
        ...styles.answer,
        minHeight: 96,
        borderRadius: 22,
        fontSize: 28,
        fontWeight: 900,
        padding: "18px 20px",
        background: "#ffffff",
        border: "2px solid #dbeafe",
        color: "#0f172a",
        boxShadow: "0 6px 14px rgba(15,23,42,0.06)",
        transition: "all 0.18s ease",
        animation:
          answerState === "correct"
            ? "correctAnswerGlow 0.32s ease"
            : "none",
      }
}
          >
            {answer}
          </button>
        ))}
      </div>
    )}

   <LessonFeedbackBox
  feedback={feedback}
  answerState={answerState}
  lastMistakeType={lastMistakeType}
  adaptationSupport={adaptationSupport}
/>

<ReadAloudSupport
  lessonQuestion={lessonQuestion}
  adaptationSupport={adaptationSupport}
  speakReadAloudText={speakReadAloudText}
  setSupportUsage={() => {}}
  setInterventionLog={() => {}}
  currentStudent={currentStudent}
/>
  
<WorkedExampleSupport
  lessonQuestion={lessonQuestion}
  adaptationSupport={adaptationSupport}
  setSupportUsage={() => {}}
  setInterventionLog={() => {}}
  currentStudent={currentStudent}
/>

<FormulaReminderSupport
  lessonQuestion={lessonQuestion}
  adaptationSupport={adaptationSupport}
  setSupportUsage={() => {}}
  setInterventionLog={() => {}}
  currentStudent={currentStudent}
/>
 
   <LessonContinueRow
  lessonQuestion={lessonQuestion}
  multiStepAnswers={multiStepAnswers}
  checkAnswer={checkAnswer}
  feedback={feedback}
  hintLevel={hintLevel}
  answerState={answerState}
  nextQuestion={nextQuestion}
  selectedPathwaySkill={selectedPathwaySkill}
  onReturnToPathway={() => setScreen("strand-pathway")}
/>

                            
    </div>
</Card>
)}
{screen === "complete" && (
  <Card title="Practice Complete">
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
<PathwayCompletionMessage
  selectedPathwaySkill={selectedPathwaySkill}
/>

      <h2 style={{ margin: "0 0 8px" }}>
        Nice work with {selectedPathwaySkill ? getPathwayDisplayName(selectedPathwaySkill) : "today's practice"}!
      </h2>

           <CompletionStatsGrid
  stats={[
    {
      label: "Streak",
      value: correctStreak,
      detail: "correct in a row",
    },
    {
      label: "Mode",
      value: assessmentMode
        ? "Assessment"
        : practiceMode
        ? "Practice"
        : selectedPathwaySkill
        ? "Pathway"
        : "Lesson",
      detail: "session complete",
    },
    {
      label: "Saved",
      value: "Yes",
      detail: "teacher dashboard updated",
    },
  ]}
/>

     <CompletionActionRow
  actions={[
    selectedPathwaySkill && {
      label: `Continue ${getPathwayDisplayName(selectedPathwaySkill)}`,
      variant: "primary",
      onClick: () => {
        setQuestionIndex(0);
        setSelected("");
        setFeedback("");
        setAnswerState(null);
        setScreen("lesson");
      },
    },

    selectedPathwaySkill && {
      label: "Choose Another Pathway",
      variant: "secondary",
      onClick: () => {
        setQuestionIndex(0);
        setSelected("");
        setFeedback("");
        setAnswerState(null);
        setScreen("pathway");
      },
    },

    {
      label: "Back to Today",
      variant: selectedPathwaySkill ? "secondary" : "primary",
      onClick: () => setScreen("today"),
    },

    {
      label: "Student Dashboard",
      variant: "secondary",
      onClick: () => setScreen("dashboard"),
    },
  ]}
/>
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
          <CompletionHero
  icon="✅"
  eyebrow={`${completionResult.type} complete`}
  title={completionResult.target}
  text="Your teacher can now see this result in the dashboard."
/>

          <CompletionStatsGrid
  stats={[
    {
      label: "Accuracy",
      value: `${completionResult.accuracy}%`,
    },
    {
      label: "Correct",
      value: `${completionResult.correct}/${completionResult.attempts}`,
    },
    {
      label: "Status",
      value: completionResult.status,
    },
  ]}
/>
 <AssignmentCompletionDetails
  completionResult={completionResult}
  practiceSession={practiceSession}
  practiceQueue={practiceQueue}
/>
          <CompletionActionRow
  actions={[
    {
      label: "Back to Today",
      variant: "primary",
      onClick: () => setScreen("today"),
    },
    {
      label: "Keep Practicing",
      variant: "secondary",
      onClick: () => setScreen("lesson"),
    },
  ]}
/>
        </Card>
      )}

      {screen === "transition" && (
        <Card title="New Skill Unlocked">
          <p style={styles.bigText}>A new skill is ready.</p>
          <p>You are moving to the next outcome that still needs indicator practice.</p>
          <button type="button" onClick={() => setScreen("lesson")} style={styles.primary}>Start Next Skill</button>
        </Card>
      )}

          </div>
  );
}
function speakReadAloudText(text) {
  if (!text || typeof window === "undefined") return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis failed:", err);
  }
}
function CurriculumVisual({ question, adaptations = {} }) {
  const visualType = question?.visualType || "generic";
  const visualData = question?.visualData || {};
  const modelLabel = question?.modelLabel || "";
  const isChallengeVisual = visualData.challengeMode;

  const label =
    question?.curriculumText ||
    question?.skill ||
    "Use the model to choose the best answer.";

  const parseNumberLineValues = () => {
    if (Array.isArray(visualData.values) && visualData.values.length) {
      return visualData.values;
    }

    if (!modelLabel) return [20, 30, 40, "?", 60];

    const values = modelLabel
      .replace("blank", "?")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item === "?" ? "?" : Number(item)))
      .filter((item) => item === "?" || !Number.isNaN(item));

    return values.length ? values : [20, 30, 40, "?", 60];
  };

  const parsePatternItems = () => {
    if (Array.isArray(visualData.items) && visualData.items.length) {
      return visualData.items;
    }

    if (!modelLabel) return ["▲", "●", "▲", "●", "▲", "?"];

    const items = modelLabel
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return items.length ? items : ["▲", "●", "▲", "●", "▲", "?"];
  };

  const parseTallyGroups = () => {
    if (Array.isArray(visualData.groups) && visualData.groups.length) {
      return visualData.groups;
    }

    if (!modelLabel) return [5, 5, 3];

    const groups = modelLabel
      .split("+")
      .map((item) => Number(item.trim()))
      .filter((item) => !Number.isNaN(item));

    return groups.length ? groups : [5, 5, 3];
  };

  const parseBaseTenParts = () => {
    if (
      Number.isFinite(visualData.tens) ||
      Number.isFinite(visualData.ones)
    ) {
      return {
        tens: Number.isFinite(visualData.tens) ? visualData.tens : 0,
        ones: Number.isFinite(visualData.ones) ? visualData.ones : 0,
      };
    }

    const tensMatch = modelLabel.match(/(\d+)\s*tens?/i);
    const onesMatch = modelLabel.match(/(\d+)\s*ones?/i);

    return {
      tens: tensMatch ? Number(tensMatch[1]) : 2,
      ones: onesMatch ? Number(onesMatch[1]) : 6,
    };
  };

  const parseCoinValues = () => {
    if (Array.isArray(visualData.coins) && visualData.coins.length) {
      return visualData.coins;
    }

    if (!modelLabel) return ["25¢", "10¢", "10¢", "5¢"];

    const lower = modelLabel.toLowerCase();
    const coins = [];

    const quarterCount = (lower.match(/quarter/g) || []).length;
    const dimeCount = (lower.match(/dime/g) || []).length;
    const nickelCount = (lower.match(/nickel/g) || []).length;
    const pennyCount = (lower.match(/penny/g) || []).length;

    for (let i = 0; i < quarterCount; i += 1) coins.push("25¢");
    for (let i = 0; i < dimeCount; i += 1) coins.push("10¢");
    for (let i = 0; i < nickelCount; i += 1) coins.push("5¢");
    for (let i = 0; i < pennyCount; i += 1) coins.push("1¢");

    return coins.length ? coins : ["25¢", "10¢", "10¢", "5¢"];
  };

  const parseGraphData = () => {
    if (
      Array.isArray(visualData.labels) &&
      Array.isArray(visualData.values) &&
      visualData.labels.length &&
      visualData.values.length
    ) {
      return {
        labels: visualData.labels,
        values: visualData.values,
      };
    }

    const matches = [...modelLabel.matchAll(/([A-Za-z])\s*=\s*(\d+)/g)];

    if (!matches.length) {
      return {
        labels: ["A", "B", "C"],
        values: [3, 5, 2],
      };
    }

    return {
      labels: matches.map((match) => match[1]),
      values: matches.map((match) => Number(match[2])),
    };
  };

  const baseTenParts = parseBaseTenParts();
  const graphData = parseGraphData();

  const visualConfig = {
    baseTen: {
      title: "Base-ten / ten-frame model",
      callout: "Count tens first, then count ones.",
      model: (
        <BaseTenModel
          tens={baseTenParts.tens}
          ones={baseTenParts.ones}
        />
      ),
    },

    coins: {
      title: "Coin model",
      callout: "Group coin values, then count on.",
      model: <CoinModel coins={parseCoinValues()} />,
    },

    tallies: {
      title: "Tally model",
      callout: "Every bundle of five makes counting faster.",
      model: <TallyModel groups={parseTallyGroups()} />,
    },

    numberLine: {
      title: "Number line / sequence model",
      callout: "Use the number line to help your thinking.",
      model: (
        <NumberLineModel
          values={parseNumberLineValues()}
          adaptations={adaptations}
        />
      ),
    },

    pattern: {
      title: "Pattern model",
      callout: "Use the pattern model to help your thinking.",
      model: (
        <PatternModel
          items={parsePatternItems()}
          adaptations={adaptations}
        />
      ),
    },

    balance: {
      title: "Equality model",
      callout: "Both sides must have the same value for equality.",
      model: (
        <BalanceModel
          left={visualData.left || "10 + 5"}
          middle={visualData.middle || "="}
          right={visualData.right || "15"}
        />
      ),
    },

    calendar: {
      title: "Calendar model",
      callout: "Use rows and weekdays to organize time.",
      model: <CalendarModel />,
    },

    measurement: {
      title: "Measurement model",
      callout: "Units must touch with no gaps or overlaps.",
      model: <MeasurementModel units={visualData.units || 6} />,
    },

    geometry: {
      title: "Shape model",
      callout: "Use the shape model to help your thinking.",
      model: (
        <GeometryModel
          question={question}
          adaptations={adaptations}
        />
      ),
    },

    graph: {
      title: "Data / graph model",
      callout: "Use the graph to help your thinking.",
      model: (
        <GraphModel
          values={graphData.values}
          labels={graphData.labels}
          adaptations={adaptations}
        />
      ),
    },
  };

  const config = visualConfig[visualType] || {
    title: "Curriculum focus",
    callout: "Use the evidence in the model to decide.",
    model: (
      <div style={styles.genericVisualModel}>
        Think → Model → Answer
      </div>
    ),
  };

  return (
    <div style={styles.visualBox}>
      <div style={styles.visualHeaderRow}>
        <div>
          <div style={styles.visualTitle}>{config.title}</div>
          <p style={styles.visualCallout}>
  {config.callout}
  {isChallengeVisual ? " Look closely — this one needs careful reasoning." : ""}
</p>
        </div>
        <span style={styles.visualTypePill}>{visualType}</span>
      </div>

      <div
  style={{
    ...styles.visualModelStage,
    position: "relative",
    overflow: "hidden",
    background:
      visualData?.challengeMode
        ? "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)"
        : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    border:
      visualData?.challengeMode
        ? "2px solid #fdba74"
        : "1px solid #dbe3ef",
    boxShadow:
      visualData?.challengeMode
        ? "0 14px 28px rgba(249,115,22,0.10)"
        : "0 10px 24px rgba(15,23,42,0.04)",
    transition: "all 0.22s ease",
  }}
>
  {visualData?.challengeMode && (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        borderRadius: 999,
        padding: "5px 9px",
        background: "#fff7ed",
        border: "1px solid #fdba74",
        color: "#9a3412",
        fontSize: 11,
        fontWeight: 950,
        zIndex: 2,
      }}
    >
      Challenge Visual
    </div>
  )}

  {config.model}
</div>

      <p style={styles.visualCaption}>{label}</p>

{isChallengeVisual && (
  <div
    style={{
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 14,
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#9a3412",
      fontWeight: 850,
      fontSize: 13,
      lineHeight: 1.35,
    }}
  >
    Challenge: explain the clue in the model before choosing your answer.
  </div>
)}
    </div>
  );
}

function BaseTenModel({ tens = 2, ones = 6 }) {
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    setSelectedPart(null);
  }, [tens, ones]);

  return (
    <div style={styles.baseTenStage}>
      <div style={styles.baseTenTensGroup}>
        {Array.from({ length: tens }).map((_, rodIndex) => {
          const isSelected = selectedPart === `ten-${rodIndex}`;

          return (
            <button
              key={rodIndex}
              type="button"
              onClick={() =>
                setSelectedPart((currentPart) =>
                  currentPart === `ten-${rodIndex}` ? null : `ten-${rodIndex}`
                )
              }
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                touchAction: "manipulation",
                transform: isSelected ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.16s ease",
              }}
            >
              <div
                style={{
                  ...styles.tenFrameRod,
                  boxShadow: isSelected
                    ? "0 10px 20px rgba(37,99,235,0.18)"
                    : "none",
                }}
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <span key={index} style={styles.tenFrameMiniCell} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div style={styles.baseTenOnesGroup}>
        {Array.from({ length: ones }).map((_, index) => {
          const isSelected = selectedPart === `one-${index}`;

          return (
            <button
              key={index}
              type="button"
              onClick={() =>
                setSelectedPart((currentPart) =>
                  currentPart === `one-${index}` ? null : `one-${index}`
                )
              }
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                touchAction: "manipulation",
                transform: isSelected ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.16s ease",
              }}
            >
              <span
                style={{
                  ...styles.oneCubePolished,
                  boxShadow: isSelected
                    ? "0 8px 16px rgba(37,99,235,0.18)"
                    : "none",
                }}
              >
                1
              </span>
            </button>
          );
        })}
      </div>

      <div style={styles.modelEquation}>
        {tens} tens + {ones} ones = {tens * 10 + ones}
      </div>

      {selectedPart && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {selectedPart.startsWith("ten")
            ? "This rod represents 1 ten, or 10 ones."
            : "This cube represents 1 one."}
        </div>
      )}
    </div>
  );
}
function CoinModel({ coins }) {
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    setSelectedCoin(null);
  }, [coins]);

  const coinValues = {
    Q: "25¢",
    D: "10¢",
    N: "5¢",
    P: "1¢",
  };

  return (
    <div>
      <div style={styles.coinRowPolished}>
        {coins.map((coin, index) => {
          const coinKey = `${coin}-${index}`;
          const isSelected = selectedCoin === coinKey;

          return (
            <button
              key={coinKey}
              type="button"
              onClick={() =>
                setSelectedCoin((currentCoin) =>
                  currentCoin === coinKey ? null : coinKey
                )
              }
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                touchAction: "manipulation",
                transform: isSelected ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.16s ease",
              }}
            >
              <div
                style={{
                  ...styles.coinPolished,
                  boxShadow: isSelected
                    ? "0 10px 20px rgba(217,119,6,0.22)"
                    : "none",
                }}
              >
                <span>{coin}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={styles.modelEquation}>
        25 + 10 + 10 + 5 = 50¢
      </div>

      {selectedCoin && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          This coin is worth{" "}
          {coinValues[selectedCoin.split("-")[0]] || "some money"}.
        </div>
      )}
    </div>
  );
}

function TallyModel({ groups }) {
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    setSelectedGroup(null);
  }, [groups]);

  return (
    <div style={styles.tallyStage}>
      {groups.map((count, groupIndex) => {
        const isSelected = selectedGroup === groupIndex;

        return (
          <button
            key={groupIndex}
            type="button"
            onClick={() =>
              setSelectedGroup((currentGroup) =>
                currentGroup === groupIndex ? null : groupIndex
              )
            }
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              touchAction: "manipulation",
              transform: isSelected ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.16s ease",
            }}
          >
            <div
              style={{
                ...styles.tallyGroupBox,
                boxShadow: isSelected
                  ? "0 10px 20px rgba(51,65,85,0.16)"
                  : "none",
              }}
            >
              {Array.from({ length: count }).map((_, index) => (
                <span
                  key={index}
                  style={
                    index === 4
                      ? styles.tallySlash
                      : styles.tallyMark
                  }
                />
              ))}
            </div>
          </button>
        );
      })}

      <div style={styles.modelEquation}>
        5 + 5 + 3 = 13
      </div>

      {selectedGroup !== null && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          This tally group shows{" "}
          {groups[selectedGroup]} marks.
        </div>
      )}
    </div>
  );
}

function NumberLineModel({
  values,
  adaptations = {},
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [values]);

  const showJumpSupport = shouldShowVisualSupport(adaptations);

  return (
    <div style={styles.numberLineStage}>
      <div style={styles.numberLineTrack} />

      <div style={styles.numberLineDots}>
        {values.map((value, index) => {
          const isSelected = selectedIndex === index;

          return (
            <div
              key={index}
              style={styles.numberLineDotGroup}
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((currentIndex) =>
                    currentIndex === index ? null : index
                  )
                }
                style={{
                  ...(value === "?"
                    ? styles.numberBubbleMissing
                    : styles.numberBubblePolished),

                  transform: isSelected
                    ? "scale(1.08)"
                    : "scale(1)",

                  boxShadow: isSelected
                    ? "0 12px 24px rgba(37,99,235,0.18)"
                    : "none",

                  transition:
                    "transform 0.16s ease, box-shadow 0.16s ease",

                  cursor: "pointer",
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}
              >
                {value}
              </button>

              {index < values.length - 1 && (
                <span style={styles.numberLineJump}>
                  {showJumpSupport ? "+10" : "→"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PatternModel({
  items,
  adaptations = {},
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [items]);

  const showPatternSupport = shouldShowVisualSupport(adaptations);

  return (
    <div style={styles.patternStage}>
      {items.map((item, index) => {
        const isSelected = selectedIndex === index;

        return (
          <button
            key={index}
            type="button"
            onClick={() =>
              setSelectedIndex((currentIndex) =>
                currentIndex === index ? null : index
              )
            }
            style={{
              ...(item === "?"
                ? styles.patternTokenMissing
                : styles.patternTokenPolished),

              transform: isSelected
                ? "translateY(-2px) scale(1.05)"
                : "translateY(0px) scale(1)",

              boxShadow: isSelected
                ? "0 10px 20px rgba(37,99,235,0.16)"
                : "none",

              transition:
                "transform 0.16s ease, box-shadow 0.16s ease",

              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {item}
          </button>
        );
      })}

      {showPatternSupport && (
        <div
          style={{
            width: "100%",
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Look for what changes and what stays the same.
        </div>
      )}
    </div>
  );
}

function BalanceModel({ left, middle, right }) {
  const [selectedSide, setSelectedSide] = useState(null);

  useEffect(() => {
    setSelectedSide(null);
  }, [left, middle, right]);

  return (
    <div>
      <div style={styles.balanceStage}>
        <button
          type="button"
          onClick={() =>
            setSelectedSide((currentSide) =>
              currentSide === "left" ? null : "left"
            )
          }
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            touchAction: "manipulation",
            transform:
              selectedSide === "left"
                ? "scale(1.04)"
                : "scale(1)",
            transition: "transform 0.16s ease",
          }}
        >
          <div
            style={{
              ...styles.balancePan,
              boxShadow:
                selectedSide === "left"
                  ? "0 10px 20px rgba(37,99,235,0.18)"
                  : "none",
            }}
          >
            {left}
          </div>
        </button>

        <div style={styles.balanceCenter}>
          {middle}
        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedSide((currentSide) =>
              currentSide === "right" ? null : "right"
            )
          }
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            touchAction: "manipulation",
            transform:
              selectedSide === "right"
                ? "scale(1.04)"
                : "scale(1)",
            transition: "transform 0.16s ease",
          }}
        >
          <div
            style={{
              ...styles.balancePan,
              boxShadow:
                selectedSide === "right"
                  ? "0 10px 20px rgba(37,99,235,0.18)"
                  : "none",
            }}
          >
            {right}
          </div>
        </button>
      </div>

      {selectedSide && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {selectedSide === "left"
            ? "This is the left side of the comparison."
            : "This is the right side of the comparison."}
        </div>
      )}
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
function shouldShowVisualSupport(
  adaptations = {},
  level = "basic"
) {
  if (level === "basic") {
    return (
      adaptations?.examples ||
      adaptations?.formulaSheet
    );
  }

  if (level === "guided") {
    return (
      adaptations?.examples &&
      adaptations?.formulaSheet
    );
  }

  return false;
}

function GeometryModel({ question, adaptations = {} }) {
  const [selectedShape, setSelectedShape] = useState(null);

  useEffect(() => {
    setSelectedShape(null);
  }, [question?.id, question?.prompt]);

const showShapeSupport = shouldShowVisualSupport(adaptations);

  const shapes = [
    {
      id: "square",
      name: "Square",
      color: "#1e3a8a",
      info: "4 equal sides and 4 corners.",
      shape: (
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 18,
            background: "#dbeafe",
            border: "4px solid #2563eb",
          }}
        />
      ),
    },
    {
      id: "triangle",
      name: "Triangle",
      color: "#166534",
      info: "3 sides and 3 corners.",
      shape: (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "48px solid transparent",
            borderRight: "48px solid transparent",
            borderBottom: "84px solid #22c55e",
          }}
        />
      ),
    },
    {
      id: "circle",
      name: "Circle",
      color: "#92400e",
      info: "A curved edge with no corners.",
      shape: (
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            background: "#fde68a",
            border: "4px solid #f59e0b",
          }}
        />
      ),
    },
  ];

  const selectedShapeInfo = shapes.find(
    (shape) => shape.id === selectedShape
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 18,
          alignItems: "stretch",
          justifyItems: "center",
          padding: "10px 0",
        }}
      >
        {shapes.map((shape) => {
          const isSelected = selectedShape === shape.id;

          return (
            <button
              key={shape.id}
              type="button"
              onClick={() =>
                setSelectedShape((currentShape) =>
                  currentShape === shape.id ? null : shape.id
                )
              }
              style={{
                width: "100%",
                minHeight: 170,
                display: "grid",
                justifyItems: "center",
                alignContent: "center",
                gap: 12,
                borderRadius: 22,
                border: isSelected
                  ? "3px solid #7c3aed"
                  : "2px solid #e2e8f0",
                background: isSelected
                  ? "linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%)"
                  : "#ffffff",
                boxShadow: isSelected
                  ? "0 14px 30px rgba(124,58,237,0.18)"
                  : "0 8px 18px rgba(15,23,42,0.06)",
                cursor: "pointer",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
                transition:
                  "transform 0.14s ease, box-shadow 0.14s ease, border 0.14s ease",
                transform: isSelected
                  ? "translateY(-2px) scale(1.02)"
                  : "translateY(0px) scale(1)",
                willChange: "transform",
                touchAction: "manipulation",
              }}
            >
              <div
                style={{
                  transform: isSelected ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.18s ease",
                }}
              >
                {shape.shape}
              </div>

              <div
                style={{
                  fontWeight: 950,
                  color: shape.color,
                  fontSize: 16,
                }}
              >
                {shape.name}
              </div>
            </button>
          );
        })}
      </div>

      {showShapeSupport && selectedShapeInfo && (
        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#334155",
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: selectedShapeInfo.color }}>
            {selectedShapeInfo.name}
          </strong>

          <div style={{ marginTop: 6 }}>
            {selectedShapeInfo.info}
          </div>
        </div>
      )}
    </div>
  );
}

function GraphModel({
  values = [3, 5, 2],
  labels = ["A", "B", "C"],
  adaptations = {},
}) {
  const [selectedBar, setSelectedBar] = useState(null);

  useEffect(() => {
    setSelectedBar(null);
  }, [values, labels]);

  const showGraphSupport = shouldShowVisualSupport(adaptations);

  return (
    <div style={styles.graphStage}>
      {values.map((height, index) => {
        const isSelected = selectedBar === index;

        return (
          <button
            key={index}
            type="button"
            onClick={() =>
              setSelectedBar((currentBar) =>
                currentBar === index ? null : index
              )
            }
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              transform: isSelected
                ? "translateY(-2px) scale(1.03)"
                : "translateY(0px) scale(1)",
              transition: "transform 0.16s ease",
            }}
          >
            <div
              style={{
                ...styles.barGraphBarPolished,
                height: height * 20,
                boxShadow: isSelected
                  ? "0 12px 22px rgba(37,99,235,0.18)"
                  : styles.barGraphBarPolished.boxShadow,
              }}
            />

            <div
  style={{
    display: "grid",
    justifyItems: "center",
    gap: 4,
  }}
>
  <strong
    style={{
      fontSize: 18,
      color: "#0f172a",
    }}
  >
    {labels[index]}
  </strong>

  <div
    style={{
      fontSize: 12,
      fontWeight: 900,
      color: "#64748b",
    }}
  >
    {height}
  </div>
</div>
          </button>
        );
      })}

      {showGraphSupport && (
        <div
          style={{
            width: "100%",
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: 13,
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Compare which bars are taller or shorter.
        </div>
      )}
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
    const supportUsage = assignment.result?.supportUsage;

    const supportSummary = supportUsage
      ? [
          supportUsage.readAloudUsed > 0
            ? `🔊 ${supportUsage.readAloudUsed}`
            : null,
          supportUsage.exampleOpened > 0
            ? `✏️ ${supportUsage.exampleOpened}`
            : null,
          supportUsage.reminderOpened > 0
            ? `📘 ${supportUsage.reminderOpened}`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

    return supportSummary
      ? `🟢 Completed ${assignment.result?.accuracy ?? "—"}% • ${supportSummary}`
      : `🟢 Completed ${assignment.result?.accuracy ?? "—"}%`;
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
