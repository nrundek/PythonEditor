const PYODIDE_VERSION = "0.29.3";
let pyodideReadyPromise = null;
let pyodide = null;

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  els.status = document.getElementById("status");
  els.fileName = document.getElementById("fileName");
  els.codeInput = document.getElementById("codeInput");
  els.lineNumbers = document.getElementById("lineNumbers");
  els.cursorPosition = document.getElementById("cursorPosition");
  els.announceLineButton = document.getElementById("announceLineButton");
  els.gotoLine = document.getElementById("gotoLine");
  els.gotoLineButton = document.getElementById("gotoLineButton");
  els.openButton = document.getElementById("openButton");
  els.openFileInput = document.getElementById("openFileInput");
  els.runButton = document.getElementById("runButton");
  els.saveButton = document.getElementById("saveButton");
  els.clearButton = document.getElementById("clearButton");
  els.outputArea = document.getElementById("outputArea");
  els.resultSummary = document.getElementById("resultSummary");
  els.errorDetails = document.getElementById("errorDetails");

  els.openButton.addEventListener("click", () => els.openFileInput.click());
  els.openFileInput.addEventListener("change", openPythonFile);
  els.runButton.addEventListener("click", runCode);
  els.saveButton.addEventListener("click", savePythonFile);
  els.clearButton.addEventListener("click", clearResult);
  els.announceLineButton.addEventListener("click", announceCursorPosition);
  els.gotoLineButton.addEventListener("click", goToLine);
  els.gotoLine.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToLine();
    }
  });

  enableTabInTextarea(els.codeInput);
  syncLineNumbers();
  setCursorPositionText();
  els.codeInput.addEventListener("input", () => {
    syncLineNumbers();
  });
  els.codeInput.addEventListener("keydown", handleCodeInputKeydown);
  els.codeInput.addEventListener("scroll", syncEditorScroll);

  pyodideReadyPromise = initPyodide();
});

