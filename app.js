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
    els.status.textContent = "Browser Python is not available. Check your internet connection because Pyodide is loaded from the internet.";
    els.outputArea.value = String(error);
    return null;
  }
}

function syncLineNumbers() {
  // Numbers of rows is visual part only.
  // Not added in textarea
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
  // Line and column are not announced during normal typing or arrow-key reading
  // or when moving through the code. The announcement is sent only to one status element.
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
  return `row ${info.line} of ${info.totalLines}, column ${info.column}.`;
}

function setCursorPositionText() {
  if (!els.cursorPosition) return;
  els.cursorPosition.setAttribute("aria-live", "off");
  els.cursorPosition.textContent = getCursorPositionText();
}

function announceCursorPosition(refocusEditor = true) {
  const text = getCursorPositionText();
  setCursorPositionText();

  // The previous version changed aria-live on the edit field description itself.
  // This caused duplicate announcements in some screen readers.
  // Now the announcement is sent only to one existing status element.
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
    els.cursorPosition.textContent = `line not found ${els.gotoLine.value || "without a number"}. The file has ${totalLines} lines.`;
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
  els.resultSummary.textContent = `The file has been opened: ${file.name}. You can edit it, run it, and save it under the same name.`;
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
        raise EOFError("Input was cancelled.")
    print(value)
    return str(value)

def _explain_error(exc):
    name = type(exc).__name__
    message = str(exc).lower()
    if name == "SyntaxError":
        if "expected ':'" in message:
            return "A colon is probably missing at the end of the statement.", "Statements such as if, for, while, def, and class end with a colon."
        if "was never closed" in message or "unterminated" in message:
            return "A closing bracket or quotation mark is probably missing.", "Check whether all quotation marks and brackets are properly closed."
        return "Check brackets, quotation marks, colons, and commas.", "Python cannot read the written line as a valid statement."
    if name == "IndentationError":
        return "Check line indentation.", "Python uses indentation for code blocks."
    if name == "NameError":
        return "Check whether the name is defined and spelled correctly.", "The variable, function, or module name was not found."
    if name == "ZeroDivisionError":
        return "Check the divisor before dividing.", "Division by zero is not allowed."
    if name == "ValueError":
        return "Check value conversion, for example int() or float().", "The value is not suitable for the requested operation."
    if name == "TypeError":
        return "Check data types and conversions.", "The operation is being performed on the wrong data type."
    if name == "EOFError":
        return "The program requested input, but input was cancelled.", "Run the code again and enter a value in the dialog box."
    return "Check the message, error line, and values.", "An error occurred during execution."

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
    els.resultSummary.textContent = "The system could not run the code in the browser.";
    els.outputArea.value = String(error);
  }
}

function showBrowserResult(result, sourceLines) {
  const terminalText = [result.stdout, result.stderr].filter(Boolean).join("\n").trimEnd();

  if (result.ok) {
    els.resultSummary.innerHTML = '<span class="success">The code is correct and was executed in the browser.</span>';
    els.outputArea.value = terminalText || "The program did not print a result.";
    els.outputArea.focus();
    return;
  }

  const lineNumber = result.lineno ? Number(result.lineno) : null;
  const sourceLine = lineNumber ? (sourceLines[lineNumber - 1] ?? result.text ?? "") : (result.text ?? "");
  const terminal = [];
  if (terminalText) terminal.push(terminalText);
  terminal.push(`Error: ${result.error_type}: ${result.message}`);
  if (lineNumber) terminal.push(`Line: ${lineNumber}`);
  if (sourceLine) terminal.push(`Incorrect code: ${sourceLine}`);
  if (result.missing) terminal.push(`What is missing or what to check: ${result.missing}`);
  if (result.explanation) terminal.push(`Explanation: ${result.explanation}`);
  terminal.push("\nTraceback:\n" + result.traceback);

  els.outputArea.value = terminal.join("\n");
  els.resultSummary.innerHTML = '<span class="danger">The code contains an error.</span>' + (lineNumber ? ` Check line ${lineNumber}.` : " Check the error description.");

  els.errorDetails.hidden = false;
  els.errorDetails.innerHTML = `
    <h3>Error details</h3>
    <p><strong>Error type:</strong> ${escapeHtml(result.error_type || "Unknown error")}</p>
    <p><strong>Message:</strong> ${escapeHtml(result.message || "No additional message.")}</p>
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

  // Browser security limitation: the page cannot directly write to the folder where index.html is located.
  // In browsers that support the File System Access API, the user can choose a folder, and the editor then
  // creates or uses the "programs" subfolder and saves the .py file into it.
  if (window.showDirectoryPicker) {
    try {
      const rootHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      const programsHandle = await rootHandle.getDirectoryHandle("programi", { create: true });
      const fileHandle = await programsHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      els.resultSummary.textContent = `The file was saved in the programs subfolder as ${filename}. If you want to run it through the BAT file, copy it to the folder containing pokreni_py_datoteku.bat or run the BAT file from the program folder.`;
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        els.resultSummary.textContent = "Saving to the folder was cancelled. The file was not saved.";
        return;
      }
      console.warn("Saving to the folder failed, download mode will be used.", error);
    }
  }

  downloadPythonFile(filename, content);
  els.resultSummary.textContent = `The file was saved as a download: ${filename}. Move it to the same folder as pokreni_py_datoteku.bat or to the programs folder if you organize programs that way.`;
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
