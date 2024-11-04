document.getElementById('saveSettings').addEventListener('click', async () => {
  const ocrApiKey = document.getElementById('ocrApiKey').value;
  const aiApiKey = document.getElementById('aiApiKey').value;

  await chrome.storage.sync.set({
    ocrApiKey,
    aiApiKey
  });

  alert('Settings saved successfully!');
});

// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.sync.get(['ocrApiKey', 'aiApiKey']);
  if (settings.ocrApiKey) {
    document.getElementById('ocrApiKey').value = settings.ocrApiKey;
  }
  if (settings.aiApiKey) {
    document.getElementById('aiApiKey').value = settings.aiApiKey;
  }
});