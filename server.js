var express = require('express')
   ,http = require('http')
   ,path = require('path')
   ,session = require('express-session')
   ,cookieParser = require('cookie-parser')
   ,multiparty = require('multiparty')
   ,mysql = require('mysql')
   ,async = require('async')
   ,fs = require('fs')
   ,ccap = require('ccap')()
   ,fetch = require('node-fetch')
   ,ws=require("nodejs-websocket")
   ,app = express()
   ,StringDecoder = require('string_decoder').StringDecoder
   ,decoder = new StringDecoder('utf8')


app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '/public')))
app.use(cookieParser())
app.use(session({
	secret: '12345',
	cookie: {maxAge: 60 * 1000 * 60},
	resave: false,
	saveUninitialized: false
}))

const get = (u,o) => fetch(u,o).then(res => res.json())

var connection = mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'978557',
	database:'blog_management',
	port:3306
})
connection.connect()

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
}

function getVisitNum(url, callback) {
	try {

		let call_sql = 'call add_visit(?)'
		   ,call_param = [url]

		connection.query(call_sql, call_param, (err, result) => {
			if (err) throw new Error('err accur')
			else {
				// 回调
				callback(result[0][0]['p_visit'])
			}
		})

	} catch(err) {
		console.log(err.message)
		return 0
	}
}

app.get('/', (req, res) => {
	res.redirect('/pages')
})

app.get('/code', (req, res) => {
	let ary = ccap.get()
	let txt = ary[0]
	let buf = ary[1]
	req.session.code = txt
	res.end(buf)
})

const renderMain = function(res, pinfos, id, pnum, man, url, next) {
	if (id > pnum) {
		next()
		return
	}
	let prev_page = (id == '1' || !id) ? '/pages' : '/pages/' + (parseInt(id) - 1)
	let next_page = (id == '1' || !id) ? '/pages/2' : '/pages/' + (parseInt(id) + 1)

	prev_page = (id == pnum) ? '/pages/' + (parseInt(pnum) - 1) : prev_page
	next_page = (id == pnum) ? '/pages/' + pnum : next_page
	next_page = (pnum == 0) ? '/pages/' : next_page
	let end_page = (pnum == 0) ? '/pages' : '/pages/' + pnum

	getVisitNum(url, (result) => {
		res.render('main', {
			title: "Darknight's blog",
			datas: pinfos,
			prev_page: prev_page,
			next_page: next_page,
			end_page: end_page,
			end_num: pnum,
			manager: man,
			visit_num: result
		},function(err, stuff) {
			if (!err) {
				res.end(stuff)
			}
		})
	})

}

const renderManage = (res, pinfos, pnum, name, visit) => {
	res.render('manage', {
		title: "Darknight's Manage",
		man_name: name,
		visit_num: visit,
		papers_num: pnum,
		papers: pinfos
	},function(err, stuff) {
		if (!err) {
			res.end(stuff)
		}
	})
}

