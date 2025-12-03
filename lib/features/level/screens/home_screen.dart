import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/providers/level_provider.dart';
import '../widgets/bubble_level.dart';
import '../widgets/tilt_card.dart';
import '../widgets/adjustment_card.dart';
import '../../settings/screens/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..forward();
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LevelProvider>(
      builder: (context, provider, child) {
        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: SystemUiOverlayStyle.light,
          child: Scaffold(
            body: Container(
              decoration: const BoxDecoration(
                gradient: AppTheme.backgroundGradient,
              ),
              child: SafeArea(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Column(
                    children: [
                      _buildAppBar(context, provider),
                      Expanded(
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            children: [
                              const SizedBox(height: 10),
                              _buildStatusBanner(provider),
                              const SizedBox(height: 24),
                              _buildBubbleLevel(provider),
                              const SizedBox(height: 24),
                              _buildTiltCards(provider),
                              const SizedBox(height: 24),
                              _buildTabSection(provider),
                              const SizedBox(height: 24),
                              _buildQuickActions(context, provider),
                              const SizedBox(height: 30),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAppBar(BuildContext context, LevelProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'FlatFinder',
                style: TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: provider.demoMode
                          ? AppTheme.accentOrange
                          : AppTheme.primaryGreen,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    provider.demoMode ? 'Demo Mode' : 'Live Sensor',
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Row(
            children: [
              _buildIconButton(
                icon: provider.demoMode ? Icons.sensors_off : Icons.sensors,
                onTap: () => provider.setDemoMode(!provider.demoMode),
                tooltip: provider.demoMode ? 'Use Sensors' : 'Demo Mode',
              ),
              const SizedBox(width: 8),
              _buildIconButton(
                icon: Icons.settings_outlined,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const SettingsScreen(),
                  ),
                ),
                tooltip: 'Settings',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    required VoidCallback onTap,
    String? tooltip,
  }) {
    return Tooltip(
      message: tooltip ?? '',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.cardDark.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withOpacity(0.1),
                width: 1,
              ),
            ),
            child: Icon(
              icon,
              color: AppTheme.textPrimary,
              size: 22,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBanner(LevelProvider provider) {
    final isLevel = provider.isLevel;
    final isUnsafe = provider.isUnsafe;

    Color bgColor;
    Color textColor;
    IconData icon;
    String message;

    if (isUnsafe) {
      bgColor = AppTheme.warningRed.withOpacity(0.15);
      textColor = AppTheme.warningRed;
      icon = Icons.warning_rounded;
      message = 'Slope exceeds safe limits! Consider repositioning.';
    } else if (isLevel) {
      bgColor = AppTheme.primaryGreen.withOpacity(0.15);
      textColor = AppTheme.primaryGreen;
      icon = Icons.check_circle_rounded;
      message = 'Your rig is level! Ready for a great stay.';
    } else {
      bgColor = AppTheme.primaryTeal.withOpacity(0.15);
      textColor = AppTheme.primaryTeal;
      icon = Icons.info_rounded;
      message = 'Adjustments needed. See recommendations below.';
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: textColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: textColor, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: textColor,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBubbleLevel(LevelProvider provider) {
    return Center(
      child: Hero(
        tag: 'bubble_level',
        child: BubbleLevel(
          pitch: provider.pitch,
          roll: provider.roll,
          isLevel: provider.isLevel,
          isUnsafe: provider.isUnsafe,
          size: MediaQuery.of(context).size.width * 0.75,
        ),
      ),
    );
  }

  Widget _buildTiltCards(LevelProvider provider) {
    return Row(
      children: [
        Expanded(
          child: TiltCard(
            title: 'Pitch',
            subtitle: provider.pitchDirection,
            value: provider.pitch,
            icon: Icons.swap_vert_rounded,
            isWarning: provider.pitch.abs() >= provider.safetyLimitDegrees,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: TiltCard(
            title: 'Roll',
            subtitle: provider.rollDirection,
            value: provider.roll,
            icon: Icons.swap_horiz_rounded,
            isWarning: provider.roll.abs() >= provider.safetyLimitDegrees,
          ),
        ),
      ],
    );
  }

  Widget _buildTabSection(LevelProvider provider) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppTheme.cardDark,
            borderRadius: BorderRadius.circular(16),
          ),
          child: TabBar(
            controller: _tabController,
            indicator: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            labelColor: AppTheme.primaryGreen,
            unselectedLabelColor: AppTheme.textSecondary,
            labelStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            tabs: const [
              Tab(text: 'Side-to-Side'),
              Tab(text: 'Front-to-Back'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 280,
          child: TabBarView(
            controller: _tabController,
            children: [
              AdjustmentCard(
                title: 'Side Leveling',
                subtitle: 'Raise the ${provider.roll > 0 ? "right" : "left"} side',
                requiredHeight: provider.sideShim,
                blockPlan: provider.sideBlockPlan,
                icon: Icons.swap_horiz_rounded,
                direction: provider.rollDirection,
              ),
              AdjustmentCard(
                title: provider.vehicleType == VehicleType.trailer
                    ? 'Hitch Adjustment'
                    : 'Front Axle Leveling',
                subtitle: provider.vehicleType == VehicleType.trailer
                    ? '${provider.pitch > 0 ? "Lower" : "Raise"} the hitch'
                    : 'Raise the ${provider.pitch > 0 ? "front" : "rear"} axle',
                requiredHeight: provider.vehicleType == VehicleType.trailer
                    ? provider.hitchLift
                    : provider.foreAftShim,
                blockPlan: provider.foreAftBlockPlan,
                icon: Icons.swap_vert_rounded,
                direction: provider.pitchDirection,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, LevelProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionButton(
                icon: Icons.gps_fixed,
                label: 'Calibrate',
                sublabel: 'Set as level',
                onTap: () => _showCalibrateDialog(context, provider),
                color: AppTheme.primaryGreen,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionButton(
                icon: Icons.restart_alt,
                label: 'Reset',
                sublabel: 'Clear calibration',
                onTap: () => provider.resetCalibration(),
                color: AppTheme.primaryTeal,
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _showCalibrateDialog(BuildContext context, LevelProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.cardDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        title: const Text(
          'Calibrate Level',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: const Text(
          'This will set the current position as perfectly level. Make sure your rig is actually level before proceeding.',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              provider.calibrate();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Calibration saved!'),
                  backgroundColor: AppTheme.primaryGreen,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Calibrate',
              style: TextStyle(color: AppTheme.darkBackground),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final VoidCallback onTap;
  final Color color;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: AppTheme.glassGradient,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: color.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      sublabel,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: color.withOpacity(0.5),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
