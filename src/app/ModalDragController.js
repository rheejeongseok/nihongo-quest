'use client';

import { useEffect } from 'react';

// Popups opt in explicitly; forms, drawing canvases and mobile drawers keep their gestures.
export default function ModalDragController() {
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 769px) and (pointer: fine)');
    let drag = null;
    const stop = () => {
      if (!drag) return;
      const previous = drag;
      drag = null;
      previous.modal.removeAttribute('data-modal-dragging');
      if (previous.handle.hasPointerCapture(previous.pointerId)) previous.handle.releasePointerCapture(previous.pointerId);
    };
    const start = event => {
      if (!desktop.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
      const handle = event.target.closest('[data-modal-drag-handle]');
      const modal = handle?.closest('[data-draggable-modal]');
      if (!modal || event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
      stop();
      const rect = modal.getBoundingClientRect();
      const [x,y] = (modal.style.translate || '0px 0px').split(' ').map(parseFloat);
      drag = { modal, handle, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY,
        x, y, left:rect.left-x, top:rect.top-y, width:rect.width, height:rect.height };
      modal.setAttribute('data-modal-dragging','');
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    };
    const move = event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (!drag.modal.isConnected) { stop(); return; }
      // Keep the window inside the viewport, including its title and close button.
      const x = Math.min(Math.max(drag.x+event.clientX-drag.startX, -drag.left), Math.max(0,document.documentElement.clientWidth-drag.width)-drag.left);
      const y = Math.min(Math.max(drag.y+event.clientY-drag.startY, -drag.top), Math.max(0,document.documentElement.clientHeight-drag.height)-drag.top);
      drag.modal.style.translate = `${x}px ${y}px`;
    };
    const end = event => { if (event.pointerId === drag?.pointerId) stop(); };
    const reset = () => {
      stop();
      document.querySelectorAll('[data-draggable-modal]').forEach(modal => modal.style.removeProperty('translate'));
    };
    document.addEventListener('pointerdown',start,true);
    document.addEventListener('pointermove',move,true);
    document.addEventListener('pointerup',end,true);
    document.addEventListener('pointercancel',end,true);
    document.addEventListener('lostpointercapture',end,true);
    window.addEventListener('resize',reset);
    window.addEventListener('blur',stop);
    desktop.addEventListener('change',reset);
    return () => {
      stop();
      document.removeEventListener('pointerdown',start,true);
      document.removeEventListener('pointermove',move,true);
      document.removeEventListener('pointerup',end,true);
      document.removeEventListener('pointercancel',end,true);
      document.removeEventListener('lostpointercapture',end,true);
      window.removeEventListener('resize',reset);
      window.removeEventListener('blur',stop);
      desktop.removeEventListener('change',reset);
    };
  },[]);
  return null;
}
