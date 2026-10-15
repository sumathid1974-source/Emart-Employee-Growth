/**
 * Global Search with Keyboard Navigation & Instant Results
 * Namespace: window.EmployeeHub.search
 */
window.EmployeeHub = window.EmployeeHub || {};

window.EmployeeHub.search = (function () {
  'use strict';

  let searchIndex = [];
  let isResultsOpen = false;

  function initSearch() {
    searchIndex = window.EmployeeHub.mockData.getSearchIndex();

    const input = document.getElementById('globalSearchInput');
    const resultsDropdown = document.getElementById('searchResultsDropdown');

    if (!input || !resultsDropdown) return;

    // Listen to input changes
    input.addEventListener('input', window.EmployeeHub.utils.debounce(function () {
      const query = input.value.trim().toLowerCase();
      if (query.length === 0) {
        closeResults();
        return;
      }
      performSearch(query);
    }, 150));

    // Focus / blur handlers
    input.addEventListener('focus', function () {
      if (input.value.trim().length > 0) {
        performSearch(input.value.trim().toLowerCase());
      }
    });

    // Global keyboard shortcut: Ctrl+K or Cmd+K or / (when not typing in another input)
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === 'Escape' && isResultsOpen) {
        closeResults();
      }
    });

    // Close on click outside
    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !resultsDropdown.contains(e.target)) {
        closeResults();
      }
    });
  }

  function performSearch(query) {
    const resultsDropdown = document.getElementById('searchResultsDropdown');
    searchIndex = window.EmployeeHub.mockData.getSearchIndex();

    const matches = searchIndex.filter(item => {
      return item.title.toLowerCase().includes(query) ||
             item.subtitle.toLowerCase().includes(query) ||
             item.type.toLowerCase().includes(query);
    });

    if (matches.length === 0) {
      resultsDropdown.innerHTML = `
        <div style="padding: 16px 20px; text-align: center; color: var(--color-text-muted); font-size: 0.8125rem;">
          No matches found for "<strong style="color: var(--color-text-primary);">${window.EmployeeHub.utils.escapeHTML(query)}</strong>"
        </div>
      `;
    } else {
      resultsDropdown.innerHTML = `
        <div class="dropdown-header" style="padding: 6px 14px; font-size: 0.6875rem;">
          Search Results (${matches.length})
        </div>
        ${matches.map((item, idx) => `
          <div class="dropdown-item search-result-row" data-index="${idx}" style="padding: 10px 14px; border-radius: 6px; cursor: pointer;">
            <div style="display: flex; flex-direction: column; gap: 2px; width: 100%;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span style="font-weight: 600; color: var(--color-text-primary); font-size: 0.8125rem;">
                  ${window.EmployeeHub.utils.escapeHTML(item.title)}
                </span>
                <span class="badge ${getBadgeClass(item.type)}" style="font-size: 0.625rem; padding: 1px 6px;">
                  ${window.EmployeeHub.utils.escapeHTML(item.type)}
                </span>
              </div>
              <span style="font-size: 0.75rem; color: var(--color-text-muted);">
                ${window.EmployeeHub.utils.escapeHTML(item.subtitle)}
              </span>
            </div>
          </div>
        `).join('')}
      `;

      // Attach click listeners to result rows
      resultsDropdown.querySelectorAll('.search-result-row').forEach(row => {
        row.addEventListener('click', function () {
          const idx = parseInt(row.getAttribute('data-index'), 10);
          const selected = matches[idx];
          if (selected && typeof selected.action === 'function') {
            closeResults();
            const input = document.getElementById('globalSearchInput');
            if (input) input.value = '';
            selected.action();
          }
        });
      });
    }

    resultsDropdown.classList.add('show');
    isResultsOpen = true;
  }

  function getBadgeClass(type) {
    switch (type) {
      case 'Branch': return 'badge-info';
      case 'Employee': return 'badge-brand';
      case 'Quick Action': return 'badge-success';
      default: return 'badge-neutral';
    }
  }

  function closeResults() {
    const resultsDropdown = document.getElementById('searchResultsDropdown');
    if (resultsDropdown) {
      resultsDropdown.classList.remove('show');
    }
    isResultsOpen = false;
  }

  return {
    initSearch,
    closeResults
  };
})();
