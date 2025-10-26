# 🚀 GitHub Setup Guide

Follow these steps to deploy your Saudi Drawing Game to GitHub Pages:

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in the details:**
   - Repository name: `saudi-drawing-game` (or any name you prefer)
   - Description: `A modern multiplayer Saudi-themed drawing and guessing game`
   - Set to **Public** (required for free GitHub Pages)
   - **Don't** initialize with README (we already have one)
5. **Click "Create repository"**

## Step 2: Upload Files

### Method A: Using GitHub Web Interface (Easiest)

1. **Go to your new repository**
2. **Click "uploading an existing file"**
3. **Drag and drop these files:**
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
   - `LICENSE`
   - `.gitignore`
4. **Add commit message:** "Initial commit: Saudi Drawing Game"
5. **Click "Commit changes"**

### Method B: Using Git Command Line

```bash
# Navigate to your project folder
cd C:\Scrabble

# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: Saudi Drawing Game"

# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/saudi-drawing-game.git

# Push to GitHub
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. **Go to your repository on GitHub**
2. **Click "Settings" tab** (at the top of the repository)
3. **Scroll down to "Pages" section** (in the left sidebar)
4. **Under "Source":**
   - Select "Deploy from a branch"
   - Branch: "main"
   - Folder: "/ (root)"
5. **Click "Save"**
6. **Wait 2-3 minutes** for deployment to complete

## Step 4: Access Your Game

1. **Go to the "Pages" section again**
2. **Your game will be available at:**
   ```
   https://YOUR_USERNAME.github.io/saudi-drawing-game
   ```
3. **Replace `YOUR_USERNAME`** with your actual GitHub username
4. **Bookmark the URL** for easy access

## Step 5: Test the Game

1. **Open the GitHub Pages URL** in your browser
2. **Test all features:**
   - Create a room
   - Copy room code
   - Test drawing tools
   - Test chat system
   - Test on mobile devices

## Step 6: Share with Friends

1. **Share the GitHub Pages URL** with friends
2. **Or use the in-game sharing buttons:**
   - WhatsApp sharing
   - Telegram sharing
   - Direct link copying

## 🔧 Troubleshooting

### If GitHub Pages doesn't work:
- Make sure repository is **Public**
- Check that `index.html` is in the root folder
- Wait 5-10 minutes for deployment
- Check the "Actions" tab for any errors

### If files don't upload:
- Make sure file names are correct
- Check file sizes (should be small)
- Try uploading one file at a time

### If game doesn't load:
- Check browser console for errors
- Make sure all files are uploaded
- Try refreshing the page

## 📱 Mobile Testing

1. **Open the GitHub Pages URL on your phone**
2. **Test touch controls**
3. **Test room creation and joining**
4. **Share with friends via mobile**

## 🎉 Success!

Once deployed, your Saudi Drawing Game will be:
- ✅ Accessible worldwide
- ✅ Mobile-friendly
- ✅ Multiplayer ready
- ✅ Easy to share
- ✅ Always up-to-date

**Your game URL:** `https://YOUR_USERNAME.github.io/saudi-drawing-game`

Enjoy playing with friends! 🎨🇸🇦
