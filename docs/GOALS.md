# 💰 Feature: Goals / Savings (Percent of Income)

> Before implementation, **ask Cursor to create the Data Model** for this feature based on the user story below.  
> The model should include goals, contributions, progress tracking, and references to income transactions.

---

## 🎯 User Story

**As a** user  
**I want** to create multiple savings goals and assign a % of my monthly income to each  
**So that** the app automatically forecasts when I’ll reach each goal and shows my progress.

---

## 🧩 Problem / Context

Users often struggle to save consistently and to understand how long it will take to reach a goal.  
This feature allows them to automatically allocate a portion of their income and visualize their progress over time.

---

## 💡 Scope (MVP)

- Create, edit, delete goals
- Set **Target Amount**, **Starting Balance**, **Priority**, and **% of income**
- Auto-calculate **Monthly Contribution**, **ETA (time to reach goal)**, and **Progress %**
- Support multiple goals concurrently (with total allocation ≤ 100%)
- Update progress monthly based on income recorded in the app

---

## 🧮 Core Calculations

- **Monthly Income Basis:**
  - Default: rolling average of last 3 months of total income
  - Fallback: user’s “expected income” (manual entry)
- **Monthly Contribution:**  
  `monthly_contribution = income_basis * (percent / 100)`
- **Remaining Amount:**  
  `remaining = target_amount - current_balance`
- **Months to Goal:**  
  `months_to_goal = remaining / monthly_contribution`
- **Progress:**  
  `progress_pct = (current_balance / target_amount) * 100`

If total allocation across all active goals > 100%, block saving with an error.  
If monthly income = 0, contribution = 0 and ETA recalculates next month.

---

## ⚖️ Business Rules

1. **Allocation Cap:** Total % across all active goals ≤ 100%.
2. **Income Source:** Based on categorized income transactions (Salary, Freelance, Investments).
3. **Priority:** If “Auto Rebalance” is ON, distribute contributions based on priority (High → Medium → Low).
4. **Manual Top-ups & Withdrawals:** Adjust balance and recalculate ETA.
5. **Paused Goals:** Retain balance, set contribution = 0.
6. **Completed Goals:** Mark as completed when current ≥ target.
7. **Rounding:** Round contributions to cents and carry remainders forward.

---

## 🧭 UX Flow

1. **Create Goal:** Enter name, target, balance, priority, and % of income.
2. **Review Forecast:** App shows monthly contribution, ETA, progress bar.
3. **Confirm:** Goal appears in list with progress ring, % allocation, ETA, and planned contribution.
4. **Month Close:** When income is recorded, planned contributions are applied automatically to each goal.

---

## ✅ Acceptance Criteria (Gherkin)

### Create & Validate Goal
**Given** I open “Create Goal”  
**When** I enter *Name*, *Target Amount*, *Starting Balance*, and set *% of Income*  
**Then** I see a forecast with *Monthly Contribution*, *ETA*, and *Progress %*  
**And** if total % across all goals > 100%  
**Then** I see “Total allocation cannot exceed 100%” and cannot save.

---

### Progress & ETA Calculation
**Given** my 3-month average income is $10,000  
**And** my goal has **10%** allocation and **$2,000** current balance toward a **$12,000** target  
**Then** Monthly Contribution = $1,000  
**And** ETA = 10 months  
**And** Progress = 16.7%

---

### Monthly Execution
**Given** my goal has 10% allocation and my income this month is $8,000  
**When** the month closes  
**Then** the app records an automatic contribution of $800  
**And** updates balance, progress, and ETA.

---

### Income Variability
**Given** “Use rolling 3-month average” is enabled  
**When** my income drops 50% this month  
**Then** the planned contribution adjusts using actual income  
**And** next month’s forecast updates accordingly.

---

### Priority Rebalancing
**Given** “Auto-rebalance by priority” is on  
**And** total allocations exceed available savings  
**Then** High-priority goals are funded first, followed by Medium and Low.

---

### Pausing & Completion
**Given** a goal is paused  
**Then** no contributions are made and ETA is hidden.  
**Given** current ≥ target  
**Then** the goal is marked “Completed” and excluded from allocation totals.

---

### Top-ups & Withdrawals
**Given** I add a manual top-up of $500  
**Then** current balance increases, progress recalculates, and ETA shortens.  
**Given** I withdraw $300  
**Then** balance decreases and ETA extends.

---

### Edge Validation
**Given** no income this month  
**Then** contributions = $0 with message “No income recorded.”  
**Given** starting balance > target  
**Then** goal auto-completes at creation.

---

## 🧠 UX Notes
- Inline validation for all inputs  
- Accessible progress bar with percentage label  
- Tooltip: “ETA based on your last 3 months’ average income ($X)”  
- Switch between **Rolling Average** and **Expected Income** modes  
- Quick actions: *Pause*, *Top-up*, *Withdraw*, *Edit %*  
- Each goal card displays:  
  - Goal name  
  - Target & current amount  
  - Progress ring  
  - ETA  
  - Monthly contribution  
  - Allocation %

---

## 📘 Example

| Goal | Target | Balance | % of Income | Monthly Income | Monthly Contribution | ETA | Progress |
|------|---------|----------|--------------|----------------|----------------------|-----|-----------|
| Emergency Fund | $9,000 | $1,200 | 15% | $12,000 | $1,800 | 5 months | 13.3% |
| Down Payment | $40,000 | $8,000 | 10% | $12,000 | $1,200 | 27 months | 20% |

---

> Next step for Cursor: **Generate the Data Model** to support this feature (tables, relations, and API schema), followed by UI components like `GoalCard`, `GoalForm`, `ProgressRing`, and `ETAIndicator`.
