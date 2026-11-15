// Get started form: three steps, then a summary built from the visitor's own answers.
// Submission: POST JSON to the form's data-endpoint (the AUCTIX web-form address) when set.
// Until that endpoint exists, or if it fails, the summary offers to email the answers instead.
(function () {
  var form = document.getElementById('gs-form');
  if (!form) return;

  var TOOL_LABELS = {
    accounting: 'Accounting software', crm: 'Donor or customer database', payments: 'Online giving or payments',
    invoicing: 'Invoicing', expenses: 'Expense reports and receipts', email: 'Email marketing',
    events: 'Event or volunteer sign-ups', inventory: 'Inventory tracking', pos: 'Point of sale',
    payroll: 'Payroll', sheets: 'Spreadsheets doing a software job'
  };
  var NOT_COVERED = { payroll: true };
  var ORG_LABELS = { nonprofit: 'Nonprofit', retail: 'Retail or restaurant', construction: 'Construction or trades', cpa: 'Accounting or CPA firm', other: 'Something else' };

  // form.elements[...] avoids clashing with built-in form properties such as el('name').
  function el(n) { return form.elements[n]; }

  var steps = form.querySelectorAll('.gs-step');
  var pills = form.querySelectorAll('.progress li');
  var back = document.getElementById('gs-back');
  var next = document.getElementById('gs-next');
  var submit = document.getElementById('gs-submit');
  var errorBox = document.getElementById('gs-error');
  var step = 1;
  var started = Date.now();

  // ?plan=np_core etc. from the pricing page: preselect the organization type.
  var plan = new URLSearchParams(location.search).get('plan') || '';
  if (/^np_/.test(plan)) el('org_type').value = 'nonprofit';

  function show(n) {
    step = n;
    steps.forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
    pills.forEach(function (p) {
      var k = Number(p.dataset.step);
      p.className = k === n ? 'is-active' : (k < n ? 'is-done' : '');
      if (k === n) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current');
    });
    back.hidden = n === 1;
    next.hidden = n === 3;
    submit.hidden = n !== 3;
    error('');
    var first = form.querySelector('.gs-step[data-step="' + n + '"] input, .gs-step[data-step="' + n + '"] select');
    if (first && n > 1) first.focus();
  }

  function error(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = !msg;
  }

  function checkStep1() {
    if (!el('name').value.trim() || !el('organization').value.trim() || !el('org_type').value) {
      error('Please add your name, organization and type of organization.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el('email').value.trim())) {
      error('Please enter a valid email so we can reply.');
      return false;
    }
    return true;
  }

  next.addEventListener('click', function () {
    if (step === 1 && !checkStep1()) return;
    show(step + 1);
  });
  back.addEventListener('click', function () { show(Math.max(1, step - 1)); });

  function values(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }

  function recommend(type, tools, goals) {
    var has = function (t) { return tools.indexOf(t) >= 0; };
    if (type === 'nonprofit') {
      if (has('email')) return { name: 'Nonprofit Growth', price: 299, why: 'You run email outreach today, so Growth brings campaigns, inbox sync and texting in with your books and donors.' };
      if (has('events') || has('inventory') || goals.indexOf('Plan events and inventory in one place') >= 0) return { name: 'Nonprofit Core', price: 139, why: 'Events, volunteers and inventory sit next to your books and donors, with a board dashboard on top.' };
      return { name: 'Nonprofit Essentials', price: 79, why: 'Fund accounting, your donor database and receipts in one place, with unlimited users.' };
    }
    if (type === 'retail') {
      if (has('pos') || has('inventory')) return { name: 'Retail Pro', price: 99, perLocation: true, why: 'Point of sale, inventory, loyalty and your books together. The retail edition launches in spring 2027.' };
      return { name: 'Retail Free', price: 0, why: 'Register, inventory and daily sales posted to your books at no monthly cost. Launching spring 2027.' };
    }
    if (type === 'construction') return { name: 'Construction Core', price: 399, why: 'Job costing, pay applications and change orders on the same books. Our pilot starts in fall 2027.' };
    if (type === 'cpa') return { name: 'Accountant portal', price: 0, why: 'Free for your firm: close, review and reconcile every client from one home.' };
    return { name: 'A plan that fits', price: null, why: "We'll match you to the right edition on our call." };
  }

  function collect() {
    var tools = values('tools');
    var goals = values('goals');
    var spend = parseFloat(el('monthly_spend').value);
    var rec = recommend(el('org_type').value, tools, goals);
    return {
      name: el('name').value.trim(),
      email: el('email').value.trim(),
      phone: el('phone').value.trim(),
      organization: el('organization').value.trim(),
      org_type: el('org_type').value,
      team_size: el('team_size').value,
      tools: tools,
      accounting: el('accounting').value,
      monthly_spend: isNaN(spend) || spend <= 0 ? null : Math.round(spend),
      admin_hours: el('admin_hours').value,
      goals: goals,
      time_back: el('time_back').value.trim(),
      timeline: el('timeline').value,
      plan_interest: plan,
      recommended_plan: rec.name,
      recommended_price: rec.price,
      page: location.href,
      website: el('website').value, // honeypot: real people leave it empty
      elapsed_ms: Date.now() - started
    };
  }

  function mailBody(d) {
    var lines = [
      'Name: ' + d.name, 'Email: ' + d.email, 'Phone: ' + (d.phone || '-'),
      'Organization: ' + d.organization + ' (' + (ORG_LABELS[d.org_type] || d.org_type) + ')',
      'People who would use it: ' + (d.team_size || '-'),
      'Tools used today: ' + (d.tools.map(function (t) { return TOOL_LABELS[t]; }).join(', ') || '-'),
      'Accounting today: ' + (d.accounting || '-'),
      'Monthly software spend: ' + (d.monthly_spend ? '$' + d.monthly_spend : '-'),
      'Admin hours a week: ' + (d.admin_hours || '-'),
      'Goals: ' + (d.goals.join(', ') || '-'),
      'Time back: ' + (d.time_back || '-'),
      'Timeline: ' + (d.timeline || '-'),
      'Suggested plan: ' + d.recommended_plan
    ];
    return 'mailto:info@auctixtech.com?subject=' + encodeURIComponent('Get started: ' + d.organization) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function render(d, sent) {
    var rec = recommend(d.org_type, d.tools, d.goals);
    var first = d.name.split(/\s+/)[0] || 'there';
    document.getElementById('gs-title').textContent = sent
      ? 'Thanks, ' + first + ". We'll be in touch within one business day."
      : 'Thanks, ' + first + '. One more step to reach us.';
    document.getElementById('gs-sent').textContent = sent
      ? 'We have your answers. Here is what you told us and where we would start.'
      : "Your answers haven't been sent yet. Use the button below to email them to us, or call (402) 682-8676.";
    document.getElementById('r-tools').textContent = String(d.tools.length);
    document.getElementById('r-spend').textContent = d.monthly_spend ? '$' + d.monthly_spend + '/mo' : 'Not given';
    document.getElementById('r-hours').textContent = d.admin_hours || 'Not given';
    document.getElementById('r-plan-name').textContent = rec.name;
    document.getElementById('r-plan-price').textContent = rec.price === null ? '' : (rec.price === 0 ? '$0/month' : '$' + rec.price + (rec.perLocation ? '/location/month' : '/month'));
    document.getElementById('r-plan-why').textContent = rec.why;

    var covered = d.tools.filter(function (t) { return !NOT_COVERED[t]; });
    var list = document.getElementById('r-covered');
    list.innerHTML = '';
    covered.forEach(function (t) { var li = document.createElement('li'); li.textContent = TOOL_LABELS[t]; list.appendChild(li); });
    document.getElementById('r-covered-wrap').hidden = covered.length === 0;

    var savings = document.getElementById('r-savings');
    var diff = d.monthly_spend && rec.price !== null ? d.monthly_spend - rec.price : 0;
    savings.hidden = !(diff > 0);
    if (diff > 0) savings.textContent = 'That is about $' + diff + ' a month less than the $' + d.monthly_spend + ' you spend on software today.';
    document.getElementById('r-payroll').hidden = d.tools.indexOf('payroll') < 0;

    var mail = document.getElementById('gs-mail');
    mail.hidden = sent;
    mail.href = mailBody(d);

    form.hidden = true;
    var result = document.getElementById('gs-result');
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!checkStep1()) { show(1); checkStep1(); return; }
    var data = collect();
    var endpoint = form.dataset.endpoint;
    if (!endpoint) { render(data, false); return; }
    submit.disabled = true;
    submit.textContent = 'Sending…';
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { render(data, r.ok); })
      .catch(function () { render(data, false); })
      .finally(function () { submit.disabled = false; submit.textContent = 'Submit'; });
  });

  show(1);
})();
