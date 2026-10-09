// Let the homepage follow this document's content height, including open controls.
(() => {
  if (parent === window) return;
  const reportHeight = () => parent.postMessage({
    type: 'walkthrough-height',
    height: Math.ceil(document.querySelector('main').getBoundingClientRect().height) + 4
  }, location.origin);
  if ('ResizeObserver' in window) {
    new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  }
  window.addEventListener('load', reportHeight);
  reportHeight();
})();
