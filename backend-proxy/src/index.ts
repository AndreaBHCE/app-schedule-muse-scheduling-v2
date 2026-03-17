interface Env {
  DB: D1Database
  CACHE: KVNamespace
  API_KEY: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Simple API key authentication for requests from Fly.io backend
    const authHeader = request.headers.get('X-API-Key')
    if (!authHeader || authHeader !== env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get userId from custom header set by Fly.io backend
    const userId = request.headers.get('X-User-Id')
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(request.url)
    const path = url.pathname

    // Route to appropriate handler
    switch (path) {
      case '/appointments':
        return handleAppointments(request, env, userId)
      case '/availability':
        return handleAvailability(request, env, userId)
      case '/cache':
        return handleCache(request, env, userId)
      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
    }
  }
}

async function handleAppointments(request: Request, env: Env, userId: string): Promise<Response> {
  if (request.method === 'GET') {
    // Get user's appointments
    const appointments = await env.DB.prepare(
      'SELECT * FROM appointments WHERE user_id = ? ORDER BY start_time DESC'
    ).bind(userId).all()

    return new Response(JSON.stringify(appointments.results), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (request.method === 'POST') {
    const body = await request.json() as any

    // Insert new appointment
    const result = await env.DB.prepare(
      `INSERT INTO appointments (user_id, staff_id, service_id, start_time, end_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      body.staffId,
      body.serviceId,
      body.startTime,
      body.endTime,
      'confirmed',
      body.notes || ''
    ).run()

    return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handleAvailability(request: Request, env: Env, userId: string): Promise<Response> {
  const url = new URL(request.url)
  const staffId = url.searchParams.get('staffId')
  const date = url.searchParams.get('date')

  if (!staffId || !date) {
    return new Response(JSON.stringify({ error: 'Missing staffId or date parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get staff availability for the specified date
  const availability = await env.DB.prepare(
    `SELECT * FROM availability
     WHERE staff_id = ? AND date = ?
     ORDER BY start_time`
  ).bind(staffId, date).all()

  // Get existing appointments for conflict checking
  const appointments = await env.DB.prepare(
    `SELECT start_time, end_time FROM appointments
     WHERE staff_id = ? AND DATE(start_time) = ? AND status != 'cancelled'`
  ).bind(staffId, date).all()

  return new Response(JSON.stringify({
    availability: availability.results,
    bookedSlots: appointments.results
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handleCache(request: Request, env: Env, userId: string): Promise<Response> {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (request.method === 'GET') {
    const value = await env.CACHE.get(`${userId}:${key}`)
    return new Response(JSON.stringify({ value }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (request.method === 'POST') {
    const body = await request.json() as any
    await env.CACHE.put(`${userId}:${key}`, JSON.stringify(body.value), {
      expirationTtl: body.ttl || 3600 // Default 1 hour
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  })
}