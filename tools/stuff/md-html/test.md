## 📝 Markdown Compilation Test Page: Comprehensive Element Showcase

---

### **Introduction and Basic Text Formatting**

This document is designed to test the full capability of a Markdown parser and compiler. It incorporates almost every standard and extended element to ensure robust conversion to HTML.

We will begin with **basic text formatting**. This line contains **bold text** and *italic text* (or *emphasis*). We can also combine them, like ***bold and italic text***. For certain applications, you might need ~~strikethrough text~~.

> **Note:** Markdown compilers must correctly distinguish between different levels of emphasis and handle nested formatting.

### **Headings and Hierarchy**

A proper document structure relies on headings. Ensure that all six heading levels are correctly converted to their respective HTML tags (`<h1>` through `<h6>`).

# Heading Level 1
## Heading Level 2
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6

---

### **Lists: Ordered, Unordered, and Nested**

Lists are critical for organizing information. This section includes both ordered and unordered lists, as well as complex nesting.

#### Unordered List (Bulleted)

* First item in the list.
* Second item, which may require a **line break** within the list item.
* Third item, leading into a nested list:
    * Sub-item A (Level 2)
    * Sub-item B (Level 2)
        1.  Deeply nested ordered sub-item (Level 3)
        2.  Another ordered sub-item
    * Sub-item C (Level 2)

#### Ordered List (Numbered)

1.  Step one in the process.
2.  Step two, where we check the compiler's handling of numbering.
3.  Step three:

    > This blockquote is nested **inside** the third list item, which is a common edge case for parsers.

4.  Step four. *Note: Numbering should reset/continue correctly.*

### **Blockquotes and Citations**

Blockquotes are used to highlight distinct passages or quotes. They can also be nested.

> This is a primary blockquote. It spans multiple lines to test the compiler's line-breaking logic.
>
>> This is a nested blockquote within the primary one. It should render with a distinct visual style.

### **Code Presentation: Inline and Blocks**

Accurate rendering of code is essential. This tests both inline code and fenced code blocks with language highlighting.

The function name is \`initialize\_parser()\` and it returns a \`boolean\`.

\`\`\`python
# Fenced code block: Python example
def compile_markdown(text):
    """
    Simulates a complex compilation process.
    """
    if not text:
        return "<html><body></body></html>"
    
    # Placeholder for actual compilation logic
    compiled_html = f""
    
    return compiled_html

# The compiler must not interpret markdown within this block: *not bold*
\`\`\`

### **Tables for Structured Data**

Tables require correct alignment and cell parsing.

| Element Type | Markdown Syntax | HTML Equivalent | Notes |
| :--- | :---: | ---: | :--- |
| **Heading** | `# H1` | `<h1>` | Left Aligned |
| **Italics** | `*text*` | `<em>` | Center Aligned |
| **Code Block** | \`\`\` | `<pre><code>` | Right Aligned |
| **Link** | `[text](url)` | `<a>` | Includes Inline Link |

### **Mathematical Expressions (LaTeX)**

This demonstrates the use of LaTeX syntax for complex mathematical notation, which is often a required extension for technical documents.

The solution for the quadratic equation $ax^2 + bx + c = 0$ is given by the quadratic formula:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

We can also express a definite integral inline, such as $\int_0^1 f(x) dx$.

### **Links and Image References**

Check how relative and absolute links are handled, along with basic image syntax.

You can visit a well-known search engine [Google's Homepage](https://www.google.com).

This is a **relative link** to another page: [Compiler Documentation](/docs/compiler-spec.md).

An image tag would typically look like this: ![A generic diagram for testing](images/test-diagram.png "Diagram Alt Text")

### **Final Separator**

This final horizontal rule (`***`) concludes the comprehensive test page.

***

**End of Document.**
