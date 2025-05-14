fetch(chrome.runtime.getURL("config.json"))
  .then((response) => response.json())
  .then((config) => {
    chrome.storage.local.set({ openaiKey: config.OPENAI_API_KEY });
  });

chrome.runtime.onInstalled.addListener(() => {
  console.log("Creating context menu...");
  chrome.contextMenus.create({
    id: "devmate-analyze",
    title: "Ask DevMate AI",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "devmate-analyze") {
    chrome.storage.local.get("openaiKey", async (data) => {
      const apiKey = data.openaiKey;
      const text = info.selectionText;

      // Inject the sidebar HTML and loading spinner
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["sidebar.js"], // <-- injects sidebar HTML
      });

      // Show loading state
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (state) => {
          document.getElementById("loadingSpinner").style.display = "block";
          document.getElementById("aiResponseContent").style.display = "none";
        },
        args: ["loading"],
      });

      // Fetch explanation
      const result = await analyzeSelectionWithAI(text, apiKey);

      // Show result in sidebar
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (aiResponse) => {
          document.getElementById("loadingSpinner").style.display = "none";
          const responseEl = document.getElementById("aiResponseContent");
          responseEl.textContent = aiResponse;
          responseEl.style.display = "block";
        },
        args: [result],
      });
    });
  }
});

async function analyzeSelectionWithAI(text, apiKey) {
  if (!apiKey) {
    window.alert("Missing API key");
    return;
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://yourapp.example.com", // Optional: Replace with your app's URL
          "X-Title": "Explain Selected Text", // Optional: Title for your application
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
              content: `Explain this:\n\n"${text}"`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      }
    );

    const data = await response.json();
    console.log("OpenRouter response:", data);

    return (
      data.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "No explanation received."
    );
  } catch (err) {
    return "Error: " + err.message;
  }
}
function displayInSidebar(aiResponse) {
  const sidebar = document.getElementById("sidebar");
  const aiResponseContent = document.getElementById("aiResponseContent");
  const loadingSpinner = document.getElementById("loadingSpinner");

  // Show the sidebar
  sidebar.style.display = "block";

  // If we're still loading, show the spinner
  if (aiResponse === "loading") {
    aiResponseContent.style.display = "none";
    loadingSpinner.style.display = "block"; // Show the loading spinner
  } else {
    // Otherwise, hide the spinner and show the response
    loadingSpinner.style.display = "none";
    aiResponseContent.textContent = aiResponse;
    aiResponseContent.style.display = "block";
  }

  // Close button functionality
  document
    .getElementById("closeSidebar")
    .addEventListener("click", function () {
      sidebar.style.display = "none";
    });
}
