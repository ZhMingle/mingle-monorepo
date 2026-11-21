import {useEffect,useRef} from 'react';
import type {MouseEvent,ReactNode} from 'react';
let scrollLocks=0;
let originalOverflow='';

function clickedBackdrop(event:MouseEvent<HTMLDialogElement>){
  if(event.target!==event.currentTarget)return false;
  const {left,right,top,bottom}=event.currentTarget.getBoundingClientRect();
  return event.clientX<left||event.clientX>=right||event.clientY<top||event.clientY>=bottom;
}

// Native modal dialogs supply focus containment and make the workspace behind inert.
export default function NotebookDialog({children,className,labelledBy,onDismiss,dismissOnBackdrop=false}:{children:ReactNode;className:string;labelledBy:string;onDismiss:()=>void;dismissOnBackdrop?:boolean}){
  const dialogRef=useRef<HTMLDialogElement>(null);
  const startedOnBackdrop=useRef(false);
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
  return <dialog ref={dialogRef} className={className} aria-labelledby={labelledBy}
    onPointerDown={event=>{startedOnBackdrop.current=dismissOnBackdrop&&event.isPrimary&&event.button===0&&clickedBackdrop(event);}}
    onPointerCancel={()=>{startedOnBackdrop.current=false;}}
    onClick={event=>{
      const shouldDismiss=startedOnBackdrop.current&&clickedBackdrop(event);
      startedOnBackdrop.current=false;
      if(shouldDismiss)dismiss.current();
    }}>{children}</dialog>;
}
