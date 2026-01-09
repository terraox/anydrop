import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

/// Authentication provider for managing user state
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  String? _token;
  bool _isLoading = true;
  bool _isAuthenticated = false;
  
  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  UserPlan get plan => _user?.plan ?? UserPlan.scout;
  bool get isTitan => _user?.isTitan ?? false;

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        _user = await _authService.getUser();
        _token = await _authService.getToken();
        _isAuthenticated = _user != null;
      }
    } catch (e) {
      _isAuthenticated = false;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = await _authService.login(email, password);
      if (user != null) {
        _user = user;
        _token = await _authService.getToken();
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      // Login failed
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register(String email, String password, String? username) async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = await _authService.register(email, password, username);
      if (user != null) {
        _user = user;
        _token = await _authService.getToken();
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      // Registration failed
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _token = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  Future<void> updateProfile({String? username, String? avatar}) async {
    final updated = await _authService.updateProfile(
      username: username,
      avatar: avatar,
    );
    if (updated != null) {
      _user = updated;
      notifyListeners();
    }
  }
}
