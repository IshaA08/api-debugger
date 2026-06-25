import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

// Define the structure for saved API requests
interface SavedRequest {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST'
  headers: string
  body: string
  createdAt: string
}

function App() {

  // Set up state variables for the JSON request and response forms
  const [name, setName] = useState('')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [method, setMethod] = useState<'GET' | 'POST'>('GET')
  const [headers, setHeaders] = useState(`{
  "Content-Type": "application/json"
}`)
  const [body, setBody] = useState('')
  const [response, setResponse] = useState('')
  const [status, setStatus] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])

  // Check if there are any saved requests in local storage
  useEffect(() => {
    const stored = localStorage.getItem('apiDebugger.savedRequests')
    if (stored) {
      try {
        setSavedRequests(JSON.parse(stored) as SavedRequest[])
      } catch {
        localStorage.removeItem('apiDebugger.savedRequests')
      }
    }
  }, [])

  // Update the saved requests state and write the JSON string to local storage
  const persistSavedRequests = (requests: SavedRequest[]) => {
    setSavedRequests(requests)
    localStorage.setItem('apiDebugger.savedRequests', JSON.stringify(requests))
  }

  // Handle when the user tries to save a request
  const handleSaveRequest = () => {

    // Make sure the URL isn't empty
    if (!url.trim()) {
      setError('URL is required to save a request')
      return
    }

    // Build a new request object
    const requestName = name.trim() || `${method} ${url}`
    const newRequest: SavedRequest = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      name: requestName,
      url,
      method,
      headers,
      body,
      createdAt: new Date().toISOString(),
    }

    // Save to local storage
    persistSavedRequests([newRequest, ...savedRequests])

    // Clear the name and error
    setName('')
    setError('')
  }

  // Handle when the user tries to load a request
  const handleLoadSavedRequest = (saved: SavedRequest) => {
    setName(saved.name)
    setUrl(saved.url)
    setMethod(saved.method)
    setHeaders(saved.headers)
    setBody(saved.body)
    setResponse('')
    setStatus(null)
    setResponseTime(null)
    setError('')
  }

  // Handle when the user tries to delete a request
  const handleDeleteSavedRequest = (id: string) => {
    persistSavedRequests(savedRequests.filter((item) => item.id !== id))
  }

  // Handle when the user submits an API request
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {

    // Stop normal form submission
    event.preventDefault()

    // Reset response state
    setError('')
    setResponse('')
    setStatus(null)
    setResponseTime(null)

    let parsedHeaders: Record<string, string> = {}
    try {
      parsedHeaders = headers.trim() ? JSON.parse(headers) : {}
    } catch (parseError) {
      setError('Headers must be valid JSON')
      return
    }

    const options: RequestInit = {
      method,
      headers: parsedHeaders,
    }

    // Only include the body for POST requests
    if (method === 'POST' && body) {
      options.body = body
    }

    // Start measuring the request time
    setLoading(true)
    const start = performance.now()

    try {

      // Make the API request
      const res = await fetch(url, options)

      // Stop measuring the request time
      const end = performance.now()
      const text = await res.text()
      setStatus(res.status)

      // Calculate the total time taken
      setResponseTime(Math.round(end - start))

      // Try to pretty-print the response if it's valid JSON, otherwise just store the text as-is
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2))
      } catch {
        setResponse(text)
      }
    } catch (fetchError) {
      setError(`Request failed: ${fetchError}`)
    } finally {
      setLoading(false)
    }
  }

  // Main page HTML structure
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>API Debugger</h1>
        <p>A tool for testing GET and POST API endpoints</p>
      </header>

      <main className="request-panel">
        <form className="request-form" onSubmit={handleSubmit}>
          <label>
            Request name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional: Give this request a name"
            />
          </label>

          <label>
            Endpoint URL
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://api.example.com/resource"
              required
            />
          </label>

          <div className="request-row">
            <label>
              Method
              <select value={method} onChange={(event) => setMethod(event.target.value as 'GET' | 'POST')}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </label>

            <label>
              Headers (JSON)
              <textarea
                value={headers}
                onChange={(event) => setHeaders(event.target.value)}
                rows={4}
              />
            </label>
          </div>

          <label>
            Body (JSON)
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              placeholder='{"key": "value"}'
              disabled={method === 'GET'}
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="run-button" disabled={loading}>
              {loading ? 'Running…' : 'Send Request'}
            </button>
            <button type="button" className="save-button" onClick={handleSaveRequest}>
              Save Request
            </button>
          </div>
        </form>

        <section className="saved-panel">
          <div className="saved-panel-header">
            <h2>Saved requests</h2>
            <p>Load a saved request to edit and/or replay it.</p>
          </div>

          {savedRequests.length === 0 ? (
            <div className="saved-empty">No saved requests yet.</div>
          ) : (
            <ul className="saved-list">
              {savedRequests.map((saved) => (
                <li key={saved.id} className="saved-item">
                  <button type="button" className="saved-load" onClick={() => handleLoadSavedRequest(saved)}>
                    <span className="saved-name">{saved.name}</span>
                    <span className="saved-meta">{saved.method} · {saved.url}</span>
                  </button>
                  <button type="button" className="delete-button" onClick={() => handleDeleteSavedRequest(saved.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="response-panel">
          <div className="response-meta">
            <span>Status: {status ?? '—'}</span>
            <span>Time: {responseTime !== null ? `${responseTime} ms` : '—'}</span>
          </div>

          {error && <div className="response-error">{error}</div>}

          <label>
            Response body
            <textarea value={response} readOnly rows={12} />
          </label>
        </section>
      </main>
    </div>
  )
}

export default App
