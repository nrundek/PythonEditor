# Accessible Python Editor

This package contains an accessible HTML editor for writing, opening, running, and saving Python code.

This version includes only one execution mode inside the editor: **Run code**. The code runs in the browser using Pyodide, and the result is displayed in the **Terminal output** area.

## Files

- `index.html` – main editor.
- `app.js` – logic for line numbering, opening `.py` files, saving, and running code in the browser.
- `styles.css` – styles for an accessible interface and expanded code editor.
- `python-pravila.html` – Python language rules and examples for computer science lessons.
- `pokreni_py_datoteku.bat` – additional Windows launcher that runs `.py` files using a locally installed Python interpreter.
- `programi` – intended folder for saving Python programs.

## Usage

1. Open `index.html` in a web browser.
2. In the **File name** field, enter a program name such as `task_1.py`.
3. Write the code in the **Python code** field.
4. Press **Run code**.
5. The result or error message will appear in the **Terminal output** area.
6. The **Save file** button saves the current editor content as a `.py` file.

## Limitations

- Pyodide is loaded from the internet, so an internet connection is required the first time the editor is started.
- The **Run code** button executes code in the browser, not in the installed system Python.
- `pokreni_py_datoteku.bat` works only on Windows and requires Python to be installed.
