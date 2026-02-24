App i18n – TODOs to Complete Full Implementation

Track progress for finishing internationalization (EN, PT, ES). Reference: [I18N.md](./I18N.md).

---

## 1. Auth flow

- [x] **Login page** (`app/[locale]/auth/login`) – titles, labels, buttons, links (e.g. “Forgot password?”), errors. Use `auth.*` and `errors.*`.
- [x] **Signup page** (`app/[locale]/auth/signup`) – form labels, CTAs, validation messages.
- [x] **Forgot password** (`app/[locale]/auth/forgot-password`) – copy, button, success/error messages.
- [x] **Reset password** (`app/[locale]/auth/reset-password`) – form labels and messages.
- [x] **Verify OTP** (`app/[locale]/auth/verify-otp`) – instructions, buttons, errors.
- [x] **Auth components** – login form uses `useTranslations("auth")`; OAuth error messages use auth keys; Link/useRouter from `@/i18n/navigation`.
- [x] **Messages** – auth keys added (signInButton, signingIn, or, invitedToHousehold, error, welcome, signInToContinue, signInToAccessDashboard, oauthCancelled, etc.).

---

## 2. Protected app shell (logged-in area)

- [x] **Sidebar / main nav** – nav item and section labels use `nav.sections.*` and `nav.items.*`; `components/nav.tsx` uses `Link`/`usePathname` from `@/i18n/navigation` and `useTranslations("nav")`; `navigation.config.ts` has `titleKey`/`labelKey`.
- [x] **Settings sections** – labels for Profile, Billing, Household, Categories, My account, etc. Add `settings.*` keys and use in settings layout/tabs.
- [x] **User menu** – “Feedback”, “Help & Support”, “Privacy Policy”, “Terms of Service”, “Log out” use `nav.*` and `auth.logout`.
- [x] **Bottom nav** (mobile) – tab labels use `t("nav.items.dashboard")`, `t("nav.add")`, `t("nav.more")`, etc.; `Link`/`usePathname`/`useRouter` from `@/i18n/navigation`.
- [x] **Page titles** – ensure main headings on dashboard, transactions, reports, planning, accounts, members, settings, etc. use translations (e.g. `nav.items.*`, `pages.insights`).

---

## 3. Dashboard & main app pages

- [x] **Dashboard** – widget titles, empty states, button labels (dashboard.* keys; DashboardWidgetsClient + main widgets).
- [x] **Transactions** – table headers, filters, empty state, action labels (transactions.* keys; search, filters, bulk actions, empty state, tooltips, select placeholders).
- [x] **Reports** – section titles, chart labels, period labels, empty state.
- [x] **Planning (Budgets / Goals)** – page titles, form labels, empty states, CTAs.
- [x] **Accounts** – list headers, empty state, “Add account”, etc.
- [x] **Members** – titles, invite CTA, roles, empty state.
- [x] **Subscriptions** – titles, status labels, actions.
- [x] **Debts / Investments / Planned payment** – Debts and Planned payment: titles, table headers, empty states, buttons, forms (EN, PT, ES). Investments page redirects only; no UI to translate.
- [x] **Help & Support / Feedback** – page title and static copy (helpSupport.*, feedbackPage.*); nav giveFeedback; PageHeader and more-menu use nav keys; mobile header titles for /feedback and /help-support.

---

## 4. Common UI components

- [x] **Dialogs** – ConfirmDialog default labels (dialogs.confirm, dialogs.cancel); Delete Account, Account Required, Cancel Subscription dialogs use `dialogs.*` (EN, PT, ES).
- [x] **Toasts** – `toasts` namespace (EN, PT, ES); budget-form, budgets-tab, transactions page (delete), pricing-dialog, cancel-subscription-dialog, cancelled-subscription-banner, subscription-management(-embedded) use `toasts.*`. – success/error messages that are hardcoded (e.g. “Saved”, “Error saving”). Prefer keys like `toasts.saved`, `toasts.error`.
- [x] **Forms** – `forms` namespace (EN, PT, ES); account-form, budget-form, transaction-form, category-dialog, category-selection-dialog, categories-module.
- [x] **Empty states** – Budgets/goals tabs, goals overview, chart empty states and labels (dashboard.*, reports.*, planning.*), blog list, categories module, account card, billing labels use translation keys.
- [x] **Buttons** – common.save/cancel/delete/edit/add/clear/saving in forms and confirm dialogs.
- [x] **Billing / subscription guards** – `billing` namespace; blocked-feature, pro-upgrade-dialog, feature-guard use `billing.blockedFeature.*`, `billing.upgradeDialog.*`, `billing.featureNames.*`.

---

## 5. Public & shared pages

