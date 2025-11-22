# Firebase Integration Setup Guide

## ✅ What's Been Done

Your app is now fully integrated with Firebase! Here's what was configured:

### 1. Environment Variables (`.env`)
```env
VITE_FIREBASE_API_KEY=AIzaSyCG-C1L8toySRv44S-dIXMM9I5sii4PZ0c
VITE_FIREBASE_AUTH_DOMAIN=splitwise-3257b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=splitwise-3257b
VITE_FIREBASE_STORAGE_BUCKET=splitwise-3257b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=455610676556
VITE_FIREBASE_APP_ID=1:455610676556:web:02a1fe446817e9050e8be9
VITE_FIREBASE_MEASUREMENT_ID=G-J206WDY0R8
```

### 2. Firebase Services Integrated
- ✅ Firebase Authentication (Email/Password)
- ✅ Cloud Firestore Database
- ✅ Real-time data synchronization
- ✅ Automatic user state management

### 3. Files Created
- `src/firebase/config.ts` - Firebase initialization
- `src/firebase/auth.ts` - Authentication functions
- `src/firebase/firestore.ts` - Database operations

## 🔧 Required Firebase Console Setup

### Step 1: Enable Authentication

1. Go to https://console.firebase.google.com/
2. Select project: **splitwise-3257b**
3. Navigate to **Build** → **Authentication**
4. Click **Get Started**
5. Go to **Sign-in method** tab
6. Click **Email/Password**
7. Enable the toggle and click **Save**

### Step 2: Enable Firestore Database

1. Navigate to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a Cloud Firestore location (closest to your users)
5. Click **Enable**

### Step 3: Set Firestore Security Rules

After creating the database, go to the **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               request.auth.uid in resource.data.members;
    }
    
    // Expenses collection
    match /expenses/{expenseId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               request.auth.uid in resource.data.participants;
    }
    
    // Settlements collection
    match /settlements/{settlementId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish** to save the rules.

## 📊 Firestore Collections Structure

### Collection: `users`
```javascript
{
  email: "user@example.com",
  name: "John Doe",
  createdAt: "2025-11-23T00:00:00Z"
}
```

### Collection: `groups`
```javascript
{
  name: "Roommates",
  members: ["userId1", "userId2"],
  createdBy: "userId1",
  createdAt: "2025-11-23T00:00:00Z"
}
```

### Collection: `expenses`
```javascript
{
  description: "Dinner",
  amount: 50.00,
  paidBy: "userId1",
  participants: ["userId1", "userId2"],
  groupId: "groupId123" | null,
  createdBy: "userId1",
  createdAt: "2025-11-23T00:00:00Z",
  isSettlement: false
}
```

### Collection: `settlements`
```javascript
{
  from: "userId1",
  to: "userId2",
  amount: 25.00,
  groupId: "groupId123" | null,
  settledAt: "2025-11-23T00:00:00Z"
}
```

## 🚀 Running the App

1. Make sure Firebase services are enabled (steps above)
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:5174/
4. Create an account and start using the app!

## 🔍 Testing the Integration

1. **Sign Up**: Create a test account (e.g., test@example.com)
2. **Check Firestore**: Go to Firebase Console → Firestore Database, you should see a new document in the `users` collection
3. **Create a Group**: Add a group and verify it appears in Firestore's `groups` collection
4. **Add Expense**: Create an expense and verify it's saved in the `expenses` collection

## 🐛 Troubleshooting

### "Missing or insufficient permissions"
- Check Firestore security rules are published
- Verify you're logged in (check browser console)

### "Auth domain not authorized"
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add `localhost` and your deployment domain

### Data not appearing
- Check browser console for errors
- Verify Firebase project ID matches in `.env`
- Check Firestore rules allow the operation

## 🌐 Deployment

When deploying to production:

1. Update Firestore rules from "test mode" to production rules (shown above)
2. Add your production domain to Firebase authorized domains
3. Set environment variables in your hosting platform (Vercel, Netlify, etc.)

## 📝 Notes

- All data is now persisted in Firebase Firestore
- User authentication is handled by Firebase Auth
- No backend server needed - Firebase handles everything
- Data syncs in real-time across devices
