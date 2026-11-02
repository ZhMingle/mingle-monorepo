type Priority='interactive'|'translation';
interface Job { task:()=>Promise<unknown>; resolve:(value:unknown)=>void; reject:(reason:unknown)=>void; priority:Priority }

// One local CLI process at a time. Waiting requests retain their own promises;
// translation cannot jump ahead of a queued learner action.
export class AiQueue {
  private jobs:Job[]=[];
  private running=false;
  run<T>(task:()=>Promise<T>,priority:Priority='interactive'):Promise<T>{
    return new Promise<T>((resolve,reject)=>{
      this.jobs.push({task,resolve:value=>resolve(value as T),reject,priority});
      this.drain();
    });
  }
  private drain(){
    if(this.running||!this.jobs.length)return;
    const interactive=this.jobs.findIndex(job=>job.priority==='interactive');
    const [job]=this.jobs.splice(interactive<0?0:interactive,1);
    this.running=true;
    void Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{
      this.running=false;this.drain();
    });
  }
}
