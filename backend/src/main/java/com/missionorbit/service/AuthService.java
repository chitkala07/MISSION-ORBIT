package com.missionorbit.service;

import com.missionorbit.dto.ApiDtos.*;
import com.missionorbit.entity.User;
import com.missionorbit.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Map<String, Object> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email().toLowerCase())) {
            throw new IllegalArgumentException("Email is already registered.");
        }
        User u = new User();
        u.setCallsign(req.callsign().trim());
        u.setEmail(req.email().toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setRole("COMMANDER");
        User saved = userRepository.save(u);
        return Map.of("id", saved.getId(), "callsign", saved.getCallsign(), "email", saved.getEmail(), "role", saved.getRole());
    }

    public Map<String, Object> login(LoginRequest req) {
        User u = userRepository.findByEmail(req.email().toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials."));
        if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials.");
        }
        return Map.of("id", u.getId(), "callsign", u.getCallsign(), "email", u.getEmail(), "role", u.getRole());
    }
}
