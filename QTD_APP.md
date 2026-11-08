# Workflow
- Bạn sẽ chỉ thực hiện các bước mà tui nêu đưa ra, không suy diễn, không tự ý build thêm tính năng, không tự thêm data mẫu 

# Các điểm chung
- Đây là hệ thống quản lý nghiệp vụ của QTD cụ thể là nghiệp vụ Tín Dụng, các công việc hệ thống sẽ xử lý là nhập danh sách các khoản vay, danh sách khách hàng, lưu trữ các thông tin đó, tính lãi, thống kê,... 

# 0. Cấu hình 

## o.1. Các thư mục 
- Thư mục frontend chưa các file về frontend
- Thư mục backend chứa các file về backend
- Thêm gitignore cho toàn bộ project 
- Trong mỗi thư mục tự cấu trúc theo cấu trúc chuẩn nhất, dễ quản lý nhất 

## 0.2. Các công nghệ sử dụng
- Backend: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT
- Frontend: NextJS + TypeScript
- UI: ANT design
- Package install: npm 

# 1. Backend

## 1.1. Tạo server và khởi chạy 
- Tạo server backend ở PORT 3000 

## 1.2. Mô tả hệ thống 
- Hệ thống sẽ thực hiện công việc giúp vị trí Cán Bộ Tín Dụng làm các cụ việc cụ thể như: Tạo lập các khoản vay và quản lý nó, tạo các biểu mẫu word để in ra cho khách hàng ký kết, thống kê số liệu các khoản vay. Cụ thể flow làm việc:
- Cán bộ tín dụng sẽ nhập thông tin các khoản vay để tạo khoản vay gồm:
    + Thông tin của người vay: Họ tên người vay, loại giấy tờ người vay (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ người vay (gồm 12 số), Nơi cấp giấy tờ người vay (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH),  Ngày cấp giấy tờ, Giới tính và năm sinh (2 cột này tự lấy từ số giấy tờ, nếu số giấy tờ bắt đầu từ vị trí thứ 4 là số 0 hoặc số 2 thì giới tính sẽ là nam, con số 1 hoặc 3 thì sẽ là nữ, ví dụ 0841 thì giới tính là Nữ, 0840 thì giới tính là Nam. Giới tính thì lấy tiếp vị trí số 3, 4 và số 5 trong số giấy tờ, Nếu số thứ 3 là 0 và 2 số tiếp theo là 84 thì sẽ là giới tính nam và sinh năm 1984 còn nếu số thứ 3 là 2 và 2 số tiếp theo là 006 thì giới tính là Nam và sinh năm 2006. Đại loại số thứ 4 và 5 là 2 số cuối năm sinh còn số 0, 1 là của năm 99 đổ lại còn số từ 2, 3 là từ năm 2000 trở lại đây). Địa chỉ, Mã Thanh Viên (Nếu là thành viên mới thì có thể bỏ trống), Số điện thoại (có thể bỏ trống).
    + Thông tin của người thừa kế: Họ tên người thừa kế, loại giấy tờ người thừa kế (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ người thừa kế (gồm 12 số), Nơi cấp giấy tờ người thừa kế (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH),  Ngày cấp giấy tờ, Giới tính và năm sinh (2 cột này tự lấy từ số giấy tờ, nếu số giấy tờ bắt đầu từ vị trí thứ 4 là số 0 hoặc số 2 thì giới tính sẽ là nam, con số 1 hoặc 3 thì sẽ là nữ, ví dụ 0841 thì giới tính là Nữ, 0840 thì giới tính là Nam. Giới tính thì lấy tiếp vị trí số 3, 4 và số 5 trong số giấy tờ, Nếu số thứ 3 là 0 và 2 số tiếp theo là 84 thì sẽ là giới tính nam và sinh năm 1984 còn nếu số thứ 3 là 2 và 2 số tiếp theo là 006 thì giới tính là Nam và sinh năm 2006. Đại loại số thứ 4 và 5 là 2 số cuối năm sinh còn số 0, 1 là của năm 99 đổ lại còn số từ 2, 3 là từ năm 2000 trở lại đây). Địa chỉ, Số điện thoại (có thể bỏ trống). Quan hệ với người vay (Có các lựa chọn gồm: Vợ, Chồng, Con, Cha, Mẹ).
    + 1 Người vay chỉ có thể có 1 người thừa kế hoặc không có người thừa kế.



