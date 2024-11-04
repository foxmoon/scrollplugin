class TextExtractor {
  constructor() {
    this.extractedText = '';
    this.isExtracting = false;
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'startExtraction') {
        this.startExtraction();
      }
    });
  }

  async startExtraction() {
    if (this.isExtracting) return;
    this.isExtracting = true;
    
    try {
      // Try normal text extraction first
      if (await this.extractNormalText()) {
        await this.copyToClipboard();
        return;
      }

      // Try with disabled JavaScript
      if (await this.extractTextWithDisabledJS()) {
        await this.copyToClipboard();
        return;
      }

      // Fall back to OCR
      await this.performOCR();
      await this.copyToClipboard();
    } catch (error) {
      console.error('Extraction failed:', error);
      alert('Text extraction failed. Please check the console for details.');
    } finally {
      this.isExtracting = false;
    }
  }

  async extractNormalText() {
    return new Promise((resolve) => {
      let text = '';
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const trimmed = node.textContent.trim();
        if (trimmed) {
          text += trimmed + '\n';
        }
      }

      if (text) {
        this.extractedText = text;
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  async extractTextWithDisabledJS() {
    // Create a clone of the page without scripts
    const clone = document.cloneNode(true);
    const scripts = clone.getElementsByTagName('script');
    while (scripts[0]) {
      scripts[0].parentNode.removeChild(scripts[0]);
    }

    let text = '';
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const trimmed = node.textContent.trim();
      if (trimmed) {
        text += trimmed + '\n';
      }
    }

    if (text) {
      this.extractedText = text;
      return true;
    }
    return false;
  }

  async performOCR() {
    const settings = await chrome.storage.sync.get(['ocrApiKey']);
    if (!settings.ocrApiKey) {
      throw new Error('OCR API Key not configured');
    }

    // Capture the visible area as a screenshot
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    
    canvas.width = window.innerWidth;
    canvas.height = scrollHeight;

    // Scroll through the page and capture
    let currentScroll = 0;
    while (currentScroll < scrollHeight) {
      window.scrollTo(0, currentScroll);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use html2canvas or similar library to capture the current viewport
      // This is a placeholder for the actual implementation
      // You would need to implement the actual screenshot capture logic
      
      currentScroll += window.innerHeight;
    }

    // Reset scroll position
    window.scrollTo(0, 0);

    // Convert canvas to base64
    const imageData = canvas.toDataURL('image/png').split(',')[1];

    // Call OCR API (example using a generic API endpoint)
    const response = await fetch('https://api.ocr.service/v1/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.ocrApiKey}`
      },
      body: JSON.stringify({
        image: imageData
      })
    });

    if (!response.ok) {
      throw new Error('OCR API request failed');
    }

    const result = await response.json();
    this.extractedText = result.text;
  }

  async copyToClipboard() {
    if (!this.extractedText) {
      throw new Error('No text to copy');
    }

    await chrome.runtime.sendMessage({
      action: 'copyToClipboard',
      text: this.extractedText
    });
  }
}

// Initialize the extractor
const extractor = new TextExtractor();