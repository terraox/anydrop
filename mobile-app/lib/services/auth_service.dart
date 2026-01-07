import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../models/user.dart';

/// Authentication service for login, register, and token management
class AuthService {
  static const String _tokenKey = 'anydrop_auth_token';
  static const String _userKey = 'anydrop_user_data';

  /// Login with email and password
  Future<User?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.login),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(ApiConstants.connectionTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = User.fromJson(data['user']);
        await _saveToken(data['token']);
        await _saveUser(user);
        return user;
      }
      return null;
    } catch (e) {
      // Mock login for development
      return _mockLogin(email, password);
    }
  }

  /// Mock login for development when backend is unavailable
  Future<User?> _mockLogin(String email, String password) async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    if (email.isNotEmpty && password.isNotEmpty) {
      final user = User(
        id: 'mock-user-1',
        email: email,
        username: email.split('@').first,
        plan: email.contains('pro') ? UserPlan.titan : UserPlan.scout,
      );
      await _saveToken('mock-token-${DateTime.now().millisecondsSinceEpoch}');
      await _saveUser(user);
      return user;
    }
    return null;
  }

  /// Register new user
  Future<User?> register(String email, String password, String? username) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.register),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'username': username,
        }),
      ).timeout(ApiConstants.connectionTimeout);

      if (response.statusCode == 201) {
        // Auto-login after registration
        return login(email, password);
      }
      return null;
    } catch (e) {
      // Mock register for development
      return _mockLogin(email, password);
    }
  }

  /// Logout and clear stored credentials
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Get stored auth token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Get stored user data
  Future<User?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userData = prefs.getString(_userKey);
    if (userData != null) {
      return User.fromJson(jsonDecode(userData));
    }
    return null;
  }

  /// Update user profile
  Future<User?> updateProfile({String? username, String? avatar}) async {
    final user = await getUser();
    if (user == null) return null;

    final updatedUser = user.copyWith(
      username: username ?? user.username,
      avatar: avatar ?? user.avatar,
    );
    await _saveUser(updatedUser);
    return updatedUser;
  }

  // Private helpers
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> _saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }
}
