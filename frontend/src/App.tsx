import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

function App() {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

    if (method === 'POST' && body) {
      options.body = body
    }

    setLoading(true)
    const start = performance.now()

    try {
      const res = await fetch(url, options)
      const end = performance.now()
      const text = await res.text()
      setStatus(res.status)
      setResponseTime(Math.round(end - start))

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

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>API Debugger</h1>
        <p>Paste an endpoint, choose GET or POST, add headers/body, and run the request.</p>
      </header>

      <main className="request-panel">
        <form className="request-form" onSubmit={handleSubmit}>
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

          <button type="submit" className="run-button" disabled={loading}>
            {loading ? 'Running…' : 'Send Request'}
          </button>
        </form>

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
