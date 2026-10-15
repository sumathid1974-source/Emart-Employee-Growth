const db = require('../db/connection');
const auditService = require('./auditService');

async function listNotifications(userId = null, userBranchScope = 'All', limit = 30) {
  let sql = `
    SELECT n.*
    FROM notifications n
    WHERE 1=1
  `;
  const params = [];

  if (userId) {
    sql += ' AND (n.recipient_id = ? OR n.recipient_id IS NULL)';
    params.push(userId);
  }

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (n.target_branch = ? OR n.target_branch = "All Branches")';
    params.push(userBranchScope);
  }

  sql += ' ORDER BY n.created_at DESC LIMIT ?';
  params.push(limit);

  const result = await db.query(sql, params);

  // Unread count
  let unreadSql = `
    SELECT COUNT(*) as unread_count
    FROM notifications n
    WHERE n.is_read = 0
  `;
  const unreadParams = [];
  if (userId) {
    unreadSql += ' AND (n.recipient_id = ? OR n.recipient_id IS NULL)';
    unreadParams.push(userId);
  }
  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    unreadSql += ' AND (n.target_branch = ? OR n.target_branch = "All Branches")';
    unreadParams.push(userBranchScope);
  }

  const unreadRow = await db.get(unreadSql, unreadParams);

  return {
    notifications: result.rows,
    unreadCount: unreadRow ? unreadRow.unread_count : 0
  };
}

async function markAsRead(id) {
  await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  return { success: true, id };
}

async function markAllAsRead(userId = null) {
  if (userId) {
    await db.run('UPDATE notifications SET is_read = 1 WHERE recipient_id = ? OR recipient_id IS NULL', [userId]);
  } else {
    await db.run('UPDATE notifications SET is_read = 1');
  }
  return { success: true };
}

async function createNotification({
  title,
  message,
  category = 'General',
  targetBranch = 'All Branches',
  recipientId = null,
  linkUrl = null
}) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  await db.run(`
    INSERT INTO notifications (id, title, message, category, target_branch, recipient_id, is_read, link_url)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `, [id, title, message, category, targetBranch, recipientId, linkUrl]);
  return { id, title, message };
}

// Announcements
async function listAnnouncements(userBranchScope = 'All') {
  let sql = 'SELECT * FROM announcements WHERE 1=1';
  const params = [];

  if (userBranchScope && userBranchScope !== 'All' && userBranchScope !== 'All Branches') {
    sql += ' AND (target_audience = ? OR target_audience = "All Branches")';
    params.push(userBranchScope);
  }

  sql += ' ORDER BY created_at DESC';
  const result = await db.query(sql, params);
  return result.rows;
}

async function createAnnouncement(data, actingUser) {
  const { title, content, targetAudience = 'All Branches', category = 'Company Update', expiryDate = null } = data;
  if (!title || !content) throw { statusCode: 400, userMessage: 'Title and content are required.' };

  const id = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  await db.run(`
    INSERT INTO announcements (id, title, content, target_audience, category, is_published, expiry_date, created_by)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `, [id, title.trim(), content.trim(), targetAudience, category, expiryDate, actingUser.full_name]);

  // Broadcast in-app notification
  await createNotification({
    title: `Announcement: ${title}`,
    message: content.length > 100 ? `${content.substring(0, 97)}...` : content,
    category: 'Announcements',
    targetBranch: targetAudience
  });

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: 'ANNOUNCEMENT_PUBLISHED',
    targetType: 'ANNOUNCEMENT',
    targetId: id,
    branchContext: targetAudience,
    details: { title, targetAudience }
  });

  return db.get('SELECT * FROM announcements WHERE id = ?', [id]);
}

async function toggleAnnouncementPublish(id, actingUser) {
  const ann = await db.get('SELECT * FROM announcements WHERE id = ?', [id]);
  if (!ann) throw { statusCode: 404, userMessage: 'Announcement not found.' };

  const newPublished = ann.is_published ? 0 : 1;
  await db.run('UPDATE announcements SET is_published = ? WHERE id = ?', [newPublished, id]);

  await auditService.logEvent({
    userId: actingUser.id,
    userName: actingUser.full_name,
    action: newPublished ? 'ANNOUNCEMENT_PUBLISHED' : 'ANNOUNCEMENT_UNPUBLISHED',
    targetType: 'ANNOUNCEMENT',
    targetId: id,
    details: { title: ann.title }
  });

  return { id, isPublished: !!newPublished };
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  listAnnouncements,
  createAnnouncement,
  toggleAnnouncementPublish
};
