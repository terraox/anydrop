import 'package:flutter/material.dart';
import '../core/theme/colors.dart';

/// Segmented control widget for Quick Save toggle
class SegmentedControl<T> extends StatelessWidget {
  final List<T> items;
  final T selectedItem;
  final String Function(T) labelBuilder;
  final Function(T) onSelectionChanged;
  final double borderRadius;

  const SegmentedControl({
    super.key,
    required this.items,
    required this.selectedItem,
    required this.labelBuilder,
    required this.onSelectionChanged,
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? AppColors.zinc900 : AppColors.zinc200,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: items.map((item) {
          final isSelected = item == selectedItem;
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelectionChanged(item),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected
                      ? (isDark ? AppColors.zinc800 : Colors.white)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(borderRadius - 4),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  labelBuilder(item),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected
                        ? AppColors.violet500
                        : (isDark ? AppColors.zinc500 : AppColors.zinc600),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

/// Quick Save segmented control
class QuickSaveControl extends StatelessWidget {
  final String selectedMode; // 'off', 'favourites', 'on'
  final Function(String) onModeChanged;

  const QuickSaveControl({
    super.key,
    required this.selectedMode,
    required this.onModeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SegmentedControl<String>(
      items: const ['off', 'favourites', 'on'],
      selectedItem: selectedMode,
      labelBuilder: (item) {
        switch (item) {
          case 'off':
            return 'Off';
          case 'favourites':
            return 'Favourites';
          case 'on':
            return 'On';
          default:
            return item;
        }
      },
      onSelectionChanged: onModeChanged,
    );
  }
}
