import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import MCQRenderer from '../components/MCQRenderer'
import './PlatformPages.css'
import './MCQTest.css'

const ISSUE_TYPE_META = {
  wrong_key: { label: 'Wrong Answer Key', color: '#ef4444', icon: '🔴' },
  question_typo: { label: 'Typo / Text Error', color: '#f59e0b', icon: '✏️' },
  explanation_issue: { label: 'Explanation Issue', color: '#3b82f6', icon: '💡' },
  broken_image: { label: 'Broken / Missing Image', color: '#8b5cf6', icon: '🖼️' },
  other: { label: 'Other Issue', color: '#6b7280', icon: '💬' },
}

export default function TeacherReportedMcqsPage() {
  const { user, isAdmin } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [allowedSubjects, setAllowedSubjects] = useState([])
  const [editingReport, setEditingReport] = useState(null)
  const [dismissingReport, setDismissingReport] = useState(null)
  const [dismissReason, setDismissReason] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  // MCQ Edit Form State
  const [editForm, setEditForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanationText: '',
    difficulty: 'medium',
    resolutionNotes: '',
  })

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (subjectFilter && subjectFilter !== 'all') params.set('subject', subjectFilter)

      const res = await API.get(`/reports/teacher?${params.toString()}`)
      setReports(res.data.reports || [])
      if (res.data.allowedSubjects) {
        setAllowedSubjects(res.data.allowedSubjects)
      }
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Could not load reported MCQs.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [statusFilter, subjectFilter])

  const openEditModal = (report) => {
    const mcq = report.mcqId || {}
    const options = Array.isArray(mcq.options) ? mcq.options : []
    
    let correctLetter = mcq.correctAnswer || 'A'
    if (!mcq.correctAnswer && options.length) {
      const correctIdx = options.findIndex((opt) => opt.isCorrect)
      if (correctIdx >= 0) {
        correctLetter = ['A', 'B', 'C', 'D'][correctIdx]
      }
    }

    setEditForm({
      questionText: mcq.questionText || mcq.question || report.questionSnapshot || '',
      optionA: options[0]?.text || mcq.optionA || '',
      optionB: options[1]?.text || mcq.optionB || '',
      optionC: options[2]?.text || mcq.optionC || '',
      optionD: options[3]?.text || mcq.optionD || '',
      correctAnswer: correctLetter || 'A',
      explanationText: mcq.explanationText || mcq.explanation || '',
      difficulty: mcq.difficulty || 'medium',
      resolutionNotes: report.resolutionNotes || `Corrected based on report #${report._id.slice(-6)}`,
    })
    setEditingReport(report)
  }

  const handleSaveAndResolve = async (e) => {
    e.preventDefault()
    if (!editingReport) return

    if (!editForm.questionText.trim()) {
      toast.error('Question text cannot be empty')
      return
    }

    const options = [
      { text: editForm.optionA.trim(), isCorrect: editForm.correctAnswer === 'A' },
      { text: editForm.optionB.trim(), isCorrect: editForm.correctAnswer === 'B' },
      { text: editForm.optionC.trim(), isCorrect: editForm.correctAnswer === 'C' },
      { text: editForm.optionD.trim(), isCorrect: editForm.correctAnswer === 'D' },
    ]

    if (options.some((opt) => !opt.text)) {
      toast.error('All 4 options (A, B, C, D) must have text.')
      return
    }

    setSubmittingAction(true)
    try {
      await API.put(`/reports/${editingReport._id}/resolve-and-edit`, {
        questionText: editForm.questionText.trim(),
        question: editForm.questionText.trim(),
        options,
        explanationText: editForm.explanationText.trim(),
        explanation: editForm.explanationText.trim(),
        difficulty: editForm.difficulty,
        resolutionNotes: editForm.resolutionNotes.trim(),
      })

      toast.success('MCQ updated in live Question Bank and report resolved!')
      setEditingReport(null)
      loadReports()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Failed to update MCQ.'))
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleDismissReport = async (e) => {
    e.preventDefault()
    if (!dismissingReport) return

    setSubmittingAction(true)
    try {
      await API.put(`/reports/${dismissingReport._id}/dismiss`, {
        resolutionNotes: dismissReason.trim() || 'Reviewed by teacher, no changes needed.',
      })

      toast.success('Report dismissed.')
      setDismissingReport(null)
      setDismissReason('')
      loadReports()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Failed to dismiss report.'))
    } finally {
      setSubmittingAction(false)
    }
  }

  const pendingCount = useMemo(() => {
    return reports.filter((r) => r.status === 'pending').length
  }, [reports])

  return (
    <div className="workspace-page animate-fade-up" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🚩</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
                Reported MCQs Management
              </h1>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
                {isAdmin
                  ? 'All subject reports submitted by students across the platform.'
                  : `Reports for your assigned subjects: ${allowedSubjects.join(', ') || 'Assigned Subjects'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadReports}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 Refresh Reports
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'rgba(26, 26, 46, 0.7)',
          padding: '12px 18px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px',
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'pending', label: '⏳ Pending Review' },
            { id: 'resolved', label: '✅ Resolved' },
            { id: 'dismissed', label: '❌ Dismissed' },
            { id: 'all', label: '📋 All Reports' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.06)',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Subject Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="subject-filter-select" style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
            Subject:
          </label>
          <select
            id="subject-filter-select"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <option value="all">All Assigned Subjects</option>
            {allowedSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Loading reported questions...
        </div>
      ) : reports.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🎉</span>
          <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.25rem' }}>
            No {statusFilter === 'pending' ? 'Pending' : ''} MCQ Reports Found!
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>
            {statusFilter === 'pending'
              ? 'Great work! All reported questions for your subjects have been reviewed.'
              : 'No reports match your current filter criteria.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reports.map((report) => {
            const meta = ISSUE_TYPE_META[report.issueType] || ISSUE_TYPE_META.other
            const mcq = report.mcqId || {}
            const isResolved = report.status === 'resolved'
            const isDismissed = report.status === 'dismissed'

            return (
              <div
                key={report._id}
                style={{
                  background: 'rgba(26, 26, 46, 0.85)',
                  border: isResolved
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : isDismissed
                    ? '1px solid rgba(100, 116, 139, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Report Card Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {report.subject}
                    </span>
                    {report.chapterName && (
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        {report.chapterName}
                      </span>
                    )}
                    <span
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color,
                        border: `1px solid ${meta.color}44`,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {meta.icon} {meta.label}
                    </span>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isResolved ? '#065f46' : isDismissed ? '#334155' : '#7f1d1d',
                        color: isResolved ? '#6ee7b7' : isDismissed ? '#cbd5e1' : '#fca5a5',
                      }}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Reported on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Student Issue Details */}
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderLeft: '4px solid #ef4444',
                    padding: '12px 16px',
                    borderRadius: '0 8px 8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>
                      👤 Student Report ({report.studentName || 'Anonymous'}) {report.studentEmail ? `• ${report.studentEmail}` : ''}:
                    </span>
                    {report.selectedOption && (
                      <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700 }}>
                        Student thinks Option {report.selectedOption} is correct
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.92rem', color: '#f8fafc', lineHeight: 1.5, fontWeight: 500 }}>
                    "{report.description}"
                  </div>
                </div>

                {/* Question & Options Display */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
                    MCQ Question:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '14px' }}>
                    <MCQRenderer text={mcq.questionText || mcq.question || report.questionSnapshot || 'Question text not available'} />
                  </div>

                  {/* Options */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    {Array.isArray(mcq.options) && mcq.options.length > 0 ? (
                      mcq.options.map((opt, i) => {
                        const letter = ['A', 'B', 'C', 'D'][i]
                        const isCorrect = opt.isCorrect || mcq.correctAnswer === letter
                        return (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                              border: isCorrect ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: isCorrect ? '#34d399' : '#cbd5e1',
                            }}
                          >
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: isCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                                color: isCorrect ? '#ffffff' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                              }}
                            >
                              {letter}
                            </span>
                            <div style={{ flex: 1, fontSize: '0.88rem' }}>
                              <MCQRenderer text={opt.text || ''} />
                            </div>
                            {isCorrect && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981' }}>
                                ✓ Official Key
                              </span>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No options data found for this MCQ.</div>
                    )}
                  </div>

                  {/* Explanation if any */}
                  {(mcq.explanationText || mcq.explanation) && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                        💡 Current Explanation:
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                        <MCQRenderer text={mcq.explanationText || mcq.explanation} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Resolution info if already resolved */}
                {(isResolved || isDismissed) && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                    }}
                  >
                    <strong>Resolution note:</strong> {report.resolutionNotes || 'No notes provided.'} • Resolved on {new Date(report.resolvedAt || report.updatedAt).toLocaleDateString()}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {!isDismissed && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setDismissingReport(report)
                        setDismissReason('')
                      }}
                      style={{ padding: '8px 16px', fontSize: '0.86rem' }}
                    >
                      ❌ Dismiss Report
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openEditModal(report)}
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    }}
                  >
                    ✏️ Edit & Push to MCQ Bank
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit MCQ Modal */}
      {editingReport && (
        <div
          className="report-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 15, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingAction) setEditingReport(null)
          }}
        >
          <div
            className="report-modal-card"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '92vh',
              overflowY: 'auto',
              backgroundColor: '#121422',
              border: '1.5px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              color: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#a5b4fc' }}>
                  ✏️ Edit MCQ & Push to Question Bank
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Subject: {editingReport.subject} • Chapter: {editingReport.chapterName || 'General'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                disabled={submittingAction}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* Student Note reminder */}
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>
              <span style={{ fontWeight: 700, color: '#fca5a5' }}>Student Reported Issue: </span>
              <span style={{ color: '#f8fafc' }}>"{editingReport.description}"</span>
            </div>

            <form onSubmit={handleSaveAndResolve} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Question Text */}
              <div>
                <label htmlFor="edit-question-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: '6px' }}>
                  Question Text:
                </label>
                <textarea
                  id="edit-question-text"
                  rows={4}
                  value={editForm.questionText}
                  onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    lineHeight: 1.4,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Options A, B, C, D */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: '8px' }}>
                  Options & Official Correct Answer Key:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const fieldName = `option${letter}`
                    const isCorrect = editForm.correctAnswer === letter

                    return (
                      <div
                        key={letter}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: isCorrect ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, correctAnswer: letter })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                            color: isCorrect ? '#ffffff' : '#94a3b8',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                          }}
                        >
                          {isCorrect ? '✓ Option ' + letter : 'Set ' + letter}
                        </button>
                        <input
                          type="text"
                          value={editForm[fieldName]}
                          onChange={(e) => setEditForm({ ...editForm, [fieldName]: e.target.value })}
                          placeholder={`Option ${letter} text...`}
                          required
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#ffffff',
                            fontSize: '0.9rem',
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label htmlFor="edit-explanation-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: '6px' }}>
                  Explanation / Solution:
                </label>
                <textarea
                  id="edit-explanation-text"
                  rows={3}
                  value={editForm.explanationText}
                  onChange={(e) => setEditForm({ ...editForm, explanationText: e.target.value })}
                  placeholder="Provide step-by-step textbook explanation..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    lineHeight: 1.4,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Resolution Note */}
              <div>
                <label htmlFor="edit-resolution-note" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  Resolution Notes (Internal record):
                </label>
                <input
                  id="edit-resolution-note"
                  type="text"
                  value={editForm.resolutionNotes}
                  onChange={(e) => setEditForm({ ...editForm, resolutionNotes: e.target.value })}
                  placeholder="e.g. Corrected answer key to B as per PTB textbook."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingReport(null)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingAction}
                  style={{
                    padding: '10px 24px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {submittingAction ? 'Saving...' : '💾 Save & Push to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dismiss Confirmation Modal */}
      {dismissingReport && (
        <div
          className="report-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="report-modal-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#121422',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '24px',
              color: '#f8fafc',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#f8fafc' }}>
              Dismiss This Report?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Are you sure you want to dismiss this report without making changes?
            </p>
            <form onSubmit={handleDismissReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Reason for dismissal (e.g. Current key is correct)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDismissingReport(null)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Dismissing...' : 'Dismiss'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
