const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { MailSync } = require('./dist/sync.js');

const source = fs.readFileSync('dist/app.js', 'utf8');
const classifySource = source.slice(source.indexOf('function classify('), source.indexOf('async function refresh('));
const context = vm.createContext({});
vm.runInContext(classifySource + ';globalThis.classifyMail=classify', context);

const cases = [
  ['Payslip for Mingle Zhang for May 2026', 'bill'],
  ['Your PAYSLIP is ready!', 'bill'],
  ['May pay slip', 'bill'],
  ['Your pay-slip is attached', 'bill'],
  ['Monthly payslips', 'bill'],
  ['2026年5月工资单已生成', 'bill'],
  ['本月工资条', 'bill'],
  ['五月薪资单', 'bill'],
  ['五月薪酬单', 'bill'],
  ['五月薪水单', 'bill'],
  ['Payroll statement for May', 'bill'],
  ['Your salary statement', 'bill'],
  ['Monthly earnings statements', 'bill'],
  ['Your Apple receipt', 'bill'],
  ['Invoice for May', 'bill'],
  ['电子机票与付款收据', 'bill'],
  ['Xero account security alert', 'notice'],
  ['Weekly payroll newsletter', 'sub'],
  ['Salary negotiation tips — newsletter', 'sub'],
  ['Payroll software discount offer', 'promo'],
  ['Payslipper product launch', 'personal'],
  ['Re: meeting tomorrow', 'personal'],
];
for (const [subject, expected] of cases) {
  assert.equal(context.classifyMail(subject, 'noreply@post.xero.com', [], []), expected, subject);
}
const payslip = cases[0][0];
for (const labels of [[], ['CATEGORY_UPDATES'], ['CATEGORY_PROMOTIONS']]) {
  assert.equal(context.classifyMail(payslip, 'noreply@post.xero.com', labels, [{ name: 'List-Unsubscribe', value: '<mailto:unsubscribe@example.com>' }]), 'bill');
}
assert.equal(context.classifyMail('Your account has been updated', 'noreply@post.xero.com', ['CATEGORY_UPDATES'], []), 'notice');

// Exercise the real synchronization engine with the application's classifier.
const store = new Map();
let updated = false;
const engine = new MailSync({
  storage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) },
  classify: context.classifyMail,
  api: async path => {
    if (path === 'profile') return { emailAddress: 'test@example.com', historyId: updated ? '2' : '1' };
    if (path.startsWith('messages?')) return { messages: [{ id: 'salary-message' }] };
    assert(path.startsWith('messages/salary-message?'));
    return { id: 'salary-message', payload: { headers: [{ name: 'From', value: 'noreply@post.xero.com' }, { name: 'Subject', value: updated ? payslip : 'Meeting tomorrow' }] },
      labelIds: updated ? ['INBOX', 'CATEGORY_UPDATES'] : ['INBOX'], internalDate: '1778803200000' };
  },
});
(async () => {
  await engine.sync();
  assert.equal(engine.mails[0].cat, 'personal');
  updated = true;
  await engine.sync({ force: true });
  assert.equal(engine.mails.length, 1);
  assert.equal(engine.mails[0].cat, 'bill');
  assert.equal(engine.mails[0].subject, payslip);
  assert.equal(engine.mails[0].trash, false);
  engine.saveEdits(engine.mails.map(mail => ({ ...mail, cat: 'personal', manualCat: 'personal' })));
  await engine.sync({ force: true });
  assert.equal(engine.mails[0].cat, 'personal', 'an explicit manual category wins over automatic reclassification');
  assert.equal(engine.mails[0].manualCat, 'personal');
  console.log('PASS: payslip variants, bill priority, unrelated mail categories, Gmail reclassification, and manual overrides');
})().catch(error => { console.error(error); process.exitCode = 1; });
