/**
 * router.js路由模块
 * 职责
 *  处理登陆功能路由
 *  根据不同请求响应url
 */

 //加载文件
 var fs = require('fs')
 //加载express，包装路由
 var express=require('express')
 //加载mysql.js
 var mysql=require('./models/mysql')
 //加载md5插件
 var md5=require('blueimp-md5')
 //创建一个路由容器
 var router=express.Router()


 /*
 *
 //将登陆路由挂载到router容器里
 *
 */


/* 登陆路由*/
//渲染登陆页面
 router.get('/',function(req,res){
     res.render('login.html')
 })

//登录请求
 router.post('/',function(req,res){
     //获取请求体
     var userid=req.body.UserId
     var password=req.body.Password
     console.log(req.body)
     var sql=null
    //匹配登陆账号和密码
    try{
        sql=`SELECT
        studentinfo.UserId,
        studentinfo.Password,
        studentinfo.NickName,
        studentinfo.Icon,
        studentinfo.Class,
        studentinfo.Role
    FROM
        studentinfo
    WHERE
        studentinfo.UserId="`+userid+`" AND
        studentinfo.Password="`+password+`"
        `
        mysql(sql,function(err,data){
         
            if(err){
                
                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            // 如果账号和密码匹配，则 Userinformation 是查询到的用户对象，否则就是 null
            if(!data){
                return res.status(200).json({
                    //提供错误码
                    err_code: 1,
                    message: 'nickname or password is invalid.'
                })
            }
            else{
                req.session.Userinformation = data
                console.log(req.session.Userinformation)
                // 用户存在，登陆成功，通过 Session 记录登陆状态
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
            
        })
    }
    catch(err){
        console.log('err')
        res.status(500).json({
            code:2,
            err: err.message,
            message: ''
        })
    }
 })

 /* index路由*/
router.get('/index',function(req,res){
    //渲染页面
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    }

    var userid= req.session.Userinformation[0].UserId
    try{
        sql=`SELECT
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent
        FROM
        tasktable
        WHERE
        tasktable.Sponsor="`+userid+`"
    `
        mysql(sql,function(err,data){
            if(err){
                
                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            req.session.Taskinformation = data
        })
    }
    catch(err){
        res.status(500).json({
            code:2,
            err: err.message,
            message: ''
        })
    }

    res.render('index.html', {
        Userinformation: req.session.Userinformation,
        Taskinformation:  req.session.Taskinformation
    })
})



// /* 注册路由*/
//  router.get('/register', function (req, res) {
//     res.render('register.html')
// })

// //注册请求
// router.post('/register', async function (req, res) {
//     var register=req.body
    
// })

/*获取所有学生位置信息路由*/
// router.post('/location',function(req,res){
//     var sql=null
//     //获取位置信息
//     try{
//         sql=`
//         SELECT
//     location.Id,
//     location.UserId,
//     location.LastTime,
//     location.Location,
//     location.TaskId
//     FROM
//     location
//         `
//     mysql(sql,function(err,data){
//         if(err){
//             return res.status(500).send('Server error')
//         }
//         if(data){
//             var stulocat=new Array
//             var stulast=new Array
//             var stulocat=new Array

//         }
//     })
//     }
// })

/*获取老师所发布的任务*/
router.get('/Locationtask',function(req,res){
    var sql=null
    var userid= req.session.Userinformation[0].UserId
    try{
        sql=`SELECT
        tasktable.TaskId,
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent,
        tasktable.Sponsor,
        tasktable.TaskState
    FROM
        tasktable
    WHERE
        tasktable.Sponsor="`+userid+`"
    `
        mysql(sql,function(err,data){
            if(err){
                
                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            if(!data){
                return res.status(200).json({
                    //提供错误码
                    err_code: 1,
                    message: 'nickname or password is invalid.'
                })
            }
            else{
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
        })
    }
    catch(err){
        res.status(500).json({
            code:2,
            err: err.message,
            message: ''
        })
    }
})

module.exports=router