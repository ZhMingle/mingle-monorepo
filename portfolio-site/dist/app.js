document.getElementById('year').textContent = new Date().getFullYear();
document.querySelectorAll('.detail-toggle').forEach(button => button.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  document.getElementById(button.getAttribute('aria-controls')).hidden = expanded;
  button.querySelector('span').textContent = expanded ? '＋' : '−';
}));
const defaults = () => [{id:1,text:'Understand the user’s workflow',done:true},{id:2,text:'Build a clear interface',done:false},{id:3,text:'Review the edge cases',done:false}];
let tasks = defaults();
try { const saved = JSON.parse(localStorage.getItem('mingle-portfolio-tasks')); if (Array.isArray(saved) && saved.length <= 50 && saved.every(t => t && typeof t.text === 'string' && t.text.length <= 80 && typeof t.done === 'boolean' && typeof t.id === 'number') && new Set(saved.map(t=>t.id)).size === saved.length) tasks = saved; } catch {}
function render() {
  for (const state of [false,true]) {
    const list = document.getElementById(state ? 'done' : 'todo'); list.replaceChildren();
    const filtered = tasks.filter(task => task.done === state);
    document.getElementById(state ? 'done-count' : 'todo-count').textContent = filtered.length;
    filtered.forEach(task => { const button = document.createElement('button'); button.className = 'task' + (state ? ' completed' : ''); button.type = 'button'; button.setAttribute('aria-label', `${task.text}: move to ${state ? 'to do' : 'done'}`); const check = document.createElement('span'); check.className='check'; check.setAttribute('aria-hidden','true'); check.textContent = state ? '✓' : ''; const label = document.createElement('span'); label.textContent=task.text; button.append(check,label); button.addEventListener('click',()=>{task.done=!task.done;render();}); list.append(button); });
    if(!filtered.length) {const empty=document.createElement('p');empty.className='empty';empty.textContent=state?'Your next small win goes here.':'All clear. Add something new.';list.append(empty);}
  }
  document.getElementById('progress').textContent = `${tasks.filter(t=>t.done).length} / ${tasks.length} complete`;
  try {localStorage.setItem('mingle-portfolio-tasks',JSON.stringify(tasks));}catch{}
}
document.getElementById('task-form').addEventListener('submit',event=>{event.preventDefault();const input=document.getElementById('task-input');const value=input.value.trim();if(!value)return;if(tasks.length>=50){input.setCustomValidity('Reset the demo before adding more than 50 tasks.');input.reportValidity();return;}tasks.push({id:Math.max(0,...tasks.map(t=>t.id))+1,text:value,done:false});input.value='';input.setCustomValidity('');render();input.focus();});
document.getElementById('task-input').addEventListener('input',event=>event.target.setCustomValidity(''));
document.getElementById('reset').addEventListener('click',()=>{tasks=defaults();document.getElementById('task-input').setCustomValidity('');render();});
render();
