const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Basic Health Check
router.get('/', async (req, res) => {
  try {
    const dbTest = await db.get('SELECT 1 as ok');
    const dbHealthy = !!(dbTest && dbTest.ok === 1);

    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'EmployeeHub Core API',
      database: dbHealthy ? 'CONNECTED' : 'DISCONNECTED'
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: 'Health check failed.'
    });
  }
});

// Liveness probe (Kubernetes / container orchestration)
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'ALIVE', uptime: process.uptime() });
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    const dbTest = await db.get('SELECT 1 as ok');
    if (dbTest && dbTest.ok === 1) {
      return res.status(200).json({ status: 'READY' });
    }
    res.status(503).json({ status: 'NOT_READY', reason: 'Database unavailable' });
  } catch (err) {
    res.status(503).json({ status: 'NOT_READY', reason: 'Database error' });
  }
});

module.exports = router;
