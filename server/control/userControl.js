var sqlControl = require('../sql/sqlController')
var superagent = require('superagent')
var global = require('../config/Global')

// json格式化
var jsonWrite = function (res, ret) {
  if (typeof ret === 'undefined') {
	res.json({
	  code: '10000',
	  msg: '操作失败'
	})
  } else {
	res.json(ret)
  }
}

module.exports = {
//  获取用户openid并保存
  getUserOpenid: function (req, res, next) {
	var code = req.body.code;
	console.log(code);
	if (!code) {
	  res.json({head: {code: 10000, msg: '认证码不存在'}, data: {}})
	} else {
	  var URL = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + global.weixin.appId + '&secret=' + global.weixin.secret + '&js_code=' + code + '&grant_type=authorization_code'
	  superagent
		  .get(URL)
		  .end(function (err, response) {
			if (err) {
			  return err;
			}
			var resp = JSON.parse(response.text)
			console.log(resp);
			var openId = resp.openid
			var session_key = resp.session_key
			var arr = [openId, '', '', '', '']
			sqlControl.saveUser(arr, function (result, field) {
			  if (result.insertId) {
				res.json({
				  head: {code: 0, msg: 'ok'},
				  data: {'openid': openId, 'session_key': session_key}
				})
			  } else {
				res.json({
				  head: {code: 10000, msg: '数据已存在'},
				  data: {'openid': openId, 'session_key': session_key}
				})
			  }
			})
		  });
	}
  },
  //  获取用户位置信息并保存
  getUserLocation: function (req, res, next) {
	console.log('body', req.query);
	var param = req.body.location
	var oid = req.body.oid
	if (!param) {
	  res.json({head: {code: 10000, msg: '请输入参数'}, data: {}})
	} else {
	  var URL = 'http://apis.map.qq.com/ws/geocoder/v1/?location=' + param + '&key=' + global.qqMapKey + '&get_poi=1';
	  superagent
		  .get(URL)
		  .end(function (err, response) {
			if (err) {
			  return err;
			}
			var location = response.body.result.address_component
			var city = location.city
			var pid = global.provinceMap[location.province]
			var arr = [pid, city, oid]
			sqlControl.saveUserLocation(arr, function (results, fields) {
			  if (results.affectedRows) {
				res.json({head: {code: 0, msg: 'ok'}, data: {city: city, pid: pid}})
			  } else {
				res.json({head: {code: 10000, msg: '获取位置失败'}, data: {}})
			  }
			})
		  });
	}
  },
  // 更新用户名称头像
  updateUserBaseInfo: function (req, res, next) {
	var param = req.body
	if (!param.openid) {
	  res.json({head: {code: 10000, msg: '数据不存在'}, data: {}})
	} else {
	  var arr = [param.nickName, param.avatarUrl, param.country, param.gender, param.openid]
	  sqlControl.updateUserBase(arr, function (results, fields) {
		if (results.affectedRows) {
		  res.json({head: {code: 0, msg: 'ok'}, data: {}})
		} else {
		  res.json({head: {code: 0, msg: '更新失败'}, data: {}})
		}
	  })
	}
  },
  //  更新用户学校信息
  updateUserUniversity: function (req, res, next) {
	var param = req.body
	console.log(param);
	if (!param) {
	  res.json({head: {code: 10000, msg: '没有选择院校'}, data: {}})
	} else {
	  var arr = [param.university, param.oid]
	  console.log(arr);
	  sqlControl.updateUserUniversityInfo(arr, function (results, fields) {
		if (results.affectedRows) {
		  res.json({head: {code: 0, msg: '更新成功'}, data: {}})
		} else {
		  res.json({head: {code: 1000, msg: '更新失败'}, data: {}})
		}
	  })
	}
  },
//  获取用户基础信息
  getUserBaseInfo: function (req, res, next) {

  },
//  获取学校数据地图
  getMapData: function (req, res, next) {
	var param = req.query.university
	if (!param) {
	  res.json({head: {code: 10000, msg: '请输入学校'}, data: {}})
	} else {
	  var arr = [param]
	  console.log(arr);
	  sqlControl.getMapData(arr, function (results, fields) {
		console.log('university', results);
		res.json({
		  head: {code: 0, msg: 'ok'}, data: {
			university: param,
			list: results
		  }
		})
	  })
	}
  },
//  模糊搜索院校
  getUniversity: function (req, res, next) {
	var param = req.query.wd
	if (!param) {
	  res.json({head: {code: 10000, msg: '请输入有效值'}, data: {}})
	} else {
	  var arr = [param]
	  console.log(arr)
	  sqlControl.getUniversityList(arr, function (results, fields) {
		res.json({head: {code: 0, msg: 'ok'}, data: results})
	  })
	}
  }
}
