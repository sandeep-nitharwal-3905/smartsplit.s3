# Deploy SplitEasy to Vercel

## Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Firebase project configured (see FIREBASE_SETUP.md)

## Step 1: Prepare Your Project

1. **Create a `.gitignore` file** (if not already present):
```
node_modules
dist
.env
.env.local
*.log
```

2. **Commit your code to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

5. **Add Environment Variables**:
   Click on **"Environment Variables"** and add these:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyCG-C1L8toySRv44S-dIXMM9I5sii4PZ0c
   VITE_FIREBASE_AUTH_DOMAIN=splitwise-3257b.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=splitwise-3257b
   VITE_FIREBASE_STORAGE_BUCKET=splitwise-3257b.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=455610676556
   VITE_FIREBASE_APP_ID=1:455610676556:web:02a1fe446817e9050e8be9
   VITE_FIREBASE_MEASUREMENT_ID=G-J206WDY0R8
   ```

6. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? (Select your account)
   - Link to existing project? **N**
   - Project name? (Press enter or type a name)
   - Directory? **./** (Press enter)
   - Override settings? **N**

5. **Add environment variables**:
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID
```

6. **Deploy to production**:
```bash
vercel --prod
```

## Step 3: Configure Firebase for Your Domain

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **splitwise-3257b**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add your Vercel domain (e.g., `your-app.vercel.app`)
6. Click **"Add"**

## Step 4: Update Firestore Security Rules (Production)

1. Go to **Firestore Database** → **Rules**
2. Replace with production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read: if isAuthenticated() && 
                     request.auth.uid in resource.data.members;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
                               request.auth.uid in resource.data.members;
    }
    
    // Expenses collection
    match /expenses/{expenseId} {
      allow read: if isAuthenticated() && 
                     request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
                               (request.auth.uid in resource.data.participants ||
                                request.auth.uid == resource.data.createdBy);
    }
    
    // Settlements collection
    match /settlements/{settlementId} {
      allow read: if isAuthenticated() &&
                     (request.auth.uid == resource.data.from ||
                      request.auth.uid == resource.data.to);
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
                               request.auth.uid == resource.data.from;
    }
    
    // Friends collection
    match /friends/{friendId} {
      allow read: if isAuthenticated() && 
                     (request.auth.uid == resource.data.userId ||
                      request.auth.uid == resource.data.friendId);
      allow create: if isAuthenticated();
      allow delete: if isAuthenticated() && 
                       request.auth.uid == resource.data.userId;
    }
  }
}
```

3. Click **"Publish"**

## Step 5: Verify Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test the following:
   - ✅ Sign up with a new account
   - ✅ Login with existing account
   - ✅ Create a group
   - ✅ Add friends
   - ✅ Add expenses
   - ✅ View balances
   - ✅ Settle up

## Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy every push to `main` branch to production
- Create preview deployments for pull requests
- Show deployment status in GitHub

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check build logs in Vercel dashboard

### Authentication Not Working
- Verify Firebase Auth domain is authorized
- Check that environment variables match Firebase config
- Clear browser cache and try again

### Data Not Loading
- Check Firestore security rules
- Verify network tab in browser dev tools
- Check Firebase project ID in environment variables

### CORS Errors
- Ensure your Vercel domain is added to Firebase authorized domains
- Check Firebase Authentication settings

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Domains**
3. Click **"Add"**
4. Enter your custom domain
5. Follow DNS configuration instructions
6. Add custom domain to Firebase authorized domains

## Environment Management

- **Production**: Environment variables set in Vercel dashboard
- **Development**: Use `.env` file locally (never commit this)
- **Preview**: Inherit from production or set separately

## Updating Your App

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```
4. Vercel automatically deploys the changes

## Rollback (If Needed)

1. Go to Vercel dashboard
2. Navigate to **Deployments**
3. Find a previous successful deployment
4. Click **"..."** → **"Promote to Production"**

## Performance Tips

1. Enable Vercel Analytics (optional):
   - Go to **Analytics** tab in Vercel dashboard
   - Click **"Enable"**

2. Monitor build times and optimize if needed

3. Use Vercel's Edge Network for fast global delivery

## Security Checklist

- ✅ Environment variables configured in Vercel (not in code)
- ✅ `.env` file in `.gitignore`
- ✅ Firebase security rules updated for production
- ✅ Authorized domains configured in Firebase
- ✅ HTTPS enabled (automatic with Vercel)

## Support

- Vercel Documentation: https://vercel.com/docs
- Firebase Documentation: https://firebase.google.com/docs
- GitHub Issues: Create issues in your repository