async function initPyodide() {
  try {
    els.status.textContent = "The browser Python environment is loading.";
    pyodide = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/` });
    els.status.textContent = "Python is ready.";
    els.runButton.disabled = false;
    return pyodide;
  } catch (error) {
    els.runButton.disabled = true;
    els.status.textContent = "Browser Python is not available. Check the internet connection because Pyodide is loaded from the internet.";
    els.outputArea.value = String(error);
    return null;
  }
}

function syncLineNumbers() {
  // Brojevi linea su samo vizualni sloj editora.
  // Ne dodaju se u textarea i zato se ne spremaju u .py datoteku.
  const value = els.codeInput.value || "";
  const lineCount = Math.max(1, value.split(/\r?\n/).length);
  els.lineNumbers.textContent = Array.from({ length: lineCount }, (_, i) => String(i + 1)).join("\n");
  syncEditorScroll();
}

function syncEditorScroll() {
  els.lineNumbers.scrollTop = els.codeInput.scrollTop;
}

function getCursorInfo() {
  const value = els.codeInput.value || "";
  const position = els.codeInput.selectionStart ?? 0;
  const textBeforeCursor = value.slice(0, position);
  const line = textBeforeCursor.split(/\r?\n/).length;
  const lastNewLine = Math.max(textBeforeCursor.lastIndexOf("\n"), textBeforeCursor.lastIndexOf("\r"));
  const column = position - lastNewLine;
  const lines = value.split(/\r?\n/);
  const totalLines = Math.max(1, lines.length);
  return { line, column, totalLines };
}

function handleCodeInputKeydown(event) {
  // Redak i column ne izgovaraju se pri običnom pisanju, čitanju strelicama
  // ili pomicanju po kodu. Najava se šalje samo u jedan statusni element.
  if (event.altKey && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    announceCursorPosition();
    return;
  }

  if (event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.shiftKey) {
    window.setTimeout(() => announceCursorPosition(false), 0);
  }
}

function getCursorPositionText() {
  const info = getCursorInfo();
  return `line ${info.line} od ${info.totalLines}, column ${info.column}.`;
}

function setCursorPositionText() {
  if (!els.cursorPosition) return;
  els.cursorPosition.setAttribute("aria-live", "off");
  els.cursorPosition.textContent = getCursorPositionText();
}

function announceCursorPosition(refocusEditor = true) {
  const text = getCursorPositionText();
  setCursorPositionText();

  // Prethodna verzija mijenjala je aria-live na samom opisu edit polja.
  // To je kod nekih čitača ekrana proizvodilo dvostruku najavu.
  // Sada se najava šalje samo u jedan postojeći statusni element.
  if (els.resultSummary) {
    els.resultSummary.textContent = text;
  }

  if (refocusEditor) {
    els.codeInput.focus();
  }
}

function goToLine() {
  const requested = Number.parseInt(els.gotoLine.value, 10);
  const lines = (els.codeInput.value || "").split(/\r?\n/);
  const totalLines = Math.max(1, lines.length);

  if (!Number.isInteger(requested) || requested < 1 || requested > totalLines) {
    els.cursorPosition.setAttribute("aria-live", "assertive");
    els.cursorPosition.textContent = `Ne postoji line ${els.gotoLine.value || "bez broja"}. The file has ${totalLines} linea.`;
    window.setTimeout(() => els.cursorPosition.setAttribute("aria-live", "off"), 500);
    els.gotoLine.focus();
    return;
  }

  let start = 0;
  for (let i = 1; i < requested; i += 1) {
    start += lines[i - 1].length + 1;
  }
  const end = start + lines[requested - 1].length;
  els.codeInput.focus();
  els.codeInput.setSelectionRange(start, end);
  announceCursorPosition(false);
}

function enableTabInTextarea(textarea) {
  textarea.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.slice(0, start) + "    " + value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + 4;
    syncLineNumbers();
  });
}

async function openPythonFile() {
  const file = els.openFileInput.files && els.openFileInput.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".py")) {
    els.resultSummary.textContent = "The selected file is not a Python file with the .py extension.";
    return;
  }

  const text = await file.text();
  els.fileName.value = file.name;
  els.codeInput.value = text;
  syncLineNumbers();
  syncEditorScroll();
  setCursorPositionText();
  clearErrorDetails();
  els.resultSummary.textContent = `The file has been opened ${file.name}. You can edit, run, and save it under the same name.`;
  els.codeInput.focus();
}

async function runCode() {
  const ready = await pyodideReadyPromise;
  if (!ready) {
    els.resultSummary.textContent = "Browser Python is not available.";
    return;
  }

  clearErrorDetails();
  els.outputArea.value = "";
  els.resultSummary.textContent = "The code is running in the browser.";

  const userCode = els.codeInput.value;
  const sourceLines = userCode.split(/\r?\n/);
  pyodide.globals.set("USER_CODE", userCode);

  const runner = String.raw`
import builtins, io, json, sys, traceback
from js import window

_result = {
    "ok": False,
    "stdout": "",
    "stderr": "",
    "error_type": "",
    "message": "",
    "lineno": None,
    "text": "",
    "traceback": "",
    "missing": "",
    "explanation": ""
}
_stdout = io.StringIO()
_stderr = io.StringIO()

def _accessible_input(prompt=""):
    tekst_upita = str(prompt) if prompt is not None else ""
    if tekst_upita:
        print(tekst_upita, end="")
    value = window.prompt(tekst_upita or "Enter a value for input():")
    if value is None:
        raise EOFError("Input was interrupted.")
    print(value)
    return str(value)

def _explain_error(exc):
    name = type(exc).__name__
    message = str(exc).lower()
    if name == "SyntaxError":
        if "expected ':'" in message:
            return "A colon is probably missing at the end of the statement.", "Naredbe poput if, for, while, def i class završavaju dvotočkom."
        if "was never closed" in message or "unterminated" in message:
            return "Vjerojatno nedostaje zatvarajuća zagrada ili navodnik.", "Provjeri jesu li svi navodnici i zagrade pravilno zatvoreni."
        return "Provjeri zagrade, navodnike, dvotočke i zareze.", "Python ne može pročitati zapisani line kao valjanu naredbu."
    if name == "IndentationError":
        return "Provjeri uvlačenje linea.", "Python koristi uvlačenje za blokove koda."
    if name == "NameError":
        return "Provjeri je li ime definirano i pravilno napisano.", "Ime varijable, funkcije ili modula nije pronađeno."
    if name == "ZeroDivisionError":
        return "Provjeri nazivnik prije dijeljenja.", "Dijeljenje s nulom nije dopušteno."
    if name == "ValueError":
        return "Provjeri pretvorbu vrijednosti, primjerice int() ili float().", "Vrijednost nije prikladna za traženu operaciju."
    if name == "TypeError":
        return "Provjeri tipove podataka i pretvorbe.", "Operacija se izvodi nad pogrešnom vrstom podatka."
    if name == "EOFError":
        return "Program je tražio unos, ali je unos prekinut.", "Ponovno pokreni kod i upiši vrijednost u dijaloški okvir."
    return "Provjeri poruku, line pogreške i vrijednosti.", "Dogodila se pogreška tijekom izvođenja."

try:
    code_object = compile(USER_CODE, "user_code.py", "exec")
    old_stdout, old_stderr, old_input = sys.stdout, sys.stderr, builtins.input
    sys.stdout, sys.stderr, builtins.input = _stdout, _stderr, _accessible_input
    try:
        exec(code_object, {"__name__": "__main__"})
        _result["ok"] = True
    finally:
        sys.stdout, sys.stderr, builtins.input = old_stdout, old_stderr, old_input
except BaseException as exc:
    _result["error_type"] = type(exc).__name__
    _result["message"] = str(exc)
    _result["traceback"] = traceback.format_exc()
    _result["stdout"] = _stdout.getvalue()
    _result["stderr"] = _stderr.getvalue()
    if isinstance(exc, SyntaxError):
        _result["lineno"] = exc.lineno
        _result["text"] = exc.text or ""
    else:
        tb = exc.__traceback__
        last = None
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "user_code.py":
                last = tb.tb_lineno
            tb = tb.tb_next
        _result["lineno"] = last
    _result["missing"], _result["explanation"] = _explain_error(exc)
else:
    _result["stdout"] = _stdout.getvalue()
    _result["stderr"] = _stderr.getvalue()

json.dumps(_result, ensure_ascii=False)
`;

  try {
    const raw = await pyodide.runPythonAsync(runner);
    const result = JSON.parse(raw);
    showBrowserResult(result, sourceLines);
  } catch (error) {
    els.resultSummary.textContent = "Sustav nije uspio pokrenuti kod u pregledniku.";
    els.outputArea.value = String(error);
  }
}

function showBrowserResult(result, sourceLines) {
  const terminalText = [result.stdout, result.stderr].filter(Boolean).join("\n").trimEnd();

  if (result.ok) {
    els.resultSummary.innerHTML = '<span class="success">The code is correct and was executed in the browser.</span>';
    els.outputArea.value = terminalText || "The program did not produce output.";
    els.outputArea.focus();
    return;
  }

  const lineNumber = result.lineno ? Number(result.lineno) : null;
  const sourceLine = lineNumber ? (sourceLines[lineNumber - 1] ?? result.text ?? "") : (result.text ?? "");
  const terminal = [];
  if (terminalText) terminal.push(terminalText);
  terminal.push(`Pogreška: ${result.error_type}: ${result.message}`);
  if (lineNumber) terminal.push(`Linija: ${lineNumber}`);
  if (sourceLine) terminal.push(`Incorrect code: ${sourceLine}`);
  if (result.missing) terminal.push(`What is missing or what to check: ${result.missing}`);
  if (result.explanation) terminal.push(`Explanation: ${result.explanation}`);
  terminal.push("\nTraceback:\n" + result.traceback);

  els.outputArea.value = terminal.join("\n");
  els.resultSummary.innerHTML = '<span class="danger">The code contains an error.</span>' + (lineNumber ? ` Check line ${lineNumber}.` : " Check the error description.");

  els.errorDetails.hidden = false;
  els.errorDetails.innerHTML = `
    <h3>Error details</h3>
    <p><strong>Error type:</strong> ${escapeHtml(result.error_type || "Nepoznata pogreška")}</p>
    <p><strong>Message:</strong> ${escapeHtml(result.message || "Nema dodatne poruke.")}</p>
    ${lineNumber ? `<p><strong>Line number:</strong> ${lineNumber}</p>` : ""}
    ${sourceLine ? `<p><strong>Incorrect code:</strong></p><code class="code-line">${escapeHtml(sourceLine)}</code>` : ""}
    ${result.missing ? `<p><strong>What is missing or what to check:</strong> ${escapeHtml(result.missing)}</p>` : ""}
    ${result.explanation ? `<p><strong>Explanation:</strong> ${escapeHtml(result.explanation)}</p>` : ""}
  `;
  els.errorDetails.setAttribute("tabindex", "-1");
  els.errorDetails.focus();
}

async function savePythonFile() {
  const filename = normalizeFileName(els.fileName.value);
  const content = els.codeInput.value;

  // Sigurnosno ograničenje preglednika: stranica ne može sama pisati u mapu u kojoj se nalazi index.html.
  // U preglednicima koji podržavaju File System Access API korisnik može odabrati mapu, a editor zatim
  // stvara ili koristi podmapu "programi" i sprema .py datoteku u nju.
  if (window.showDirectoryPicker) {
    try {
      const rootHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      const programsHandle = await rootHandle.getDirectoryHandle("programi", { create: true });
      const fileHandle = await programsHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      els.resultSummary.textContent = `The file was saved in the programs subfolder as ${filename}. Ako je želiš pokrenuti preko BAT datoteke, kopiraj je u mapu u kojoj se nalazi pokreni_py_datoteku.bat ili pokreni BAT iz mape s programom.`;
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        els.resultSummary.textContent = "Saving to the folder was cancelled. The file was not saved.";
        return;
      }
      console.warn("Spremanje u mapu nije uspjelo, koristi se preuzimanje.", error);
    }
  }

  downloadPythonFile(filename, content);
  els.resultSummary.textContent = `The file was saved as a download: ${filename}. Premjesti je u istu mapu u kojoj je pokreni_py_datoteku.bat ili u mapu programi ako tako organiziraš programe.`;
}

function downloadPythonFile(filename, content) {
  const blob = new Blob([content], { type: "text/x-python;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeFileName(name) {
  const cleaned = (name || "my_program.py").trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_");
  if (!cleaned) return "my_program.py";
  return cleaned.toLowerCase().endsWith(".py") ? cleaned : `${cleaned}.py`;
}

function clearResult() {
  els.outputArea.value = "";
  clearErrorDetails();
  els.resultSummary.textContent = "The result has been cleared.";
}

function clearErrorDetails() {
  els.errorDetails.hidden = true;
  els.errorDetails.innerHTML = "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
