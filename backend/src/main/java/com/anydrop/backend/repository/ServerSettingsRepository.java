package com.anydrop.backend.repository;

import com.anydrop.backend.model.ServerSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServerSettingsRepository extends JpaRepository<ServerSettings, Long> {
    Optional<ServerSettings> findBySettingKey(String settingKey);
}
