console.log("[background.js] Script loaded");
fetch(chrome.runtime.getURL("config.json"))
  .then((res) => res.json())
  .then((config) => {
    chrome.storage.local.set({ openaiKey: config.OPENAI_API_KEY });
  });

chrome.runtime.onInstalled.addListener(() => {
  console.log("[background.js] onInstalled event fired");
  chrome.contextMenus.create({
    id: "devmate-analyze",
    title: "Ask DevMate AI",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "summarize-page",
    title: "🧠 Summarize This Page",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab.id;
  if (info.menuItemId === "devmate-analyze") {
    console.log(
      "[background.js] Context menu clicked with selected text:",
      info.selectionText
    );
    const selectedText = info.selectionText;
    await chrome.storage.local.set({ selectedText });
    await injectSidebar(tabId);
  }
  if (info.menuItemId === "summarize-page") {
    await chrome.storage.local.remove("selectedText");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await injectSidebar(tabId);
  }
});
async function injectSidebar(tabId) {
  // Inject sidebar.html if not already present
  await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      if (!document.getElementById("sidebar")) {
        const res = await fetch(chrome.runtime.getURL("sidebar.html"));
        const html = await res.text();
        const div = document.createElement("div");
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
        console.log("[sidebar injection] sidebar.html injected");
      }
    },
  });

  // Inject sidebar.js
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["sidebar.js"],
  });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "devmate-get-ai-response") {
    console.log(
      "[background.js] Received AI request with prompt:",
      message.prompt
    );
    chrome.storage.local.get("openaiKey", async (data) => {
      const apiKey = data.openaiKey;
      console.log(apiKey);
      const result = await analyzeWithOpenAI(message.prompt, apiKey);
      console.log("[background.js] AI response received:", result);
      sendResponse({ result });
    });

    return true; // Required for async sendResponse
  }
  if (message.type === "prepare-summary") {
    const sectionedText = extractSections(); // assuming this function exists
    chrome.storage.local.set({ selectedSections: sectionedText });
  }
});

async function analyzeWithOpenAI(text, apiKey) {
  console.log(
    "[background.js] Sending request to OpenRouter AI for text:",
    text
  );
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Title": "DevMate AI",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that explains text in simple terms.",
            },
            { role: "user", content: text },
          ],
          temperature: 0.7,
          max_tokens: 512,
        }),
      }
    );

    const data = await response.json();
    console.log("[OpenRouter Response]", data);
    const content = data.choices?.[0]?.message?.content?.trim();

    return content && content.length > 0
      ? content
      : "⚠️ The AI response was empty. Try again or check your API quota.";
  } catch (err) {
    return "Error: " + err.message;
  }
}
