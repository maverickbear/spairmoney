# Receipts

## Purpose

Allows users to **upload receipt images** and optionally **scan/extract** data (e.g. amount, merchant, date) for creating transactions or records. Supports upload, scan (OCR/AI), and extract-by-id for a stored receipt.

## User Flows

- Upload a receipt image (file); stored and linked to user/household.
- Scan receipt: process image to extract line items or total (scan endpoint).
- Get extracted data for a receipt by ID (extract endpoint) for editing or creating a transaction.
- List or manage receipts (if UI exists); import jobs may track receipt-processing status.

## Behavior / Logic

- **Upload:** Receipt image is stored (e.g. Supabase Storage) and metadata linked to user/household. File type and size may be validated in domain or API.
- **Scan/extract:** Scan endpoint runs OCR or AI to extract fields (amount, merchant, date); extract-by-id returns stored extraction for a receipt. Result can be used to pre-fill a transaction form; creating the transaction is a separate step. Scan may be gated by plan.
- **Scope:** Receipts are scoped by user or household; list and get enforce access in the service.

## Key Routes / Pages

- Receipts may be accessed from transactions flow (e.g. “Add from receipt”) or a dedicated area; no dedicated protected page in the plan. Components may live in transactions or receipts feature folder.
- `src/application/receipts/` – receipts.service.ts, receipts.factory.ts.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v2/receipts/upload` | Upload receipt image. |
| POST | `/api/v2/receipts/scan` | Scan receipt (OCR/extract). |
| GET or POST | `/api/v2/receipts/[id]/extract` | Get or run extraction for a receipt. |

## Domain / Application

- **Domain:** `src/domain/receipts/` – `receipts.types.ts`, `receipts.constants.ts` (e.g. file types).
- **Application:** `src/application/receipts/` – `receipts.service.ts`, `receipts.factory.ts`.
- May use OpenAI or external OCR for scan/extract.

## Infrastructure

- Storage (Supabase Storage or S3) for receipt files. Repository for receipt metadata and extraction results. Optional: OpenAI or third-party OCR API for scan.

## Dependencies

- Auth. Optional: Transactions (to create transaction from extracted data). Categories for suggesting category from merchant.

## Subscription / Access

- May be gated by plan (e.g. premium feature). Feature guard or plan-features-service can enforce.
