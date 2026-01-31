# Budget Living Costs Page — Specification

## Purpose

A "How much can we afford?" visualizer. The user enters household income and a target home price (or mortgage parameters), and the page renders a unified dashboard showing where every dollar goes monthly, what percentage of annual income each category consumes, whether the debt-to-income ratio is healthy, and how any surplus could grow if invested over time.

---

## 1. Inputs

The page uses a **left sidebar / right dashboard** layout consistent with `investment.html` and `rental-analysis.html` (light theme, collapsible sidebar on mobile).

### Section A — Household Income

| Field | Type | Default | Notes |
|---|---|---|---|
| Gross Annual Household Salary | currency input | $120,000 | Primary driver for all ratios |
| Filing Status | dropdown | Married Filing Jointly | Single, MFJ, MFS, HoH — drives effective tax estimate |
| Estimated Effective Tax Rate | slider + number | 22% | Auto-suggested from filing status + income bracket, but user-overridable |
| Monthly Take-Home Pay | **computed, read-only** | — | `(Annual Salary × (1 - Tax Rate)) / 12` — displayed prominently |

### Section B — Housing Cost (Mortgage Baseline)

| Field | Type | Default | Notes |
|---|---|---|---|
| Home Price | currency input | $400,000 | |
| Down Payment % | slider + number | 20% | |
| Loan Interest Rate % | slider + number | 6.5% | |
| Loan Term | dropdown | 30 years | 15 / 20 / 30 |
| Property Tax Rate % | slider + number | 1.2% | Of home value, annualized |
| Homeowner's Insurance % | slider + number | 0.5% | Of home value, annualized |
| PMI Rate % | slider + number | 0.5% | Only enabled when down payment < 20% |
| HOA / month | currency input | $0 | |
| **Total Monthly Housing Cost** | **computed, read-only** | — | P&I + tax + insurance + PMI + HOA |

### Section C — Other Monthly Debts

Repeatable row group (add/remove rows) with presets:

| Field | Type | Default |
|---|---|---|
| Debt Label | text | e.g. "Auto Loan" |
| Monthly Payment | currency input | $0 |

Presets shown as quick-add chips: **Auto Loan, Student Loan, Credit Card Min, Personal Loan, Child Support / Alimony, Other**.

A **Total Other Monthly Debt** line is computed below.

### Section D — Monthly Living Expenses

Category-based inputs with sensible defaults derived from national averages (scaled to income):

| Category | Default | Notes |
|---|---|---|
| Groceries / Food | $800 | |
| Utilities (Electric, Gas, Water, Trash) | $300 | |
| Internet / Phone / Subscriptions | $200 | |
| Transportation (Gas, Maintenance, Insurance) | $500 | |
| Healthcare / Medical | $200 | |
| Childcare / Education | $0 | |
| Personal / Entertainment | $300 | |
| Savings Contribution (non-investment) | $0 | Emergency fund, etc. |
| Other / Miscellaneous | $200 | |

A **Total Monthly Living Expenses** line is computed.

### Section E — Investment Assumptions (optional, collapsible)

| Field | Type | Default | Notes |
|---|---|---|---|
| Enable Investment Growth Projection | toggle | ON | Controls whether the growth chart renders |
| Expected Annual Return % | slider + number | 7% | Pre-tax market return |
| Investment Time Horizon | slider + number | 20 years | |
| Existing Investment Balance | currency input | $0 | Starting portfolio value |

---

## 2. Core Calculations

All calculations run on every input change (same reactive pattern as the existing pages).

### 2a. Monthly Budget Waterfall

```
Gross Monthly Income        = Annual Salary / 12
Taxes                       = Gross Monthly × Effective Tax Rate
Net Monthly Income          = Gross Monthly − Taxes

Total Housing               = P&I + Tax + Insurance + PMI + HOA
Total Other Debt            = Σ(debt payments)
Total Living Expenses       = Σ(category expenses)
Total Required Outflow      = Housing + Other Debt + Living Expenses

Monthly Surplus (or Deficit) = Net Monthly Income − Total Required Outflow
```

If surplus is negative, it is flagged as a **deficit** with red styling and warning messaging.

### 2b. Annual Percentage Breakdown

Each cost bucket expressed as `% of Gross Annual Income`:

- Federal/State Tax estimate
- Housing (broken into sub-components)
- Other Debt
- Living Expenses (broken into sub-categories)
- Surplus / Investable

These must sum to 100% of gross income.

### 2c. Debt-to-Income Ratios

| Metric | Formula | Healthy Threshold |
|---|---|---|
| Front-End DTI (Housing) | Total Housing / Gross Monthly | ≤ 28% (green), 28–36% (yellow), > 36% (red) |
| Back-End DTI (All Debt) | (Housing + Other Debt) / Gross Monthly | ≤ 36% (green), 36–43% (yellow), > 43% (red) |
| Total Obligation Ratio | (Housing + Debt + Living) / Net Monthly | informational — shows how "tight" the budget is |

### 2d. Investment Growth Projection (when enabled)

Month-by-month compound growth of the monthly surplus:

