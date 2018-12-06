var ws = new WebSocket('ws://localhost:8081')
let user = JSON.parse(usr)
   ,chat_panel = $('.connect-panel')
   ,online_container = $('.online-container')
   ,talk_to = null
   ,talk_to_text = $('#talkto-text')
   ,remain_msg_panel = $('.right-contain-msg')
   ,comment_panel = $('.comment-body')
   ,usr_online = new Set()
   ,remain_msgs = []

ws.onopen = evt => {
	console.log('connect success')
	ws.send(usr)
}

$('[name="mybirth"]').datepicker({
	format: 'mm-dd',
	language: 'zh-CN',
	todayHighight: true
})

$('[name="username"]').bind("input propertychange", () => {
	let val = $('[name="username"]').val()
	online_container.html('')

	for (let item of usr_online) {
		if (val === '') {
			addOnlineUsr(JSON.parse(item))
			continue
		}

		if (JSON.parse(item).name.indexOf(val) !== -1) {
			addOnlineUsr(JSON.parse(item))
		}
	}
})

$("input[name = 'msg']").on('keydown', event => {
	if (event.keyCode == 13) {
		sendMsg()
	}
})

$('[name="remain-msg"]').bind("input propertychange", () => {
	let msg = $('[name="remain-msg"]').val()
	remain_msg_panel.html('')

	for (let item of remain_msgs) {
		let remain_msg = '<div class="contain-msg-item" onclick="showRemainMsg(this)">' + 
					 '<div class="msg-item-head" style="background-image: url(' + item.talk_from.head + ')"></div>' +
					 '<div class="msg-item-name">' + 
					 '<p>' + item.talk_from.name + '</p>' +
				     '</div>' +
				     '<div class="msg-item-time">' +
					 '<p>' + item.time.split(' ').pop() + '</p>' +
					 '</div>' +
					 '<div class="msg-item-msg">' +
					 '<p>' + item.msg + '</p>' +
					 '</div>' +
					 '</div>'
	
		if (msg === '') {
			remain_msg_panel.prepend(remain_msg)
			continue
		}

		if (item.msg.indexOf(msg) !== -1) {
			remain_msg_panel.prepend(remain_msg)
		}
	}
})

ws.onmessage = msg => {
	var mes = JSON.parse(msg.data)
	if (mes.type === 'newusr') {
		// update online usr list
		if (mes.name !== user.name) {
			usr_online.add(msg.data)
			addOnlineUsr(mes)
		}
	}

	if (mes.type === 'del_online_contain') {
		online_container.html('')
	}

	if (mes.type === 'msg') {
		showMsg(mes)
	}

	if (mes.type === 'chatlog') {
		getChatLog(mes.data, mes['head_url'])
	}
}

const getFormDateTime = () => {
	let dt = new Date()
	return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes()
		+ ':' + dt.getSeconds()
}

const addOnlineUsr = (mes) => {
	let online_item = '<div class="online-item" onclick="changeTalker(this)">' +
					  '<div class="online-item-head" style="background-image: url(' + mes.head + 
					  ')"></div>' +
					  '<div class="online-item-name">' +
					  '<p>' + mes.name + '</p>' +
					  '</div>' +
					  '</div>'
	online_container.append(online_item)
}

const sendMsg = () => {
	if (talk_to === null) {
		return
	}
	let msg = $("input[name = 'msg']").val().trim()
	if (msg == '') {
		return
	}
	let msg_obj = {
	   		type: 'msg',
	   		talk_from: user,
	   		talk_to: talk_to,
	   		msg: msg,
	   		time: getFormDateTime()
	   }

	ws.send(JSON.stringify(msg_obj))

	let new_msg = '<div class="msg-item">' +
				  '<div class="item-time">' +
				  '<p>' + getFormDateTime() + '</p>' +
				  '</div>' +
				  '<div class="item-msg">' + 
				  '<div class="item-head-f" style="background-image: url(' + user.head + ')"></div>' +
				  '<div class="item-msg-spin-f"></div>' +
				  '<div class="item-msg-contain-f">' + 
				  '<p>' + msg + '</p>' +
				  '</div>' +
				  '</div>' +
				  '</div>'

	chat_panel.append(new_msg)
	chat_panel.scrollTop(chat_panel[0].scrollHeight)
	$("input[name = 'msg']").val('')
}

const showMsg = msg => {
	if (talk_to === msg.talk_from.name) {
		// talk now
		let new_msg = '<div class="msg-item">' +
				  '<div class="item-time">' +
				  '<p>' + msg.time + '</p>' +
				  '</div>' +
				  '<div class="item-msg">' + 
				  '<div class="item-head" style="background-image: url(' + msg.talk_from.head + ')"></div>' +
				  '<div class="item-msg-spin"></div>' +
				  '<div class="item-msg-contain">' + 
				  '<p>' + msg.msg + '</p>' +
				  '</div>' +
				  '</div>' +
				  '</div>'
		chat_panel.append(new_msg)
		chat_panel.scrollTop(chat_panel[0].scrollHeight);
		return
	}

	remain_msgs.push(msg)
	let remain_msg = '<div class="contain-msg-item" onclick="showRemainMsg(this)">' + 
					 '<div class="msg-item-head" style="background-image: url(' + msg.talk_from.head + ')"></div>' +
					 '<div class="msg-item-name">' + 
					 '<p>' + msg.talk_from.name + '</p>' +
				     '</div>' +
				     '<div class="msg-item-time">' +
					 '<p>' + msg.time.split(' ').pop() + '</p>' +
					 '</div>' +
					 '<div class="msg-item-msg">' +
					 '<p>' + msg.msg + '</p>' +
					 '</div>' +
					 '</div>'
	remain_msg_panel.prepend(remain_msg)
	return
}