const renderPaper = (res, pcontain, pinfo, man, url) => {
	getVisitNum(url, (result) => {
		res.render('paper', {
			title: pinfo['p_name'],
			manager: man,
			datetime: transFormDateTime(pinfo['p_date']),
			type: pinfo['p_type'],
			likenum: pinfo['p_likenum'],
			pcontain: pcontain,
			visit_num: result
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
}

const renderAchieves = (res, years, datas, man, url) => {
	getVisitNum(url, (result) => {
		res.render('achieve', {
			title: 'Achieve',
			manager: man,
			visit_num: result,
			years: years,
			datas: datas
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
}

const renderTags = (res, types, man, url) => {
	getVisitNum(url, (result) => {
		res.render('tags', {
			title: 'Tags',
			manager: man,
			visit_num: result,
			types: types
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
}

const renderApp = (res, man, url) => {
	getVisitNum(url, (result) => {
		res.render('application', {
			title: 'Application',
			manager: man,
			visit_num: result
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
}

const renderSearch = (res, datas, man, url, contain) => {
	getVisitNum(url, (result) => {
		res.render('search', {
			title: 'Search',
			manager: man,
			visit_num: result,
			datas: datas,
			search_contain: contain
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
}

const transFormToDate = (datetime) => {
	let dt = new Date(datetime)
	return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate()
}

const getYear = (datetime) => {
	let dt = new Date(datetime)
	return dt.getFullYear()
}

const getDate = (datetime) => {
	let dt = new Date(datetime)
	return (dt.getMonth() + 1) + '-' + dt.getDate()
}

const transFormDateTime = (datetime) => {
	let dt = new Date(datetime)
	return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes()
		+ ':' + dt.getSeconds()
}

app.get('/pages/:id?', (req, res, next) => {
	let manager_contain = (req.session.manager === undefined) ? 'Manage' : req.session.manager.name
	try{
		async.parallel({

			papers_num : callback => {
				let count_sql = 'select count(*) as num from papers'
				connection.query(count_sql, '', (err, result) => {
					callback(err, result)
				})
			},
			p_datas: callback => {
				let select_sql = 'select * from papers order by p_date desc limit ?, 4'
				let select_params = [!req.params.id ? 0 : (req.params.id - 1) * 4]
				connection.query(select_sql, select_params, (err, result) => {
					callback(err, result)
				})
			}

		}, (err, result) => {
			if (err) {
				console.log('查询出错')
				next()
			} else {
				// 根目录提取前4篇
				// 修改日期正确
				// 修改url正确
				let p_num = result.papers_num[0]['num']
				let page_num = Math.ceil(p_num / 4)
				let datas = []
				for (let item of result.p_datas) {
					let date = transFormToDate(item['p_date'])
					datas.push({
						p_name: item['p_name'],
						p_url: item['p_url'],
						p_date: date,
						p_type: item['p_type'],
						p_likenum: item['p_likenum'],
						p_jpg_url: item['p_jpg_url']
					})
				}
				renderMain(res, datas, req.params.id, page_num, manager_contain, req.url, next)
			}
		})
	} catch(err) {
		console.log(err.message)
		res.end('err select')
	}
})

app.get('/achieves', (req, res, next) => {
	let manager_contain = (req.session.manager === undefined) ? 'Manage' : req.session.manager.name
	try{
		
		let select_sql = 'select * from papers order by p_date desc'
		connection.query(select_sql, '', (err, result) => {
			if (err) {
				console.log('err :)')
				next()
			} else {
				let years = new Set()
				   ,datas = []
				for (let item of result) {
					years.add(getYear(item['p_date']))
					datas.push({
						p_name: item['p_name'],
						p_url: item['p_url'],
						p_year: getYear(item['p_date']),
						p_date: getDate(item['p_date'])
					})
				}
				renderAchieves(res, years, datas, manager_contain, req.url)
			}
		})

	} catch(err) {
		console.log(err.message)
		res.end('err select')
	}
})

app.get('/tags', (req, res, next) => {
	let manager_contain = (req.session.manager === undefined) ? 'Manage' : req.session.manager.name
	try{
		
		let select_sql = 'select distinct p_type from papers'
		connection.query(select_sql, '', (err, result) => {
			if (err) {
				console.log('err :)')
				next()
			} else {
				renderTags(res, result, manager_contain, req.url)
			}
		})

	} catch(err) {
		console.log(err.message)
		res.end('err select')
	}
})

app.get('/application/chatpage', (req, res, next) => {
	if (req.session.user == undefined) {
		res.redirect('../application/chat')
		return
	}
	let url = 'http://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
	get(url).then(data => {
		try {

			async.parallel({
				basic_info : callback => {
					let select_sql = 'select * from users where uname = ?'
			   	   	   ,select_params = [req.session.user.name]
			   	   	connection.query(select_sql, select_params, (err, result) => {
			   	   		callback(err, result)
			   	   	})
				},

				detail_info : callback => {
					let select_sql = 'select * from userinfo where uname = ?'
			   	   	   ,select_params = [req.session.user.name]
			   	   	connection.query(select_sql, select_params, (err, result) => {
			   	   		callback(err, result)
			   	   	})
				},

				comments: callback => {
					let select_sql = 'select * from comments order by ctime desc;'
					   ,select_params = []
					connection.query(select_sql, select_params, (err, result) => {
			   	   		callback(err, result)
			   	   	})
				}
			}, (err, result) => {
				if (err) {
					console.log('err :)')
					next()
				}
				let usr = {
					type: 'newusr',
					name: req.session.user.name,
					head: result['basic_info'][0]['uhead_img']
				}
				let com = []
				for (let item of result['comments']) {
					com.push({
						ctime: transFormToDate(item.ctime),
						cname: item.cname,
						clocation: item.clocation,
						cheadurl: item.cheadurl,
						comments: item.comments,
						clikenum: item.clikenum,
					})
				}
				res.render('chatpage', {
					title: 'WeChat',
					bg_url: data.images[0].url,
					user: usr,
					info: result['detail_info'][0],
					comments: com
				}, (err, stuff) => {
					if (!err) {
						res.end(stuff)
					}
				})
			})

		} catch(err) {
			console.log(err.message)
			res.end('err select')
		}
 	})
})

app.post('/userlogin', (req, res) => {
	let form = new multiparty.Form()
	try{
		form.parse(req, (err, fields) => {
			if (err){
				throw new Error('err accur')
			}
			else
				(function(field) {
					let uname = field.name[0]
					   ,upass = field.pass[0]
					   ,code = field.code[0]
					   ,check_sql = 'call check_users(?, ?)'
					   ,check_params = [uname, upass]

					if (code !== req.session.code) {
						res.end('wrong_code')
						return
					}

					connection.query(check_sql, check_params, (err, result) => {
						if (err){
							res.end('err')
							return
						}
						else
							if (result[0][0]['result'] === 1) {
								req.session.user = {
									name: uname,
									pass: upass
								}
								res.end('true')
							} else {
								res.end('false')
							}
					})
				})(fields)
		})
	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})

app.post('/login', (req, res) => {
	let form = new multiparty.Form()
	try{
		form.parse(req, (err, fields) => {
			if (err){
				throw new Error('err accur')
			}
			else
				(function(field) {
					let uname = field.name[0]
					   ,upass = field.pass[0]
					   ,code = field.code[0]
					   ,check_sql = 'call check_man(?, ?)'
					   ,check_params = [uname, upass]

					if (code !== req.session.code) {
						res.end('wrong_code')
						return
					}

					connection.query(check_sql, check_params, (err, result) => {
						if (err){
							res.end('err')
							return
						}
						else
							if (result[0][0]['result'] === 1) {
								req.session.manager = {
									name: uname,
									pass: upass
								}
								res.end('true')
							} else {
								res.end('false')
							}
					})
				})(fields)
		})
	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})

app.post('/thumbs_up', (req, res) => {
	let form = new multiparty.Form()
	try{

		form.parse(req, (err, fields) => {
			if (err){
				throw new Error('err accur')
			}
			else
				(function(field) {
					let pdatetime = field.p_datetime[0]
					   ,update_sql = 'update papers set p_likenum = p_likenum + 1 where p_date = ?'
					   ,update_params = [pdatetime]

					connection.query(update_sql, update_params, (err, result) => {
						if (err){
							res.end('false')
							return
						}
						else
							if (result['affectedRows'] === 1) {
								res.end('true')
							} else{
								res.end('false')
							}
					})

				})(fields)

		})

	} catch(err) {
		console.log(err.message)
		res.end('err')
		return
	}
})

app.get('/application', (req, res) => {
	let manager_contain = (req.session.manager === undefined) ? 'Manage' : req.session.manager.name
	try{
		renderApp(res, manager_contain, req.url)
	} catch(err) {
		console.log(err.message)
		res.end('err select')
	}
})

app.get('/application/visualization', (req, res) => {
	res.render('visualization', {
		title: 'ChinaVis-2017.1',
	}, (err, stuff) => {
		if (!err) {
			res.end(stuff)
		}
	})
})

app.get('/application/chat', (req, res) => {
	if (req.session.user != undefined) {
		res.redirect('../application/chatpage')
	}
	let url = 'http://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
	get(url).then(data => {
		res.render('chat', {
			title: 'WeChat',
			bg_url: data.images[0].url
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
})

app.get('/register', (req, res) => {
	let url = 'http://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
	get(url).then(data => {
		res.render('register', {
			title: 'WeChat',
			bg_url: data.images[0].url
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
})

app.post('/register', (req, res) => {
	let form = new multiparty.Form()
	try{
		form.parse(req, (err, fields, files) => {
			if (err){
				throw new Error('err accur')
			}
			else
				(function(field) {
					let name = field.name[0]
					   ,pass = field.pass[0]
					   ,fileName = files['img'][0]['originalFilename']
					   ,tmpPath = files['img'][0]['path']
					   ,insert_sql = 'call register_user(?, ?, ?);'
					   ,targetPath = `./public/head-protrait/${name}.${fileName.split('.').pop()}`
					   ,savePath = `../head-protrait/${name}.${fileName.split('.').pop()}`
					   ,insert_params = [name, pass, savePath]

					fs.renameSync(tmpPath, targetPath)

					connection.query(insert_sql, insert_params, (err, result) => {
						if (err){
							res.end('err')
							return
						}
						else
							if (result[0][0]['result'] === 1) {
								res.end('ok')
							} else{
								res.end('err')
							}
					})

				})(fields)

		})

	} catch(err) {
		console.log(err.message)
		res.end('err')
		return
	}
})

app.post('/checklogin', (req, res) => {
	res.end((req.session.manager === undefined) ? 'nologin' : 'inlogin')
})

app.post('/logout', (req, res) => {
	if(req.session.manager != undefined || req.session.user != undefined) {
		req.session.manager = undefined
		req.session.user = undefined
		res.end('true')
	} else {
		res.end('err')
	}
})

app.post('/delete_paper', (req, res) => {
	if (req.session.manager === undefined) {
		res.redirect('../')
		return
	}
	let form = new multiparty.Form()
	try{

		form.parse(req, (err, fields) => {
			if (err){
				throw new Error('err accur')
			}
			else
				(function(field) {
					let pname = field.p_name[0]
					   ,pdate = field.p_date[0]
					   ,check_sql = 'delete from papers where p_name = ? and ? = date(p_date)'
					   ,check_params = [pname, pdate]

					connection.query(check_sql, check_params, (err, result) => {
						if (err){
							res.end('false')
							return
						}
						else
							if (result['affectedRows'] === 1) {
								res.end('true')
							} else{
								res.end('err')
							}
					})

				})(fields)

		})

	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})

// 生成新文章
app.post('/new_paper', (req, res) => {
	if (req.session.manager === undefined) {
		res.redirect('../')
		return
	}
	let form = new multiparty.Form()
	try{

		form.parse(req, (err, fields, files) => {
			if (err){
				throw new Error('err accur')
			}
			else
				(function(field, files) {
					let pname = field.p_name[0]
					   ,ptype = field.p_type[0]
					   ,pdate = field.p_date[0]
					   ,ptimg = field.p_timg[0]
					   ,plikenum = field.p_likenum[0]
					   ,purl = field.p_url[0]
					   ,pcontain = field.p_contain[0]
					
					// 未完成内容
					if (pname == '' || ptype == '' || ptimg.split('/').pop() == '' || pcontain == '' || !files['p_img']) {
						res.end('false')
						return
					}

					let select_sql = 'select count(*) as num from contain where p_url = ?'
					let select_params = ['/papers/' + pdate.split(' ')[0] + '/' + pname]

					connection.query(select_sql, select_params, (err, result) => {
						if (err) throw new Error('err accur')
						else {
							if (result[0]['num'] != 0) {
								// 已存在该论文
								res.end('overflow')
								return
							}
							else {
								let fileName = files['p_img'][0]['originalFilename']
								   ,tmpPath = files['p_img'][0]['path']
								   ,targetPath = 'public/imgs/' + fileName

								// 保存文件
								fs.renameSync(tmpPath, targetPath)

								async.parallel({

									re_info : callback => {
										let insert_sql = 'insert into papers values(?, ?, ?, ?, ?, ?)'
										let insert_param = [pname, purl, pdate, ptype, plikenum, ptimg]
										connection.query(insert_sql, insert_param, (err, result) => {
											callback(err, result)
										})
									},

									re_contain : callback => {
										let insert_sql = 'insert into contain values(?, ?)'
										let insert_param = [purl, pcontain]
										connection.query(insert_sql, insert_param, (err, result) => {
											callback(err, result)
										})
									}

								}, (err, result) => {
									if (err) throw new Error('err accur')
									else {
										if(result.re_info['affectedRows'] == 1 && result.re_contain['affectedRows'] == 1) {
											// 插入成功
											res.end('true')
										}
									}	
								})
							}

						}
					})

				})(fields, files)

		})

	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})

app.post('/type_select', (req, res, next) => {
	let form = new multiparty.Form()
	try{

		form.parse(req, (err, fields) => {
			if (err){
				throw new Error('err accur')
			}
			else
				(function(field) {
					let ptype = field.type_select[0]
					   ,select_sql = 'select p_name, p_url, p_date from papers where p_type = ?'
					   ,select_params = [ptype]

					connection.query(select_sql, select_params, (err, result) => {
						if (err){
							res.end('false')
							return
						}
						else {
							let res_html = ''
							for (let item of result) {
								res_html += '<div class="item">'
								res_html +=	'<div class="col-md-4 col-xs-4 col-sm-4 item-date">'
								res_html += '<p><i class="fa fa-fw fa-send"></i><span> </span>' + transFormToDate(item['p_date']) + '</p>'
								res_html += '</div>'
								res_html += '<div class="col-md-8 col-xs-8 col-sm-8 item-title">'
								res_html += '<p><a href="' + item['p_url'] + '">' + item['p_name'] + '</a></p>'
								res_html += '</div>'
								res_html += '</div>'
							}
							res.end(res_html)
						} 
					})

				})(fields)

		})

	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})

app.get('/about', (req, res, next) => {
	let manager_contain = (req.session.manager === undefined) ? 'Manage' : req.session.manager.name
	getVisitNum(req.url, result => {
		res.render('about', {
			title: 'About',
			manager: manager_contain,
			visit_num: result
		}, (err, stuff) => {
			if (!err) {
				res.end(stuff)
			}
		})
	})
})

// get new paper
app.get('/papers/:date?/:title?', (req, res, next) => {
	if (!req.params.date || !req.params.title) {
		next()
		return
	}
	try{

		async.parallel({

			p_contain: callback => {
				let select_sql = 'select p_contain from contain where p_url = ?'
				   ,select_params = [decodeURIComponent(req.url)]

				connection.query(select_sql, select_params, (err, result) => {
					callback(err, result)
				})
			},

			p_info: callback => {
				let select_sql = 'select p_name, p_date, p_type, p_likenum from papers where date(p_date) = ? and p_name = ?'
				   ,select_params = [req.params.date, req.params.title]

				connection.query(select_sql, select_params, (err, result) => {
					callback(err, result)
				})
			}

		}, (err, result) => {
			if (err) {
				console.log('查询出错~')
				throw new Error('err')
			}
			else {
				if (result.p_contain[0] === undefined) {
					next()
					return
				}
				let pcontain = result.p_contain[0]['p_contain']
				   ,pinfo = result.p_info[0]

				let manager_contain = (req.session.manager === undefined) ? 'Manage' : req.session.manager.name
				renderPaper(res, pcontain, pinfo, manager_contain, req.url)
			}
		})

	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})


app.get('/manage', (req, res) => {
	if (req.session.manager === undefined) {
		res.redirect('../')
		return
	}
	try{
		async.parallel({

			papers_num : callback => {
				let count_sql = 'select count(*) as num from papers'
				connection.query(count_sql, '', (err, result) => {
					callback(err, result)
				})
			},
			p_datas: callback => {
				let select_sql = 'select p_name, p_date, p_type, p_likenum from papers order by p_date desc'
				let select_params = [!req.params.id ? 0 : (req.params.id - 1) * 4]
				connection.query(select_sql, select_params, (err, result) => {
					callback(err, result)
				})
			},
			p_visit: callback => {
				let select_sql = 'select p_visit from visit where p_url = ?'
				   ,select_params = ['/pages']
				connection.query(select_sql, select_params, (err, result) => {
					callback(err, result)
				})
			}

		}, (err, result) => {
			if (err) {
				console.log('查询出错')
				throw new Error('err select')
			} else {
				let p_num = result.papers_num[0]['num']
				let datas = []
				for (let item of result.p_datas) {
					let date = transFormToDate(item['p_date'])
					datas.push({
						p_style: (Math.random() < 0.5) ? 'info' : 'default',
						p_name: item['p_name'],
						p_date: date,
						p_type: item['p_type'],
						p_likenum: item['p_likenum'],
					})
				}
				renderManage(res, datas, p_num, req.session.manager.name, result.p_visit[0]['p_visit'])
			}
		})
	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})

app.get('/newpaper', (req, res) => {
	if (req.session.manager === undefined) {
		res.redirect('../')
		return
	}
	res.render('newpaper', {
		title: "Darknight's Newpaper",
		man_name: req.session.manager.name
	},function(err, stuff) {
		if (!err) {
			res.end(stuff)
		}
	})
})

app.post('/imageUpload', (req, res) => {
	if (req.session.manager === undefined) {
		res.redirect('../')
		return
	}
	let form = new multiparty.Form()
	try {
		form.parse(req, (err, fields, files) => {
			if (err) throw new Error('err accur')
			else{
				var fileName = files['editormd-image-file'][0]['originalFilename']
				var tmpPath = files['editormd-image-file'][0]['path']

				var targetPath = 'public/imgs/' + fileName
				
				// 保存文件
				fs.rename(tmpPath, targetPath, (err) => {
					if (err) throw new Error('err accur')
					else {

						console.log('upload img success')
						// 删除缓存文件
						fs.unlink(tmpPath, (err) => {
							res.json({
								url: '../../../imgs/' + fileName,
								success: 1,
								message: 'upload success'
							})
						})

					}
				})
			}
		})
	} catch(err) {
		console.log(err.message)
		res.json({
			url: 'none',
			success: 0,
			message: 'err upload image'
		})
	}
})

app.post('/updateInfo', (req, res) => {
	if (req.session.user === undefined) {
		res.redirect('../application/chat')
		return
	}
	let form = new multiparty.Form()
	try {
		form.parse(req, (err, fields) => {
			if (err) throw new Error('err accur')
			else{
				(function(field) {
					let sex = field.sex[0]
					   ,xinzuo = field.xinzuo[0]
					   ,birth = field.birth[0]
					   ,mobile = field.mobile[0]
					   ,ads = field.ads[0]
					   ,school = field.school[0]
					   ,nick = field.nick[0]
					   ,uname = field.uname[0]

					let update_sql = 'update userinfo set usex = ?, uxinzuo = ?, ubirth = ?, utel = ?, uschool = ?, ulocation = ?, unickname = ? where uname = ?;'
					   ,update_params = [sex, xinzuo, birth, mobile, school, ads, nick, uname]

					connection.query(update_sql, update_params, (err, result) => {
						if (err) {
							res.end('err')
							return
						}
						if (result['affectedRows'] === 1) {
							res.end('true')
						} else{
							res.end('false')
						}

					})

				})(fields)
			}
		})
	} catch(err) {
		console.log(err.message)
		return
	}
})

app.post('/getUserInfo' ,(req, res) => {

	if (req.session.user === undefined) {
		res.redirect('../application/chat')
		return
	}
	let form = new multiparty.Form()
	try {
		form.parse(req, (err, fields) => {
			if (err) throw new Error('err accur')
			else{
				(function(field) {
					let talk_to = field.talk_to[0]
					   ,select_sql = 'select * from userinfo where uname = ?;'
					   ,select_params = [talk_to]

					connection.query(select_sql, select_params, (err, result) => {
						if (err) {
							res.end('err')
							return
						}
						res.json(result[0])
					})

				})(fields)
			}
		})
	} catch(err) {
		console.log(err.message)
		return
	}

})

app.post('/comment', (req, res) => {
	if (req.session.user == undefined) {
		res.redirect('../application/chat')
		return
	}
	let form = new multiparty.Form()
	try {
		form.parse(req, (err, fields) => {
			if (err) throw new Error('err accur')
			else{
				(function(field) {
					let comment = field.comment[0]
					   ,name = field.name[0]
					   ,head_url = field.head_url[0]
					   ,time = field.time[0]
					   ,location = field.location[0]

					   ,insert_sql = 'insert into comments values(?,?,?,?,?,?);'
					   ,insert_params = [time, name, location, head_url, comment, '0']

					connection.query(insert_sql, insert_params, (err, result) => {
						if (err) {
							res.end('err')
							return
						}
						if (result['affectedRows'] === 1) {
							res.end('true')
							return
						}
					})

				})(fields)
			}
		})
	} catch(err) {
		console.log(err.message)
		return
	}
})

app.get('/search', (req, res, next) => {
	let manager_contain = (req.session.manager === undefined) ? 'Manage' : req.session.manager.name
	try {

		if (req.query.contain === undefined) {
			next()
		} else {
			let contain = req.query.contain
			   ,select_sql = 'select p_name, p_url, p_date from papers where p_name regexp ?'
			   ,select_params = [contain]

			connection.query(select_sql, select_params, (err, result) => {
				if (err){
					next()
					return
				}
				else {
					let datas = []
					for (let item of result) {
						datas.push({
							p_name: item['p_name'],
							p_url: item['p_url'],
							p_date: transFormToDate(item['p_date'])
						})
					}
					renderSearch(res, datas, manager_contain, req.url, contain)
				} 
			})

		}

	} catch(err) {
		console.log(err.message)
		res.end('err')
	}
})

app.get('*', (req, res) => {
	res.status(404).end('404 not found')
})

http.createServer(app).listen(8080, function() {
	console.log('server start')
	console.log('listen at 8080')
})



var usr_set = new Set()
   ,clientCount = 0

var chatServer = ws.createServer(conn => {
	clientCount ++;
	conn.on('text', str => {
		let msg = JSON.parse(str)
		if (msg.type === 'newusr') {
			conn.name = msg.name
			usr_set.add(str)
			updateUsrList()
		}

		if (msg.type === 'msg') {
			recordMsg(msg.talk_from, msg.talk_to, msg.msg, msg.time, str)
		}

		if (msg.type === 'getLog') {
			getChatLog(msg.talk_from, msg.talk_to)
		}
	})

	conn.on('close', (code, reason) => {
		usr_set.forEach( (item, index, set) => {
			if (JSON.parse(item).name === conn.name) {
				set.delete(item)
				clientCount --
				updateUsrList()
				return
			}
		})
	})

	conn.on('error', (code, reason) => {
		clientCount --
	})

}).listen(8081, () => {
	console.log('chat server listen at 8081')
})

const updateUsrList = () => {
	broadcast(JSON.stringify({
		type: 'del_online_contain'
	}))
	for (let usr of usr_set) {
		broadcast(usr)
	}
}

const recordMsg = (from, to, msg, time, str) => {
	let insert_sql = 'insert into chatlog values(?, ?, ?, ?)'
	   ,insert_param = [from.name, to, msg, time]

	try {
		connection.query(insert_sql, insert_param, (err, result) => {
			if (err) {
				throw new Error('err')
				return
			}
			if (result['affectedRows'] === 1) {
				broadMsg(str, to)
				return
			}
		})
	} catch(err) {
		console.log(err.message)
		return
	}
}

const broadMsg = (data, to) => {
	chatServer.connections.forEach( conn => {
		if (conn.name === to) {
			conn.sendText(data)
			return
		}
	})
}

const broadcast = data => {
	chatServer.connections.forEach( conn => {
		conn.sendText(data)
	})
}

const getChatLog = (from, to) => {
	let select_sql = 'select * from chatlog where (ufrom = ? and uto = ?) or (ufrom = ? and uto = ?);'
	   ,select_params = [from, to, to, from]

	try {

		async.parallel({
			chatlog: callback => {
				let select_sql = 'select * from chatlog where (ufrom = ? and uto = ?) or (ufrom = ? and uto = ?);'
	   				,select_params = [from, to, to, from]
	   			connection.query(select_sql, select_params, (err, result) => {
	   				callback(err, result)
	   			})
			},
			head_url: callback => {
				let select_sql = 'select uhead_img from users where uname = ?;'
				   ,select_params = [to]
				connection.query(select_sql, select_params, (err, result) => {
	   				callback(err, result)
	   			})
			}
		}, (err, result) => {
			if (err) {
				throw new Error('err')
				return
			}
			let log = {
				type: 'chatlog',
				head_url: result['head_url'][0]['uhead_img'],
				data: []
			}
			for (let item of result['chatlog']) {
				log.data.push({
					from: item['ufrom'],
					to: item['uto'],
					msg: decoder.write(item['msg']),
					mtime: transFormDateTime(item['mtime'])
				})
			}
			broadMsg(JSON.stringify(log), from)
		})

	} catch(err) {
		console.log(err.message)
		return
	}
}



