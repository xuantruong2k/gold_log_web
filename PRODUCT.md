# Gold Log Client - Product Specification

## Product Overview

**Gold Log Client** is a web-based frontend application for tracking gold trading transactions and monitoring investment performance. The application provides an intuitive interface for users to log their gold purchases and sales, view transaction history, and analyze profit/loss metrics in real-time.

### Core Purpose

- Provide user-friendly interface for gold transaction management
- Enable secure authentication via Google OAuth
- Display real-time portfolio performance and analytics
- Offer responsive design for desktop and mobile devices

### Product Type

Single Page Application (SPA) - Web Client

---

## Target Users

### Primary User: Individual Gold Investors

- **Demographics**: Vietnamese gold investors aged 25-65
- **Tech Savviness**: Moderate to high comfort with web applications
- **Goals**: Track gold investments, monitor profit/loss, maintain transaction records
- **Pain Points**: Manual tracking in spreadsheets, lack of real-time P&L calculations

### Use Cases

1. **Transaction Logging**: Quickly log buy/sell transactions after visiting gold stores
2. **Portfolio Monitoring**: Check current holdings and profit/loss at a glance
3. **Historical Analysis**: Review past transactions and performance trends
4. **Price Comparison**: Compare historical transaction prices with current market rates

---

## User Journey

### 1. First-Time User Flow

```
Landing Page
    ↓
[Login with Google]
    ↓
OAuth Consent Screen (Google)
    ↓
Redirect to Application
    ↓
Empty Dashboard (Welcome Message)
    ↓
[Add First Transaction] Button
    ↓
Transaction Form
    ↓
Dashboard with First Transaction
```

**Success Criteria**:

- User can complete login within 30 seconds
- First transaction created within 2 minutes
- Clear guidance throughout the process

### 2. Returning User Flow

```
Landing Page (Auto-login if token valid)
    ↓
Dashboard (Portfolio Summary)
    ↓
Transaction List
    ↓
Quick Actions: Add Transaction / View Analytics
```

**Success Criteria**:

- Dashboard loads within 2 seconds
- Recent transactions visible immediately
- One-click access to add transaction

---

## Core Features

### Feature 1: Authentication & User Management

#### Google OAuth Login

**Priority**: P0 (Must Have)

**User Story**:

> As a new user, I want to log in using my Google account so that I don't need to create another password.

**Functionality**:

- **Login Button**: Prominent "Sign in with Google" button on landing page
- **OAuth Flow**: Redirect to Google for authentication
- **Automatic Redirect**: Return to dashboard after successful login
- **Session Management**: Keep user logged in for 1 hour (configurable)
- **Logout**: Clear logout button in navigation header

**UI Elements**:

```
┌─────────────────────────────────────┐
│  Gold Log                            │
│                                      │
│  Track Your Gold Investment          │
│                                      │
│  ┌────────────────────────────┐    │
│  │  🔐 Sign in with Google     │    │
│  └────────────────────────────┘    │
│                                      │
│  Secure • Fast • Simple              │
└─────────────────────────────────────┘
```

**Security Requirements**:

- HTTPS only for production
- CSRF protection via state parameter
- Token stored in secure storage (not localStorage)
- Auto-logout after token expiration

---

### Feature 2: Dashboard & Portfolio Summary

#### Portfolio Overview

**Priority**: P0 (Must Have)

**User Story**:

> As a user, I want to see my current gold holdings and profit/loss at a glance when I log in.

**Functionality**:

- **Summary Cards**: Display key metrics in card layout
  - Total gold quantity owned
  - Total amount invested (VND)
  - Current portfolio value (VND)
  - Unrealized profit/loss (VND and percentage)
  - Total profit/loss (realized + unrealized)
- **Visual Indicators**: Color-coded profit (green) and loss (red)
- **Refresh Button**: Manual refresh to update calculations
- **Last Updated**: Timestamp of last calculation

**UI Layout**:

```
┌────────────────────────────────────────────────────┐
│  Dashboard                         [Profile] [⚙️]    │
├────────────────────────────────────────────────────┤
│  Portfolio Summary                                  │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Holdings │ │ Invested │ │ P&L      │          │
│  │ 50.5 chỉ │ │ 3.7B VND │ │ +63M VND │          │
│  │          │ │          │ │ +1.70%   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                     │
│  [+ Add Transaction]     [📊 View Analytics]       │
└────────────────────────────────────────────────────┘
```

