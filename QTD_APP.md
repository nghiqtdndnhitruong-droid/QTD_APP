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
    + Thông tin của người vay: Họ tên người vay, loại giấy tờ người vay (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ người vay (gồm 12 số), Nơi cấp giấy tờ người vay (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH),  Ngày cấp giấy tờ, Giới tính và năm sinh (2 cột này tự lấy từ số giấy tờ, nếu số giấy tờ bắt đầu từ vị trí thứ 4 là số 0 hoặc số 2 thì giới tính sẽ là nam, con số 1 hoặc 3 thì sẽ là nữ, ví dụ 0841 thì giới tính là Nữ, 0840 thì giới tính là Nam. Giới tính thì lấy tiếp vị trí số 3, 4 và số 5 trong số giấy tờ, Nếu số thứ 3 là 0 và 2 số tiếp theo là 84 thì sẽ là giới tính nam và sinh năm 1984 còn nếu số thứ 3 là 2 và 2 số tiếp theo là 006 thì giới tính là Nam và sinh năm 2006. Đại loại số thứ 4 và 5 là 2 số cuối năm sinh còn số 0, 1 là của năm 99 đổ lại còn số từ 2, 3 là từ năm 2000 trở lại đây). Địa chỉ, Mã Thanh Viên (Nếu là thành viên mới thì có thể bỏ trống), Số điện thoại (có thể bỏ trống), Thời hạn giấy tờ (có thẻ bỏ trống).
    + Thông tin của người thừa kế: Họ tên người thừa kế, loại giấy tờ người thừa kế (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ người thừa kế (gồm 12 số), Nơi cấp giấy tờ người thừa kế (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH), Ngày cấp giấy tờ, Giới tính và năm sinh (2 cột này tự lấy từ số giấy tờ, nếu số giấy tờ bắt đầu từ vị trí thứ 4 là số 0 hoặc số 2 thì giới tính sẽ là nam, con số 1 hoặc 3 thì sẽ là nữ, ví dụ 0841 thì giới tính là Nữ, 0840 thì giới tính là Nam. Giới tính thì lấy tiếp vị trí số 3, 4 và số 5 trong số giấy tờ, Nếu số thứ 3 là 0 và 2 số tiếp theo là 84 thì sẽ là giới tính nam và sinh năm 1984 còn nếu số thứ 3 là 2 và 2 số tiếp theo là 006 thì giới tính là Nam và sinh năm 2006. Đại loại số thứ 4 và 5 là 2 số cuối năm sinh còn số 0, 1 là của năm 99 đổ lại còn số từ 2, 3 là từ năm 2000 trở lại đây). Địa chỉ, Số điện thoại (có thể bỏ trống). Quan hệ với người vay (Có các lựa chọn gồm: Vợ, Chồng, Con, Cha, Mẹ), Thời hạn giấy tờ (có thẻ bỏ trống).
    + 1 Người vay chỉ có thể có 1 người thừa kế hoặc không có người thừa kế.
    + Tiếp theo là thông tin khoản vay gồm: ngày vay (dd/mm/yyyy), số tiền vay, số khế ước, Loại vay (tín chấp/thế chấp), lãi suất (căn cứ theo số tiền vay mà tự đưa ra mức lãi suất, bảng lãi suất sẽ được miêu tả sau), thời hạn vay (ngắn hạn/trung hạn). nếu loại vay là thế chấp thì sẽ có thêm các trường: số hợp đồng thế chấp, ngày chứng thực ủy ban, thời hạn hợp đồng thế chấp (dạng date (dd/mm/yyyy)). Ngày tới hạn trả (nếu ngắn hạn là 12 tháng, còn trung hạn cũng 12 tháng trả 1 nữa sau đó mới là 12 tháng tiếp theo trả hết gốc nhưng thường là 12 tháng sẽ trả và làm lại hồ sơ vay tiếp), ngày giải ngân, trạng thái khoản vay (đang chuẩn bị hồ sơ, đã hoàn thành hồ sơ, đã giải ngân, đã tất toán, quá hạn).
    + Lãi suất: có 2 loại mức lãi suất là lãi suất tín chấp và lãi suất thế chấp. Mỗi mức lãi thì sẽ có thêm các mốc cho trung hạn và ngắn hạn khác nhau. Phần lãi suất của tín chấp thì sẽ chỉ có 1 mốc là 100tr trở lại, tức là trung hạn hay ngắn hạn cũng chỉ có 1 mức lãi suất là 100tr trở lại nhưng trung hạn và ngắn hạn có thể có mức lãi suất khác nhau. Còn thế chấp thì có nhiều mốc từ 0 - 99tr là 1 mốc, 100 - 199 là 1 mốc, 200 - 299 là 1 mốc, 300 - 499 là 1 mốc, 500 -> hơn 1 tỷ là mốc còn lại. Cả trung hạn và ngắn hạn đều có các mốc này. 
    + Tài sản thế chấp: Chỉ chấp nhận tài sản là Quyền sử dụng đất, cán bộ cần nhập các thông tin của tài sản gồm: Tên loại tài sản (Quyền sử dụng đất/Quyền sử dụng đất quyền sở hữu nhà ở và tài sản khác gắn liền với đất/Quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất), Mã số tài sản, Loại giấy chứng nhận (GCN/Giấy chứng nhận/Vào sổ cấp giấy chứng nhận quyền sử dụng đất Số/ Số vào sổ cấp giấy chứng nhận quyền sử dụng đất), Số giấy chứng nhận, số thửa, số tờ, địa chỉ, diện tích, hình thức sử dụng, mục đích sử dụng, thời hạn sử dụng, nguồn gốc sử dụng, hạn chế sử dụng, Chủ sở hữu tài sản (Người vay cá nhân, người vay hộ, người thừa kế cá nhân, người thừa kế hộ, bảo lãnh (loại bão lãnh là cần các trường thông tin của người bão lãnh gồm: Họ tên người bão lãnh, loại giấy tờ người bão lãnh (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ người bão lãnh (gồm 12 số), Nơi cấp giấy tờ người bão lãnh (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH), Ngày cấp giấy tờ, Giới tính và năm sinh (2 cột này tự lấy từ số giấy tờ, nếu số giấy tờ bắt đầu từ vị trí thứ 4 là số 0 hoặc số 2 thì giới tính sẽ là nam, con số 1 hoặc 3 thì sẽ là nữ, ví dụ 0841 thì giới tính là Nữ, 0840 thì giới tính là Nam. Giới tính thì lấy tiếp vị trí số 3, 4 và số 5 trong số giấy tờ, Nếu số thứ 3 là 0 và 2 số tiếp theo là 84 thì sẽ là giới tính nam và sinh năm 1984 còn nếu số thứ 3 là 2 và 2 số tiếp theo là 006 thì giới tính là Nam và sinh năm 2006. Đại loại số thứ 4 và 5 là 2 số cuối năm sinh còn số 0, 1 là của năm 99 đổ lại còn số từ 2, 3 là từ năm 2000 trở lại đây). Địa chỉ, thời hạn giấy tờ (nếu có))).
    + Nếu khoản vay là thế chấp thì sẽ có thêm cột định giá tài sản: sẽ lấy diện tích của tài sản thế chấp x với mức giá của quỹ đưa ra hoặc do giá thị trường. Có 2 loại định giá là theo Nghị định Quỹ và theo giá thị trường, theo quy định quỹ thì có nhiều mức giá được đưa ra cố định là (Đất bình thường thì diện tích x 60.000đ, đất cập kênh thì diện tích x 70.000đ, đất cập lộ đất thì x 100.000đ, đất cập đường nhựa thì x 150.000đ). Còn định giá theo thị trường thì cán bộ tự nhập mức giá.
    + 1 Khoản vay có thể có nhiều tài sản thế chấp.
    + Nếu khoản vay là thế chấp và số tiền vay >= 140.000.000đ thì bắt buộc phải có thêm cột người liên quan gồm: Họ tên người liên quan, loại giấy tờ người liên quan (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ người liên quan (gồm 12 số), Nơi cấp giấy tờ người liên quan (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH), Ngày cấp giấy tờ, Giới tính và năm sinh (2 cột này tự lấy từ số giấy tờ, nếu số giấy tờ bắt đầu từ vị trí thứ 4 là số 0 hoặc số 2 thì giới tính sẽ là nam, con số 1 hoặc 3 thì sẽ là nữ, ví dụ 0841 thì giới tính là Nữ, 0840 thì giới tính là Nam. Giới tính thì lấy tiếp vị trí số 3, 4 và số 5 trong số giấy tờ, Nếu số thứ 3 là 0 và 2 số tiếp theo là 84 thì sẽ là giới tính nam và sinh năm 1984 còn nếu số thứ 3 là 2 và 2 số tiếp theo là 006 thì giới tính là Nam và sinh năm 2006. Đại loại số thứ 4 và 5 là 2 số cuối năm sinh còn số 0, 1 là của năm 99 đổ lại còn số từ 2, 3 là từ năm 2000 trở lại đây). Địa chỉ, Số điện thoại (có thể bỏ trống). Quan hệ với người vay (Có các lựa chọn gồm: Con, Cha, Mẹ, Anh, Chị, Em, Cô, Dì, Cậu), Thời hạn giấy tờ (có thẻ bỏ trống), Vốn vay ở quỹ (Không hoặc số tiền vay).
    + 1 Khoản vay có thể có nhiều người liên quan.
    + Nếu trong khoản vay loại thế chấp và trong danh sách tài sản có 1 tài sản là đất hộ thì cần phải nhập thông tin của những người trong hộ gồm: Họ tên người trong hộ, loại giấy tờ người trong hộ (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ người trong hộ (gồm 12 số), Nơi cấp giấy tờ người trong hộ (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH), Ngày cấp giấy tờ, Giới tính và năm sinh (2 cột này tự lấy từ số giấy tờ, nếu số giấy tờ bắt đầu từ vị trí thứ 4 là số 0 hoặc số 2 thì giới tính sẽ là nam, con số 1 hoặc 3 thì sẽ là nữ, ví dụ 0841 thì giới tính là Nữ, 0840 thì giới tính là Nam. Giới tính thì lấy tiếp vị trí số 3, 4 và số 5 trong số giấy tờ, Nếu số thứ 3 là 0 và 2 số tiếp theo là 84 thì sẽ là giới tính nam và sinh năm 1984 còn nếu số thứ 3 là 2 và 2 số tiếp theo là 006 thì giới tính là Nam và sinh năm 2006. Đại loại số thứ 4 và 5 là 2 số cuối năm sinh còn số 0, 1 là của năm 99 đổ lại còn số từ 2, 3 là từ năm 2000 trở lại đây). Địa chỉ, Số điện thoại (có thể bỏ trống), Thời hạn giấy tờ (có thẻ bỏ trống).
    + 1 Khoản vay có thể có nhiều người trong hộ
    + Tiếp theo là Phương án vay vốn: Sẽ gồm list danh sách các chi phí và danh sách các nguồn thu, mỗi dòng gồm: tên khoản mục và chi phí, tổng nhu cầu vốn của phương án, vốn vay quỹ, vốn tự có, mục đích vay vốn, lợi nhuận.
    + Vay tín chấp 1 người chỉ có thể vay tối đa 100tr, thế chấp thì bằng 70% tổng định giá của tài sản không được vượt.
    + Số giấy tờ của người vay là unique, nếu nhập bị trùng thì không cho tạo.
    
## 1.3. Authentication
- Người dùng trong hệ thống chính là cán bộ tín dụng, khi tạo tài khoản cần các trường: Họ tên, loại giấy tờ cán bộ (chọn giữa 2 loại Căn cước/Căn cước công dân), Số giấy tờ cán bộ (gồm 12 số), Nơi cấp giấy tờ cán bộ (Tự động lấy theo loại giấy tờ: Nếu loại giấy tờ là Căn cước thì nơi cấp sẽ là Bộ Công An, nếu loại giấy tờ là Căn cước công dân thì nơi cấp sẽ là Cục CSQLHC về TTXH), Ngày cấp giấy tờ, Giới tính và năm sinh.
- tên đăng nhập là unique.
- Mỗi cán bộ này sẽ quản lý nhiều khách hàng, nhiều khoản vay thuộc địa bàn của họ.
- Bảng địa bàn quản lý sẽ có các cột Ấp - Tỉnh - Xã. ví dụ Ấp Nô Lựa, Xã Nhị Trường, Tỉnh Vĩnh Long. Tỉnh thì chỉ có 1 tỉnh vĩnh long, còn ấp và xã thì do các bộ tự tạo và thêm vào, Mỗi Xã sẽ có nhiều Ấp.
- Địa chỉ của người vay sẽ lấy từ danh sách địa bàn này mà ra và địa chỉ của thửa đất cũng vậy nhưng 2 địa chỉ người vay và thửa đất sẽ có thể khác nhau chứ không yêu cầu phải giống nhau.
- Cán bộ có thể tạo nhóm cho địa bàn, nhưng chỉ phân nhóm từ cấp Xã ví dụ nhóm 1 gồm xã nào, nhóm 2 gồm xã nào.
- Sử dụng JWT để làm authentication.




