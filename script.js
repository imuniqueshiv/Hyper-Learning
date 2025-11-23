// -------------------- Universal RGPV Question System --------------------
const BACKEND_URL = 'https://hyper-learning-backend.vercel.app/api/ask';
const CACHE_API_URL = 'https://hyper-learning-backend.vercel.app/api/cache'; // Global cache endpoint
const LOCAL_CACHE_KEY = 'rgpv_universal_answers_v1';
const CACHE_TTL_DAYS = 30;
const REGENERATE_LIMIT = 7;

// Complete subject mapping
// NOTE: You can add your 30+ subjects here. The system matches based on the prefix (e.g., "BT-101").
const SUBJECT_MAP = {
  'BT-101': { name: 'Engineering Chemistry', type: 'CHEMISTRY' },
  'BT-102': { name: 'Mathematics-I', type: 'MATH' },
  'BT-103': { name: 'English for Communication', type: 'ENGLISH' },
  'BT-104': { name: 'Basic Electrical & Electronics Engineering', type: 'ELECTRICAL' },
  'BT-105': { name: 'Engineering Graphics', type: 'GRAPHICS' },
  'BT-201': { name: 'Engineering Physics', type: 'PHYSICS' },
  'BT-202': { name: 'Mathematics-II', type: 'MATH' },
  'BT-203': { name: 'Basic Mechanical Engineering', type: 'MECHANICAL' },
  'BT-204': { name: 'Basic Civil Engineering & Mechanics', type: 'CIVIL' },
  'BT-205': { name: 'Basic Computer Engineering', type: 'COMPUTER' },
  // Add your other subjects below...
  'AD-301': { name: 'Technical Communication', type: 'ENGLISH' },
  'AD-303': { name: 'Data Structure', type: 'COMPUTER' },
  'AI-302': { name: 'Probability and Statistics', type: 'MATH' }
};

// -------------------- Global Cache API Functions --------------------
async function getGlobalCache(questionId) {
  try {
    const response = await fetch(`${CACHE_API_URL}?questionId=${encodeURIComponent(questionId)}`);
    if (response.ok) {
      const data = await response.json();
      return data.cached ? data : null;
    }
  } catch (e) {
    console.warn('Global cache fetch failed', e);
  }
  return null;
}

async function setGlobalCache(questionId, answer, metadata) {
  try {
    await fetch(CACHE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId,
        answer,
        metadata: {
          ...metadata,
          timestamp: Date.now()
        }
      })
    });
  } catch (e) {
    console.warn('Global cache save failed', e);
  }
}

async function getGlobalRegenerateCount(questionId) {
  try {
    const response = await fetch(`${CACHE_API_URL}/regenerate?questionId=${encodeURIComponent(questionId)}`);
    if (response.ok) {
      const data = await response.json();
      return data.count || 0;
    }
  } catch (e) {
    console.warn('Failed to fetch regenerate count', e);
  }
  return 0;
}

