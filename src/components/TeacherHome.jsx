import React, { useState } from "react";

export default function TeacherHome({
  Card,
  Stat,
  styles,
  workflowSupportRows,
  workflowAssessmentRows,
  workflowPracticeRows,
  workflowFollowUpRows,
  interventionReferralData,
  workflowTopReferralGroups,
  setCurrentStudent,
  onAssignGroupPractice,
  onAssignGroupAssessment,
  openInterventionReferralEmail,
  copyInterventionReferral,
  getSuggestedOutcomeForRow,
}) {
  const [homeView, setHomeView] = useState("support");

  const sectionButton = (key) => ({
    type: "button",
    padding: "10px 14px",
    borderRadius: 12,
    border: homeView === key ? "2px solid #2563eb" : "1px solid #dbeafe",
    background: homeView === key ? "#dbeafe" : "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  });

  return (
    <Card id="teacher-section-home" title="Teacher Workflow Home" className="screen-only">
      <p style={styles.sectionIntro}>
        A cleaner daily view. Choose one workflow area at a time instead of scanning the whole dashboard.
      </p>

      <div style={styles.statRow}>
        <Stat label="Need Support" value={workflowSupportRows.length} />
        <Stat label="Ready to Assess" value={workflowAssessmentRows.length} />
        <Stat label="Follow-Ups Due" value={workflowFollowUpRows.length} />
        <Stat label="Referral Students" value={interventionReferralData.studentCount} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, marginBottom: 16 }}>
        <button type="button" onClick={() => setHomeView("support")} style={sectionButton("support")}>
          1. Pull First
        </button>

        <button type="button" onClick={() => setHomeView("assess")} style={sectionButton("assess")}>
          2. Assess Next
        </button>

        <button type="button" onClick={() => setHomeView("practice")} style={sectionButton("practice")}>
          3. Keep Practicing
        </button>

        <button type="button" onClick={() => setHomeView("followup")} style={sectionButton("followup")}>
          4. Follow Up
        </button>

        <button type="button" onClick={() => setHomeView("referral")} style={sectionButton("referral")}>
          Referral Snapshot
        </button>
      </div>

      {homeView === "support" && (
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsTitle}>1. Pull first</div>
          <div style={styles.cellSubtext}>
            Students with support, reassessment, or alert needs.
          </div>

          {workflowSupportRows.length === 0 ? (
            <p style={styles.cellSubtext}>No urgent support group right now.</p>
          ) : (
            workflowSupportRows.map((row) => (
              <button
                key={row.student}
                type="button"
                onClick={() => setCurrentStudent(row.student)}
                style={styles.studentChip}
              >
                {row.student} · {row.label}
              </button>
            ))
          )}

          <div style={styles.rowWrap}>
            <button
              type="button"
              onClick={() => onAssignGroupPractice(workflowSupportRows)}
              style={styles.gridActionButton}
            >
              Assign Support Practice
            </button>
          </div>
        </div>
      )}

      {homeView === "assess" && (
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsTitle}>2. Assess next</div>
          <div style={styles.cellSubtext}>
            Students with enough indicator evidence.
          </div>

          {workflowAssessmentRows.length === 0 ? (
            <p style={styles.cellSubtext}>No students are assessment-ready yet.</p>
          ) : (
            workflowAssessmentRows.map((row) => (
              <button
                key={row.student}
                type="button"
                onClick={() => setCurrentStudent(row.student)}
                style={styles.studentChip}
              >
                {row.student} · {getSuggestedOutcomeForRow(row, true)}
              </button>
            ))
          )}

          <div style={styles.rowWrap}>
            <button
              type="button"
              onClick={() => onAssignGroupAssessment(workflowAssessmentRows)}
              style={styles.gridActionButton}
            >
              Assign Assessments
            </button>
          </div>
        </div>
      )}

      {homeView === "practice" && (
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsTitle}>3. Keep practicing</div>
          <div style={styles.cellSubtext}>
            Students who need regular short practice cycles.
          </div>

          {workflowPracticeRows.length === 0 ? (
            <p style={styles.cellSubtext}>No general practice group right now.</p>
          ) : (
            workflowPracticeRows.map((row) => (
              <button
                key={row.student}
                type="button"
                onClick={() => setCurrentStudent(row.student)}
                style={styles.studentChip}
              >
                {row.student} · {row.nextStep}
              </button>
            ))
          )}

          <div style={styles.rowWrap}>
            <button
              type="button"
              onClick={() => onAssignGroupPractice(workflowPracticeRows)}
              style={styles.gridActionButton}
            >
              Assign Practice
            </button>
          </div>
        </div>
      )}

      {homeView === "followup" && (
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsTitle}>4. Follow up</div>
          <div style={styles.cellSubtext}>
            Scheduled intervention checks due now.
          </div>

          {workflowFollowUpRows.length === 0 ? (
            <p style={styles.cellSubtext}>No follow-ups due today.</p>
          ) : (
            workflowFollowUpRows.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setCurrentStudent(plan.student)}
                style={styles.studentChip}
              >
                {plan.student} · {plan.indicator || plan.outcome}
              </button>
            ))
          )}
        </div>
      )}

      {homeView === "referral" && (
        <div style={{ ...styles.recommendationBox, marginTop: 14 }}>
          <strong>Referral snapshot:</strong>

          {workflowTopReferralGroups.length === 0 ? (
            <p>No students currently meet the referral threshold.</p>
          ) : (
            <div style={styles.indicatorList}>
              {workflowTopReferralGroups.map((group) => (
                <div key={group.outcome} style={styles.indicatorRow}>
                  <div>
                    <strong>{group.outcome} — {group.title}</strong>
                    <div style={styles.cellSubtext}>
                      {group.indicators.reduce(
                        (total, indicator) => total + indicator.students.length,
                        0
                      )}{" "}
                      referral item(s) below threshold / needing support
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openInterventionReferralEmail}
                    style={styles.gridActionButton}
                  >
                    Open Referral Email
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={styles.rowWrap}>
            <button type="button" onClick={copyInterventionReferral} style={styles.secondary}>
              Copy Intervention List
            </button>

            <button type="button" onClick={openInterventionReferralEmail} style={styles.primary}>
              Open Resource Email Draft
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}