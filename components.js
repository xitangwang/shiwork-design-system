/* ==========================================================================
   ShiWork Components behaviour v1.0
   零依赖。只通过 ARIA 属性和 data-sw-* 属性驱动，React / Vue 实现时按同样的属性语义还原。
   ========================================================================== */
(function () {
  const SW = {};

  /* 图标：页面需内联 icons.svg 里的 <symbol>，然后用 SW.icon('check') 或 <svg class="sw-ic"><use href="#i-check"/></svg> */
  SW.icon = (name, cls = '') => `<svg class="sw-ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  /* 通知：SW.toast({ type: 'success' | 'warning' | 'danger' | 'ai', title, desc, action: { label, onClick }, duration }) */
  const ICON_BY_TYPE = { success: 'check', warning: 'alert', danger: 'x', ai: 'sparkle' };
  SW.toast = function ({ type = 'success', title = '', desc = '', action, duration } = {}) {
    let stack = document.querySelector('.sw-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'sw-toast-stack sw-root';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'sw-toast';
    el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    el.innerHTML =
      `<span class="sw-toast__icon sw-toast__icon--${type}">${SW.icon(ICON_BY_TYPE[type] || 'info')}</span>` +
      `<div><b></b><span></span>${action ? '<div class="sw-toast__actions"><a class="sw-link" href="#"></a></div>' : ''}</div>` +
      `<button class="sw-btn sw-btn--ghost sw-btn--icon sw-btn--sm" aria-label="关闭通知">${SW.icon('x', 'sw-ic--sm')}</button>`;
    el.querySelector('b').textContent = title;
    el.querySelector('span:not(.sw-toast__icon)').textContent = desc;
    if (action) {
      const a = el.querySelector('.sw-toast__actions a');
      a.textContent = action.label;
      a.addEventListener('click', (e) => { e.preventDefault(); action.onClick && action.onClick(); close(); });
    }
    const close = () => { el.style.opacity = '0'; el.style.transition = 'opacity .2s'; setTimeout(() => el.remove(), 200); };
    el.querySelector('button').addEventListener('click', close);
    stack.appendChild(el);
    /* 失败通知不自动消失；其余默认 4 秒 */
    const ms = duration ?? (type === 'danger' ? 0 : 4000);
    if (ms > 0) setTimeout(close, ms);
    return close;
  };

  /* 关闭所有展开的下拉 */
  function closeDropdowns(except) {
    document.querySelectorAll('.sw-dropdown.is-open').forEach((d) => {
      if (d !== except) { d.classList.remove('is-open'); const t = d.querySelector('[data-sw-dropdown]'); t && t.setAttribute('aria-expanded', 'false'); }
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target;

    /* 标签页：role="tablist" 内的 role="tab" */
    const tab = t.closest('[role="tab"]');
    if (tab && tab.closest('[role="tablist"]')) {
      tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === tab)));
    }

    /* 分段控件：单选 */
    const seg = t.closest('.sw-segmented button');
    if (seg) seg.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === seg)));

    /* 反馈：有帮助 / 没帮助，互斥可取消 */
    const fb = t.closest('.sw-feedback button');
    if (fb) {
      const on = fb.getAttribute('aria-pressed') !== 'true';
      fb.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      fb.setAttribute('aria-pressed', String(on));
    }

    /* 开关 */
    const sw = t.closest('.sw-switch');
    if (sw && !sw.disabled) sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'));

    /* 检索过程展开 */
    const tr = t.closest('.sw-trace__toggle');
    if (tr) tr.setAttribute('aria-expanded', String(tr.getAttribute('aria-expanded') !== 'true'));

    /* 下拉 */
    const dd = t.closest('[data-sw-dropdown]');
    if (dd) {
      const wrap = dd.closest('.sw-dropdown');
      const open = !wrap.classList.contains('is-open');
      closeDropdowns(wrap);
      wrap.classList.toggle('is-open', open);
      dd.setAttribute('aria-expanded', String(open));
    } else if (!t.closest('.sw-menu')) {
      closeDropdowns();
    } else if (t.closest('.sw-menu__item')) {
      const item = t.closest('.sw-menu__item');
      if (item.hasAttribute('aria-checked')) {
        item.closest('.sw-menu').querySelectorAll('[aria-checked]').forEach((x) => x.setAttribute('aria-checked', String(x === item)));
      }
      closeDropdowns();
    }

    /* 打开 / 关闭对话框、抽屉：data-sw-open="dialogId"，data-sw-close */
    const opener = t.closest('[data-sw-open]');
    if (opener) { const d = document.getElementById(opener.dataset.swOpen); d && d.showModal(); }
    const closer = t.closest('[data-sw-close]');
    if (closer) { const d = closer.closest('dialog'); d && d.close(); }

    /* 显示 / 隐藏：data-sw-toggle="elementId"（浮动助手等） */
    const tg = t.closest('[data-sw-toggle]');
    if (tg) { const el = document.getElementById(tg.dataset.swToggle); if (el) { el.hidden = !el.hidden; tg.setAttribute('aria-expanded', String(!el.hidden)); } }
  });

  /* 点击遮罩关闭对话框 */
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'DIALOG' && (e.target.classList.contains('sw-dialog') || e.target.classList.contains('sw-drawer'))) {
      const r = e.target.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      const panel = e.target.firstElementChild;
      const pr = panel && panel.getBoundingClientRect();
      const inPanel = pr && e.clientX >= pr.left && e.clientX <= pr.right && e.clientY >= pr.top && e.clientY <= pr.bottom;
      if (!inPanel || !inside) e.target.close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdowns();
    /* 标签页方向键切换 */
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
      const next = tabs[(tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus(); next.click();
    }
  });

  window.SW = SW;
})();
