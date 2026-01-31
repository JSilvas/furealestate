# Budget & Living Costs Page — Specification (v3)

## Purpose

A "How much can we afford?" visualizer. The user enters household income and a target home price (with mortgage parameters), and the page renders a unified dashboard showing where every dollar goes monthly, what percentage of annual income each category consumes, whether the debt-to-income ratio is healthy, and how any surplus could grow if invested over time.

The core question this page answers: **Given my salary and this house, can I live comfortably?**

---

## Revision History

### v2 → v3 changes

1. **Sankey/alluvial flow diagram replaces doughnut chart + segmented bar** — A multi-column Sankey diagram now serves as the primary visualization (Block 2). It shows gross income flowing through tax withholding into net income, then branching into housing, debt, living expenses, and surplus — with each branch further splitting into granular sub-categories. This single chart replaces both the v2 doughnut chart and the CSS segmented allocation bar, providing a unified "where does every dollar go" view that is more expressive than either one alone.
2. **New dependency: `chartjs-chart-sankey`** — The [chartjs-chart-sankey](https://github.com/kurkle/chartjs-chart-sankey) plugin (MIT license, actively maintained) extends Chart.js with `type: 'sankey'`. It loads via CDN script tag alongside the existing Chart.js CDN — no build step needed. The plugin auto-registers with Chart.js when the script loads.
3. **Breakdown table preserved** — The detailed table from v2 Block 2 is retained below the Sankey as the granular reference. The Sankey provides the visual story; the table provides the exact numbers.
4. **50/30/20 benchmark relocated** — Moved from below the removed segmented bar to below the Sankey chart as an inline comparison strip, since it contextualizes the same data the Sankey visualizes.
5. **Block numbering updated** — With the doughnut and segmented bar merged into the Sankey, the dashboard now has 4 blocks instead of 5: Metric Cards → Sankey Flow → Investment Projection → Affordability Verdict.

### v1 → v2 changes

1. **Filing Status dropdown removed** — the existing app uses a simple tax-rate slider everywhere. Replaced with a flat effective tax rate slider plus a reference tooltip showing common effective rates by income.
2. **Loan Term changed from dropdown to number input** — matching existing pages.
3. **Closing costs added** — the existing `calculateSimulation()` engine includes closing costs, but v1 omitted them.
4. **Down payment cash impact added** — computed "Cash Required at Closing" summary in Section B.
5. **DTI thresholds expanded** — shows both traditional 28/36 guideline and modern lending limits (43% QM, 45-50% conventional).
6. **50/30/20 budget benchmark added** — shown as a reference comparison against actual spending.
7. **Inflation-adjusted investment projection added** — matching the existing wealth chart's nominal vs. real pattern.
8. **Computed helper values next to sliders** — dollar amounts inline next to percentage sliders (matching existing pages).
9. **CSS approach clarified** — embedded CSS (no Tailwind), matching the analysis page pattern.
10. **Debounce removed** — matching existing pages (recalculate on every `input` event).
11. **Affordability Score added to sticky header** — mirrors the "Savvy Score" pattern.
12. **Living expense scaling formula defined** — BLS Consumer Expenditure Survey proportions.

---

## 1. Inputs

### Layout

Left sidebar (350px fixed, collapsible on mobile) + right scrollable dashboard. Matches `rental-analysis.html` layout with the sidebar toggle button pattern.

**Sidebar CSS**: `#fafafa` background, `1px solid #e0e0e0` right border, scrollable with `max-height: calc(100vh - 180px)`. Section headers in `#667eea` uppercase.

**Input pattern**: All percentage inputs use the `slider + number` pair with synchronized bidirectional binding (slider `input` event updates number, number `input` event updates slider, both trigger `calculate()`). Currency inputs are standalone `<input type="number">` fields. Computed values display inline next to their related input using a `<span>` to the right of the slider row.

### Section A — Household Income

| Field | Type | Default | Computed Helper | Notes |
|---|---|---|---|---|
| Gross Annual Household Salary | currency input (`key-input` class) | $120,000 | — | Primary driver. Green border highlight. |
| Estimated Effective Tax Rate % | slider + number | 22% | `$X,XXX/mo taxes` | Combined federal + state + FICA. A small `(?)` tooltip shows: "Typical effective rates: $75K single → ~18%, $120K MFJ → ~20%, $200K MFJ → ~24%, $300K+ → ~28%". User has full control. |
| **Monthly Take-Home Pay** | **computed, read-only display** | — | — | `(Annual Salary × (1 - Tax Rate)) / 12`. Rendered as a prominent card within the sidebar, not an input. Styled with green background if > $0. |

**Rationale for dropping Filing Status**: The tax rate slider already lets the user express their effective rate. A filing-status dropdown would require implementing the full 2026 federal bracket math plus state tax estimation — a significant calculation engine for marginal accuracy. The tooltip provides enough guidance to pick a reasonable rate.

### Section B — Housing Cost (Mortgage Baseline)

| Field | Type | Default | Computed Helper | Notes |
|---|---|---|---|---|
| Home Price | currency input (`key-input` class) | $400,000 | — | Green border highlight. |
| Down Payment % | slider + number | 20% (range 0–100) | `$80,000` | Shows absolute dollar amount |
| Loan Interest Rate % | slider + number | 6.5% (range 1–15, step 0.125) | `$2,023/mo P&I` | Shows resulting monthly P&I payment |
| Loan Term (years) | number input | 30 | — | Accepts 15, 20, or 30 |
| Closing Costs % | slider + number | 3% (range 0–10) | `$12,000` | Shows absolute dollar amount |
| Property Tax Rate % | slider + number | 1.2% (range 0–5, step 0.01) | `$400/mo` | Of home value, annualized → monthly |
| Homeowner's Insurance % | slider + number | 0.5% (range 0–5, step 0.01) | `$167/mo` | Of home value, annualized → monthly |
| PMI Rate % | slider + number | 0.5% (range 0–2, step 0.1) | `$133/mo` | Visually disabled (grayed out) when down payment ≥ 20%. PMI applies to loan amount, not home value. |
| HOA / month | currency input | $0 | — | |

**Computed summary block at bottom of Section B** (styled like the reserve breakdown card on index.html):

```
┌─────────────────────────────────────────┐
│  MONTHLY HOUSING COST          $2,923   │  ← P&I + Tax + Insurance + PMI + HOA
│                                         │
│  Cash Required at Closing               │
│  Down Payment              $80,000      │
│  Closing Costs             $12,000      │
│  ─────────────────────────────────      │
│  Total Cash Needed         $92,000      │
└─────────────────────────────────────────┘
```

Color-coded: green border if front-end DTI ≤ 28%, yellow if 28–36%, red if > 36%.

### Section C — Other Monthly Debts

Dynamic repeatable rows. Each row:

| Field | Type |
|---|---|
| Debt Label | text input (placeholder: "e.g. Auto Loan") |
| Monthly Payment | currency input |
| [X] Remove button | icon button |

**Quick-add chips** above the rows: clicking a chip adds a new row pre-filled with the label.
Chips: `Auto Loan` · `Student Loan` · `Credit Card` · `Personal Loan` · `Child Support` · `Other`

**Computed**: `Total Other Monthly Debt: $X,XXX` displayed below the last row.

**Implementation note**: Rows stored in a JS array. Each chip click pushes `{label: "Auto Loan", amount: 0}`. The remove button splices from the array. The row list re-renders on change. Max 10 rows (practical limit, prevents layout overflow).

### Section D — Monthly Living Expenses

Category-based inputs with defaults scaled from BLS Consumer Expenditure Survey proportions. The scaling formula uses **net monthly income** (after tax) as the baseline:

| Category | % of Net Income | Default at $120K / 22% tax | Notes |
|---|---|---|---|
| Groceries / Food | 10% | $780 | |
| Utilities (Electric, Gas, Water, Trash) | 4% | $312 | |
| Internet / Phone / Subscriptions | 2.5% | $195 | |
| Transportation (Gas, Maintenance, Auto Insurance) | 6.5% | $507 | |
| Healthcare / Medical | 3% | $234 | Premiums + out-of-pocket |
| Childcare / Education | 0% | $0 | $0 default; user adjusts if applicable |
| Personal / Entertainment | 4% | $312 | |
| Savings (Emergency Fund, etc.) | 0% | $0 | Non-investment savings |
| Other / Miscellaneous | 2.5% | $195 | |

**"Reset to Suggested" button**: Recalculates all defaults based on current income and tax rate. Appears at the top of Section D. Does not auto-fire — only on explicit click, so user customizations are preserved.

**Computed**: `Total Monthly Living Expenses: $X,XXX` displayed below.

### Section E — Investment Growth (collapsible)

Section header has a toggle switch. When OFF, the entire section collapses and Block 3 (investment chart) hides on the dashboard.

| Field | Type | Default | Notes |
|---|---|---|---|
| Expected Annual Return % | slider + number | 7% (range 0–15) | Pre-tax market return |
| Inflation Rate % | slider + number | 3% (range 0–10) | For real-dollar adjustment |
| Investment Time Horizon (years) | slider + number | 20 (range 1–40) | |
| Existing Investment Balance | currency input | $0 | Starting portfolio value |

---

## 2. Core Calculations

All calculations run on every `input` event (no debounce — consistent with existing pages). The calculation function is pure (takes input values, returns output object), separated from DOM rendering.

### 2a. Mortgage Payment

Standard amortization formula (identical to `script.js:99-104` and `investment.html:619-620`):

```
monthlyRate = annualRate / 12
numPayments = loanTermYears × 12
monthlyPI = loanAmount × (monthlyRate × (1 + monthlyRate)^numPayments) / ((1 + monthlyRate)^numPayments - 1)
```

Special cases:
- If `monthlyRate === 0` and `loanAmount > 0`: `monthlyPI = loanAmount / numPayments`
- If `loanAmount === 0`: `monthlyPI = 0`

### 2b. Monthly Budget Waterfall

```
Gross Monthly Income        = Annual Salary / 12
Monthly Taxes               = Gross Monthly × (Effective Tax Rate / 100)
Net Monthly Income          = Gross Monthly − Monthly Taxes

Monthly Housing             = P&I + (Home Price × Property Tax Rate / 12)
                              + (Home Price × Insurance Rate / 12)
                              + PMI (if applicable: Loan Amount × PMI Rate / 12)
                              + HOA
Monthly Other Debt          = Σ(debt row amounts)
Monthly Living Expenses     = Σ(category inputs)
Total Required Outflow      = Housing + Other Debt + Living Expenses

Monthly Surplus (or Deficit) = Net Monthly Income − Total Required Outflow
```

### 2c. Debt-to-Income Ratios

All DTI ratios use **Gross Monthly Income** as denominator (industry standard — DTI is always against gross, not net).

| Metric | Formula | Traditional Guideline | Modern Lending |
|---|---|---|---|
| Front-End DTI | Housing / Gross Monthly × 100 | ≤ 28% comfortable | Up to 31% (FHA), 36% (conventional) |
| Back-End DTI | (Housing + Other Debt) / Gross Monthly × 100 | ≤ 36% comfortable | Up to 43% (QM limit), 45-50% (with compensating factors) |
| Total Obligation Ratio | (Housing + Debt + Living) / Net Monthly × 100 | — | Informational only; shows budget tightness |

**Threshold color coding** (used in metric cards and header score):

| Range (Back-End DTI) | Color | Label |
|---|---|---|
| 0% – 36% | Green (#27ae60) | Comfortable |
| 36.1% – 43% | Yellow (#f1c40f) | Stretch |
| 43.1% – 50% | Orange (#e67e22) | Aggressive |
| > 50% | Red (#e74c3c) | Over-extended |

### 2d. Annual Percentage Breakdown

Each bucket as `% of Gross Annual Income` (must sum to 100%):

```
Tax %         = Effective Tax Rate
Housing %     = (Monthly Housing × 12) / Annual Salary × 100
Debt %        = (Monthly Other Debt × 12) / Annual Salary × 100
Living %      = (Monthly Living × 12) / Annual Salary × 100
Surplus %     = 100 - Tax% - Housing% - Debt% - Living%
```

If Surplus % is negative, it means the household is spending more than gross income (deficit).

### 2e. 50/30/20 Benchmark Comparison

Using **Net Monthly Income** (after tax) as the baseline:

```
50/30/20 Needs Target     = Net Monthly × 0.50
50/30/20 Wants Target     = Net Monthly × 0.30
50/30/20 Savings Target   = Net Monthly × 0.20

Actual Needs              = Housing + Other Debt + Groceries + Utilities + Transportation + Healthcare + Childcare
Actual Wants              = Internet/Phone/Subs + Personal/Entertainment + Other/Misc
Actual Savings/Investment = Monthly Surplus + Savings input
```

Displayed as a simple comparison: `Needs: $X,XXX / $Y,YYY target (XX%)` with over/under indicator.

### 2f. Sankey Flow Data Generation

The calculation function must produce an array of `{from, to, flow}` objects for the Sankey chart. This is derived directly from the budget waterfall (2b). The flow data is generated as follows:

```javascript
function buildSankeyFlows(output) {
    const flows = [];

    // ── Column 0 → 1: Income Sources → Gross Income ──
    // For now, single source. Extensible if user adds side income later.
    flows.push({ from: 'salary', to: 'gross_income', flow: output.grossMonthly });

    // ── Column 1 → 2: Gross Income → Tax & Net Income ──
    flows.push({ from: 'gross_income', to: 'taxes',      flow: output.monthlyTaxes });
    flows.push({ from: 'gross_income', to: 'net_income',  flow: output.netMonthly });

    // ── Column 2 → 3: Net Income → Spending Buckets ──
    if (output.monthlyHousing > 0)
        flows.push({ from: 'net_income', to: 'housing',   flow: output.monthlyHousing });
    if (output.monthlyDebt > 0)
        flows.push({ from: 'net_income', to: 'debt',      flow: output.monthlyDebt });
    if (output.monthlyLiving > 0)
        flows.push({ from: 'net_income', to: 'living',    flow: output.monthlyLiving });
    if (output.monthlySurplus > 0)
        flows.push({ from: 'net_income', to: 'surplus',   flow: output.monthlySurplus });
    // Deficit case: net income is fully consumed, no surplus node

    // ── Column 3 → 4: Spending Buckets → Sub-categories ──

    // Housing sub-categories
    if (output.monthlyPI > 0)
        flows.push({ from: 'housing', to: 'mortgage_pi',   flow: output.monthlyPI });
    if (output.monthlyPropTax > 0)
        flows.push({ from: 'housing', to: 'property_tax',  flow: output.monthlyPropTax });
    if (output.monthlyInsurance > 0)
        flows.push({ from: 'housing', to: 'insurance',     flow: output.monthlyInsurance });
    if (output.monthlyPMI > 0)
        flows.push({ from: 'housing', to: 'pmi',           flow: output.monthlyPMI });
    if (output.monthlyHOA > 0)
        flows.push({ from: 'housing', to: 'hoa',           flow: output.monthlyHOA });

    // Debt sub-categories (each user-defined row)
    for (const row of output.debtRows) {
        if (row.amount > 0)
            flows.push({ from: 'debt', to: 'debt_' + row.id, flow: row.amount });
    }

    // Living expense sub-categories
    for (const cat of output.livingCategories) {
        if (cat.amount > 0)
            flows.push({ from: 'living', to: 'living_' + cat.key, flow: cat.amount });
    }

    // Filter out any flows with flow <= 0 (safety net)
    return flows.filter(f => f.flow > 0);
}
```

### 2g. Investment Growth Projection

Month-by-month compound growth:

```
monthlyReturn = (1 + annualReturn)^(1/12) - 1

For each month m (1 to horizon × 12):
  nominalBalance[m] = nominalBalance[m-1] × (1 + monthlyReturn) + monthlySurplus
  contributions[m]  = contributions[m-1] + monthlySurplus
  realBalance[m]    = nominalBalance[m] / (1 + annualInflation)^(m/12)
```

If `monthlySurplus ≤ 0`, the projection shows a flat line at the existing balance (or declining if there's a deficit eating into savings). A warning note is displayed: "No surplus available to invest."

### 2h. Max Affordable Home Price (Back-calculation)

Given the user's income, debts, and a target front-end DTI of 28%:

```
maxMonthlyHousing = Gross Monthly Income × 0.28
```

Because property tax and insurance are percentages of home price, this requires solving:

```
maxPrice × (propertyTaxRate + insuranceRate + pmiRate?) / 12 + PI(maxPrice × (1 - downPayment%)) + HOA = grossMonthly × 0.28
```

This is solved iteratively (binary search over home price range $0–$5M, converging within 20 iterations). The iterative approach is simpler and consistent with the existing codebase style.

---

## 3. Dashboard Visualizations

### Sticky Header (Affordability Score)

Matches the gradient header pattern from `investment.html` and `rental-analysis.html`:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ██ Budget & Living Costs                  ┆  AFFORDABILITY    ┆  Score    │
│  ██ Comprehensive monthly budget           ┆  CONTEXT          ┆           │
│  ██ analysis for homeownership decisions   ┆  (dynamic text)   ┆  COMFORTABLE │
│                                            ┆                   ┆  32.1% DTI   │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Left**: Page title and subtitle
- **Center**: Dynamic guidance text (changes based on score, like the investment pages)
- **Right**: Affordability score badge with back-end DTI and label

**Score tiers** (based on back-end DTI + surplus status):

| Condition | Score Label | Badge Color |
|---|---|---|
| Back-end DTI ≤ 36% AND surplus > 0 | COMFORTABLE | Green (#6ee7b7) |
| Back-end DTI 36–43% AND surplus ≥ 0 | STRETCH | Yellow (#fbbf24) |
| Back-end DTI 43–50% OR surplus < 0 | AGGRESSIVE | Orange (#fb923c) |
| Back-end DTI > 50% OR large deficit | OVER-EXTENDED | Red (#f87171) |

**Guidance text** changes dynamically, similar to the investment pages. Examples:
- COMFORTABLE: "Your housing costs leave healthy room for savings and unexpected expenses. At {DTI}% back-end DTI, you're well within conventional lending guidelines and have ${surplus}/mo for investing."
- STRETCH: "This home is within lending limits but leaves limited buffer. At {DTI}% DTI, you qualify but may feel constrained. Consider whether {max affordable price} is a more comfortable target."
- AGGRESSIVE: "This scenario pushes past the qualified mortgage limit of 43% DTI. Lenders may still approve with compensating factors, but budget flexibility is minimal."
- OVER-EXTENDED: "Monthly obligations exceed what this income can sustainably support. Housing costs alone consume {front-end DTI}% of gross income. The maximum affordable home at your income is approximately {max price}."

### Block 1 — Summary Metric Cards

A horizontal grid of 5 cards (matching `.metrics-grid` / `.metric-card` pattern from existing pages):

| Card | Value | Subtext | Border Color Logic |
|---|---|---|---|
| Gross Monthly Income | `$X,XXX` | "Before taxes" | Neutral (#667eea) |
| Monthly Take-Home | `$X,XXX` | "After {rate}% effective tax" | Neutral (#667eea) |
| Monthly Surplus / Deficit | `$X,XXX` or `-$X,XXX` | "Available to save or invest" | Green if > 0, Red if < 0 |
| Front-End DTI | `XX.X%` | "Housing / Gross Income" | Green ≤ 28%, Yellow 28-36%, Red > 36% |
| Back-End DTI | `XX.X%` | "All Debt / Gross Income" | Green ≤ 36%, Yellow 36-43%, Red > 43% |

### Block 2 — Income Flow Diagram (Sankey) + Breakdown Table

This is the centerpiece visualization. A multi-column Sankey/alluvial flow chart shows every dollar of gross monthly income flowing from left to right through spending categories into granular sub-items.

#### Sankey Chart Structure

**5 columns, left to right:**

```
Col 0           Col 1           Col 2           Col 3              Col 4
Income Source → Gross Income → Tax / Net    → Spending Buckets → Sub-categories

                                ┌─ Taxes ──────────────────────────────────────
                                │
Salary ─────── Gross ───────────┤              ┌─ Mortgage P&I
($10,000)      Income           │  ┌─ Housing ─┤─ Property Tax
               ($10,000)        │  │  ($2,590)  ├─ Insurance
                                │  │            └─ PMI / HOA
                                ├──┤
                                │  │            ┌─ Auto Loan
                                │  ├─ Debt ─────┤
                                │  │  ($750)    └─ Student Loan
                                │  │
                                └──┤            ┌─ Groceries
                                   │            ├─ Utilities
                                   ├─ Living ───┤─ Transport
                                   │  ($2,535)  ├─ Healthcare
                                   │            ├─ Entertainment
                                   │            └─ Other
                                   │
                                   └─ Surplus
                                      ($1,925)
```

#### Chart.js Sankey Configuration

```javascript
// CDN: https://cdn.jsdelivr.net/npm/chartjs-chart-sankey
// Auto-registers with Chart.js when script loads

const sankeyChart = new Chart(ctx, {
    type: 'sankey',
    data: {
        datasets: [{
            data: output.sankeyFlows, // Array of {from, to, flow} objects
            // Human-readable labels for node IDs
            labels: {
                salary:        'Salary',
                gross_income:  'Gross Income',
                taxes:         'Taxes',
                net_income:    'Net Income',
                housing:       'Housing',
                debt:          'Other Debt',
                living:        'Living Expenses',
                surplus:       'Surplus',
                // Sub-category labels
                mortgage_pi:   'Mortgage P&I',
                property_tax:  'Property Tax',
                insurance:     'Insurance',
                pmi:           'PMI',
                hoa:           'HOA',
                // Debt rows: dynamic labels from user input
                // Living categories: dynamic labels
                ...output.sankeyDynamicLabels
            },
            // Node color: color of the rectangle at each node
            colorFrom: (c) => getNodeColor(c.dataset.data[c.dataIndex].from),
            colorTo:   (c) => getNodeColor(c.dataset.data[c.dataIndex].to),
            colorMode: 'gradient', // Flows gradient from source → destination color
            // Force column positions for predictable layout
            column: {
                salary:       0,
                gross_income: 1,
                taxes:        2,
                net_income:   2,
                housing:      3,
                debt:         3,
                living:       3,
                surplus:      3,
                // All sub-categories at column 4
                mortgage_pi:  4, property_tax: 4, insurance: 4,
                pmi: 4, hoa: 4,
                // Debt sub-items: column 4
                // Living sub-items: column 4
                ...output.sankeyDynamicColumns
            },
            // Vertical ordering priority (lower = higher on screen)
            priority: {
                salary:       0,
                gross_income: 0,
                taxes:        0,
                net_income:   1,
                housing:      0,
                debt:         1,
                living:       2,
                surplus:      3,
                // Sub-categories ordered within their group
                mortgage_pi: 0, property_tax: 1, insurance: 2,
                pmi: 3, hoa: 4,
                ...output.sankeyDynamicPriority
            },
            // Border width for node rectangles
            borderWidth: 0,
            nodeWidth: 20,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const item = context.dataset.data[context.dataIndex];
                        const pct = ((item.flow / output.grossMonthly) * 100).toFixed(1);
                        return `${formatCurrency(item.flow)}/mo (${pct}% of gross)`;
                    }
                }
            },
            legend: { display: false }
        }
    }
});
```

#### Node Color Scheme

Each node gets a consistent color that carries through to its flows:

| Node | Color | Hex |
|---|---|---|
| Salary / Gross Income | Blue | #667eea |
| Taxes | Slate gray | #94a3b8 |
| Net Income | Indigo | #818cf8 |
| Housing (and sub-items) | Indigo | #6366f1 |
| Other Debt (and sub-items) | Orange | #f97316 |
| Living Expenses (and sub-items) | Teal | #14b8a6 |
| Surplus | Green | #22c55e |
| Deficit (if present, replaces surplus) | Red | #ef4444 |

The `colorMode: 'gradient'` setting means each flow band transitions smoothly from the source node color to the destination node color, creating the characteristic alluvial look.

#### Deficit Handling

When `monthlySurplus < 0`, the Sankey handles this as follows:

- No "Surplus" node is rendered (no flow to it).
- The total outflow from `net_income` exceeds the flow into `net_income`, which the Sankey plugin handles by sizing nodes proportionally. The spending nodes will visually appear larger than the net income node, making the overspend immediately apparent.
- A red **"DEFICIT: -$X,XXX/mo"** warning badge is overlaid on the chart area (positioned absolutely in the top-right corner of the chart container).
- The breakdown table shows the deficit as a negative red row at the bottom.

#### Dynamic Node Generation

Because debt rows and living expense categories are user-configurable, the Sankey node IDs, labels, columns, and priorities are generated dynamically in the calculation function:

```javascript
// Generate dynamic labels, columns, and priorities
output.sankeyDynamicLabels = {};
output.sankeyDynamicColumns = {};
output.sankeyDynamicPriority = {};

// Debt rows
output.debtRows.forEach((row, i) => {
    const id = 'debt_' + row.id;
    output.sankeyDynamicLabels[id] = row.label || `Debt ${i + 1}`;
    output.sankeyDynamicColumns[id] = 4;
    output.sankeyDynamicPriority[id] = i;
});

// Living expense categories
const livingKeys = [
    { key: 'groceries',     label: 'Groceries' },
    { key: 'utilities',     label: 'Utilities' },
    { key: 'internet',      label: 'Internet/Phone' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'healthcare',    label: 'Healthcare' },
    { key: 'childcare',     label: 'Childcare' },
    { key: 'entertainment', label: 'Entertainment' },
    { key: 'savings',       label: 'Savings' },
    { key: 'other',         label: 'Other/Misc' },
];
livingKeys.forEach((cat, i) => {
    const id = 'living_' + cat.key;
    output.sankeyDynamicLabels[id] = cat.label;
    output.sankeyDynamicColumns[id] = 4;
    output.sankeyDynamicPriority[id] = i;
});
```

#### Chart Container Sizing

The Sankey chart needs generous vertical space to render clearly with many sub-category nodes:

```css
.sankey-container {
    position: relative;
    width: 100%;
    height: 500px;      /* Desktop: tall enough for ~15 sub-category nodes */
    min-height: 400px;
    margin-bottom: 20px;
}

@media (max-width: 768px) {
    .sankey-container {
        height: 600px;   /* Taller on mobile where width is constrained */
    }
}
```

#### 50/30/20 Benchmark (below the Sankey)

A compact 3-row comparison strip below the Sankey chart:

```
┌────────────────────────────────────────────────────────────┐
│  50/30/20 BUDGET BENCHMARK (vs. Net Income)                │
│                                                            │
│  Needs (50%)      $5,875 / $3,900 target    ▲ 51% over    │
│  Wants (30%)        $507 / $2,340 target    ▼ 78% under   │
│  Savings (20%)    $1,925 / $1,560 target    ▲ 23% over    │
└────────────────────────────────────────────────────────────┘
```

Color-coded: green if at or under target for needs/wants, green if at or over target for savings. Styled as a `.highlight-box` with a neutral left border.

#### Breakdown Table (below the benchmark)

Full granular table with columns: **Category | Monthly | Annual | % of Gross**.

Table rows are the full list (all individual categories), grouped under section headers with subtotals:

```
TAXES                             $2,200    $26,400    22.0%

HOUSING
  Mortgage P&I                    $2,023    $24,276    20.2%
  Property Tax                      $400     $4,800     4.0%
  Insurance                         $167     $2,004     1.7%
  PMI                                $0         $0     0.0%
  HOA                                $0         $0     0.0%
  ─── Subtotal                    $2,590    $31,080    25.9%

OTHER DEBT
  Auto Loan                         $450     $5,400     4.5%
  Student Loan                      $300     $3,600     3.0%
  ─── Subtotal                      $750     $9,000     7.5%

LIVING EXPENSES
  Groceries / Food                  $780     $9,360     7.8%
  Utilities                         $312     $3,744     3.1%
  Internet / Phone                  $195     $2,340     2.0%
  Transportation                    $507     $6,084     5.1%
  Healthcare                        $234     $2,808     2.3%
  Childcare                          $0         $0     0.0%
  Entertainment                     $312     $3,744     3.1%
  Savings                            $0         $0     0.0%
  Other / Misc                      $195     $2,340     2.0%
  ─── Subtotal                    $2,535    $30,420    25.4%

───────────────────────────────────────────────────────
TOTAL OUTFLOW                     $8,075    $96,900    80.8%
SURPLUS                           $1,925    $23,100    19.2%
───────────────────────────────────────────────────────
GROSS INCOME                     $10,000   $120,000   100.0%
```

Rows with $0 values are dimmed (opacity: 0.4) but not hidden, so the user knows the category exists.

### Block 3 — Investment Growth Projection (Line Chart)

Visible only when the investment toggle is ON and surplus > $0.

Chart.js **line chart** with:

- **X-axis**: Years (0 to horizon)
- **Y-axis**: Portfolio value ($)
- **Dataset 1** (solid green, `#22c55e`): Nominal portfolio growth
- **Dataset 2** (solid teal, dashed, `#14b8a6`): Real (inflation-adjusted) portfolio value
- **Dataset 3** (dashed gray, `#9ca3af`): Contributions only (no growth) — shows compounding effect
- **Fill**: Shaded area between Dataset 1 and Dataset 3 in light green

Tooltip shows all three values on hover. Legend displayed below chart.

**Milestone table** below the chart (matching existing table styling):

| Year | Contributions | Portfolio (Nominal) | Portfolio (Real) | Investment Gains | Growth Multiple |
|---|---|---|---|---|---|
| 5 | $115,500 | $138,612 | $119,600 | $23,112 | 1.20x |
| 10 | $231,000 | $320,441 | $238,400 | $89,441 | 1.39x |
| 15 | ... | ... | ... | ... | ... |
| 20 | ... | ... | ... | ... | ... |

Display years at 5-year intervals up to horizon. If horizon is not a multiple of 5, the final year is always included.

### Block 4 — Affordability Verdict

A section styled like the `.highlight-box` from existing pages, but with color that changes based on verdict:

**Green verdict** (DTI ≤ 36%, surplus > 0):
> **You can comfortably afford this home.** Your back-end DTI of 32.1% is within the traditional 36% guideline, and you have $1,925/month in surplus for saving and investing. At current rates, your max affordable home price is approximately $485,000.

**Yellow verdict** (DTI 36–43%):
> **This home is a stretch.** Your back-end DTI of 39.4% exceeds the traditional 36% guideline but remains within the qualified mortgage limit of 43%. Monthly breathing room is $XXX before hitting 43%. Consider whether a home price of $XXX (at 36% DTI) would be more comfortable.

**Red verdict** (DTI > 43% or deficit):
> **This home exceeds your sustainable budget.** Your back-end DTI of 48.2% is above the qualified mortgage limit. You would need to increase household income to $XXX/year, or target a home price of $XXX or less to reach 36% DTI.

Below the verdict box:

| Metric | Value |
|---|---|
| Max Affordable Home Price (28% front-end DTI) | $XXX,XXX |
| Max Affordable Home Price (36% back-end DTI) | $XXX,XXX |
| Monthly Breathing Room (to 43% QM limit) | $X,XXX |
| Recommended Emergency Fund (3 months) | $XX,XXX |
| Recommended Emergency Fund (6 months) | $XX,XXX |

---

## 4. Page Architecture

| Concern | Decision | Rationale |
|---|---|---|
| File | `budget.html` | Self-contained, consistent with other pages |
| Theme | Light mode | Matches `investment.html` and `rental-analysis.html` |
| CSS | Embedded `<style>` block, **no Tailwind** | `investment.html` and `rental-analysis.html` use embedded CSS. Tailwind is only on `index.html`. Matching the analysis page pattern. |
| Font | System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Matches existing analysis pages |
| JS | Single inline `<script>` block at bottom of `<body>` | Consistent with existing pages. No external JS file. |
| Charts | Chart.js 4.x CDN + chartjs-plugin-datalabels CDN + **chartjs-chart-sankey CDN** | Sankey plugin is new; the other two are already used across the project |
| Layout | `.content` flex container: `.inputs` (350px sidebar) + `.sidebar-toggle` button + `.results` (flex: 1) | Mirrors `rental-analysis.html` layout |
| Max width | 1400px `.container` | Matches existing pages |
| Sidebar scroll | `max-height: calc(100vh - 180px)`, `overflow-y: auto` | Matches existing pages |
| Mobile breakpoint | 768px | Sidebar becomes fixed overlay with toggle button (matches `rental-analysis.html`) |

### CDN Script Tags

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-sankey"></script>
```

The `chartjs-chart-sankey` plugin auto-registers its `SankeyController` and `Flow` element with Chart.js when the script loads. No manual `Chart.register()` call is needed when using the UMD bundle via CDN.

### Key CSS Classes to Reuse

These are defined identically across `investment.html` and `rental-analysis.html` and should be copied:

- `.nav-bar`, `.nav-links`, `.nav-links a`, `.nav-links a.active`
- `.container`, `.header`, `.header-content`, `.savvy-score`, `.savvy-label`, `.savvy-value`, `.savvy-subtext`
- `.guidance-content`, `.guidance-title`, `.guidance-text`
- `.content`, `.inputs`, `.inputs.collapsed`, `.sidebar-toggle`, `.results`
- `.input-section`, `.input-group`, `.key-input`
- `.metrics-grid`, `.metric-card`, `.metric-card.positive`, `.metric-card.negative`
- `.metric-label`, `.metric-value`, `.metric-subtext`
- `.section-title`, `.table-container`, `table`, `th`, `td`
- `.positive-value`, `.negative-value`, `.currency`
- `.highlight-box`

### JS Structure

```javascript
// 1. DOM references (cached on load)
// 2. Chart instances: let sankeyChartInstance = null; let investmentChartInstance = null;
// 3. Debt rows state: let debtRows = [{id: 0, label: '', amount: 0}]; let nextDebtId = 1;
// 4. getValues() — reads all inputs + debt rows into a flat object
// 5. calculate(values) — pure function, returns full output object including sankeyFlows[]
// 6. Rendering functions:
//    - renderMetricCards(output)
//    - renderSankeyChart(output)       ← NEW: replaces renderDoughnutChart + renderAllocationBar
//    - renderBenchmark(output)
//    - renderBreakdownTable(output)
//    - renderInvestmentChart(output)
//    - renderMilestoneTable(output)
//    - renderVerdict(output)
//    - updateHeader(output)
// 7. Event listeners: all inputs → calculate → render
// 8. Debt row management: addDebtRow(label?), removeDebtRow(id), renderDebtRows()
// 9. Init: calculate + render on DOMContentLoaded

// Currency formatter (same as existing pages)
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
}

// Node color lookup for Sankey
function getNodeColor(nodeId) {
    const colors = {
        salary: '#667eea', gross_income: '#667eea',
        taxes: '#94a3b8',
        net_income: '#818cf8',
        housing: '#6366f1', mortgage_pi: '#6366f1', property_tax: '#6366f1',
        insurance: '#6366f1', pmi: '#6366f1', hoa: '#6366f1',
        debt: '#f97316',     // All debt_* nodes also get this color
        living: '#14b8a6',   // All living_* nodes also get this color
        surplus: '#22c55e',
    };
    if (colors[nodeId]) return colors[nodeId];
    if (nodeId.startsWith('debt_')) return '#f97316';
    if (nodeId.startsWith('living_')) return '#14b8a6';
    return '#94a3b8';
}
```

---

## 5. Interaction Behaviors

- **Real-time recalculation**: Every `input` event on any field triggers `calculate()` + full re-render. No debounce (consistent with existing pages; calculations are pure arithmetic and complete in < 1ms).
- **Slider ↔ Number sync**: Bidirectional binding on every slider+number pair. Slider `input` → update number value → `calculate()`. Number `input` → update slider value → `calculate()`.
- **Computed helper values**: Dollar amounts displayed inline next to percentage sliders update on every recalc (e.g., down payment % shows "$80,000", interest rate shows "$2,023/mo").
- **Debt row management**: "Add" chips insert a new row. "X" button removes a row. All rows trigger recalc on amount change. Each row gets a unique `id` (incrementing counter, never reused) for stable Sankey node identity.
- **PMI auto-disable**: When down payment ≥ 20%, the PMI slider and number input are visually grayed out (`opacity: 0.4`, `pointer-events: none`) and PMI is excluded from calculations.
- **Sankey flow animation**: As the user adjusts inputs, the Sankey redraws and flow widths change proportionally. The surplus vein visually shrinks as expenses grow — providing the visceral "can I afford this?" feedback. When surplus reaches zero, the green vein disappears entirely.
- **"Reset to Suggested" button**: In Section D, recalculates living expense defaults based on current income/tax rate. Only fires on explicit click (preserves user edits).
- **Investment section toggle**: Collapsing the section hides Block 3 entirely. The surplus node in the Sankey is labeled "Surplus" instead of "Investable" when the toggle is off.
- **Chart instance management**: All Chart.js instances (Sankey + line chart) are destroyed and recreated on each render cycle to prevent memory leaks (consistent with existing pages).

---

## 6. Navigation Integration

Add "Budget & Living Costs" to the nav bar on all pages:

**On `index.html`** (dark nav bar):
```html
<div class="nav-bar">
    <a href="index.html" class="active">Buy vs Rent Simulator</a>
    <a href="budget.html">Budget & Living Costs</a>
    <a href="investment.html">Investment Analysis</a>
</div>
```

**On `investment.html` and `rental-analysis.html`** (inside `.nav-links`):
```html
<div class="nav-links">
    <a href="index.html">Buy vs. Rent Calculator</a>
    <a href="budget.html">Budget & Living Costs</a>
    <a href="rental-analysis.html">Short-Term Rental Analysis</a>
</div>
```

**On `budget.html`**:
```html
<div class="nav-links">
    <a href="index.html">Buy vs. Rent Calculator</a>
    <a href="budget.html" class="active">Budget & Living Costs</a>
    <a href="rental-analysis.html">Short-Term Rental Analysis</a>
</div>
```

Note: The nav bars across existing pages are not fully consistent (index.html links to investment.html but not rental-analysis.html in the top nav; rental-analysis.html links to index.html but not investment.html). The budget page integration is an opportunity to normalize navigation, but that normalization is out of scope for this spec — it should be handled separately.
