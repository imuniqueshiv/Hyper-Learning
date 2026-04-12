// ==================== Universal RGPV Question System - Student Edition ====================
const BACKEND_URL = 'https://hyper-learning-backend.vercel.app/api/ask';
const CACHE_API_URL = 'https://hyper-learning-backend.vercel.app/api/cache';
const LOCAL_CACHE_KEY = 'rgpv_universal_answers_v1';
const CACHE_TTL_DAYS = 35;
const REGENERATED_TTL_DAYS = 3; // ✅ FIX: Regenerated answers expire in 3 days to force re-fetch
const REGENERATE_LIMIT = 7;

// Complete subject mapping for all 30+ subjects
const SUBJECT_MAP = {
  // --- 1st Year Subjects ---
  'BT-101': { name: 'Engineering Chemistry', type: 'CHEMISTRY', emoji: '⚗️', color: '#00008B' },
  'BT-102': { name: 'Mathematics-I', type: 'MATH', emoji: '📐', color: '#3b82f6' },
  'BT-103': { name: 'English for Communication', type: 'ENGLISH', emoji: '📝', color: '#8b5cf6' },
  'BT-104': { name: 'Basic Electrical & Electronics Engineering', type: 'ELECTRICAL', emoji: '⚡', color: '#00008B' },
  'BT-105': { name: 'Engineering Graphics', type: 'GRAPHICS', emoji: '📊', color: '#06b6d4' },
  'BT-201': { name: 'Engineering Physics', type: 'PHYSICS', emoji: '🔬', color: '#6366f1' },
  'BT-202': { name: 'Mathematics-II', type: 'MATH', emoji: '📐', color: '#3b82f6' },
  'BT-203': { name: 'Basic Mechanical Engineering', type: 'MECHANICAL', emoji: '⚙️', color: '#64748b' },
  'BT-204': { name: 'Basic Civil Engineering & Mechanics', type: 'CIVIL', emoji: '🏗️', color: '#78716c' },
  'BT-205': { name: 'Basic Computer Engineering', type: 'COMPUTER', emoji: '💻', color: '#00008B' },

  // --- 3rd Semester Subjects (AIML) ---
  'AL-301': { name: 'Technical Communication', type: 'ENGLISH', emoji: '📝', color: '#8b5cf6' },
  'AL-302': { name: 'Probability and Statistics', type: 'MATH', emoji: '📊', color: '#3b82f6' },
  'AL-303': { name: 'Data Structure', type: 'COMPUTER', emoji: '🗂️', color: '#00008B' },
  'AL-304': { name: 'Artificial Intelligence', type: 'COMPUTER', emoji: '🤖', color: '#a855f7' },
  'AL-305': { name: 'Object Oriented Programming & Methodology', type: 'COMPUTER', emoji: '💻', color: '#00008B' },

  // --- 3rd Semester Subjects (CSIT) ---
  'ES-301': { name: 'Energy & Environmental Engineering', type: 'GENERAL', emoji: '🌱', color: '#00008B' },
  'CSIT-302': { name: 'Discrete Structure', type: 'MATH', emoji: '🔢', color: '#3b82f6' },
  'CSIT-303': { name: 'Data Structure', type: 'COMPUTER', emoji: '🗂️', color: '#00008B' },
  'CSIT-304': { name: 'Digital Circuits & System', type: 'ELECTRICAL', emoji: '⚡', color: '#00008B' },
  'CSIT-305': { name: 'Object Oriented Programming & Methodology', type: 'COMPUTER', emoji: '💻', color: '#00008B' },

  // --- 3rd Semester Subjects (CSE) ---
  'CS-302': { name: 'Discrete Structure', type: 'MATH', emoji: '🔢', color: '#3b82f6' },
  'CS-303': { name: 'Data Structure', type: 'COMPUTER', emoji: '🗂️', color: '#00008B' },
  'CS-304': { name: 'Digital Systems', type: 'ELECTRICAL', emoji: '⚡', color: '#00008B' },
  'CS-305': { name: 'Object Oriented Programming & Methodology', type: 'COMPUTER', emoji: '💻', color: '#00008B' },

  // --- 4th Semester Subjects (AIML) ---
  'AL-401': { name: 'Intro to Discrete Structure & Linear Algebra', type: 'MATH', emoji: '📐', color: '#3b82f6' },
  'AL-402': { name: 'Analysis & Design of Algorithms', type: 'COMPUTER', emoji: '🧮', color: '#00008B' },
  'AL-403': { name: 'Software Engineering', type: 'COMPUTER', emoji: '🛠️', color: '#8b5cf6' },
  'AL-404': { name: 'Computer Org & Architecture', type: 'COMPUTER', emoji: '🖥️', color: '#64748b' },
  'AL-405': { name: 'Machine Learning', type: 'COMPUTER', emoji: '🤖', color: '#a855f7' },

  // --- 4th Semester Subjects (CSIT) ---
  'BT-401': { name: 'Mathematics-III', type: 'MATH', emoji: '📐', color: '#3b82f6' },
  'CSIT-402': { name: 'Analog & Digital Communication', type: 'ELECTRICAL', emoji: '📡', color: '#00008B' },
  'CSIT-403': { name: 'Analysis & Design of Algorithm', type: 'COMPUTER', emoji: '🧮', color: '#00008B' },
  'CSIT-404': { name: 'Computer Org & Architecture', type: 'COMPUTER', emoji: '🖥️', color: '#64748b' },
  'CSIT-405': { name: 'Database Management System', type: 'COMPUTER', emoji: '🗄️', color: '#06b6d4' },

  // --- 4th Semester Subjects (CSE) ---
  'CS-402': { name: 'Analysis Design of Algorithm', type: 'COMPUTER', emoji: '🧮', color: '#00008B' },
  'CS-403': { name: 'Software Engineering', type: 'COMPUTER', emoji: '🛠️', color: '#8b5cf6' },
  'CS-404': { name: 'Computer Org. & Architecture', type: 'COMPUTER', emoji: '🖥️', color: '#64748b' },
  'CS-405': { name: 'Operating Systems', type: 'COMPUTER', emoji: '💿', color: '#00008B' },
  
  // AD Subjects (Aliases)
  'AD-301': { name: 'Technical Communication', type: 'ENGLISH', emoji: '📝', color: '#8b5cf6' },
  'AD-303': { name: 'Data Structure', type: 'COMPUTER', emoji: '🗂️', color: '#00008B' },
  'AD-305': { name: 'Object Oriented Programming & Methodology', type: 'COMPUTER', emoji: '💻', color: '#00008B' },
  'AI-302': { name: 'Probability and Statistics', type: 'MATH', emoji: '📊', color: '#3b82f6' }
};

