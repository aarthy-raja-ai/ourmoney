# OurMoney – Play Store Compliance Report

## Public Web URLs (GitHub Pages)
- **Privacy Policy URL**: `https://aarthy-raja-ai.github.io/ourmoney/privacy-policy.html`
- **Account Deletion Request URL**: `https://aarthy-raja-ai.github.io/ourmoney/delete-account.html`

---

## 1. Actual Data Collected
OurMoney collects only data essential for household budget tracking and joint workspace functionality:

### Personal / Account Information
- **Email Address**: Account creation, authentication, password reset, and identity verification.
- **Display Name**: Displayed within household workspace and partner sync card.
- **Firebase Auth UID**: Unique account identifier.

### User-Entered Financial Information
- **Expenses**: Transaction amount, category, description, payment method (Cash, UPI, Credit Card, Bank Transfer), transaction date, payment status (paid or credit), creating user ID.
- **Budgets**: Category spending targets and budget period.
- **Loans & Liabilities**: Lender name, loan type, principal amount, balance, interest rate, repayment method, loan payment records.
- **Pending Purchases**: Title, category, merchant name, amount, due date, settlement status.

### App Functionality Information
- **Household Data**: Household ID, member user IDs, 6-character invite code lookup tokens.

*Note: OurMoney does NOT collect bank account numbers, credit card numbers, card PINs, UPI PINs, OTPs, Aadhaar numbers, or PAN numbers.*

---

## 2. Data Shared
- **Third-Party Data Selling**: **NONE**. Data is never sold, rented, or shared with ad networks or data brokers.
- **Service Providers**: Data is transmitted to **Google Firebase** (Authentication and Cloud Firestore) as cloud backend infrastructure providers.

---

## 3. Firebase Services Used
- **Firebase Authentication**: Email/password authentication, password reset, user UID session security.
- **Google Cloud Firestore**: Real-time cloud database for storing user profiles, household workspaces, expenses, budgets, loans, and pending purchases.

---

## 4. Account Deletion Implementation
OurMoney supports complete account deletion via two methods:

### In-App Deletion Method
- Navigation: **Settings → Privacy & Data → Delete Account**.
- **Solo Workspace**: Erases user profile document `users/{userId}`, Firebase Auth user credentials, and household workspace document `households/{householdId}`.
- **Shared Workspace**: Erases user profile and Auth user credentials. Removes user ID from household `memberIds`. If user was workspace creator, transfers ownership to remaining partner so shared accounting history is preserved for the partner.
- **Re-Authentication Handling**: Catches `auth/requires-recent-login` and prompts sign-out/sign-in before re-attempting deletion.

### External Request Method
- Webpage: `https://aarthy-raja-ai.github.io/ourmoney/delete-account.html`
- Email: `aarthyraja9976@gmail.com` / `support@ourmoney.app`
- Deletion requests processed within 7 business days.

---

## 5. Android Permissions Audit
- **Permissions Declared in `app.json`**:
  - `android.permission.INTERNET` (Cloud sync)
  - `android.permission.ACCESS_NETWORK_STATE` (Network connectivity status)
- **Zero Dangerous Permissions**: No Location, Contacts, SMS, Call Logs, Camera, Microphone, or Storage permissions.

---

## 6. Remaining Manual Google Play Console Steps

The following manual steps must be completed in the Google Play Console UI before release:

1. **Host GitHub Pages**:
   - Push code to `main` branch.
   - Go to your GitHub repository **Settings → Pages** → select **GitHub Actions** as source (or `main` branch `/public` folder).
   - Verify `https://aarthy-raja-ai.github.io/ourmoney/privacy-policy.html` and `https://aarthy-raja-ai.github.io/ourmoney/delete-account.html` load publicly in browser.

2. **Google Play Console Data Safety Form**:
   - Go to **Play Console → Policy and programs → App content → Data safety**.
   - Complete declarations matching this report:
     - **Email address**: Collected, Account management, Encrypted in transit, Deletion supported.
     - **Name**: Collected, App functionality, Encrypted in transit, Deletion supported.
     - **User IDs**: Collected, App functionality, Encrypted in transit, Deletion supported.
     - **Purchase history / Financial info**: Collected, App functionality, Encrypted in transit, Deletion supported.
   - Enter your public Privacy Policy URL: `https://aarthy-raja-ai.github.io/ourmoney/privacy-policy.html`
   - Enter your public Account Deletion URL: `https://aarthy-raja-ai.github.io/ourmoney/delete-account.html`

3. **Generate Production Android Bundle (.aab)**:
   - Run `eas build --platform android --profile production` or `npx expo run:android --variant release`.
   - Upload generated `.aab` file to **Play Console → Production / Testing track**.