**Data Sources**:

- Portfolio calculations from backend `/portfolio/summary` endpoint (future)
- Aggregated from transaction list for MVP

---

### Feature 3: Transaction Management

#### 3.1 Add Transaction

**Priority**: P0 (Must Have)

**User Story**:

> As a user, I want to quickly log a gold transaction after purchasing or selling gold.

**Form Fields**:

```typescript
interface TransactionForm {
  type: 'BUY' | 'SELL'; // Required
  quantity: number; // Required, positive
  pricePerUnit: number; // Required, positive
  currency: 'VND' | 'USD'; // Optional, default VND
  provider: string; // Optional
  transactionDate: Date; // Optional, default now
  notes: string; // Optional, max 500 chars
}
```

**Form UI**:

```
┌────────────────────────────────────┐
│  Add Transaction                    │
├────────────────────────────────────┤
│  Transaction Type *                 │
│  ( ) BUY    (•) SELL               │
│                                     │
│  Quantity (chỉ) *                  │
│  [_________________]               │
│                                     │
│  Price per Unit (VND) *            │
│  [_________________]               │
│                                     │
│  Provider                          │
│  [▼ SJC____________]               │
│                                     │
│  Transaction Date                  │
│  [📅 01/30/2026 10:30]             │
│                                     │
│  Notes                             │
│  [_________________]               │
│  [_________________]               │
│                                     │
│  Total: 787,500,000 VND            │
│                                     │
│  [Cancel]        [Save Transaction]│
└────────────────────────────────────┘
```

**Validation Rules**:

- **Quantity**: Must be positive, max 10 integer digits + 6 decimals
- **Price per Unit**: Must be positive, max 15 integer digits + 2 decimals
- **Provider**: Max 100 characters
- **Notes**: Max 500 characters
- **Date**: Cannot be future date
- **Auto-calculation**: Total amount = quantity × price per unit

**Success Flow**:

```
Form Submit
    ↓
Validation (Client-side)
    ↓
Generate UUID v4 (idempotency key)
    ↓
API Call to Backend
    ↓
Success: Show success message + redirect to transaction list
Error: Display error message inline
```

**Error Handling**:

- **Duplicate Transaction (409)**: "This transaction already exists. Please check your transaction list."
- **Validation Error (400)**: Show field-specific errors inline
- **Network Error**: "Unable to save transaction. Please check your connection and try again."
- **Auto-retry**: Offer retry button for network failures

---

#### 3.2 View Transaction List

**Priority**: P0 (Must Have)

**User Story**:

> As a user, I want to see all my past transactions so I can review my trading history.

**Functionality**:

- **Table View**: Display transactions in sortable table
- **Pagination**: 20 transactions per page
- **Sorting**: By date (default: newest first), type, quantity, amount
- **Filtering**:
  - By type (BUY, SELL, or ALL)
  - By date range
  - By provider
- **Search**: Quick search by notes or provider
- **Actions**: View details, delete transaction

**Table UI**:

```
┌───────────────────────────────────────────────────────────────┐
│  Transactions                                                  │
├───────────────────────────────────────────────────────────────┤
│  Filters: [All ▼] [Date Range] [Provider ▼]    [🔍 Search]   │
├───────┬──────┬──────────┬──────────┬──────────────┬──────────┤
│ Date  │ Type │ Quantity │ Price    │ Total        │ Actions  │
├───────┼──────┼──────────┼──────────┼──────────────┼──────────┤
│ 01/30 │ BUY  │ 10.5 chỉ │ 75M VND  │ 787.5M VND   │ [🗑️] [📄]│
│ 01/28 │ SELL │ 5.0 chỉ  │ 76M VND  │ 380M VND     │ [🗑️] [📄]│
│ 01/25 │ BUY  │ 15.0 chỉ │ 74M VND  │ 1.11B VND    │ [🗑️] [📄]│
├───────┴──────┴──────────┴──────────┴──────────────┴──────────┤
│  ← Previous                                     Next →         │
│  Page 1 of 5 (45 transactions)                                │
└───────────────────────────────────────────────────────────────┘
```

**Performance Requirements**:

