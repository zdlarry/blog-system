$('.expand-button')[0].onclick = function(){
	$(this).animate({rotate:'+=180deg'}, 300)
}

const login = (form) => {
	let formdata = new FormData()
	formdata.append('name', form.username.value)
	formdata.append('pass', hex_md5(form.password.value))
	formdata.append('code', form.code.value)
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/login'
	xmlhttp.onload = function() {
		if (this.response === 'false') {
			$('.input-text').attr('value', '')
			$('.input-text')[0].focus()
			alert('密码或者账号错误！')
		} else if(this.response === 'err') {
			alert('登录失败')
		} else if (this.response === 'wrong_code') {
			alert('验证码错误')
		} else {
			let path = window.location.pathname
			if (path == '/search') {
				window.location.href = '../'
			}
			window.location.href = path
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return false
}

const checklogin = () => {
	let formdata = new FormData()
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/checklogin'
	xmlhttp.onload = function() {
		if (this.response === 'nologin') {
			$('#loadIn').modal('show')
		} else {
			if (window.location.pathname.split('/')[1] == 'papers') {
				window.location.href = '../../../manage'
			} else {
				window.location.href = '../manage'
			}
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
}

const logout = function() {
	let formdata = new FormData()
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/logout'
	xmlhttp.onload = function() {
		if (this.response === 'true') {
			window.location.href = '../'
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
}

const delete_paper = (btn) => {
	let parent = $(btn).parent().parent().parent()
	let td_name = parent.find('td')[0]
	let p_name = $(td_name).find('p')[0].innerHTML.trim()
	let td_date = parent.find('td')[1]
	let p_date = $(td_date).find('p')[0].innerHTML.trim()
	let formdata = new FormData()
	formdata.append('p_name', p_name)
	formdata.append('p_date', p_date)
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/delete_paper'
	xmlhttp.onload = function() {
		if (this.response === 'false') {
			alert('删除失败')
		}else if(this.response === 'err') {
			alert('err, no data')
		}else {
			window.location.href = '../manage'
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return
}

const getFormDateTime = () => {
	let dt = new Date()
	return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes()
		+ ':' + dt.getSeconds()
}

const submit_new_paper = () => {
	$('#load-submit').modal('show')
	$('.submit-modal-body').html('<i class="fa fa-spinner fa-spin"></i><span> </span>Submiting')
	let title = $("input[name='paper-title']").val().trim()
	let type = $("input[name='paper-type']").val().trim()
	let timg = '../imgs/' + $("input[name='editormd-image-file']").val().split('\\').pop().toString()
	let like_num = 0
	let time_now = getFormDateTime()
	let paper_url = '/papers/' + time_now.split(' ')[0] + '/' + title
	let papers_contain = $('.editormd-markdown-textarea').val()
	let img_upload = $("input[name='editormd-image-file']")[0].files[0]

	let formdata = new FormData()
	formdata.append('p_name', title)
	formdata.append('p_type', type)
	formdata.append('p_timg', timg)
	formdata.append('p_likenum', like_num)
	formdata.append('p_url', paper_url)
	formdata.append('p_date', time_now)
	formdata.append('p_contain', papers_contain)
	formdata.append('p_img', img_upload)
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/new_paper'
	xmlhttp.onload = function() {
		if (this.response === 'false') {
			$('.submit-modal-body').html('请完成所有内容~')
		} else if(this.response === 'err') {
			$('.submit-modal-body').html('err accur~')
		} else if(this.response === 'overflow'){
			$('.submit-modal-body').html('该文章已存在 :)')
		} else {
			alert('新文章添加 :)')
			$('#load-submit').modal('hide')
			window.location.href = '../manage'
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return
}

const thumbs_up = () => {
	let datetime = $('.paper-datetime').find('span')[0].innerHTML.trim()
	
	let formdata = new FormData()
	formdata.append('p_datetime', datetime)
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/thumbs_up'
	xmlhttp.onload = function() {
		if (this.response === 'false') {
			alert('数据库故障 :)')
		} else if(this.response === 'err') {
			alert('err accur')
		} else {
			let num_now = $('#num').html()
			$('#num').html(parseInt(num_now) + 1)
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return
}

const turn_back = () => {
	window.location.href = '/'
}

const back_top = () => {
	$('body, html').animate({ scrollTop: 0 }, 500)
}

const show_type = (obj) => {
	let type_select = $(obj).find('p')[0].innerHTML.trim()

	let formdata = new FormData()
	formdata.append('type_select', type_select)
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/type_select'
	xmlhttp.onload = function() {
		if (this.response === 'false') {
			alert('数据库故障 :)')
		} else if(this.response === 'err') {
			alert('err accur')
		} else {
			new Promise(resolve => {
				resolve($('.achieve-contain').fadeOut(500, () => {
					$('.achieve-contain').html(this.response)
				}))
			}).then(() => {
				$('.achieve-contain').fadeIn(500)
			})
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return
}

const reShowCode = (obj) => {
	$(obj).attr('src', '/code')
}


Echo.init({
	offset: 0,//离可视区域多少像素的图片可以被加载
	throttle: 0 //图片延时多少毫秒加载
})