(async () => {
  if (!document.getElementById("devmate-sidebar-wrapper")) {
    const wrapper = document.createElement("div");
    wrapper.id = "devmate-sidebar-wrapper";
    wrapper.style.zIndex = "999999";

    try {
      const response = await fetch(chrome.runtime.getURL("sidebar.html"));
      const html = await response.text();
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper);

      document.getElementById("closeSidebar").addEventListener("click", () => {
        wrapper.remove();
      });

      // Simulate fetching AI response (replace this with actual fetch)
      const aiResponse = await getAIResponse("Hello, AI!");

      // Once response is received, hide spinner and show content
      const spinner = document.getElementById("loadingSpinner");
      const responseEl = document.getElementById("aiResponseContent");

      spinner.style.display = "none";
      responseEl.style.display = "block";
      responseEl.style.opacity = "1";
      responseEl.textContent = aiResponse;
    } catch (err) {
      console.error("Failed to load sidebar.html:", err);
    }
  }

  // Simulated AI response logic
  async function getAIResponse(prompt) {
    // Replace this with actual API call
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve("✅ AI response: Here is the answer to your question!");
      }, 1000)
    );
  }
})();