- Initial load: < 1 second
- Pagination: < 500ms
- Filter/sort: < 300ms (client-side if possible)

---

#### 3.3 View Transaction Details

**Priority**: P1 (Should Have)

**User Story**:

> As a user, I want to see full details of a transaction including all metadata.

**Modal UI**:

```
┌────────────────────────────────────┐
│  Transaction Details            [×]│
├────────────────────────────────────┤
│  Transaction ID                     │
│  65b3f2a1c4e5d6f7a8b9c0d1          │
│                                     │
│  Type: BUY                          │
│  Quantity: 10.5 chỉ                 │
│  Price per Unit: 75,000,000 VND     │
│  Total Amount: 787,500,000 VND      │
│                                     │
│  Provider: SJC                      │
│  Date: January 30, 2026 10:30 AM    │
│                                     │
│  Notes:                             │
│  Purchase from SJC District 1       │
│                                     │
│  Created: Jan 30, 2026 10:30:15 AM  │
│  Updated: Jan 30, 2026 10:30:15 AM  │
│                                     │
│  [Delete Transaction]       [Close]│
└────────────────────────────────────┘
```

---

#### 3.4 Delete Transaction

**Priority**: P1 (Should Have)

**User Story**:

> As a user, I want to delete a transaction if I made a mistake or entered duplicate data.

**Functionality**:

- **Confirmation Dialog**: Two-step confirmation to prevent accidental deletion
- **Soft Delete**: Backend marks as deleted (not physically removed)
- **Success Feedback**: Toast notification confirming deletion
- **Undo Option**: (Future) Allow undo within 5 seconds

**Confirmation Dialog**:

```
┌────────────────────────────────────┐
│  ⚠️  Delete Transaction             │
├────────────────────────────────────┤
│  Are you sure you want to delete    │
│  this transaction?                  │
│                                     │
│  BUY • 10.5 chỉ • 787,500,000 VND   │
│  January 30, 2026                   │
│                                     │
│  This action cannot be undone.      │
│                                     │
│  [Cancel]            [Delete]       │
└────────────────────────────────────┘
```

---

### Feature 4: Profile & Settings

#### User Profile

**Priority**: P1 (Should Have)

**User Story**:

> As a user, I want to view my profile information and manage my account settings.

**Functionality**:

- **Profile Display**: Show user info from Google OAuth
  - Name
  - Email
  - Profile picture
  - Account creation date
- **Settings**:
  - Default currency (VND/USD)
  - Date format preference
  - Number format (comma vs period separators)
- **Account Actions**:
  - Logout
  - Delete account (future)

**UI Layout**:

```
┌────────────────────────────────────┐
│  Profile                            │
├────────────────────────────────────┤
│  [👤 Avatar]                        │
│                                     │
│  John Doe                           │
│  john.doe@gmail.com                 │
│  Member since: Jan 30, 2026         │
│                                     │
│  Settings                           │
│  ├─ Default Currency: VND ▼        │
│  ├─ Date Format: DD/MM/YYYY ▼      │
│  └─ Number Format: 1,000,000 ▼     │
│                                     │
│  [Save Settings]                    │
│                                     │
│  Account                            │
│  [Logout]                           │
└────────────────────────────────────┘
```

---

### Feature 5: Analytics & Reporting (Future)

**Priority**: P2 (Nice to Have)

**User Story**:

> As a user, I want to see charts and analytics of my gold investment performance over time.

**Planned Features**:

- **Performance Chart**: Line chart showing portfolio value over time
- **Transaction Distribution**: Pie chart of BUY vs SELL transactions
- **Provider Analysis**: Compare prices across different providers
- **Profit/Loss Timeline**: Bar chart showing P&L by month
- **Export**: Download transaction history as CSV/Excel

---

## UI/UX Requirements

### Design Principles

1. **Simplicity**: Clean, uncluttered interface focusing on core tasks
2. **Speed**: Fast loading times and responsive interactions
3. **Mobile-First**: Responsive design that works on all devices
4. **Accessibility**: WCAG 2.1 AA compliance
5. **Vietnamese-Friendly**: Support Vietnamese currency formatting and number conventions

### Visual Design

#### Color Palette