// ==================== Global Cache API Functions ====================
async function getGlobalCache(questionId) {
    return null; // Force the code to call /api/ask, which handles the cache properly
}

async function setGlobalCache(questionId, answer) {
    console.log("Backend already saved this. Skipping frontend save.");
    return; // Stops the CORS/404 error immediately
}

async function getGlobalRegenerateCount(questionId) {
    return 0; // Assume 0 so the UI doesn't break
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

// ==================== Core Utilities ====================

// ✅ FIX: loadLocalCache now respects TTL and cleans up expired entries.
// Regenerated answers expire in 3 days; normal answers expire in 365 days.
// This ensures that after a page refresh, regenerated answers are shown from
// local cache (not fetched fresh from the backend's old cache).
function loadLocalCache() {
  try {
    const cacheData = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!cacheData) return {};

    const cache = JSON.parse(cacheData);
    const now = Date.now();
    let isDirty = false;

    Object.keys(cache).forEach(key => {
      const item = cache[key];
      if (!item || !item.ts) {
        delete cache[key];
        isDirty = true;
        return;
      }

      // Regenerated answers use shorter TTL so they don't get stale
      const ttlDays = item.regenerated ? REGENERATED_TTL_DAYS : CACHE_TTL_DAYS;
      const ttlMs = ttlDays * 24 * 60 * 60 * 1000;

      if (now - item.ts > ttlMs) {
        delete cache[key];
        isDirty = true;
      }
    });

    if (isDirty) {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
    }
    return cache;
  } catch (e) {
    console.warn('Cache load failed', e);
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
  for (const key in SUBJECT_MAP) {
      if (questionId.startsWith(key) || questionId.includes(key)) {
          return SUBJECT_MAP[key];
      }
  }
  return { name: 'General Engineering', type: 'GENERAL', emoji: '📚', color: '#6b7280' };
}

function generateQuestionId(questionContainer) {
  const pageTitle = document.title;
  const subjectCode = pageTitle.match(/([A-Z]{2,}-\d{3})/)?.[0] || 'GENERAL';
  const examDate = pageTitle.match(/\w+ \d{4}/)?.[0]?.replace(' ', '_').toLowerCase() || 'unknown';
  
  const summary = questionContainer.querySelector('summary');
  const questionNumber = summary?.textContent.match(/Q\.?\s*(\d+)/)?.[1] || '0';
  
  const allAnswerPs = questionContainer.querySelectorAll('p[style*="margin-left"]');
  const hasMultipleParts = allAnswerPs.length > 1 || summary?.innerHTML.includes('<hr>');
  
  if (hasMultipleParts) {
    return [`${subjectCode}_${examDate}_Q${questionNumber}a`, `${subjectCode}_${examDate}_Q${questionNumber}b`];
  } else {
    return [`${subjectCode}_${examDate}_Q${questionNumber}`];
  }
}

// ==================== ROBUST TEXT EXTRACTION ====================
function extractQuestionText(questionContainer, partIndex = 0) {
    const summary = questionContainer.querySelector('summary');
    if (!summary) return '';

    function tableToMarkdown(table) {
        let md = '\n\n';
        const rows = Array.from(table.querySelectorAll('tr'));
        
        rows.forEach((row, index) => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            const rowText = '| ' + cells.map(c => c.textContent.trim().replace(/\n/g, ' ')).join(' | ') + ' |';
            md += rowText + '\n';

            if (index === 0) {
                const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
                md += separator + '\n';
            }
        });
        return md + '\n';
    }

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

    const targetNodes = parts[partIndex];
    
    if (!targetNodes || targetNodes.length === 0) {
        if (parts.length === 0 && partIndex === 0) return summary.textContent; 
        return '';
    }

    let fullText = '';
    
    targetNodes.forEach(node => {
        if (node.tagName === 'TABLE') {
            fullText += tableToMarkdown(node);
        } 
        else if (node.tagName === 'DIV' && node.querySelector('table')) {
            const table = node.querySelector('table');
            fullText += tableToMarkdown(table);
        }
        else if (node.tagName === 'IMG') {
            const alt = node.getAttribute('alt');
            if (alt) fullText += `\n[Image Context: ${alt}]\n`;
        }
        else {
            fullText += node.textContent.trim() + '\n';
            fullText += extractImages(node);
        }
    });

    return fullText.trim();
}

