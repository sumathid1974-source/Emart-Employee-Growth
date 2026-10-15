/**
 * Phase 4: Notification Center & Company Announcements Controller
 * Namespace: window.EmployeeHub.communication
 * Handles Multibranch Notifications, Preferences, and Announcements Publishing
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.communication = (function () {
  'use strict';

  const notifFilter = {
    category: 'ALL',
    readState: 'all',
    search: ''
  };

  const annFilter = {
    category: 'ALL',
    status: 'ALL',
    branch: 'ALL'
  };

  /**
   * Initialize Communication module controls
   */
  function initCommunicationModule() {
    initNotificationFilters();
    initAnnouncementFilters();
    loadPreferencesUI();
    updateTopbarNotificationBadge();

    // Listen for custom notification added events
    window.addEventListener('employeehub:notification-added', () => {
      updateTopbarNotificationBadge();
      renderNotificationCenter();
    });
  }

  // =========================================================================
  // 1. NOTIFICATION CENTER
  // =========================================================================

  function initNotificationFilters() {
    const search = document.getElementById('notifCenterSearch');
    const catPills = document.querySelectorAll('.notif-filter-pill[data-category]');
    const readPills = document.querySelectorAll('.notif-filter-pill[data-read]');

    if (search) {
      search.addEventListener('input', (e) => {
        notifFilter.search = e.target.value.toLowerCase().trim();
        renderNotificationCenter();
      });
    }

    catPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        catPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        notifFilter.category = pill.getAttribute('data-category');
        renderNotificationCenter();
      });
    });

    readPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        readPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        notifFilter.readState = pill.getAttribute('data-read');
        renderNotificationCenter();
      });
    });
  }

  function renderNotificationCenter() {
    const container = document.getElementById('notificationCenterFeed');
    const emptyNotice = document.getElementById('notifCenterEmptyState');
    if (!container) return;

    const store = window.EmployeeHub.attendanceStore;
    if (!store) return;

    const notifs = store.getNotifications(notifFilter);
    updateTopbarNotificationBadge();

    if (notifs.length === 0) {
      container.innerHTML = '';
      if (emptyNotice) emptyNotice.style.display = 'block';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';

    container.innerHTML = notifs.map(n => {
      const iconClass = `notif-icon-${n.category || 'announcement'}`;
      const iconSvg = getNotificationIcon(n.category);

      return `
        <div class="notif-feed-item ${n.read ? '' : 'unread'}" id="notifItem_${n.id}">
          <div class="notif-feed-icon-box ${iconClass}">
            ${iconSvg}
          </div>
          <div class="notif-feed-body">
            <div class="notif-feed-title">${window.EmployeeHub.utils.escapeHTML(n.title)}</div>
            <div class="notif-feed-msg">${window.EmployeeHub.utils.escapeHTML(n.message)}</div>
            <div class="notif-feed-meta">
              <span class="badge badge-neutral" style="text-transform: capitalize; font-size: 0.6875rem;">
                ${n.category}
              </span>
              <span>${n.timestamp}</span>
              ${n.relatedBranchId ? `<span>Branch: <strong>${n.relatedBranchId}</strong></span>` : ''}
              ${n.relatedEmployeeId ? `<span>Employee: <strong>${n.relatedEmployeeId}</strong></span>` : ''}
            </div>
          </div>
          <div class="notif-feed-actions">
            ${!n.read ? `
              <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.communication.markRead('${n.id}')" title="Mark as Read">
                Mark Read
              </button>
            ` : ''}
            <button class="btn btn-ghost btn-sm text-danger" onclick="window.EmployeeHub.communication.deleteNotif('${n.id}')" title="Delete Notification">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function markRead(id) {
    const store = window.EmployeeHub.attendanceStore;
    store.markNotificationRead(id);
    renderNotificationCenter();
  }

  function markAllRead() {
    const store = window.EmployeeHub.attendanceStore;
    store.markAllNotificationsRead();
    window.EmployeeHub.app.showToast('All notifications marked as read.', 'info');
    renderNotificationCenter();
  }

  function deleteNotif(id) {
    const store = window.EmployeeHub.attendanceStore;
    store.deleteNotification(id);
    renderNotificationCenter();
  }

  function updateTopbarNotificationBadge() {
    const store = window.EmployeeHub.attendanceStore;
    if (!store) return;

    const notifs = store.getNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;

    const badge = document.getElementById('topbarNotificationBadge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    const countHeader = document.getElementById('dropdownUnreadCountText');
    if (countHeader) {
      countHeader.textContent = unreadCount > 0 ? `${unreadCount} unread` : 'All caught up';
    }

    // Also populate topbar bell dropdown if present
    const dropdownList = document.getElementById('dropdownNotificationList');
    if (dropdownList) {
      if (notifs.length === 0) {
        dropdownList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--color-text-muted); font-size: 0.8125rem;">No notifications to show.</div>`;
      } else {
        dropdownList.innerHTML = notifs.slice(0, 5).map(n => `
          <div class="notification-panel-item ${n.read ? '' : 'unread'}" style="padding: 12px 16px;">
            ${!n.read ? '<span class="notification-unread-dot" style="top: 18px; left: 6px;"></span>' : ''}
            <div class="notification-content" style="padding-left: 6px;">
              <div style="font-size: 0.8125rem; font-weight: 600; color: var(--color-text-primary); line-height: 1.3;">
                ${window.EmployeeHub.utils.escapeHTML(n.title)}
              </div>
              <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 2px;">
                ${window.EmployeeHub.utils.escapeHTML(n.message)}
              </div>
              <div class="notification-item-meta" style="margin-top: 4px;">
                <span class="badge badge-neutral" style="font-size: 0.625rem; padding: 1px 6px;">
                  ${n.category}
                </span>
                <span>${n.timestamp}</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  function loadPreferencesUI() {
    const store = window.EmployeeHub.attendanceStore;
    if (!store) return;
    const prefs = store.getNotificationPreferences();

    const attChk = document.getElementById('prefNotifyAttendance'); if (attChk) attChk.checked = !!prefs.attendance;
    const lvChk = document.getElementById('prefNotifyLeave'); if (lvChk) lvChk.checked = !!prefs.leave;
    const payChk = document.getElementById('prefNotifyPayroll'); if (payChk) payChk.checked = !!prefs.payroll;
    const annChk = document.getElementById('prefNotifyAnnouncements'); if (annChk) annChk.checked = !!prefs.announcement;
  }

  function savePreferencesUI() {
    const store = window.EmployeeHub.attendanceStore;
    const attChk = document.getElementById('prefNotifyAttendance');
    const lvChk = document.getElementById('prefNotifyLeave');
    const payChk = document.getElementById('prefNotifyPayroll');
    const annChk = document.getElementById('prefNotifyAnnouncements');

    store.saveNotificationPreferences({
      attendance: attChk ? attChk.checked : true,
      leave: lvChk ? lvChk.checked : true,
      payroll: payChk ? payChk.checked : true,
      announcement: annChk ? annChk.checked : true
    });

    window.EmployeeHub.app.showToast('Notification category preferences saved.', 'success');
    renderNotificationCenter();
  }

  // =========================================================================
  // 2. COMPANY ANNOUNCEMENTS
  // =========================================================================

  function initAnnouncementFilters() {
    const cat = document.getElementById('annCategoryFilter');
    const status = document.getElementById('annStatusFilter');
    const branch = document.getElementById('annBranchFilter');

    if (cat) {
      cat.addEventListener('change', (e) => {
        annFilter.category = e.target.value;
        renderAnnouncements();
      });
    }

    if (status) {
      status.addEventListener('change', (e) => {
        annFilter.status = e.target.value;
        renderAnnouncements();
      });
    }

    if (branch) {
      populateBranchDropdown(branch, true);
      branch.addEventListener('change', (e) => {
        annFilter.branch = e.target.value;
        renderAnnouncements();
      });
    }
  }

  function renderAnnouncements() {
    const grid = document.getElementById('announcementsCardsGrid');
    const emptyNotice = document.getElementById('announcementsEmptyState');
    if (!grid) return;

    const store = window.EmployeeHub.attendanceStore;
    if (!store) return;

    const list = store.getAnnouncements(annFilter);

    if (list.length === 0) {
      grid.innerHTML = '';
      if (emptyNotice) emptyNotice.style.display = 'block';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';

    grid.innerHTML = list.map(a => `
      <div class="announcement-card" id="annCard_${a.id}">
        <div>
          <div class="announcement-card-header">
            <span class="badge ${getCategoryBadgeClass(a.category)}">${a.category}</span>
            <span class="badge ${a.status === 'Published' ? 'badge-success' : 'badge-neutral'}">${a.status}</span>
          </div>
          <h4 class="announcement-card-title" style="margin-top: 10px;">${window.EmployeeHub.utils.escapeHTML(a.title)}</h4>
          <p class="announcement-card-content" style="margin-top: 8px;">${window.EmployeeHub.utils.escapeHTML(a.content)}</p>
        </div>

        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 10px;">
            <span>Audience: <strong>${a.targetAudience === 'all' ? 'All Branches (Company-wide)' : a.targetBranchId}</strong></span>
            <span>Valid till: ${a.expiryDate}</span>
          </div>

          <div class="announcement-card-footer">
            <span>By ${window.EmployeeHub.utils.escapeHTML(a.createdBy || 'Administrator')}</span>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.communication.previewAnnouncement('${a.id}')">
                Preview
              </button>
              <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.communication.openEditAnnouncementModal('${a.id}')">
                Edit
              </button>
              <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.communication.togglePublishAnnouncement('${a.id}')">
                ${a.status === 'Published' ? 'Unpublish' : 'Publish'}
              </button>
              <button class="btn btn-ghost btn-sm text-danger" onclick="window.EmployeeHub.communication.deleteAnnouncementItem('${a.id}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Also update dashboard overview announcements section if present!
    renderDashboardAnnouncementsWidget();
  }

  function renderDashboardAnnouncementsWidget() {
    const container = document.getElementById('dashboardAnnouncementsFeed');
    if (!container) return;

    const store = window.EmployeeHub.attendanceStore;
    if (!store) return;

    const published = store.getAnnouncements({ status: 'Published' });
    if (published.length === 0) {
      container.innerHTML = `<div style="padding: 16px; color: var(--color-text-muted); font-size: 0.8125rem;">No active broadcasts.</div>`;
      return;
    }

    container.innerHTML = published.slice(0, 3).map(a => `
      <div style="padding: 12px 14px; background: var(--color-bg-subtle); border-radius: var(--radius-md); border-left: 3px solid var(--color-brand); margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <strong style="font-size: 0.84375rem; color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(a.title)}</strong>
          <span class="badge ${getCategoryBadgeClass(a.category)}" style="font-size: 0.625rem;">${a.category}</span>
        </div>
        <p style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 4px; line-height: 1.4;">
          ${window.EmployeeHub.utils.escapeHTML(a.content.length > 130 ? a.content.slice(0, 127) + '...' : a.content)}
        </p>
        <div style="font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 4px;">
          Audience: ${a.targetAudience === 'all' ? 'All Branches' : a.targetBranchId} • ${a.publishDate}
        </div>
      </div>
    `).join('');
  }

  function openNewAnnouncementModal() {
    const modal = document.getElementById('modalAnnouncementForm');
    if (!modal) return;

    document.getElementById('annFormId').value = '';
    document.getElementById('annFormTitle').value = '';
    document.getElementById('annFormCategory').value = 'Company News';
    document.getElementById('annFormAudience').value = 'all';

    const branchSelect = document.getElementById('annFormBranch');
    populateBranchDropdown(branchSelect, false);
    toggleAudienceBranchSelect();

    document.getElementById('annFormContent').value = '';
    document.getElementById('annFormPublishDate').value = '2026-10-13';
    document.getElementById('annFormExpiryDate').value = '2026-11-30';
    document.getElementById('annFormStatus').value = 'Published';

    modal.classList.add('show');
  }

  function openEditAnnouncementModal(id) {
    const store = window.EmployeeHub.attendanceStore;
    const a = store.getAnnouncements().find(item => item.id === id);
    if (!a) return;

    const modal = document.getElementById('modalAnnouncementForm');
    if (!modal) return;

    document.getElementById('annFormId').value = a.id;
    document.getElementById('annFormTitle').value = a.title;
    document.getElementById('annFormCategory').value = a.category;
    document.getElementById('annFormAudience').value = a.targetAudience;

    const branchSelect = document.getElementById('annFormBranch');
    populateBranchDropdown(branchSelect, false);
    if (a.targetBranchId) branchSelect.value = a.targetBranchId;
    toggleAudienceBranchSelect();

    document.getElementById('annFormContent').value = a.content;
    document.getElementById('annFormPublishDate').value = a.publishDate;
    document.getElementById('annFormExpiryDate').value = a.expiryDate;
    document.getElementById('annFormStatus').value = a.status;

    modal.classList.add('show');
  }

  function toggleAudienceBranchSelect() {
    const audSelect = document.getElementById('annFormAudience');
    const branchGroup = document.getElementById('annFormBranchGroup');
    if (!audSelect || !branchGroup) return;

    branchGroup.style.display = audSelect.value === 'branch' ? 'block' : 'none';
  }

  function handleAnnouncementSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('annFormId').value;
    const title = document.getElementById('annFormTitle').value.trim();
    const category = document.getElementById('annFormCategory').value;
    const targetAudience = document.getElementById('annFormAudience').value;
    const branchSelect = document.getElementById('annFormBranch');
    const targetBranchId = targetAudience === 'branch' ? branchSelect.value : 'ALL';
    const content = document.getElementById('annFormContent').value.trim();
    const publishDate = document.getElementById('annFormPublishDate').value;
    const expiryDate = document.getElementById('annFormExpiryDate').value;
    const status = document.getElementById('annFormStatus').value;

    const store = window.EmployeeHub.attendanceStore;
    store.saveAnnouncement({
      id: id || undefined,
      title,
      category,
      targetAudience,
      targetBranchId,
      content,
      publishDate,
      expiryDate,
      status,
      createdBy: 'Vikram Malhotra (Executive Director)'
    });

    window.EmployeeHub.modals.closeModal('modalAnnouncementForm');
    window.EmployeeHub.app.showToast(`Announcement "${title}" saved.`, 'success');

    renderAnnouncements();
  }

  function previewAnnouncement(id) {
    const store = window.EmployeeHub.attendanceStore;
    const a = store.getAnnouncements().find(item => item.id === id);
    if (!a) return;

    const modal = document.getElementById('modalAnnouncementPreview');
    if (!modal) return;

    document.getElementById('previewAnnTitle').textContent = a.title;
    document.getElementById('previewAnnCategory').textContent = a.category;
    document.getElementById('previewAnnCategory').className = `badge ${getCategoryBadgeClass(a.category)}`;
    document.getElementById('previewAnnStatus').textContent = a.status;
    document.getElementById('previewAnnStatus').className = `badge ${a.status === 'Published' ? 'badge-success' : 'badge-neutral'}`;
    document.getElementById('previewAnnAudience').textContent = a.targetAudience === 'all' ? 'All 12 Branches (Company-wide)' : `Target Branch: ${a.targetBranchId}`;
    document.getElementById('previewAnnDates').textContent = `Published on ${a.publishDate} • Valid until ${a.expiryDate}`;
    document.getElementById('previewAnnContent').textContent = a.content;
    document.getElementById('previewAnnAuthor').textContent = `Created by ${a.createdBy || 'Administrator'}`;

    modal.classList.add('show');
  }

  function togglePublishAnnouncement(id) {
    const store = window.EmployeeHub.attendanceStore;
    const a = store.getAnnouncements().find(item => item.id === id);
    if (!a) return;

    a.status = a.status === 'Published' ? 'Draft' : 'Published';
    store.saveAnnouncement(a);

    window.EmployeeHub.app.showToast(`Announcement marked as ${a.status}.`, 'info');
    renderAnnouncements();
  }

  function deleteAnnouncementItem(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    const store = window.EmployeeHub.attendanceStore;
    store.deleteAnnouncement(id);
    window.EmployeeHub.app.showToast('Announcement deleted.', 'info');
    renderAnnouncements();
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

  function getNotificationIcon(category) {
    switch (category) {
      case 'attendance':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      case 'leave':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>';
      case 'payroll':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
    }
  }

  function getCategoryBadgeClass(category) {
    switch (category) {
      case 'Urgent Notice': return 'badge-danger';
      case 'Policy Update': return 'badge-warning';
      case 'Holiday Alert': return 'badge-leave';
      default: return 'badge-brand';
    }
  }

  function populateBranchDropdown(selectElem, includeAll = false) {
    if (!selectElem) return;
    const branches = window.EmployeeHub.dataStore ? window.EmployeeHub.dataStore.getBranches() : [];
    selectElem.innerHTML = '';
    if (includeAll) selectElem.innerHTML += '<option value="ALL">All Branches</option>';
    branches.forEach(b => {
      selectElem.innerHTML += `<option value="${b.name}">${b.name}</option>`;
    });
  }

  return {
    initCommunicationModule,
    renderNotificationCenter,
    markRead,
    markAllRead,
    deleteNotif,
    savePreferencesUI,
    renderAnnouncements,
    openNewAnnouncementModal,
    openEditAnnouncementModal,
    toggleAudienceBranchSelect,
    handleAnnouncementSubmit,
    previewAnnouncement,
    togglePublishAnnouncement,
    deleteAnnouncementItem,
    renderDashboardAnnouncementsWidget
  };
})();
