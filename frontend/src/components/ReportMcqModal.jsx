import React, { useState } from 'react'
import toast from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import MCQRenderer from './MCQRenderer'

const ISSUE_TYPES = [
  { id: 'wrong_key', label: 'Wrong Answer Key', icon: '🔴', desc: 'The marked correct option is incorrect' },
  { id: 'question_typo', label: 'Typo / Text Error', icon: '✏️', desc: 'Grammar, spelling, or scientific typo in question or options' },
  { id: 'explanation_issue', label: 'Explanation Issue', icon: '💡', desc: 'Explanation is missing, wrong, or confusing' },
  { id: 'broken_image', label: 'Broken / Missing Image', icon: '🖼️', desc: 'Diagram or formula image is not displaying properly' },
  { id: 'other', label: 'Other Issue', icon: '💬', desc: 'Any other problem with this question' },
]

export default function ReportMcqModal({ isOpen, onClose, mcq, subjectName, chapterName, topicName }) {
  const [issueType, setIssueType] = useState('wrong_key')
  const [description, setDescription] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !mcq) return null

  const mcqId = mcq._id || mcq.id
  const questionSnippet = mcq.questionText || mcq.question || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Please briefly describe what is wrong with this question.')
      return
    }

    setSubmitting(true)
    try {
      await API.post('/reports/mcq', {
        mcqId,
        issueType,
        description: description.trim(),
        selectedOption: selectedOption || undefined,
        subject: mcq.subject || subjectName || '',
        chapterId: mcq.chapterId || '',
        chapterName: mcq.chapterName || chapterName || '',
        topic: mcq.topic || topicName || '',
      })

      toast.success('Report submitted successfully! The subject teacher will review and update this question.')
      setDescription('')
      setSelectedOption('')
      setIssueType('wrong_key')
      onClose()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Could not submit report. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        className="report-modal-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#121422',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.15)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🚩</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fca5a5' }}>
                Report MCQ Issue
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Sent directly to the assigned subject teacher for verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Question preview snippet */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '0.86rem',
            color: '#cbd5e1',
            maxHeight: '90px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f87171', fontWeight: 700, marginBottom: '4px' }}>
            Question Preview:
          </div>
          <MCQRenderer text={questionSnippet} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Issue Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cbd5e1', marginBottom: '8px' }}>
              What is the issue?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {ISSUE_TYPES.map((type) => {
                const isSelected = issueType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setIssueType(type.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{type.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#fecaca' : '#e2e8f0' }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: isSelected ? '#fca5a5' : '#64748b' }}>
                        {type.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Correct option suggestion (if wrong key) */}
          {issueType === 'wrong_key' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Which option do you think is correct? <span style={{ color: '#64748b', fontWeight: 400 }}>(Optional)</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedOption(selectedOption === opt ? '' : opt)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: selectedOption === opt ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedOption === opt ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: selectedOption === opt ? '#34d399' : '#94a3b8',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Option {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Issue Description */}
          <div>
            <label htmlFor="report-description" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Issue Details / Textbook Reference: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              id="report-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Option B is correct because according to PTB Biology Chapter 4 page 52, mitochondria is the powerhouse..."
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                fontSize: '0.88rem',
                lineHeight: 1.4,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '10px 18px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting || !description.trim()}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {submitting ? 'Submitting...' : '🚩 Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