- [x] **FAQ** (`app/[locale]/faq`) – `faq` namespace (EN, PT, ES); layout only: title, subtitle, search placeholder, results text, no-results message, CTA card. Q&A content remains in EN (can move to CMS later).
- [x] **Contact** – `contactPage` namespace (EN, PT, ES); page title, form labels, placeholders, button, toasts.
- [x] **Maintenance** (`app/[locale]/maintenance`) – `maintenance` namespace (EN, PT, ES); page uses `getTranslations("maintenance")` and `generateMetadata()`.
- [x] **Account deleted / Account blocked** – `accountStatus` namespace (EN, PT, ES); account-deleted uses `useTranslations("accountStatus.deleted")`; account-blocked uses `getTranslations("accountStatus.blocked")` and `generateMetadata()` for title/description.
- [x] **Subscription success** – `subscriptionSuccess` namespace (EN, PT, ES); `subscription-success-dialog.tsx` uses `useTranslations("subscriptionSuccess")` and `useLocale()` for date formatting.
- [x] **Terms of Service / Privacy Policy** – keep as-is (EN); no translation required.
- [x] **Blog / Docs** – out of scope – layout labels (e.g. “Back”, “Read more”); article content may stay in CMS.
- [x] **Footer links** – “Blog”, “FAQ”, “Terms of Service”, “Privacy Policy” use `landing.footer.*` in `simple-footer` (EN, PT, ES).

---

## 6. Messages & structure

- [x] **Namespaces** – key namespaces in use: `common`, `auth`, `errors`, `metadata`, `landing`, `nav`, `dashboard`, `settings`, `transactions`, `reports`, `planning`, `members`, `subscriptions`, `debts`, `plannedPayments`, `helpSupport`, `feedbackPage`, `dialogs`, `accountStatus`, `subscriptionSuccess`, `maintenance`, `faq`, `contactPage`, `toasts`, `billing`, `forms`. Still to add as needed: `empty` (or keep per-page).
- [x] **Consistency** – For every new key in `en.json`, add the same key in `pt.json` and `es.json`. Run `npm run check:i18n-keys` to verify; script can be added to CI.
- [x] **Metadata** – `metadata.pages.*` and `metadata.titleSuffix` (EN, PT, ES); dashboard, reports, insights use `generateMetadata()` in page; transactions, accounts, members, subscriptions, debts, planned-payment, feedback, help-support, planning, settings, investments use segment `layout.tsx` with `generateMetadata()`.

---

## 7. API & client fetch

- [x] **apiUrl()** – Main client flows use `apiUrl()`: auth (login, forgot-password, user menu, mobile header, more menu), debt-form, budgets-tab, transaction-form, subscriptions, debts, planned-payment-list, feedback, help-support, dashboard-widgets-client, household-module, transactions page, planning/budgets page. Remaining components can be updated incrementally.
- [ ] **API error messages (optional)** – if desired, have API return message keys and resolve them client-side with `t(key)` based on current locale; or send `Accept-Language` and resolve on server (not in scope of current next-intl setup).

---

## 8. Docs & QA

- [x] **I18N.md** – Updated with “Remaining work” and key-consistency check; points to this TODO file.
- [ ] **Smoke test** – Manually: (1) Open landing, switch language to PT then ES via footer/header switcher; confirm copy changes. (2) Log in, open dashboard and settings; switch locale via user menu (Language → EN / PT / ES); confirm no raw keys visible and labels match the selected language. (3) Check one flow per locale (e.g. add transaction, open budgets). Document any exceptions (e.g. admin, blog content).
- [x] **Missing key handling** – In development, missing keys show as `namespace.key`. In production, they show as `—` via `getMessageFallback` in `i18n/request.ts` (server) and `NextIntlClientProvider` in `app/[locale]/layout.tsx` (client).

---

## Summary checklist

| Area           | Priority | Status   |
|----------------|----------|----------|
| Auth flow     | High     | Done (login, signup, forgot, reset, verify-otp) |
| Protected nav | High     | Done (nav, user menu, bottom nav, settings sections, page titles) |
| Dashboard etc.| High     | Done (dashboard, transactions, reports, planning, accounts, members, subscriptions, debts, planned payment, help & feedback) |
| Common UI     | Medium   | Done (dialogs, toasts, billing guards, forms, buttons, empty states and chart labels) |
| Public pages  | Medium   | Done (account deleted/blocked, footer, maintenance, subscription success, FAQ, Contact; ToS/Privacy and Blog/docs out of scope) |
| Messages/keys | Ongoing  | Done (namespaces; metadata.pages; consistency via check:i18n-keys script) |
| API/client    | Low      | Done for main flows (auth, data pages, dashboard, budgets; apiUrl used) |
| Docs & QA     | Before release | Partial (I18N.md updated; missing-key handling done; smoke test manual steps documented) |

Complete the items above to finalize the full i18n implementation.
