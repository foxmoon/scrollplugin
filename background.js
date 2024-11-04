// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'startExtraction',
    title: 'Start Text Recognition',
    contexts: ['page']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'startExtraction') {
    chrome.tabs.sendMessage(tab.id, { action: 'startExtraction' });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyToClipboard') {
    const textToCopy = request.text;
    navigator.clipboard.writeText(textToCopy)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});