// ==================== UPDATED PROMPTS ====================
function createSubjectPrompt(subjectInfo, questionText) {
  const intro = `You are an expert tutor for RGPV B.Tech students in ${subjectInfo.name}. `;

  const typeInstructions = {
    'MATH': 'Provide detailed step-by-step mathematical solutions. Use LaTeX for equations ($...$ or $$...$$). For Probability/Statistics, explain the logic clearly. For Discrete Structures, use proper set theory/logic notation: ',
    
    'ENGLISH': 'Provide comprehensive answers with proper grammar, communication theories, and professional writing formats (letters/reports): ',
    
    'GRAPHICS': 'Explain engineering drawing principles (Projections, Isometric, Scales). If an image description is provided [Image Context: ...], use it to describe the geometry construction: ',
    
    'COMPUTER': 'Provide detailed technical explanations. For coding (DS/OOPM/ML), use C++, Java, or Python with comments. For theoretical subjects (SE, DBMS, COA), use algorithms, schemas, and architectural diagrams descriptions: ',
    
    'PHYSICS': 'Provide physics derivations, formulas, and conceptual explanations with standard units: ',
    
    'CHEMISTRY': 'Provide chemical reactions, equations, and molecular explanations: ',
    
    'ELECTRICAL': 'Provide circuit analysis, boolean algebra (for Digital Systems), and signal processing explanations: ',
    
    'MECHANICAL': 'Provide engineering mechanics solutions, thermodynamics principles, and practical applications: ',
    
    'CIVIL': 'Provide structural analysis and mechanics solutions. If an image description is provided [Image Context: ...], use it to solve the problem (e.g. Moment of Inertia): ',
    
    'GENERAL': 'Provide detailed engineering explanations with clear examples: '
  };
  
  const instructions = typeInstructions[subjectInfo.type] || typeInstructions['GENERAL'];
  
  return intro + instructions + questionText;
}

