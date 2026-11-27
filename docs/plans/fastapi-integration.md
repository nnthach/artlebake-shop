# Kế hoạch tích hợp FastAPI vào ArtleBake

Frontend là worktree `qc-api`. Backend tham chiếu nằm tại `/Users/nttn/Developer/SelfStudy/Python/fastapi` và chỉ dùng để đọc contract. Các phase chuyển từng luồng qua Next.js route handler cùng origin. Dùng native `fetch` và URL cố định theo từng route. Giữ địa chỉ backend trong biến server-side, xử lý HTTP status trước khi đọc payload và chuẩn hóa lỗi cho consumer hiện tại. Chuyển các luồng có ghi dữ liệu theo từng nhóm để tránh hai hệ thống cùng xử lý một giao dịch.

## Phase 1 — Đọc danh mục đang hoạt động cho menu

`components/sections/menu/MenuSection.tsx` gọi `GET /api/categories?is_active=true`. Bộ lọc desktop/mobile trong `MenuSectionFilter.tsx` dùng `id` và `name[locale]`. Giữ nguyên lời gọi và UI. Route Next.js giữ public contract, chọn nguồn dữ liệu và chuẩn hóa lỗi 502. Hướng dẫn cấu hình nằm trong `README.md`.

- Khi có `FASTAPI_BASE_URL` và `is_active=true`, gọi `GET /store-front/categories` qua server với native `fetch`, `cache: "no-store"` và timeout hữu hạn. Chấp nhận base URL HTTP(S) và dấu gạch chéo cuối. Dùng base URL do operator cấu hình, không lấy host từ request.
- Chuyển `sort_by` và `order` đã chuẩn hóa theo handler hiện tại, mặc định `created_at/desc`. Backend luôn lọc active và nhận `page`, `limit` (tối đa 100), `sort_by`, `order`, `locale` (mặc định `vi`). Không gửi `is_active` lên FastAPI. Lấy các trang với `limit=100` theo `pagination.total_pages` để giữ danh sách đầy đủ.
- `APIListResponse[list[CategoryResponse]]` có `success/message/data/pagination`. Hàng có UUID `id`, `name: {vi,en}`, `description` và `slug` song ngữ có thể null, `is_active`, `created_at` và `updated_at` có thể null. Trả `{success:true,data}` cho caller, giữ danh mục song ngữ và các trường trả về. Kiểm tra tối thiểu envelope, mảng và metadata phân trang trước khi dùng. Tham chiếu `app/routes/store_front/categories.py` và `app/schemas/{category,store_front,response}.py` của backend.
- Khi biến chưa được đặt, hoặc request lấy danh mục không phải `is_active=true`, giữ nhánh Supabase hiện tại. Đặt nhánh FastAPI trước kiểm tra cấu hình Supabase để kiểm thử độc lập. Nếu đã chọn FastAPI mà upstream trả lỗi HTTP, JSON hoặc envelope lỗi, timeout hay mất kết nối, trả 502 với `{success:false,error}` chung. Không fallback ngầm, không trả URL hoặc lỗi upstream cho browser.
- Kiểm thử bằng upstream HTTP mock cục bộ và `npm run dev` với `FASTAPI_BASE_URL=http://127.0.0.1:<port>`. Gọi `curl -i 'http://localhost:3000/api/categories?is_active=true'`. Xác nhận request upstream đúng path, query mặc định/sort tùy chọn, 200 với danh mục song ngữ, danh sách rỗng, hai trang ghép đúng thứ tự và 502 với upstream lỗi/timeout. Tắt biến và xác nhận route lại dùng Supabase. Nếu thiếu cấu hình Supabase, kết quả kỳ vọng là lỗi cấu hình hiện có. Chạy `npm run lint -- --file app/api/categories/route.ts` và `npx --no-install tsc --noEmit`. Khi có môi trường test cùng bộ ID ở hai backend, kiểm tra chọn danh mục trên menu desktop/mobile và đổi VI/EN. Phase 1 cần ID danh mục khớp với nguồn menu cũ để bộ lọc hoạt động đúng khi bật trong môi trường dùng dữ liệu thật.

### Cấu trúc HTTP và service trong Phase 1

Tái sử dụng wrapper server-side hiện có ở `lib/fastapi/server.ts` và chuyển nội dung sang cấu trúc dưới đây. Sau khi chuyển hết caller, bỏ file cũ để có một nguồn cấu hình.