const changeTalker = obj => {
	$('.online-item').each((index, item) => {
		$(item).css('background-color', '')
	})
	$(obj).css('background-color', 'rgba(0, 0, 0, 0.3)')
	$('.navigation-self').css('background-color', '')
	$('.navigation-comment').css('background-color', '')
	$('.navigation-chat').css('background-color', 'rgba(0, 0, 0, 0.3)')

	talk_to = $(obj).find('p').html()
	talk_to_text.html(talk_to)
	let msg = {
		type: 'getLog',
		talk_from: user.name,
   		talk_to: talk_to
	}
	ws.send(JSON.stringify(msg))
}

const showRemainMsg = obj => {
	$('.contain-msg-item').each((index, item) => {
		$(item).css('background-color', '')
		$(item).css('border-left', '')
	})
	$(obj).css('background-color', 'rgba(223, 232, 235, 0.9)')
	$(obj).css('border-left', '3px solid rgba(23, 150, 220, 0.7)')

	$('.navigation-self').css('background-color', '')
	$('.navigation-comment').css('background-color', '')
	$('.navigation-chat').css('background-color', 'rgba(0, 0, 0, 0.3)')

	talk_to = $(obj).find('.msg-item-name').find('p').html()

	$('.online-item').each((index, item) => {
		if ($(item).find('p').text() === talk_to) {
			$(item).css('background-color', 'rgba(0, 0, 0, 0.3)')
		}
	})

	talk_to_text.html(talk_to)
	let msg = {
		type: 'getLog',
		talk_from: user.name,
   		talk_to: talk_to
	}
	ws.send(JSON.stringify(msg))
}

const getChatLog = (data, head) => {
	showChat()
	chat_panel.html('')
	for (let item of data) {
		if (item.from === user.name) {
			let new_msg = '<div class="msg-item">' +
				  '<div class="item-time">' +
				  '<p>' + item.mtime + '</p>' +
				  '</div>' +
				  '<div class="item-msg">' + 
				  '<div class="item-head-f" style="background-image: url(' + user.head + ')"></div>' +
				  '<div class="item-msg-spin-f"></div>' +
				  '<div class="item-msg-contain-f">' + 
				  '<p>' + item.msg + '</p>' +
				  '</div>' +
				  '</div>' +
				  '</div>'
		    chat_panel.append(new_msg)
		} else {
			let new_msg = '<div class="msg-item">' +
				  '<div class="item-time">' +
				  '<p>' + item.mtime + '</p>' +
				  '</div>' +
				  '<div class="item-msg">' + 
				  '<div class="item-head" style="background-image: url(' + head + ')"></div>' +
				  '<div class="item-msg-spin"></div>' +
				  '<div class="item-msg-contain">' + 
				  '<p>' + item.msg.toString() + '</p>' +
				  '</div>' +
				  '</div>' +
				  '</div>'
		    chat_panel.append(new_msg)
		}
	}
	chat_panel.scrollTop(chat_panel[0].scrollHeight)
	return
}

const changePanel = obj => {
	$('.navigation-chat').css('background-color', '')
	$('.navigation-self').css('background-color', '')
	$('.navigation-comment').css('background-color', '')
	$(obj).css('background-color', 'rgba(0, 0, 0, 0.3)')
	if (obj.className == 'navigation-chat') {
		showChat()
	} else if (obj.className == 'navigation-self') {
		showInfomation()
	} else {
		showTable()
	}
}

const showChat = () => {
	$('.other-contain-panel').css('display', 'none')
	$('.comment-contain-panel').css('display', 'none')
	$('.profile-contain-panel').css('display', 'none')
	$('.chat-contain-panel').show(1000)
}

const showInfomation = () => {
	$('.other-contain-panel').css('display', 'none')
	$('.comment-contain-panel').css('display', 'none')
	$('.chat-contain-panel').css('display', 'none')
	$('.profile-contain-panel').show(1000)
}

const showTable = () => {
	$('.other-contain-panel').css('display', 'none')
	$('.chat-contain-panel').css('display', 'none')
	$('.profile-contain-panel').css('display', 'none')
	$('.comment-contain-panel').show(1000)
}

const backToDate = () => {
	$('.other-contain-panel').css('display', 'none')
	$('.profile-contain-panel').toggle(500, () => {
		$('.chat-contain-panel').toggle(500)
	})
}

