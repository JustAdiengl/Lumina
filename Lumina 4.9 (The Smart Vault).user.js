// ==UserScript==
// @name         Lumina 4.9 (The Smart Vault)
// @namespace    http://tampermonkey.net/
// @version      4.9
// @description  Anti-Dupe, Smart Filters, C=Capture, Z=Zip, B=Bridge, X=Execute, R=Reset
// @author       Adie & Gemini
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-end
// @allFrames    true
// ==/UserScript==

(function() {
    'use strict';
    let qBank = [];
    let dot;
    const isGemini = window.location.href.includes('gemini.google.com');

    function createUI() {
        if (isGemini || document.getElementById("lumina-dot")) return;
        dot = document.createElement('div');
        dot.id = "lumina-dot";
        dot.innerText = "0";
        dot.style = "position:fixed; top:60px; right:25px; width:38px; height:38px; background:#7f8c8d; color:white; z-index:2147483647; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:sans-serif; font-weight:500; font-size:15px; border:2px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.2); pointer-events:none; transition:0.4s;";
        document.body.appendChild(dot);
    }

    // ✨ Cool On-Screen Notifications
    function showFlash(msg, bgColor = "rgba(44, 62, 80, 0.9)") {
        let old = document.getElementById('lumina-flash');
        if(old) old.remove();
        const flash = document.createElement('div');
        flash.id = 'lumina-flash';
        flash.innerText = msg;
        flash.style = `position:fixed; top:25px; left:50%; transform:translateX(-50%); background:${bgColor}; color:white; padding:8px 20px; border-radius:20px; z-index:9999; font-size:13px; font-family:sans-serif; backdrop-filter: blur(5px); transition: 0.5s; font-weight: bold;`;
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 500); }, 2500);
    }

    function isChoiceAnchor(text) {
        return /^[A-D][\.\)]?$|^[A-D]$/i.test(text);
    }

    function isJunk(text) {
        const lowerText = text.toLowerCase();

        // Block static junk
        const staticJunk = ["recommended", "arrivals", "popular", "assigned", "ebooks", "library", "afghanistan", "angola", "argentina", "australia", "bangladesh", "belgium", "results", "show 60", "fiction", "non fiction", "adventure", "decodables", "poetry", "magazine", "chapter book", "early reader", "popular reads", "next", "previous", "finish", "✕", "submit"];
        if (staticJunk.some(word => lowerText === word || lowerText.includes("results show"))) return true;

        // 🚀 THE SMART BOMB: Kills patterns regardless of the numbers inside them
        if (/lexile\s*\d+l/i.test(lowerText)) return true; // Kills "Lexile 820L"
        if (/word count\s*\d+/i.test(lowerText) || lowerText.includes("/word count")) return true; // Kills Word Counts
        if (/question\s*\d+\s*of\s*\d+/i.test(lowerText)) return true; // Kills "Question 1 of 10"
        if (/^\d+\.$/.test(lowerText)) return true; // Kills stray "1.", "2."
        if (lowerText.startsWith("quiz:")) return true;

        return false;
    }

    function captureContent() {
        let text = window.getSelection().toString();

        if (!text) {
            const quizArea = document.querySelector('.assessment-container, .quiz-container, #question-view, [class*="quiz"], main') || document.body;
            const selectors = 'p, h1, h2, h3, [class*="question"], button, label, [class*="choice"], [class*="option"], [class*="answer"], span';
            const elements = quizArea.querySelectorAll(selectors);

            let lines = [];
            let seen = new Set();

            elements.forEach(el => {
                // !FIX: Squashes invisible spaces to stop duplicate choices
                let txt = el.innerText.replace(/\s+/g, ' ').trim();

                if (txt.length > 0 && !seen.has(txt)) {
                    if (isChoiceAnchor(txt) || (!isJunk(txt) && txt.length < 500)) {
                        lines.push(txt);
                        seen.add(txt);
                    }
                }
            });
            text = lines.join('\n');
        }
        return text.length > 0 ? text : "";
    }

    function init() {
        createUI();
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (!e.altKey) return;

            if (isGemini && key === 'x') {
                e.preventDefault();
                const inputField = document.querySelector('div[contenteditable="true"], textarea, rich-textarea');
                if (inputField) { inputField.focus(); document.execCommand('paste'); showFlash("✨ LUMINA: PASTE COMPLETE");}
                return;
            }

            if (isGemini) return;

            // [ALT + C] : CAPTURE
            if (key === 'c') {
                e.preventDefault();
                const content = captureContent();

                if (content.length > 0) {
                    // !FIX: THE VAULT CHECK (Anti-Double Tap)
                    const isDuplicate = qBank.some(savedQ => savedQ.includes(content));

                    if (isDuplicate) {
                        // Flash red warning and tell them where they are
                        showFlash(`⚠️ ALREADY SAVED! (You are on Q${qBank.length})`, "rgba(231, 76, 60, 0.9)");
                    } else {
                        // Safe to copy
                        qBank.push(`QUESTION ${qBank.length + 1}:\n${content}`);
                        dot.innerText = qBank.length;
                        dot.style.background = "#27ae60";
                        dot.style.transform = "scale(1.15)";
                        setTimeout(() => dot.style.transform = "scale(1)", 200);
                        showFlash(`✅ CAPTURED Q${qBank.length}`, "rgba(46, 204, 113, 0.9)");
                    }
                }
            }

            // [ALT + Z] : ZIP
            if (key === 'z') {
                e.preventDefault();
                if (qBank.length === 0) return;
                GM_setClipboard("Solve these questions. Provide a clean, numbered list of the correct answers:\n\n" + qBank.join('\n\n---\n\n'));
                dot.style.background = "#2980b9";
                showFlash("📁 ZIPPED & READY", "rgba(52, 152, 219, 0.9)");
            }

            if (key === 'b') { e.preventDefault(); window.open("https://gemini.google.com/app", "_blank"); }
            if (key === 'r') {
                e.preventDefault();
                qBank = []; dot.innerText = "0"; dot.style.background = "#7f8c8d";
                showFlash("🔄 RESET SUCCESSFUL", "rgba(149, 165, 166, 0.9)");
            }
        }, true);
    }

    setTimeout(init, 500);
})();