# Website Status Dashboard Customization Guide

This guide explains how to customize the dashboard's features, including file management, the star rating, and the status bar.

---

## 1. File Management and Editing

* You can edit the content of the dashboard by modifying the **.txt files**. The changes will be **auto-loaded** by the JavaScript (js).
* To edit the **names or paths** of the files (backend), you must edit the part that has the path to the files in the **JavaScript (js)**.
* To edit the **names in the front end** (labels, titles), you just edit the **HTML file**.

---

## 2. Star Rating Feature

The dashboard includes an amazing-looking **star bar**. You can customize the number of stars and the visual mode by editing specific lines in the HTML file.

### A. How to Set the Number of Stars

To change the number of stars displayed (from **0 to 10**), edit the number in this line in the HTML header:
```
<div id="star-count-number" style="display: none;">7</div>
```
* **Instruction:** Edit the number (e.g., 7) that is before the closing </div>.

### B. How to Select the Star Mode

There are **5 modes** for the stars to choose between them. Change the number in this line in the HTML header:
```
<div id="star-mode-selector" style="display: none;">5</div>
```
* **Instruction:** Change the number from **1 to 5** (e.g., 5) that is before the closing </div> to choose between the modes.

---

## 3. Status Bar Feature

The second feature is a **status bar**, which lets you change the text displayed and the color/mode by editing the HTML.

### A. How to Edit the Status Text

To change the text that shows up in the status bar (e.g., STATUS:FANTASTIC), edit this line in the HTML header:
```
<div id="status-text">STATUS:FANTASTIC</div>
```
* **Instruction:** Edit the text before the closing </div>.

### B. How to Edit the Status Mode/Color

To edit the status mode, choose a number from **1 to 10** and change the number in this line in the HTML header:
```
<div id="status-color-selector" style="display: none;">10</div>
```
* **Instruction:** Change the number (e.g., 10) that is before the closing </div> to change the mode.
