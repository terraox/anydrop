import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/theme/app_theme.dart';

/// Theme provider for managing app theme state
class ThemeProvider extends ChangeNotifier {
  static const String _themeKey = 'anydrop_theme_mode';
  
  AppThemeMode _themeMode = AppThemeMode.dark;
  
  AppThemeMode get themeMode => _themeMode;

  ThemeData get theme {
    switch (_themeMode) {
      case AppThemeMode.light:
        return AppTheme.light();
      case AppThemeMode.dark:
        return AppTheme.dark();
      case AppThemeMode.oled:
        return AppTheme.oled();
    }
  }

  bool get isDark => _themeMode == AppThemeMode.dark || _themeMode == AppThemeMode.oled;
  bool get isOled => _themeMode == AppThemeMode.oled;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final savedTheme = prefs.getString(_themeKey);
    
    if (savedTheme != null) {
      _themeMode = AppThemeMode.values.firstWhere(
        (mode) => mode.name == savedTheme,
        orElse: () => AppThemeMode.dark,
      );
      notifyListeners();
    }
  }

  Future<void> setThemeMode(AppThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode.name);
  }

  void toggleTheme() {
    switch (_themeMode) {
      case AppThemeMode.light:
        setThemeMode(AppThemeMode.dark);
        break;
      case AppThemeMode.dark:
        setThemeMode(AppThemeMode.oled);
        break;
      case AppThemeMode.oled:
        setThemeMode(AppThemeMode.light);
        break;
    }
  }
}
