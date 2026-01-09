import 'dart:io';

/// File utility functions for MIME type detection and file handling
class FileUtils {
  /// Get MIME type from file extension
  static String getMimeType(String fileName) {
    final extension = fileName.split('.').last.toLowerCase();
    
    switch (extension) {
      // Images
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'bmp':
        return 'image/bmp';
      case 'svg':
        return 'image/svg+xml';
      case 'heic':
      case 'heif':
        return 'image/heic';
      
      // Videos
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      case 'mkv':
        return 'video/x-matroska';
      case 'webm':
        return 'video/webm';
      case '3gp':
        return 'video/3gpp';
      
      // Audio
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'm4a':
        return 'audio/mp4';
      case 'flac':
        return 'audio/flac';
      
      // Documents
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      
      // Archives
      case 'zip':
        return 'application/zip';
      case 'rar':
        return 'application/x-rar-compressed';
      case '7z':
        return 'application/x-7z-compressed';
      case 'tar':
        return 'application/x-tar';
      case 'gz':
        return 'application/gzip';
      
      // Text
      case 'txt':
        return 'text/plain';
      case 'json':
        return 'application/json';
      case 'xml':
        return 'application/xml';
      case 'html':
        return 'text/html';
      case 'css':
        return 'text/css';
      case 'js':
        return 'text/javascript';
      
      default:
        return 'application/octet-stream';
    }
  }
  
  /// Check if file is an image
  static bool isImage(String fileName) {
    final mime = getMimeType(fileName);
    return mime.startsWith('image/');
  }
  
  /// Check if file is a video
  static bool isVideo(String fileName) {
    final mime = getMimeType(fileName);
    return mime.startsWith('video/');
  }
  
  /// Check if file is an audio file
  static bool isAudio(String fileName) {
    final mime = getMimeType(fileName);
    return mime.startsWith('audio/');
  }
  
  /// Check if file is media (image, video, or audio)
  static bool isMedia(String fileName) {
    return isImage(fileName) || isVideo(fileName) || isAudio(fileName);
  }
  
  /// Get appropriate directory for file type on Android
  static String getAndroidDirectory(String fileName) {
    if (isImage(fileName)) {
      return '/storage/emulated/0/Pictures/AnyDrop';
    } else if (isVideo(fileName)) {
      return '/storage/emulated/0/Movies/AnyDrop';
    } else if (isAudio(fileName)) {
      return '/storage/emulated/0/Music/AnyDrop';
    } else {
      return '/storage/emulated/0/Download/AnyDrop';
    }
  }
  
  /// Get file extension
  static String getExtension(String fileName) {
    final parts = fileName.split('.');
    return parts.length > 1 ? parts.last.toLowerCase() : '';
  }
  
  /// Sanitize filename (remove invalid characters)
  static String sanitizeFileName(String fileName) {
    // Remove invalid characters for file systems
    return fileName.replaceAll(RegExp(r'[<>:"/\\|?*]'), '_');
  }
}
