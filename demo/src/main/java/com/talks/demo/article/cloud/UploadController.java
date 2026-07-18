package com.talks.demo.article.cloud;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/cloud")
public class UploadController {

    @Autowired
    private S3Client s3Client;

    // R2 bucket 名稱由環境變數 R2_BUCKET 注入。
    @Value("${r2.bucket}")
    String bucketName;

    @Value("${r2.endpoint}")
    String r2Endpoint;

    @Value("${r2.public-url:}")
    String r2PublicUrl;

    @PostMapping("/uploadImg")
    public ResponseEntity<String> uploadFile(@RequestParam("image") MultipartFile file) {
        try {
            // 使用 UUID 生成唯一的文件名，避免文件名衝突
            String originalFilename = file.getOriginalFilename() == null ? "image" : Paths.get(file.getOriginalFilename()).getFileName().toString();
            String cleanedFilename = originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_"); // 清理文件名中的特殊字符
            String key = UUID.randomUUID() + "-" + cleanedFilename;
            // 確定文件的 Content-Type
            String contentType = file.getContentType(); // 從上傳的文件獲取 MIME 類型

            // 建立 R2 上傳請求；R2 相容 S3 API，這裡沿用 AWS SDK v2。
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)  // 設定要上傳的 bucket
                    .key(key)            // 設定文件在存儲桶中的 key
                    .contentType(contentType) // 設定文件的 Content-Type
                    .build();

            // 將圖片上傳到 Cloudflare R2
            s3Client.putObject(putObjectRequest, software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes()));

            // 公開網址沒設定時直接報錯，避免回傳錯誤圖片網址
            if (r2PublicUrl == null || r2PublicUrl.isBlank()) {
                throw new IllegalStateException("R2_PUBLIC_URL 尚未設定");
            }
            // 使用 R2 公開讀取網址組成圖片 URL
            String imageUrl = r2PublicUrl.replaceAll("/+$", "") + "/" + key;
            System.out.println(imageUrl);
            return ResponseEntity.ok(imageUrl);  // 返回圖片的 URL
        } catch (Exception e) {
            // 如果上傳過程中出現錯誤，返回 500 狀態碼並帶上錯誤信息
            return ResponseEntity.status(500).body("圖片上傳失敗：" + e.getMessage());
        }
    }

    @DeleteMapping("/deleteImg")
    public ResponseEntity<?> deleteImage(@RequestParam String imageUrl) {
        try {
            // 從 imageUrl 解析出 key（即檔案名稱）
            String key = imageUrl.substring(imageUrl.lastIndexOf("/") + 1); // 獲取檔案名稱作為 key

            // 創建刪除請求
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName) // 指定 bucket
                    .key(key) // 指定 key
                    .build();

            // 執行刪除操作
            s3Client.deleteObject(deleteObjectRequest);

            // 返回成功回應
            return ResponseEntity.ok("Image deleted successfully");
        } catch (Exception e) {
            // 捕捉異常並返回內部伺服器錯誤回應
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete image");
        }
    }

}
