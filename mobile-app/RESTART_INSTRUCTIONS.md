# How to Restart Flutter App

## Option 1: Hot Restart (Recommended - Fastest)
If the app is already running via USB debugging:

1. **In your terminal/IDE where Flutter is running:**
   - Press `R` (capital R) for Hot Restart
   - OR press `r` (lowercase) for Hot Reload (may not pick up all changes)

2. **In VS Code/Android Studio:**
   - Click the "Hot Restart" button (circular arrow icon)
   - OR use the command palette: "Flutter: Hot Restart"

## Option 2: Full Restart (If Hot Restart Doesn't Work)
Since we changed service files, a full restart ensures all changes are loaded:

```bash
cd mobile-app

# Stop the current app (press Ctrl+C in the terminal running Flutter)
# Then restart:
flutter run
```

## Option 3: Close and Reopen on Phone
1. Close the app completely on your phone (swipe away from recent apps)
2. Reopen the app from the app drawer

## Option 4: Rebuild and Install
If you want a fresh install:

```bash
cd mobile-app

# Clean build
flutter clean
flutter pub get

# Run on connected device
flutter run
```

## Which Method to Use?

- **Hot Restart (Option 1)**: Fastest, works for most code changes
- **Full Restart (Option 2)**: Best if Hot Restart doesn't pick up changes
- **Close/Reopen (Option 3)**: Simplest, works if app is already installed
- **Rebuild (Option 4)**: Use if you suspect build cache issues

## After Restart

1. The app should load with the updated code
2. Go to **Settings** screen
3. Check the **"LOCAL FILE TRANSFER"** section
4. The laptop should appear in the device list
5. Try sending a file - it should now use discovered device IPs instead of localhost

## Troubleshooting

If the app doesn't restart:
- Make sure your phone is still connected via USB
- Check that USB debugging is enabled
- Try unplugging and replugging the USB cable
- Run `flutter devices` to verify connection
