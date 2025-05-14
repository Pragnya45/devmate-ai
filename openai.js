let apiKey = "";

async function loadConfig() {
  const res = await fetch(chrome.runtime.getURL("config.json"));
  const config = await res.json();
  apiKey = config.OPENAI_API_KEY;
}

async function askOpenAI(prompt) {
  if (!apiKey) await loadConfig();
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
              content: prompt,
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
