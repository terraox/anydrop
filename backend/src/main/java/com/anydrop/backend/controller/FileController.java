package com.anydrop.backend.controller;

import com.anydrop.backend.model.HistoryItem;
import com.anydrop.backend.model.User;
import com.anydrop.backend.repository.UserRepository;
import com.anydrop.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    @PostMapping("/upload")
    public ResponseEntity<HistoryItem> uploadFile(@RequestParam("file") MultipartFile file, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        HistoryItem savedItem = fileStorageService.storeFile(file, user);
        return ResponseEntity.ok(savedItem);
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(@PathVariable String filename,
            jakarta.servlet.http.HttpServletRequest request) {
        // Load file as Resource
        org.springframework.core.io.Resource resource = fileStorageService.loadFileAsResource(filename);

        // Try to determine file's content type
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (java.io.IOException ex) {
            // Default to binary if type detection fails
        }

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
