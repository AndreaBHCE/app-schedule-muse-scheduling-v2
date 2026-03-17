const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { createClerkClient } = require('@clerk/backend')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authResult = await clerk.authenticateRequest(req)

    if (!authResult.isSignedIn || !authResult.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    req.userId = authResult.userId
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Routes
app.get('/api/appointments', authenticateUser, async (req, res) => {
  try {
    // Forward to proxy worker
    const response = await fetch(`${process.env.PROXY_WORKER_URL}/appointments`, {
      headers: {
        'X-API-Key': process.env.PROXY_API_KEY,
        'X-User-Id': req.userId,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (error) {
    console.error('Appointments API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/appointments', authenticateUser, async (req, res) => {
  try {
    // Forward to proxy worker
    const response = await fetch(`${process.env.PROXY_WORKER_URL}/appointments`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.PROXY_API_KEY,
        'X-User-Id': req.userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (error) {
    console.error('Create appointment API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/availability', authenticateUser, async (req, res) => {
  try {
    const { staffId, date } = req.query

    if (!staffId || !date) {
      return res.status(400).json({ error: 'Missing staffId or date parameter' })
    }

    // Forward to proxy worker
    const response = await fetch(
      `${process.env.PROXY_WORKER_URL}/availability?staffId=${staffId}&date=${date}`,
      {
        headers: {
          'X-API-Key': process.env.PROXY_API_KEY,
          'X-User-Id': req.userId,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (error) {
    console.error('Availability API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})