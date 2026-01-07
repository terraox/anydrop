import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'colors.dart';

/// Theme modes supported by AnyDrop
enum AppThemeMode { light, dark, oled }

/// AnyDrop Theme Configuration
class AppTheme {
  /// Light Theme - Zinc 50 background
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.zinc50,
      primaryColor: AppColors.violet500,
      colorScheme: const ColorScheme.light(
        primary: AppColors.violet500,
        secondary: AppColors.violet400,
        surface: Colors.white,
        error: AppColors.red500,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.zinc900,
        onError: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.zinc50,
        foregroundColor: AppColors.zinc900,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.zinc200),
        ),
      ),
      dividerColor: AppColors.zinc200,
      textTheme: _buildTextTheme(isLight: true),
      iconTheme: const IconThemeData(color: AppColors.zinc600),
      inputDecorationTheme: _inputDecorationTheme(isLight: true),
      elevatedButtonTheme: _elevatedButtonTheme(),
      textButtonTheme: _textButtonTheme(),
    );
  }

  /// Dark Theme - Zinc 950 background
  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.zinc950,
      primaryColor: AppColors.violet500,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.violet500,
        secondary: AppColors.violet400,
        surface: AppColors.zinc900,
        error: AppColors.red500,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: Colors.white,
        onError: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.zinc950,
        foregroundColor: Colors.white,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      cardTheme: CardThemeData(
        color: AppColors.zinc900,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.zinc800),
        ),
      ),
      dividerColor: AppColors.zinc800,
      textTheme: _buildTextTheme(isLight: false),
      iconTheme: const IconThemeData(color: AppColors.zinc400),
      inputDecorationTheme: _inputDecorationTheme(isLight: false),
      elevatedButtonTheme: _elevatedButtonTheme(),
      textButtonTheme: _textButtonTheme(),
    );
  }

  /// OLED Theme - Pure black for battery saving
  static ThemeData oled() {
    final darkTheme = dark();
    return darkTheme.copyWith(
      scaffoldBackgroundColor: AppColors.pureBlack,
      appBarTheme: darkTheme.appBarTheme.copyWith(
        backgroundColor: AppColors.pureBlack,
      ),
      cardTheme: darkTheme.cardTheme.copyWith(
        color: AppColors.zinc950,
      ),
    );
  }

  static TextTheme _buildTextTheme({required bool isLight}) {
    final color = isLight ? AppColors.zinc900 : Colors.white;
    final mutedColor = isLight ? AppColors.zinc500 : AppColors.zinc400;

    return TextTheme(
      displayLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: color,
        letterSpacing: -0.5,
      ),
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: color,
        letterSpacing: -0.5,
      ),
      displaySmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: color,
      ),
      headlineMedium: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
      ),
      headlineSmall: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: color,
      ),
      titleLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: color,
      ),
      titleMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: color,
      ),
      titleSmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: mutedColor,
        letterSpacing: 0.5,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: color,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: color,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: mutedColor,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: color,
        letterSpacing: 0.5,
      ),
      labelSmall: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        color: mutedColor,
        letterSpacing: 1.0,
      ),
    );
  }

  static InputDecorationTheme _inputDecorationTheme({required bool isLight}) {
    final fillColor = isLight ? AppColors.zinc100 : AppColors.zinc900;
    final borderColor = isLight ? AppColors.zinc200 : AppColors.zinc800;

    return InputDecorationTheme(
      filled: true,
      fillColor: fillColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.violet500, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.red500),
      ),
    );
  }

  static ElevatedButtonThemeData _elevatedButtonTheme() {
    return ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.violet500,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static TextButtonThemeData _textButtonTheme() {
    return TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.violet500,
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