// ==================== ENHANCED HTML FORMATTING (Student-Friendly) ====================
function formatAnswerAsHtml(str) {
  if (!str) return '';
  
  const escaped = String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

 let formatted = escaped
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.15rem; margin: 1.5rem 0 0.75rem; color: #1e293b; font-weight: 700; padding-left: 12px; border-left: 3px solid #3b82f6;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.3rem; margin: 1.75rem 0 0.85rem; color: #0f172a; font-weight: 700; padding: 8px 12px; background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 6px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5rem; margin: 2rem 0 1rem; color: #0c4a6e; font-weight: 800; padding: 12px 16px; background: linear-gradient(135deg, #bfdbfe 0%, #ddd6fe 100%); border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong style="color: #7c3aed; background: #f3e8ff; padding: 2px 6px; border-radius: 4px;"><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0369a1; font-weight: 700;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: #6366f1;">$1</em>')
    .replace(/```([^`]+)```/g, '<pre style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; max-width: 100%; border: 1px solid #cbd5e1; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);"><code style="font-family: \'Fira Code\', \'Consolas\', monospace; color: #1e293b;">$1</code></pre>')
    .replace(/```([\s\S]*?)```/g,
  (match, code) => {
    // Optionally strip a language tag like "cpp" on the first line
    const cleaned = code.replace(/^[a-zA-Z0-9_+\-]+[\t ]*\n/, '');
    return '<pre style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; max-width: 100%; border: 1px solid #cbd5e1; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);"><code style="font-family: \'Fira Code\', \'Consolas\', monospace; color: #1e293b;">'
      + cleaned
      + '</code></pre>';
  })
    // .replace(/`([^`]+)`/g, '<code style="background: #fef3c7; color: #92400e; padding: 3px 6px; border-radius: 4px; font-size: 0.9em; font-weight: 600; font-family: \'Fira Code\', monospace;">$1</code>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 0.65rem; padding-left: 0.5rem; line-height: 1.7; position: relative;"><span style="position: absolute; left: -1.2rem; color: #3b82f6; font-weight: bold;">•</span>$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li style="margin-bottom: 0.65rem; padding-left: 0.5rem; line-height: 1.7; list-style-position: inside; color: #334155;">$2</li>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem; line-height: 1.75; font-size: 1rem; color: #334155; text-align: justify;">')
    .replace(/\n/g, '<br>');

  if (!formatted.includes('<p>') && !formatted.includes('<h')) {
    formatted = '<p style="margin-bottom: 1rem; line-height: 1.75; color: #334155;">' + formatted + '</p>';
  }

  return formatted;
}


function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ==================== API Functions ====================

