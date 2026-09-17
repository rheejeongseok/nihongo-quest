export function showToast(message, type = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('nihongo-toast', {
    detail: { message: String(message), type }
  }));
}
