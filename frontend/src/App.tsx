import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'YOUR_API_URL_HERE'
const WS_URL = import.meta.env.VITE_WS_URL || 'YOUR_WS_URL_HERE'

interface Card {
  id: string
  title: string
  description: string
  column: string
  position: number
  storyPoints?: number
  priority?: 'low' | 'medium' | 'high'
  aiGenerated?: boolean
  acceptanceCriteria?: string[]
}

interface CardSplitSuggestion {
  originalCard: {
    title: string
    description: string
    storyPoints: number
    priority: string
    acceptanceCriteria: string[]
  }
  reason: string
  splitCards: {
    title: string
    description: string
    storyPoints: number
    priority: string
    acceptanceCriteria: string[]
  }[]
}

const COLUMNS = ['To Do', 'In Progress', 'Done']

interface Alert {
  id: string
  severity: 'low' | 'medium' | 'high'
  category: string
  message: string
  affectedCards?: string[]
  affectedColumn?: string
  recommendations: string[]
  timestamp: string
  acknowledged: boolean
}

function App() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [newCard, setNewCard] = useState({ title: '', description: '', column: 'To Do' })
  const [aiDescription, setAiDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(true)
  
  // AI Request Status Management
  const [aiRequestStatus, setAiRequestStatus] = useState<'ready' | 'processing' | 'retrying' | 'rate-limited'>('ready')
  const [retryCountdown, setRetryCountdown] = useState(0)
  
  // Card Split Preview
  const [showSplitPreview, setShowSplitPreview] = useState(false)
  const [splitSuggestion, setSplitSuggestion] = useState<CardSplitSuggestion | null>(null)

  // Load alerts from localStorage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem('flowstate-alerts')
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts))
      } catch (e) {
        console.error('Failed to load alerts:', e)
      }
    }
    
    const panelState = localStorage.getItem('flowstate-alerts-panel-open')
    if (panelState !== null) {
      setAlertsPanelOpen(panelState === 'true')
    }
  }, [])

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowstate-alerts', JSON.stringify(alerts))
  }, [alerts])

  // Save panel state
  useEffect(() => {
    localStorage.setItem('flowstate-alerts-panel-open', String(alertsPanelOpen))
  }, [alertsPanelOpen])

  // Countdown timer for rate limiting
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (retryCountdown === 0 && aiRequestStatus === 'rate-limited') {
      setAiRequestStatus('ready')
    }
  }, [retryCountdown, aiRequestStatus])


  // Fetch cards
  useEffect(() => {
    fetchCards()
  }, [])

  // WebSocket connection
  useEffect(() => {
    if (!WS_URL || WS_URL === 'YOUR_WS_URL_HERE') return

    const ws = new WebSocket(WS_URL)
    
    ws.onopen = () => {
      // WebSocket connected
    }
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      if (message.type === 'card_created' || message.type === 'card_updated') {
        fetchCards() // Refresh cards
      } else if (message.type === 'card_deleted') {
        setCards(prev => prev.filter(c => c.id !== message.data.id))
      } else if (message.type === 'bottleneck_alerts') {
        const newAlerts = message.data.map((alert: any) => ({
          ...alert,
          id: `${alert.category}-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        }))
        
        // Merge with existing alerts, avoiding duplicates based on category and message
        setAlerts(prev => {
          const existingKeys = new Set(prev.map(a => `${a.category}-${a.message}`))
          const uniqueNewAlerts = newAlerts.filter((a: Alert) => 
            !existingKeys.has(`${a.category}-${a.message}`)
          )
          return [...prev, ...uniqueNewAlerts]
        })
        
        // Auto-open panel when new alerts arrive
        if (newAlerts.length > 0) {
          setAlertsPanelOpen(true)
        }
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    ws.onclose = () => {
      // WebSocket disconnected
    }
    
    return () => ws.close()
  }, [])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ))
  }

  const acknowledgeAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
  }

  const clearAcknowledgedAlerts = () => {
    setAlerts(prev => prev.filter(a => !a.acknowledged))
  }

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length

  const fetchCards = async () => {
    try {
      const response = await fetch(`${API_URL}/cards`)
      const data = await response.json()
      setCards(data)
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCard = async () => {
    try {
      const response = await fetch(`${API_URL}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCard),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create card')
      }
      
      const card = await response.json()
      setCards(prev => [...prev, card])
      setNewCard({ title: '', description: '', column: 'To Do' })
      setShowAddCard(false)
    } catch (error) {
      console.error('Error creating card:', error)
      alert('Failed to create card. Please try again.')
    }
  }

  const createAICard = async () => {
    setAiLoading(true)
    setAiRequestStatus('processing')
    try {
      const response = await fetch(`${API_URL}/ai-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription }),
      })
      
      if (response.status === 429) {
        // Rate limited
        const error = await response.json()
        const retryAfter = error.retryAfter || 30
        setRetryCountdown(retryAfter)
        setAiRequestStatus('rate-limited')
        alert(`Rate limited. Please wait ${retryAfter} seconds before trying again.`)
        return
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create AI card')
      }
      
      const result = await response.json()
      
      console.log('AI Task Response:', result) // Debug log
      
      // Check if it's a split suggestion
      if (result.type === 'split_suggestion') {
        console.log('Split suggestion detected, showing modal') // Debug log
        setSplitSuggestion(result)
        setShowSplitPreview(true)
        setShowAIModal(false)
      } else {
        // Regular card creation
        console.log('Regular card creation') // Debug log
        setCards(prev => [...prev, result])
        setAiDescription('')
        setShowAIModal(false)
      }
      
      setAiRequestStatus('ready')
    } catch (error: any) {
      console.error('Error creating AI card:', error)
      alert(error.message || 'Failed to create AI card. Please ensure Bedrock is enabled in your AWS account.')
      setAiRequestStatus('ready')
    } finally {
      setAiLoading(false)
    }
  }

  const handleApproveSplit = async () => {
    if (!splitSuggestion) return
    
    setAiLoading(true)
    try {
      // Create each split card
      for (const splitCard of splitSuggestion.splitCards) {
        const response = await fetch(`${API_URL}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: splitCard.title,
            description: splitCard.description,
            column: 'To Do',
            storyPoints: splitCard.storyPoints,
            priority: splitCard.priority,
            aiGenerated: true,
            acceptanceCriteria: splitCard.acceptanceCriteria,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to create split card')
        }
        
        const card = await response.json()
        setCards(prev => [...prev, card])
      }
      
      setShowSplitPreview(false)
      setSplitSuggestion(null)
      setAiDescription('')
      alert(`Successfully created ${splitSuggestion.splitCards.length} cards!`)
    } catch (error: any) {
      console.error('Error creating split cards:', error)
      alert(error.message || 'Failed to create split cards.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleRejectSplit = async () => {
    if (!splitSuggestion) return
    
    setAiLoading(true)
    try {
      // Create the original card anyway
      const original = splitSuggestion.originalCard
      const response = await fetch(`${API_URL}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: original.title,
          description: original.description,
          column: 'To Do',
          storyPoints: original.storyPoints,
          priority: original.priority,
          aiGenerated: true,
          acceptanceCriteria: original.acceptanceCriteria,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create card')
      }
      
      const card = await response.json()
      setCards(prev => [...prev, card])
      
      setShowSplitPreview(false)
      setSplitSuggestion(null)
      setAiDescription('')
      alert('Card created successfully!')
    } catch (error: any) {
      console.error('Error creating card:', error)
      alert(error.message || 'Failed to create card.')
    } finally {
      setAiLoading(false)
    }
  }

  const moveCard = async (cardId: string, newColumn: string) => {
    try {
      const response = await fetch(`${API_URL}/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: newColumn }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to move card')
      }
      
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, column: newColumn } : c))
    } catch (error) {
      console.error('Error moving card:', error)
      alert('Failed to move card. Please try again.')
    }
  }

  const deleteCard = async (cardId: string) => {
    if (!confirm('Delete this card?')) return
    try {
      const response = await fetch(`${API_URL}/cards/${cardId}`, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error('Failed to delete card')
      }
      
      setCards(prev => prev.filter(c => c.id !== cardId))
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('Failed to delete card. Please try again.')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="app">
      <header className="header">
        <h1>🌊 FlowState</h1>
        <div className="header-actions">
          {/* AI Status Indicator */}
          <div className={`ai-status-indicator status-${aiRequestStatus}`}>
            {aiRequestStatus === 'ready' && '✓ Ready'}
            {aiRequestStatus === 'processing' && '⏳ Processing...'}
            {aiRequestStatus === 'retrying' && '🔄 Retrying...'}
            {aiRequestStatus === 'rate-limited' && `⏱️ Rate Limited - Wait ${retryCountdown}s`}
          </div>
          <button onClick={() => setShowAddCard(true)} className="btn btn-primary">
            + Add Card
          </button>
          <button 
            onClick={() => setShowAIModal(true)} 
            className="btn btn-ai"
            disabled={aiRequestStatus === 'rate-limited'}
          >
            {aiLoading ? '⏳ Generating...' : '✨ Create with AI'}
          </button>
        </div>
      </header>

      <div className="board">
        {COLUMNS.map(column => (
          <div 
            key={column} 
            className="column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const cardId = e.dataTransfer.getData('cardId')
              if (cardId) moveCard(cardId, column)
            }}
          >
            <div className="column-header">
              <h2>{column}</h2>
              <span className="card-count">
                {cards.filter(c => c.column === column).length}
              </span>
            </div>
            <div className="cards">
              {cards
                .filter(c => c.column === column)
                .map(card => (
                  <div 
                    key={card.id} 
                    className="card"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('cardId', card.id)
                      e.currentTarget.style.opacity = '0.5'
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <div className="card-header">
                      <h3>{card.title}</h3>
                      {card.aiGenerated && <span className="ai-badge">✨ AI</span>}
                    </div>
                    <p className="card-description">{card.description}</p>
                    {card.storyPoints && (
                      <div className="card-meta">
                        <span>📊 {card.storyPoints} pts</span>
                      </div>
                    )}
                    <div className="card-actions">
                      {column !== 'To Do' && (
                        <button onClick={() => moveCard(card.id, COLUMNS[COLUMNS.indexOf(column) - 1])}>
                          ← Move Left
                        </button>
                      )}
                      {column !== 'Done' && (
                        <button onClick={() => moveCard(card.id, COLUMNS[COLUMNS.indexOf(column) + 1])}>
                          Move Right →
                        </button>
                      )}
                      <button onClick={() => deleteCard(card.id)} className="btn-delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="modal-overlay" onClick={() => setShowAddCard(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add New Card</h2>
            <input
              type="text"
              placeholder="Title"
              value={newCard.title}
              onChange={e => setNewCard({ ...newCard, title: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newCard.description}
              onChange={e => setNewCard({ ...newCard, description: e.target.value })}
            />
            <select
              value={newCard.column}
              onChange={e => setNewCard({ ...newCard, column: e.target.value })}
            >
              {COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowAddCard(false)} className="btn">Cancel</button>
              <button onClick={createCard} className="btn btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>✨ Create Card with AI</h2>
            <p>Describe your task in natural language:</p>
            <textarea
              placeholder="e.g., Create a login page with email and password fields, including validation and error handling"
              value={aiDescription}
              onChange={e => setAiDescription(e.target.value)}
              rows={5}
            />
            <div className="modal-actions">
              <button onClick={() => setShowAIModal(false)} className="btn">Cancel</button>
              <button 
                onClick={createAICard} 
                className="btn btn-ai"
                disabled={aiLoading || !aiDescription || aiRequestStatus === 'rate-limited'}
              >
                {aiLoading ? 'Generating...' : 'Generate Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Preview Modal */}
      {showSplitPreview && splitSuggestion && (
        <div className="modal-overlay" onClick={() => setShowSplitPreview(false)}>
          <div className="modal split-preview-modal" onClick={e => e.stopPropagation()}>
            <h2>🔀 Card Split Suggestion</h2>
            <p className="split-reason">{splitSuggestion.reason}</p>
            
            <div className="split-original-card">
              <h3>Original Card (Too Large)</h3>
              <div className="card-preview">
                <h4>{splitSuggestion.originalCard.title}</h4>
                <p>{splitSuggestion.originalCard.description}</p>
                <div className="card-meta">
                  <span className="story-points-badge large">
                    📊 {splitSuggestion.originalCard.storyPoints} pts
                  </span>
                  <span className="priority-badge">
                    {splitSuggestion.originalCard.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="split-suggested-cards">
              <h3>Suggested Split ({splitSuggestion.splitCards.length} cards)</h3>
              <div className="split-cards-grid">
                {splitSuggestion.splitCards.map((card, index) => (
                  <div key={index} className="card-preview split-card">
                    <h4>{card.title}</h4>
                    <p>{card.description}</p>
                    <div className="card-meta">
                      <span className="story-points-badge">
                        📊 {card.storyPoints} pts
                      </span>
                      <span className="priority-badge">
                        {card.priority}
                      </span>
                    </div>
                    {card.acceptanceCriteria && card.acceptanceCriteria.length > 0 && (
                      <div className="acceptance-criteria">
                        <strong>Acceptance Criteria:</strong>
                        <ul>
                          {card.acceptanceCriteria.map((criteria, i) => (
                            <li key={i}>{criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="split-comparison">
              <p>
                <strong>Total Story Points:</strong> Original: {splitSuggestion.originalCard.storyPoints} pts → 
                Split: {splitSuggestion.splitCards.reduce((sum, card) => sum + card.storyPoints, 0)} pts
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={handleRejectSplit} 
                className="btn"
                disabled={aiLoading}
              >
                Create Original Anyway
              </button>
              <button 
                onClick={handleApproveSplit} 
                className="btn btn-primary"
                disabled={aiLoading}
              >
                {aiLoading ? 'Creating...' : `Create ${splitSuggestion.splitCards.length} Split Cards`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottleneck Alerts Side Panel */}
      <div className={`alerts-panel ${alertsPanelOpen ? 'open' : 'closed'}`}>
        <div className="alerts-panel-toggle" onClick={() => setAlertsPanelOpen(!alertsPanelOpen)}>
          <span className="toggle-icon">{alertsPanelOpen ? '→' : '←'}</span>
          <span className="toggle-text">
            Alerts {unacknowledgedCount > 0 && `(${unacknowledgedCount})`}
          </span>
        </div>
        
        {alertsPanelOpen && (
          <div className="alerts-panel-content">
            <div className="alerts-panel-header">
              <h3>🔔 Workflow Alerts</h3>
              <div className="alerts-panel-actions">
                {unacknowledgedCount > 0 && (
                  <button onClick={acknowledgeAllAlerts} className="btn-acknowledge-all">
                    Acknowledge All
                  </button>
                )}
                {alerts.some(a => a.acknowledged) && (
                  <button onClick={clearAcknowledgedAlerts} className="btn-clear">
                    Clear Acknowledged
                  </button>
                )}
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="alerts-empty">
                <p>✨ No alerts</p>
                <p className="alerts-empty-subtitle">Your workflow is running smoothly!</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`alert alert-${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}`}
                  >
                    <div className="alert-header">
                      <span className="alert-icon">
                        {alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                      </span>
                      <strong>{alert.category.replace(/_/g, ' ').toUpperCase()}</strong>
                      {!alert.acknowledged && (
                        <button 
                          onClick={() => acknowledgeAlert(alert.id)} 
                          className="btn-acknowledge"
                          title="Acknowledge"
                        >
                          ✓
                        </button>
                      )}
                      {alert.acknowledged && (
                        <span className="acknowledged-badge">✓ Acknowledged</span>
                      )}
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    {alert.recommendations && alert.recommendations.length > 0 && (
                      <div className="alert-recommendations">
                        <strong>Recommendations:</strong>
                        <ul>
                          {alert.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="alert-timestamp">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
