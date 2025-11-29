import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class BubbleLevel extends StatefulWidget {
  final double pitch;
  final double roll;
  final bool isLevel;
  final bool isUnsafe;
  final double size;

  const BubbleLevel({
    super.key,
    required this.pitch,
    required this.roll,
    required this.isLevel,
    required this.isUnsafe,
    this.size = 280,
  });

  @override
  State<BubbleLevel> createState() => _BubbleLevelState();
}

class _BubbleLevelState extends State<BubbleLevel>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _glowController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _glowController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _glowAnimation = Tween<double>(begin: 0.3, end: 0.7).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Calculate bubble position based on pitch and roll
    // Clamp to keep bubble within bounds (max ~10 degrees = edge of circle)
    final maxOffset = widget.size / 2 - 30; // Keep bubble inside
    final normalizedPitch = (widget.pitch / 10).clamp(-1.0, 1.0);
    final normalizedRoll = (widget.roll / 10).clamp(-1.0, 1.0);

    final bubbleX = normalizedRoll * maxOffset;
    final bubbleY = -normalizedPitch * maxOffset; // Invert for visual

    // Determine color based on state
    final Color primaryColor = widget.isUnsafe
        ? AppTheme.warningRed
        : widget.isLevel
            ? AppTheme.primaryGreen
            : AppTheme.primaryTeal;

    return AnimatedBuilder(
      animation: _glowAnimation,
      builder: (context, child) {
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                AppTheme.cardDark,
                AppTheme.cardDarkAlt,
                AppTheme.darkBackground,
              ],
              stops: const [0.0, 0.7, 1.0],
            ),
            boxShadow: [
              BoxShadow(
                color: primaryColor.withOpacity(_glowAnimation.value * 0.3),
                blurRadius: 40,
                spreadRadius: 5,
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
            border: Border.all(
              color: primaryColor.withOpacity(0.3),
              width: 2,
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer ring decorations
              _buildRings(primaryColor),

              // Grid lines
              _buildGrid(primaryColor),

              // Crosshair at center
              _buildCrosshair(primaryColor),

              // Target zone indicator
              _buildTargetZone(primaryColor),

              // The bubble
              _buildBubble(bubbleX, bubbleY, primaryColor),

              // Degree indicators
              _buildDegreeIndicators(primaryColor),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRings(Color color) {
    return CustomPaint(
      size: Size(widget.size, widget.size),
      painter: _RingsPainter(color: color),
    );
  }

  Widget _buildGrid(Color color) {
    return CustomPaint(
      size: Size(widget.size, widget.size),
      painter: _GridPainter(color: color.withOpacity(0.1)),
    );
  }

  Widget _buildCrosshair(Color color) {
    return CustomPaint(
      size: Size(widget.size, widget.size),
      painter: _CrosshairPainter(color: color.withOpacity(0.4)),
    );
  }

  Widget _buildTargetZone(Color color) {
    final targetSize = widget.size * 0.25;
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Container(
          width: targetSize * (widget.isLevel ? _pulseAnimation.value : 1.0),
          height: targetSize * (widget.isLevel ? _pulseAnimation.value : 1.0),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: widget.isLevel
                  ? AppTheme.primaryGreen.withOpacity(0.8)
                  : color.withOpacity(0.2),
              width: 2,
            ),
            color: widget.isLevel
                ? AppTheme.primaryGreen.withOpacity(0.1)
                : Colors.transparent,
          ),
        );
      },
    );
  }

  Widget _buildBubble(double x, double y, Color color) {
    const bubbleSize = 50.0;
    return AnimatedPositioned(
      duration: const Duration(milliseconds: 100),
      curve: Curves.easeOut,
      left: widget.size / 2 + x - bubbleSize / 2,
      top: widget.size / 2 + y - bubbleSize / 2,
      child: AnimatedBuilder(
        animation: _glowAnimation,
        builder: (context, child) {
          return Container(
            width: bubbleSize,
            height: bubbleSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Colors.white.withOpacity(0.9),
                  color.withOpacity(0.8),
                  color.withOpacity(0.6),
                ],
                stops: const [0.0, 0.4, 1.0],
                center: const Alignment(-0.3, -0.3),
              ),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(_glowAnimation.value),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(2, 4),
                ),
              ],
            ),
            child: Center(
              child: Container(
                width: 15,
                height: 15,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.5),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDegreeIndicators(Color color) {
    return Stack(
      children: [
        // Top (0°)
        Positioned(
          top: 15,
          left: 0,
          right: 0,
          child: Center(
            child: _DegreeLabel(text: '0°', color: color),
          ),
        ),
        // Bottom
        Positioned(
          bottom: 15,
          left: 0,
          right: 0,
          child: Center(
            child: _DegreeLabel(text: '0°', color: color),
          ),
        ),
        // Left
        Positioned(
          left: 15,
          top: 0,
          bottom: 0,
          child: Center(
            child: _DegreeLabel(text: '0°', color: color),
          ),
        ),
        // Right
        Positioned(
          right: 15,
          top: 0,
          bottom: 0,
          child: Center(
            child: _DegreeLabel(text: '0°', color: color),
          ),
        ),
      ],
    );
  }
}

class _DegreeLabel extends StatelessWidget {
  final String text;
  final Color color;

  const _DegreeLabel({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        color: color.withOpacity(0.5),
        fontSize: 10,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _RingsPainter extends CustomPainter {
  final Color color;

  _RingsPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    // Draw concentric rings
    for (var i = 1; i <= 4; i++) {
      final radius = (size.width / 2) * (i / 4) - 10;
      paint.color = color.withOpacity(0.1 + (i * 0.05));
      canvas.drawCircle(center, radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _GridPainter extends CustomPainter {
  final Color color;

  _GridPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 0.5;

    final center = size.width / 2;
    final radius = size.width / 2 - 20;

    // Draw diagonal lines
    for (var angle = 0; angle < 360; angle += 45) {
      final rad = angle * math.pi / 180;
      final x = center + radius * math.cos(rad);
      final y = center + radius * math.sin(rad);
      canvas.drawLine(Offset(center, center), Offset(x, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CrosshairPainter extends CustomPainter {
  final Color color;

  _CrosshairPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5;

    final center = size.width / 2;
    const crossSize = 20.0;

    // Horizontal line
    canvas.drawLine(
      Offset(center - crossSize, center),
      Offset(center + crossSize, center),
      paint,
    );

    // Vertical line
    canvas.drawLine(
      Offset(center, center - crossSize),
      Offset(center, center + crossSize),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