- `lib/fastapi/http-client.ts` chứa `httpClient.request(method, route, options)`, kiểm tra biến cấu hình và tạo timeout dùng chung. Giữ nguyên chuẩn hóa và kiểm tra base URL HTTP(S), origin và base path, query lặp qua URLSearchParams, custom headers, JSON hoặc raw body, `cache: "no-store"` mặc định có thể được ghi đè, redirect thủ công, signal do caller cấp, throw khi HTTP lỗi và trả native `Response` khi thành công, kể cả 204.
- `lib/fastapi/api.ts` chỉ export năm hàm `get`, `post`, `put`, `patch`, `delete`, chuyển tiếp vào `httpClient.request()`. Các hàm nhận route và options như wrapper hiện tại.
- `lib/fastapi/categories.ts` là service danh mục. Dùng `get` từ `api.ts` và đặt endpoint, kiểu cho trang response, kiểm tra envelope, query và vòng lặp phân trang trong service. Tạo một signal cho cả lượt tải. Next.js route giữ nhánh Supabase, cách chuẩn hóa query và định dạng response lỗi và thành công hiện tại.
- Kiểm tra cả năm HTTP methods bằng fetch mock, gồm base path, route ngoài origin/thoát prefix, redirect, query lặp, headers, JSON, raw body, timeout/caller signal, cache override, HTTP lỗi và native 204. Chạy lint trên các file TypeScript thay đổi, TypeScript toàn repo và HTTP mock danh mục. Auth refresh thuộc Phase 4.

## Phase 2 — Danh mục sản phẩm và ngày đặt trước

| Màn hình hoặc caller | API FastAPI và contract cần kiểm tra |
| --- | --- |
| Trang chủ `BestsellerSection`, `/api/products` | `GET /store-front/products`, `StoreFrontProductListQuery` hỗ trợ `is_bestseller`, locale và phân trang. Đối chiếu `ProductSummaryResponse` với card, số tiền Decimal và slug theo ngôn ngữ. |
| Menu và gợi ý ở chi tiết, `/api/products/menu` | `GET /store-front/menu`, `MenuListResponse` có `data`, `pagination`, `preorder_range`; mỗi sản phẩm có `daily` và `preorder.schedules`. Gửi `category_id`, `search`, `order`, `page`, `limit`, `locale`; FastAPI cố định active và sort theo ngày tạo. |
| Chi tiết `/menu/[slug]`, `/api/products/[slug]` | `GET /store-front/products/{slug}?locale=...`. Đối chiếu sản phẩm dịch, stock, preorder và 404 với `ProductDetailClient`. |
| `PreorderDateSelector`, `/api/preorder-items/available-dates` | `GET /store-front/available-dates`, đối chiếu danh sách `product_ids` và `AvailableDateResponse` gồm `schedule_id/date`. Kiểm tra giao các ngày chung của nhiều sản phẩm và trường hợp rỗng. |

Kiểm thử bằng fixture VI/EN, tìm kiếm, danh mục, trang cuối, hết hàng, slug không tồn tại và ngày theo múi giờ nghiệp vụ. Đối chiếu `app/schemas/{store_front,product,menu,response}.py` và `tests/integration/test_store_front.py`. Xác minh hành vi cần thay thế của route legacy `/api/store-inventories` trước khi dọn route.

## Phase 3 — Checkout và thanh toán

`/order`, `/payment`, `/order/success` lần lượt dùng `POST /checkout/orders`, `GET /checkout/payment-status`, `POST /checkout/cancel-payment`, `GET /checkout/orders/{order_id}`. Dùng `CheckoutCreateRequest` làm contract cho thông tin liên hệ, fulfillment, order type, preorder date và item UUID/quantity. FastAPI tính giá và kiểm tra tồn. Giữ mã đơn dưới dạng chuỗi, chuyển `orderCode` từ callback PayOS sang `order_code` cho status/cancel. Đối chiếu `CheckoutCreatedResponse` (`id/order_code/payment_link`) và `CheckoutOrderResponse` (Decimal dạng chuỗi, `order_items`, lịch preorder tùy chọn). Kiểm thử PayOS sandbox với paid/cancel/expire, webhook lặp, hết tồn và đơn chưa thanh toán. Đối chiếu `app/schemas/checkout.py` và `tests/integration/test_checkout.py`. Phối hợp chuyển webhook `POST /webhooks/payos` và job ở Phase 6 trước khi chuyển nhận đơn thật.

## Phase 4 — Đăng nhập admin và phiên

Đối chiếu màn hình signin/register-password, `AuthContext` và admin layout với `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout`, `PATCH /auth/change-password`. Login dùng `email/password`. Map `data.role.name`, `is_active`, `must_change_password` sang mô hình UI. Chuyển tiếp từng Set-Cookie, thiết kế path để refresh cookie có mặt ở route proxy, giữ HttpOnly/Secure phù hợp và gửi `X-CSRF-Token` cho các ghi yêu cầu CSRF. Chỉ có một refresh đồng thời vì refresh token xoay vòng. Kiểm tra đăng nhập, hết phiên, logout, ép đổi mật khẩu, tài khoản bị khóa, quyền theo role và lỗi CSRF bằng `tests/integration/test_auth.py` và trình duyệt trên môi trường test.

### Refresh token và ranh giới proxy

