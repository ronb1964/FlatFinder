import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/level/math/leveling_math.dart';

enum VehicleType { trailer, van, motorhome }

class LevelProvider extends ChangeNotifier {
  // Sensor readings
  double _pitch = 0.0;
  double _roll = 0.0;
  double _rawPitch = 0.0;
  double _rawRoll = 0.0;

  // Vehicle settings
  VehicleType _vehicleType = VehicleType.trailer;
  double _trackWidth = 72.0; // inches
  double _wheelbase = 120.0; // inches
  double _axleToHitch = 180.0; // inches

  // Calibration
  Calibration _calibration = const Calibration();

  // Block heights available (inches)
  List<double> _blockHeights = [3.5, 2.0, 1.0, 0.75, 0.5, 0.25];

  // Safety threshold
  double _safetyLimitDegrees = 6.0;

  // Demo mode for testing without sensors
  bool _demoMode = false;
  Timer? _demoTimer;

  // Subscriptions
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;

  // Getters
  double get pitch => _pitch;
  double get roll => _roll;
  double get rawPitch => _rawPitch;
  double get rawRoll => _rawRoll;
  VehicleType get vehicleType => _vehicleType;
  double get trackWidth => _trackWidth;
  double get wheelbase => _wheelbase;
  double get axleToHitch => _axleToHitch;
  Calibration get calibration => _calibration;
  List<double> get blockHeights => _blockHeights;
  double get safetyLimitDegrees => _safetyLimitDegrees;
  bool get demoMode => _demoMode;

  // Computed values
  bool get isLevel => _pitch.abs() < 0.5 && _roll.abs() < 0.5;
  bool get isUnsafe => isSlopePossiblyUnsafe(
        pitchDegrees: _pitch,
        rollDegrees: _roll,
        limitDegrees: _safetyLimitDegrees,
      );

  double get sideShim => computeSideShim(
        trackWidthInches: _trackWidth,
        rollDegrees: _roll,
      );

  double get hitchLift => computeHitchLift(
        axleToHitchInches: _axleToHitch,
        pitchDegrees: _pitch,
      );

  double get foreAftShim => computeForeAftShimForVans(
        wheelbaseInches: _wheelbase,
        pitchDegrees: _pitch,
      );

  BlockPlan get sideBlockPlan => planBlocks(
        heightInches: sideShim,
        blockHeightsInches: _blockHeights,
      );

  BlockPlan get foreAftBlockPlan => planBlocks(
        heightInches: _vehicleType == VehicleType.trailer ? hitchLift : foreAftShim,
        blockHeightsInches: _blockHeights,
      );

  String get pitchDirection => _pitch > 0.1
      ? 'Nose Up'
      : _pitch < -0.1
          ? 'Nose Down'
          : 'Level';

  String get rollDirection => _roll > 0.1
      ? 'Right Side Low'
      : _roll < -0.1
          ? 'Left Side Low'
          : 'Level';

  LevelProvider() {
    _loadSettings();
    _startSensorListening();
  }

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _vehicleType = VehicleType.values[prefs.getInt('vehicleType') ?? 0];
      _trackWidth = prefs.getDouble('trackWidth') ?? 72.0;
      _wheelbase = prefs.getDouble('wheelbase') ?? 120.0;
      _axleToHitch = prefs.getDouble('axleToHitch') ?? 180.0;
      _calibration = Calibration(
        pitchOffsetDegrees: prefs.getDouble('pitchOffset') ?? 0.0,
        rollOffsetDegrees: prefs.getDouble('rollOffset') ?? 0.0,
      );
      _safetyLimitDegrees = prefs.getDouble('safetyLimit') ?? 6.0;
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading settings: $e');
    }
  }

  Future<void> _saveSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('vehicleType', _vehicleType.index);
      await prefs.setDouble('trackWidth', _trackWidth);
      await prefs.setDouble('wheelbase', _wheelbase);
      await prefs.setDouble('axleToHitch', _axleToHitch);
      await prefs.setDouble('pitchOffset', _calibration.pitchOffsetDegrees);
      await prefs.setDouble('rollOffset', _calibration.rollOffsetDegrees);
      await prefs.setDouble('safetyLimit', _safetyLimitDegrees);
    } catch (e) {
      debugPrint('Error saving settings: $e');
    }
  }

  void _startSensorListening() {
    _accelerometerSubscription = accelerometerEventStream().listen(
      (AccelerometerEvent event) {
        _updateFromAccelerometer(event.x, event.y, event.z);
      },
      onError: (error) {
        debugPrint('Accelerometer error: $error');
        // Enable demo mode if sensors aren't available
        if (!_demoMode) {
          setDemoMode(true);
        }
      },
    );
  }

  void _updateFromAccelerometer(double x, double y, double z) {
    // Convert accelerometer data to pitch and roll angles
    // Pitch: rotation around X axis (nose up/down)
    // Roll: rotation around Y axis (side to side)
    _rawPitch = math.atan2(y, math.sqrt(x * x + z * z)) * 180 / math.pi;
    _rawRoll = math.atan2(x, math.sqrt(y * y + z * z)) * 180 / math.pi;

    // Apply calibration
    _pitch = _calibration.applyPitch(_rawPitch);
    _roll = _calibration.applyRoll(_rawRoll);

    notifyListeners();
  }

  void setDemoMode(bool enabled) {
    _demoMode = enabled;
    if (enabled) {
      _demoTimer?.cancel();
      double time = 0;
      _demoTimer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
        time += 0.05;
        _rawPitch = 3.0 * math.sin(time * 0.5) + 0.5 * math.sin(time * 2.3);
        _rawRoll = 2.5 * math.sin(time * 0.7 + 1) + 0.3 * math.cos(time * 1.8);
        _pitch = _calibration.applyPitch(_rawPitch);
        _roll = _calibration.applyRoll(_rawRoll);
        notifyListeners();
      });
    } else {
      _demoTimer?.cancel();
      _demoTimer = null;
    }
    notifyListeners();
  }

  void calibrate() {
    _calibration = Calibration(
      pitchOffsetDegrees: _rawPitch,
      rollOffsetDegrees: _rawRoll,
    );
    _pitch = 0;
    _roll = 0;
    _saveSettings();
    notifyListeners();
  }

  void resetCalibration() {
    _calibration = const Calibration();
    _pitch = _rawPitch;
    _roll = _rawRoll;
    _saveSettings();
    notifyListeners();
  }

  void setVehicleType(VehicleType type) {
    _vehicleType = type;
    _saveSettings();
    notifyListeners();
  }

  void setTrackWidth(double width) {
    _trackWidth = width;
    _saveSettings();
    notifyListeners();
  }

  void setWheelbase(double wheelbase) {
    _wheelbase = wheelbase;
    _saveSettings();
    notifyListeners();
  }

  void setAxleToHitch(double distance) {
    _axleToHitch = distance;
    _saveSettings();
    notifyListeners();
  }

  void setSafetyLimit(double limit) {
    _safetyLimitDegrees = limit;
    _saveSettings();
    notifyListeners();
  }

  @override
  void dispose() {
    _accelerometerSubscription?.cancel();
    _demoTimer?.cancel();
    super.dispose();
  }
}
