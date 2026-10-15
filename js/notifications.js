/**
 * Notification Dropdown & Feed Controller
 * Namespace: window.EmployeeHub.notifications
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.notifications = (function () {
  'use strict';

  let isDropdownOpen = false;

  /**
   * Initialize notification triggers and listeners
   */
  function initNotifications() {
    const bellBtn = document.getElementById('btnNotificationBell');
    const dropdown = document.getElementById('notificationsDropdown');

    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleDropdown();
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function (e) {
        if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
          closeDropdown();
        }
      });
    }

    renderNotificationDropdown();
    updateUnreadBadges();
  }

  function toggleDropdown() {
    if (isDropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function openDropdown() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (!dropdown) return;

    dropdown.classList.add('show');
    isDropdownOpen = true;
    renderNotificationDropdown();
  }

  function closeDropdown() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (!dropdown) return;

    dropdown.classList.remove('show');
    isDropdownOpen = false;
  }

  /**
   * Render notifications list inside the topbar dropdown
   */
  function renderNotificationDropdown() {
    const container = document.getElementById('dropdownNotificationList');
    if (!container) return;

    const notifs = window.EmployeeHub.mockData.getNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;

    const countHeader = document.getElementById('dropdownUnreadCountText');
    if (countHeader) {
      countHeader.textContent = unreadCount > 0 ? `${unreadCount} unread` : 'All caught up';
    }

    if (notifs.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-text-muted); font-size: 0.8125rem;">
          No notifications to show.
        </div>
      `;
      return;
    }

    container.innerHTML = notifs.map(n => `
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
            <span class="badge ${n.targetScope === 'all' ? 'badge-brand' : 'badge-neutral'}" style="font-size: 0.625rem; padding: 1px 6px;">
              ${window.EmployeeHub.utils.escapeHTML(n.targetBranch)}
            </span>
            <span>${window.EmployeeHub.utils.escapeHTML(n.createdAt)}</span>
          </div>
        </div>
        ${!n.read ? `
          <button class="btn btn-ghost btn-sm" onclick="window.EmployeeHub.notifications.markAsRead('${n.id}', event)" title="Mark as read" style="padding: 4px; border-radius: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        ` : ''}
      </div>
    `).join('');
  }

  /**
   * Mark single notification as read
   */
  function markAsRead(id, event) {
    if (event) event.stopPropagation();
    window.EmployeeHub.mockData.markNotificationAsRead(id);
    renderNotificationDropdown();
    updateUnreadBadges();
    // Also re-render dashboard panel if visible
    if (window.EmployeeHub.dashboard && window.EmployeeHub.dashboard.renderRecentNotifications) {
      window.EmployeeHub.dashboard.renderRecentNotifications();
    }
    window.EmployeeHub.toast.show('Notification updated', 'Marked as read.', 'info', 2500);
  }

  /**
   * Mark all notifications as read
   */
  function markAllAsRead() {
    window.EmployeeHub.mockData.markAllNotificationsAsRead();
    renderNotificationDropdown();
    updateUnreadBadges();
    if (window.EmployeeHub.dashboard && window.EmployeeHub.dashboard.renderRecentNotifications) {
      window.EmployeeHub.dashboard.renderRecentNotifications();
    }
    window.EmployeeHub.toast.show('All notifications cleared', 'All announcements marked as read.', 'success', 3000);
  }

  /**
   * Update topbar badge count
   */
  function updateUnreadBadges() {
    const notifs = window.EmployeeHub.mockData.getNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('notifUnreadBadge');

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  return {
    initNotifications,
    markAsRead,
    markAllAsRead,
    updateUnreadBadges,
    openDropdown,
    closeDropdown
  };
})();
