# EmployeeHub — Production Deployment & Operations Runbook

## 1. Production Architecture Overview

EmployeeHub is designed as a unified, high-performance Human Resource Management System. It serves both static frontend assets (HTML5/CSS3/ES6+ JavaScript) and authenticated REST API endpoints over a single unified port (default `3000`).

```
Internet / Corporate WAN
        │
        ▼ (HTTPS :443)
┌────────────────────────────────────────┐
│  Reverse Proxy (Nginx / Cloudflare)    │
│  - SSL/TLS Termination (TLS 1.3)       │
│  - Security Headers (HSTS, CSP)        │
│  - DDoS Protection & Compression       │
└───────────────────┬────────────────────┘
                    │ (HTTP :3000)
┌───────────────────▼────────────────────┐
│  EmployeeHub Application Instance      │
│  (Node.js 22 LTS / Express 5)          │
│  - Static Asset Delivery               │
│  - JWT & Cookie Session Layer          │
│  - Centralized RBAC & Branch Scoping   │
│  - Fixed-Precision Financial Engine    │
│  - Append-Only Audit Logging           │
└───────────────────┬────────────────────┘
                    │
┌───────────────────▼────────────────────┐
│  Managed PostgreSQL 16 Database        │
│  (or Local SQLite WAL for Edge Nodes)  │
│  - 36 Normalized Relational Tables     │
│  - Foreign Key Referential Integrity   │
│  - Versioned Migration History         │
└────────────────────────────────────────┘
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` on the host machine:

| Variable | Description | Recommended Production Value |
|---|---|---|
| `NODE_ENV` | Application environment mode | `production` |
| `PORT` | Local binding port | `3000` |
| `APP_URL` | Canonical public URL of the application | `https://hub.yourcompany.com` |
| `DB_CLIENT` | Database adapter (`postgres` or `sqlite`) | `postgres` |
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://usr:pwd@db-host:5432/hub_db?sslmode=require` |
| `JWT_SECRET` | 256-bit cryptographically random secret | `[Generated 64-char Hex String]` |
| `JWT_EXPIRES_IN` | Token validity duration | `24h` |
| `CORS_ORIGIN` | Allowed origin for API requests | `https://hub.yourcompany.com` |
| `COOKIE_SECURE` | Enforce HTTPS-only cookie transmission | `true` |
| `RATE_LIMIT_AUTH_MAX` | Max failed login attempts per 15 mins | `10` |

---

## 3. Database Migration Runbook

EmployeeHub uses idempotent, version-controlled database migrations tracked in `schema_migrations`.

### Fresh Setup:
```bash
# 1. Execute SQL schema migrations
npm run migrate

# 2. Seed initial lookup tables (roles, permissions, settings, branches)
npm run seed
```

### Upgrading an Existing Production Database:
1. Always take a pre-migration snapshot:
   ```bash
   pg_dump -U employeehub_user -h db.internal -Fc employeehub_db > backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump
   ```
2. Run migrations:
   ```bash
   npm run migrate
   ```
3. Verify migration table:
   ```sql
   SELECT migration_name, executed_at FROM schema_migrations ORDER BY id DESC LIMIT 5;
   ```

---

## 4. HTTPS, Reverse Proxy & Network Security

### Nginx Reverse Proxy Configuration Template
```nginx
server {
    listen 80;
    server_name hub.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hub.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/hub.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hub.yourcompany.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

---

## 5. Backup & Disaster Recovery (DR) Plan

### Key Assumptions
- **Recovery Point Objective (RPO):** Maximum 1 hour of transaction loss.
- **Recovery Time Objective (RTO):** Maximum 15 minutes to full service restoration.

### Automated Nightly Backup Script (`scripts/backup.sh`)
```bash
#!/bin/bash
set -e
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/employeehub"
mkdir -p "$BACKUP_DIR"

# PostgreSQL encrypted archive
pg_dump -U employeehub_user -h 127.0.0.1 -Fc employeehub_db | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -pass file:/etc/employeehub/backup.key \
  -out "$BACKUP_DIR/db_$TIMESTAMP.dump.enc"

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -mtime +30 -name "db_*.dump.enc" -delete
```

### Database Restoration Runbook
```bash
# 1. Decrypt backup archive
openssl enc -d -aes-256-cbc -pbkdf2 -pass file:/etc/employeehub/backup.key \
  -in /var/backups/employeehub/db_20261014_000000.dump.enc \
  -out /tmp/restore.dump

# 2. Restore PostgreSQL database
pg_restore -U employeehub_user -h 127.0.0.1 -d employeehub_db --clean --if-exists /tmp/restore.dump

# 3. Clean up plaintext file
rm -f /tmp/restore.dump

# 4. Verify connectivity
curl -f http://localhost:3000/api/health
```

---

## 6. Production Rollback Procedures

If a critical failure occurs during deployment:
1. **Application Code Regressions:**
   - Stop current application service: `docker-compose down` or `systemctl stop employeehub`
   - Checkout previous stable release commit or deploy previous Docker image tag:
     ```bash
     docker tag employeehub-app:previous employeehub-app:latest
     docker-compose up -d
     ```
2. **Database Schema Rollbacks:**
   - If backward-incompatible changes were executed, restore from pre-deployment snapshot:
     ```bash
     pg_restore -U employeehub_user -d employeehub_db --clean backup_pre_migration.dump
     ```
3. **Verify Health:**
   - `curl -f http://localhost:3000/api/health/ready`

---

## 7. Production Smoke-Test Checklist

Execute this checklist immediately following deployment to staging or production:

- [ ] **1. Health Endpoint:** `curl http://localhost:3000/api/health` returns HTTP 200 with `status: UP` and `database: CONNECTED`.
- [ ] **2. Static Assets:** Browser loads `index.html`, `css/variables.css`, `css/admin.css`, and `js/app.js` with HTTP 200.
- [ ] **3. Authentication:** Login with `admin@employeehub.demo` succeeds, returns JWT token, and displays user dashboard.
- [ ] **4. Invalidation:** Invalid password returns HTTP 401 with appropriate message.
- [ ] **5. Authorization & RBAC:** Logging in as employee (ESS) and calling `/api/users` returns HTTP 403 Forbidden.
- [ ] **6. Branch Scoping:** Branch Manager token restricts employee roster query to their authorized office.
- [ ] **7. User Management:** Admin can view `/api/users` table, create a new user, and reset credentials.
- [ ] **8. Audit Logging:** Security actions (logins, user creations) appear in `/api/audit-logs`.
- [ ] **9. Advanced Reports:** Headcount report `/api/reports/headcount` aggregates real metrics from the database.
- [ ] **10. CSV Operations:**
  - Dry-run validation works without committing.
  - Formula injection cells (`=1+1`) are escaped with `'` in exported spreadsheets.
- [ ] **11. Payroll Lifecycle:** Batch calculation produces exact fixed-precision gross, statutory deductions, and net pay. Finalized batches reject mutations.
- [ ] **12. Zero Errors in Console:** Browser DevTools console contains no unhandled script or CSS errors.
