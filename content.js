(() => {
  // Prevent duplicate execution if already injected
  if (window.__devmate_initialized__) return;
  window.__devmate_initialized__ = true;

  function extractVisibleText() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          return node.parentNode.offsetParent !== null &&
            node.textContent.trim().length > 30
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      }
    );

    let text = "";
    while (walker.nextNode()) {
      text += walker.currentNode.textContent.trim() + "\n\n";
    }
    return text.trim();
  }

  const fullText = extractVisibleText();
  chrome.storage.local.set({ selectedText: fullText });
})();
