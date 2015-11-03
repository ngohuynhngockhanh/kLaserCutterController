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
			"ERROR_UPLOAD_MAX_FILE_SIZE"		: "Thật ngại quá, bạn đang cố gắng tải lên một file quá %.2f(MB). File này lớn quá chúng tôi xơi không được, bạn upload file khác nha.",
			"CANT_CONNECT_TO_SERVER"			: "Không thể kết nối tới máy chủ",
			"THE MACHINE IS RUNNING. ARE YOU SURE TO CHANGE TO THE NEW SOCKET ADDRESS?": "Máy cắt đang hoạt động. Bạn có muốn chuyển tới địa chỉ máy cắt khác vừa được thiết đặt?",
			"COMMANDLINE"			:   "> Command",
			
			"SETTINGS"				:   "Thiết đặt",
			"HOST ADDRESS"			:   "Địa chỉ kLaserCutter",
			"FEED RATE"				:   "Tốc độ cắt",
			"FEED_RATE_SETS_STEPPERS_SPEED": "Nó sẽ điều khiển tốc độ của các động cơ bước, càng lớn thì càng nhanh",
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
			'UPLOAD_PICTURE'		:   'Khắc ảnh',
			'SET_RESOLUTION_MESSAGE':   'Tỉ lệ pixel / mm ảnh. Tỉ lệ 3.5433 là tỉ lệ đẹp nhất. Tỉ lệ càng nhỏ, thời gian biên dịch và khắc càng nhanh.',
			'TYPE_kLaserCutter_HOST_ADDRESS': 'Gõ địa chỉ IP của kLaserCutter',
			'WEBCAM RESOLUTION'		:	'Độ phân giải của Webcam'
			
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
			"ERROR_UPLOAD_MAX_FILE_SIZE"		: "I'm so sorry, your file is too large. Max filesize we can process is just %.2fMB",
			"CANT_CONNECT_TO_SERVER"			: "Can't connect to server",
			"THE MACHINE IS RUNNING. ARE YOU SURE TO CHANGE TO THE NEW SOCKET ADDRESS?": "The machine is running. Do you want to switch to new host address?",
			"COMMANDLINE"			:   "> Command",
			
			"SETTINGS"				:   "Settings",
			"HOST ADDRESS"			:   "kLaserCutter's address",
			"FEED RATE"				:   "Feed rate",
			"FEED_RATE_SETS_STEPPERS_SPEED": "FEED_RATE_SETS_STEPPERS_SPEED",
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
			'UPLOAD_PICTURE'		:   'Engrave raster picture',
			'SET_RESOLUTION_MESSAGE':   'Set resolution (pixel/mm). 3.5433 is the best resolution. The less resolution, the faster engraving',
			
			'TYPE_kLaserCutter_HOST_ADDRESS': 'Type kLaserCutter host address',
			'WEBCAM RESOLUTION'		:	'Webcam resolution'
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
	.preferredLanguage('vi')
	//.determinePreferredLanguage();
}])
;