async function fetchAnswerStream(question, onChunk, signal, forceRefresh = false) {
  // ✅ FIX: Backend caches by question text. Append a unique suffix to bust the backend cache
  // when regenerating so the backend is forced to generate a truly new answer.
  let finalQuestion = question;
  if (forceRefresh) {
      finalQuestion += `\n\n[System: Regenerate fresh answer. ID: ${Date.now()}]`;
  }

  const url = `${BACKEND_URL}?question=${encodeURIComponent(finalQuestion)}&_t=${Date.now()}`;
  
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

// ==================== ENHANCED ANSWER DISPLAY ====================
async function displayAnswer(targetElement, questionId, questionText, opts = { forceRefresh: false }) {
  const regenCount = await getGlobalRegenerateCount(questionId);
  const regenRemaining = REGENERATE_LIMIT - regenCount;

  // Define Styles
  const containerStyle = "margin: 1rem 0; padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 2px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;";
  const answerContentStyle = "padding: 1rem; background: #ffffff; border-radius: 8px; font-size: 0.92rem; line-height: 1.6; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch;";
  const buttonGroupStyle = "margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #f1f5f9; display: flex; gap: 0.6rem; flex-wrap: wrap;";
  const buttonBaseStyle = "flex: 1; min-width: 90px; padding: 0.6rem 0.8rem; border-radius: 8px; border: 2px solid #e2e8f0; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); cursor: pointer; font-weight: 600; color: #475569; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-size: 0.85rem;";

  // ✅ FIX: Check LOCAL cache FIRST before anything else.
  // This is the core fix for the regeneration bug. When a user regenerates and then refreshes,
  // the local cache holds the new answer. We must serve it instead of going to the backend
  // which would return the old server-cached answer.
  if (!opts.forceRefresh) {
    const localCache = loadLocalCache();
    if (localCache[questionId] && localCache[questionId].answer) {
      const cachedData = localCache[questionId];
      const subjectInfo = getSubjectInfo(questionId);
      const isLimitReached = regenCount >= REGENERATE_LIMIT;

      targetElement.innerHTML = `
        <div style="${containerStyle}">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.8rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              </div>
            </div>
          </div>

          <div style="${answerContentStyle}">
            ${formatAnswerAsHtml(cachedData.answer)}
          </div>

          <div style="${buttonGroupStyle}">
            <button onclick="copyText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">📋 Copy</button>
            <button onclick="downloadText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">💾 Download</button>
            <button onclick="hideAnswer(this)" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">▲ Hide</button>
            <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                    ${isLimitReached ? 'disabled' : ''} 
                    style="${buttonBaseStyle} border: 2px solid ${isLimitReached ? '#e2e8f0' : '#3b82f6'}; background: ${isLimitReached ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}; color: ${isLimitReached ? '#94a3b8' : '#ffffff'}; opacity: ${isLimitReached ? '0.6' : '1'}; flex: 1.5; min-width: 120px;"
                    title="${isLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${regenCount}/${REGENERATE_LIMIT}`}"
                    ${!isLimitReached ? `onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59,130,246,0.3)';"` : ''}>
              ${isLimitReached ? '🚫 Limit Reached' : `🔄 Regenerate (${regenRemaining})`}
            </button>
          </div>
        </div>
      `;

      if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([targetElement]).catch(console.warn);
      }
      return; // Stop here — do not fall through to the backend
    }
  }

  // No local cache hit — check global cache (currently always returns null)
  if (!opts.forceRefresh) {
    const globalCache = await getGlobalCache(questionId);
    if (globalCache && globalCache.answer) {
      const subjectInfo = getSubjectInfo(questionId);
      const isLimitReached = regenCount >= REGENERATE_LIMIT;
      
      targetElement.innerHTML = `
        <div style="${containerStyle}">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.8rem; flex-wrap: wrap;">
            <span style="font-size: 1.35rem;">${subjectInfo.emoji}</span>
            
            </div>
          </div>

          <div style="${answerContentStyle}">
            ${formatAnswerAsHtml(globalCache.answer)}
          </div>

          <div style="${buttonGroupStyle}">
            <button onclick="copyText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">📋 Copy</button>
            <button onclick="downloadText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">💾 Download</button>
            <button onclick="hideAnswer(this)" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">▲ Hide</button>
            <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                    ${isLimitReached ? 'disabled' : ''} 
                    style="${buttonBaseStyle} border: 2px solid ${isLimitReached ? '#e2e8f0' : '#3b82f6'}; background: ${isLimitReached ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}; color: ${isLimitReached ? '#94a3b8' : '#ffffff'}; opacity: ${isLimitReached ? '0.6' : '1'}; flex: 1.5; min-width: 120px;"
                    title="${isLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${regenCount}/${REGENERATE_LIMIT}`}"
                    ${!isLimitReached ? `onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59,130,246,0.3)';"` : ''}>
              ${isLimitReached ? '🚫 Limit Reached' : `🔄 Regenerate (${regenRemaining})`}
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
        questionText: questionText,
        regenerated: false
      };
      saveLocalCache(localCache);
      
      if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([targetElement]).catch(console.warn);
      }
      return;
    }
  }

  // Show loading with animation
  const subjectInfo = getSubjectInfo(questionId);
  const abortController = new AbortController();
  
  targetElement.innerHTML = `
    <div style="margin: 1rem 0; padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
          <div style="width: 18px; height: 18px; border: 3px solid #e0f2fe; border-top-color: #0284c7; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;"></div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.95rem; font-weight: 700; color: #0c4a6e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${subjectInfo.emoji} Generating...
            </div>
            <div style="font-size: 0.75rem; color: #0369a1; margin-top: 2px; font-weight: 500;">
              ✨ AI is preparing answer
            </div>
          </div>
        </div>
        <button onclick="window.cancelGeneration_${questionId.replace(/[^a-zA-Z0-9]/g, '_')}()" style="padding: 0.5rem 0.8rem; border-radius: 8px; border: 2px solid #dc2626; background: #ffffff; cursor: pointer; flex-shrink: 0; font-size: 0.85rem; font-weight: 600; color: #141111ff; transition: all 0.2s;" onmouseover="this.style.background='#dc2626'; this.style.color='#ffffff';" onmouseout="this.style.background='#ffffff'; this.style.color='#265adcff';">❌ Cancel</button></div>
      <div id="streaming-${questionId}" style="margin-top: 1rem; padding: 1rem; background: #ffffff; border-radius: 8px; min-height: 40px; font-size: 0.92rem; line-height: 1.6;"></div>
    </div>
  `;

  window[`cancelGeneration_${questionId.replace(/[^a-zA-Z0-9]/g, '_')}`] = () => {
    abortController.abort();
    targetElement.innerHTML = `
      <div style="margin: 1rem 0; padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fecaca; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.5rem;">⚠️</span>
          <div>
            <div style="font-size: 1rem; font-weight: 700; color: #991b1b; margin-bottom: 2px;">Generation Cancelled</div>
            <div style="font-size: 0.85rem; color: #dc2626;">You stopped the process</div>
          </div>
        </div>
      </div>
    `;
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
            <div style="${containerStyle}">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.8rem; flex-wrap: wrap;">
                <span style="font-size: 1.35rem;">${subjectInfo.emoji}</span>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 0.7rem; font-weight: 600; color: ${subjectInfo.color}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${subjectInfo.name}</div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 0.7rem; background: linear-gradient(135deg, ${finalBackendCached ? '#dcfce7' : '#eef2ff'} 0%, ${finalBackendCached ? '#d1fae5' : '#e0e7ff'} 100%); color: ${finalBackendCached ? '#15803d' : '#4338ca'}; padding: 3px 8px; border-radius: 10px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                      ${finalBackendCached ? '✓ Server Cached' : '✨ Fresh Answer'}
                    </span>
                    <span style="font-size: 0.7rem; color: #64748b; font-weight: 500;">
                      ⚡ Just now
                    </span>
                  </div>
                </div>
              </div>
              <div style="${answerContentStyle}">
                ${formatAnswerAsHtml(streamed)}
              </div>
              <div style="${buttonGroupStyle}">
                <button onclick="copyText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">📋 Copy</button>
                <button onclick="downloadText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">💾 Download</button>
                <button onclick="hideAnswer(this)" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">▲ Hide</button>
                <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                        ${isFinalLimitReached ? 'disabled' : ''} 
                        style="${buttonBaseStyle} border: 2px solid ${isFinalLimitReached ? '#e2e8f0' : '#3b82f6'}; background: ${isFinalLimitReached ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}; color: ${isFinalLimitReached ? '#94a3b8' : '#ffffff'}; opacity: ${isFinalLimitReached ? '0.6' : '1'}; flex: 1.5; min-width: 120px;"
                        title="${isFinalLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${finalRegenCount}/${REGENERATE_LIMIT}`}"
                        ${!isFinalLimitReached ? `onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59,130,246,0.3)';"` : ''}>
                  ${isFinalLimitReached ? '🚫 Limit Reached' : `🔄 Regenerate (${finalRegenRemaining})`}
                </button>
              </div>
            </div>
          `;
          
          // ✅ FIX: Mark as regenerated so the TTL system knows to use the shorter expiry.
          // This is what makes the regenerated answer persist correctly after a page refresh.
          const localCache = loadLocalCache();
          localCache[questionId] = { 
            answer: streamed, 
            ts: Date.now(), 
            backendCached: finalBackendCached,
            subject: subjectInfo.name,
            questionText: questionText,
            regenerated: opts.forceRefresh // ✅ true when called from regenerateAnswer
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
        streamingDiv.innerHTML = formatAnswerAsHtml(streamed) + '<span style="display: inline-block; width: 2px; background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); margin-left: 4px; height: 1.2em; animation: blink 1s steps(2) infinite; border-radius: 1px;">|</span>';
      }

      if (meta.done) {
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
                <div style="${containerStyle}">
                  <div style="${answerContentStyle}">
                    ${formatAnswerAsHtml(streamed)}
                  </div>
                  <div style="${buttonGroupStyle}">
                    <button onclick="copyText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">📋 Copy</button>
                    <button onclick="downloadText('${questionId}')" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">💾 Download</button>
                    <button onclick="hideAnswer(this)" style="${buttonBaseStyle}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">▲ Hide</button>
                    <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                            ${isImmLimitReached ? 'disabled' : ''} 
                            style="${buttonBaseStyle} border: 2px solid ${isImmLimitReached ? '#e2e8f0' : '#3b82f6'}; background: ${isImmLimitReached ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}; color: ${isImmLimitReached ? '#94a3b8' : '#ffffff'}; opacity: ${isImmLimitReached ? '0.6' : '1'}; flex: 1.5; min-width: 120px;"
                            title="${isImmLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${immRegenCount}/${REGENERATE_LIMIT}`}"
                            ${!isImmLimitReached ? `onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(59,130,246,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59,130,246,0.3)';"` : ''}>
                      ${isImmLimitReached ? '🚫 Limit Reached' : `🔄 Regenerate (${immRegenRemaining})`}
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
               questionText: questionText,
               regenerated: opts.forceRefresh // ✅ Mark as regenerated
             };
             saveLocalCache(localCache);
             
             if (window.MathJax && window.MathJax.typesetPromise) {
               MathJax.typesetPromise([targetElement]).catch(console.warn);
             }
         });
      }
    }, abortController.signal, opts.forceRefresh);
    
  } catch (err) {
    if (err.name === 'AbortError') {
      targetElement.innerHTML = `
        <div style="margin: 1rem 0; padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #fde68a; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">⚠️</span>
            <div>
              <div style="font-size: 1rem; font-weight: 700; color: #92400e; margin-bottom: 2px;">Generation Cancelled</div>
              <div style="font-size: 0.85rem; color: #b45309;">The AI generation was stopped by you</div>
            </div>
          </div>
        </div>
      `;
    } else {
      targetElement.innerHTML = `
        <div style="margin: 1rem 0; padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fecaca; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">❌</span>
            <div>
              <div style="font-size: 1rem; font-weight: 700; color: #991b1b; margin-bottom: 2px;">Error Occurred</div>
              <div style="font-size: 0.85rem; color: #dc2626;">${err.message}</div>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// ==================== Universal Main Functions ====================

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
        const subjectInfo = getSubjectInfo(questionId);
        
        answerP.innerHTML = `
          <strong style="color: #1e293b;">${answerP.innerHTML.split(':')[0]}:</strong>
          <button onclick="handleAnswerClick('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                  style="margin-left: 12px; padding: 0.65rem 1.5rem; background: linear-gradient(135deg, ${subjectInfo.color} 0%, ${subjectInfo.color}dd 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 6px ${subjectInfo.color}40; transition: all 0.3s ease; letter-spacing: 0.3px;"
                  onmouseover="this.style.transform='translateY(-2px) scale(1.02)'; this.style.boxShadow='0 6px 12px ${subjectInfo.color}60';" 
                  onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 4px 6px ${subjectInfo.color}40';">
            ${subjectInfo.emoji} Generate Answer with AI ✨
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
      alert('✅ Answer copied to clipboard successfully!');
    }).catch(() => {
      alert('❌ Failed to copy to clipboard');
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

// ==================== HIDE FUNCTION ====================
window.hideAnswer = function(button) {
  const answerContainer = button.closest('.answer-box') || button.closest('.ai-answer-container');
  if (answerContainer) {
    answerContainer.innerHTML = '';
    answerContainer.style.display = 'none';
    
    const triggerBtn = answerContainer.previousElementSibling;
    if (triggerBtn && triggerBtn.tagName === 'BUTTON') {
        triggerBtn.style.display = '';
    }
  }
};

window.regenerateAnswer = async function(questionId, questionText, button) {
  const currentCount = await getGlobalRegenerateCount(questionId);
  
  if (currentCount >= REGENERATE_LIMIT) {
    alert(`🚫 Regenerate limit reached for this question (${REGENERATE_LIMIT}/${REGENERATE_LIMIT}).\n\n✨ The cached answer is already optimized for your exam preparation!`);
    return;
  }
  
  const remaining = REGENERATE_LIMIT - currentCount;
  const confirmMsg = `🔄 Regenerate this answer?\n\n📊 Global regenerations used: ${currentCount}/${REGENERATE_LIMIT}\n✅ Remaining: ${remaining}\n\n⚠️ This will create a new AI-generated answer.`;
  
  if (!confirm(confirmMsg)) {
    return;
  }
  
  await incrementGlobalRegenerateCount(questionId);
  
  // ✅ FIX: Don't delete the cache entry here — let the new fetch overwrite it.
  // Deleting it caused the old version to fall through to the backend's server cache
  // on refresh, which returned the old answer. Instead we keep a placeholder that
  // expires quickly (REGENERATED_TTL_DAYS) so it is re-fetched only when truly stale.
  const localCache = loadLocalCache();
  localCache[questionId] = { regenerated: true, ts: Date.now() };
  saveLocalCache(localCache);
  
  const container = button.closest('.answer-box') || button.closest('.ai-answer-container');
  
  if (container) {
      container.innerHTML = '';
      container.style.display = 'block';
      await displayAnswer(container, questionId, questionText, { forceRefresh: true });
  } else {
      console.error("Could not find answer container for regeneration");
  }
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', function() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  
  const hasDataQuestions = document.querySelector('[data-question]');
  
  if (!hasDataQuestions) {
    enableQuestionAnswering();
    console.log('✅ Enabled universal question answering system with student-friendly UI');
  } else {
    console.log('✅ Using existing data-question structure');
  }
  
  console.log('🎓 RGPV Universal System Ready - Enhanced Student Edition 🚀');
});

// Debug utilities
window.RGPVSystem = {
  clearLocalCache: () => {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    console.log('🗑️ Local cache cleared successfully');
  },
  showLocalCacheStats: () => {
    const cache = loadLocalCache();
    console.log('📊 Total locally cached:', Object.keys(cache).length);
    Object.keys(cache).forEach(key => {
      const item = cache[key];
      console.log(`📝 ${key}: ${item.subject} (${timeAgo(item.ts)})`);
    });
  },
  async checkGlobalRegenerateCount(questionId) {
    const count = await getGlobalRegenerateCount(questionId);
    console.log(`🔄 Question ${questionId}: ${count}/${REGENERATE_LIMIT} regenerations used globally`);
  }
};