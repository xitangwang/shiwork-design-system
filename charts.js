/* ==========================================================================
   ShiWork Charts v1.1 —— 零依赖 SVG 图表
   颜色全部写成 var(--chart-*)，切换主题无需重绘。每个图表自带图例、悬停提示、
   键盘焦点和“数据表”视图（无障碍等价物）。

   用法一（声明式）：
     <figure class="sw-chart" data-sw-chart='{"type":"line", ...}'></figure>
     SW.charts.mountAll()            // 页面加载完成后自动执行一次
   用法二（脚本）：
     SW.charts.render(figureEl, { type: 'column', ... })

   type: line | column | bar | diverging | segmented | heatmap | sparkline
   颜色只能写令牌名：'chart-1'…'chart-7'、'chart-other'、'chart-prev'
   ========================================================================== */
(function () {
  const SW = (window.SW = window.SW || {});
  const NS = 'http://www.w3.org/2000/svg';
  const ON_FILL = { 'chart-5': 'var(--chart-on-5)', 'chart-other': 'var(--ink)', 'chart-prev': 'var(--ink)' };   // 浅色块内文字用深色
  const col = (c) => `var(--${c || 'chart-1'})`;

  /* ---------- 数字格式 ---------- */
  const nf = (d) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const FORMATS = {
    int: (v) => nf(0).format(v),
    usd: (v) => (v < 0 ? '-$' : '$') + nf(0).format(Math.abs(v)),
    usd2: (v) => (v < 0 ? '-$' : '$') + nf(2).format(Math.abs(v)),
    pct: (v) => (v > 0 ? '+' : '') + nf(0).format(v) + '%',
    share: (v) => nf(0).format(v) + '%',
  };
  const fmtOf = (spec) => FORMATS[spec.format] || FORMATS.int;
  const axisFmt = (spec) => (v) => {
    const f = spec.format && spec.format.startsWith('usd') ? '$' : '';
    return Math.abs(v) >= 10000 ? f + nf(0).format(v / 1000) + 'K' : f + nf(0).format(v);
  };

  /* ---------- 工具 ---------- */
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  let ctx;
  const textW = (t, px = 11, weight = 400) => {
    ctx = ctx || document.createElement('canvas').getContext('2d');
    ctx.font = `${weight} ${px}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
    return ctx.measureText(String(t)).width;
  };
  const niceMax = (max) => {
    if (max <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= max) return m * p;
    return 10 * p;
  };
  const ticks = (max, n = 4) => Array.from({ length: n + 1 }, (_, i) => (max / n) * i);
  /* 柱形路径：数据端 4px 圆角，基线端直角 */
  const colPath = (x, y, w, hgt, r = 4) => { r = Math.min(r, w / 2, hgt); return `M${x},${y + hgt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt}Z`; };
  const barPathR = (x, y, w, hgt, r = 4) => { r = Math.min(r, hgt / 2, w); return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt - r}Q${x + w},${y + hgt} ${x + w - r},${y + hgt}H${x}Z`; };
  const barPathL = (x, y, w, hgt, r = 4) => { r = Math.min(r, hgt / 2, w); return `M${x + w},${y}H${x + r}Q${x},${y} ${x},${y + r}V${y + hgt - r}Q${x},${y + hgt} ${x + r},${y + hgt}H${x + w}Z`; };
  const roundRect = (x, y, w, hgt, r = 4) => { r = Math.min(r, w / 2, hgt / 2); return `M${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt - r}Q${x + w},${y + hgt} ${x + w - r},${y + hgt}H${x + r}Q${x},${y + hgt} ${x},${y + hgt - r}V${y + r}Q${x},${y} ${x + r},${y}Z`; };

  /* ---------- 外壳：标题、图例、绘图区、提示、数据表 ---------- */
  function shell(fig, spec, legendItems) {
    fig.classList.add('sw-chart');
    fig.innerHTML = '';
    if (spec.title || spec.table !== false) {
      const head = h('figcaption', 'sw-chart__head');
      const t = h('div');
      if (spec.title) t.appendChild(h('h4', 'sw-chart__title', spec.title));
      if (spec.subtitle) t.appendChild(h('p', 'sw-chart__sub', spec.subtitle));
      head.appendChild(t);
      if (spec.table !== false) {
        const b = h('button', 'sw-btn sw-btn--ghost sw-btn--sm sw-chart__toggle', '数据表');
        b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => {
          const on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '图表' : '数据表';
          fig.querySelector('.sw-chart__plot').hidden = on;
          const lg = fig.querySelector('.sw-chart__legend'); if (lg) lg.hidden = on;
          fig.querySelector('.sw-chart__table').hidden = !on;
        });
        head.appendChild(b);
      }
      fig.appendChild(head);
    }
    if (legendItems && legendItems.length > 1) {
      const ul = h('ul', 'sw-chart__legend');
      legendItems.forEach((it) => {
        const li = h('li'); const k = h('span', 'sw-chart__key' + (it.line ? ' sw-chart__key--line' : ''));
        k.style.background = col(it.color); li.append(k, document.createTextNode(it.name)); ul.appendChild(li);
      });
      fig.appendChild(ul);
    }
    const plot = h('div', 'sw-chart__plot');
    const tip = h('div', 'sw-chart__tip'); tip.hidden = true; tip.setAttribute('role', 'status');
    plot.appendChild(tip);
    fig.appendChild(plot);
    const table = h('table', 'sw-chart__table'); table.hidden = true;
    fig.appendChild(table);
    if (spec.note) fig.appendChild(h('p', 'sw-chart__note', spec.note));
    if (spec.title) fig.setAttribute('aria-label', spec.title);
    return { plot, tip, table };
  }

  function fillTable(table, header, rows) {
    const thead = h('thead'); const tr = h('tr');
    header.forEach((c) => tr.appendChild(h('th', null, c))); thead.appendChild(tr);
    const tb = h('tbody');
    rows.forEach((r) => { const t = h('tr'); r.forEach((c) => t.appendChild(h('td', null, c))); tb.appendChild(t); });
    table.append(thead, tb);
  }

  /* 提示框：数值在前、名称在后；用 textContent 写入，避免注入 */
  function showTip(plot, tip, title, rows, x, y) {
    tip.innerHTML = '';
    if (title) tip.appendChild(h('div', 'sw-chart__tip-title', title));
    rows.forEach((r) => {
      const row = h('div', 'sw-chart__tip-row');
      const key = h('span', 'sw-chart__key sw-chart__key--line'); key.style.background = col(r.color);
      row.append(key, h('b', null, r.value), h('span', null, r.name));
      tip.appendChild(row);
    });
    tip.hidden = false;
    const pw = plot.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = x + 14; if (left + tw > pw) left = x - tw - 14; if (left < 0) left = 0;
    let top = y - th / 2; if (top < 0) top = 0;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  const hideTip = (tip) => { tip.hidden = true; };

  /* 柱、块等独立标记的悬停 / 聚焦提示 */
  function bindMark(node, plot, tip, title, rows) {
    node.classList.add('sw-chart__mark');
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', [title, ...rows.map((r) => r.name + ' ' + r.value)].filter(Boolean).join('，'));
    const show = (e) => {
      const pr = plot.getBoundingClientRect();
      let x, y;
      if (e && e.clientX !== undefined) { x = e.clientX - pr.left; y = e.clientY - pr.top; }
      else { const b = node.getBoundingClientRect(); x = b.right - pr.left; y = b.top - pr.top + b.height / 2; }
      showTip(plot, tip, title, rows, x, y);
    };
    node.addEventListener('pointermove', show);
    node.addEventListener('focus', () => show());
    node.addEventListener('pointerleave', () => hideTip(tip));
    node.addEventListener('blur', () => hideTip(tip));
  }

  /* ========== 折线图 ========== */
  function line(fig, spec) {
    const fmt = fmtOf(spec), afmt = axisFmt(spec);
    const series = spec.series;
    const { plot, tip, table } = shell(fig, spec, series.map((s) => ({ name: s.name, color: s.color, line: true })));
    const W = Math.max(280, plot.clientWidth || fig.clientWidth || 600), H = spec.height || 220;
    const max = niceMax(Math.max(...series.flatMap((s) => s.values)));
    const tk = ticks(max);
    const left = Math.max(...tk.map((t) => textW(afmt(t)))) + 10;
    const endLabels = series.filter((s) => s.endLabel !== false);
    const right = endLabels.length ? Math.max(...endLabels.map((s) => textW(fmt(s.values[s.values.length - 1]), 12, 600))) + 14 : 8;
    const top = 8, bottom = 26, iw = W - left - right, ih = H - top - bottom;
    const n = spec.x.length;
    const X = (i) => left + (n === 1 ? iw / 2 : (iw * i) / (n - 1));
    const Y = (v) => top + ih - (v / max) * ih;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': spec.title || '折线图' }, plot);
    tk.forEach((t) => {
      el('line', { x1: left, x2: left + iw, y1: Y(t), y2: Y(t), class: t === 0 ? 'sw-chart__axis' : 'sw-chart__grid' }, svg);
      el('text', { x: left - 8, y: Y(t) + 4, 'text-anchor': 'end' }, svg).textContent = afmt(t);
    });
    const every = Math.ceil(n / Math.max(2, Math.floor(iw / 56)));
    spec.x.forEach((lab, i) => { if (i === n - 1 || (i % every === 0 && n - 1 - i >= every)) el('text', { x: X(i), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, svg).textContent = lab; });
    series.forEach((s, si) => {
      const pts = s.values.map((v, i) => `${X(i)},${Y(v)}`);
      if (s.area || (si === 0 && spec.area)) {
        el('path', { d: `M${X(0)},${Y(0)}L${pts.join('L')}L${X(n - 1)},${Y(0)}Z`, style: `fill:${col(s.color)};opacity:.1` }, svg);
      }
      el('polyline', { points: pts.join(' '), fill: 'none', style: `stroke:${col(s.color)}`, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      const lv = s.values[n - 1];
      el('circle', { cx: X(n - 1), cy: Y(lv), r: 4, style: `fill:${col(s.color)};stroke:var(--surface)`, 'stroke-width': 2 }, svg);
    });
    /* 末端数值标签：相距不足 14px 时只保留优先级高的（靠前的系列） */
    const placed = [];
    endLabels.forEach((s) => {
      const y = Y(s.values[n - 1]);
      if (placed.some((p) => Math.abs(p - y) < 14)) return;
      placed.push(y);
      el('text', { x: X(n - 1) + 8, y: y + 4, class: 'sw-chart__label' + (s === series[0] ? ' sw-chart__label--strong' : '') }, svg).textContent = fmt(s.values[n - 1]);
    });
    /* 十字准线：跟随指针吸附到最近的日期；键盘左右键移动 */
    const cross = el('line', { y1: top, y2: top + ih, class: 'sw-chart__cross', visibility: 'hidden' }, svg);
    const dots = series.map((s) => el('circle', { r: 4, style: `fill:${col(s.color)};stroke:var(--surface)`, 'stroke-width': 2, visibility: 'hidden' }, svg));
    const hit = el('rect', { x: left, y: top, width: iw, height: ih, fill: 'transparent', tabindex: 0, class: 'sw-chart__mark', 'aria-label': (spec.title || '') + '，用左右方向键查看每个日期' }, svg);
    let cur = n - 1;
    const at = (i) => {
      cur = Math.max(0, Math.min(n - 1, i));
      cross.setAttribute('x1', X(cur)); cross.setAttribute('x2', X(cur)); cross.setAttribute('visibility', 'visible');
      dots.forEach((d, si) => { d.setAttribute('cx', X(cur)); d.setAttribute('cy', Y(series[si].values[cur])); d.setAttribute('visibility', 'visible'); });
      const sx = (X(cur) / W) * plot.clientWidth;
      showTip(plot, tip, spec.x[cur], series.map((s) => ({ name: s.name, color: s.color, value: fmt(s.values[cur]) })), sx, (top + ih / 3) * (plot.clientWidth / W));
    };
    const off = () => { cross.setAttribute('visibility', 'hidden'); dots.forEach((d) => d.setAttribute('visibility', 'hidden')); hideTip(tip); };
    hit.addEventListener('pointermove', (e) => { const r = svg.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W; at(Math.round(((x - left) / iw) * (n - 1))); });
    hit.addEventListener('pointerleave', off);
    hit.addEventListener('focus', () => at(cur));
    hit.addEventListener('blur', off);
    hit.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { at(cur - 1); e.preventDefault(); } if (e.key === 'ArrowRight') { at(cur + 1); e.preventDefault(); } });
    fillTable(table, [spec.xLabel || '日期', ...series.map((s) => s.name)], spec.x.map((x, i) => [x, ...series.map((s) => fmt(s.values[i]))]));
  }

  /* ========== 竖向分组柱形图 ========== */
  function column(fig, spec) {
    const fmt = fmtOf(spec), afmt = axisFmt(spec), series = spec.series, cats = spec.categories;
    const { plot, tip, table } = shell(fig, spec, series.map((s) => ({ name: s.name, color: s.color })));
    const W = Math.max(280, plot.clientWidth || 600), H = spec.height || 240;
    const max = niceMax(Math.max(...series.flatMap((s) => s.values)));
    const tk = ticks(max), left = Math.max(...tk.map((t) => textW(afmt(t)))) + 10;
    const top = 22, bottom = 28, iw = W - left - 4, ih = H - top - bottom;
    const band = iw / cats.length, gap = 2;
    const bw = Math.min(24, (band * 0.6 - gap * (series.length - 1)) / series.length);
    const gw = bw * series.length + gap * (series.length - 1);
    const Y = (v) => top + ih - (v / max) * ih;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': spec.title || '柱形图' }, plot);
    tk.forEach((t) => { el('line', { x1: left, x2: left + iw, y1: Y(t), y2: Y(t), class: t === 0 ? 'sw-chart__axis' : 'sw-chart__grid' }, svg); el('text', { x: left - 8, y: Y(t) + 4, 'text-anchor': 'end' }, svg).textContent = afmt(t); });
    cats.forEach((c, ci) => {
      const gx = left + band * ci + (band - gw) / 2;
      el('text', { x: left + band * ci + band / 2, y: H - 8, 'text-anchor': 'middle' }, svg).textContent = c;
      series.forEach((s, si) => {
        const v = s.values[ci], x = gx + si * (bw + gap), y = Y(v);
        const p = el('path', { d: colPath(x, y, bw, Y(0) - y), style: `fill:${col(s.color)}` }, svg);
        bindMark(p, plot, tip, c, series.map((ss) => ({ name: ss.name, color: ss.color, value: fmt(ss.values[ci]) })));
        if (s.label !== false && (spec.labels === 'all' || si === 0)) el('text', { x: x + bw / 2, y: y - 6, 'text-anchor': 'middle', class: 'sw-chart__label' + (si === 0 ? ' sw-chart__label--strong' : '') }, svg).textContent = fmt(v);
      });
    });
    fillTable(table, [spec.xLabel || '项目', ...series.map((s) => s.name)], cats.map((c, i) => [c, ...series.map((s) => fmt(s.values[i]))]));
  }

  /* ========== 横向条形图（单系列，按传入顺序；数值写在条末端） ========== */
  function bar(fig, spec) {
    const fmt = fmtOf(spec), cats = spec.categories, vals = spec.values, color = spec.color || 'chart-1';
    const { plot, tip, table } = shell(fig, spec, spec.legend || null);
    const W = Math.max(280, plot.clientWidth || 600);
    const row = 36, bh = Math.min(24, spec.barHeight || 16), H = cats.length * row + 4;
    const left = Math.min(W * 0.4, Math.max(...cats.map((c) => textW(c, 12))) + 12);
    const right = Math.max(...vals.map((v) => textW(fmt(v), 12, 600))) + 12;
    const iw = W - left - right, max = Math.max(...vals) || 1;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': spec.title || '条形图' }, plot);
    el('line', { x1: left, x2: left, y1: 0, y2: H, class: 'sw-chart__axis' }, svg);
    cats.forEach((c, i) => {
      const y = i * row + (row - bh) / 2, w = Math.max(2, (vals[i] / max) * iw);
      const t = el('text', { x: left - 10, y: y + bh / 2 + 4, 'text-anchor': 'end' }, svg); t.textContent = c; t.style.fill = 'var(--text-2)'; t.style.fontSize = '12px';
      const p = el('path', { d: barPathR(left, y, w, bh), style: `fill:${col(spec.colors ? spec.colors[i] : color)}` }, svg);
      bindMark(p, plot, tip, c, [{ name: spec.valueLabel || '数值', color: spec.colors ? spec.colors[i] : color, value: fmt(vals[i]) }]);
      el('text', { x: left + w + 8, y: y + bh / 2 + 4, class: 'sw-chart__label sw-chart__label--strong' }, svg).textContent = fmt(vals[i]);
    });
    fillTable(table, [spec.xLabel || '项目', spec.valueLabel || '数值'], cats.map((c, i) => [c, fmt(vals[i])]));
  }

  /* ========== 发散条形图（相对基准的偏差：负 = 蓝，正 = 朱橙，0 为中线） ========== */
  function diverging(fig, spec) {
    const fmt = fmtOf(spec), cats = spec.categories, vals = spec.values;
    const { plot, tip, table } = shell(fig, spec, [{ name: spec.negLabel || '低于基准', color: 'div-neg' }, { name: spec.posLabel || '高于基准', color: 'div-pos' }]);
    const W = Math.max(280, plot.clientWidth || 600), row = 36, bh = 16, H = cats.length * row + 24;
    const left = Math.min(W * 0.35, Math.max(...cats.map((c) => textW(c, 12))) + 12);
    const lab = Math.max(...vals.map((v) => textW(fmt(v), 12, 600))) + 10;
    const iw = W - left - lab * 2, max = Math.max(...vals.map(Math.abs)) || 1, mid = left + lab + iw / 2;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': spec.title || '偏差图' }, plot);
    cats.forEach((c, i) => {
      const v = vals[i], y = i * row + (row - bh) / 2, w = Math.max(2, (Math.abs(v) / max) * (iw / 2));
      const t = el('text', { x: left - 10, y: y + bh / 2 + 4, 'text-anchor': 'end' }, svg); t.textContent = c; t.style.fill = 'var(--text-2)'; t.style.fontSize = '12px';
      const color = v >= 0 ? 'div-pos' : 'div-neg';
      const p = el('path', { d: v >= 0 ? barPathR(mid, y, w, bh) : barPathL(mid - w, y, w, bh), style: `fill:${col(color)}` }, svg);
      bindMark(p, plot, tip, c, [{ name: spec.valueLabel || '偏差', color, value: fmt(v) }]);
      el('text', { x: v >= 0 ? mid + w + 8 : mid - w - 8, y: y + bh / 2 + 4, 'text-anchor': v >= 0 ? 'start' : 'end', class: 'sw-chart__label sw-chart__label--strong' }, svg).textContent = fmt(v);
    });
    el('line', { x1: mid, x2: mid, y1: 0, y2: cats.length * row, class: 'sw-chart__axis' }, svg);
    el('text', { x: mid, y: H - 4, 'text-anchor': 'middle' }, svg).textContent = spec.baselineLabel || '基准';
    fillTable(table, [spec.xLabel || '项目', spec.valueLabel || '偏差'], cats.map((c, i) => [c, fmt(vals[i])]));
  }

  /* ========== 分段条（一个整体拆成几部分，≤ 6 段） ========== */
  function segmented(fig, spec) {
    const parts = spec.parts, total = parts.reduce((a, p) => a + p.value, 0), fmt = fmtOf(spec);
    const { plot, tip, table } = shell(fig, spec, parts.map((p) => ({ name: p.name, color: p.color })));
    const W = Math.max(280, plot.clientWidth || 600), H = 28, gap = 2;
    const usable = W - gap * (parts.filter((p) => p.value > 0).length - 1);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': spec.title || '分段条' }, plot);
    let x = 0;
    parts.forEach((p) => {
      if (p.value <= 0) return;
      const w = (p.value / total) * usable, share = Math.round((p.value / total) * 100);
      const node = el('path', { d: roundRect(x, 0, w, H), style: `fill:${col(p.color)}` }, svg);
      bindMark(node, plot, tip, p.name, [{ name: '占比 ' + share + '%', color: p.color, value: fmt(p.value) }]);
      const label = share + '%';
      if (textW(label, 12, 600) + 16 <= w) {
        const t = el('text', { x: x + 8, y: H / 2 + 4 }, svg); t.textContent = label;
        t.style.fill = ON_FILL[p.color] || 'var(--chart-on-fill)'; t.style.fontSize = '12px'; t.style.fontWeight = '600'; t.style.pointerEvents = 'none';
      }
      x += w + gap;
    });
    fillTable(table, ['部分', spec.valueLabel || '数值', '占比'], parts.map((p) => [p.name, fmt(p.value), Math.round((p.value / total) * 100) + '%']));
  }

  /* ========== 热力图（顺序色 7 阶，0 值用浅底） ========== */
  function heatmap(fig, spec) {
    const fmt = fmtOf(spec), rows = spec.rows, cols = spec.cols, v = spec.values;
    const { plot, tip, table } = shell(fig, spec, null);
    const W = Math.max(280, plot.clientWidth || 600);
    const left = Math.max(...rows.map((r) => textW(r, 12))) + 12, top = 22, gap = 2;
    const cw = (W - left) / cols.length, ch = Math.min(34, cw * 0.8), H = top + rows.length * ch + 4;
    const max = Math.max(...v.flat()) || 1;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img', 'aria-label': spec.title || '热力图' }, plot);
    cols.forEach((c, ci) => { el('text', { x: left + cw * ci + cw / 2, y: 12, 'text-anchor': 'middle' }, svg).textContent = c; });
    rows.forEach((r, ri) => {
      const t = el('text', { x: left - 10, y: top + ri * ch + ch / 2 + 4, 'text-anchor': 'end' }, svg); t.textContent = r; t.style.fill = 'var(--text-2)'; t.style.fontSize = '12px';
      cols.forEach((c, ci) => {
        const val = v[ri][ci], step = val <= 0 ? 0 : Math.max(1, Math.ceil((val / max) * 7));
        const color = step === 0 ? 'surface-2' : 'seq-' + step;
        const node = el('path', { d: roundRect(left + cw * ci + gap / 2, top + ri * ch + gap / 2, cw - gap, ch - gap), style: `fill:${col(color)}` }, svg);
        bindMark(node, plot, tip, r + ' · ' + c, [{ name: spec.valueLabel || '数值', color: step ? 'seq-' + step : 'chart-other', value: fmt(val) }]);
      });
    });
    const scale = h('div', 'sw-chart__scale'); const bar = h('i');
    bar.style.background = 'linear-gradient(90deg, var(--seq-1), var(--seq-4), var(--seq-7))';
    scale.append(h('span', null, '少'), bar, h('span', null, '多 · 最高 ' + fmt(max)));
    plot.appendChild(scale);
    fillTable(table, ['', ...cols], rows.map((r, ri) => [r, ...v[ri].map(fmt)]));
  }

  /* ========== 迷你走势（KPI 卡内，无坐标轴；当前值用朱橙圆点） ========== */
  function sparkline(node, spec) {
    const vals = spec.values, W = 96, H = 28, n = vals.length;
    const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn || 1;
    const X = (i) => (W * i) / (n - 1), Y = (v) => H - 3 - ((v - mn) / span) * (H - 6);
    node.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': spec.label || '近期走势' }, node);
    el('polyline', { points: vals.map((v, i) => `${X(i)},${Y(v)}`).join(' '), fill: 'none', style: 'stroke:var(--chart-other)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    el('polyline', { points: `${X(n - 2)},${Y(vals[n - 2])} ${X(n - 1)},${Y(vals[n - 1])}`, fill: 'none', style: `stroke:${col(spec.color || 'chart-1')}`, 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
    el('circle', { cx: X(n - 1), cy: Y(vals[n - 1]), r: 3.5, style: `fill:${col(spec.color || 'chart-1')};stroke:var(--surface)`, 'stroke-width': 2 }, svg);
  }

  const TYPES = { line, column, bar, diverging, segmented, heatmap };
  const specs = new WeakMap();

  SW.charts = {
    render(fig, spec) {
      specs.set(fig, spec);
      if (spec.type === 'sparkline') return sparkline(fig, spec);
      const fn = TYPES[spec.type];
      if (!fn) throw new Error('未知图表类型：' + spec.type);
      fn(fig, spec);
      if (!fig._swRO && 'ResizeObserver' in window) {
        let w = fig.clientWidth;
        fig._swRO = new ResizeObserver(() => { if (Math.abs(fig.clientWidth - w) > 4) { w = fig.clientWidth; fn(fig, specs.get(fig)); } });
        fig._swRO.observe(fig);
      }
    },
    mountAll(root = document) {
      root.querySelectorAll('[data-sw-chart]').forEach((n) => {
        try { SW.charts.render(n, JSON.parse(n.getAttribute('data-sw-chart'))); }
        catch (e) { n.textContent = '图表数据格式错误：' + e.message; }
      });
    },
    /* 给 ECharts / AntV 等第三方库用的主题色（读取当前主题下的令牌值） */
    theme(node = document.documentElement) {
      const cs = getComputedStyle(node), v = (n) => cs.getPropertyValue('--' + n).trim();
      return {
        color: [1, 2, 3, 4, 5, 6, 7].map((i) => v('chart-' + i)),
        other: v('chart-other'), prev: v('chart-prev'),
        sequential: [1, 2, 3, 4, 5, 6, 7].map((i) => v('seq-' + i)),
        diverging: ['div-neg', 'div-neg-weak', 'div-mid', 'div-pos-weak', 'div-pos'].map(v),
        status: { good: v('chart-good'), warning: v('chart-warning'), serious: v('chart-serious'), critical: v('chart-critical') },
        grid: v('chart-grid'), axis: v('chart-axis'), text: v('text-3'), textStrong: v('ink'), surface: v('surface'),
        fontFamily: v('font-sans'),
      };
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => SW.charts.mountAll());
  else setTimeout(() => SW.charts.mountAll());
})();
