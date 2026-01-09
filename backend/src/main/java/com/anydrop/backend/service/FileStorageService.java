package com.anydrop.backend.service;

import com.anydrop.backend.model.HistoryItem;
import com.anydrop.backend.model.User;
import com.anydrop.backend.repository.HistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

@Service
public class FileStorageService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FileStorageService.class);

    private final HistoryRepository historyRepository;

    public FileStorageService(HistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    // In a real app, this should be configured. For now, use a local 'uploads' dir.
    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public HistoryItem storeFile(MultipartFile file, User user) {
        try {
            Files.createDirectories(this.fileStorageLocation);

            String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

            // Check for invalid chars
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Filename contains invalid path sequence " + originalFileName);
            }

            // Save file
            Path targetLocation = this.fileStorageLocation.resolve(System.currentTimeMillis() + "_" + originalFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Log to History
            HistoryItem item = new HistoryItem();
            item.setUser(user);
            item.setFilename(originalFileName);
            item.setStoredFilename(targetLocation.getFileName().toString());
            item.setSize(file.getSize());
            item.setType(file.getContentType());

            return historyRepository.save(item);

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + file.getOriginalFilename(), ex);
        }
    }

    public org.springframework.core.io.Resource loadFileAsResource(String fileName) {
        try {
            // In a real app we'd query the DB to get the actual path (since we prepend
            // timestamp).
            // For now, let's assume the frontend requests the *stored* filename
            // (timestamp_original).
            // BUT wait, frontend only knows original filename usually.
            // Better strategy: The frontend should request by History ID, and we look up
            // the filename.

            // To keep it simple without changing HistoryItem to store 'storedFilename':
            // We'll search for the file usage 'contains' or just list files?
            // Better: Store the 'storedFilename' in DB.
            // OR: Just assume for this demo that we are sending the actual stored filename
            // in the transfer request.

            // Actually, in storeFile we return HistoryItem.
            // Let's modify storeFile to save the stored path in the HistoryItem if
            // possible, or just return the stored name.

            // Quick fix: allow requesting by exact stored name.
            // If the user requests "foo.txt", we might fail finding "123_foo.txt".
            // Let's implement a 'fuzzy' find or better, Update HistoryItem to store the
            // path.

            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(
                    filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found " + fileName);
            }
        } catch (java.net.MalformedURLException ex) {
            throw new RuntimeException("File not found " + fileName, ex);
        }
    }
}
