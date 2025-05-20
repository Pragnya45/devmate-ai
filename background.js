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
  console.log("[background.js] Context menu created");
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "devmate-analyze") {
    console.log(
      "[background.js] Context menu clicked with selected text:",
      info.selectionText
    );
    const selectedText = info.selectionText;

    // Save selected text so sidebar can access it
    await chrome.storage.local.set({ selectedText });
    console.log("[background.js] Selected text saved to storage");
    // Inject sidebar HTML
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        if (!document.getElementById("sidebar")) {
          const res = await fetch(chrome.runtime.getURL("sidebar.html"));
          const html = await res.text();
          const div = document.createElement("div");
          div.innerHTML = html;
          document.body.appendChild(div.firstElementChild); // append only the #sidebar div
          console.log("[sidebar injection] sidebar.html injected");
        }
      },
    });

    // Inject sidebar.js to run sidebar logic
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["sidebar.js"],
    });
  }
});

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
          model: "deepseek/deepseek-r1",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that explains text in simple terms.",
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      }
    );

    const data = await response.json();
    console.log("[background.js] OpenRouter AI response:", data);
    return (
      data.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "No explanation received."
    );
  } catch (err) {
    return "Error: " + err.message;
  }
}
