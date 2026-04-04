# NhaDatGoVapQ12.vn V6 - Hệ thống kiếm tiền

## Đã thêm
- ví tiền user
- yêu cầu nạp tiền thủ công bằng QR
- admin duyệt nạp tiền
- lịch sử giao dịch ví
- bảng giá kiếm tiền:
  - Việc làm: miễn phí / nổi bật / VIP / đẩy tin
  - Nhà thuê: miễn phí / nổi bật / VIP / đẩy tin
  - VIP 3 ngày / 7 ngày / 15 ngày / 30 ngày
- dùng số dư ví để:
  - ghim tin
  - VIP tin
  - đẩy tin lên đầu

## Luồng hoạt động
1. User nạp tiền
2. Admin duyệt nạp trong trang quản trị
3. Tiền vào ví
4. User chọn gói giá và áp dụng cho tin đăng
5. Hệ thống tự trừ ví

## Chạy
```bash
npm install
npm start
```

## Admin
- username: admin
- password: 123456


## Bổ sung trong bản 6.1
- hoàn chỉnh phần bảng giá như yêu cầu
- chia rõ 3 nhóm:
  - Việc làm
  - Nhà thuê
  - VIP nâng cao
- hiển thị rõ:
  - miễn phí 7 ngày
  - nổi bật
  - VIP
  - đẩy tin
  - VIP 3/7/15/30 ngày
- giao diện đẹp hơn, dễ hiểu hơn


## V6.2 bổ sung
- lọc theo giá
- lọc theo diện tích
- lọc theo số phòng ngủ
- AI hỗ trợ:
  - gợi ý tiêu đề
  - gợi ý mô tả
  - gợi ý mẹo tối ưu tin đăng
- hiển thị diện tích và số phòng ngay trên card tin


## V6.3 bổ sung
- lọc theo mức giá preset
- lọc theo hướng nhà
- lọc theo pháp lý
- AI viết mô tả kiểu môi giới chuyên nghiệp hơn
- giao diện bộ lọc đẹp hơn


## Bản fixed
- sửa lỗi SQLite seed dữ liệu ban đầu của V6.3


## V6.4 bổ sung
- gắn sẵn QR thanh toán ACB:
  - NGUYEN TUAN ANH
  - 214904949
- AI hỗ trợ tiêu đề thông minh hơn:
  - tiêu đề chuẩn
  - tiêu đề ngắn
  - tiêu đề bán hàng
  - mô tả chuẩn môi giới


## V6.5 bổ sung
- AI viết tin theo 3 phong cách:
  - thường
  - bán hàng
  - chuẩn môi giới
- AI tự đề xuất giá tham khảo
- AI tự gợi ý tag / từ khóa SEO


## V6.6 bổ sung
- gộp chung nhà đất + việc làm trên cùng 1 web
- thêm danh mục Việc làm
- AI viết nội dung riêng cho việc làm:
  - tiêu đề tuyển dụng
  - mô tả tuyển dụng
  - gợi ý lương
  - tag SEO việc làm


## V7 AI vận hành full
- AI duyệt tin
- AI viết tin
- AI trả lời khách
- AI nhắc gia hạn
- AI gợi ý VIP
- AI phân loại tin
- AI chống spam
- AI báo cáo trong admin


## V7.1 giao diện nâng cấp
- giao diện web đẹp hơn, đỡ trống hơn
- nền động bằng orb animation
- banner đôi nổi bật
- card và button bóng đẹp hơn
- admin cũng được nâng giao diện:
  - sidebar đẹp hơn
  - nền động
  - panel kính mờ


## V7.2 UI Ultra
- thêm thanh marquee động
- thêm trust strip đỡ trống hơn
- divider section đẹp hơn
- featured chip nổi bật
- card hover 3D nhẹ
- admin có badge và giao diện dày hơn


## V7.5 Commercial Plus
- thêm sticky filter bar kiểu thương mại
- thêm trust banner grid
- modal chi tiết đẹp hơn
- thêm thumbnail gallery cho chi tiết tin
- popup chat polished hơn
- bố cục tổng thể sáng và gọn hơn


## V7.5 Commercial Plus All Fixed
- fix cứng QR ACB
- fix cứng demo posts
- thêm panel đăng ký gói thật hơn
- thêm logic chọn gói + nội dung CK
- thêm route debug bootstrap-status
- thêm start-web.bat
