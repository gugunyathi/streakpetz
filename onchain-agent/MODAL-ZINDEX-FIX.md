# Modal Alignment & Z-Index Fix

**Date**: December 2024  
**Issue**: Modals overlapping app frame/card and not aligned with top  
**Status**: ✅ Fixed

---

## Problem

The wallet modals had two issues:
1. **Z-Index**: Using `z-50` caused overlap with app frame and header (which uses `z-[100000]`)
2. **Alignment**: Centered positioning caused modal tops to be hidden behind app frame
3. **Overflow**: Modal content could extend beyond viewport

---

## Solution

Updated all modals with:
1. **Z-index**: Changed from `z-50` to `z-[100001]` (above header)
2. **Alignment**: Changed from `items-center` to `items-start` (align to top)
3. **Height**: Changed from `max-h-[90vh]` to `max-h-[calc(100vh-1rem)]` (respects padding)
4. **Positioning**: Added `mt-0` to ensure no top margin
5. **Padding**: Responsive padding `p-2 sm:p-4 pt-2 sm:pt-4` matches app frame

---

## Files Updated

### 1. **SendModal.tsx**
```tsx
// BEFORE
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md overflow-hidden">

// AFTER
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
  <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md overflow-hidden max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto mt-0">
```

### 2. **ReceiveModal.tsx**
```tsx
// BEFORE
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md overflow-hidden">

// AFTER
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
  <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md overflow-hidden max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto mt-0">
```

### 3. **WalletModal.tsx**
```tsx
// BEFORE
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-0">
  <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md max-h-[100vh] overflow-hidden mt-0">

// AFTER
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
  <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden mt-0">
```

### 4. **PetStoreModal.tsx**
```tsx
// BEFORE
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
// Inner modal:
className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden"

// AFTER
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001] flex items-start justify-center p-2 sm:p-4 pt-2 sm:pt-4"
// Inner modal:
className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden mt-0"
```

### 5. **BasenameModal.tsx**
```tsx
// BEFORE
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-md mx-auto shadow-2xl">

// AFTER
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
  <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-md mx-auto shadow-2xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto mt-0">
```

### 6. **InviteFriendsModal.tsx**
```tsx
// BEFORE
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
// Inner modal:
className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"

// AFTER
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001] flex items-start justify-center p-2 sm:p-4 pt-2 sm:pt-4"
// Inner modal:
className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden mt-0"
```

### 7. **PetInfoModal.tsx**
```tsx
// BEFORE
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
// Inner modal:
className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"

// AFTER
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001] flex items-start justify-center p-2 sm:p-4 pt-2 sm:pt-4"
// Inner modal:
className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden mt-0"
```

---

## Key Changes Explained

### 1. **items-start** (Top Alignment)
- **Before**: `items-center` - Modal centered vertically
- **After**: `items-start` - Modal aligned to top
- **Benefit**: Modal top edge aligns with app frame top

### 2. **Responsive Padding**
- **Before**: `p-4` - Fixed 1rem padding
- **After**: `p-2 sm:p-4 pt-2 sm:pt-4` - Mobile 0.5rem, Desktop 1rem
- **Benefit**: Matches app frame padding exactly

### 3. **Calculated Height**
- **Before**: `max-h-[90vh]` - Fixed 90% of viewport
- **After**: `max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]`
- **Benefit**: Accounts for padding, prevents overflow

### 4. **Zero Top Margin**
- **Added**: `mt-0` - Explicitly removes top margin
- **Benefit**: Ensures modal touches top padding edge

---

## Z-Index Hierarchy

```
z-[100001]  ← All modals (highest) ✨
z-[100000]  ← Header/LoginButton
z-[99999]   ← WalletDropdown
z-10        ← Regular elements
z-0         ← Base layer
```

---

## Benefits

✅ **Perfect Alignment**: Modal tops align with app frame top edge  
✅ **No Overlap**: Modals appear cleanly above all UI  
✅ **Consistent**: All modals use same positioning  
✅ **Responsive**: Works on mobile (0.5rem padding) and desktop (1rem padding)  
✅ **No Hidden Content**: Modal tops are fully visible  
✅ **Proper Height**: Respects viewport height minus padding  
✅ **Professional**: Clean, aligned appearance  

---

## Visual Result

```
┌─────────────────────────────────┐
│ [0.5rem/1rem padding from top]  │ ← App frame padding
│ ┌───────────────────────────┐   │
│ │ Modal Top (fully visible) │   │ ← Modal aligns here
│ │                           │   │
│ │   Modal Content           │   │
│ │                           │   │
│ └───────────────────────────┘   │
│ [0.5rem/1rem padding bottom]    │
└─────────────────────────────────┘
```

**Before**: Modal centered → top hidden behind app frame ❌  
**After**: Modal top-aligned → fully visible ✅

---

## Testing

- [x] Send modal aligns with app top
- [x] Receive modal aligns with app top
- [x] Wallet modal aligns with app top
- [x] Pet store modal aligns with app top
- [x] Basename modal aligns with app top
- [x] Invite friends modal aligns with app top
- [x] Pet info modal aligns with app top
- [x] No overlap with app frame
- [x] No overlap with header
- [x] Scrollable when content is long
- [x] Backdrop closes modal
- [x] Mobile responsive (0.5rem padding)
- [x] Desktop responsive (1rem padding)

---

## Summary

All 7 modals have been updated to:
- Use `z-[100001]` for proper layering
- Align to top with `items-start`
- Match app frame padding (`p-2 sm:p-4`)
- Calculate height properly (`max-h-[calc(100vh-1rem)]`)
- Remove top margin (`mt-0`)

This ensures modals appear perfectly aligned with the app frame without any overlap or hidden content.
