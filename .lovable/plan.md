

# TechRola – Phase 1 Plan

## Overview
Build the complete user-facing web app and admin panel for TechRola, a freemium platform for browsing government schemes with a referral-based earning system. We'll use Supabase for auth, database, and storage. Payments (Razorpay) will be added later.

---

## 1. Design System & Layout
- **Colors**: Primary blue (#2563EB), accent green (#16A34A), earnings yellow (#EAB308), clean white/light gray backgrounds
- **Mobile-first** responsive layout with bottom nav on mobile
- **Shared layout** with header (logo, nav, auth buttons) and footer

## 2. Database Setup (Supabase)
- **profiles** table: name, mobile, email, referral_code (auto-generated), referred_by, subscription_status, wallet_balance
- **user_roles** table: role enum (admin, user)
- **schemes** table: title, category, description, eligibility, documents, image_url, apply_link, created_at
- **transactions** table: user_id, amount, type (credit/debit), source, created_at
- **withdrawals** table: user_id, amount, status (pending/approved/rejected), created_at
- RLS policies for all tables

## 3. Authentication
- Email/password signup & login
- Referral code field on signup (optional)
- Auto-generate unique referral code per user
- Profile auto-creation via trigger

## 4. User-Facing Screens

### Home / Schemes Page
- Category sections: 🔥 Recent, 🎓 Scholarships, 🌾 Farmers, 🏷️ SC/ST, 🌙 Minority
- Horizontal scroll cards with image, title, short description
- 🔒 Lock icon for free users

### Scheme Detail Page
- **Free users**: 50% description visible, rest blurred, locked apply button, CTA "Unlock for ₹1000"
- **Paid users**: Full description, eligibility, documents, active apply button

### Dashboard
- Wallet balance card with total earnings
- Referral code with share button (copy/WhatsApp)
- Quick action buttons: Refer, Withdraw, Browse Schemes

### Earnings Screen
- List of referral earnings with amounts (+₹400, +₹50) and dates
- Level indicators (Level 1/2/3)

### Withdrawal Screen
- Amount input (min ₹500 validation)
- Submit request button
- Status tracking list (pending/approved/rejected)

### Subscription Screen
- Price display: ~~₹2999~~ → ₹1000 (with referral)
- Benefits list
- "Pay Now" button (placeholder for Razorpay)
- Success/failure screens

## 5. Referral Engine (Logic)
- 3-level referral tracking: Level 1 = ₹400, Level 2 = ₹50, Level 3 = ₹50
- Wallet credit on successful referral subscription
- Referral tree stored via referred_by chain

## 6. Admin Panel (at /admin route)
- **Login**: Separate admin auth check
- **Dashboard**: Stats cards (total users, paid users, pending withdrawals, total schemes)
- **Scheme Management**: Add/edit/delete schemes with image upload, category selection
- **User Management**: Table view with search, subscription status
- **Withdrawal Management**: List with approve/reject buttons, balance auto-deduction

## 7. Navigation Structure
- **User**: Home → Scheme Detail → Dashboard → Earnings → Withdrawals → Subscription
- **Admin**: /admin/dashboard → /admin/schemes → /admin/users → /admin/withdrawals

