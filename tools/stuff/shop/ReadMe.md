# 🛍️ Simple Shop Front-End: Setup and Customization Guide

This is a fast, modern e-commerce front-end built with **HTML, CSS, and vanilla JavaScript**. It requires **NO DATABASE** and uses your browser's **Local Storage** to manage the shopping cart.

The checkout process is simplified by sending the final order directly to you via a pre-filled **WhatsApp message**.

### ⚠️ Prerequisite Knowledge

To customize this site beyond simple text changes, you will need **some basic knowledge of HTML and CSS** or an **AI assistant (like me)** or a **developer friend** to help you navigate the code structure.

---

## 🛠️ Step 1: Critical Configuration (WhatsApp Setup)

The most important step is linking the site to your business phone number so you can receive orders.

1.  Open the file **`js/checkout.js`**.
2.  Find the line at the very top of the file:
    ```javascript
    const WHATSAPP_PHONE_NUMBER = 'YOUR_PHONE_NUMBER';
    ```
3.  Replace `'YOUR_PHONE_NUMBER'` with your actual business phone number.

    * **Format is Crucial:** Use the **full international format** (country code + number) **without** a leading `+` sign, spaces, or dashes.
    * **Example for an Egyptian number (0100 123 4567):** Use `'201001234567'`
    * **Example for a US number (+1 555 123 4567):** Use `'15551234567'`

---

## 🎨 Step 2: Personalizing the Brand (Text, Title, & Colors)

### A. Updating Site Titles and Text

You will edit text in both `index.html` and `checkout.html`.

| Element to Change | File | Code Example to Look For |
| :--- | :--- | :--- |
| **Site Title (Browser Tab)** | `index.html` (Line 6) | `<title>The Artisan Collective</title>` |
| **Checkout Title (Browser Tab)** | `checkout.html` (Line 6) | `<title>Checkout | The Artisan Collective</title>` |
| **Header Logo/Name** | `index.html` (Line 13) | `<h1>Artisan Collective <span>Shop</span></h1>` |
| **Footer Text** | `index.html` (Around Line 186) | `&copy; 2024 The Artisan Collective. All Rights Reserved.` |
| **Footer Slogan** | `index.html` (Around Line 187) | `<p class="slogan">"Curated goods, simple orders..."</p>` |

### B. Changing Colors and Theme

The entire color scheme for both the **Light** and **Dark** modes is controlled by CSS variables in the file **`css/index.css`**.

1.  Open **`css/index.css`**.
2.  Edit the variables under the `:root` section for the **Dark Theme**.
3.  Edit the variables under the `body.light-theme` section for the **Light Theme**.

| Variable Name | Purpose |
| :--- | :--- |
| `--background-primary` | Main page background color (e.g., the page itself). |
| `--background-secondary` | Card/Container background color (e.g., product cards). |
| `--primary-brand-color` | Your main brand color (used for buttons, main links). |
| `--accent-color` | A secondary, highlighting color (used for prices, totals). |
| `--text-primary` | Default text color. |

---

## 📦 Step 3: Product Management (Adding/Editing Items)

All product data is stored directly in the HTML file **`index.html`** using special attributes called `data-*` attributes.

1.  Open **`index.html`**.
2.  Scroll down to the product sections (e.g., `<div class="product-grid">`).
3.  Each product is a `<div class="product-card">`. The essential information is on that main line:

    ```html
    <div class="product-card" 
        data-product-id="P001" 
        data-name="Vintage Leather Bag" 
        data-price="49.99" 
        data-description="A classic, handcrafted leather bag with durable stitching." 
        data-image="./images/1.jpg">
        </div>
    ```

### To Edit a Product:

* **`data-product-id`**: **DO NOT CHANGE** this once an item has been added to a customer's cart or saved in a link. It's the unique identifier for the cart logic.
* **`data-name`**: The product name.
* **`data-price`**: **MUST** be a pure number (e.g., `49.99`). The currency symbol is added automatically.
* **`data-description`**: The short description text.
* **`data-image`**: The path to your product photo. Ensure you upload all your product images into the `./images/` folder and update this path accordingly.

You must also update the corresponding visible elements **inside** the card (like the `<h2>` and `<p class="product-description">` tags) to match these data attributes.

### To Add a Product:

1.  Copy an existing `<div class="product-card">` block entirely.
2.  Paste it into the desired section.
3.  **Crucially**, give it a brand new, unique `data-product-id` (e.g., if you have P001-P008, use `P009`).
4.  Update all the other attributes and internal text to match your new product.

---

## 📝 Step 4: Customizing the WhatsApp Order Message

You can change the text and formatting of the order message the customer sends to you.

1.  Open the file **`js/checkout.js`**.
2.  Scroll down to the `generateWhatsAppLink()` function (around line 90).
3.  Edit the static text inside the `orderMessage` variable. Use `\n` to create a new line in the message.

    ```javascript
    // Located in js/checkout.js, around line 90
    const orderMessage = encodeURIComponent(
        `*ORDER DETAILS*\\n` +
        `\\n--- 側 Customer ---\\n` + // <-- Change this header!
        `Name: ${customerName}\\n` + 
        // ... all other template lines ...
        `\\n*跳 GRAND TOTAL: $${grandTotal.toFixed(2)}*\\n` +
        `\\n_Please confirm stock and finalize the order._` // <-- Change this final note!
    );
    ```
    **Tip:** Variables like `${customerName}` will automatically insert the customer's input. You can also change the emojis (e.g., `側` is a box emoji).
