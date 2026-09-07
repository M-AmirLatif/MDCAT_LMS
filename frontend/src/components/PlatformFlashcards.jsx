import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import MCQRenderer from './MCQRenderer'

export default function PlatformFlashcards() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({ total: 0, due: 0 })
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, cardsRes] = await Promise.all([
        API.get('/flashcards/stats'),
        API.get('/flashcards/due')
      ])
      setStats({ total: statsRes.data.total, due: statsRes.data.due })
      setCards(cardsRes.data.flashcards || [])
    } catch (err) {
      toast.error('Could not load flashcards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentCard = cards[currentIndex]

  const handleRate = async (quality) => {
    if (reviewing || !currentCard) return
    setReviewing(true)
    try {
      await API.put(`/flashcards/${currentCard._id}/review`, { quality })
      
      const newDueCount = Math.max(0, stats.due - 1)
      setStats(s => ({ ...s, due: newDueCount }))
      
      if (currentIndex < cards.length - 1) {
        setShowAnswer(false)
        setCurrentIndex(prev => prev + 1)
      } else {
        setShowAnswer(false)
        await loadData()
        setCurrentIndex(0)
      }
    } catch (err) {
      toast.error('Could not save review')
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="workspace-page animate-fade-up">
        <div className="workspace-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '16px', color: 'var(--text-dim)' }}>Loading flashcards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace-page animate-fade-up">
      <Helmet>
        <title>Spaced Repetition Flashcards | MDCAT LMS</title>
      </Helmet>

      <section className="workspace-card" style={{ marginBottom: '24px' }}>
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Practice</div>
            <h1 className="workspace-card-title">Flashcards</h1>
            <p>Master your weaknesses using spaced repetition. Cards adapt to your performance.</p>
          </div>
          <div className="inline-actions">
            <div className="state-chip state-chip--neutral">{stats.total} Total Saved</div>
            <div className={`state-chip ${stats.due > 0 ? 'state-chip--red' : 'state-chip--green'}`}>
              {stats.due} Due Today
            </div>
          </div>
        </div>
      </section>

      {!currentCard ? (
        <section className="workspace-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>You're all caught up! </h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>
            There are no flashcards due for review right now.
            <br />Take a chapter test and save difficult questions to build your deck!
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/mcqs')}>
            Practice Subject MCQs
          </button>
        </section>
      ) : (
        <section className="workspace-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="label-xs" style={{ color: 'var(--accent-purple)' }}>{currentCard.subject}</div>
            <div className="label-xs" style={{ color: 'var(--text-dim)' }}>
              Card {currentIndex + 1} of {cards.length}
            </div>
          </div>

          <div style={{ padding: '32px 24px' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '24px' }}>
              <MCQRenderer text={currentCard.mcqId?.question} />
            </div>

            {!showAnswer ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                <button 
                  className="btn btn-primary btn-lg" 
                  style={{ minWidth: '200px' }} 
                  onClick={() => setShowAnswer(true)}
                >
                  Show Answer
                </button>
              </div>
            ) : (
              <div className="animate-fade-up">
                <div style={{ padding: '20px', background: 'var(--bg-layer-2)', borderRadius: '8px', marginBottom: '32px' }}>
                  <div className="label-xs" style={{ color: 'var(--accent-green)', marginBottom: '8px' }}>Correct Answer</div>
                  <MCQRenderer 
                    text={
                      currentCard.mcqId?.options[currentCard.mcqId?.correctOptionIndex]?.text ||
                      currentCard.mcqId?.options[currentCard.mcqId?.correctOptionIndex]
                    } 
                  />
                  
                  {(currentCard.mcqId?.explanationText || currentCard.mcqId?.explanation) && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                      <div className="label-xs" style={{ marginBottom: '8px' }}>Explanation</div>
                      <MCQRenderer text={currentCard.mcqId.explanationText || currentCard.mcqId.explanation} />
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '16px', fontSize: '0.875rem' }}>How well did you remember this?</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                      onClick={() => handleRate(0)}
                      disabled={reviewing}
                    >
                      Complete Blackout (0)
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.2)' }}
                      onClick={() => handleRate(1)}
                      disabled={reviewing}
                    >
                      Incorrect, but remembered (1)
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: '#eab308', borderColor: 'rgba(234,179,8,0.2)' }}
                      onClick={() => handleRate(3)}
                      disabled={reviewing}
                    >
                      Hard (3)
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.2)' }}
                      onClick={() => handleRate(4)}
                      disabled={reviewing}
                    >
                      Good (4)
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }}
                      onClick={() => handleRate(5)}
                      disabled={reviewing}
                    >
                      Perfect (5)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
