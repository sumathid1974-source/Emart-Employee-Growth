/**
 * Utility Functions & Helpers
 * Namespace: window.EmployeeHub.utils
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.utils = (function () {
  'use strict';

  /**
   * Format numbers to Indian Rupee currency format (e.g. ₹48,75,000)
   * @param {number} amount
   * @param {boolean} includeSymbol
   * @returns {string}
   */
  function formatINR(amount, includeSymbol = true) {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return includeSymbol ? '₹0' : '0';
    }
    const num = Math.round(Number(amount));
    const isNegative = num < 0;
    const absStr = Math.abs(num).toString();

    let lastThree = absStr.substring(absStr.length - 3);
    const otherNumbers = absStr.substring(0, absStr.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    const sign = isNegative ? '-' : '';
    return includeSymbol ? `${sign}₹${formatted}` : `${sign}${formatted}`;
  }

  /**
   * Format integer with thousands separators
   * @param {number} num
   * @returns {string}
   */
  function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-IN');
  }

  /**
   * Sanitize string to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Simple Debounce implementation
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  function debounce(func, wait = 250) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Safe LocalStorage wrapper
   */
  const storage = {
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem('employeehub_' + key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn('LocalStorage error:', e);
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('employeehub_' + key, JSON.stringify(value));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    },
    remove(key) {
      try {
        localStorage.removeItem('employeehub_' + key);
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }
  };

  /**
   * Format date into clean readable string (e.g., "13 Oct 2026")
   * @param {Date|string} date
   * @returns {string}
   */
  function formatDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Get greeting based on time of day
   * @returns {string}
   */
  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return {
    formatINR,
    formatNumber,
    escapeHTML,
    escapeHtml: escapeHTML,
    debounce,
    storage,
    formatDate,
    getTimeGreeting
  };
})();
