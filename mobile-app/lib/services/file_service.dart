import 'dart:async';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/file_transfer.dart';
import '../models/user.dart';
import 'throttling_service.dart';

/// File service for picking and transferring files
class FileService {
  final ThrottlingService _throttlingService = ThrottlingService();

  /// Pick files to send
  Future<List<PlatformFile>?> pickFiles({
    bool allowMultiple = true,
    List<String>? allowedExtensions,
  }) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: allowMultiple,
        type: allowedExtensions != null ? FileType.custom : FileType.any,
        allowedExtensions: allowedExtensions,
      );

      return result?.files;
    } catch (e) {
      return null;
    }
  }

  /// Pick images only
  Future<List<PlatformFile>?> pickImages({bool allowMultiple = true}) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: allowMultiple,
        type: FileType.image,
      );
      return result?.files;
    } catch (e) {
      return null;
    }
  }

  /// Pick media (images and videos)
  Future<List<PlatformFile>?> pickMedia({bool allowMultiple = true}) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: allowMultiple,
        type: FileType.media,
      );
      return result?.files;
    } catch (e) {
      return null;
    }
  }

  /// Upload file with progress tracking
  Future<FileTransfer?> uploadFile(
    PlatformFile file,
    String? authToken,
    UserPlan plan, {
    void Function(double progress)? onProgress,
    void Function(FileTransfer transfer)? onComplete,
    void Function(String error)? onError,
  }) async {
    // Check file size limit
    if (!_throttlingService.isFileSizeAllowed(file.size, plan)) {
      onError?.call('File size exceeds ${_throttlingService.getFileSizeLimitText(plan)} limit');
      return null;
    }

    final transfer = FileTransfer(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: file.name,
      type: file.extension ?? 'unknown',
      sizeBytes: file.size,
      status: TransferStatus.uploading,
    );

    try {
      // Create multipart request
      final request = http.MultipartRequest(
        'POST',
        Uri.parse(ApiConstants.fileUpload),
      );

      if (authToken != null) {
        request.headers['Authorization'] = 'Bearer $authToken';
      }

      // Add file
      if (file.path != null) {
        request.files.add(
          await http.MultipartFile.fromPath('file', file.path!),
        );
      } else if (file.bytes != null) {
        request.files.add(
          http.MultipartFile.fromBytes('file', file.bytes!, filename: file.name),
        );
      }

      // Send with progress tracking (simplified - full impl would need stream)
      final response = await request.send();

      if (response.statusCode == 200 || response.statusCode == 201) {
        final completedTransfer = transfer.copyWith(
          status: TransferStatus.completed,
          progress: 1.0,
        );
        onProgress?.call(1.0);
        onComplete?.call(completedTransfer);
        return completedTransfer;
      } else {
        onError?.call('Upload failed with status ${response.statusCode}');
        return transfer.copyWith(status: TransferStatus.failed);
      }
    } catch (e) {
      onError?.call(e.toString());
      return transfer.copyWith(
        status: TransferStatus.failed,
        errorMessage: e.toString(),
      );
    }
  }

  /// Create a transfer object from PlatformFile
  FileTransfer createTransfer(PlatformFile file) {
    return FileTransfer(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: file.name,
      type: file.extension ?? 'unknown',
      sizeBytes: file.size,
      status: TransferStatus.pending,
    );
  }

  /// Get file icon based on extension
  String getFileIcon(String? extension) {
    switch (extension?.toLowerCase()) {
      case 'pdf':
        return 'file-text';
      case 'doc':
      case 'docx':
        return 'file-text';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'video';
      case 'mp3':
      case 'wav':
      case 'aac':
        return 'music';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      default:
        return 'file';
    }
  }
}
