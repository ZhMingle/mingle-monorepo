import {useEffect,useRef} from 'react';
import type {ReactNode} from 'react';
let scrollLocks=0;
let originalOverflow='';

// Native modal dialogs supply focus containment and make the workspace behind inert.
export default function NotebookDialog({children,className,labelledBy,onDismiss}:{children:ReactNode;className:string;labelledBy:string;onDismiss:()=>void}){
  const dialogRef=useRef<HTMLDialogElement>(null);
  const dismiss=useRef(onDismiss);dismiss.current=onDismiss;
  useEffect(()=>{
    const dialog=dialogRef.current!;
    const previousFocus=document.activeElement;
    const cancel=(event:Event)=>{event.preventDefault();dismiss.current();};
    if(scrollLocks++===0){originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    dialog.addEventListener('cancel',cancel);
    if(!dialog.open)dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus({preventScroll:true});
    return()=>{
      dialog.removeEventListener('cancel',cancel);
      if(dialog.open)dialog.close();
      if(--scrollLocks===0)document.body.style.overflow=originalOverflow;
      if(previousFocus instanceof HTMLElement&&previousFocus.isConnected&&(!previousFocus.closest('dialog')||previousFocus.closest('dialog')!.open))previousFocus.focus({preventScroll:true});
    };
  },[]);
  return <dialog ref={dialogRef} className={className} aria-labelledby={labelledBy}>{children}</dialog>;
}