```
For each month m (1 to horizon × 12):
  balance[m] = balance[m-1] × (1 + monthlyReturn) + monthlySurplus
```

Where `monthlyReturn = (1 + annualReturn)^(1/12) - 1`.

Key outputs: **balance at 5, 10, 15, 20, 25, 30 years** (up to horizon).

---

## 3. Dashboard Visualizations

The right panel contains four major visualization blocks, top to bottom:

### Block 1 — Summary Metric Cards (top row)

A horizontal card strip (4 cards):

| Card | Value | Color Logic |
|---|---|---|
| Monthly Take-Home | formatted currency | neutral (blue) |
| Monthly Surplus / Deficit | formatted currency | green if positive, red if negative |
| Front-End DTI | X.X% | green / yellow / red per thresholds |
| Back-End DTI | X.X% | green / yellow / red per thresholds |

### Block 2 — Monthly Cost Breakdown (Doughnut + Table)

**Left**: A Chart.js **doughnut chart** with center text showing total monthly outflow. Segments:

- Taxes
- Mortgage P&I
- Property Tax
- Insurance
- PMI (if applicable)
- HOA (if applicable)
- Other Debts (aggregated)
- Groceries / Food
- Utilities
- Internet / Phone / Subscriptions
- Transportation
- Healthcare
- Childcare
- Personal / Entertainment
- Savings
- Other / Misc
- **Surplus** (shown as a green segment if positive)

**Right**: A table mirroring the chart with columns: **Category | Monthly $ | Annual $ | % of Gross Income**. Rows sorted largest to smallest. A bold total row at the bottom.

### Block 3 — Annual Income Allocation (Stacked Horizontal Bar)

A single **100% stacked horizontal bar** chart showing where every dollar of gross annual income goes, grouped into 5 macro-buckets:

1. **Taxes** (gray)
2. **Housing** (blue)
3. **Debt** (orange)
4. **Living Expenses** (teal)
5. **Surplus / Investable** (green) — or **Deficit** (red)

Labels show both dollar amount and percentage on hover. This is the "single-glance affordability" view.

### Block 4 — Investment Growth Projection (Line Chart)

Visible only when the investment toggle is ON and surplus > 0.

A Chart.js **line chart** with:

- **X-axis**: Years (0 to horizon)
- **Y-axis**: Portfolio value ($)
- **Line 1** (solid green): Portfolio growth with monthly surplus contributions
- **Line 2** (dashed gray): Total contributions only (no growth) — shows the power of compounding
- **Shaded area** between the two lines representing investment gains

Milestone markers at 5-year intervals showing the balance.

Below the chart, a **milestone table**:

| Year | Total Contributed | Portfolio Value | Investment Gains | Growth Multiple |
|---|---|---|---|---|
| 5 | $XX | $XX | $XX | X.Xx |
| 10 | ... | ... | ... | ... |
| ... | | | | |

### Block 5 — Affordability Gauge / What-If Summary

A dedicated section at the bottom with contextual guidance:

- **"You can afford this home"** (green) / **"This home is a stretch"** (yellow) / **"This home exceeds your budget"** (red) — based on DTI thresholds and surplus status.
- **Max affordable home price** (back-calculated): Given current income, debts, expenses, and a target 28% front-end DTI, what is the maximum home price?
- **Monthly breathing room**: How much buffer exists between actual DTI and the 36% back-end threshold, expressed in dollars.
- **Recommended emergency fund target**: 3–6 months of total required outflow.

---

## 4. Page-Level Architecture

| Concern | Approach |
|---|---|
| File | `budget.html` (self-contained like other pages) |
| Theme | Light mode, matching `investment.html` styling |
| Layout | Collapsible left sidebar (inputs) + scrollable right dashboard (outputs) |
| JS | Inline `<script>` block (consistent with existing pages) |
| Charts | Chart.js 4.x + chartjs-plugin-datalabels (already in CDN) |
| CSS | Tailwind CDN + embedded `<style>` block for custom elements |
| Navigation | Added to the shared navbar on all pages |
| Responsiveness | Sidebar collapses to top on mobile; charts stack vertically; metric cards wrap to 2×2 grid |

## 5. Interaction Behaviors

- **Real-time recalculation**: Every input change triggers full recalc + chart redraw (debounced at 150ms).
- **Debt rows**: Add/remove dynamically. Quick-add chips pre-fill the label.
- **Surplus color shift**: As the user adjusts home price upward, the surplus segment in the doughnut shrinks and changes from green → yellow → red → deficit, giving visceral feedback.
- **Income bracket auto-suggest**: When filing status or income changes, the effective tax rate slider updates to a suggested value (user can still override).
- **Collapsible investment section**: Defaults to open. When toggled off, Block 4 hides and the surplus segment in the doughnut is labeled "Surplus" instead of "Investable."
- **URL state persistence**: Key inputs encoded in URL query params so the page state is shareable/bookmarkable (stretch goal).

## 6. Navigation Integration

Add "Budget & Living Costs" link to the sticky navbar on all four pages (`index.html`, `investment.html`, `rental-analysis.html`, `budget.html`), positioned between the main simulator and investment analysis links.