const viewProfile = () => {
	if (talk_to === null) {
		return
	}
	$('.chat-contain-panel').css('display', 'none')

	let formdata = new FormData()
	formdata.append('talk_to', talk_to)
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/getUserInfo'
	xmlhttp.onload = function() {
		if (this.response === 'false') {
			alert('select err :)')
		} else if(this.response === 'err') {
			alert('select err :)')
		} else {
			let info = JSON.parse(this.response)
			$('#name').html(info['uname'])
			$('#sex').html(info['usex'])
			$('#xinzuo').html(info['usinzuo'])
			$('#birth').html(info['ubirth'])
			$('#tel').html(info['utel'])
			$('#location').html(info['ulocation'])
			$('#school').html(info['uschool'])
			$('#nickname').html(info['unickname'])
			$('.other-contain-panel').show(1000)
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return
}

const backToChat = () => {
	$('.other-contain-panel').css('display', 'none')
	$('.chat-contain-panel').show(1000)
}

const submitdata = () => {
	let sex = $('[name = "mysex"] option:selected"').text()
	   ,xinzuo = $('[name = "myxinzuo"] option:selected"').text()
	   ,birth = $('[name = "mybirth"]').val().trim()
	   ,mobile = $('[name = "mymobile"]').val().trim()
	   ,ads = $('[name = "myaddress"]').val().trim()
	   ,school = $('[name = "myschool"]').val().trim()
	   ,nick = $('[name = "mynick"]').val().trim()

	if (mobile.length > 11) {
		alert('The length of mobile overflow')
		return
	}
	if (ads.length > 150) {
		alert('The lenght of Address overflow')
		return
	}
	if (school.length > 150) {
		alert('The lenght of School overflow')
		return
	}

	if (nick.length > 30) {
		alert('The lenght of NickName overflow')
		return
	}

	$('#update-submit').modal('show')
	let formdata = new FormData()
	formdata.append('uname', user.name)
	formdata.append('sex', sex)
	formdata.append('xinzuo', xinzuo)
	formdata.append('birth', birth)
	formdata.append('mobile', mobile)
	formdata.append('ads', ads)
	formdata.append('school', school)
	formdata.append('nick', nick)
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/updateInfo'
	xmlhttp.onload = function() {
		if (this.response === 'false') {
			alert('update err :)')
		} else if(this.response === 'err') {
			alert('update err :)')
		} else if (this.response === 'true') {
			$('#update-submit').modal('hide')
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return false
}

const logout = () => {
	let formdata = new FormData()
	let xmlhttp = new XMLHttpRequest()
	let postUrl = '/logout'
	xmlhttp.onload = function() {
		if(this.response === 'err') {
			alert('err :)')
		} else if (this.response === 'true') {
			window.location.href = '../chat'
		}
	}
	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
}

const showInfos = obj => {
	let msg = null
	if ($(obj).text() == 'ABOUT') {
		msg = '<i class="fa fa-fw fa-copyright"></i> Copyright 2018 darknight.'
	} else {
		msg = '<i class="fa fa-fw fa-envelope-open-o"></i> 49656500@qq.com.'
	}
	$('#author').html(msg)
	$('#app-info').modal('show')
	setTimeout(() => {
		$('#app-info').modal('hide')
	}, 3000)
}

const thumbs_up = () => {
	
}

const submitComment = () => {
	let comment = $('[name="comment"]').val()
	   ,formdata = new FormData()
	   ,xmlhttp = new XMLHttpRequest()
	   ,post_time = getFormDateTime()
	   ,postUrl = '/comment'

	formdata.append('comment', comment)
	formdata.append('name', user.name)
	formdata.append('head_url', user.head)
	formdata.append('time', post_time)
	formdata.append('location', returnCitySN['cname'])

	xmlhttp.onload = function() {
		if(this.response === 'err') {
			alert('err :)')
		} else if (this.response === 'true') {
			alert('提交成功')
			addComments(comment, post_time.split(' ')[0])
		}
	}

	xmlhttp.open('POST', postUrl, true)
	xmlhttp.send(formdata)
	return false
}

const addComments = (comment, time) => {
	let new_comment =  '<div class="comment-item">' +
							'<div class="comment-item-head">' +
								'<div class="comment-item-head-img" style="background-image: url(' + user.head + ')"></div>' +
								'<div class="comment-item-head-name">' +
									'<div class="comment-name"><p>' + user.name + '</p></div>' +
									'<div class="comment-from"><p>' + returnCitySN['cname'] + '</p></div>' +
								'</div>' +
							'</div>' +
							'<div class="comment-contain">' +
								'<p>' + comment + '</p>' +
							'</div>' +
							'<div class="comment-end">' +
								'<div class="like">' +
									'<p><i class="fa fa-fw fa-heart-o" onclick="thumbs_up()"></i> 0 </p>' +
								'</div>' +
								'<div class="time">' +
									'<p><i class="fa fa-fw fa-pencil-square-o"></i>' + time + '</p>' +
								'</div>' +
							'</div>' +
						'</div>'
	comment_panel.prepend(new_comment)
}




