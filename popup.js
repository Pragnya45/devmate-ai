document.getElementById("analyze").addEventListener("click", async () => {
  const input = document.getElementById("input").value;
  const output = document.getElementById("output");
  output.textContent = "Asking AI...";
  const result = await askOpenAI(input);
  output.textContent = result;
});
