import 'package:flutter/material.dart';

/// AnyDrop Design System Colors
/// Matches the web app's Cyber-Industrial theme
class AppColors {
  // Zinc Scale - Primary backgrounds
  static const zinc50 = Color(0xFFFAFAFA);
  static const zinc100 = Color(0xFFF4F4F5);
  static const zinc200 = Color(0xFFE4E4E7);
  static const zinc300 = Color(0xFFD4D4D8);
  static const zinc400 = Color(0xFFA1A1AA);
  static const zinc500 = Color(0xFF71717A);
  static const zinc600 = Color(0xFF52525B);
  static const zinc700 = Color(0xFF3F3F46);
  static const zinc800 = Color(0xFF27272A);
  static const zinc900 = Color(0xFF18181B);
  static const zinc950 = Color(0xFF09090B);

  // Primary Accent - Electric Violet
  static const violet50 = Color(0xFFF5F3FF);
  static const violet100 = Color(0xFFEDE9FE);
  static const violet200 = Color(0xFFDDD6FE);
  static const violet300 = Color(0xFFC4B5FD);
  static const violet400 = Color(0xFFA78BFA);
  static const violet500 = Color(0xFF8B5CF6); // Primary accent
  static const violet600 = Color(0xFF7C3AED);
  static const violet700 = Color(0xFF6D28D9);
  static const violet800 = Color(0xFF5B21B6);
  static const violet900 = Color(0xFF4C1D95);

  // Semantic Colors
  static const emerald500 = Color(0xFF10B981); // Success
  static const red500 = Color(0xFFEF4444); // Error/Danger
  static const amber500 = Color(0xFFF59E0B); // Warning

  // Pure Black for OLED
  static const pureBlack = Color(0xFF000000);
  static const pureWhite = Color(0xFFFFFFFF);

  // Glassmorphism
  static Color glassLight = Colors.white.withOpacity(0.4);
  static Color glassDark = zinc900.withOpacity(0.4);
  static Color glassBorderLight = Colors.white.withOpacity(0.5);
  static Color glassBorderDark = Colors.white.withOpacity(0.1);
}
