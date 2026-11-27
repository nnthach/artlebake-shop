# Kiến trúc frontend ArtleBake

ArtleBake dùng Next.js App Router. Màn hình và các endpoint cùng origin sống trong cùng repo. Cấu hình chạy local và worker nằm trong [README](../README.md).

## Vị trí code

| Thư mục | Vai trò và ví dụ trong repo |
| --- | --- |
| `app/` | `page.tsx` và `layout.tsx` là entry point UI. Route group `(admin)` và `(auth)` tổ chức màn hình. `app/layout.tsx` gắn provider i18n, auth và cart. `app/order/components/` chứa UI dùng riêng cho đặt hàng. |
| `app/api/` | `route.ts` export handler theo HTTP method. Route nhận query hoặc body, áp dụng contract của endpoint, gọi nguồn dữ liệu hoặc tích hợp và trả `NextResponse`. Ví dụ `app/api/admin/categories/route.ts` và `app/api/categories/route.ts` phục vụ hai luồng riêng. |
| `components/` | `ui/` chứa primitive giao diện. `custom/` chứa thành phần dùng lại như `ProductCard.tsx`. `layout/` chứa header, footer và khung admin/staff. `sections/` chứa UI theo feature, như menu và modal danh mục admin. |
| `hooks/`, `context/` | Hook chia sẻ hành vi React ở client. Context chia sẻ state qua cây UI. `CartContext.tsx` lưu giỏ hàng vào localStorage. `AuthContext.tsx` lấy phiên qua `/api/auth/me`. `I18nContext.tsx` cung cấp locale và hàm dịch. |
| `lib/` | Module tích hợp và logic chia sẻ. `lib/validations/` chứa schema Zod cho form, `lib/supabase/` chứa các client dữ liệu và auth, `lib/fastapi/` chứa HTTP client và service migration. Kiểm tra caller trước khi import một module tích hợp vào client component. |
| `utils/` | Helper định dạng, ngày nghiệp vụ, khoảng ngày và đọc query. `getSearchParams` nhận `NextRequest`, còn các formatter như `cn` và `formatToSlug` dùng được trong UI. Xem [hướng dẫn tái sử dụng](reuse-guide.md) để chọn đúng helper. |
| `types/`, `enums/` | Kiểu và enum dùng chung. `types/index.ts` có model dùng trong giao diện, `types/form-type.ts` có kiểu form và email, `types/sub-type.ts` có kiểu biểu đồ. Kiểu chỉ phục vụ một upstream có thể đặt cạnh service, như kiểu trang danh mục FastAPI. |
| `public/`, `supabase/`, `worker/` | Tài nguyên tĩnh, cấu hình và migration Supabase, và tiến trình BullMQ riêng. Entry point worker là `worker/src/index.ts`. |

## Chọn pattern theo feature

- Feature có thể đặt UI gần route hoặc trong `components/sections/`. Checkout đặt component cạnh trang. Menu ghép các section từ thư mục dùng chung. Theo cách tổ chức của feature đang sửa và đưa UI lên thư mục chung khi có caller dùng chung.
- UI hiện có dùng native `fetch` gọi HTTP endpoint cùng origin. Ví dụ trang admin categories gọi `/api/admin/categories`, còn `MenuSection` gọi `/api/categories?is_active=true`. Theo dõi cả request lẫn response trước khi đổi input, status, dữ liệu phân trang hoặc dạng lỗi.
- Nhiều handler hiện truy vấn Supabase trực tiếp, như `app/api/products/menu/route.ts`. Nhóm FastAPI có service riêng cho danh mục công khai. Dùng cấu trúc FastAPI cho endpoint được migration theo plan và theo contract hiện hành của các feature khác khi sửa chúng.
- Đặt tích hợp cần biến môi trường server hoặc quyền truy cập đặc biệt ở phía server. Một số module trong `lib/` có caller client, như helper upload gọi route cùng origin. Xác định ranh giới qua import và cách lấy dữ liệu của module.

## FastAPI Phase 1 với danh mục menu

| Lớp | Trách nhiệm hiện có |
| --- | --- |
| [MenuSection.tsx](../components/sections/menu/MenuSection.tsx) | Browser gọi `GET /api/categories?is_active=true`. Danh mục dùng cho bộ lọc. |
| [app/api/categories/route.ts](../app/api/categories/route.ts) | Đọc và chuẩn hóa sort, order, locale. Khi có `FASTAPI_BASE_URL` và `is_active=true`, gọi service và giữ envelope `{ success, data }` hoặc lỗi chung 502. Request ngoài nhánh này dùng Supabase. |
| [categories.ts](../lib/fastapi/categories.ts) | `getCategories` biết endpoint `/store-front/categories`, kiểu envelope và query. Xác minh metadata phân trang, gom các trang và dùng chung một timeout signal. |
| [api.ts](../lib/fastapi/api.ts) | Export `get`, `post`, `put`, `patch`, `delete`. Mỗi hàm chuyển HTTP method, route và options vào `httpClient.request`. Hiện service danh mục gọi `get`. |
| [http-client.ts](../lib/fastapi/http-client.ts) | Đọc cấu hình server, kiểm tra URL cùng origin và dưới base path, gắn query và headers, serialize JSON hoặc giữ raw body. Mặc định `no-store`, redirect thủ công và timeout 10 giây nếu caller chưa cấp signal. Trả native `Response` cho 2xx, kể cả 204, và throw khi upstream trả HTTP lỗi. |

**Auth hiện tại** đi qua [AuthContext](../context/AuthContext.tsx) và các route Supabase Auth, ví dụ [`/api/auth/me`](../app/api/auth/me/route.ts).

**Auth FastAPI dự kiến ở Phase 4.** Proxy cookie, `Set-Cookie` và CSRF, điều phối refresh token rotation theo phiên và thử lại request tối đa một lần thuộc [plan tích hợp](plans/fastapi-integration.md#phase-4--đăng-nhập-admin-và-phiên). Client Phase 1 xử lý 401 như HTTP lỗi.
