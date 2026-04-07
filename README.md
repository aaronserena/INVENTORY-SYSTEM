# **Web-Based Inventory Management System: Optimized Framework**

## **I. System Role / Personality**

**Role:** AI Inventory Strategist & Operations Lead **Objective:** Maintain a high-precision, real-time web ecosystem with a minimalist, non-overwhelming user interface. **Tone:** Analytical, organized, and user-centric.

## **II. Technical Stack & UI Design**

### **1\. Framework & Environment**

* **Frontend:** React.js (Vite) for a fast, responsive Single Page Application.  
* **Styling:** Tailwind CSS using a **"Dirty White" / Warm Minimalist** palette.  
* **Persistence:** `localStorage` for cross-session data retention.  
* **Display Mode:** PWA (Progressive Web App) support for "Standalone" full-screen launching.

### **2\. UI/UX Philosophy (Simplified Layout)**

* **Primary Palette (Solid Colors Only):** \* Background: `#F5F5F0` (Dirty White) \- **No gradients.**  
  * Cards/Containers: `#FFFFFF` (Pure White) with thin, solid borders (`border-stone-200`).  
  * Text: `#2D2D2D` (Deep Charcoal) for high contrast.  
  * Accents: Solid Sage (`#87A96B`), Stone (`#A8A29E`), and Muted Orange (`#F97316`).

## **III. Detailed Code Logic**

**Earnings Calculation Logic:**  
// 1\. General Earnings (Total Revenue from all sales)  
const totalGeneralEarnings \= salesLogs.reduce((acc, log) \=\> acc \+ (log.price \* log.quantity), 0);

// 2\. Per-Product Earnings & Potential  
const productAnalytics \= products.map(product \=\> {  
  const totalSoldRevenue \= salesLogs  
    .filter(log \=\> log.productId \=== product.id)  
    .reduce((sum, log) \=\> sum \+ (log.price \* log.quantity), 0);

  const expectedRemainingRevenue \= product.currentQty \* product.sellingPrice;

  return {   
    ...product,   
    totalEarnings: totalSoldRevenue,  
    potentialSoldOutEarnings: expectedRemainingRevenue   
  };  
});

* 

**Print Logic:**  
const printReport \= (elementId) \=\> {  
  const content \= document.getElementById(elementId).innerHTML;  
  const printWindow \= window.open('', '\_blank');  
  printWindow.document.write(\`\<html\>\<body\>${content}\</body\>\</html\>\`);  
  printWindow.document.close();  
  printWindow.print();  
};

* 

## **IV. Optimized System Rules**

1. **Flat Design Only:** Absolutely **no gradient color styles**.  
2. **Visual Clarity:** Use "Dirty White" backgrounds for a clean, paper-like feel.  
3. **Multi-Tier Analytics:** Provide toggleable views for **Weekly, Monthly, and Yearly** performance.  
4. **Export Capabilities:** Include a **Print Analytics** button that generates a clean, text-only report of the selected timeframe (Weekly/Monthly/Yearly).  
5. **Big Screen Optimization:** Include a prominent "Fullscreen" button and PWA support.

## **V. Master Prompt for Implementation**

"Act as a Senior UX/UI Developer. Build a **React \+ Tailwind CSS** Inventory System with a **'Dirty White' (\#F5F5F0)** theme.

**Design Requirements (Flat Style):**

1. **Minimalist UI:** Use solid colors and flat design. **No gradients.**  
2. **Dashboard Analytics:** Switch between **Weekly, Monthly, and Yearly** reports. Show 'Total General Earnings', 'Total Potential Revenue', and 'Net Profit'.  
3. **Analytics Printing:** Add a 'Print Report' button in the Analytics section to print the current data view.  
4. **Product Management:** Show 'Total Earned' and 'Expected Earnings if Sold Out' for each product.  
5. **Fullscreen Feature:** Add a 'Full Screen' toggle button in the header.  
6. **POS Feature:** A counter-style cashier calculator.  
   * Logic: **(item.price \* item.quantity) sum \= Total**.  
   * Then: **Client Money \- Total \= Change**.  
7. **Functionality:** Include 'Print Receipt' and 'Performance Summary'.

Ensure the interface is optimized for large displays and standalone window use."

