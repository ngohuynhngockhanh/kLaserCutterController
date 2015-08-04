angular.module('klasercuttercontroller.languages', [])
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
			"ARE_YOU_SURE_TO_STOP_THE_MACHINE"	: "Bạn có chắc là muốn dừng máy lại không?",
			"ERROR_UPLOAD_MAX_FILE_SIZE"		: "Thật ngại quá, bạn đang cố gắng tải lên một file quá %d(MB). File này lớn quá chúng tôi xơi không được, bạn upload file khác nha.",
			"CANT_CONNECT_TO_SERVER"			: "Không thể kết nối tới máy chủ",
			"COMMANDLINE"			:   "> Command"
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
			"ARE_YOU_SURE_TO_STOP_THE_MACHINE": "Are you sure to stop the machine?",
			"ERROR_UPLOAD_MAX_FILE_SIZE"		: "I'm so sorry, your file is too large. Max filesize we can process is just %dMB",
			"CANT_CONNECT_TO_SERVER"			: "Can't connect to server",
			"COMMANDLINE"			:   "> Command"
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