angular.module('kLaserCutterController.languages', [])
.config(function($translateProvider) {
	$translateProvider.translations('vi', 
		{
			"DASHBOARD"				:	"Bảng điều khiển",
			"VISUALIZER"			:	"Giả lập đồ họa",
			"MACHINE_COORDINATES"	:	"Tọa độ máy",
			"WORK_COORDINATES"		:	"Tọa độ làm việc",
			"UPLOAD_A_FILE"			:   "Chọn tệp",
			"STOP"					:   "Hủy",
			"START"					:   "Bắt đầu",
			"PAUSE"					:   "Tạm dừng",
			"UNPAUSE"				:   "Chạy tiếp",
			"ARE_YOU_SURE"			:   "Bạn có chắc?",
			"SOCKET_DISCONNECTED_MESSAGE"		: "Mất kết nối tới máy chủ kLaserBotController, hãy kiểm tra lại đường truyền và HOST ở mục Thiết đặt.",
			"ARE_YOU_SURE_TO_STOP_THE_MACHINE"	: "Bạn có chắc là muốn dừng máy lại không?",
			"ERROR_UPLOAD_MAX_FILE_SIZE"		: "Thật ngại quá, bạn đang cố gắng tải lên một file quá %d(MB). File này lớn quá chúng tôi xơi không được, bạn upload file khác nha.",
			"CANT_CONNECT_TO_SERVER"			: "Không thể kết nối tới máy chủ",
			"COMMANDLINE"			:   "> Command",
			
			"SETTINGS"				:   "Thiết đặt",
			"HOST ADDRESS"			:   "Địa chỉ kLaserCutter",
			"DEFAULT_DRAWING_COPIES":   "Số lần cắt mỗi lượt (mặc định)",
			"DISPLAY MJPG"			:   "Xem Camera?",
			"RENDER SVG"			:   "Render SVG",
			"REMEMBER DEVICE (ANDROID)": "Ghi nhớ thiết bị",
			"SERVER LOAD"			:   "Tải máy chủ",
			"GALILEO TEMPERATE"		:   "Nhiệt độ máy chủ",
			
			'COPIES COUNT'			:   'Số lượt cắt?',
			'COPIES_OF_THIS_DRAWING':   'Bạn muốn cắt file ảnh này bao nhiêu lần? Càng nhiều lần thì ảnh sẽ càng sâu hơn trên bề mặt cắt.',
			'SAVED_FILE'			:   "Đã lưu ảnh chụp ^_^",
			'CANT_SAVE_FILE'		:   "Không lưu ảnh được ^^!",
			
			'CONFIGURATION'			:   'Bảng chọn',
		}
	);
	$translateProvider.translations('en-US', 
		{
			"DASHBOARD"				:	"Dashboard",
			"VISUALIZER"			:	"Visualizer",
			"MACHINE_COORDINATES"	:	"Coordinates",
			"WORK_COORDINATES"		:	"Work Coordinates",
			"UPLOAD_A_FILE"			:   "Upload a file",
			"STOP"					:   "Stop",
			"START"					:   "Start",
			"PAUSE"					:   "Pause",
			"UNPAUSE"				:   "Unpause",
			"ARE_YOU_SURE"			:   "Are you sure?",
			"SOCKET_DISCONNECTED_MESSAGE"		: "We have just disconnected from the the kLaserCutterController, please check your connection and the Host Address in Settings tab.",
			"ARE_YOU_SURE_TO_STOP_THE_MACHINE": "Are you sure to stop the machine?",
			"ERROR_UPLOAD_MAX_FILE_SIZE"		: "I'm so sorry, your file is too large. Max filesize we can process is just %dMB",
			"CANT_CONNECT_TO_SERVER"			: "Can't connect to server",
			"COMMANDLINE"			:   "> Command",
			
			"SETTINGS"				:   "Settings",
			"HOST ADDRESS"			:   "kLaserCutter's address",
			"DEFAULT_DRAWING_COPIES":   "Copies of drawing (default)",
			"DISPLAY MJPG"			:   "Display camera?",
			"RENDER SVG"			:   "Render SVG",
			"REMEMBER DEVICE (ANDROID)": "Remember Android device",
			"SERVER LOAD"			:   "Server load",
			"GALILEO TEMPERATE"		:   "Galileo temperate",
			
			'COPIES COUNT'			:   'Copies count?',
			'COPIES_OF_THIS_DRAWING':   'The larger number, the depther in cutting surface!',
			'SAVED_FILE'			:   "Saved file ^_^",
			'CANT_SAVE_FILE'		:   "We can't save file to your device ^^!",
			
			'CONFIGURATION'			:   'Menu',
		}
	);
})
.config(["$translateProvider", function($translateProvider) {
	
	$translateProvider.registerAvailableLanguageKeys(['en-US', 'vi'], {
		'en_US': 'en-US',
		'en_UK': 'en-US',
		'en'   : 'en-US',
		'vi_vi': 'vi',
		'vi_VI': 'vi'
	})
	.determinePreferredLanguage();
}])
;