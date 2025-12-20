# 🚀 Quick Fix Guide - Dashboard Sync Error

## 🎯 For Users Experiencing the Error

### What You'll See:
```
Profile Sync Required

Your account exists but your profile needs to be synchronized.
This sometimes happens if registration was interrupted.

What to do:
1. Click "Sync Profile" below to retry
2. If that fails, sign out and register again
3. Contact support if issue persists

[Sync Profile] [Retry Connection] [Sign Out]
```

### What To Do:
1. **Click "Sync Profile"** → Wait 2-3 seconds → Page reloads → Dashboard works! ✅
2. If that doesn't work, click **"Retry Connection"**
3. If still having issues, click **"Sign Out"** and contact support

---

## 🔧 For Developers/Admins

### Quick Deploy:
```bash
# Pull changes
git pull

# Rebuild
npx prisma generate
npm run build

# Deploy to production
vercel deploy --prod
# OR
git push origin main  # (if auto-deploy is set up)
```

### Test the Fix Locally:
```bash
# Run dev server
npm run dev

# Test registration flow
# 1. Register new user
# 2. If sync fails, dashboard shows new error screen
# 3. Click "Sync Profile" button
# 4. Should work!
```

### For Users Already Stuck:
Once you deploy, users will see the new "Sync Profile" button automatically.
They just need to:
1. Refresh the page (if already on dashboard)
2. Click "Sync Profile"
3. Done! ✅

---

## 📊 What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| **Error Message** | Generic "Sync Error" | Clear "Profile Sync Required" with instructions |
| **Recovery Options** | Only retry/logout | 3 options: Sync, Retry, Logout |
| **User Action** | Confused, stuck | Self-service fix with button |
| **Developer Debug** | Hard to diagnose | Clear logs and error codes |

---

## 🔍 How to Check if Fix is Working

### 1. Check Logs:
```bash
# Look for these logs in production
"Profile sync issue detected: { userId: ..., email: ... }"
"Profile sync attempt: ..."
```

### 2. Monitor Success Rate:
- Track `/api/auth/sync-profile-retry` calls
- Should see successful syncs
- Error rate should drop to ~0%

### 3. User Feedback:
- Users should report they can access dashboard
- "Sync Profile" button should work for affected users

---

## 🆘 If Users Still Have Issues

### Step 1: Check User in Supabase
```
Go to Supabase Dashboard
→ Authentication → Users
→ Find user by email
→ Check user_metadata has:
  - matric_number
  - full_name
  - type: 'student'
  - role: 'STUDENT'
```

### Step 2: Check Database
```sql
-- Check if user exists in database
SELECT * FROM "User" WHERE email = 'user@example.com';

-- If not found, the sync endpoint should create it
```

### Step 3: Manual Sync
```bash
# User should click "Sync Profile" button
# Or you can manually call:
curl -X POST https://your-domain.com/api/auth/sync-profile-retry \
  -H "Cookie: [user's session cookie]"
```

### Step 4: Last Resort - Re-register
If sync still fails:
1. User signs out
2. Delete user from Supabase (if needed)
3. User registers again
4. Should work now

---

## ✅ Success Checklist

- [ ] Changes deployed to production
- [ ] Build successful (no errors)
- [ ] `/api/auth/sync-profile-retry` endpoint accessible
- [ ] Dashboard shows new error screen
- [ ] "Sync Profile" button works
- [ ] Users can recover from sync issues
- [ ] Error logs show clear messages

---

## 📞 Need Help?

**Read Full Documentation:** `PRODUCTION_SYNC_FIX.md`

**Common Questions:**

**Q: Will existing users lose data?**  
A: No, data is safe. They just need to sync their profile.

**Q: Do I need to migrate the database?**  
A: No, no schema changes required.

**Q: What if sync fails for a user?**  
A: Check Supabase user metadata, ensure all required fields exist.

**Q: Can users continue to register normally?**  
A: Yes, this fix doesn't affect new registrations.

---

## 🎉 Summary

✅ **Problem:** Dashboard sync error blocking users  
✅ **Solution:** New sync retry endpoint + user-friendly UI  
✅ **Impact:** Users can self-recover, no data loss  
✅ **Deploy:** Simple - just push changes and rebuild  
✅ **Status:** Production ready!

**Users experiencing the error will see the fix immediately after deployment.**

---

**Last Updated:** December 20, 2025  
**Status:** ✅ Ready to Deploy
