# 🔥 Firebase Setup Instructions

Your DSA Tracker is now ready for Firebase! Follow these steps to complete the setup:

## 📋 **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `dsa-tracker` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

## 🔧 **Step 2: Enable Authentication**

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Go to **"Sign-in method"** tab
3. Click on **"Email/Password"**
4. Toggle **"Enable"** for Email/Password
5. Click **"Save"**

## 🗄️ **Step 3: Create Firestore Database**

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select a location close to your users (e.g., us-central1)
5. Click **"Done"**

## 🔑 **Step 4: Get Firebase Configuration**

1. In your Firebase project, click the ⚙️ **Settings** icon → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click **"Web"** icon (`</>`): 
4. Enter app nickname: `DSA Tracker Web`
5. Click **"Register app"**
6. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 📝 **Step 5: Update Environment Variables**

1. Open `.env.local` file in your project root
2. Replace the placeholder values with your actual Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 🚀 **Step 6: Test Your Setup**

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000`
3. Try to create an account (signup)
4. Try to login with your new account
5. Add a problem and see it persist in Firebase!

## 🔒 **Step 7: Add Security Rules (Optional but Recommended)**

In Firestore Database → Rules, replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ✅ **You're All Set!**

Your DSA Tracker now has:
- ✅ **Real Authentication** with Firebase Auth
- ✅ **Persistent Storage** with Firestore
- ✅ **Real-time Updates** across devices
- ✅ **User-specific Data** (each user sees only their problems)
- ✅ **Completely FREE** for your usage level

## 🆘 **Troubleshooting**

### **"Firebase is not configured" error:**
- Make sure you've added all environment variables to `.env.local`
- Restart your development server after adding env variables

### **"Permission denied" error:**
- Check that authentication is working (user should be logged in)
- Verify Firestore security rules allow authenticated users

### **Problems not showing up:**
- Check browser console for any errors
- Make sure you're logged in before adding problems
- Check Firebase Console → Firestore to see if data is being saved

**Happy coding! 🚀**
