$('#img-file').fileinput({
    language: 'zh', //设置语言
    uploadUrl: '/imageUpload',
    enctype: 'multipart/form-data',
    browseClass: "btn btn-info", //按钮样式 
    showCaption: true,
    allowedFileExtensions: ['jpg', 'gif', 'png', 'bmp', 'jpeg', 'webp'],//接收的文件后缀
    showUpload: false, //是否显示上传按钮
    dropZoneEnabled: false, //是否显示拖拽区域
    showPreview: false
})

var register_success = false

$('#register-submit').on('hidden.bs.modal', () => {
	if (register_success) {
		window.location.href = '../chat'
	} else {
		alert('该账户已经被注册:)')
	}
})

const chatRegister = (form) => {
	let uname = form.username.value
	let pword = form.password.value
	let img_upload = form['editormd-image-file'].files[0]

	if (!uname.match(/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/)) {
		$('.input-text').attr('value', '')
		$('.input-text')[0].focus()
		alert('请输入正确的邮件地址')
		return false
	}

	if (pword.length < 6) {
		$('.input-text').attr('value', '')
		$('.input-text')[0].focus()
		alert('密码长度小于6位')
		return false
	}

	$('#register-submit').modal('show')
	
	let formdata = new FormData()
	formdata.append('name', uname)
	formdata.append('pass', hex_md5(pword))
	formdata.append('img', img_upload)

	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/register'
	xmlhttp.onload = function() {
		if(this.response === 'err') {
			register_success = false
			$('#register-submit').modal('hide')
		} else if(this.response === 'ok'){
			register_success = true
			$('#register-submit').modal('hide')
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)

	return false
}