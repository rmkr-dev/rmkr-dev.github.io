// Simple stat fill animation — values reflect resume claims.
function animate(id, to) {
const el = document.getElementById(id);
let v = 0;
const step = Math.max(1, Math.round(to / 40));
const iv = setInterval(()=>{
v += step;
if (v >= to) { v = to; clearInterval(iv);}
el.textContent = v + (id==='m2'? 'x':'%');
}, 22);
}


document.addEventListener('DOMContentLoaded', ()=>{
animate('m1', 30); // 30% CI/CD efficiency (from resume)
animate('m2', 20); // 20x approvals
animate('m3', 40); // 40% perf improvement
});
