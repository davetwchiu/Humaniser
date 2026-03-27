const modelInput = document.getElementById('model');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const statusText = document.getElementById('status');
const humaniseBtn = document.getElementById('humaniseBtn');
const copyBtn = document.getElementById('copyBtn');

modelInput.value = localStorage.getItem('openrouter_model') || modelInput.value;

modelInput.addEventListener('change', () => {
  localStorage.setItem('openrouter_model', modelInput.value.trim());
});

copyBtn.addEventListener('click', async () => {
  if (!outputText.value.trim()) {
    setStatus('No output to copy yet.');
    return;
  }

  await navigator.clipboard.writeText(outputText.value);
  setStatus('Output copied.');
});

humaniseBtn.addEventListener('click', async () => {
  const model = modelInput.value.trim();
  const text = inputText.value.trim();

  if (!model || !text) {
    setStatus('Please fill model and input text.');
    return;
  }

  humaniseBtn.disabled = true;
  setStatus('Humanising...');

  try {
    const response = await fetch('/api/humanise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, text })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.output?.trim()) {
      throw new Error('Model returned an empty response.');
    }

    outputText.value = data.output.trim();
    setStatus('Done. You can copy the output now.');
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  } finally {
    humaniseBtn.disabled = false;
  }
});

function setStatus(message) {
  statusText.textContent = message;
}