Contract hiện có tại `app/routes/auth.py`, `app/core/cookies.py` và `app/services/auth_service.py`. `POST /auth/refresh` cần cookie `refresh_token` cùng header `X-CSRF-Token` khớp với cookie `csrf_token`. Thành công xoay refresh token và trả ba Set-Cookie. Access và CSRF có path `/`. Refresh là HttpOnly và chỉ có path `/auth`. CSRF sai trả 403. Refresh token thiếu, hết hạn hoặc bị tái sử dụng trả 401. Tái sử dụng token đã xoay có thể thu hồi phiên.

- Proxy Next.js cùng origin phụ trách nhận Cookie/CSRF từ browser, chuyển sang FastAPI và chuyển từng Set-Cookie về browser. Chốt URL auth cùng origin dưới `/auth` hoặc map path của refresh cookie một cách nhất quán cho login, refresh và logout. Cookie giới hạn ở auth path sẽ không có mặt trong request browser tới route nghiệp vụ. Giữ HttpOnly, Secure và SameSite, kiểm tra domain trong môi trường đích.
- Lớp HTTP của luồng auth chỉ khởi động refresh khi request được đánh dấu cần auth nhận 401, phiên có điều kiện refresh hợp lệ và request có thể gửi lại an toàn. Dùng auth proxy riêng qua browser khi request nghiệp vụ không có refresh cookie. Chính refresh, các route công khai và 403 không kích hoạt auto-refresh. Sau khi browser nhận cookie mới, gửi lại request gốc tối đa một lần. Khi refresh thất bại, xử lý hết phiên theo luồng UI.
- Dùng single-flight theo phiên cho các request đồng thời và thiết kế phối hợp nhiều tab trước khi bật rotation. Xác minh một loạt 401 trong cùng phiên chỉ tạo một lần refresh, phiên khác độc lập, request sau refresh dùng cookie và CSRF mới, và retry không lặp khi lại gặp 401. Kiểm tra thêm refresh-cookie path và auth cookie clearing trên trình duyệt.

## Phase 5 — Trang quản trị

| Màn hình | API FastAPI |
| --- | --- |
| Categories, products, ingredients | `/categories`, `/products`, `/ingredients` và subroute theo UUID |
| Store inventories, preorder items, preorder schedules | `/daily-inventories`, `/preorder-items`, `/preorder-schedules` |
| Orders | `GET /orders`, `GET /orders/{order_id}`, `PATCH /orders/{order_id}/delivered` và `/cancelled` |
| Dashboard | `GET /dashboard/stat-card`, `/dashboard/top-seller`, `/dashboard/chart/{order-status,total-order,total-revenue}` |
| Stores, staffs, users và reset password | `/stores`, `/staffs`, `/users`, `/roles`, `POST /users/{user_id}/reset-password` |
| Upload trong form quản trị | `POST /uploads/images`, multipart có quyền admin |

Dùng route và DTO tương ứng trong `app/routes` và `app/schemas` theo từng màn hình. Chuẩn hóa response `data/pagination`, trường tên đa ngôn ngữ, action disable/restore/delete, method PATCH và status khi danh mục đang được sử dụng. Kiểm tra dữ liệu dashboard theo khoảng ngày. Với lịch preorder, frontend có lời gọi `/api/admin/preorder-schedule` dạng số ít, nên cần đối chiếu payload từng action với `preorder_schedules.py` trước khi chuyển. Kiểm thử CRUD, quyền không đủ, filter/pagination và upload lỗi trên fixture test.

## Phase 6 — Vận hành và các khoảng trống

- Git backend hiện có webhook PayOS, `POST /cron/{close-daily-inventories,close-preorder,publish-menu,expire-payments,deliver-emails}` và `python -m app.worker`. Sau khi xác minh môi trường, chọn đúng một chủ xử lý cho từng lịch, webhook, email và hủy thanh toán. Kiểm thử idempotency, readiness `/health/ready`, worker heartbeat và fallback PostgreSQL khi Redis gián đoạn. Giữ BullMQ và cron legacy cho tới khi có bằng chứng chuyển đổi cho từng job.
- Chưa có route FastAPI cho signup khách, Google OAuth/callback và khôi phục mật khẩu tự phục vụ. Các thao tác nhân viên/admin đã có API riêng. Giữ các luồng tài khoản khách legacy tới khi có contract và quyết định migration tài khoản.
- Chưa có API giỏ hàng tương ứng `/api/cart/**`. Storefront hiện dùng `CartContext` với localStorage `bakery_cart`. Giữ hành vi đó và xác minh caller của các route giỏ hàng trước khi dọn.
- So sánh tính năng publish availability và thao tác quản trị lịch giữa handler Next.js và route FastAPI/cron trước khi chuyển. Ghi khác biệt về payload, quyền và trạng thái thành tiêu chí nghiệm thu. Xác nhận môi trường, dữ liệu thử, cấu hình proxy/cookie và công việc scheduler còn tồn đọng trước mọi cutover.
