# Làm việc với ArtleBake

1. Đọc entry point, implementation và caller của feature trước khi sửa. Khi chọn vị trí file hoặc thay đổi luồng UI, API hay FastAPI, đọc [kiến trúc frontend](docs/architecture.md).
2. Trước khi thêm helper hoặc logic, tìm theo chức năng và tên hàm trong `utils/`, `lib/`, `hooks/` và module cùng feature. Dùng [hướng dẫn tái sử dụng](docs/reuse-guide.md) để bắt đầu, rồi đối chiếu implementation và caller với hành vi cần có.
3. Dùng lại hàm đáp ứng đúng contract. Với biến thể nhỏ, cân nhắc mở rộng hàm nếu giữ được hành vi của các caller cũ. Khi cần hàm mới, ghi ngắn gọn trong bàn giao những hàm đã kiểm tra và lý do chưa phù hợp.
4. Đặt tên theo mục đích, giữ trách nhiệm rõ theo lớp và đặt logic gần feature sử dụng. Giữ một nguồn cho cùng nghiệp vụ. Chỉ tách helper khi có trách nhiệm rõ hoặc tái sử dụng thực tế.
5. Chạy kiểm tra phù hợp với thay đổi bằng các script trong [package.json](package.json). Với TypeScript, chọn lint và type-check phù hợp, rồi kiểm tra hành vi qua entry point thực tế. Báo lệnh đã chạy và phần còn chưa xác minh.

Đọc [README](README.md) khi cần setup local hoặc cấu hình dịch vụ. Đọc [plan tích hợp FastAPI](docs/plans/fastapi-integration.md) trước khi làm một phase migration.
