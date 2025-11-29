import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../math/leveling_math.dart';

class AdjustmentCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final double requiredHeight;
  final BlockPlan blockPlan;
  final IconData icon;
  final String direction;

  const AdjustmentCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.requiredHeight,
    required this.blockPlan,
    required this.icon,
    required this.direction,
  });

  @override
  Widget build(BuildContext context) {
    final isLevel = requiredHeight < 0.25;
    final color = isLevel ? AppTheme.primaryGreen : AppTheme.accentOrange;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.cardDark,
            AppTheme.cardDarkAlt,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (!isLevel)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    direction,
                    style: TextStyle(
                      color: color,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          if (isLevel)
            _buildLevelIndicator()
          else
            _buildAdjustmentDetails(color),
        ],
      ),
    );
  }

  Widget _buildLevelIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primaryGreen.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle,
            color: AppTheme.primaryGreen,
            size: 24,
          ),
          const SizedBox(width: 12),
          const Text(
            'Already Level!',
            style: TextStyle(
              color: AppTheme.primaryGreen,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdjustmentDetails(Color color) {
    return Column(
      children: [
        // Exact measurement
        Row(
          children: [
            Expanded(
              child: _MeasurementBox(
                label: 'Exact Lift Needed',
                value: '${requiredHeight.toStringAsFixed(2)}"',
                color: color,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MeasurementBox(
                label: 'Block Stack Total',
                value: '${blockPlan.total.toStringAsFixed(2)}"',
                color: AppTheme.primaryTeal,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Block visualization
        if (blockPlan.blocks.isNotEmpty) _buildBlockStack(color),
      ],
    );
  }

  Widget _buildBlockStack(Color color) {
    // Group blocks by height and count them
    final blockCounts = <double, int>{};
    for (final block in blockPlan.blocks) {
      blockCounts[block] = (blockCounts[block] ?? 0) + 1;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recommended Blocks',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: blockCounts.entries.map((entry) {
              return _BlockChip(
                height: entry.key,
                count: entry.value,
                color: color,
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          // Visual stack representation
          _buildVisualStack(color),
        ],
      ),
    );
  }

  Widget _buildVisualStack(Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Ground indicator
        Container(
          width: 80,
          height: 4,
          decoration: BoxDecoration(
            color: AppTheme.textMuted,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        // Stack visualization
        Column(
          children: [
            for (int i = 0; i < blockPlan.blocks.length && i < 5; i++)
              Container(
                width: 60,
                height: (blockPlan.blocks[i] * 8).clamp(8.0, 30.0),
                margin: const EdgeInsets.only(bottom: 2),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      color.withOpacity(0.8),
                      color.withOpacity(0.6),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(
                    color: color,
                    width: 1,
                  ),
                ),
                child: Center(
                  child: Text(
                    '${blockPlan.blocks[i]}"',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            if (blockPlan.blocks.length > 5)
              Text(
                '+${blockPlan.blocks.length - 5} more',
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 10,
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
        // Wheel indicator
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppTheme.cardDarkAlt,
            border: Border.all(
              color: AppTheme.textMuted,
              width: 2,
            ),
          ),
          child: const Icon(
            Icons.circle,
            color: AppTheme.textMuted,
            size: 10,
          ),
        ),
      ],
    );
  }
}

class _MeasurementBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MeasurementBox({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _BlockChip extends StatelessWidget {
  final double height;
  final int count;
  final Color color;

  const _BlockChip({
    required this.height,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${count}x',
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '$height"',
            style: TextStyle(
              color: color.withOpacity(0.8),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
