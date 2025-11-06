import React, { useMemo, useState } from 'react';
import { useWorkout } from '../state/WorkoutContext';

function Sparkline({ points = [] }) {
  if (!points.length) return <svg width="120" height="40" />;
  const w = 140, h = 40; const pad = 4;
  const xs = points.map((_, i) => pad + (i * (w - pad*2)) / Math.max(points.length - 1, 1));
  const min = Math.min(...points), max = Math.max(...points);
  const ys = points.map(v => h - pad - (max===min ? 0.5 : (v-min)/(max-min))*(h-pad*2));
  const d = xs.map((x,i)=>`${i?'L':'M'}${x},${ys[i]}`).join(' ');
  return (
    <svg width={w} height={h}>
      <path d={d} fill="none" stroke="#7c3aed" strokeWidth="2" />
      {xs.map((x,i)=>(<circle key={i} cx={x} cy={ys[i]} r="1.8" fill="#06b6d4" />))}
    </svg>
  );
}

export default function Progress() {
  const { history = [] } = useWorkout();
  const data = useMemo(() => {
    // group by exercise
    const map = new Map();
    (history || []).forEach(e => {
      if (!e.exercise) return;
      const key = e.exercise;
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    });
    // sort each by ts asc
    const entries = Array.from(map.entries()).map(([name, arr]) => {
      const sorted = arr.slice().sort((a,b)=>a.ts-b.ts);
      const last = sorted[sorted.length-1];
      // PR by weight*reps simple metric
      const pr = sorted.reduce((best, cur) => (cur.weight*cur.reps) > (best.weight*best.reps) ? cur : best, {weight:0,reps:0});
      const last5 = sorted.slice(-5).map(e => e.weight);
      const trend = last5.length>=2 ? Math.sign(last5[last5.length-1]-last5[last5.length-2]) : 0;
      return { name, sorted, last, pr, last5, trend };
    });
    // sort by most recent activity
    entries.sort((a,b)=> (b.last?.ts||0) - (a.last?.ts||0));
    return entries;
  }, [history]);

  const [open, setOpen] = useState({});

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28">
      <h2 className="text-white text-2xl font-bold mb-3">Progress</h2>
      <div className="space-y-3">
        {(data || []).map(item => (
          <div key={item.name} className="pulse-glass rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white font-semibold text-lg">{item.name}</div>
                <div className="text-white/70 text-sm mt-1">
                  {item.last ? `${new Date(item.last.ts).toLocaleDateString(undefined, { month:'short', day:'2-digit' })}: ${item.last.weight}kg × ${item.last.reps}` : 'No data yet'}
                </div>
                {item.pr && (item.pr.weight>0) && (
                  <div className="mt-1 text-emerald-300 text-xs font-semibold">PR: {item.pr.weight}kg × {item.pr.reps}</div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-sm ${item.trend>0?'text-emerald-400':item.trend<0?'text-rose-400':'text-white/60'}`}>
                  {item.trend>0?'↑':item.trend<0?'↓':'→'}
                </div>
                <Sparkline points={item.last5} />
              </div>
            </div>
            {open[item.name] && (
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                {item.sorted.slice().reverse().map((e,i)=>(
                  <div key={i} className="flex items-center justify-between text-white/80 text-sm">
                    <span>{new Date(e.ts).toLocaleString([], { month:'short', day:'2-digit' })}</span>
                    <span>{e.weight}kg × {e.reps}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button onClick={()=>setOpen(o=>({...o,[item.name]:!o[item.name]}))} className="px-3 py-1 rounded-xl bg-white/10 text-white border border-white/10 text-xs">
                {open[item.name] ? 'Hide' : 'View History'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
