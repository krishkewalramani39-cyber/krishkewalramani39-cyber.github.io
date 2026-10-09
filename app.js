const KEY = 'weakest-first-v1';
let exams = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(exams)); } catch (e) { /* storage unavailable */ }
}
const uid = () => Math.random().toString(36).slice(2, 9);

function daysLeft(dateStr) {
  const exam = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exam - today) / 86400000);
}

function countdown(n) {
  if (n < 0) return 'Exam has passed';
  if (n === 0) return 'Exam is today';
  if (n === 1) return '1 day left';
  return n + ' days left';
}

function el(tag, props, ...kids) {
  const node = document.createElement(tag);
  Object.assign(node, props || {});
  kids.forEach(k => node.append(k));
  return node;
}

function render() {
  const wrap = document.getElementById('exams');
  wrap.replaceChildren();
  document.getElementById('empty').hidden = exams.length > 0;
  [...exams]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(ex => wrap.append(examCard(ex)));
}

function examCard(ex) {
  const open = ex.topics.filter(t => t.conf < 5);
  const next = open.length ? open.reduce((a, b) => (b.conf < a.conf ? b : a)) : null;

  let message = 'Add your first topic below.';
  if (next) message = 'Study next: ' + next.name;
  else if (ex.topics.length) message = 'Every topic is at 5. You are set.';

  const head = el('div', { className: 'exam-head' },
    el('div', {},
      el('h2', { textContent: ex.name }),
      el('p', { className: 'when' },
        el('strong', { textContent: countdown(daysLeft(ex.date)) }),
        ' (' + ex.date + ')')),
    el('button', {
      className: 'link',
      textContent: 'Delete exam',
      onclick: () => {
        exams = exams.filter(e => e.id !== ex.id);
        save(); render();
      }
    }));

  const list = el('ul');
  ex.topics.forEach(t => list.append(topicRow(ex, t, next)));

  const input = el('input', { placeholder: 'Add a topic, like "Limits"', maxLength: 60, required: true });
  const form = el('form', { className: 'topic-form' }, input, el('button', { type: 'submit', textContent: 'Add topic' }));
  form.onsubmit = e => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    ex.topics.push({ id: uid(), name, conf: 3 });
    save(); render();
  };

  return el('section', { className: 'exam' }, head, el('p', { className: 'next', textContent: message }), list, form);
}

function topicRow(ex, t, next) {
  const buttons = [1, 2, 3, 4, 5].map(n => el('button', {
    type: 'button',
    textContent: String(n),
    ariaLabel: 'Set confidence to ' + n + ' of 5 for ' + t.name,
    ariaPressed: String(t.conf === n),
    onclick: () => { t.conf = n; save(); render(); }
  }));
  buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(t.conf === i + 1)));

  return el('li', { className: 'c' + t.conf + (next && next.id === t.id ? ' is-next' : '') },
    el('span', { className: 'topic', textContent: t.name }),
    el('div', { className: 'conf', role: 'group', ariaLabel: 'Confidence for ' + t.name }, ...buttons),
    el('button', {
      className: 'link',
      textContent: 'Remove',
      onclick: () => {
        ex.topics = ex.topics.filter(x => x.id !== t.id);
        save(); render();
      }
    }));
}

document.getElementById('exam-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('exam-name').value.trim();
  const date = document.getElementById('exam-date').value;
  if (!name || !date) return;
  exams.push({ id: uid(), name, date, topics: [] });
  save();
  e.target.reset();
  render();
});

render();
