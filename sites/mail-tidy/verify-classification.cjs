const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('dist/app.js', 'utf8');
const classifySource = source.slice(source.indexOf('function classify('), source.indexOf('async function refresh()'));
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

// Exercise real Gmail metadata loading: a previously misclassified record is replaced.
const refreshSource = source.slice(source.indexOf('async function refresh()'), source.indexOf("$('#refresh').onclick"));
const controls = {};
Object.assign(context, {
  URLSearchParams, Date, Number, Set, Promise, Error,
  demo: false, busy: false, selected: new Set(), undo: null,
  mails: [{ id: 'salary-message', cat: 'personal', trash: false }],
  $: selector => controls[selector] ??= {},
  render: () => {}, toast: () => {},
  api: async path => path.startsWith('messages?')
    ? { messages: [{ id: 'salary-message' }] }
    : { id: 'salary-message', payload: { headers: [{ name: 'From', value: 'noreply@post.xero.com' }, { name: 'Subject', value: payslip }] }, labelIds: ['INBOX', 'CATEGORY_UPDATES'], internalDate: '1778803200000' },
});
vm.runInContext(refreshSource + ';globalThis.refreshMail=refresh', context);
(async () => {
  await context.refreshMail();
  assert.equal(context.mails.length, 1);
  assert.equal(context.mails[0].cat, 'bill');
  assert.equal(context.mails[0].subject, payslip);
  assert.equal(context.mails[0].trash, false);
  console.log('PASS: payslip variants, bill priority, unrelated mail categories, and Gmail reclassification');
})().catch(error => { console.error(error); process.exitCode = 1; });