```
Primary:   #2563EB (Blue)
Secondary: #10B981 (Green - for profits)
Danger:    #EF4444 (Red - for losses)
Warning:   #F59E0B (Amber)
Neutral:   #6B7280 (Gray)
Background:#F9FAFB (Light Gray)
```

#### Typography

- **Headings**: Inter or SF Pro Display (system font)
- **Body**: Inter or SF Pro Text
- **Numbers**: Tabular figures for financial data alignment
- **Size Scale**: 12px, 14px, 16px, 18px, 24px, 32px

#### Spacing

- Base unit: 4px
- Common spacing: 8px, 12px, 16px, 24px, 32px, 48px

### Responsive Breakpoints

```
Mobile:   < 640px
Tablet:   640px - 1024px
Desktop:  > 1024px
```

**Mobile Adaptations**:

- Stack dashboard cards vertically
- Hamburger menu for navigation
- Full-width forms
- Simplified table view (card-based)

---

## User Feedback & Notifications

### Toast Notifications

Show brief, non-intrusive messages for:

- ✅ Transaction created successfully
- ✅ Transaction deleted successfully
- ❌ Failed to save transaction
- ❌ Network connection error
- ⚠️ Session expiring soon

**Position**: Top-right corner
**Duration**: 3-5 seconds (auto-dismiss)
**Dismissable**: Yes (× button)

### Loading States

- **Skeleton Screens**: For initial data loading
- **Spinner**: For API calls (save, delete actions)
- **Progress Bars**: For multi-step processes (future)

### Error States

- **Empty State**: When no transactions exist
- **Network Error**: With retry button
- **404 Not Found**: For invalid transaction IDs
- **Validation Errors**: Inline with field highlighting

---

## Performance Requirements

### Loading Performance

- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Time to Interactive (TTI)**: < 3 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds

### Runtime Performance

- **API Response Display**: < 200ms after response received
- **Smooth Scrolling**: 60 FPS
- **Form Validation**: < 100ms feedback

### Optimization Strategies

- Code splitting by route
- Lazy loading for heavy components
- Image optimization and lazy loading
- API response caching
- Optimistic UI updates

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**: All features accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and semantic HTML
3. **Color Contrast**: Minimum 4.5:1 ratio for normal text
4. **Focus Indicators**: Clear focus states for all interactive elements
5. **Form Labels**: All inputs properly labeled
6. **Error Identification**: Clear error messages for form validation

### Testing Requirements

- Test with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing
- Color blindness simulation
- Mobile accessibility testing

---

## Browser & Device Support

### Supported Browsers (Latest 2 versions)

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ Mobile browsers (Chrome Mobile, Safari iOS)

### Minimum Screen Sizes

- Mobile: 320px width
- Tablet: 768px width
- Desktop: 1024px width

---

## Security & Privacy

### Data Protection

- No sensitive data in localStorage (use secure cookies or sessionStorage)
- HTTPS only for production
- XSS protection via React's built-in escaping
- CSRF protection via OAuth state parameter

### Privacy

- Minimal data collection
- No tracking without consent
- Clear data usage policy
- User data deletion option (future)

---

## Success Metrics

### User Engagement

- **Daily Active Users (DAU)**: Target 100+ in first 3 months
- **Transaction Creation Rate**: Average 2+ transactions per user per week
- **Session Duration**: Average 3-5 minutes per session
- **Return Rate**: 70%+ users return within 7 days

### Performance Metrics

- **Page Load Time**: < 2 seconds (95th percentile)
- **Error Rate**: < 1% of API calls
- **Uptime**: 99.5%+

### User Satisfaction

- **Task Completion Rate**: 95%+ for adding transaction
- **User Feedback Score**: 4+ out of 5
- **Support Ticket Volume**: < 5% of active users

---

## Future Enhancements

### Phase 2

- Multi-language support (English, Vietnamese)
- Dark mode
- Advanced filtering and search
- Bulk transaction import (CSV)
- Price alerts and notifications

### Phase 3

- Real-time price tracking from providers
- Automatic P&L calculations with live prices
- Investment recommendations
- Portfolio optimization suggestions

### Phase 4

- Mobile app (React Native)
- Offline mode with sync
- Social features (share performance)
- Integration with banking APIs

---

## Version History

- **v1.0.0** (2026-01-30): Initial product specification for web client
