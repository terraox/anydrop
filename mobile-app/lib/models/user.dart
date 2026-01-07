/// User plan tiers
enum UserPlan { scout, titan }

/// User model for authentication and profile
class User {
  final String id;
  final String email;
  final String? username;
  final String? avatar;
  final UserPlan plan;
  final String role;

  User({
    required this.id,
    required this.email,
    this.username,
    this.avatar,
    this.plan = UserPlan.scout,
    this.role = 'USER',
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      username: json['username'],
      avatar: json['avatar'],
      plan: json['plan'] == 'TITAN' ? UserPlan.titan : UserPlan.scout,
      role: json['role'] ?? 'USER',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'avatar': avatar,
      'plan': plan == UserPlan.titan ? 'TITAN' : 'SCOUT',
      'role': role,
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? username,
    String? avatar,
    UserPlan? plan,
    String? role,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      username: username ?? this.username,
      avatar: avatar ?? this.avatar,
      plan: plan ?? this.plan,
      role: role ?? this.role,
    );
  }

  bool get isTitan => plan == UserPlan.titan;
  bool get isAdmin => role == 'ADMIN';
}