async function incrementGlobalRegenerateCount(questionId) {
  try {
    const response = await fetch(`${CACHE_API_URL}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId })
    });
    if (response.ok) {
      const data = await response.json();
      return data.count || 1;
    }
  } catch (e) {
    console.warn('Failed to increment regenerate count', e);
  }
  return 1;
}

// -------------------- Core Utilities --------------------
function loadLocalCache() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalCache(cache) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Cache save failed', e);
  }
}

function getSubjectInfo(questionId) {
  // Matches prefix like "BT-101" or "AD-303" even if ID is complex
  for (const key in SUBJECT_MAP) {
      if (questionId.startsWith(key) || questionId.includes(key)) {
          return SUBJECT_MAP[key];
      }
  }
  return { name: 'General Engineering', type: 'GENERAL' };
}

function generateQuestionId(questionContainer) {
  const pageTitle = document.title;
  const subjectCode = pageTitle.match(/([A-Z]{2,}-\d{3})/)?.[0] || 'GENERAL';
  const examDate = pageTitle.match(/\w+ \d{4}/)?.[0]?.replace(' ', '_').toLowerCase() || 'unknown';
  
  const summary = questionContainer.querySelector('summary');
  const questionNumber = summary?.textContent.match(/Q\.?\s*(\d+)/)?.[1] || '0';
  
  // Check if it has parts (a/b) - Rough check for ID generation
  const allAnswerPs = questionContainer.querySelectorAll('p[style*="margin-left"]');
  const hasMultipleParts = allAnswerPs.length > 1 || summary?.innerHTML.includes('<hr>');
  
  if (hasMultipleParts) {
    return [`${subjectCode}_${examDate}_Q${questionNumber}a`, `${subjectCode}_${examDate}_Q${questionNumber}b`];
  } else {
    return [`${subjectCode}_${examDate}_Q${questionNumber}`];
  }
}

// -------------------- NEW: ROBUST TEXT EXTRACTION --------------------
function extractQuestionText(questionContainer, partIndex = 0) {
    const summary = questionContainer.querySelector('summary');
    if (!summary) return '';

    // Helper: Convert HTML Table to Markdown Text for AI
    function tableToMarkdown(table) {
        let md = '\n\n';
        const rows = Array.from(table.querySelectorAll('tr'));
        
        rows.forEach((row, index) => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            // Build row string
            const rowText = '| ' + cells.map(c => c.textContent.trim().replace(/\n/g, ' ')).join(' | ') + ' |';
            md += rowText + '\n';

            // Add Markdown separator after header (assuming first row is header)
            if (index === 0) {
                const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
                md += separator + '\n';
            }
        });
        return md + '\n';
    }

    // Helper: Extract Alt text from Images
    function extractImages(element) {
        const images = element.querySelectorAll('img');
        let imgText = '';
        images.forEach(img => {
            const alt = img.getAttribute('alt');
            if (alt && alt.trim().length > 0) {
                imgText += `\n[Image Context: ${alt}]\n`;
            }
        });
        return imgText;
    }

    // 1. Split summary children by <hr> tags to separate parts (Part A / Part B)
    const children = Array.from(summary.children);
    let parts = [];
    let currentBuffer = [];

    children.forEach(child => {
        if (child.tagName === 'HR') {
            parts.push(currentBuffer);
            currentBuffer = [];
        } else {
            currentBuffer.push(child);
        }
    });
    if (currentBuffer.length > 0) parts.push(currentBuffer);

    // 2. Select the specific part (0 for 'a', 1 for 'b')
    const targetNodes = parts[partIndex];
    
    if (!targetNodes || targetNodes.length === 0) {
        // Fallback: If structure is simple (no HRs), return text of the specific index if possible
        if (parts.length === 0 && partIndex === 0) return summary.textContent; 
        return '';
    }

    // 3. Build the final text string from the nodes
    let fullText = '';
    
    targetNodes.forEach(node => {
        // Handle Tables directly
        if (node.tagName === 'TABLE') {
            fullText += tableToMarkdown(node);
        } 
        // Handle Tables wrapped in Divs (responsive wrappers)
        else if (node.tagName === 'DIV' && node.querySelector('table')) {
            const table = node.querySelector('table');
            fullText += tableToMarkdown(table);
        }
        // Handle Direct Images
        else if (node.tagName === 'IMG') {
            const alt = node.getAttribute('alt');
            if (alt) fullText += `\n[Image Context: ${alt}]\n`;
        }
        // Handle Paragraphs/Text
        else {
            // Add text content
            fullText += node.textContent.trim() + '\n';
            // Scan for nested images inside the paragraph
            fullText += extractImages(node);
        }
    });

    return fullText.trim();
}

// -------------------- UPDATED PROMPTS --------------------
function createSubjectPrompt(subjectInfo, questionText) {
  const prompts = {
    'MATH': 'You are an expert mathematics tutor. Provide detailed step-by-step solutions. Use LaTeX for math equations ($...$ or $$...$$). If data is provided in a table format (Markdown), use that specific data for calculations: ',
    'ENGLISH': 'You are an expert communication tutor. Provide comprehensive answers with grammar explanations: ',
    'GRAPHICS': 'You are an expert engineering graphics tutor. Explain drawing principles. If an image description is provided in brackets [Image Context: ...], use that to describe the geometry: ',
    'COMPUTER': 'You are an expert computer engineering tutor. Provide code examples and algorithms: ',
    'PHYSICS': 'You are an expert physics tutor. Provide solutions with formulas: ',
    'CHEMISTRY': 'You are an expert chemistry tutor. Provide chemical equations: ',
    'ELECTRICAL': 'You are an expert electrical engineering tutor: ',
    'MECHANICAL': 'You are an expert mechanical engineering tutor: ',
    'CIVIL': 'You are an expert civil engineering tutor. If an image description is provided [Image Context: ...], use it to solve the problem (e.g. Moment of Inertia): ',
    'GENERAL': 'You are an expert engineering tutor: '
  };
  
  return (prompts[subjectInfo.type] || prompts['GENERAL']) + questionText;
}

function formatAnswerAsHtml(str) {
  if (!str) return '';
  
  const escaped = String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let formatted = escaped
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1rem; margin: 1rem 0 0.5rem;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25rem; margin: 1rem 0 0.5rem;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.4rem; margin: 1rem 0 0.5rem;">$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([^`]+)```/g, '<pre style="background:#f3f4f6;padding:0.75rem;border-radius:6px;overflow-x:auto;font-size:0.85rem;max-width:100%;"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:0.9em;">$1</code>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 0.5rem;">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li style="margin-bottom: 0.5rem;">$2</li>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 0.75rem; line-height: 1.6; font-size: 0.95rem;">')
    .replace(/\n/g, '<br>');

  if (!formatted.includes('<p>') && !formatted.includes('<h')) {
    formatted = '<p style="margin-bottom: 0.75rem; line-height: 1.6; font-size: 0.95rem;">' + formatted + '</p>';
  }

  return formatted;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// -------------------- API Functions --------------------
const controllers = new WeakMap();

async function fetchAnswerStream(question, onChunk, signal) {
  const url = `${BACKEND_URL}?question=${encodeURIComponent(question)}`;
  const resp = await fetch(url, { method: 'GET', signal });
  const ct = resp.headers.get('content-type') || '';

  if (ct.includes('application/json')) {
    const data = await resp.json();
    const text = data.answer || '';
    onChunk(text, { done: true, backendCached: !!data.cached });
    return { fullText: text, backendCached: !!data.cached };
  }

  if (resp.body && typeof resp.body.getReader === 'function') {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      onChunk(chunk, { done: false });
    }
    const backendCached = resp.headers.get('x-cached') === 'true' || false;
    onChunk('', { done: true, backendCached });
    return { fullText: full, backendCached };
  }

  const text = await resp.text();
  onChunk(text, { done: true, backendCached: resp.headers.get('x-cached') === 'true' });
  return { fullText: text, backendCached: resp.headers.get('x-cached') === 'true' };
}

// -------------------- Universal Answer Display Function --------------------
async function displayAnswer(targetElement, questionId, questionText, opts = { forceRefresh: false }) {
  const TTL = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  const regenCount = await getGlobalRegenerateCount(questionId);
  const regenRemaining = REGENERATE_LIMIT - regenCount;

  // Check global cache first
  if (!opts.forceRefresh) {
    const globalCache = await getGlobalCache(questionId);
    if (globalCache && globalCache.answer) {
      const subjectInfo = getSubjectInfo(questionId);
      const isLimitReached = regenCount >= REGENERATE_LIMIT;
      
      targetElement.innerHTML = `
       <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid #0ea5e9; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
          <div style="margin-bottom: 0.5rem;">
            <span style="font-size: 12px; background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 999px;">
              Global cached (${subjectInfo.name})
            </span>
            <span style="font-size: 12px; color: #6b7280; margin-left: 8px;">
              Saved ${timeAgo(globalCache.metadata?.timestamp || Date.now())}
            </span>
          </div>
          ${formatAnswerAsHtml(globalCache.answer)}
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button onclick="copyText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Copy</button>
            <button onclick="downloadText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Download</button>
            <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                    ${isLimitReached ? 'disabled' : ''} 
                    style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: ${isLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isLimitReached ? '0.5' : '1'};"
                    title="${isLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${regenCount}/${REGENERATE_LIMIT}`}">
              ${isLimitReached ? 'Limit Reached' : `Regenerate (${regenRemaining} left)`}
            </button>
          </div>
        </div>
      `;
      
      const localCache = loadLocalCache();
      localCache[questionId] = {
        answer: globalCache.answer,
        ts: Date.now(),
        backendCached: true,
        subject: subjectInfo.name,
        questionText: questionText
      };
      saveLocalCache(localCache);
      
      if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([targetElement]).catch(console.warn);
      }
      return;
    }
  }

  // Show loading
  const subjectInfo = getSubjectInfo(questionId);
  const abortController = new AbortController();
  
  targetElement.innerHTML = `
    <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f0f9ff; border-left: 4px solid #0ea5e9;">
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
          <div style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #0ea5e9; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;"></div>
          <span style="font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis;">Generating ${subjectInfo.name} solution...</span>
        </div>
        <button onclick="window.cancelGeneration_${questionId.replace(/[^a-zA-Z0-9]/g, '_')}()" style="padding: 0.3rem 0.6rem; border-radius: 4px; border: 1px solid #ccc; background: #fff; cursor: pointer; flex-shrink: 0; font-size: 0.85rem;">Cancel</button>
      </div>
      <div id="streaming-${questionId}" style="margin-top: 1rem;"></div>
    </div>
  `;

  window[`cancelGeneration_${questionId.replace(/[^a-zA-Z0-9]/g, '_')}`] = () => {
    abortController.abort();
    targetElement.innerHTML = '<p style="color: #dc2626; padding: 1rem;">Generation cancelled</p>';
  };

  const streamingDiv = document.getElementById(`streaming-${questionId}`);

  try {
    const fullQuery = createSubjectPrompt(subjectInfo, questionText);
    let streamed = '';
    let finalBackendCached = false;

    await fetchAnswerStream(fullQuery, (chunk, meta) => {
      if (meta.done && chunk === '') {
        finalBackendCached = !!meta.backendCached;
        
        setGlobalCache(questionId, streamed, {
          subject: subjectInfo.name,
          questionText: questionText,
          backendCached: finalBackendCached
        });
        
        getGlobalRegenerateCount(questionId).then(finalRegenCount => {
          const finalRegenRemaining = REGENERATE_LIMIT - finalRegenCount;
          const isFinalLimitReached = finalRegenCount >= REGENERATE_LIMIT;
          
          targetElement.innerHTML = `
            <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid #0ea5e9; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
              <div style="margin-bottom: 0.5rem;">
                <span style="font-size: 12px; background: ${finalBackendCached ? '#dcfce7' : '#eef2ff'}; color: ${finalBackendCached ? '#15803d' : '#4338ca'}; padding: 4px 8px; border-radius: 999px;">
                  ${finalBackendCached ? 'Server cached' : 'Fresh answer'} (${subjectInfo.name})
                </span>
              </div>
              ${formatAnswerAsHtml(streamed)}
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button onclick="copyText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Copy</button>
                <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                        ${isFinalLimitReached ? 'disabled' : ''} 
                        style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: ${isFinalLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isFinalLimitReached ? '0.5' : '1'};"
                        title="${isFinalLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${finalRegenCount}/${REGENERATE_LIMIT}`}">
                  ${isFinalLimitReached ? 'Limit Reached' : `Regenerate (${finalRegenRemaining} left)`}
                </button>
              </div>
            </div>
          `;
          
          const localCache = loadLocalCache();
          localCache[questionId] = { 
            answer: streamed, 
            ts: Date.now(), 
            backendCached: finalBackendCached,
            subject: subjectInfo.name,
            questionText: questionText
          };
          saveLocalCache(localCache);
          
          if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([targetElement]).catch(console.warn);
          }
        });
        return;
      }

      streamed += chunk;
      if (streamingDiv) {
        streamingDiv.innerHTML = formatAnswerAsHtml(streamed) + '<span style="display: inline-block; width: 8px; background: #111; margin-left: 2px; height: 1em; animation: blink 1s steps(2) infinite;">|</span>';
      }

      if (meta.done) {
         // Handle immediate completion logic (same as above block)
         finalBackendCached = !!meta.backendCached;
         setGlobalCache(questionId, streamed, { 
             subject: subjectInfo.name, 
             questionText: questionText, 
             backendCached: finalBackendCached 
         });
         
         getGlobalRegenerateCount(questionId).then(immRegenCount => {
             const immRegenRemaining = REGENERATE_LIMIT - immRegenCount;
             const isImmLimitReached = immRegenCount >= REGENERATE_LIMIT;
             
             targetElement.innerHTML = `
                <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid #0ea5e9; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
                  ${formatAnswerAsHtml(streamed)}
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button onclick="copyText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Copy</button>
                    <button onclick="downloadText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Download</button>
                    <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                            ${isImmLimitReached ? 'disabled' : ''} 
                            style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: ${isImmLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isImmLimitReached ? '0.5' : '1'};"
                            title="${isImmLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${immRegenCount}/${REGENERATE_LIMIT}`}">
                      ${isImmLimitReached ? 'Limit Reached' : `Regenerate (${immRegenRemaining} left)`}
                    </button>
                  </div>
                </div>
             `;
             
             const localCache = loadLocalCache();
             localCache[questionId] = { 
                answer: streamed, 
                ts: Date.now(), 
                backendCached: finalBackendCached,
                subject: subjectInfo.name,
                questionText: questionText
             };
             saveLocalCache(localCache);
             
             if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise([targetElement]).catch(console.warn);
             }
         });
      }
    }, abortController.signal);
    
  } catch (err) {
    if (err.name === 'AbortError') {
      targetElement.innerHTML = `
        <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #fef2f2; border-left: 4px solid #f59e0b;">
          <p style="color: #d97706; margin: 0;">Generation cancelled</p>
        </div>
      `;
    } else {
      targetElement.innerHTML = `
        <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #fef2f2; border-left: 4px solid #ef4444;">
          <p style="color: #dc2626; margin: 0;">Error: ${err.message}</p>
        </div>
      `;
    }
  }
}

// -------------------- Universal Main Functions --------------------

// FOR STRUCTURE WITH EXISTING data-question ATTRIBUTES
async function showAnswer(button, questionId, opts = { forceRefresh: false }) {
  const answerBox = button.nextElementSibling;
  if (!answerBox) return;

  const questionContainer = button.closest('.question');
  const partChar = questionId.slice(-1); 
  const partIndex = (partChar >= 'a' && partChar <= 'z') ? partChar.charCodeAt(0) - 'a'.charCodeAt(0) : 0;

  const questionText = extractQuestionText(questionContainer, partIndex);

  if (!questionText) {
    console.error("Could not extract question text for ID:", questionId);
    answerBox.innerHTML = "<p style='color:red'>Error: Could not find the question text. Please refresh the page.</p>";
    answerBox.style.display = 'block';
    return;
  }
  
  answerBox.style.display = 'block';
  await displayAnswer(answerBox, questionId, questionText, opts);
}

// For structures without data-question
function enableQuestionAnswering() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes blink { 50% { opacity: 0; } }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.question').forEach(questionContainer => {
    const questionIds = generateQuestionId(questionContainer);
    
    const answerPs = Array.from(questionContainer.querySelectorAll('p[style*="margin-left"], p:not([style])')).filter(p => 
      p.innerHTML.includes('Answer') && p.innerHTML.includes('To be posted here')
    );
    
    answerPs.forEach((answerP, index) => {
      if (index < questionIds.length) {
        const questionId = questionIds[index];
        const questionText = extractQuestionText(questionContainer, index);
        
        answerP.innerHTML = `
          <strong>${answerP.innerHTML.split(':')[0]}:</strong>
          <button onclick="handleAnswerClick('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                  style="margin-left: 10px; padding: 0.5rem 1rem; background: #0ea5e9; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Generate Answer with AI
          </button>
          <div class="ai-answer-container"></div>
        `;
      }
    });
  });
}

// Global function to handle answer button clicks
window.handleAnswerClick = async function(questionId, questionText, button) {
  const container = button.nextElementSibling;
  button.style.display = 'none';
  await displayAnswer(container, questionId, questionText);
};

// Utility functions for buttons
window.copyText = function(questionId) {
  const localCache = loadLocalCache();
  if (localCache[questionId]) {
    navigator.clipboard.writeText(localCache[questionId].answer).then(() => {
      alert('Answer copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  }
};

window.downloadText = function(questionId) {
  const localCache = loadLocalCache();
  if (localCache[questionId]) {
    const blob = new Blob([localCache[questionId].answer], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${questionId}-solution.txt`;
    a.click();
  }
};

