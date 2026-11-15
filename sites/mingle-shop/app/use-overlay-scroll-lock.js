'use client';
import {useEffect} from 'react';

let locks = 0;
let restorePage;

function preserveStyles(element, properties) {
  const saved = properties.map(property => [property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
  return () => saved.forEach(([property, value, priority]) => {
    if (value) element.style.setProperty(property, value, priority);
    else element.style.removeProperty(property);
  });
}

export default function useOverlayScrollLock() {
  useEffect(() => {
    if (locks++ === 0) {
      const root = document.documentElement, body = document.body;
      const x = window.scrollX, y = window.scrollY;
      const gap = window.innerWidth - root.clientWidth;
      const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
      const restoreRoot = preserveStyles(root, ['overflow', 'overscroll-behavior']);
      const restoreBody = preserveStyles(body, ['position', 'top', 'left', 'width', 'overflow', 'padding-right']);
      root.style.overflow = 'hidden';
      root.style.overscrollBehavior = 'none';
      Object.assign(body.style, {position: 'fixed', top: `${-y}px`, left: `${-x}px`, width: '100%', overflow: 'hidden'});
      if (gap > 0) body.style.paddingRight = `${padding + gap}px`;
      restorePage = () => {
        restoreRoot();
        restoreBody();
        window.scrollTo({left: x, top: y, behavior: 'instant'});
      };
    }
    return () => {
      if (--locks === 0) {
        restorePage?.();
        restorePage = undefined;
      }
    };
  }, []);
}
