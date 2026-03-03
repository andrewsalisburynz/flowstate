import { useState, useEffect } from 'react'
import './TeamPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'YOUR_API_URL_HERE'

interface TeamMember {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ConfirmDialog {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null)

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        }
      })
    })
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/team-members`)
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      const data = await response.json()
      setTeamMembers(data)
    } catch (error) {
      console.error('Error fetching team members:', error)
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeamMember = async () => {
    if (!newMemberName.trim()) {
      setError('Name cannot be empty')
      return
    }

    try {
      const response = await fetch(`${API_URL}/team-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team member')
      }

      const newMember = await response.json()
      setTeamMembers(prev => [...prev, newMember].sort((a, b) => a.name.localeCompare(b.name)))
      setNewMemberName('')
      setShowAddForm(false)
      setError(null)
      showToast('Team member added successfully!', 'success')
    } catch (error: any) {
      console.error('Error creating team member:', error)
      setError(error.message || 'Failed to create team member')
    }
  }

  const handleEditTeamMember = async (id: string) => {
    if (!editingName.trim()) {
      setError('Name cannot be empty')
      return
    }

    try {
      const response = await fetch(`${API_URL}/team-members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team member')
      }

      const updatedMember = await response.json()
      setTeamMembers(prev => 
        prev.map(m => m.id === id ? updatedMember : m).sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null)
      setEditingName('')
      setError(null)
      showToast('Team member updated successfully!', 'success')
    } catch (error: any) {
      console.error('Error updating team member:', error)
      setError(error.message || 'Failed to update team member')
    }
  }

  const handleDeleteTeamMember = async (id: string, name: string) => {
    const confirmed = await showConfirm(`Delete team member "${name}"? This will unassign them from all cards.`)
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/team-members/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete team member')
      }

      setTeamMembers(prev => prev.filter(m => m.id !== id))
      setError(null)
      showToast('Team member deleted successfully!', 'success')
    } catch (error: any) {
      console.error('Error deleting team member:', error)
      setError(error.message || 'Failed to delete team member')
    }
  }

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id)
    setEditingName(member.name)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setError(null)
  }

  if (loading) {
    return <div className="team-page-loading">Loading team members...</div>
  }

  return (
    <div className="team-page">
      <div className="team-page-header">
        <h2>👥 Team Members</h2>
        <button 
          onClick={() => {
            setShowAddForm(true)
            setError(null)
          }} 
          className="btn btn-primary"
          data-testid="add-team-member-button"
        >
          + Add Team Member
        </button>
      </div>

      {error && (
        <div className="error-message" data-testid="error-message">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="add-member-form" data-testid="add-member-form">
          <input
            type="text"
            placeholder="Enter name"
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTeamMember()}
            autoFocus
            data-testid="add-member-name-input"
          />
          <div className="form-actions">
            <button 
              onClick={handleAddTeamMember} 
              className="btn btn-primary"
              data-testid="add-member-save-button"
            >
              Save
            </button>
            <button 
              onClick={() => {
                setShowAddForm(false)
                setNewMemberName('')
                setError(null)
              }} 
              className="btn"
              data-testid="add-member-cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {teamMembers.length === 0 ? (
        <div className="team-empty" data-testid="team-empty-state">
          <p>No team members yet</p>
          <p className="team-empty-subtitle">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="team-members-list" data-testid="team-members-list">
          {teamMembers.map(member => (
            <div key={member.id} className="team-member-item" data-testid={`team-member-${member.id}`}>
              {editingId === member.id ? (
                <div className="edit-member-form">
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEditTeamMember(member.id)}
                    autoFocus
                    data-testid={`edit-member-name-input-${member.id}`}
                  />
                  <div className="form-actions">
                    <button 
                      onClick={() => handleEditTeamMember(member.id)} 
                      className="btn btn-primary"
                      data-testid={`edit-member-save-button-${member.id}`}
                    >
                      Save
                    </button>
                    <button 
                      onClick={cancelEdit} 
                      className="btn"
                      data-testid={`edit-member-cancel-button-${member.id}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="team-member-info">
                    <span className="team-member-name">{member.name}</span>
                    <span className="team-member-date">
                      Added {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="team-member-actions">
                    <button 
                      onClick={() => startEdit(member)} 
                      className="btn btn-edit"
                      data-testid={`edit-member-button-${member.id}`}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTeamMember(member.id, member.name)} 
                      className="btn btn-delete"
                      data-testid={`delete-member-button-${member.id}`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={confirmDialog.onCancel}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Confirm Action</h3>
            <p>{confirmDialog.message}</p>
            <div className="modal-actions">
              <button onClick={confirmDialog.onCancel} className="btn">
                Cancel
              </button>
              <button onClick={confirmDialog.onConfirm} className="btn btn-primary">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