window.regenerateAnswer = async function(questionId, questionText, button) {
  const currentCount = await getGlobalRegenerateCount(questionId);
  
  if (currentCount >= REGENERATE_LIMIT) {
    alert(`Regenerate limit reached for this question (${REGENERATE_LIMIT}/${REGENERATE_LIMIT}). The cached answer is optimized for your exam preparation.`);
    return;
  }
  
  const remaining = REGENERATE_LIMIT - currentCount;
  const confirmMsg = `Regenerate this answer?\n\n• Global regenerations used: ${currentCount}/${REGENERATE_LIMIT}\n• Remaining: ${remaining}`;
  
  if (!confirm(confirmMsg)) {
    return;
  }
  
  // Increment global regenerate count
  await incrementGlobalRegenerateCount(questionId);
  
  // Clear local cache and force global refresh
  const localCache = loadLocalCache();
  delete localCache[questionId];
  saveLocalCache(localCache);
  
  const container = button.closest('div').parentElement;
  await displayAnswer(container, questionId, questionText, { forceRefresh: true });
};

// -------------------- Initialization --------------------
document.addEventListener('DOMContentLoaded', function() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  
  const hasDataQuestions = document.querySelector('[data-question]');
  
  if (!hasDataQuestions) {
    enableQuestionAnswering();
    console.log('Enabled universal question answering system');
  } else {
    console.log('Using existing data-question structure');
  }
  
  console.log('RGPV Universal System Ready - Global Cache Enabled');
});

// Debug utilities
window.RGPVSystem = {
  clearLocalCache: () => {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    console.log('Local cache cleared');
  },
  showLocalCacheStats: () => {
    const cache = loadLocalCache();
    console.log('Total locally cached:', Object.keys(cache).length);
    Object.keys(cache).forEach(key => {
      const item = cache[key];
      console.log(`${key}: ${item.subject} (${timeAgo(item.ts)} ago)`);
    });
  },
  async checkGlobalRegenerateCount(questionId) {
    const count = await getGlobalRegenerateCount(questionId);
    console.log(`Question ${questionId}: ${count}/${REGENERATE_LIMIT} regenerations used globally`);
  }
};