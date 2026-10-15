const db = require('../db/connection');
const auditService = require('./auditService');

async function getSettings() {
  const settings = await db.get('SELECT * FROM system_settings WHERE id = "global_settings"');
  return settings || {
    id: 'global_settings',
    org_name: 'EmployeeHub Multi-Branch Enterprise',
    org_code: 'EH-CORP',
    contact_email: 'admin@employeehub.demo',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    date_format: 'YYYY-MM-DD',
    session_timeout_mins: 1440
  };
}

async function updateSettings(data, actingUser) {
  const { orgName, orgCode, contactEmail, timezone, currency, dateFormat, sessionTimeoutMins } = data;

  const current = await getSettings();

  const newOrgName = orgName ? orgName.trim() : current.org_name;
  const newOrgCode = orgCode ? orgCode.trim() : current.org_code;
  const newContactEmail = contactEmail ? contactEmail.trim() : current.contact_email;
  const newTimezone = timezone || current.timezone;
  const newCurrency = currency || current.currency;
  const newDateFormat = dateFormat || current.date_format;
  const newTimeout = sessionTimeoutMins ? Number(sessionTimeoutMins) : current.session_timeout_mins;

  await db.run(`
    UPDATE system_settings
    SET org_name = ?, org_code = ?, contact_email = ?, timezone = ?,
        currency = ?, date_format = ?, session_timeout_mins = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 'global_settings'
  `, [newOrgName, newOrgCode, newContactEmail, newTimezone, newCurrency, newDateFormat, newTimeout]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'SETTINGS_UPDATED',
    targetType: 'SETTINGS',
    targetId: 'global_settings',
    details: { orgName: newOrgName, contactEmail: newContactEmail, timezone: newTimezone }
  });

  return getSettings();
}

module.exports = {
  getSettings,
  updateSettings
};
