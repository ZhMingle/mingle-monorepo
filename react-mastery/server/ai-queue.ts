type Priority='interactive'|'translation'|'background';
interface Job { task:()=>Promise<unknown>; resolve:(value:unknown)=>void; reject:(reason:unknown)=>void; priority:Priority }

// Reserve an independent CLI slot for learner actions so a running prefetch or
// translation cannot delay a submitted answer. Each lane remains serial.
export class AiQueue {
  private jobs:Job[]=[];
  private running=new Set<'interactive'|'background'>();
  run<T>(task:()=>Promise<T>,priority:Priority='interactive'):Promise<T>{
    return new Promise<T>((resolve,reject)=>{
      this.jobs.push({task,resolve:value=>resolve(value as T),reject,priority});
      this.drain();
    });
  }
  private drain(){
    for(const lane of ['interactive','background'] as const){
      if(this.running.has(lane))continue;
      const index=lane==='interactive'
        ?this.jobs.findIndex(job=>job.priority==='interactive')
        :this.jobs.findIndex(job=>job.priority==='translation');
      const next=index>=0?index:lane==='background'?this.jobs.findIndex(job=>job.priority==='background'):-1;
      if(next<0)continue;
      const [job]=this.jobs.splice(next,1);
      this.running.add(lane);
      void Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{
        this.running.delete(lane);this.drain();
      });
    }
  }
}
